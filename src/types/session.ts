export interface CreateSessionRequest {
  category: string;
  difficulty: string;
  totalQuestions: number;
  language: string;
}

export interface CreateSessionResponse {
  sessionId: string;
}

export interface SendMessageRequest {
  content: string;
  codeContent?: string;
}

export interface SessionMessageDTO {
  id: string;
  role: string;
  content: string;
  codeContent: string | null;
  messageType: string;
  questionIndex: number | null;
  score: number | null;
  criteria: Record<string, number> | null;
  feedback: string | null;
  modelAnswer: string | null;
  createdAt: string;
}

export interface SendMessageResponse {
  messages: SessionMessageDTO[];
  isComplete: boolean;
  finalScore?: number;
}
