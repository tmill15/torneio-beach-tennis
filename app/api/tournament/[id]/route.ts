import { NextRequest, NextResponse } from 'next/server';
import { hashToken, deleteTournament, getTournament, isValidUUID } from '@/lib/kv';

// Forçar renderização dinâmica (não pode ser estática)
export const dynamic = 'force-dynamic';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Validar formato UUID
    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: 'Tournament ID inválido. Deve ser um UUID válido.' },
        { status: 400 }
      );
    }

    // Obter adminToken do header ou body
    let adminToken: string | null = null;

    // Tentar obter do header Authorization
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      adminToken = authHeader.substring(7);
    } else {
      // Tentar obter do body
      try {
        const body = await req.json();
        adminToken = body.adminToken;
      } catch {
        // Body vazio ou inválido
      }
    }

    if (!adminToken) {
      return NextResponse.json(
        { error: 'Admin token é obrigatório.' },
        { status: 401 }
      );
    }

    // Buscar torneio para validar token
    const existingData = await getTournament(id);

    if (!existingData) {
      return NextResponse.json(
        { error: 'Torneio não encontrado.' },
        { status: 404 }
      );
    }

    // Hash do token e comparar
    const adminTokenHash = await hashToken(adminToken);

    if (existingData.adminTokenHash !== adminTokenHash) {
      return NextResponse.json(
        { error: 'Token de autorização inválido.' },
        { status: 401 }
      );
    }

    // Remover torneio
    const deleted = await deleteTournament(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'Erro ao remover torneio.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao deletar torneio:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
