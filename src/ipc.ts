import { writeFileSync, unlinkSync, mkdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { config } from "./config.js";

mkdirSync(config.ipcDir, { recursive: true });

export function writePending(id: string, data: unknown): void {
  writeFileSync(join(config.ipcDir, `${id}.json`), JSON.stringify(data));
}

export function removePending(id: string): void {
  try {
    unlinkSync(join(config.ipcDir, `${id}.json`));
  } catch {}
}

export function sendWakeEvent(text: string): void {
  const escaped = "'" + text.replace(/'/g, "'\\''") + "'";
  try {
    execSync(`openclaw system event --text ${escaped} --mode now`, {
      timeout: 10_000,
      stdio: "pipe",
    });
  } catch {}
}

export function generateId(prefix: string): string {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 6);
  return `${prefix}-${ts}-${rand}`;
}
