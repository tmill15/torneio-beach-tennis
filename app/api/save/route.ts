import { NextRequest, NextResponse } from 'next/server';
import { hashToken, saveTournament, isValidUUID, getTournament } from '@/lib/kv';
import { isValidTournamentStructure } from '@/services/backupService';

// Forçar renderização dinâmica (não pode ser estática)
export const dynamic = 'force-dynamic';

const MAX_PAYLOAD_SIZE = 1024 * 1024; // 1MB

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tournamentId, adminToken, data } = body;

    // Validar tournamentId (UUID)
    if (!tournamentId || !isValidUUID(tournamentId)) {
      return NextResponse.json(
        { error: 'Tournament ID inválido. Deve ser um UUID válido.' },
        { status: 400 }
      );
    }

    // Validar adminToken
    if (!adminToken || typeof adminToken !== 'string') {
      return NextResponse.json(
        { error: 'Admin token é obrigatório.' },
        { status: 400 }
      );
    }

    // Validar dados do torneio
    if (!data) {
      return NextResponse.json(
        { error: 'Dados do torneio são obrigatórios.' },
        { status: 400 }
      );
    }

    // Validar tamanho do payload
    const payloadSize = JSON.stringify(body).length;
    if (payloadSize > MAX_PAYLOAD_SIZE) {
      return NextResponse.json(
        { error: 'Payload muito grande. Máximo de 1MB.' },
        { status: 400 }
      );
    }

    // Validar estrutura do torneio
    if (!isValidTournamentStructure(data)) {
      return NextResponse.json(
        { error: 'Estrutura do torneio inválida.' },
        { status: 400 }
      );
    }

    // Hash do adminToken
    const adminTokenHash = await hashToken(adminToken);

    // Verificar se torneio já existe e validar token
    const existingData = await getTournament(tournamentId);
    if (existingData) {
      // Se já existe, verificar se o token corresponde
      if (existingData.adminTokenHash !== adminTokenHash) {
        return NextResponse.json(
          { error: 'Token de autorização inválido.' },
          { status: 401 }
        );
      }
    }

    // Preparar dados para salvar
    const tournamentData = {
      tournament: data,
      adminTokenHash,
      updatedAt: new Date().toISOString(),
    };

    // Salvar no KV com TTL de 10 dias (864.000 segundos)
    console.log(`📤 Tentando salvar torneio ${tournamentId}...`);
    const saved = await saveTournament(tournamentId, tournamentData, 864000);

    if (!saved) {
      console.error(`❌ Falha ao salvar torneio ${tournamentId}`);
      return NextResponse.json(
        { 
          error: 'Erro ao salvar torneio.',
          details: 'Verifique os logs do servidor para mais informações.'
        },
        { status: 500 }
      );
    }

    console.log(`✅ Torneio ${tournamentId} salvo com sucesso`);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Erro ao salvar torneio:', error);
    if (error instanceof Error) {
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
    }
    return NextResponse.json(
      { 
        error: 'Erro interno do servidor.',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
