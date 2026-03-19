export interface Evaluation {
  score: number;
  feedback: string;
  criteria: Record<string, number | string>;
  modelAnswer?: string;
}

export type QuestionCategory = 'technical' | 'coding' | 'system_design' | 'behavioral';
export type Difficulty = 'junior' | 'mid' | 'senior';

export interface Question {
  id: string;
  text: string;
  category: QuestionCategory;
  difficulty: Difficulty;
  hints?: string[];
  modelAnswer?: string;
  codeTemplate?: string;
  codeLanguage?: string;
}

export interface SessionConfig {
  count: number;
  category: QuestionCategory | 'mixed';
  difficulty: Difficulty;
  stack: string[];
  language: 'en' | 'es';
  existingQuestions?: string[];
}

export interface AIProvider {
  generateQuestions(config: SessionConfig): Promise<Question[]>;
  evaluateResponse(question: Question, response: string, code?: string): Promise<Evaluation>;
}
