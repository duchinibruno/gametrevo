import { NextResponse } from 'next/server';
import { getChampionships, createChampionship } from '@/lib/gameService';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const list = await getChampionships(userId);
    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, creatorId, totalRounds, dates, participantIds } = body;

    if (!title || !creatorId || !totalRounds || !dates || !participantIds?.length) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 });
    }

    const result = await createChampionship({
      title,
      creatorId,
      totalRounds: Number(totalRounds),
      dates,
      participantIds
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
