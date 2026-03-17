import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const { query, response_text } = await request.json();

    if (!query || !response_text) {
      return NextResponse.json({ error: 'Missing query or response_text' }, { status: 400 });
    }

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 512,
      messages: [
        {
          role: 'user',
          content: `Based on this legal Q&A exchange, generate a single multiple-choice comprehension question to help the user digest what they just learned.

User question: ${query}

Assistant response: ${response_text}

Return ONLY valid JSON in exactly this format:
{
  "question": "...",
  "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
  "correctIndex": 0,
  "explanation": "Brief explanation of why the correct answer is right."
}

Rules:
- The question should test understanding of the KEY legal concept in the response
- Make it a genuine comprehension check, not trivial
- correctIndex is 0-3 (index into options array)
- Keep options concise (under 15 words each)
- explanation should be 1-2 sentences`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse quiz JSON' }, { status: 500 });
    }

    const quiz = JSON.parse(jsonMatch[0]);
    return NextResponse.json(quiz);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
