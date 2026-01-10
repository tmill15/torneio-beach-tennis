/**
 * Match Generator Service - Round Robin Algorithm
 * Gera automaticamente as partidas no formato "todos contra todos"
 */

import type { Group, Match, Player } from '@/types';
import { v4 as uuidv4 } from 'uuid';

/**
 * Gera partidas Round Robin para um grupo de 4 duplas
 * Algoritmo: Circle Method
 * 
 * Para 4 duplas (A, B, C, D), gera 6 partidas em 3 rodadas:
 * - Rodada 1: A×B, C×D
 * - Rodada 2: A×C, B×D
 * - Rodada 3: A×D, B×C
 */
export function generateRoundRobinMatches(group: Group): Match[] {
  const matches: Match[] = [];
  const players = [...group.players];
  
  if (players.length < 2) {
    console.warn('Grupo precisa de pelo menos 2 jogadores');
    return [];
  }

  // Para round robin, todos jogam contra todos
  // Número total de partidas = n * (n-1) / 2
  // Para 4 jogadores = 4 * 3 / 2 = 6 partidas
  
  const n = players.length;
  let rodada = 1;
  const matchesPerRound = Math.floor(n / 2);

  // Se número ímpar de jogadores, adiciona um "bye" temporário
  if (n % 2 !== 0) {
    players.push({
      id: 'bye',
      nome: 'BYE',
      categoria: group.categoria,
      isSeed: false,
      status: 'waiting'
    });
  }

  const totalPlayers = players.length;
  const rounds = totalPlayers - 1;

  // Algoritmo Circle Method
  for (let round = 0; round < rounds; round++) {
    // Criar partidas para esta rodada
    for (let match = 0; match < matchesPerRound; match++) {
      const home = (round + match) % (totalPlayers - 1);
      const away = (totalPlayers - 1 - match + round) % (totalPlayers - 1);
      
      // Se um dos índices é igual ao último, emparelha com o jogador fixo
      const playerA = match === 0 ? players[totalPlayers - 1] : players[home];
      const playerB = players[away];

      // Ignora partidas com BYE
      if (playerA.id !== 'bye' && playerB.id !== 'bye') {
        matches.push({
          id: uuidv4(),
          groupId: group.id,
          playerA,
          playerB,
          sets: [],
          setsWonA: 0,
          setsWonB: 0,
          isFinished: false,
          rodada: Math.floor(matches.length / matchesPerRound) + 1
        });
      }
    }
  }

  return matches;
}

/**
 * Gera pares de partidas manualmente para grupos de 4 jogadores
 * (Método alternativo mais simples e direto)
 */
export function generatePairsFor4Players(group: Group): Match[] {
  const players = group.players;
  
  if (players.length !== 4) {
    console.warn('Este método funciona apenas para grupos de 4 jogadores');
    return generateRoundRobinMatches(group);
  }

  const [p1, p2, p3, p4] = players;

  return [
    // Rodada 1
    {
      id: uuidv4(),
      groupId: group.id,
      playerA: p1,
      playerB: p2,
      sets: [],
      setsWonA: 0,
      setsWonB: 0,
      isFinished: false,
      rodada: 1
    },
    {
      id: uuidv4(),
      groupId: group.id,
      playerA: p3,
      playerB: p4,
      sets: [],
      setsWonA: 0,
      setsWonB: 0,
      isFinished: false,
      rodada: 1
    },
    // Rodada 2
    {
      id: uuidv4(),
      groupId: group.id,
      playerA: p1,
      playerB: p3,
      sets: [],
      setsWonA: 0,
      setsWonB: 0,
      isFinished: false,
      rodada: 2
    },
    {
      id: uuidv4(),
      groupId: group.id,
      playerA: p2,
      playerB: p4,
      sets: [],
      setsWonA: 0,
      setsWonB: 0,
      isFinished: false,
      rodada: 2
    },
    // Rodada 3
    {
      id: uuidv4(),
      groupId: group.id,
      playerA: p1,
      playerB: p4,
      sets: [],
      setsWonA: 0,
      setsWonB: 0,
      isFinished: false,
      rodada: 3
    },
    {
      id: uuidv4(),
      groupId: group.id,
      playerA: p2,
      playerB: p3,
      sets: [],
      setsWonA: 0,
      setsWonB: 0,
      isFinished: false,
      rodada: 3
    },
  ];
}

/**
 * Valida se um grupo pode ter partidas geradas
 */
export function canGenerateMatches(group: Group): boolean {
  return group.players.length >= 2 && group.matches.length === 0;
}

/**
 * Retorna o número de partidas que serão geradas para um grupo
 */
export function getExpectedMatchCount(playerCount: number): number {
  if (playerCount < 2) return 0;
  return (playerCount * (playerCount - 1)) / 2;
}
