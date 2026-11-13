import { NextResponse } from 'next/server';
import { addParticipantToChampionship } from '@/lib/gameService';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'ID do usuário não fornecido.' }, { status: 400 });
    }

    const participant = await addParticipantToChampionship(id, userId);
    return NextResponse.json(participant);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao adicionar participante' }, { status: 500 });
  }
}
