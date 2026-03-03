import { writeFileSync, unlinkSync, mkdirSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { config } from "./config.js";
mkdirSync(config.ipcDir, { recursive: true });
export function writePending(id, data) {
    writeFileSync(join(config.ipcDir, `${id}.json`), JSON.stringify(data));
}
export function removePending(id) {
    try {
        unlinkSync(join(config.ipcDir, `${id}.json`));
    }
    catch { }
}
export function sendWakeEvent(text) {
    const escaped = "'" + text.replace(/'/g, "'\\''") + "'";
    try {
        execSync(`openclaw system event --text ${escaped} --mode now`, {
            timeout: 10_000,
            stdio: "pipe",
        });
    }
    catch { }
}
export function generateId(prefix) {
    const ts = Date.now();
    const rand = Math.random().toString(36).slice(2, 6);
    return `${prefix}-${ts}-${rand}`;
}
