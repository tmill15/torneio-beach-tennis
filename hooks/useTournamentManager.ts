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

const TOURNAMENT_LIST_KEY = 'beachtennis-tournament-list';
const OLD_TOURNAMENT_KEY = 'beachtennis-tournament'; // Chave antiga (formato único)
const TOURNAMENT_ID_KEY = 'beachtennis-tournament-id';
const ADMIN_TOKEN_KEY = 'beachtennis-admin-token';

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

      console.log('✅ Migração concluída! Torneio migrado com ID:', oldTournamentId);
      setMigrationDone(true);
    } catch (error) {
      console.error('❌ Erro durante migração:', error);
      setMigrationDone(true);
    }
  }, [tournamentList, migrationDone, setTournamentList]);

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
  const createTournament = useCallback((name: string, categories: string[] = ['Iniciante', 'Normal']) => {
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

    // Criar torneio vazio no localStorage
    const emptyTournament = createEmptyTournament();
    emptyTournament.nome = metadata.name;
    emptyTournament.categorias = categories;
    const tournamentStorageKey = `beachtennis-tournament-${newId}`;
    localStorage.setItem(tournamentStorageKey, JSON.stringify(emptyTournament));

    // Gerar adminToken global apenas se não existir
    if (typeof window !== 'undefined') {
      const existingToken = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (!existingToken) {
        const adminToken = generateAdminToken();
        localStorage.setItem(ADMIN_TOKEN_KEY, adminToken);
      }
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
    setTournamentList(prev => ({
      ...prev,
      tournaments: prev.tournaments.map(t => {
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
      }),
    }));
  }, [setTournamentList]);

  /**
   * Arquivar torneio
   */
  const archiveTournament = useCallback((id: string) => {
    updateTournamentMetadata(id, { status: 'archived' });
  }, [updateTournamentMetadata]);

  /**
   * Desarquivar torneio
   */
  const unarchiveTournament = useCallback((id: string) => {
    updateTournamentMetadata(id, { status: 'active' });
  }, [updateTournamentMetadata]);


  /**
   * Deletar torneio
   */
  const deleteTournament = useCallback(async (id: string) => {
    // Remover do Redis se houver adminToken global
    if (typeof window !== 'undefined') {
      const adminToken = localStorage.getItem(ADMIN_TOKEN_KEY);
      
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


      // Remover sharingEnabled específico do torneio
      const sharingKey = `beachtennis-sharing-enabled-${id}`;
      localStorage.removeItem(sharingKey);

      // Se era o torneio ativo, limpar tournamentId (mas manter adminToken global)
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
      
      // Garantir que existe adminToken global (gerar se não existir)
      const existingToken = localStorage.getItem(ADMIN_TOKEN_KEY);
      if (!existingToken) {
        const newToken = generateAdminToken();
        localStorage.setItem(ADMIN_TOKEN_KEY, newToken);
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
