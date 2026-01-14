import { NextRequest, NextResponse } from 'next/server';
import { getTournament, isValidUUID } from '@/lib/kv';

// Forçar renderização dinâmica (não pode ser estática)
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Tournament ID é obrigatório.' },
        { status: 400 }
      );
    }

    // Validar formato UUID
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Tournament ID inválido. Deve ser um UUID válido.' },
        { status: 400 }
      );
    }

    // Buscar torneio
    const data = await getTournament(id);

    if (!data) {
      return NextResponse.json(
        { error: 'Torneio não encontrado.' },
        { status: 404 }
      );
    }

    // Retornar apenas tournament e updatedAt (sem adminTokenHash)
    return NextResponse.json({
      tournament: data.tournament,
      updatedAt: data.updatedAt,
    });
  } catch (error) {
    console.error('Erro ao carregar torneio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
