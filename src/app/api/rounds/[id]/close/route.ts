import { NextResponse } from 'next/server';
import { closeRoundAndTally } from '@/lib/gameService';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await closeRoundAndTally(id);
    return NextResponse.json({ success: true, message: 'Rodada encerrada e pontos computados.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
