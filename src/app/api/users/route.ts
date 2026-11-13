import { NextResponse } from 'next/server';
import { getUsers, createUser } from '@/lib/gameService';

export async function GET() {
  try {
    const users = await getUsers();
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, avatarColor } = body;
    if (!name) return NextResponse.json({ error: 'Nome obrigatório' }, { status: 400 });
    const user = await createUser(name, avatarColor);
    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
