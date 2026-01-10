/**
 * useTournament Hook
 * Hook principal que gerencia todo o estado do torneio
 */

'use client';

import { useCallback } from 'react';
import type { Tournament, Player, Group, Match, SetScore } from '@/types';
import { useLocalStorage } from './useLocalStorage';
import { addPlayer as addPlayerService, formGroupsFromWaitingList, removePlayer as removePlayerService } from '@/services/enrollmentService';
import { generatePairsFor4Players } from '@/services/matchGenerator';
import { updateMatchResult, calculateRanking } from '@/services/rankingService';
import { createEmptyTournament } from '@/services/backupService';

const TOURNAMENT_STORAGE_KEY = 'beachtennis-tournament';

/**
 * Hook principal para gerenciar o torneio
 */
export function useTournament() {
  const [tournament, setTournament] = useLocalStorage<Tournament>(
    TOURNAMENT_STORAGE_KEY,
    createEmptyTournament()
  );

  /**
   * Atualiza nome do torneio
   */
  const updateTournamentName = useCallback((nome: string) => {
    setTournament(prev => ({ ...prev, nome }));
  }, [setTournament]);

  /**
   * Adiciona uma categoria
   */
  const addCategory = useCallback((categoria: string) => {
    setTournament(prev => ({
      ...prev,
      categorias: [...prev.categorias, categoria],
    }));
  }, [setTournament]);

  /**
   * Remove uma categoria
   */
  const removeCategory = useCallback((categoria: string) => {
    setTournament(prev => ({
      ...prev,
      categorias: prev.categorias.filter(c => c !== categoria),
      waitingList: prev.waitingList.filter(p => p.categoria !== categoria),
      grupos: prev.grupos.filter(g => g.categoria !== categoria),
    }));
  }, [setTournament]);

  /**
   * Atualiza configurações de jogo
   */
  const updateGameConfig = useCallback((config: Tournament['gameConfig']) => {
    setTournament(prev => ({ ...prev, gameConfig: config }));
  }, [setTournament]);

  /**
   * Adiciona um jogador à lista de espera
   */
  const addPlayer = useCallback((nome: string, categoria: string, isSeed: boolean) => {
    setTournament(prev => addPlayerService(nome, categoria, isSeed, prev));
  }, [setTournament]);

  /**
   * Remove um jogador da lista de espera
   */
  const removePlayer = useCallback((playerId: string) => {
    setTournament(prev => removePlayerService(playerId, prev));
  }, [setTournament]);

  /**
   * Forma grupos a partir da lista de espera
   */
  const formGroups = useCallback((categoria: string, fase: number = 1) => {
    setTournament(prev => {
      const updated = formGroupsFromWaitingList(prev, categoria, fase);
      
      // Gera matches para os novos grupos
      const newGroups = updated.grupos.filter(g => g.matches.length === 0);
      const groupsWithMatches = updated.grupos.map(group => {
        if (newGroups.find(ng => ng.id === group.id) && group.players.length === 4) {
          return {
            ...group,
            matches: generatePairsFor4Players(group),
          };
        }
        return group;
      });

      return {
        ...updated,
        grupos: groupsWithMatches,
      };
    });
  }, [setTournament]);

  /**
   * Atualiza o placar de uma partida
   */
  const updateMatchScore = useCallback((
    groupId: string,
    matchId: string,
    sets: SetScore[]
  ) => {
    setTournament(prev => ({
      ...prev,
      grupos: prev.grupos.map(group => {
        if (group.id !== groupId) return group;

        return {
          ...group,
          matches: group.matches.map(match => {
            if (match.id !== matchId) return match;
            return updateMatchResult(match, sets);
          }),
        };
      }),
    }));
  }, [setTournament]);

  /**
   * Finaliza uma partida
   */
  const finalizeMatch = useCallback((groupId: string, matchId: string) => {
    setTournament(prev => ({
      ...prev,
      grupos: prev.grupos.map(group => {
        if (group.id !== groupId) return group;

        return {
          ...group,
          matches: group.matches.map(match => {
            if (match.id !== matchId) return match;
            return { ...match, isFinished: true };
          }),
        };
      }),
    }));
  }, [setTournament]);

  /**
   * Obtém o ranking de um grupo
   */
  const getGroupRanking = useCallback((groupId: string) => {
    const group = tournament.grupos.find(g => g.id === groupId);
    if (!group) return [];
    return calculateRanking(group);
  }, [tournament.grupos]);

  /**
   * Importa um torneio (substituindo o atual)
   */
  const importTournament = useCallback((newTournament: Tournament) => {
    setTournament(newTournament);
  }, [setTournament]);

  /**
   * Reseta o torneio para estado inicial
   */
  const resetTournament = useCallback(() => {
    setTournament(createEmptyTournament());
  }, [setTournament]);

  return {
    tournament,
    updateTournamentName,
    addCategory,
    removeCategory,
    updateGameConfig,
    addPlayer,
    removePlayer,
    formGroups,
    updateMatchScore,
    finalizeMatch,
    getGroupRanking,
    importTournament,
    resetTournament,
  };
}
