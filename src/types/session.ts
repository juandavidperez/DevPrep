export interface CreateSessionRequest {
  category: string;
  difficulty: string;
  totalQuestions: number;
  language: string;
  feedbackMode?: string;
  targetStack?: string[];
  outputModality?: string; // Phase 2: "text" | "voice"
}

export interface CreateSessionResponse {
  sessionId: string;
}

export interface SendMessageRequest {
  content: string;
  codeContent?: string;
  isClarification?: boolean;
  // Phase 2: voice input fields (optional — backward compatible)
  inputModality?: 'text' | 'voice';
  transcript?: string;
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
  bookmarkId?: string | null;
}

export interface SendMessageResponse {
  messages: SessionMessageDTO[];
  isComplete: boolean;
  finalScore?: number;
}

export interface QuestionResult {
  questionIndex: number;
  questionText: string;
  candidateAnswer: string;
  candidateCode: string | null;
  score: number | null;
  criteria: Record<string, number> | null;
  feedback: string | null;
  modelAnswer: string | null;
}

export interface CriterionScore {
  criterion: string;
  avgScore: number;
}

export interface ResultsData {
  id: string;
  category: string;
  difficulty: string;
  totalQuestions: number;
  completedAt: string;
  overallScore: number;
  duration: number | null;
  questions: QuestionResult[];
  strengths: CriterionScore[];
  weaknesses: CriterionScore[];
  criteriaAverages: Record<string, number>;
}
