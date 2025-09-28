import { NextRequest, NextResponse } from 'next/server';
import { getKnowledgeBase, QAEngine } from '@/lib/pipeline';

const DEFAULT_MAX_PAGES = Number(process.env.CONFLUENCE_MAX_PAGES ?? '1');
const DEFAULT_PAGE_LIMIT = Number(process.env.CONFLUENCE_PAGE_LIMIT ?? '10');

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const question = body?.question?.trim();

    if (!question) {
      return NextResponse.json({ error: 'Question is required.' }, { status: 400 });
    }

    const knowledgeBase = await getKnowledgeBase({
      maxPages: DEFAULT_MAX_PAGES,
      pageLimit: DEFAULT_PAGE_LIMIT,
    });

    const qa = new QAEngine(knowledgeBase.store);
    const result = await qa.answerQuestion(question);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('QA API error', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

