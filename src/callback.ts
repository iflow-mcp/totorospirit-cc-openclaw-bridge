import { createServer, type Server } from "http";
import { config } from "./config.js";
import type { CallbackResponse } from "./types.js";

interface CallbackHandle {
  port: number;
  response: Promise<CallbackResponse>;
  server: Server;
}

export function createCallbackServer(): Promise<CallbackHandle> {
  return new Promise((resolve) => {
    let onResponse: {
      resolve: (v: CallbackResponse) => void;
      reject: (e: Error) => void;
    };

    const response = new Promise<CallbackResponse>((res, rej) => {
      onResponse = { resolve: res, reject: rej };
    });

    const server = createServer((req, res) => {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");

      if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.method === "POST") {
        let body = "";
        req.on("data", (chunk: Buffer) => (body += chunk));
        req.on("end", () => {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ ok: true }));
          server.close();

          try {
            onResponse.resolve(JSON.parse(body));
          } catch {
            onResponse.resolve({ answer: body });
          }
        });
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "waiting_for_answer" }));
    });

    server.listen(0, config.callbackHost, () => {
      const addr = server.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      resolve({ port, response, server });
    });

    setTimeout(() => {
      server.close();
      onResponse.reject(new Error("Timeout waiting for user answer"));
    }, config.answerTimeoutMs);
  });
}
