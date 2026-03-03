import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { config } from "./config.js";
import { createCallbackServer } from "./callback.js";
import { writePending, removePending, sendWakeEvent, generateId } from "./ipc.js";
import { trackAsk, trackNotify, sendExitSummary } from "./summary.js";
import type { PendingAsk, PendingNotify, CallbackResponse } from "./types.js";

// --- Exit handler ---

for (const signal of ["SIGTERM", "SIGINT"] as const) {
  process.on(signal, () => {
    sendExitSummary();
    process.exit(0);
  });
}
process.stdin.on("end", () => {
  sendExitSummary();
  process.exit(0);
});

// --- Schemas ---

const OptionSchema = z.object({
  label: z.string().describe("Option text, 1-5 words"),
  description: z.string().optional().describe("Trade-offs or implications"),
});

const QuestionSchema = z.object({
  question: z.string().describe("Clear question ending with ?"),
  header: z.string().max(12).optional().describe("Short tag: Auth, Framework, etc."),
  options: z.array(OptionSchema).min(2).max(4).optional().describe("2-4 choices. Omit for free-text"),
  multiSelect: z.boolean().optional().describe("Allow picking multiple options"),
});

// --- Tool: ask_user ---

function formatAnswer(response: CallbackResponse, questionCount: number): string {
  if (response.answers && Array.isArray(response.answers)) {
    return response.answers.map((a) => a.answer ?? String(a)).join(", ");
  }
  return String(response.answer ?? JSON.stringify(response));
}

function formatResult(response: CallbackResponse, questions: z.infer<typeof QuestionSchema>[]): string {
  if (response.answers && Array.isArray(response.answers)) {
    return response.answers
      .map((a, i) => `${questions[i]?.header ?? `Q${i + 1}`}: ${a.answer ?? a}`)
      .join("\n");
  }
  return String(response.answer ?? JSON.stringify(response));
}

// --- Server ---

const server = new McpServer({ name: "openclaw-bridge", version: "1.0.0" });

server.tool(
  "ask_user",
  `Ask the user 1-4 questions and wait for replies. Delivered via OpenClaw to their messaging app.

Each question can have a header (short tag), options with descriptions, and multiSelect.
Omit options for free-text. The user always has an implicit "Other" option.`,
  {
    questions: z.array(QuestionSchema).min(1).max(4).describe("1-4 questions"),
    context: z.string().optional().describe("What you're working on"),
  },
  async ({ questions, context }) => {
    const id = generateId("ask");
    const { port, response } = await createCallbackServer();
    const callbackUrl = `http://${config.callbackHost}:${port}`;

    const pending: PendingAsk = {
      id,
      callbackUrl,
      questions,
      context: context ?? config.task,
      project: config.project,
      workdir: config.workdir,
      ccId: config.ccId,
      ts: new Date().toISOString(),
    };

    writePending(id, pending);

    const headers = questions.map((q) => q.header ?? q.question.slice(0, 30));
    sendWakeEvent(`[CC-ASK:${id}] ${config.project}: ${headers.join(", ")}`);

    const result = await response;
    removePending(id);
    trackAsk(questions, formatAnswer(result, questions.length));

    return { content: [{ type: "text" as const, text: formatResult(result, questions) }] };
  },
);

server.tool(
  "notify_user",
  "Send a notification to the user without waiting for a reply.",
  {
    message: z.string().describe("The notification text"),
    context: z.string().optional().describe("What you're working on"),
  },
  async ({ message, context }) => {
    const id = generateId("notify");
    const pending: PendingNotify = {
      id,
      type: "notify",
      message,
      project: config.project,
      context: context ?? config.task,
      ts: new Date().toISOString(),
    };

    writePending(id, pending);
    sendWakeEvent(`[CC-NOTIFY] ${config.project}: ${message}`);
    trackNotify(message);

    return { content: [{ type: "text" as const, text: "Notification sent." }] };
  },
);

// --- Start ---

const transport = new StdioServerTransport();
await server.connect(transport);
