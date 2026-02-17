import { withRLS } from "@/lib/middleware/rls-wrapper";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import { NextResponse } from "next/server";

/**
 * POST /api/chatbots/[id]/knowledge/confirm-upload
 * Called after a successful presigned S3 upload to invoke the document-processor Lambda.
 * Constructs a synthetic SQS-wrapped S3 event matching what the Lambda expects.
 */
export const POST = withRLS(
  async (request, session, rlsContext, tx, { params }) => {
    try {
      const { id: chatbotId } = await params;
      const { knowledgeId, s3Key } = await request.json();

      if (!knowledgeId || !s3Key) {
        return NextResponse.json(
          { error: "Missing required fields: knowledgeId, s3Key" },
          { status: 400 },
        );
      }

      // Verify the knowledge record exists and belongs to this chatbot/org
      const knowledge = await tx.chatbotKnowledge.findFirst({
        where: {
          id: knowledgeId,
          chatbotId,
          chatbot: {
            organizationId: session.user.organization.id,
          },
        },
      });

      if (!knowledge) {
        return NextResponse.json(
          { error: "Knowledge item not found or access denied" },
          { status: 404 },
        );
      }

      // Update status to QUEUED
      await tx.chatbotKnowledge.update({
        where: { id: knowledgeId },
        data: { status: "QUEUED", stage: "QUEUED" },
      });

      // Invoke document-processor Lambda
      const lambdaArn = process.env.DOCUMENT_PROCESSOR_LAMBDA_ARN;

      if (!lambdaArn) {
        console.warn(
          "DOCUMENT_PROCESSOR_LAMBDA_ARN not configured - processing will not start",
        );
        return NextResponse.json({
          success: true,
          message: "Upload confirmed but Lambda not configured",
        });
      }

      const bucketName = process.env.AWS_S3_BUCKET_NAME;

      if (!bucketName) {
        console.error("AWS_S3_BUCKET_NAME not configured");
        return NextResponse.json(
          { error: "Server configuration error" },
          { status: 500 },
        );
      }

      // Build synthetic SQS event wrapping an S3 event
      // This matches the format the document-processor Lambda expects:
      //   SQSEvent.Records[].body = JSON.stringify(S3Event)
      const s3Event = {
        Records: [
          {
            eventSource: "aws:s3",
            eventName: "ObjectCreated:Post",
            s3: {
              bucket: { name: bucketName },
              object: { key: s3Key },
            },
          },
        ],
      };

      const sqsEvent = {
        Records: [
          {
            messageId: `confirm-${knowledgeId}`,
            body: JSON.stringify(s3Event),
          },
        ],
      };

      const lambdaClient = new LambdaClient({
        region: process.env.AWS_REGION,
      });

      await lambdaClient.send(
        new InvokeCommand({
          FunctionName: lambdaArn,
          InvocationType: "Event",
          Payload: Buffer.from(JSON.stringify(sqsEvent)),
        }),
      );

      console.log(
        `Document processor Lambda invoked for knowledge ${knowledgeId}`,
      );

      return NextResponse.json({
        success: true,
        message: "Upload confirmed. Document processing started.",
      });
    } catch (error) {
      console.error("Error in confirm-upload:", error);
      return NextResponse.json(
        { error: "Failed to confirm upload" },
        { status: 500 },
      );
    }
  },
  {
    routeName: "POST /api/chatbots/[id]/knowledge/confirm-upload",
  },
);
