/**
 * Group Generator Service
 * Cria grupos distribuindo seeds e sorteando jogadores
 */

import type { Player, Group } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { PLAYERS_PER_GROUP, getGroupName } from '@/types';

/**
 * Cria grupos a partir de uma lista de jogadores
 * Distribui seeds uniformemente e sorteia os demais
 * @param startIndex - Índice inicial para nomear grupos (0 = A, 1 = B, etc.)
 */
export function createGroups(
  players: Player[],
  fase: number,
  categoria: string,
  startIndex: number = 0
): Group[] {
  if (players.length < PLAYERS_PER_GROUP) {
    console.warn(`Mínimo de ${PLAYERS_PER_GROUP} jogadores necessário para criar grupos`);
    return [];
  }

  const numGroups = Math.floor(players.length / PLAYERS_PER_GROUP);
  
  // Separa seeds dos não-seeds
  const seeds = players.filter(p => p.isSeed);
  const nonSeeds = players.filter(p => !p.isSeed);

  // Distribui seeds uniformemente
  const seededGroups = distributeSeeds(seeds, numGroups);

  // Embaralha não-seeds
  const shuffledNonSeeds = shufflePlayers(nonSeeds);

  // Distribui não-seeds nos grupos
  let playerIndex = 0;
  for (const group of seededGroups) {
    while (group.length < PLAYERS_PER_GROUP && playerIndex < shuffledNonSeeds.length) {
      group.push(shuffledNonSeeds[playerIndex]);
      playerIndex++;
    }
  }

  // Cria objetos de grupo com nomes alfabéticos (A, B, C...)
  return seededGroups.map((groupPlayers, index) => ({
    id: uuidv4(),
    nome: getGroupName(startIndex + index),  // A, B, C, D...
    fase,
    categoria,
    players: groupPlayers.map(p => ({ ...p, status: 'enrolled' as const })),
    matches: [],
  }));
}

/**
 * Distribui seeds uniformemente entre os grupos
 * Exemplo: 4 seeds em 2 grupos -> [seed1, seed3], [seed2, seed4]
 */
export function distributeSeeds(
  seeds: Player[],
  numGroups: number
): Player[][] {
  const groups: Player[][] = Array.from({ length: numGroups }, () => []);

  // Distribui seeds de forma serpentina
  seeds.forEach((seed, index) => {
    const groupIndex = index % numGroups;
    groups[groupIndex].push(seed);
  });

  return groups;
}

/**
 * Embaralha array de jogadores (Fisher-Yates shuffle)
 */
export function shufflePlayers(players: Player[]): Player[] {
  const shuffled = [...players];
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  
  return shuffled;
}

/**
 * Verifica se é possível formar grupos com os jogadores
 */
export function canFormGroups(players: Player[]): boolean {
  return players.length >= PLAYERS_PER_GROUP;
}

/**
 * Retorna quantos grupos completos podem ser formados
 */
export function getNumberOfGroups(players: Player[]): number {
  return Math.floor(players.length / PLAYERS_PER_GROUP);
}

/**
 * Retorna quantos jogadores sobrarão na lista de espera
 */
export function getRemainingPlayers(players: Player[]): number {
  return players.length % PLAYERS_PER_GROUP;
}
