import { PineconeStore, SearchResult } from '../vectorstore';
import {
  chatCompletion,
  chatCompletionStream,
  type ChatCompletionChunk,
  resolveProvider,
  type ProviderName,
  type ProviderChatMessage,
} from '../providers/modelProvider';
import { UNIFIED_SYSTEM_PROMPT } from '../prompts/systemPrompts';

const DEFAULT_TEMPERATURE = 0.4;
const DEFAULT_SIMILARITY_THRESHOLD = Number(process.env.SIMILARITY_THRESHOLD ?? '0.75');

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

export const QA_ASSISTANT_PROMPT = `
## Context Usage Guidelines

### 🧠 Context Usage
- Prefer **context** only when it is strongly relevant (high similarity score).  
- If the context is irrelevant or incomplete, clearly say so and provide a **general helpful answer** instead.  
- Use inline citations (\`[1]\`, \`[2]\`, etc.) **only when references are truly related**.  
- Never invent or force references.

### 🔍 Reference Policy
- Cite only when the reference supports your answer directly.  
- Inline format: \`[1]\`, \`[2]\`.  
- Skip citation section if no relevant context exists.

### ⚙️ Core Behaviors
- Use context **only if relevant**  
- **Never fabricate citations**  
- Keep responses **clear, concise, and human-like**  
- End with a **useful next-step question**
`;


function buildGuidelinePrompt(question: string, context: string, chatHistory?: string): string {
  const historySection = chatHistory?.trim()
    ? `Conversation History (most recent first):\n${chatHistory}\n\n`
    : '';

  const segments = [
    QA_ASSISTANT_PROMPT.trim(),
    historySection ? historySection.trimEnd() : null,
    `Context:\n${context}`,
    `Question: ${question}`,
  ].filter(Boolean);

  return segments.join('\n\n');
}

export class QAEngine {
  constructor(
    private readonly store: PineconeStore,
    private readonly topK = 5,
    private readonly defaultProvider: ProviderName = resolveProvider(),
    private readonly similarityThreshold: number = Number.isFinite(DEFAULT_SIMILARITY_THRESHOLD)
      ? Math.min(Math.max(DEFAULT_SIMILARITY_THRESHOLD, 0), 1)
      : 0.2
  ) {}

  async answerQuestion(
    question: string,
    chatHistory?: string,
    providerOverride?: ProviderName | string
  ): Promise<AnswerResponse> {
    const { messages, references } = await this.prepare(question, chatHistory);
    const provider = resolveProvider(providerOverride ?? this.defaultProvider);

    const { text } = await chatCompletion({
      messages,
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
    const { messages, references } = await this.prepare(question, chatHistory);
    const provider = resolveProvider(providerOverride ?? this.defaultProvider);

    const { stream } = await chatCompletionStream({
      messages,
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
    const relevantResults = results.filter((result) => result.score >= this.similarityThreshold);

    if (relevantResults.length === 0) {
      return {
        messages: this.buildFallbackMessages(question, chatHistory),
        references: [],
      };
    }

    const { context, references } = buildContext(relevantResults);
    const prompt = buildGuidelinePrompt(question, context, chatHistory);

    return {
      messages: this.buildPromptMessages(prompt),
      references,
    };
  }

  private buildPromptMessages(prompt: string): ProviderChatMessage[] {
    return [
      { role: 'system', content: UNIFIED_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ];
  }

  private buildFallbackMessages(question: string, chatHistory?: string): ProviderChatMessage[] {
    const contextNotice = `No relevant Confluence context was retrieved above the similarity threshold (${this.similarityThreshold}). Provide a helpful answer using your general knowledge and explicitly mention that the knowledge base did not contain enough information.`;
    const prompt = buildGuidelinePrompt(question, contextNotice, chatHistory);

    return [
      { role: 'system', content: UNIFIED_SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ];
  }
}
