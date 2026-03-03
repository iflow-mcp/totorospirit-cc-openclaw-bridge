import { basename } from "path";
export const config = {
    ipcDir: process.env.OPENCLAW_BRIDGE_IPC_DIR ?? "/tmp/cc-openclaw-bridge",
    answerTimeoutMs: parseInt(process.env.OPENCLAW_BRIDGE_TIMEOUT_MS ?? "300000"),
    callbackHost: process.env.OPENCLAW_BRIDGE_HOST ?? "127.0.0.1",
    project: basename(process.env.CC_WORKDIR ?? process.cwd()),
    workdir: process.env.CC_WORKDIR ?? process.cwd(),
    task: process.env.CC_TASK ?? "",
    ccId: process.env.CC_ID ?? `cc-${process.pid}`,
};
