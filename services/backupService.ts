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
      backup.tournament.grupos.reduce((sum, group) => sum + (group.players?.length || 0), 0);

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

// Versão atual dos dados
const CURRENT_DATA_VERSION = '0.4.0';

/**
 * Cria um torneio vazio
 */
export function createEmptyTournament(): Tournament {
  return {
    version: CURRENT_DATA_VERSION,
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

/**
 * Valida estrutura BÁSICA do torneio (modo compatível)
 * Apenas verifica campos essenciais, aceita variações
 */
export function isValidTournamentStructure(tournament: any): boolean {
  if (!tournament || typeof tournament !== 'object') return false;
  
  // Verifica APENAS estrutura básica essencial
  if (typeof tournament.nome !== 'string') return false;
  if (!Array.isArray(tournament.categorias)) return false;
  if (!tournament.gameConfig || typeof tournament.gameConfig !== 'object') return false;
  if (!Array.isArray(tournament.grupos)) return false;
  if (!Array.isArray(tournament.waitingList)) return false;
  
  // ✅ MODO COMPATÍVEL: Aceita pequenas variações
  // Não valida estrutura interna profunda para evitar perda de dados
  
  return true;
}

/**
 * Valida se o torneio está na estrutura EXATA da v0.4.0
 * Usado apenas para detecção, NÃO para rejeitar dados
 */
export function isExactV040Structure(tournament: any): boolean {
  if (!isValidTournamentStructure(tournament)) return false;
  
  // Verifica se waitingList tem estrutura de jogadores individuais (v0.4.0)
  if (tournament.waitingList.length > 0) {
    const firstItem = tournament.waitingList[0];
    // Se tem jogador1/jogador2, NÃO é v0.4.0
    if (firstItem.jogador1 || firstItem.jogador2) return false;
    // Deve ter nome direto (jogador individual)
    if (!firstItem.nome) return false;
  }
  
  // Verifica grupos
  if (tournament.grupos.length > 0) {
    const firstGroup = tournament.grupos[0];
    // Se tem 'duplas', NÃO é v0.4.0
    if (firstGroup.duplas) return false;
    // Deve ter 'players' (v0.4.0)
    if (!firstGroup.players) return false;
    
    // Verifica matches se existirem
    if (firstGroup.matches && firstGroup.matches.length > 0) {
      const firstMatch = firstGroup.matches[0];
      // Se tem duplaA/duplaB, NÃO é v0.4.0
      if (firstMatch.duplaA || firstMatch.duplaB) return false;
      // Deve ter jogador1A, jogador2A, jogador1B, jogador2B (v0.4.0)
      if (!firstMatch.jogador1A || !firstMatch.jogador2A || 
          !firstMatch.jogador1B || !firstMatch.jogador2B) return false;
    }
  }
  
  return true;
}

/**
 * Detecta se os dados são da v0.3.0 (estrutura de duplas)
 */
export function isV030Structure(tournament: any): boolean {
  if (!tournament || typeof tournament !== 'object') return false;
  
  // Verifica waitingList com duplas
  if (tournament.waitingList && tournament.waitingList.length > 0) {
    const firstItem = tournament.waitingList[0];
    if (firstItem.jogador1 || firstItem.jogador2) return true;
  }
  
  // Verifica grupos com duplas
  if (tournament.grupos && tournament.grupos.length > 0) {
    const firstGroup = tournament.grupos[0];
    if (firstGroup.duplas) return true;
  }
  
  return false;
}

/**
 * Cria backup automático dos dados antes de qualquer migração
 */
export function createAutoBackup(tournament: any): void {
  if (typeof window === 'undefined') return;
  
  try {
    const timestamp = new Date().toISOString();
    const backupKey = `beachtennis-backup-${timestamp}`;
    const backup = {
      version: tournament.version || '0.3.0',
      timestamp,
      data: tournament,
    };
    window.localStorage.setItem(backupKey, JSON.stringify(backup));
    console.log(`💾 Backup automático criado: ${backupKey}`);
    
    // Limita quantidade de backups automáticos (mantém últimos 5)
    cleanOldAutoBackups();
  } catch (error) {
    console.error('Erro ao criar backup automático:', error);
  }
}

/**
 * Lista todos os backups automáticos disponíveis
 */
export function listAutoBackups(): Array<{ key: string; timestamp: string; version: string }> {
  if (typeof window === 'undefined') return [];
  
  const backups: Array<{ key: string; timestamp: string; version: string }> = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('beachtennis-backup-')) {
        const data = localStorage.getItem(key);
        if (data) {
          const backup = JSON.parse(data);
          backups.push({
            key,
            timestamp: backup.timestamp,
            version: backup.version,
          });
        }
      }
    }
  } catch (error) {
    console.error('Erro ao listar backups:', error);
  }
  
  return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * Remove backups automáticos antigos (mantém últimos 5)
 */
function cleanOldAutoBackups(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const backups = listAutoBackups();
    if (backups.length > 5) {
      // Remove backups mais antigos
      const toRemove = backups.slice(5);
      toRemove.forEach(backup => {
        localStorage.removeItem(backup.key);
        console.log(`🗑️  Backup antigo removido: ${backup.key}`);
      });
    }
  } catch (error) {
    console.error('Erro ao limpar backups antigos:', error);
  }
}

/**
 * Migra dados da v0.3.0 (duplas) para v0.4.0 (jogadores individuais)
 * Converte cada dupla em 2 jogadores individuais
 */
export function migrateV030ToV040(oldTournament: any): Tournament {
  const { v4: uuidv4 } = require('uuid');
  
  console.log('🔄 Migrando dados de v0.3.0 para v0.4.0...');
  
  // Cria backup antes de migrar
  createAutoBackup(oldTournament);
  
  const newTournament: Tournament = {
    version: CURRENT_DATA_VERSION,
    nome: oldTournament.nome || 'Novo Torneio',
    categorias: oldTournament.categorias || ['Iniciante', 'Normal'],
    gameConfig: oldTournament.gameConfig || {
      quantidadeSets: 1,
      gamesPerSet: 6,
      tieBreakDecisivo: false,
      pontosTieBreak: 7,
    },
    grupos: [],
    waitingList: [],
  };

  // Migra waitingList: cada dupla vira 2 jogadores
  if (oldTournament.waitingList && Array.isArray(oldTournament.waitingList)) {
    for (const dupla of oldTournament.waitingList) {
      if (dupla.jogador1 && dupla.jogador2) {
        // Jogador 1
        newTournament.waitingList.push({
          id: uuidv4(),
          nome: dupla.jogador1.nome,
          categoria: dupla.categoria,
          isSeed: dupla.isSeed || false,
          status: dupla.status || 'waiting',
        });
        // Jogador 2
        newTournament.waitingList.push({
          id: uuidv4(),
          nome: dupla.jogador2.nome,
          categoria: dupla.categoria,
          isSeed: dupla.isSeed || false,
          status: dupla.status || 'waiting',
        });
      }
    }
  }

  // Migra grupos: cada dupla vira 2 jogadores
  if (oldTournament.grupos && Array.isArray(oldTournament.grupos)) {
    for (const oldGroup of oldTournament.grupos) {
      const newPlayers: any[] = [];
      
      // Converte duplas em jogadores individuais
      if (oldGroup.duplas && Array.isArray(oldGroup.duplas)) {
        for (const dupla of oldGroup.duplas) {
          if (dupla.jogador1 && dupla.jogador2) {
            newPlayers.push({
              id: uuidv4(),
              nome: dupla.jogador1.nome,
              categoria: oldGroup.categoria,
              isSeed: dupla.isSeed || false,
              status: dupla.status || 'enrolled',
            });
            newPlayers.push({
              id: uuidv4(),
              nome: dupla.jogador2.nome,
              categoria: oldGroup.categoria,
              isSeed: dupla.isSeed || false,
              status: dupla.status || 'enrolled',
            });
          }
        }
      }

      // Cria novo grupo (sem matches - serão regerados)
      newTournament.grupos.push({
        id: oldGroup.id || uuidv4(),
        nome: oldGroup.nome || 'A',
        fase: oldGroup.fase || 1,
        categoria: oldGroup.categoria,
        players: newPlayers,
        matches: [], // Matches serão regerados automaticamente
      });
    }
  }

  console.log(`✅ Migração concluída: ${newTournament.waitingList.length} jogadores na lista de espera, ${newTournament.grupos.length} grupos`);
  
  return newTournament;
}
