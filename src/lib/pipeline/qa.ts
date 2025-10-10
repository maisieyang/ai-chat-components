import { PineconeStore, SearchResult } from '../vectorstore';
import {
  chatCompletion,
  chatCompletionStream,
  type ChatCompletionChunk,
  resolveProvider,
  type ProviderName,
  type ProviderChatMessage,
} from '../providers/modelProvider';

const DEFAULT_TEMPERATURE = 0.4;
const DEFAULT_SIMILARITY_THRESHOLD = Number(process.env.SIMILARITY_THRESHOLD ?? '0.75');
const SYSTEM_PROMPT =
  'You are a professional banking documentation assistant integrated with Confluence. Your primary role is to answer user questions using relevant Confluence knowledge base context when available. If the context does not contain enough relevant information, gracefully fall back to your general knowledge.';

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

export const QA_ASSISTANT_PROMPT = `## QA Assistant Guidelines (ChatGPT-5 Style)

You are a **helpful, expert QA assistant** that writes answers in ChatGPT-5 style Markdown.
Your goal is to provide **clear, structured, and human-like explanations** while correctly leveraging provided context.

---

### 🧠 Context Usage
- Prefer **context** only when it is strongly relevant (similarity score above threshold).
- If the provided context is irrelevant, incomplete, or insufficient, **say so clearly**, and instead give a **general and helpful answer**.
- Use inline citations (\`[1]\`, \`[2]\`, etc.) **only when references are semantically related** — never force or fabricate citations.
- If there is **no meaningful reference**, answer without citations.

---

### 🧩 Answer Structure
Your responses must follow ChatGPT-style Markdown formatting for readability and flow:

#### ✅ General Formatting
- Use **headers** (\`##\`, \`###\`) to create logical sections.
- Add **emoji anchors** (👉 ⚠️ ✅ 🧠 📝) for readability.
- Use **callouts** (\`>\`) for notes, insights, or warnings.
- Include **code blocks** and **tables** for technical explanations.
- Separate major sections with horizontal rules (\`---\`).
- Keep paragraphs **short and scannable** (1–3 sentences per paragraph).

#### 🧮 Typical Structure
1. **Concise summary sentence** — direct answer or conclusion.
2. **Explanation block** — clear, progressive reasoning or steps.
3. **Examples / code snippets** — minimal, runnable, or conceptual.
4. **Optional references / related insights** — only if meaningful.

---

### 🎯 Tone and Style
- Be **precise yet approachable**, like explaining to a smart colleague.
- Avoid robotic phrasing or bullet-only answers.
- Encourage learning and clarity over brevity.
- End with a **summary or gentle next-step question**, such as:
  *“Would you like a deeper explanation of this algorithm?”*

---

### 🔍 Reference Policy
- Cite only when the source directly supports your answer.
- Format citations inline like \`[1]\`, \`[2]\`.
- When multiple documents contribute, merge references naturally.
- If no relevant reference exists, skip the citations section entirely.

---

### ⚙️ Summary of Behavior Rules
- **Use context only when relevant**
- **Never fabricate citations**
- **Follow ChatGPT-style Markdown**
- **Be concise but human-like**
- **Encourage clarity and learning**
` as const;

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
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ];
  }

  private buildFallbackMessages(question: string, chatHistory?: string): ProviderChatMessage[] {
    const contextNotice = `No relevant Confluence context was retrieved above the similarity threshold (${this.similarityThreshold}). Provide a helpful answer using your general knowledge and explicitly mention that the knowledge base did not contain enough information.`;
    const prompt = buildGuidelinePrompt(question, contextNotice, chatHistory);

    return [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ];
  }
}
