export interface Option {
  label: string;
  description?: string;
}

export interface Question {
  question: string;
  header?: string;
  options?: Option[];
  multiSelect?: boolean;
}

export interface PendingAsk {
  id: string;
  callbackUrl: string;
  questions: Question[];
  context: string;
  project: string;
  workdir: string;
  ccId: string;
  ts: string;
}

export interface PendingNotify {
  id: string;
  type: "notify";
  message: string;
  project: string;
  context: string;
  ts: string;
}

export interface SessionSummary {
  id: string;
  type: "summary";
  project: string;
  context: string;
  workdir: string;
  ccId: string;
  summary: string;
  log: SessionEvent[];
  ts: string;
}

export interface SessionEvent {
  type: "ask" | "notify";
  questions?: Question[];
  message?: string;
  answer?: string;
  ts: string;
}

export interface CallbackResponse {
  answer?: string;
  answers?: { answer: string }[];
}
