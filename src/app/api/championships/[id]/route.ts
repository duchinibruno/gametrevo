import { NextResponse } from 'next/server';
import { getChampionshipById, getRoundsByChampionship } from '@/lib/gameService';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const champ = await getChampionshipById(id);
    if (!champ) return NextResponse.json({ error: 'Campeonato não encontrado' }, { status: 404 });

    const rounds = await getRoundsByChampionship(id);
    return NextResponse.json({ ...champ, rounds });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
