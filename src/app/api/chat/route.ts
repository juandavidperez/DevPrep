import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json();
  const ollamaUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

  try {
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Ollama Proxy Error:', error);
    return NextResponse.json({ error: 'Failed to connect to Ollama' }, { status: 500 });
  }
}
