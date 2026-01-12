/**
 * Match Generator Service - Round Robin Algorithm
 * Gera automaticamente as partidas de duplas no formato Round Robin de pareamentos
 */

import type { Group, Match } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Gera partidas Round Robin de pareamentos para um grupo de 4 jogadores
 * Cada jogador joga COM e CONTRA todos os outros
 * 
 * Para 4 jogadores (A, B, C, D), gera 3 partidas:
 * - Jogo 1: (A+B) vs (C+D)
 * - Jogo 2: (A+C) vs (B+D)
 * - Jogo 3: (A+D) vs (B+C)
 */
export function generateRoundRobinMatches(group: Group): Match[] {
  const players = group.players;
  
  if (players.length < 4) {
    console.warn('Grupo precisa de 4 jogadores para gerar partidas Round Robin de pareamentos');
    return [];
  }

  return generatePairsFor4Players(group);
}

/**
 * Gera 3 jogos para grupo de 4 jogadores
 * Cada jogador joga COM e CONTRA todos os outros
 */
export function generatePairsFor4Players(group: Group): Match[] {
  const players = group.players;
  
  if (players.length !== 4) {
    console.warn('Este método funciona apenas para grupos de 4 jogadores');
    return [];
  }

  // IMPORTANTE: Preservar partidas de desempate existentes
  const existingTiebreakerMatches = group.matches?.filter(m => m.isTiebreaker) || [];

  const [p1, p2, p3, p4] = players;

  const regularMatches: Match[] = [
    // Jogo 1: (p1+p2) vs (p3+p4)
    {
      id: uuidv4(),
      groupId: group.id,
      jogador1A: p1,
      jogador2A: p2,
      jogador1B: p3,
      jogador2B: p4,
      sets: [],
      setsWonA: 0,
      setsWonB: 0,
      isFinished: false,
      rodada: 1
    },
    // Jogo 2: (p1+p3) vs (p2+p4)
    {
      id: uuidv4(),
      groupId: group.id,
      jogador1A: p1,
      jogador2A: p3,
      jogador1B: p2,
      jogador2B: p4,
      sets: [],
      setsWonA: 0,
      setsWonB: 0,
      isFinished: false,
      rodada: 2
    },
    // Jogo 3: (p1+p4) vs (p2+p3)
    {
      id: uuidv4(),
      groupId: group.id,
      jogador1A: p1,
      jogador2A: p4,
      jogador1B: p2,
      jogador2B: p3,
      sets: [],
      setsWonA: 0,
      setsWonB: 0,
      isFinished: false,
      rodada: 3
    }
  ];

  // Retornar partidas regulares + partidas de desempate preservadas
  return [...regularMatches, ...existingTiebreakerMatches];
}

/**
 * Valida se um grupo pode ter partidas geradas
 */
export function canGenerateMatches(group: Group): boolean {
  return group.players.length === 4 && group.matches.length === 0;
}

/**
 * Gera uma partida de simples para 2 jogadores (final)
 */
export function generateSinglesMatch(group: Group): Match[] {
  const players = group.players;
  
  if (players.length !== 2) {
    console.warn('Este método funciona apenas para grupos de 2 jogadores');
    return [];
  }

  const [p1, p2] = players;

  // Partida de simples: jogador1A vs jogador1B
  // jogador2A e jogador2B ficam como o mesmo jogador (dupla consigo mesmo)
  const match: Match = {
    id: uuidv4(),
    groupId: group.id,
    jogador1A: p1,
    jogador2A: p1, // Mesmo jogador (simples)
    jogador1B: p2,
    jogador2B: p2, // Mesmo jogador (simples)
    sets: [],
    setsWonA: 0,
    setsWonB: 0,
    isFinished: false,
    rodada: 1,
    isTiebreaker: false // Não é desempate, é a final
  };

  return [match];
}

/**
 * Retorna o número de partidas que serão geradas para um grupo
 */
export function getExpectedMatchCount(playerCount: number): number {
  if (playerCount === 4) return 3; // 3 jogos para Round Robin de pareamentos com 4 jogadores
  if (playerCount === 2) return 1; // 1 jogo de simples para 2 jogadores
  return 0;
}
