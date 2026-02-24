import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";

const SUMMARY_MODEL_ID = "anthropic.claude-haiku-4-5-20251001-v1:0";

type TranscriptEntry = {
  role: "user" | "assistant";
  content: string;
};

let bedrockClient: BedrockRuntimeClient | null = null;

function getBedrockClient(): BedrockRuntimeClient {
  if (!bedrockClient) {
    bedrockClient = new BedrockRuntimeClient({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
      requestHandler: {
        requestTimeout: 15_000,
      } as any,
    });
  }
  return bedrockClient;
}

export async function generateCallSummary(
  transcript: TranscriptEntry[],
): Promise<string | null> {
  if (!transcript || transcript.length === 0) return null;

  const transcriptText = transcript
    .map((t) => `${t.role === "user" ? "Caller" : "Assistant"}: ${t.content}`)
    .join("\n");

  if (!transcriptText.trim()) return null;

  const payload = {
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 256,
    messages: [
      {
        role: "user" as const,
        content: `Summarize this phone call in 2-3 sentences. Focus on the caller's intent, key topics discussed, and any outcomes or next steps.\n\nTranscript:\n${transcriptText}`,
      },
    ],
    temperature: 0.2,
  };

  const command = new InvokeModelCommand({
    modelId: SUMMARY_MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body: JSON.stringify(payload),
  });

  const client = getBedrockClient();
  const response = await client.send(command);
  const body = JSON.parse(new TextDecoder().decode(response.body));
  return body.content?.[0]?.text ?? null;
}
