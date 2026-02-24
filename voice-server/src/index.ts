import express from "express";
import { WebSocketServer, type WebSocket } from "ws";
import http from "node:http";
import { URL } from "node:url";
import { createCallSession } from "./callSession.js";
import { createDeepgramSTT } from "./providers/deepgram-stt.js";
import { createElevenLabsTTS } from "./providers/elevenlabs-tts.js";
import { createBedrockLLM } from "./providers/bedrock-llm.js";
import { createRAGProvider } from "./providers/rag.js";
import { buildVoiceSystemPrompt } from "./voicePromptBuilder.js";
import {
  preSynthesizeFillers,
  preSynthesizeAcknowledgments,
} from "./fillerAudio.js";
import { createSpeculativeEngine } from "./speculativeResponse.js";
import { PrismaClient } from "@prisma/client";
import Twilio from "twilio";

const PORT = parseInt(process.env.VOICE_WS_PORT || "8080", 10);

const prisma = new PrismaClient();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

const DEEPGRAM_API_KEY = requireEnv("DEEPGRAM_API_KEY");
const ELEVENLABS_API_KEY = requireEnv("ELEVENLABS_API_KEY");
const AWS_REGION = requireEnv("AWS_REGION");
const AWS_ACCESS_KEY_ID = requireEnv("AWS_ACCESS_KEY_ID");
const AWS_SECRET_ACCESS_KEY = requireEnv("AWS_SECRET_ACCESS_KEY");

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID || "";
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || "";
const twilioClient =
  TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN
    ? Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
    : null;

const ttsProvider = createElevenLabsTTS(ELEVENLABS_API_KEY);
const llmProvider = createBedrockLLM({
  region: AWS_REGION,
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACCESS_KEY,
});

const PINECONE_API_KEY = process.env.PINECONE_API_KEY || "";
const PINECONE_INDEX_NAME =
  process.env.PINECONE_CHATBOT_INDEX_NAME || "leadbotstudio-embeddings";

const ragProvider = PINECONE_API_KEY
  ? createRAGProvider({
      region: AWS_REGION,
      accessKeyId: AWS_ACCESS_KEY_ID,
      secretAccessKey: AWS_SECRET_ACCESS_KEY,
      pineconeApiKey: PINECONE_API_KEY,
      indexName: PINECONE_INDEX_NAME,
    })
  : undefined;

// Track active sessions
const activeSessions = new Map<string, ReturnType<typeof createCallSession>>();

// Express health check
const app = express();

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    activeCalls: activeSessions.size,
    uptime: process.uptime(),
  });
});

const server = http.createServer(app);

// WebSocket server on same HTTP server
const wss = new WebSocketServer({ server, path: "/call" });

wss.on("connection", async (ws: WebSocket, req) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const chatbotId = url.searchParams.get("chatbotId");
  const callSid = url.searchParams.get("callSid");

  if (!chatbotId || !callSid) {
    console.error("[VoiceServer] Missing chatbotId or callSid in URL");
    ws.close(1008, "Missing required parameters");
    return;
  }

  console.log(
    `[VoiceServer] New connection: callSid=${callSid}, chatbotId=${chatbotId}`,
  );

  let streamSid: string | null = null;
  let session: ReturnType<typeof createCallSession> | null = null;

  ws.on("message", async (data) => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.event) {
        case "connected":
          console.log(`[VoiceServer] Connected: callSid=${callSid}`);
          break;

        case "start":
          streamSid = msg.start?.streamSid;
          if (!streamSid) {
            console.error("[VoiceServer] No streamSid in start event");
            return;
          }

          console.log(`[VoiceServer] Stream started: streamSid=${streamSid}`);

          try {
            // Fetch voice config and chatbot data
            const voiceConfig = await prisma.voiceConfig.findUnique({
              where: { chatbotId },
              include: {
                chatbot: {
                  select: {
                    id: true,
                    name: true,
                    persona: true,
                    customInstructions: true,
                    systemPrompt: true,
                    organizationId: true,
                  },
                },
              },
            });

            if (!voiceConfig || !voiceConfig.chatbot) {
              console.error(
                `[VoiceServer] No voice config for chatbot ${chatbotId}`,
              );
              ws.close(1008, "Voice not configured");
              return;
            }

            const chatbot = voiceConfig.chatbot;
            const voicePromptParams = {
              businessName: chatbot.name,
              persona: chatbot.persona,
              customInstructions: chatbot.customInstructions,
              systemPrompt: chatbot.systemPrompt,
            };
            const voiceSystemPrompt = buildVoiceSystemPrompt(voicePromptParams);

            const sttProvider = createDeepgramSTT(DEEPGRAM_API_KEY);

            // Pre-synthesize filler and acknowledgment audio for this voice
            let fillerAudios: string[] = [];
            let acknowledgmentAudios: string[] = [];
            try {
              [fillerAudios, acknowledgmentAudios] = await Promise.all([
                preSynthesizeFillers(ttsProvider, voiceConfig.voiceId),
                preSynthesizeAcknowledgments(ttsProvider, voiceConfig.voiceId),
              ]);
            } catch (err) {
              console.warn(
                "[VoiceServer] Failed to pre-synthesize audio:",
                err,
              );
            }

            session = createCallSession(
              ws,
              {
                callSid,
                streamSid,
                chatbotId,
                organizationId: chatbot.organizationId || "",
                callerNumber: "",
                voiceId: voiceConfig.voiceId,
                greetingMessage: voiceConfig.greetingMessage,
                systemPrompt: voiceSystemPrompt,
                maxCallDurationSeconds: voiceConfig.maxCallDurationSeconds,
                silenceTimeoutSeconds: voiceConfig.silenceTimeoutSeconds,
                voicePromptParams,
              },
              {
                sttProvider,
                ttsProvider,
                llmProvider,
                ragProvider,
                fillerAudios,
                acknowledgmentAudios,
                speculativeEngine: createSpeculativeEngine(llmProvider),
              },
              {
                onCallEnd: async (transcript, durationSeconds) => {
                  console.log(
                    `[VoiceServer] Call ended: callSid=${callSid}, duration=${durationSeconds}s, turns=${transcript.length}`,
                  );

                  try {
                    await prisma.voiceCall.update({
                      where: { twilioCallSid: callSid },
                      data: {
                        status: "COMPLETED",
                        endedAt: new Date(),
                        durationSeconds,
                        transcript: transcript as any,
                      },
                    });
                  } catch (err) {
                    console.error(
                      "[VoiceServer] Failed to update call record:",
                      err,
                    );
                  }

                  activeSessions.delete(callSid);
                },

                onLeadCaptured: async (data) => {
                  console.log(
                    `[VoiceServer] Lead captured: callSid=${callSid}`,
                    data,
                  );

                  try {
                    const lead = await prisma.chatbotLead.create({
                      data: {
                        chatbotId,
                        email: (data.email as string) || "",
                        name: (data.name as string) || "",
                        phone: data.phone as string | undefined,
                        notes: data.notes as string | undefined,
                        source: "VOICE_CALL",
                      },
                    });

                    await prisma.voiceCall.update({
                      where: { twilioCallSid: callSid },
                      data: { leadCaptured: true, leadId: lead.id },
                    });
                  } catch (err) {
                    console.error("[VoiceServer] Failed to save lead:", err);
                  }
                },

                onTransferRequested: async (reason) => {
                  console.log(
                    `[VoiceServer] Transfer requested: callSid=${callSid}, reason=${reason}`,
                  );

                  const transferNumber =
                    voiceConfig.transferEnabled &&
                    voiceConfig.transferPhoneNumber
                      ? voiceConfig.transferPhoneNumber
                      : null;

                  if (!transferNumber) {
                    console.warn(
                      "[VoiceServer] Transfer requested but no transfer number configured",
                    );
                    return;
                  }

                  if (!twilioClient) {
                    console.error(
                      "[VoiceServer] Twilio client not configured for transfer",
                    );
                    return;
                  }

                  try {
                    await twilioClient.calls(callSid).update({
                      twiml: `<Response><Say>Please hold while I transfer you.</Say><Dial>${transferNumber}</Dial></Response>`,
                    });

                    await prisma.voiceCall.update({
                      where: { twilioCallSid: callSid },
                      data: {
                        transferredTo: transferNumber,
                        transferredAt: new Date(),
                      },
                    });

                    console.log(
                      `[VoiceServer] Call transferred: callSid=${callSid}, to=${transferNumber}`,
                    );
                  } catch (err) {
                    console.error(
                      "[VoiceServer] Failed to transfer call:",
                      err,
                    );
                  }
                },

                onError: (err) => {
                  console.error(
                    `[VoiceServer] Session error: callSid=${callSid}`,
                    err,
                  );
                },
              },
            );

            activeSessions.set(callSid, session);
            await session.start();

            // Mark the call as answered now that the AI stream is connected
            prisma.voiceCall
              .update({
                where: { twilioCallSid: callSid },
                data: { answeredAt: new Date() },
              })
              .catch((err: unknown) => {
                console.error("[VoiceServer] Failed to set answeredAt:", err);
              });

            // Start call recording if enabled
            if (voiceConfig.recordingEnabled && twilioClient) {
              const webhookBaseUrl = process.env.WEBHOOK_BASE_URL || "";
              twilioClient
                .calls(callSid)
                .recordings.create({
                  recordingChannels: "dual",
                  recordingStatusCallback: webhookBaseUrl
                    ? `${webhookBaseUrl}/api/webhooks/twilio/recording-status`
                    : undefined,
                  recordingStatusCallbackEvent: ["completed"],
                })
                .then((recording) => {
                  console.log(
                    `[VoiceServer] Recording started: callSid=${callSid}, recordingSid=${recording.sid}`,
                  );
                })
                .catch((err) => {
                  console.error(
                    "[VoiceServer] Failed to start recording:",
                    err,
                  );
                });
            }
          } catch (err) {
            console.error("[VoiceServer] Failed to initialize session:", err);
            ws.close(1011, "Session initialization failed");
          }
          break;

        case "media":
          if (session && msg.media?.payload) {
            session.handleTwilioMedia(msg.media.payload);
          }
          break;

        case "dtmf":
          if (session && msg.dtmf?.digit) {
            session.handleDtmf(msg.dtmf.digit);
          }
          break;

        case "stop":
          console.log(`[VoiceServer] Stream stopped: callSid=${callSid}`);
          if (session) {
            session.destroy();
          }
          break;

        case "mark":
          if (session && msg.mark?.name) {
            session.handleMark(msg.mark.name);
          }
          break;

        default:
          break;
      }
    } catch (err) {
      console.error("[VoiceServer] Message handling error:", err);
    }
  });

  ws.on("close", () => {
    console.log(`[VoiceServer] WebSocket closed: callSid=${callSid}`);
    if (session) {
      session.destroy();
    }
    activeSessions.delete(callSid);
  });

  ws.on("error", (err) => {
    console.error(`[VoiceServer] WebSocket error: callSid=${callSid}`, err);
    if (session) {
      session.destroy();
    }
    activeSessions.delete(callSid);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`[VoiceServer] Running on port ${PORT}`);
  console.log(`[VoiceServer] WebSocket endpoint: ws://localhost:${PORT}/call`);
  console.log(`[VoiceServer] Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[VoiceServer] Shutting down...");

  for (const [callSid, session] of activeSessions) {
    console.log(`[VoiceServer] Destroying session: ${callSid}`);
    session.destroy();
  }

  await prisma.$disconnect();
  server.close();
  process.exit(0);
});
