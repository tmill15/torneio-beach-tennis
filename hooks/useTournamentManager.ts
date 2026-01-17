/**
 * useTournamentManager Hook
 * Gerencia lista de múltiplos torneios, CRUD e migração automática
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLocalStorage } from './useLocalStorage';
import type { TournamentMetadata, TournamentList, Tournament } from '@/types';
import { createEmptyTournament, isValidTournamentStructure } from '@/services/backupService';
import { getAdminTokenKey, getAdminToken, setAdminToken, removeAdminToken } from './useTournamentSync';

const TOURNAMENT_LIST_KEY = 'beachtennis-tournament-list';
const OLD_TOURNAMENT_KEY = 'beachtennis-tournament'; // Chave antiga (formato único)
const TOURNAMENT_ID_KEY = 'beachtennis-tournament-id';
const ADMIN_TOKEN_KEY_BASE = 'beachtennis-admin-token'; // Token global (deprecated)

/**
 * Gerar adminToken aleatório seguro
 */
function generateAdminToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hook para gerenciar múltiplos torneios
 */
export function useTournamentManager() {
  const [tournamentList, setTournamentList] = useLocalStorage<TournamentList>(
    TOURNAMENT_LIST_KEY,
    { tournaments: [], activeTournamentId: null }
  );
  const [migrationDone, setMigrationDone] = useState(false);

  /**
   * Migração automática: Converter torneio único antigo para novo formato
   */
  useEffect(() => {
    if (migrationDone) return;

    // Verificar se já existe lista de torneios
    if (tournamentList.tournaments.length > 0) {
      setMigrationDone(true);
      return;
    }

    // Verificar se existe torneio antigo
    if (typeof window === 'undefined') return;

    try {
      const oldTournamentData = localStorage.getItem(OLD_TOURNAMENT_KEY);
      if (!oldTournamentData) {
        setMigrationDone(true);
        return;
      }

      const oldTournament: Tournament = JSON.parse(oldTournamentData);
      
      // Validar estrutura do torneio antigo
      if (!isValidTournamentStructure(oldTournament)) {
        console.warn('⚠️ Torneio antigo inválido, pulando migração');
        setMigrationDone(true);
        return;
      }

      console.log('🔄 Detectado torneio antigo. Iniciando migração automática...');

      // Gerar UUID para o torneio antigo
      const oldTournamentId = localStorage.getItem(TOURNAMENT_ID_KEY) || uuidv4();
      
      // Criar metadata do torneio
      const metadata: TournamentMetadata = {
        id: oldTournamentId,
        name: oldTournament.nome || 'Torneio Migrado',
        date: new Date().toISOString(),
        categories: oldTournament.categorias || [],
        status: 'active',
      };

      // Criar nova lista de torneios
      const newList: TournamentList = {
        tournaments: [metadata],
        activeTournamentId: oldTournamentId,
      };

      // Salvar lista de torneios
      setTournamentList(newList);

      // Mover dados do torneio para chave específica
      const tournamentStorageKey = `beachtennis-tournament-${oldTournamentId}`;
      localStorage.setItem(tournamentStorageKey, JSON.stringify(oldTournament));

      // Remover chave antiga
      localStorage.removeItem(OLD_TOURNAMENT_KEY);

      // Garantir que tournamentId está salvo
      if (!localStorage.getItem(TOURNAMENT_ID_KEY)) {
        localStorage.setItem(TOURNAMENT_ID_KEY, oldTournamentId);
      }

      // Migrar adminToken global para adminToken específico do torneio
      const globalAdminToken = localStorage.getItem(ADMIN_TOKEN_KEY_BASE);
      if (globalAdminToken) {
        setAdminToken(oldTournamentId, globalAdminToken);
        console.log('✅ AdminToken global migrado para torneio específico:', oldTournamentId);
      }

      console.log('✅ Migração concluída! Torneio migrado com ID:', oldTournamentId);
      setMigrationDone(true);
    } catch (error) {
      console.error('❌ Erro durante migração:', error);
      setMigrationDone(true);
    }
  }, [tournamentList, migrationDone, setTournamentList]);

  /**
   * Migração de adminToken global para adminToken por torneio
   * Executa uma vez para todos os torneios existentes
   */
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (tournamentList.tournaments.length === 0) return;

    // Verificar se já foi migrado
    const migrationKey = 'beachtennis-admin-token-migration-done';
    if (localStorage.getItem(migrationKey) === 'true') return;

    const globalAdminToken = localStorage.getItem(ADMIN_TOKEN_KEY_BASE);
    if (!globalAdminToken) {
      // Não há token global para migrar
      localStorage.setItem(migrationKey, 'true');
      return;
    }

    console.log('🔄 Iniciando migração de adminToken global para tokens por torneio...');
    
    // Migrar token global para todos os torneios que não têm token específico
    let migratedCount = 0;
    for (const tournament of tournamentList.tournaments) {
      const specificToken = getAdminToken(tournament.id);
      if (!specificToken) {
        setAdminToken(tournament.id, globalAdminToken);
        migratedCount++;
      }
    }

    if (migratedCount > 0) {
      console.log(`✅ Migração concluída! ${migratedCount} torneio(s) receberam adminToken específico.`);
    }

    // Marcar migração como concluída
    localStorage.setItem(migrationKey, 'true');
  }, [tournamentList]);

  /**
   * Obter ID do torneio ativo
   */
  const getActiveTournamentId = useCallback((): string | null => {
    return tournamentList.activeTournamentId;
  }, [tournamentList]);

  /**
   * Obter metadata do torneio ativo
   */
  const getActiveTournamentMetadata = useCallback((): TournamentMetadata | null => {
    if (!tournamentList.activeTournamentId) return null;
    return tournamentList.tournaments.find(t => t.id === tournamentList.activeTournamentId) || null;
  }, [tournamentList]);

  /**
   * Criar novo torneio
   */
  const createTournament = useCallback((name: string, categories: string[] = ['Geral']) => {
    const newId = uuidv4();
    const metadata: TournamentMetadata = {
      id: newId,
      name: name.trim() || 'Novo Torneio',
      date: new Date().toISOString(),
      categories,
      status: 'active',
    };

    setTournamentList(prev => ({
      tournaments: [...prev.tournaments, metadata],
      activeTournamentId: newId,
    }));

    // Criar torneio vazio no localStorage com as categorias corretas
    // Não usar createEmptyTournament() que sempre cria com ['Iniciante', 'Normal']
    // Criar diretamente com as categorias passadas
    const emptyTournament: Tournament = {
      version: '0.4.0',
      nome: metadata.name,
      categorias: [...categories], // Usar as categorias passadas diretamente
      gameConfig: {
        quantidadeSets: 1,
        gamesPerSet: 6,
        tieBreakDecisivo: false,
        pontosTieBreak: 7,
      },
      grupos: [],
      waitingList: [],
      completedCategories: [],
    };
    const tournamentStorageKey = `beachtennis-tournament-${newId}`;
    // Salvar imediatamente para evitar race conditions
    localStorage.setItem(tournamentStorageKey, JSON.stringify(emptyTournament));
    console.log(`✅ [createTournament] Torneio criado com categorias:`, emptyTournament.categorias);

    // Gerar adminToken específico para este torneio
    if (typeof window !== 'undefined') {
      const adminToken = generateAdminToken();
      setAdminToken(newId, adminToken);
    }

    // Atualizar tournamentId no localStorage (compatibilidade)
    localStorage.setItem(TOURNAMENT_ID_KEY, newId);

    return newId;
  }, [setTournamentList]);

  /**
   * Atualizar metadata de um torneio
   */
  const updateTournamentMetadata = useCallback((
    id: string,
    updates: Partial<Pick<TournamentMetadata, 'name' | 'categories' | 'status'>>
  ) => {
    setTournamentList(prev => {
      const newTournaments = prev.tournaments.map(t => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          // Se atualizou nome ou categorias, atualizar também no torneio completo
          if (updates.name || updates.categories) {
            const tournamentStorageKey = `beachtennis-tournament-${id}`;
            const tournamentData = localStorage.getItem(tournamentStorageKey);
            if (tournamentData) {
              try {
                const tournament: Tournament = JSON.parse(tournamentData);
                if (updates.name) tournament.nome = updates.name;
                if (updates.categories) tournament.categorias = updates.categories;
                localStorage.setItem(tournamentStorageKey, JSON.stringify(tournament));
              } catch (error) {
                console.error('Erro ao atualizar torneio completo:', error);
              }
            }
          }
          return updated;
        }
        return t;
      });
      
      // Criar novo objeto para garantir que a referência mude
      return {
        ...prev,
        tournaments: newTournaments,
      };
    });
  }, [setTournamentList]);

  /**
   * Arquivar torneio
   * Remove do Redis quando arquivado
   */
  const archiveTournament = useCallback(async (id: string) => {
    // Remover do Redis quando arquivar
    if (typeof window !== 'undefined') {
      const adminToken = getAdminToken(id);
      
      console.log('📦 [Archive] Iniciando arquivamento do torneio:', id);
      console.log('📦 [Archive] AdminToken disponível:', !!adminToken);
      
      if (adminToken) {
        try {
          console.log('📦 [Archive] Enviando requisição DELETE para /api/tournament/' + id);
          const response = await fetch(`/api/tournament/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json',
            },
          });

          console.log('📦 [Archive] Resposta do servidor:', response.status, response.statusText);

          if (response.ok) {
            console.log('✅ [Archive] Torneio removido do Redis com sucesso');
          } else if (response.status === 404) {
            console.log('ℹ️ [Archive] Torneio não encontrado no Redis (já estava removido)');
          } else {
            const errorText = await response.text();
            console.error('❌ [Archive] Erro ao remover torneio do Redis:', response.status, errorText);
          }
        } catch (error) {
          console.error('❌ [Archive] Erro ao deletar torneio do Redis ao arquivar:', error);
          // Continuar mesmo se falhar
        }
      } else {
        console.warn('⚠️ [Archive] AdminToken não encontrado. Não é possível remover do Redis.');
      }
    }
    
    // Atualizar status para arquivado
    console.log('📦 [Archive] Atualizando status para arquivado');
    updateTournamentMetadata(id, { status: 'archived' });
  }, [updateTournamentMetadata]);

  /**
   * Desarquivar torneio
   * Restaura no Redis se o compartilhamento estiver habilitado
   */
  const unarchiveTournament = useCallback(async (id: string) => {
    // Atualizar status para ativo primeiro
    updateTournamentMetadata(id, { status: 'active' });
    
    // Verificar se o compartilhamento está habilitado para este torneio
    if (typeof window !== 'undefined') {
      const sharingKey = `beachtennis-sharing-enabled-${id}`;
      const sharingEnabled = localStorage.getItem(sharingKey) === 'true';
      
      if (sharingEnabled) {
        // Se compartilhamento está habilitado, restaurar no Redis
        const adminToken = getAdminToken(id);
        const tournamentStorageKey = `beachtennis-tournament-${id}`;
        const tournamentData = localStorage.getItem(tournamentStorageKey);
        
        if (adminToken && tournamentData) {
          try {
            const tournament = JSON.parse(tournamentData);
            console.log('📤 [Unarchive] Restaurando torneio no Redis:', id);
            
            const response = await fetch('/api/save', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                tournamentId: id,
                adminToken: adminToken,
                data: tournament,
              }),
            });

            if (response.ok) {
              console.log('✅ [Unarchive] Torneio restaurado no Redis com sucesso');
            } else {
              const errorText = await response.text();
              console.error('❌ [Unarchive] Erro ao restaurar torneio no Redis:', response.status, errorText);
            }
          } catch (error) {
            console.error('❌ [Unarchive] Erro ao restaurar torneio no Redis:', error);
          }
        }
      }
    }
  }, [updateTournamentMetadata]);


  /**
   * Deletar torneio
   */
  const deleteTournament = useCallback(async (id: string) => {
    // Remover do Redis se houver adminToken do torneio
    if (typeof window !== 'undefined') {
      const adminToken = getAdminToken(id);
      
      if (adminToken) {
        try {
          const response = await fetch(`/api/tournament/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json',
            },
          });

          if (!response.ok && response.status !== 404) {
            console.error('Erro ao remover torneio do Redis:', await response.text());
            // Continuar mesmo se falhar (pode não existir no Redis ou token não corresponder)
          }
        } catch (error) {
          console.error('Erro ao deletar torneio do Redis:', error);
          // Continuar mesmo se falhar
        }
      }
    }

    // Remover da lista
    setTournamentList(prev => {
      const newList = {
        tournaments: prev.tournaments.filter(t => t.id !== id),
        activeTournamentId: prev.activeTournamentId === id ? null : prev.activeTournamentId,
      };

      // Se deletou o torneio ativo e há outros, ativar o primeiro disponível
      if (newList.activeTournamentId === null && newList.tournaments.length > 0) {
        const firstActive = newList.tournaments.find(t => t.status === 'active');
        if (firstActive) {
          newList.activeTournamentId = firstActive.id;
          localStorage.setItem(TOURNAMENT_ID_KEY, firstActive.id);
        }
      }

      return newList;
    });

    // Remover dados do localStorage
    if (typeof window !== 'undefined') {
      const tournamentStorageKey = `beachtennis-tournament-${id}`;
      localStorage.removeItem(tournamentStorageKey);

      // Remover adminToken específico do torneio
      removeAdminToken(id);

      // Remover sharingEnabled específico do torneio
      const sharingKey = `beachtennis-sharing-enabled-${id}`;
      localStorage.removeItem(sharingKey);

      // Se era o torneio ativo, limpar tournamentId
      if (tournamentList.activeTournamentId === id) {
        localStorage.removeItem(TOURNAMENT_ID_KEY);
      }
    }
  }, [tournamentList, setTournamentList]);

  /**
   * Ativar torneio (definir como ativo)
   */
  const activateTournament = useCallback((id: string) => {
    setTournamentList(prev => ({
      ...prev,
      activeTournamentId: id,
    }));

    // Atualizar tournamentId no localStorage (compatibilidade)
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOURNAMENT_ID_KEY, id);
      
      // Garantir que existe adminToken para este torneio (gerar se não existir)
      const existingToken = getAdminToken(id);
      if (!existingToken) {
        const newToken = generateAdminToken();
        setAdminToken(id, newToken);
      }
    }
  }, [setTournamentList]);

  /**
   * Obter todos os torneios (filtrados por status se fornecido)
   */
  const getTournaments = useCallback((status?: 'active' | 'archived') => {
    if (status) {
      return tournamentList.tournaments.filter(t => t.status === status);
    }
    return tournamentList.tournaments;
  }, [tournamentList]);

  /**
   * Obter metadata de um torneio específico
   */
  const getTournamentMetadata = useCallback((id: string): TournamentMetadata | null => {
    return tournamentList.tournaments.find(t => t.id === id) || null;
  }, [tournamentList]);

  return {
    tournamentList,
    activeTournamentId: tournamentList.activeTournamentId,
    activeTournamentMetadata: getActiveTournamentMetadata(),
    createTournament,
    updateTournamentMetadata,
    archiveTournament,
    unarchiveTournament,
    deleteTournament,
    activateTournament,
    getTournaments,
    getTournamentMetadata,
    getActiveTournamentId,
  };
}
