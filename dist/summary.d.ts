import type { SessionEvent } from "./types.js";
export declare function trackAsk(questions: SessionEvent["questions"], answer: string): void;
export declare function trackNotify(message: string): void;
export declare function sendExitSummary(): void;
