import { AIOutput, InteractionManager as IManager, OutputModality, UserInput, SessionState } from './types';
import { getAIProvider } from '../ai';
import { Question } from '../ai/types';

export class InteractionManager implements IManager {
  private currentQuestion: Question | null = null;
  private state: SessionState = {
    currentQuestionIndex: 0,
    isComplete: false,
    score: 0,
  };

  async sendInput(input: UserInput): Promise<AIOutput> {
    if (!this.currentQuestion) {
      throw new Error('No active question in session.');
    }

    const ai = getAIProvider(this.currentQuestion.category);
    const evaluation = await ai.evaluateResponse(
      this.currentQuestion,
      input.text,
      input.code,
    );

    this.state.score += evaluation.score;

    return {
      text: evaluation.feedback,
      score: evaluation,
    };
  }

  getSessionState(): SessionState {
    return this.state;
  }

  setCurrentQuestion(question: Question) {
    this.currentQuestion = question;
  }

  switchModality(_modality: OutputModality): void {
    // Phase 2 implementation
  }
}
