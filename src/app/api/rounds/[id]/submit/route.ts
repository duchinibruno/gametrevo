import { NextResponse } from 'next/server';
import { submitRoundAnswers } from '@/lib/gameService';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, answers, isCompleted } = await req.json();

    if (!userId || !answers) {
      return NextResponse.json({ error: 'Dados incompletos para envio' }, { status: 400 });
    }

    const result = await submitRoundAnswers(id, userId, answers, isCompleted ?? true);
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
