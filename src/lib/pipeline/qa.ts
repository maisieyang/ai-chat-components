import { PineconeStore, SearchResult } from '../vectorstore';
import {
  chatCompletion,
  chatCompletionStream,
  type ChatCompletionChunk,
  resolveProvider,
  type ProviderName,
  type ProviderChatMessage,
} from '../providers/modelProvider';

const DEFAULT_TEMPERATURE = 0.2;

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
  constructor(
    private readonly store: PineconeStore,
    private readonly topK = 5,
    private readonly defaultProvider: ProviderName = resolveProvider()
  ) {}

  async answerQuestion(
    question: string,
    chatHistory?: string,
    providerOverride?: ProviderName | string
  ): Promise<AnswerResponse> {
    const { prompt, references } = await this.prepare(question, chatHistory);
    const provider = resolveProvider(providerOverride ?? this.defaultProvider);

    const { text } = await chatCompletion({
      messages: this.buildMessages(prompt),
      temperature: DEFAULT_TEMPERATURE,
      provider,
    });

    const answer = text || 'I do not have enough information to answer that.';

    return { answer, references };
  }

  async createStreamingCompletion(
    question: string,
    chatHistory?: string,
    providerOverride?: ProviderName | string
  ) {
    const { prompt, references } = await this.prepare(question, chatHistory);
    const provider = resolveProvider(providerOverride ?? this.defaultProvider);

    const { stream } = await chatCompletionStream({
      messages: this.buildMessages(prompt),
      temperature: DEFAULT_TEMPERATURE,
      provider,
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

  private buildMessages(prompt: string): ProviderChatMessage[] {
    return [
      { role: 'system', content: 'You are an expert assistant for banking documentation.' },
      { role: 'user', content: prompt },
    ];
  }
}
