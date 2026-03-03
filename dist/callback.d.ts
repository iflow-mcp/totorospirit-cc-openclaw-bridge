import { type Server } from "http";
import type { CallbackResponse } from "./types.js";
interface CallbackHandle {
    port: number;
    response: Promise<CallbackResponse>;
    server: Server;
}
export declare function createCallbackServer(): Promise<CallbackHandle>;
export {};
