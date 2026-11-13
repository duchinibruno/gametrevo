import { NextResponse } from 'next/server';
import { drawThemeSelector } from '@/lib/gameService';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const selector = await drawThemeSelector(id);
    return NextResponse.json({ selector });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
