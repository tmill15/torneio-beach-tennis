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
import { getGroupName } from '@/types';
import {
  isPhaseComplete as isPhaseCompleteService,
  hasPendingTies as hasPendingTiesService,
  generateNextPhase,
  markEliminatedPlayers,
  getMaxPhase as getMaxPhaseService,
  getPhase1ToPhase2Classification,
  getPhase2ToPhase3Classification,
  isFinalPhase as isFinalPhaseService
} from '@/services/phaseGenerator';

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
    
    // 🧹 MIGRAÇÃO v0.7.0: Limpar badges de desempate em fases 2+
    // Ao avançar de fase, tiebreakOrder e tiebreakMethod devem ser limpos
    // Esta migração sempre roda para garantir limpeza
    const hasPhase2Plus = rawTournament.grupos.some(group => group.fase > 1);
    
    if (hasPhase2Plus) {
      // v0.11.9: NÃO limpar dados de desempate da Fase 3 (fase final)
      // Desempates podem ocorrer na fase final e devem ser preservados
      const needsBadgeCleanup = rawTournament.grupos.some(group => 
        group.fase === 2 && group.players.some(p => 
          p.tiebreakOrder !== undefined || p.tiebreakMethod !== undefined
        )
      );
      
      if (needsBadgeCleanup) {
        console.log('🧹 v0.7.0: Limpando badges de desempate na Fase 2 (Fase 3 preservada)...');
        const cleanedTournament = {
          ...rawTournament,
          grupos: rawTournament.grupos.map(group => {
            // Só limpa se for fase 2 (não limpa fase 3 - fase final pode ter desempates)
            if (group.fase === 2) {
              return {
                ...group,
                players: group.players.map(p => {
                  // Remove tiebreakOrder e tiebreakMethod apenas da Fase 2
                  const { tiebreakOrder, tiebreakMethod, ...cleanPlayer } = p;
                  return {
                    ...cleanPlayer,
                    // Mantém os outros campos
                    status: p.status,
                    qualificationType: p.qualificationType,
                    eliminatedInPhase: p.eliminatedInPhase
                  };
                })
              };
            }
            return group;
          }),
          version: '0.7.0'
        };
        setTimeout(() => setRawTournament(cleanedTournament), 0);
        console.log('✅ Badges limpos com sucesso!');
        return cleanedTournament;
      }
    }
    
    // 🔤 MIGRAÇÃO v0.11.2: Garantir que todos os grupos tenham nome (letra)
    const groupsWithoutName = rawTournament.grupos.filter(g => !g.nome || g.nome.trim() === '');
    const groupsWithFinalName = rawTournament.grupos.filter(g => g.nome === 'Final' || g.nome === 'Grupo Final');
    
    if (groupsWithoutName.length > 0 || groupsWithFinalName.length > 0) {
      console.log(`🔤 v0.11.7: Corrigindo ${groupsWithoutName.length + groupsWithFinalName.length} grupo(s) com nome incorreto...`);
      const fixedTournament = {
        ...rawTournament,
        grupos: rawTournament.grupos.map((group, index) => {
          // Se não tem nome ou tem nome "Final", atribui baseado na ordem na categoria e fase
          if (!group.nome || group.nome.trim() === '' || group.nome === 'Final' || group.nome === 'Grupo Final') {
            const groupsInSameCategoryAndPhase = rawTournament.grupos.filter(
              g => g.categoria === group.categoria && g.fase === group.fase
            );
            const groupIndex = groupsInSameCategoryAndPhase.findIndex(g => g.id === group.id);
            return {
              ...group,
              nome: getGroupName(groupIndex >= 0 ? groupIndex : index % 26)
            };
          }
          return group;
        })
      };
      setTimeout(() => setRawTournament(fixedTournament), 0);
      console.log('✅ Nomes dos grupos corrigidos!');
      return fixedTournament;
    }
    
    // 🧹 MIGRAÇÃO v0.11.8: Limpar qualificationType incorreto de jogadores na Fase 2
    // Problema: Todos os jogadores da Fase 2 estavam recebendo qualificationType quando não deveriam
    // Solução: Limpar qualificationType de jogadores na Fase 2 que não estão na Fase 3
    const phase2Groups = rawTournament.grupos.filter(g => g.fase === 2);
    const needsPhase2Cleanup = phase2Groups.some(group => {
      return group.players.some(p => p.qualificationType !== undefined);
    });
    
    if (needsPhase2Cleanup) {
      console.log('🧹 v0.11.8: Limpando qualificationType incorreto da Fase 2...');
      
      // Para cada categoria, identificar jogadores que realmente foram classificados (estão na Fase 3)
      const categoriesWithPhase3 = new Set<string>();
      rawTournament.grupos.forEach(g => {
        if (g.fase === 3) {
          categoriesWithPhase3.add(g.categoria);
        }
      });
      
      const cleanedTournament = {
        ...rawTournament,
        grupos: rawTournament.grupos.map(group => {
          if (group.fase === 2) {
            // Se há Fase 3, verificar quais jogadores realmente foram classificados
            if (categoriesWithPhase3.has(group.categoria)) {
              const phase3Group = rawTournament.grupos.find(g => g.fase === 3 && g.categoria === group.categoria);
              if (phase3Group) {
                const qualifiedIds = new Set(phase3Group.players.map(p => p.id));
                return {
                  ...group,
                  players: group.players.map(p => {
                    // Se o jogador está na Fase 3, manter qualificationType (será recalculado corretamente pelo advanceToNextPhase)
                    // Se não está, limpar qualificationType
                    if (qualifiedIds.has(p.id)) {
                      return p; // Manter - será recalculado corretamente
                    } else {
                      const { qualificationType, ...rest } = p;
                      return rest; // Limpar qualificationType
                    }
                  })
                };
              }
            }
            // Se não há Fase 3, limpar qualificationType de todos
            return {
              ...group,
              players: group.players.map(p => {
                const { qualificationType, ...rest } = p;
                return rest;
              })
            };
          }
          return group;
        })
      };
      
      setTimeout(() => setRawTournament(cleanedTournament), 0);
      console.log('✅ qualificationType da Fase 2 corrigido!');
      return cleanedTournament;
    }
    
    // 🧹 MIGRAÇÃO v0.11.7: Limpar qualificationType de jogadores na fase atual
    // qualificationType só deve existir em jogadores de fases anteriores (read-only)
    const maxPhaseByCategory: Record<string, number> = {};
    rawTournament.grupos.forEach(group => {
      if (!maxPhaseByCategory[group.categoria] || group.fase > maxPhaseByCategory[group.categoria]) {
        maxPhaseByCategory[group.categoria] = group.fase;
      }
    });
    
    const needsQualificationTypeCleanup = rawTournament.grupos.some(group => {
      const maxPhase = maxPhaseByCategory[group.categoria] || 0;
      // Se a fase do grupo é a fase máxima (fase atual), não deveria ter qualificationType
      if (group.fase === maxPhase && maxPhase > 0) {
        return group.players.some(p => p.qualificationType !== undefined);
      }
      return false;
    });
    
    if (needsQualificationTypeCleanup) {
      console.log('🧹 v0.11.7: Limpando qualificationType de jogadores na fase atual...');
      const cleanedTournament = {
        ...rawTournament,
        grupos: rawTournament.grupos.map(group => {
          const maxPhase = maxPhaseByCategory[group.categoria] || 0;
          // Se é a fase atual, limpa qualificationType
          if (group.fase === maxPhase && maxPhase > 0) {
            return {
              ...group,
              players: group.players.map(p => {
                const { qualificationType, ...rest } = p;
                return rest;
              })
            };
          }
          return group;
        })
      };
      setTimeout(() => setRawTournament(cleanedTournament), 0);
      console.log('✅ qualificationType limpo da fase atual!');
      return cleanedTournament;
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
   * Adiciona múltiplos jogadores de uma vez (otimizado para importação)
   */
  const addMultiplePlayers = useCallback((players: Array<{ nome: string; categoria: string; isSeed: boolean }>) => {
    updateTournament(prev => {
      let updated = prev;
      players.forEach(player => {
        updated = addPlayerService(player.nome, player.categoria, player.isSeed, updated);
      });
      return updated;
    });
  }, [updateTournament]);

  /**
   * Remove um jogador da lista de espera
   */
  const removePlayer = useCallback((playerId: string) => {
    updateTournament(prev => removePlayerService(playerId, prev));
  }, [updateTournament]);

  /**
   * Limpa toda a lista de espera de uma categoria
   */
  const clearWaitingList = useCallback((categoria: string) => {
    updateTournament(prev => ({
      ...prev,
      waitingList: prev.waitingList.filter(p => p.categoria !== categoria)
    }));
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
  /**
   * Resortear grupos (aplicar apenas à fase ativa)
   */
  const resetAndRedrawGroups = useCallback((categoria: string, fase: number) => {
    updateTournament(prev => {
      // 1. Coletar jogadores dos grupos da fase específica
      const playersInPhase = prev.grupos
        .filter(g => g.categoria === categoria && g.fase === fase)
        .flatMap(g => g.players.map(p => ({ 
          ...p, 
          status: 'waiting' as const, 
          tiebreakOrder: undefined,
          tiebreakMethod: undefined,
          eliminatedInPhase: undefined, // Limpa status de eliminação
          qualificationType: undefined // Limpa tipo de qualificação
        })));
      
      // 2. Remover grupos da fase específica
      const remainingGroups = prev.grupos.filter(
        g => !(g.categoria === categoria && g.fase === fase)
      );
      
      // 3. Adicionar jogadores de volta à lista de espera
      const newWaitingList = [...prev.waitingList, ...playersInPhase];
      
      return {
        ...prev,
        grupos: remainingGroups,
        waitingList: newWaitingList,
      };
    });
  }, [updateTournament]);

  /**
   * Resorteia grupos mantendo os mesmos jogadores (sem voltar para lista de espera)
   */
  const redrawGroupsInPlace = useCallback((categoria: string, fase: number) => {
    updateTournament(prev => {
      // 1. Coletar jogadores dos grupos da fase específica
      const groupsToRedraw = prev.grupos.filter(g => g.categoria === categoria && g.fase === fase);
      const playersToRedraw = groupsToRedraw.flatMap(g => g.players.map(p => ({ 
        ...p, 
        status: 'enrolled' as const,
        tiebreakOrder: undefined,
        tiebreakMethod: undefined,
        eliminatedInPhase: undefined,
        qualificationType: undefined
      })));
      
      if (playersToRedraw.length === 0) return prev;
      
      // 2. Remover grupos antigos da fase
      const remainingGroups = prev.grupos.filter(
        g => !(g.categoria === categoria && g.fase === fase)
      );
      
      // 3. Separar seeds e não-seeds
      const seeds = playersToRedraw.filter(p => p.isSeed);
      const nonSeeds = playersToRedraw.filter(p => !p.isSeed);
      
      // 4. Embaralhar
      const shuffledSeeds = [...seeds].sort(() => Math.random() - 0.5);
      const shuffledNonSeeds = [...nonSeeds].sort(() => Math.random() - 0.5);
      
      // 5. Criar novos grupos
      const numGroups = Math.floor(playersToRedraw.length / 4);
      const newGroups: Group[] = [];
      
      for (let i = 0; i < numGroups; i++) {
        const groupPlayers: Player[] = [];
        
        // Distribuir seeds uniformemente
        if (shuffledSeeds.length > 0) {
          groupPlayers.push(shuffledSeeds.shift()!);
        }
        
        // Completar com não-seeds
        while (groupPlayers.length < 4 && shuffledNonSeeds.length > 0) {
          groupPlayers.push(shuffledNonSeeds.shift()!);
        }
        
        // Se ainda falta seed e há disponível, adicionar
        while (groupPlayers.length < 4 && shuffledSeeds.length > 0) {
          groupPlayers.push(shuffledSeeds.shift()!);
        }
        
        // Criar grupo com ID único
        const groupId = uuidv4();
        const tempGroup: Group = {
          id: groupId,
          nome: getGroupName(i), // A, B, C, D...
          categoria,
          fase,
          players: groupPlayers,
          matches: [],
        };
        
        const matches = generatePairsFor4Players(tempGroup);
        
        newGroups.push({
          ...tempGroup,
          matches,
        });
      }
      
      return {
        ...prev,
        grupos: [...remainingGroups, ...newGroups],
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
   * Limpa completamente uma categoria (remove todos os grupos e retorna jogadores para lista de espera)
   */
  const clearCategory = useCallback((categoria: string) => {
    updateTournament(prev => {
      // 1. Coletar todos os jogadores de todos os grupos da categoria
      const allPlayers = prev.grupos
        .filter(g => g.categoria === categoria)
        .flatMap(g => g.players.map(p => ({
          ...p,
          status: 'waiting' as const,
          tiebreakOrder: undefined,
          tiebreakMethod: undefined,
          eliminatedInPhase: undefined,
          qualificationType: undefined
        })));

      // 2. Remover todos os grupos da categoria
      const remainingGroups = prev.grupos.filter(g => g.categoria !== categoria);

      // 3. Adicionar jogadores de volta à lista de espera
      const newWaitingList = [...prev.waitingList, ...allPlayers];

      return {
        ...prev,
        grupos: remainingGroups,
        waitingList: newWaitingList,
      };
    });
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
   * Avança para a próxima fase (com lógica específica por fase)
   */
  const advanceToNextPhase = useCallback((categoria: string, currentPhase: number) => {
    updateTournament(prev => {
      const categoryGroups = prev.grupos.filter(
        g => g.categoria === categoria && g.fase === currentPhase
      );
      
      // Obter classificados baseado na fase
      let direct, repechage;
      if (currentPhase === 1) {
        ({ direct, repechage } = getPhase1ToPhase2Classification(categoryGroups, currentPhase));
      } else if (currentPhase === 2) {
        ({ direct, repechage } = getPhase2ToPhase3Classification(categoryGroups, currentPhase));
      } else {
        return prev; // Não avançar além da Fase 3
      }
      
      const allQualified = [...direct, ...repechage];
      
      // Marcar eliminados
      let updated = markEliminatedPlayers(prev, currentPhase, allQualified);
      
      // Marcar tipo de classificação
      updated = {
        ...updated,
        grupos: updated.grupos.map(group => {
          if (group.fase !== currentPhase || group.categoria !== categoria) return group;
          
          return {
            ...group,
            players: group.players.map(player => {
              const qualified = allQualified.find(q => q.player.id === player.id);
              if (qualified) {
                return { ...player, qualificationType: qualified.type };
              }
              return player;
            })
          };
        })
      };
      
      // Gerar próxima fase
      updated = generateNextPhase(updated, currentPhase, categoria);
      
      return updated;
    });
  }, [updateTournament]);

  /**
   * Preview de classificados antes de avançar
   */
  const getPhaseAdvancePreview = useCallback((categoria: string, phase: number) => {
    const categoryGroups = tournament.grupos.filter(
      g => g.categoria === categoria && g.fase === phase
    );
    
    let direct, repechage;
    if (phase === 1) {
      ({ direct, repechage } = getPhase1ToPhase2Classification(categoryGroups, phase));
    } else if (phase === 2) {
      ({ direct, repechage } = getPhase2ToPhase3Classification(categoryGroups, phase));
    } else {
      return { direct: [], repechage: [], total: 0, rule: '' };
    }
    
    // Descrição da regra
    const numGroups = categoryGroups.length;
    let rule = '';
    if (phase === 1) {
      rule = `Top 2 de cada grupo`;
      if (repechage.length > 0) {
        rule += ` + ${repechage.length} melhores 3º lugares`;
      }
    } else if (phase === 2) {
      if (numGroups <= 2) {
        rule = 'Top 2 de cada grupo';
      } else if (numGroups === 3) {
        rule = 'Top 1 de cada grupo + melhor 2º colocado';
      } else {
        rule = 'Top 1 de cada grupo';
      }
    }
      
      return {
      direct,
      repechage,
      total: direct.length + repechage.length,
      rule
    };
  }, [tournament.grupos]);

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
    addMultiplePlayers,
    removePlayer,
    clearWaitingList,
    formGroups,
    updateMatchScore,
    finalizeMatch,
    reopenMatch,
    getGroupRanking,
    importTournament,
    resetAndRedrawGroups,
    redrawGroupsInPlace,
    clearCategory,
    resolveTieManual,
    resolveTieRandom,
    generateSinglesMatch,
    undoTiebreak,
    resetTournament,
    // Funções do sistema de fases
    advanceToNextPhase,
    getPhaseAdvancePreview,
    isPhaseComplete: (categoria: string, phase: number) => 
      isPhaseCompleteService(tournament.grupos.filter(g => g.categoria === categoria), phase),
    hasPendingTies: (categoria: string, phase: number) => 
      hasPendingTiesService(
        tournament.grupos.filter(g => g.categoria === categoria), 
        phase,
        (group) => getGroupRanking(group.id)
      ),
    getMaxPhase: (categoria: string) => 
      getMaxPhaseService(tournament.grupos, categoria),
    isFinalPhase: isFinalPhaseService,
  };
}
