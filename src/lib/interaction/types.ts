import { Evaluation } from '../ai/types';

export type InputModality = 'text' | 'voice' | 'code';
export type OutputModality = 'text' | 'voice' | 'avatar';

export interface UserInput {
  modality: InputModality;
  text: string;
  code?: string;
  metadata: {
    questionId: string;
    timeSpent: number;
    language: 'en' | 'es';
  };
}

export interface AIOutput {
  text: string;
  score?: Evaluation;
  audioUrl?: string; // Phase 2
  avatarDirective?: { // Phase 3
    emotion: string;
    gesture: string;
  };
}

export interface SessionState {
  currentQuestionIndex: number;
  isComplete: boolean;
  score: number;
}

export interface InteractionManager {
  sendInput(input: UserInput): Promise<AIOutput>;
  getSessionState(): SessionState;
  switchModality(modality: OutputModality): void;
}
