/**
 * useTournament Hook
 * Hook principal que gerencia todo o estado do torneio
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
   * Finaliza uma partida (atualiza placar e marca como finalizada)
   */
  const finalizeMatch = useCallback((groupId: string, matchId: string, sets: SetScore[]) => {
    updateTournament(prev => {
      // Primeiro, encontrar a partida para verificar se é desempate
      const group = prev.grupos.find(g => g.id === groupId);
      const match = group?.matches.find(m => m.id === matchId);
      
      return {
        ...prev,
        grupos: prev.grupos.map(grp => {
          if (grp.id !== groupId) return grp;

          return {
            ...grp,
            matches: grp.matches.map(m => {
              if (m.id !== matchId) return m;
              // Atualiza o placar E finaliza em uma única operação
              const updatedMatch = updateMatchResult(m, sets);
              return { ...updatedMatch, isFinished: true };
            }),
            // Se for partida de desempate de simples, aplicar tiebreakOrder automaticamente
            players: match?.isTiebreaker && match.jogador1A.id === match.jogador2A.id
              ? grp.players.map(player => {
                  const updatedMatch = updateMatchResult(match, sets);
                  const winnerId = updatedMatch.setsWonA > updatedMatch.setsWonB 
                    ? match.jogador1A.id 
                    : match.jogador1B.id;
                  const loserId = updatedMatch.setsWonA > updatedMatch.setsWonB 
                    ? match.jogador1B.id 
                    : match.jogador1A.id;
                  
                  if (player.id === winnerId) {
                    return { ...player, tiebreakOrder: 1, tiebreakMethod: 'singles' as const };
                  } else if (player.id === loserId) {
                    return { ...player, tiebreakOrder: 2, tiebreakMethod: 'singles' as const };
                  }
                  return player;
                })
              : grp.players,
          };
        }),
      };
    });
  }, [updateTournament]);

  /**
   * Reabre uma partida finalizada para edição
   */
  const reopenMatch = useCallback((groupId: string, matchId: string) => {
    updateTournament(prev => ({
      ...prev,
      grupos: prev.grupos.map(group => {
        if (group.id !== groupId) return group;

        return {
          ...group,
          matches: group.matches.map(match => {
            if (match.id !== matchId) return match;
            return { ...match, isFinished: false };
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
   * Reseta e resorteia grupos de uma categoria
   * Remove todos os grupos e retorna jogadores para lista de espera
   */
  const resetAndRedrawGroups = useCallback((categoria: string) => {
    updateTournament(prev => {
      // 1. Coletar todos os jogadores dos grupos desta categoria
      const playersInGroups = prev.grupos
        .filter(g => g.categoria === categoria)
        .flatMap(g => g.players.map(p => ({ ...p, status: 'waiting' as const })));
      
      // 2. Remover grupos desta categoria
      const remainingGroups = prev.grupos.filter(g => g.categoria !== categoria);
      
      // 3. Adicionar jogadores de volta à lista de espera
      const newWaitingList = [...prev.waitingList, ...playersInGroups];
      
      return {
        ...prev,
        grupos: remainingGroups,
        waitingList: newWaitingList,
      };
    });
  }, [updateTournament]);

  /**
   * Resolver desempate por seleção manual
   */
  const resolveTieManual = useCallback((groupId: string, winnerId: string, tiedPlayerIds: string[], method: 'manual' | 'random' = 'manual') => {
    updateTournament(prev => ({
      ...prev,
      grupos: prev.grupos.map(group => {
        if (group.id !== groupId) return group;
        
        return {
          ...group,
          players: group.players.map(player => {
            if (!tiedPlayerIds.includes(player.id)) return player;
            
            // Atribuir ordem de desempate
            if (player.id === winnerId) {
              // Vencedor sempre recebe posição 1 (melhor)
              return { ...player, tiebreakOrder: 1, tiebreakMethod: method };
            } else {
              // Outros recebem posições 2, 3, 4... baseado na ordem original
              // Remover o vencedor do array e encontrar índice entre os perdedores
              const losers = tiedPlayerIds.filter(id => id !== winnerId);
              const loserIndex = losers.indexOf(player.id);
              return { ...player, tiebreakOrder: loserIndex + 2, tiebreakMethod: method }; // +2 porque vencedor é 1
            }
          }),
        };
      }),
    }));
  }, [updateTournament]);

  /**
   * Resolver desempate por sorteio
   */
  const resolveTieRandom = useCallback((groupId: string, tiedPlayerIds: string[]) => {
    // Gerar índice aleatório diretamente (mais simples e garantidamente aleatório)
    const randomIndex = Math.floor(Math.random() * tiedPlayerIds.length);
    const winnerId = tiedPlayerIds[randomIndex];
    
    // Log para debug (pode remover depois)
    console.log('Sorteio de desempate:', {
      jogadores: tiedPlayerIds.length,
      indiceAleatorio: randomIndex,
      vencedorId: winnerId
    });
    
    resolveTieManual(groupId, winnerId, tiedPlayerIds, 'random');
  }, [resolveTieManual]);

  /**
   * Gerar partida de simples para desempate
   */
  const generateSinglesMatch = useCallback((groupId: string, player1Id: string, player2Id: string) => {
    updateTournament(prev => ({
      ...prev,
      grupos: prev.grupos.map(group => {
        if (group.id !== groupId) return group;
        
        const p1 = group.players.find(p => p.id === player1Id);
        const p2 = group.players.find(p => p.id === player2Id);
        
        if (!p1 || !p2) return group;
        
        // Criar partida de simples (jogador duplicado como dupla)
        const singlesMatch: Match = {
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
          rodada: group.matches.length + 1,
          isTiebreaker: true, // Flag especial
        };
        
        return {
          ...group,
          matches: [...group.matches, singlesMatch],
        };
      }),
    }));
  }, [updateTournament]);

  /**
   * Desfazer desempate manual (remove tiebreakOrder, tiebreakMethod e partidas de simples)
   */
  const undoTiebreak = useCallback((groupId: string, playerIds: string[]) => {
    updateTournament(prev => {
      const group = prev.grupos.find(g => g.id === groupId);
      if (!group) return prev;
      
      // Verificar se algum jogador foi desempatado via partida de simples
      const playersWithSinglesMethod = group.players.filter(
        p => playerIds.includes(p.id) && p.tiebreakMethod === 'singles'
      );
      
      return {
        ...prev,
        grupos: prev.grupos.map(grp => {
          if (grp.id !== groupId) return grp;
          
          return {
            ...grp,
            players: grp.players.map(player => {
              if (!playerIds.includes(player.id)) return player;
              
              // Remover tiebreakOrder e tiebreakMethod
              const { tiebreakOrder, tiebreakMethod, ...playerWithoutTiebreak } = player;
              return playerWithoutTiebreak;
            }),
            // Se foi desempate via partida de simples, remover a partida
            matches: playersWithSinglesMethod.length > 0
              ? grp.matches.filter(match => {
                  // Remover partidas de desempate de simples entre esses jogadores
                  if (!match.isTiebreaker) return true;
                  if (match.jogador1A.id !== match.jogador2A.id) return true; // Não é simples
                  
                  const isMatchBetweenPlayers = 
                    playerIds.includes(match.jogador1A.id) && 
                    playerIds.includes(match.jogador1B.id);
                  
                  return !isMatchBetweenPlayers; // Remove se for entre os jogadores
                })
              : grp.matches,
          };
        }),
      };
    });
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
    reopenMatch,
    getGroupRanking,
    importTournament,
    resetAndRedrawGroups,
    resolveTieManual,
    resolveTieRandom,
    generateSinglesMatch,
    undoTiebreak,
    resetTournament,
  };
}
