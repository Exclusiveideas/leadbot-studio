import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { Pinecone } from "@pinecone-database/pinecone";

const TITAN_MODEL_ID = "amazon.titan-embed-text-v2:0";
const TOP_K = 5;

export type RAGProvider = {
  queryContext(query: string, chatbotId: string): Promise<string>;
};

type RAGProviderConfig = {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  pineconeApiKey: string;
  indexName: string;
};

export function createRAGProvider(config: RAGProviderConfig): RAGProvider {
  const bedrockClient = new BedrockRuntimeClient({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
  });

  const pinecone = new Pinecone({ apiKey: config.pineconeApiKey });

  async function generateEmbedding(text: string): Promise<number[]> {
    const command = new InvokeModelCommand({
      modelId: TITAN_MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify({ inputText: text }),
    });

    const response = await bedrockClient.send(command);
    if (!response.body) throw new Error("No response body from Titan");

    const data = JSON.parse(new TextDecoder().decode(response.body));
    if (!data.embedding) throw new Error("No embedding in Titan response");

    return data.embedding as number[];
  }

  function buildContextString(
    matches: Array<{ metadata?: Record<string, unknown>; score?: number }>,
  ): string {
    if (matches.length === 0) return "";

    const parts = matches.map((match, index) => {
      const title = (match.metadata?.title as string) || "Unknown";
      const text = (match.metadata?.text as string) || "";
      const pageNumber = match.metadata?.pageNumber as number | undefined;

      let header = `[Source ${index + 1}: ${title}`;
      if (pageNumber) header += `, Page ${pageNumber}`;
      header += "]";

      return `${header}\n${text}`;
    });

    return parts.join("\n\n");
  }

  async function queryContext(
    query: string,
    chatbotId: string,
  ): Promise<string> {
    try {
      const embedding = await generateEmbedding(query);

      const index = pinecone.index(config.indexName).namespace(chatbotId);
      const searchResponse = await index.query({
        vector: embedding,
        topK: TOP_K,
        includeMetadata: true,
        includeValues: false,
      });

      return buildContextString(searchResponse.matches || []);
    } catch (err) {
      console.error("[RAGProvider] Query failed:", err);
      return "";
    }
  }

  return { queryContext };
}
