import OpenAI from 'openai';
import { FaissVectorStore, SearchResult } from '../vectorstore';

const QA_MODEL = 'gpt-4o-mini';

function createOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required for question answering');
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

interface AnswerReferences {
  index: number;
  title: string;
  url?: string;
}

export interface AnswerResponse {
  answer: string;
  references: AnswerReferences[];
}

function buildContext(results: SearchResult[]): { context: string; references: AnswerReferences[] } {
  const references: AnswerReferences[] = [];
  const sections = results.map((result, idx) => {
    const referenceIndex = idx + 1;
    references.push({
      index: referenceIndex,
      title: result.chunk.title,
      url: result.chunk.sourceUrl,
    });

    return [
      `Reference [${referenceIndex}] — ${result.chunk.title}`,
      result.chunk.sourceUrl ? `Source: ${result.chunk.sourceUrl}` : undefined,
      result.chunk.content,
    ]
      .filter(Boolean)
      .join('\n');
  });

  return {
    context: sections.join('\n\n---\n\n'),
    references,
  };
}

function buildPrompt(question: string, context: string): string {
  return `You are a banking knowledge assistant. Answer the user's question using ONLY the provided context.
- Cite references inline using the format [1], [2], etc.
- If unsure, say you do not know.
- Respond in professional Markdown without adding extra section headers like "Answer" or "References".

Context:
${context}

Question: ${question}`;
}

export class QAEngine {
  constructor(private readonly store: FaissVectorStore, private readonly topK = 5) {}

  async answerQuestion(question: string): Promise<AnswerResponse> {
    if (!question.trim()) {
      throw new Error('Question must not be empty');
    }

    const results = await this.store.search(question, this.topK);
    const { context, references } = buildContext(results);

    const client = createOpenAIClient();
    const prompt = buildPrompt(question, context);

    const completion = await client.chat.completions.create({
      model: QA_MODEL,
      messages: [
        { role: 'system', content: 'You are an expert assistant for banking documentation.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.2,
    });

    const answer = completion.choices[0]?.message?.content?.trim() ?? 'I do not have enough information to answer that.';

    return { answer, references };
  }
}

