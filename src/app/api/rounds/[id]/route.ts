import { NextResponse } from 'next/server';
import { getRoundDetails } from '@/lib/gameService';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;

    const data = await getRoundDetails(id, userId);
    if (!data.round) return NextResponse.json({ error: 'Rodada não encontrada' }, { status: 404 });

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
