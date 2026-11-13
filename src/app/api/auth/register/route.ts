import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/gameService';

export async function POST(req: Request) {
  try {
    const { name, email, password, avatarColor } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios.' }, { status: 400 });
    }

    if (password.length < 4) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 4 caracteres.' }, { status: 400 });
    }

    const user = await registerUser({ name, email, password, avatarColor });
    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao cadastrar usuário' }, { status: 400 });
  }
}
