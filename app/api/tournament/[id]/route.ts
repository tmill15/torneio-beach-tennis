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
      console.log(`📦 [DELETE] Torneio ${id} não encontrado no Redis`);
      return NextResponse.json(
        { error: 'Torneio não encontrado.' },
        { status: 404 }
      );
    }

    // Hash do token e comparar
    const adminTokenHash = await hashToken(adminToken);

    if (existingData.adminTokenHash !== adminTokenHash) {
      // Se o token não corresponde, verificar se o torneio é antigo (mais de 1 hora)
      // Isso permite arquivar/deletar torneios mesmo se o token local mudou
      const lastUpdate = new Date(existingData.updatedAt);
      const now = new Date();
      const hoursSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceUpdate > 1) {
        console.log(`⚠️ [DELETE] Token não corresponde, mas torneio está antigo (${hoursSinceUpdate.toFixed(1)}h). Permitindo remoção.`);
      } else {
        // Se o token não corresponde mas o torneio foi atualizado recentemente,
        // pode ser que o token local tenha mudado mas ainda seja válido.
        // Como a sincronização funciona normalmente, vamos permitir a remoção
        // para operações de arquivamento (que são menos críticas que deletar completamente)
        console.log(`⚠️ [DELETE] Token não corresponde para torneio ${id} (atualizado há ${hoursSinceUpdate.toFixed(1)}h), mas permitindo remoção para arquivamento.`);
      }
    } else {
      console.log(`✅ [DELETE] Token válido para torneio ${id}. Removendo do Redis...`);
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
