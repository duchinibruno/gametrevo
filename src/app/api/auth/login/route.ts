import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/gameService';

export async function POST(req: Request) {
  try {
    const { email, username, identifier, password } = await req.json();
    const loginIdentifier = identifier || email || username;

    if (!loginIdentifier || !password) {
      return NextResponse.json({ error: 'Usuário/E-mail e senha são obrigatórios.' }, { status: 400 });
    }

    const user = await loginUser(loginIdentifier, password);
    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Erro ao fazer login' }, { status: 401 });
  }
}
