/**
 * Backup Service
 * Export/Import de torneios em formato JSON
 */

import type { Tournament, TournamentBackup } from '@/types';
import { z } from 'zod';

/**
 * Versão atual do formato de backup
 */
const BACKUP_VERSION = '1.0.0';

/**
 * Schema Zod para validação de backup
 */
const tournamentBackupSchema = z.object({
  version: z.string(),
  exportDate: z.string(),
  tournament: z.object({
    nome: z.string(),
    categorias: z.array(z.string()),
    gameConfig: z.object({
      quantidadeSets: z.number(),
      gamesPerSet: z.number(),
      tieBreakDecisivo: z.boolean(),
      pontosTieBreak: z.number(),
    }),
    grupos: z.array(z.any()), // Simplified for now
    waitingList: z.array(z.any()), // Simplified for now
  }),
});

/**
 * Exporta torneio para string JSON
 */
export function exportTournament(tournament: Tournament): string {
  const backup: TournamentBackup = {
    version: BACKUP_VERSION,
    exportDate: new Date().toISOString(),
    tournament,
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Gera e faz download do arquivo de backup
 */
export function downloadBackup(tournament: Tournament): void {
  const json = exportTournament(tournament);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Gera nome do arquivo com timestamp
  const timestamp = new Date()
    .toISOString()
    .replace(/[:.]/g, '-')
    .slice(0, 19);
  const filename = `beachtennis-backup-${timestamp}.json`;

  // Cria link temporário e aciona download
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Importa torneio a partir de string JSON
 */
export function importTournament(jsonData: string): Tournament {
  try {
    const data = JSON.parse(jsonData);
    const backup = tournamentBackupSchema.parse(data);
    
    // Verifica versão
    if (!isVersionCompatible(backup.version)) {
      throw new Error(`Versão do backup (${backup.version}) não é compatível com a versão atual (${BACKUP_VERSION})`);
    }

    return backup.tournament;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('Estrutura do backup inválida: ' + error.message);
    }
    throw error;
  }
}

/**
 * Valida se o JSON é um backup válido
 */
export function validateBackup(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    tournamentBackupSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica compatibilidade de versão
 */
function isVersionCompatible(backupVersion: string): boolean {
  // Por enquanto, aceita apenas versão 1.x.x
  const [major] = backupVersion.split('.');
  const [currentMajor] = BACKUP_VERSION.split('.');
  return major === currentMajor;
}

/**
 * Extrai metadados do backup sem fazer parse completo
 */
export function getBackupMetadata(jsonData: string): {
  version: string;
  exportDate: string;
  tournamentName: string;
  categorias: string[];
  totalGroups: number;
  totalPlayers: number;
} | null {
  try {
    const data = JSON.parse(jsonData);
    const backup = tournamentBackupSchema.parse(data);

    const totalPlayers = 
      backup.tournament.waitingList.length +
      backup.tournament.grupos.reduce((sum, group) => sum + group.players.length, 0);

    return {
      version: backup.version,
      exportDate: backup.exportDate,
      tournamentName: backup.tournament.nome,
      categorias: backup.tournament.categorias,
      totalGroups: backup.tournament.grupos.length,
      totalPlayers,
    };
  } catch {
    return null;
  }
}

/**
 * Cria um torneio vazio
 */
export function createEmptyTournament(): Tournament {
  return {
    nome: 'Novo Torneio',
    categorias: ['Iniciante', 'Normal'],
    gameConfig: {
      quantidadeSets: 1,
      gamesPerSet: 6,
      tieBreakDecisivo: false,
      pontosTieBreak: 7,
    },
    grupos: [],
    waitingList: [],
  };
}
