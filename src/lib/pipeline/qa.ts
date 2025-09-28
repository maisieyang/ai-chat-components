import OpenAI, { type ChatCompletionChunk } from 'openai';
import { PineconeStore, SearchResult } from '../vectorstore';

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

  if (sections.length === 0) {
    return {
      context: 'No relevant context retrieved from the knowledge base.',
      references,
    };
  }

  return {
    context: sections.join('\n\n---\n\n'),
    references,
  };
}

function buildPrompt(question: string, context: string, chatHistory?: string): string {
  const historySection = chatHistory?.trim()
    ? `Conversation History (most recent first):\n${chatHistory}\n\n`
    : '';

  return `You are a banking knowledge assistant specialising in Confluence documentation. Answer the user's question using ONLY the provided context.
- Cite references inline using the format [1], [2], etc.
- If unsure, explicitly say you do not know.
- Respond in professional Markdown without adding extra section headers like "Answer" or "References".
- Highlight actionable steps when relevant and keep paragraphs concise for scanning.

${historySection}Context:
${context}

Question: ${question}`;
}

export class QAEngine {
  constructor(private readonly store: PineconeStore, private readonly topK = 5) {}

  async answerQuestion(question: string, chatHistory?: string): Promise<AnswerResponse> {
    const { prompt, references } = await this.prepare(question, chatHistory);

    const client = createOpenAIClient();
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

  async createStreamingCompletion(question: string, chatHistory?: string) {
    const { prompt, references } = await this.prepare(question, chatHistory);
    const client = createOpenAIClient();

    const stream = await client.chat.completions.create({
      model: QA_MODEL,
      stream: true,
      temperature: 0.2,
      messages: [
        { role: 'system', content: 'You are an expert assistant for banking documentation.' },
        { role: 'user', content: prompt },
      ],
    });

    return { references, stream } as {
      references: AnswerReferences[];
      stream: AsyncIterable<ChatCompletionChunk>;
    };
  }

  private async prepare(question: string, chatHistory?: string) {
    if (!question.trim()) {
      throw new Error('Question must not be empty');
    }

    const results = await this.store.search(question, this.topK);
    const { context, references } = buildContext(results);
    const prompt = buildPrompt(question, context, chatHistory);

    return { prompt, references };
  }
}
