import OpenAI from 'openai';

const MODEL = 'text-embedding-3-small';

function getClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is required to generate embeddings');
  }

  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const client = getClient();
  const response = await client.embeddings.create({
    model: MODEL,
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}

export async function embedText(text: string): Promise<number[]> {
  const [embedding] = await embedTexts([text]);
  return embedding;
}

