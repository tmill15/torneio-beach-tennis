/**
 * Types e Interfaces do BeachTennis Manager
 * Versão: 0.4.0
 */

// ============================================
// PLAYER (Jogador Individual)
// ============================================

export type PlayerStatus = 'waiting' | 'enrolled' | 'eliminated';

export interface Player {
  id: string;
  nome: string;
  categoria: string;
  isSeed: boolean;
  status: PlayerStatus;
}

// ============================================
// GAME CONFIG (Configurações do Jogo)
// ============================================

export interface GameConfig {
  quantidadeSets: number;           // Ex: 1, 3, 5 (melhor de X)
  gamesPerSet: number;              // Ex: 6 (primeiro a 6 games)
  tieBreakDecisivo: boolean;        // Set decisivo é tie-break?
  pontosTieBreak: number;           // Ex: 7, 9, 10 (pontos do tie-break)
}

// ============================================
// SET SCORE (Placar de um Set)
// ============================================

export interface SetScore {
  gamesA: number;                   // Games ganhos pela dupla A
  gamesB: number;                   // Games ganhos pela dupla B
  tieBreakA?: number;               // Pontos no tie-break (se aplicável)
  tieBreakB?: number;               // Pontos no tie-break (se aplicável)
}

// ============================================
// MATCH (Partida de Duplas - 4 jogadores)
// ============================================

export interface Match {
  id: string;
  groupId: string;
  // Dupla A (2 jogadores)
  jogador1A: Player;
  jogador2A: Player;
  // Dupla B (2 jogadores)
  jogador1B: Player;
  jogador2B: Player;
  sets: SetScore[];                  // Array de sets jogados
  setsWonA: number;                  // Sets ganhos por A
  setsWonB: number;                  // Sets ganhos por B
  isFinished: boolean;
  rodada: number;                    // Número da rodada (1, 2, 3...)
}

// ============================================
// GROUP (Grupo de Jogadores)
// ============================================

export interface Group {
  id: string;
  nome: string;                      // Nome do grupo (A, B, C...)
  fase: number;                      // Número da fase (1, 2, 3...)
  categoria: string;
  players: Player[];                 // 4 jogadores individuais
  matches: Match[];
}

// ============================================
// TOURNAMENT (Torneio)
// ============================================

export interface Tournament {
  version?: string;                  // Versão dos dados (para migrações seguras)
  nome: string;
  categorias: string[];
  gameConfig: GameConfig;            // Configurações do jogo
  grupos: Group[];
  waitingList: Player[];             // Lista de espera de jogadores individuais
}

// ============================================
// RANKING (Classificação Individual)
// ============================================

export interface RankingEntry {
  player: Player;                    // Jogador individual
  vitorias: number;                  // Vitórias (matches ganhos)
  derrotas: number;                  // Derrotas (matches perdidos)
  setsGanhos: number;                // Total de sets ganhos
  setsPerdidos: number;              // Total de sets perdidos
  saldoSets: number;                 // Saldo de sets
  gamesGanhos: number;               // Total de games ganhos
  gamesPerdidos: number;             // Total de games perdidos
  saldoGames: number;                // Saldo de games
  jogos: number;                     // Total de partidas
}

// ============================================
// BACKUP (Export/Import)
// ============================================

export interface TournamentBackup {
  version: string;                   // Versão do backup (SemVer)
  exportDate: string;                // Data da exportação (ISO 8601)
  tournament: Tournament;            // Dados completos do torneio
}

// ============================================
// VALIDATION (Validação de Placares)
// ============================================

export interface SetValidation {
  isValid: boolean;
  error?: string;
}

export interface MatchValidation {
  isValid: boolean;
  errors: string[];
  canFinalize: boolean;
}

// ============================================
// UTILITY TYPES
// ============================================

export type MatchWinner = 'A' | 'B' | null;

export type SortCriteria = 'vitorias' | 'saldoSets' | 'saldoGames';

// ============================================
// CONSTANTS
// ============================================

export const DEFAULT_GAME_CONFIG: GameConfig = {
  quantidadeSets: 1,              // Melhor de 1 (jogo único)
  gamesPerSet: 6,                 // Primeiro a 6 games
  tieBreakDecisivo: false,        // Set normal
  pontosTieBreak: 7               // Tie-break de 7 pontos
};

export const MIN_GAMES_PER_SET = 4;
export const MAX_GAMES_PER_SET = 10;
export const MIN_TIE_BREAK_POINTS = 7;
export const PLAYERS_PER_GROUP = 4;         // 4 jogadores por grupo
export const MIN_GAME_DIFFERENCE = 2;

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Gera nome do grupo baseado no índice (A, B, C...)
 */
export function getGroupName(index: number): string {
  return String.fromCharCode(65 + index); // 65 = 'A' em ASCII
}

/**
 * Formata nomes de dupla para exibição
 */
export function formatDupla(jogador1: Player, jogador2: Player): string {
  if (!jogador1 || !jogador2) {
    return 'Dupla incompleta';
  }
  return `${jogador1.nome} / ${jogador2.nome}`;
}
