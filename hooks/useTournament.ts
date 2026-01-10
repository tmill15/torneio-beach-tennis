/**
 * useTournament Hook
 * Hook principal que gerencia todo o estado do torneio
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Tournament, Player, Group, Match, SetScore } from '@/types';
import { useLocalStorage } from './useLocalStorage';
import { addPlayer as addPlayerService, formGroupsFromWaitingList, removePlayer as removePlayerService } from '@/services/enrollmentService';
import { generatePairsFor4Players } from '@/services/matchGenerator';
import { updateMatchResult, calculateRanking } from '@/services/rankingService';
import { createEmptyTournament, isValidTournamentStructure, isV030Structure, migrateV030ToV040 } from '@/services/backupService';

const TOURNAMENT_STORAGE_KEY = 'beachtennis-tournament';

/**
 * Hook principal para gerenciar o torneio
 */
export function useTournament() {
  const [rawTournament, setRawTournament] = useLocalStorage<Tournament>(
    TOURNAMENT_STORAGE_KEY,
    createEmptyTournament()
  );

  // Valida estrutura do torneio ao carregar
  const [tournament, setTournament] = useState<Tournament>(() => {
    // Verifica se é da v0.3.0 e precisa migrar
    if (isV030Structure(rawTournament)) {
      console.log('🔄 Detectados dados da v0.3.0. Iniciando migração automática...');
      const migratedTournament = migrateV030ToV040(rawTournament);
      
      // Regera matches para grupos existentes
      const groupsWithMatches = migratedTournament.grupos.map(group => {
        if (group.players.length === 4) {
          return {
            ...group,
            matches: generatePairsFor4Players(group),
          };
        }
        return group;
      });
      
      const finalTournament = {
        ...migratedTournament,
        grupos: groupsWithMatches,
      };
      
      // Salva estrutura migrada
      setTimeout(() => setRawTournament(finalTournament), 0);
      return finalTournament;
    }
    
    // ✅ MODO SEGURO: Valida apenas estrutura básica
    if (!isValidTournamentStructure(rawTournament)) {
      console.error('❌ Dados corrompidos ou inválidos detectados!');
      console.error('Estrutura recebida:', rawTournament);
      
      // ⚠️ ÚLTIMO RECURSO: Só cria torneio vazio se dados estiverem realmente corrompidos
      const emptyTournament = createEmptyTournament();
      console.warn('⚠️ Criando torneio vazio. Verifique backups automáticos no localStorage.');
      return emptyTournament;
    }
    
    // ✅ Adiciona version se não existir (compatibilidade com v0.4.0)
    if (!rawTournament.version) {
      console.log('📌 Adicionando marcador de versão aos dados existentes...');
      const tournamentWithVersion = {
        ...rawTournament,
        version: '0.4.0',
      };
      setTimeout(() => setRawTournament(tournamentWithVersion), 0);
      return tournamentWithVersion;
    }
    
    return rawTournament;
  });

  // Sincroniza com rawTournament
  useEffect(() => {
    if (isValidTournamentStructure(rawTournament)) {
      setTournament(rawTournament);
    }
  }, [rawTournament]);

  // Wrapper para setRawTournament
  const updateTournament = useCallback((value: Tournament | ((prev: Tournament) => Tournament)) => {
    const newValue = value instanceof Function ? value(tournament) : value;
    setTournament(newValue);
    setRawTournament(newValue);
  }, [tournament, setRawTournament]);

  /**
   * Atualiza nome do torneio
   */
  const updateTournamentName = useCallback((nome: string) => {
    updateTournament(prev => ({ ...prev, nome }));
  }, [updateTournament]);

  /**
   * Adiciona uma categoria
   */
  const addCategory = useCallback((categoria: string) => {
    updateTournament(prev => ({
      ...prev,
      categorias: [...prev.categorias, categoria],
    }));
  }, [updateTournament]);

  /**
   * Remove uma categoria
   */
  const removeCategory = useCallback((categoria: string) => {
    updateTournament(prev => ({
      ...prev,
      categorias: prev.categorias.filter(c => c !== categoria),
      waitingList: prev.waitingList.filter(p => p.categoria !== categoria),
      grupos: prev.grupos.filter(g => g.categoria !== categoria),
    }));
  }, [updateTournament]);

  /**
   * Move uma categoria para cima na ordem
   */
  const moveCategoryUp = useCallback((categoria: string) => {
    updateTournament(prev => {
      const index = prev.categorias.indexOf(categoria);
      if (index <= 0) return prev;
      
      const newCategorias = [...prev.categorias];
      [newCategorias[index - 1], newCategorias[index]] = [newCategorias[index], newCategorias[index - 1]];
      
      return {
        ...prev,
        categorias: newCategorias,
      };
    });
  }, [updateTournament]);

  /**
   * Move uma categoria para baixo na ordem
   */
  const moveCategoryDown = useCallback((categoria: string) => {
    updateTournament(prev => {
      const index = prev.categorias.indexOf(categoria);
      if (index < 0 || index >= prev.categorias.length - 1) return prev;
      
      const newCategorias = [...prev.categorias];
      [newCategorias[index], newCategorias[index + 1]] = [newCategorias[index + 1], newCategorias[index]];
      
      return {
        ...prev,
        categorias: newCategorias,
      };
    });
  }, [updateTournament]);

  /**
   * Atualiza configurações de jogo
   */
  const updateGameConfig = useCallback((config: Tournament['gameConfig']) => {
    updateTournament(prev => ({ ...prev, gameConfig: config }));
  }, [updateTournament]);

  /**
   * Adiciona um jogador à lista de espera
   */
  const addPlayer = useCallback((nome: string, categoria: string, isSeed: boolean) => {
    updateTournament(prev => addPlayerService(nome, categoria, isSeed, prev));
  }, [updateTournament]);

  /**
   * Remove um jogador da lista de espera
   */
  const removePlayer = useCallback((playerId: string) => {
    updateTournament(prev => removePlayerService(playerId, prev));
  }, [updateTournament]);

  /**
   * Forma grupos a partir da lista de espera
   */
  const formGroups = useCallback((categoria: string, fase: number = 1) => {
    updateTournament(prev => {
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
  }, [updateTournament]);

  /**
   * Atualiza o placar de uma partida
   */
  const updateMatchScore = useCallback((
    groupId: string,
    matchId: string,
    sets: SetScore[]
  ) => {
    updateTournament(prev => ({
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
  }, [updateTournament]);

  /**
   * Finaliza uma partida
   */
  const finalizeMatch = useCallback((groupId: string, matchId: string) => {
    updateTournament(prev => ({
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
  }, [updateTournament]);

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
    updateTournament(newTournament);
  }, [updateTournament]);

  /**
   * Reseta o torneio para estado inicial
   */
  const resetTournament = useCallback(() => {
    updateTournament(createEmptyTournament());
  }, [updateTournament]);

  return {
    tournament,
    updateTournamentName,
    addCategory,
    removeCategory,
    moveCategoryUp,
    moveCategoryDown,
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
