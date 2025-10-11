import { PineconeStore, SearchResult } from '../vectorstore';
import {
  chatCompletion,
  chatCompletionStream,
  type ChatCompletionChunk,
  resolveProvider,
  type ProviderName,
} from '../providers/modelProvider';
import {
  buildProviderMessages,
  QA_USER_PROMPT_INSTRUCTIONS,
  tracePrompt,
  type PromptTraceMetadata,
} from '../prompts/unifiedPrompt';

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

const FALLBACK_INSTRUCTIONS = `${QA_USER_PROMPT_INSTRUCTIONS}\n- Retrieval context was empty; inform the user before answering from general knowledge.`;

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
    providerOverride?: ProviderName | string,
    trace?: PromptTraceMetadata
  ): Promise<AnswerResponse> {
    const { messages, references } = await this.prepare(question, chatHistory, trace);
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
    providerOverride?: ProviderName | string,
    trace?: PromptTraceMetadata
  ) {
    const { messages, references } = await this.prepare(question, chatHistory, trace);
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

  private async prepare(question: string, chatHistory?: string, trace?: PromptTraceMetadata) {
    if (!question.trim()) {
      throw new Error('Question must not be empty');
    }

    const results = await this.store.search(question, this.topK);
    const relevantResults = results.filter((result) => result.score >= this.similarityThreshold);

    if (relevantResults.length === 0) {
      const { messages } = buildProviderMessages({
        question,
        chatHistory,
        instructions: FALLBACK_INSTRUCTIONS,
        contextSections: [
          {
            title: 'Retrieval Context',
            content: `No relevant Confluence context was retrieved above the similarity threshold (${this.similarityThreshold}).`,
          },
        ],
      });

      tracePrompt(
        {
          label: trace?.label ?? 'qa.prompt.fallback',
          requestId: trace?.requestId,
        },
        messages
      );

      return {
        messages,
        references: [],
      };
    }

    const { context, references } = buildContext(relevantResults);
    const { messages } = buildProviderMessages({
      question,
      chatHistory,
      instructions: QA_USER_PROMPT_INSTRUCTIONS,
      contextSections: [
        { title: 'Retrieval Context', content: context },
      ],
    });

    tracePrompt(
      {
        label: trace?.label ?? 'qa.prompt',
        requestId: trace?.requestId,
      },
      messages
    );

    return {
      messages,
      references,
    };
  }
}
