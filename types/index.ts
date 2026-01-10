/**
 * Types e Interfaces do BeachTennis Manager
 * Versão: 0.1.0
 */

// ============================================
// PLAYER (Jogador/Dupla)
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
// MATCH (Partida)
// ============================================

export interface Match {
  id: string;
  groupId: string;
  playerA: Player;
  playerB: Player;
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
  fase: number;                      // Número da fase (1, 2, 3...)
  categoria: string;
  players: Player[];
  matches: Match[];
}

// ============================================
// TOURNAMENT (Torneio)
// ============================================

export interface Tournament {
  nome: string;
  categorias: string[];
  gameConfig: GameConfig;            // Configurações do jogo
  grupos: Group[];
  waitingList: Player[];
}

// ============================================
// RANKING (Classificação)
// ============================================

export interface RankingEntry {
  player: Player;
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
export const PLAYERS_PER_GROUP = 4;
export const MIN_GAME_DIFFERENCE = 2;
