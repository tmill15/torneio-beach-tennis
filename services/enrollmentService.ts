/**
 * Enrollment Service
 * Gerencia inscrição de jogadores individuais e lista de espera
 */

import type { Player, Tournament, Group } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { PLAYERS_PER_GROUP } from '@/types';
import { createGroups, canFormGroups as checkCanFormGroups } from './groupGenerator';

/**
 * Verifica se já existe um jogador com o mesmo nome na mesma categoria
 * (tanto na lista de espera quanto nos grupos do torneio)
 */
export function hasDuplicatePlayerName(
  nome: string,
  categoria: string,
  tournament: Tournament
): boolean {
  const normalizedName = nome.trim().toLowerCase();
  
  // Verifica na lista de espera
  const inWaitingList = tournament.waitingList.some(
    p => p.categoria === categoria && p.nome.trim().toLowerCase() === normalizedName
  );
  
  if (inWaitingList) return true;
  
  // Verifica nos grupos do torneio
  const inGroups = tournament.grupos.some(group => 
    group.categoria === categoria &&
    group.players.some(
      p => p.nome.trim().toLowerCase() === normalizedName
    )
  );
  
  return inGroups;
}

/**
 * Adiciona um jogador à lista de espera do torneio
 * Retorna o torneio atualizado ou lança um erro se o nome já existir
 */
export function addPlayer(
  nome: string,
  categoria: string,
  isSeed: boolean,
  tournament: Tournament
): Tournament {
  // Verifica se já existe jogador com o mesmo nome na mesma categoria
  if (hasDuplicatePlayerName(nome, categoria, tournament)) {
    throw new Error(`Já existe um participante com o nome "${nome}" na categoria "${categoria}".`);
  }
  
  const newPlayer: Player = {
    id: uuidv4(),
    nome,
    categoria,
    isSeed,
    status: 'waiting',
  };

  return {
    ...tournament,
    waitingList: [...tournament.waitingList, newPlayer],
  };
}

/**
 * Remove um jogador da lista de espera
 */
export function removePlayer(
  playerId: string,
  tournament: Tournament
): Tournament {
  return {
    ...tournament,
    waitingList: tournament.waitingList.filter(p => p.id !== playerId),
  };
}

/**
 * Forma grupos automaticamente da lista de espera
 * Retorna torneio atualizado com novos grupos e lista de espera reduzida
 */
export function formGroupsFromWaitingList(
  tournament: Tournament,
  categoria: string,
  fase: number
): Tournament {
  // Filtra jogadores da categoria
  const playersInCategory = tournament.waitingList.filter(
    p => p.categoria === categoria
  );

  // Verifica se já existem grupos na Fase 1 desta categoria
  const existingPhase1Groups = tournament.grupos.filter(
    g => g.categoria === categoria && g.fase === 1
  );
  const isFirstFormation = existingPhase1Groups.length === 0;

  // Validação: mínimo de 8 jogadores APENAS na primeira formação de grupos
  // Para grupos adicionais, basta 4 jogadores (1 grupo)
  if (fase === 1 && isFirstFormation && playersInCategory.length < 8) {
    console.warn(`Mínimo de 8 jogadores necessário para iniciar torneio de 3 fases. Você tem ${playersInCategory.length} jogador(es).`);
    return tournament;
  }

  if (!checkCanFormGroups(playersInCategory)) {
    console.warn(`Não há jogadores suficientes (mínimo ${PLAYERS_PER_GROUP}) na categoria ${categoria}`);
    return tournament;
  }

  // Calcula quantos jogadores podem formar grupos
  const numGroups = Math.floor(playersInCategory.length / PLAYERS_PER_GROUP);
  const playersToEnroll = playersInCategory.slice(0, numGroups * PLAYERS_PER_GROUP);
  const remainingPlayers = playersInCategory.slice(numGroups * PLAYERS_PER_GROUP);

  // Calcula índice inicial para nomeação (A, B, C...)
  const existingGroupsInCategory = tournament.grupos.filter(
    g => g.categoria === categoria && g.fase === fase
  ).length;

  // Cria grupos
  const newGroups = createGroups(playersToEnroll, fase, categoria, existingGroupsInCategory);

  // Atualiza lista de espera (remove jogadores que foram para grupos)
  const updatedWaitingList = [
    ...tournament.waitingList.filter(p => p.categoria !== categoria),
    ...remainingPlayers,
  ];

  return {
    ...tournament,
    grupos: [...tournament.grupos, ...newGroups],
    waitingList: updatedWaitingList,
  };
}

/**
 * Verifica se é possível formar um novo grupo de uma categoria
 */
export function canFormNewGroup(
  tournament: Tournament,
  categoria: string
): boolean {
  const playersInCategory = tournament.waitingList.filter(
    p => p.categoria === categoria
  );
  return playersInCategory.length >= PLAYERS_PER_GROUP;
}

/**
 * Retorna estatísticas da lista de espera por categoria
 */
export function getWaitingListStats(tournament: Tournament) {
  const stats: Record<string, {
    total: number;
    seeds: number;
    canFormGroup: boolean;
    groupsReady: number;
    remaining: number;
  }> = {};

  for (const categoria of tournament.categorias) {
    const players = tournament.waitingList.filter(p => p.categoria === categoria);
    const total = players.length;
    const seeds = players.filter(p => p.isSeed).length;
    const groupsReady = Math.floor(total / PLAYERS_PER_GROUP);
    const remaining = total % PLAYERS_PER_GROUP;

    stats[categoria] = {
      total,
      seeds,
      canFormGroup: total >= PLAYERS_PER_GROUP,
      groupsReady,
      remaining,
    };
  }

  return stats;
}

/**
 * Atualiza dados de um jogador
 */
export function updatePlayer(
  playerId: string,
  updates: Partial<Player>,
  tournament: Tournament
): Tournament {
  return {
    ...tournament,
    waitingList: tournament.waitingList.map(p =>
      p.id === playerId ? { ...p, ...updates } : p
    ),
  };
}

/**
 * Lista jogadores de uma categoria específica
 */
export function getPlayersByCategory(
  tournament: Tournament,
  categoria: string
): Player[] {
  return tournament.waitingList.filter(p => p.categoria === categoria);
}
