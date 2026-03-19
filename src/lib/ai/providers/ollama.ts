import { AIProvider, Evaluation, Question, SessionConfig } from '../types';

export class OllamaProvider implements AIProvider {
  private baseUrl: string;
  private model: string;

  constructor() {
    this.baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.1:8b';
  }

  private async chat(prompt: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        stream: false,
        format: 'json',
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama request failed: ${response.status}`);
    }

    const data = await response.json();
    return data.message.content;
  }

  async generateQuestions(config: SessionConfig): Promise<Question[]> {
    const prompt = `Generate ${config.count} interview questions for a ${config.difficulty} developer.
Category: ${config.category}
Stack: ${config.stack.join(', ')}
Language: ${config.language}

Respond only with a JSON array of questions matching this format:
[{ "id": "string", "text": "string", "category": "string", "difficulty": "string" }]`;

    const content = await this.chat(prompt);
    return JSON.parse(content);
  }

  async evaluateResponse(question: Question, responseText: string, code?: string): Promise<Evaluation> {
    const prompt = `Evaluate the candidate's response to this interview question:
Question: ${question.text}
Candidate Response: ${responseText}
${code ? `Code: ${code}` : ''}

Respond with JSON: { "score": 0-100, "feedback": "string", "criteria": {}, "modelAnswer": "string" }`;

    const content = await this.chat(prompt);
    return JSON.parse(content);
  }
}
