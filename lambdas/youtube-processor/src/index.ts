import type { Handler } from "aws-lambda";
import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";
import {
  fetchYouTubeTranscript,
  YouTubeTranscriptError,
  YOUTUBE_ERROR_CODES,
} from "./youtube-transcript";
import { getKnowledge, updateKnowledge } from "./supabase-client";

const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });

export interface YouTubeProcessorEvent {
  sourceId: string;
  chatbotId: string;
  youtubeUrl: string;
  videoId?: string;
}

interface EmbeddingGeneratorEvent {
  knowledgeId: string;
  chatbotId: string;
  extractedText: string;
}

export const handler: Handler<YouTubeProcessorEvent> = async (event) => {
  console.log(
    "[YouTube Processor] Triggered:",
    JSON.stringify(event, null, 2),
  );

  const { sourceId: knowledgeId, chatbotId, youtubeUrl } = event;

  try {
    const knowledge = await getKnowledge(knowledgeId);

    if (!knowledge) {
      console.error(
        `[YouTube Processor] Knowledge not found: ${knowledgeId}`,
      );
      throw new Error(`Knowledge not found: ${knowledgeId}`);
    }

    await updateKnowledge(knowledgeId, {
      status: "PROCESSING",
      stage: "EXTRACTING_TEXT",
      progress: 10,
      processingStartedAt: new Date().toISOString(),
    });

    console.log(
      `[YouTube Processor] Fetching transcript from YouTube: ${youtubeUrl}`,
    );

    const { fullText, segments } = await fetchYouTubeTranscript(youtubeUrl);

    console.log(
      `[YouTube Processor] Transcript fetched successfully. Segments: ${segments.length}, Length: ${fullText.length} chars`,
    );

    await updateKnowledge(knowledgeId, {
      extractedText: fullText,
      stage: "TEXT_EXTRACTED",
      progress: 30,
    });

    console.log(
      `[YouTube Processor] Invoking embedding generator for ${knowledgeId}`,
    );

    await invokeEmbeddingGenerator({
      knowledgeId,
      chatbotId,
      extractedText: fullText,
    });

    console.log(
      `[YouTube Processor] Successfully processed YouTube video ${knowledgeId}`,
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error(
      `[YouTube Processor] Error processing YouTube video:`,
      errorMessage,
    );

    const shouldRetry =
      error instanceof YouTubeTranscriptError &&
      error.code === YOUTUBE_ERROR_CODES.RATE_LIMITED;

    try {
      const knowledge = await getKnowledge(knowledgeId);
      const canRetry =
        shouldRetry &&
        knowledge &&
        knowledge.retryCount < knowledge.maxRetries;

      await updateKnowledge(knowledgeId, {
        status: canRetry ? "RETRYING" : "FAILED",
        processingError: errorMessage,
        processingCompletedAt: new Date().toISOString(),
        retryCount: knowledge ? knowledge.retryCount + 1 : 1,
      });

      if (canRetry) {
        console.log(
          `[YouTube Processor] Marking for retry (attempt ${knowledge!.retryCount + 1}/${knowledge!.maxRetries})`,
        );
      } else {
        console.log(
          `[YouTube Processor] Marked as FAILED for ${knowledgeId}`,
        );
      }
    } catch (updateError) {
      console.error(
        `[YouTube Processor] Failed to update error state:`,
        updateError,
      );
    }

    throw error;
  }
};

async function invokeEmbeddingGenerator(
  event: EmbeddingGeneratorEvent,
): Promise<void> {
  const lambdaArn = process.env.EMBEDDING_GENERATOR_LAMBDA_ARN;

  if (!lambdaArn) {
    throw new Error("EMBEDDING_GENERATOR_LAMBDA_ARN not set");
  }

  console.log("[YouTube Processor] Invoking embedding generator Lambda");

  const command = new InvokeCommand({
    FunctionName: lambdaArn,
    InvocationType: "Event",
    Payload: Buffer.from(JSON.stringify(event)),
  });

  await lambdaClient.send(command);

  console.log("[YouTube Processor] Embedding generator invoked successfully");
}
