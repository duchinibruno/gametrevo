import { NextResponse } from 'next/server';
import { setThemeAndStartMatch } from '@/lib/gameService';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId, theme } = await req.json();

    if (!userId || !theme) {
      return NextResponse.json({ error: 'Usuário e tema são obrigatórios' }, { status: 400 });
    }

    const questions = await setThemeAndStartMatch(id, userId, theme);
    return NextResponse.json({ success: true, count: questions.length, questions });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
