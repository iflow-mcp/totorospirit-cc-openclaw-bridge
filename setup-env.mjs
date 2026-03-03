#!/usr/bin/env node
/**
 * Auto-configure OpenClaw env vars in ~/.claude.json
 * Run inside your OpenClaw container where env vars are available.
 */
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const claudeJson = join(process.env.HOME, ".claude.json");

try {
  const config = JSON.parse(readFileSync(claudeJson, "utf-8"));
  
  if (!config.mcpServers?.["openclaw-bridge"]) {
    console.error("❌ openclaw-bridge MCP not found in ~/.claude.json");
    console.error("   Run: claude mcp add --scope user openclaw-bridge -- node /path/to/dist/server.js");
    process.exit(1);
  }

  const env = {
    PATH: process.env.PATH || "/usr/local/bin:/usr/bin:/bin",
    HOME: process.env.HOME,
    ...(process.env.OPENCLAW_GATEWAY_TOKEN && { OPENCLAW_GATEWAY_TOKEN: process.env.OPENCLAW_GATEWAY_TOKEN }),
    ...(process.env.OPENCLAW_GATEWAY_PORT && { OPENCLAW_GATEWAY_PORT: process.env.OPENCLAW_GATEWAY_PORT }),
    ...(process.env.OPENCLAW_STATE_DIR && { OPENCLAW_STATE_DIR: process.env.OPENCLAW_STATE_DIR }),
  };

  config.mcpServers["openclaw-bridge"].env = env;
  writeFileSync(claudeJson, JSON.stringify(config, null, 2));
  
  console.log("✅ Environment configured in ~/.claude.json");
  console.log("   Variables set:", Object.keys(env).join(", "));
} catch (e) {
  console.error("❌ Error:", e.message);
  process.exit(1);
}
