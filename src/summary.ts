import { config } from "./config.js";
import { writePending, sendWakeEvent, generateId } from "./ipc.js";
import type { SessionEvent, SessionSummary } from "./types.js";

const log: SessionEvent[] = [];

export function trackAsk(
  questions: SessionEvent["questions"],
  answer: string,
): void {
  log.push({ type: "ask", questions, answer, ts: new Date().toISOString() });
}

export function trackNotify(message: string): void {
  log.push({ type: "notify", message, ts: new Date().toISOString() });
}

export function sendExitSummary(): void {
  if (log.length === 0) return;

  const id = generateId("summary");
  const asks = log.filter((e) => e.type === "ask");
  const notifies = log.filter((e) => e.type === "notify");

  const lines = [`🏁 CC finished (${config.project})`];
  if (config.task) lines.push(`📋 Task: ${config.task.slice(0, 100)}`);

  if (asks.length) {
    lines.push(`\n❓ ${asks.length} question(s)`);
    for (const a of asks) {
      const q = a.questions?.[0]?.question ?? "?";
      const short = q.slice(0, 60);
      lines.push(`  → ${short}${a.answer ? ` ✅ ${a.answer.slice(0, 40)}` : ""}`);
    }
  }

  if (notifies.length) {
    lines.push(`\n📋 ${notifies.length} notification(s)`);
    for (const n of notifies) lines.push(`  → ${n.message?.slice(0, 60)}`);
  }

  const summary: SessionSummary = {
    id,
    type: "summary",
    project: config.project,
    context: config.task,
    workdir: config.workdir,
    ccId: config.ccId,
    summary: lines.join("\n"),
    log,
    ts: new Date().toISOString(),
  };

  writePending(id, summary);
  sendWakeEvent(`[CC-DONE:${id}] ${config.project}: finished`);
}
