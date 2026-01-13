/**
 * Ranking Service
 * Calcula estatísticas e classifica jogadores individuais dentro de um grupo
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

  // 4. Desempate manual (se definido)
  const tieA = a.player.tiebreakOrder || 999;
  const tieB = b.player.tiebreakOrder || 999;
  if (tieA !== tieB) {
    return tieA - tieB;
  }

  // 5. Empate técnico
  return 0;
}

/**
 * Calcula estatísticas de um jogador individual
 * O jogador acumula estatísticas de todos os jogos que participou
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
    if (!match.isFinished) continue;
    
    // IMPORTANTE: Ignorar partidas de desempate no cálculo do ranking
    // Partidas de desempate servem APENAS para resolver empates, não para afetar estatísticas
    if (match.isTiebreaker) continue;
    
    // Verificar se é partida de simples (jogadores duplicados)
    const isSingles = match.jogador1A.id === match.jogador2A.id && match.jogador1B.id === match.jogador2B.id;
    
    // Verifica se jogador está na dupla A
    const isInDuplaA = 
      match.jogador1A.id === player.id || 
      match.jogador2A.id === player.id;
    
    // Verifica se jogador está na dupla B
    const isInDuplaB = 
      match.jogador1B.id === player.id || 
      match.jogador2B.id === player.id;
    
    if (!isInDuplaA && !isInDuplaB) continue;
    
    // Em partidas de simples, evitar contagem duplicada
    // Se o jogador está em ambas as duplas (simples), processar apenas uma vez
    if (isSingles && isInDuplaA && isInDuplaB) {
      // Processar como se estivesse apenas na dupla A
      // (a lógica abaixo já trata corretamente)
    }
    
    jogos++;
    
    if (isInDuplaA) {
      // Jogador estava na dupla A
      setsGanhos += match.setsWonA;
      setsPerdidos += match.setsWonB;
      
      if (match.setsWonA > match.setsWonB) {
        vitorias++;
      } else {
        derrotas++;
      }
      
      // Calcular games
      for (const set of match.sets) {
        gamesGanhos += set.gamesA;
        gamesPerdidos += set.gamesB;
      }
    } else {
      // Jogador estava na dupla B
      setsGanhos += match.setsWonB;
      setsPerdidos += match.setsWonA;
      
      if (match.setsWonB > match.setsWonA) {
        vitorias++;
      } else {
        derrotas++;
      }
      
      // Calcular games
      for (const set of match.sets) {
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
  // Conta sets ganhos por cada dupla
  let setsA = 0;
  let setsB = 0;

  for (const set of sets) {
    // Se tem tie-break, o vencedor é determinado pelo tie-break
    if (set.tieBreakA !== undefined && set.tieBreakB !== undefined) {
      if (set.tieBreakA > set.tieBreakB) {
        setsA++;
      } else if (set.tieBreakB > set.tieBreakA) {
        setsB++;
      }
    } else {
      // Sem tie-break, vencedor é determinado pelos games
      if (set.gamesA > set.gamesB) {
        setsA++;
      } else if (set.gamesB > set.gamesA) {
        setsB++;
      }
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
  
  // Verificar se chegou ao empate (6-6 ou 4-4) e tem tie-break
  const isTied = gamesA === gamesB && gamesA === minGames;
  const hasTieBreak = set.tieBreakA !== undefined && set.tieBreakB !== undefined;

  if (isTied && hasTieBreak) {
    // Validar tie-break: diferença mínima de 2 pontos
    const tieBreakDiff = Math.abs(set.tieBreakA! - set.tieBreakB!);
    const tieBreakWinner = Math.max(set.tieBreakA!, set.tieBreakB!);
    
    if (tieBreakWinner < 7) {
      return {
        isValid: false,
        error: 'Tie-break precisa ter no mínimo 7 pontos',
      };
    }
    
    if (tieBreakDiff < 2) {
      return {
        isValid: false,
        error: 'Diferença mínima de 2 pontos no tie-break',
      };
    }
    
    return { isValid: true };
  }

  // Se não tem tie-break, validar diferença mínima de 2 games
  if (winner < minGames) {
    return {
      isValid: false,
      error: `Set precisa ter no mínimo ${minGames} games`,
    };
  }

  // Se chegou ao empate mas não tem tie-break, não é válido
  if (isTied && !hasTieBreak) {
    return {
      isValid: false,
      error: `Empate em ${minGames}-${minGames}: é necessário tie-break`,
    };
  }

  // Se não é empate, validar diferença mínima de 2 games
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
    errors.push('Nenhuma dupla atingiu o número de sets necessário para vencer');
  }

  return {
    canFinalize: errors.length === 0,
    errors,
  };
}

/**
 * Interface para grupo de jogadores empatados
 */
export interface TieGroup {
  positions: number[];      // Posições empatadas (ex: [1, 2] ou [2, 3, 4])
  players: Player[];        // Jogadores empatados
  stats: RankingEntry;      // Estatísticas comuns (mesmos valores)
}

/**
 * Detecta empates no ranking
 * Retorna grupos de jogadores que estão empatados tecnicamente
 */
export function detectTies(ranking: RankingEntry[]): TieGroup[] {
  const ties: TieGroup[] = [];
  
  for (let i = 0; i < ranking.length - 1; i++) {
    // Não detectar empates se nenhum jogo foi finalizado ainda
    if (ranking[i].jogos === 0) continue;
    
    // Verificar se há empate com próximo jogador
    if (
      ranking[i].vitorias === ranking[i + 1].vitorias &&
      ranking[i].saldoGames === ranking[i + 1].saldoGames &&
      !ranking[i].player.tiebreakOrder // Só detectar se não tem desempate manual
    ) {
      // Coletar todos os jogadores empatados em sequência
      const tiedPlayers = [ranking[i]];
      let j = i + 1;
      
      while (
        j < ranking.length &&
        ranking[j].vitorias === ranking[i].vitorias &&
        ranking[j].saldoGames === ranking[i].saldoGames &&
        !ranking[j].player.tiebreakOrder
      ) {
        tiedPlayers.push(ranking[j]);
        j++;
      }
      
      ties.push({
        positions: tiedPlayers.map((_, idx) => i + idx + 1),
        players: tiedPlayers.map(entry => entry.player),
        stats: ranking[i],
      });
      
      i = j - 1; // Pular jogadores já processados
    }
  }
  
  return ties;
}
