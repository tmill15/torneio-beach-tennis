/**
 * Ranking Service
 * Calcula estatísticas e classifica jogadores dentro de um grupo
 */

import type { 
  Group, 
  Match, 
  Player, 
  RankingEntry, 
  GameConfig,
  SetScore,
  MatchWinner 
} from '@/types';

/**
 * Calcula o ranking completo de um grupo
 * Critérios de desempate:
 * 1. Vitórias (matches ganhos)
 * 2. Saldo de sets
 * 3. Saldo de games
 */
export function calculateRanking(group: Group): RankingEntry[] {
  const rankings: RankingEntry[] = [];

  for (const player of group.players) {
    const stats = getPlayerStats(player, group.matches);
    rankings.push({
      player,
      vitorias: stats.vitorias,
      derrotas: stats.derrotas,
      setsGanhos: stats.setsGanhos,
      setsPerdidos: stats.setsPerdidos,
      saldoSets: stats.setsGanhos - stats.setsPerdidos,
      gamesGanhos: stats.gamesGanhos,
      gamesPerdidos: stats.gamesPerdidos,
      saldoGames: stats.gamesGanhos - stats.gamesPerdidos,
      jogos: stats.jogos,
    });
  }

  // Ordenar por critérios
  rankings.sort(compareRanking);

  return rankings;
}

/**
 * Compara dois jogadores para ordenação
 */
function compareRanking(a: RankingEntry, b: RankingEntry): number {
  // 1. Vitórias (descendente)
  if (a.vitorias !== b.vitorias) {
    return b.vitorias - a.vitorias;
  }

  // 2. Saldo de sets (descendente)
  if (a.saldoSets !== b.saldoSets) {
    return b.saldoSets - a.saldoSets;
  }

  // 3. Saldo de games (descendente)
  if (a.saldoGames !== b.saldoGames) {
    return b.saldoGames - a.saldoGames;
  }

  // 4. Empate técnico
  return 0;
}

/**
 * Calcula estatísticas de um jogador
 */
export function getPlayerStats(player: Player, matches: Match[]) {
  let vitorias = 0;
  let derrotas = 0;
  let setsGanhos = 0;
  let setsPerdidos = 0;
  let gamesGanhos = 0;
  let gamesPerdidos = 0;
  let jogos = 0;

  for (const match of matches) {
    // Verifica se o jogador está nesta partida
    const isPlayerA = match.playerA.id === player.id;
    const isPlayerB = match.playerB.id === player.id;

    if (!isPlayerA && !isPlayerB) continue;
    if (!match.isFinished) continue;

    jogos++;

    // Calcula estatísticas baseado em sets
    if (isPlayerA) {
      setsGanhos += match.setsWonA;
      setsPerdidos += match.setsWonB;

      if (match.setsWonA > match.setsWonB) {
        vitorias++;
      } else {
        derrotas++;
      }
    } else {
      setsGanhos += match.setsWonB;
      setsPerdidos += match.setsWonA;

      if (match.setsWonB > match.setsWonA) {
        vitorias++;
      } else {
        derrotas++;
      }
    }

    // Calcula games
    for (const set of match.sets) {
      if (isPlayerA) {
        gamesGanhos += set.gamesA;
        gamesPerdidos += set.gamesB;
      } else {
        gamesGanhos += set.gamesB;
        gamesPerdidos += set.gamesA;
      }
    }
  }

  return {
    vitorias,
    derrotas,
    setsGanhos,
    setsPerdidos,
    gamesGanhos,
    gamesPerdidos,
    jogos,
  };
}

/**
 * Atualiza o resultado de uma partida
 */
export function updateMatchResult(
  match: Match,
  sets: SetScore[]
): Match {
  // Conta sets ganhos por cada jogador
  let setsA = 0;
  let setsB = 0;

  for (const set of sets) {
    if (set.gamesA > set.gamesB) {
      setsA++;
    } else if (set.gamesB > set.gamesA) {
      setsB++;
    }
  }

  return {
    ...match,
    sets,
    setsWonA: setsA,
    setsWonB: setsB,
    isFinished: false, // Será true quando finalizar oficialmente
  };
}

/**
 * Determina o vencedor de uma partida
 */
export function determineMatchWinner(
  match: Match,
  gameConfig: GameConfig
): MatchWinner {
  if (match.sets.length === 0) return null;

  const setsNeededToWin = Math.ceil(gameConfig.quantidadeSets / 2);

  if (match.setsWonA >= setsNeededToWin) return 'A';
  if (match.setsWonB >= setsNeededToWin) return 'B';

  return null;
}

/**
 * Valida o placar de um set
 */
export function validateSetScore(
  set: SetScore,
  gameConfig: GameConfig,
  isDecisiveSet: boolean
): { isValid: boolean; error?: string } {
  const { gamesA, gamesB } = set;
  const diff = Math.abs(gamesA - gamesB);

  // Set decisivo é tie-break
  if (isDecisiveSet && gameConfig.tieBreakDecisivo) {
    const winner = Math.max(gamesA, gamesB);
    const minPoints = gameConfig.pontosTieBreak;

    if (winner < minPoints) {
      return {
        isValid: false,
        error: `Tie-break precisa ter no mínimo ${minPoints} pontos`,
      };
    }

    if (diff < 2) {
      return {
        isValid: false,
        error: 'Diferença mínima de 2 pontos no tie-break',
      };
    }

    return { isValid: true };
  }

  // Set normal
  const winner = Math.max(gamesA, gamesB);
  const minGames = gameConfig.gamesPerSet;

  if (winner < minGames) {
    return {
      isValid: false,
      error: `Set precisa ter no mínimo ${minGames} games`,
    };
  }

  if (diff < 2) {
    return {
      isValid: false,
      error: 'Diferença mínima de 2 games',
    };
  }

  return { isValid: true };
}

/**
 * Verifica se uma partida pode ser finalizada
 */
export function canFinalizeMatch(
  match: Match,
  gameConfig: GameConfig
): { canFinalize: boolean; errors: string[] } {
  const errors: string[] = [];

  // Precisa ter pelo menos 1 set
  if (match.sets.length === 0) {
    errors.push('É necessário jogar pelo menos 1 set');
    return { canFinalize: false, errors };
  }

  // Valida todos os sets
  for (let i = 0; i < match.sets.length; i++) {
    const isDecisive = i === gameConfig.quantidadeSets - 1;
    const validation = validateSetScore(match.sets[i], gameConfig, isDecisive);
    
    if (!validation.isValid) {
      errors.push(`Set ${i + 1}: ${validation.error}`);
    }
  }

  // Verifica se há vencedor
  const winner = determineMatchWinner(match, gameConfig);
  if (winner === null) {
    errors.push('Nenhum jogador atingiu o número de sets necessário para vencer');
  }

  return {
    canFinalize: errors.length === 0,
    errors,
  };
}
