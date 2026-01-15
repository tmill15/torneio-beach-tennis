/**
 * Hook de Sincronização de Torneio
 * Gerencia sincronização entre cliente e servidor (Vercel KV/Redis)
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { useLocalStorage } from './useLocalStorage';
import type { Tournament } from '@/types';

const TOURNAMENT_ID_KEY = 'beachtennis-tournament-id';
const ADMIN_TOKEN_KEY = 'beachtennis-admin-token';
export const SHARING_ENABLED_KEY = 'beachtennis-sharing-enabled';

interface UseTournamentSyncOptions {
  tournament: Tournament;
  tournamentId?: string;
  isAdmin: boolean;
  onTournamentUpdate?: (tournament: Tournament) => void;
}

interface UseTournamentSyncResult {
  syncStatus: 'idle' | 'saving' | 'saved' | 'error';
  shareLink: string | null;
  tournamentId: string | null;
  viewerError?: any; // Erro do SWR (para detectar torneio não encontrado)
  retrySync: () => void; // Função para forçar retry manual
}

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    const errorObj = { status: res.status, response: { status: res.status }, ...error };
    throw errorObj;
  }
  return res.json();
};

/**
 * Hook para sincronização de torneio
 */
export function useTournamentSync({
  tournament,
  tournamentId: externalTournamentId,
  isAdmin,
  onTournamentUpdate,
}: UseTournamentSyncOptions): UseTournamentSyncResult {
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [storedTournamentId, setStoredTournamentId] = useLocalStorage<string | null>(
    TOURNAMENT_ID_KEY,
    null
  );
  const [storedAdminToken, setStoredAdminToken] = useLocalStorage<string | null>(
    ADMIN_TOKEN_KEY,
    null
  );
  const [sharingEnabled, setSharingEnabled] = useLocalStorage<boolean>(
    SHARING_ENABLED_KEY,
    false
  );

  const lastSyncedData = useRef<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const retryTimer = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3; // Tentativas imediatas com backoff exponencial
  const retryDelays = [2000, 4000, 8000]; // 2s, 4s, 8s

  // Usar tournamentId externo ou do localStorage
  const tournamentId = externalTournamentId || storedTournamentId;

  // Modo Viewer: usar SWR para buscar dados
  const { data: viewerData, error: viewerError } = useSWR(
    !isAdmin && tournamentId ? `/api/load?id=${tournamentId}` : null,
    fetcher,
    {
      refreshInterval: 60000, // 1 minuto
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
    }
  );

  // Atualizar torneio quando dados chegarem do servidor (modo viewer)
  useEffect(() => {
    if (!isAdmin && viewerData?.tournament && onTournamentUpdate) {
      onTournamentUpdate(viewerData.tournament);
    }
  }, [isAdmin, viewerData, onTournamentUpdate]);

  // Função para realizar o sync
  const performSync = useCallback(async (isRetry: boolean = false) => {
    if (!isAdmin || !tournamentId || !storedAdminToken || !sharingEnabled) {
      return;
    }

    const currentDataString = JSON.stringify(tournament);

    // Dirty checking: só salvar se houver mudança real (exceto em retry manual)
    if (!isRetry && currentDataString === lastSyncedData.current) {
      return;
    }

    setSyncStatus('saving');

    try {
      const response = await fetch('/api/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournamentId,
          adminToken: storedAdminToken,
          data: tournament,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || `Erro HTTP ${response.status}`;
        const errorDetails = errorData.details || '';
        console.error('❌ Erro na resposta do servidor:', {
          status: response.status,
          statusText: response.statusText,
          error: errorMessage,
          details: errorDetails,
        });
        throw new Error(`${errorMessage}${errorDetails ? ` - ${errorDetails}` : ''}`);
      }

      // Sucesso: atualizar referência e status
      lastSyncedData.current = currentDataString;
      setSyncStatus('saved');
      retryCount.current = 0;

      // Limpar timer de retry se existir
      if (retryTimer.current) {
        clearTimeout(retryTimer.current);
        retryTimer.current = null;
      }

      // Resetar status para 'idle' após 2 segundos
      setTimeout(() => {
        setSyncStatus('idle');
      }, 2000);
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      
      // Tentar novamente com backoff exponencial
      if (retryCount.current < maxRetries) {
        retryCount.current += 1;
        const delay = retryDelays[retryCount.current - 1];
        console.log(`🔄 Tentativa ${retryCount.current}/${maxRetries} em ${delay/1000}s...`);
        
        // Manter erro visível durante o delay
        setSyncStatus('error');
        
        retryTimer.current = setTimeout(() => {
          // Mudar para 'saving' antes de tentar novamente
          setSyncStatus('saving');
          performSync(false);
        }, delay);
      } else {
        // Esgotou todas as tentativas, manter erro
        setSyncStatus('error');
        retryCount.current = 0; // Reset para próxima tentativa manual
        console.log('❌ Todas as tentativas de sincronização falharam. Use o botão "Tentar novamente" para tentar novamente.');
      }
    }
  }, [isAdmin, tournamentId, storedAdminToken, tournament, sharingEnabled]);

  // Retry manual (força nova tentativa)
  const retrySync = useCallback(() => {
    // Limpar timers
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    if (retryTimer.current) {
      clearTimeout(retryTimer.current);
      retryTimer.current = null;
    }

    // Reset contador
    retryCount.current = 0;

    // Forçar sync imediatamente (marcar como retry manual)
    performSync(true);
  }, [performSync]);

  // Modo Admin: sincronizar com debounce e dirty checking
  // Só sincroniza se compartilhamento estiver ativo
  useEffect(() => {
    if (!isAdmin || !tournamentId || !storedAdminToken || !sharingEnabled) {
      return;
    }

    // Limpar timer anterior
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Debounce de 2 segundos
    debounceTimer.current = setTimeout(() => {
      performSync(false);
    }, 2000);

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [isAdmin, tournamentId, storedAdminToken, tournament, sharingEnabled, performSync]);

  // Gerar link de compartilhamento
  const shareLink = tournamentId
    ? `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/torneio/${tournamentId}`
    : null;

  return {
    syncStatus,
    shareLink,
    tournamentId,
    viewerError: !isAdmin ? viewerError : undefined,
    retrySync,
  };
}

/**
 * Função auxiliar para gerar novo tournamentId e adminToken
 */
export function generateTournamentShare(): { tournamentId: string; adminToken: string } {
  // Gerar UUID para tournamentId
  const tournamentId = crypto.randomUUID();

  // Gerar token aleatório seguro
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const adminToken = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');

  return { tournamentId, adminToken };
}
