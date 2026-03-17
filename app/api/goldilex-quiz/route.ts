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
      max_tokens: 1800,
      messages: [
        {
          role: 'user',
          content: `Based on this legal Q&A exchange, generate exactly 5 multiple-choice comprehension questions to help the user digest what they just learned. Each question should test a distinct concept or nuance from the response.

User question: ${query}

Assistant response: ${response_text}

Return ONLY valid JSON in exactly this format:
{
  "questions": [
    {
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctIndex": 0,
      "explanation": "Brief explanation of why the correct answer is right."
    },
    {
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctIndex": 2,
      "explanation": "..."
    },
    {
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctIndex": 1,
      "explanation": "..."
    },
    {
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctIndex": 3,
      "explanation": "..."
    },
    {
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correctIndex": 0,
      "explanation": "..."
    }
  ]
}

Rules:
- Generate EXACTLY 5 questions, each testing a different aspect of the legal content
- Each question must be a genuine comprehension check, not trivial
- correctIndex is 0-3 (index into that question's options array)
- Keep options concise (under 15 words each)
- Each explanation should be 1-2 sentences
- Vary the correct answer positions across questions
- If the response is short, draw on the legal principles implied by the question too`,
        },
      ],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Failed to parse quiz JSON' }, { status: 500 });
    }

    const data = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(data.questions) || data.questions.length === 0) {
      return NextResponse.json({ error: 'Invalid quiz structure' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
