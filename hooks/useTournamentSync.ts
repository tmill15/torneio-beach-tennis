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
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

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
  const retryCount = useRef(0);
  const maxRetries = 3;

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
    debounceTimer.current = setTimeout(async () => {
      const currentDataString = JSON.stringify(tournament);

      // Dirty checking: só salvar se houver mudança real
      if (currentDataString === lastSyncedData.current) {
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
          throw new Error(errorData.error || 'Erro ao salvar');
        }

        // Sucesso: atualizar referência e status
        lastSyncedData.current = currentDataString;
        setSyncStatus('saved');
        retryCount.current = 0;

        // Resetar status para 'idle' após 2 segundos
        setTimeout(() => {
          setSyncStatus('idle');
        }, 2000);
      } catch (error) {
        console.error('Erro ao sincronizar:', error);
        setSyncStatus('error');

        // Backoff exponencial em caso de erro
        if (retryCount.current < maxRetries) {
          retryCount.current += 1;
          const delay = Math.pow(2, retryCount.current) * 1000; // 2s, 4s, 8s
          setTimeout(() => {
            setSyncStatus('idle');
          }, delay);
        } else {
          // Após max retries, manter erro
          retryCount.current = 0;
        }
      }
    }, 2000);

    // Cleanup
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [isAdmin, tournamentId, storedAdminToken, tournament, sharingEnabled]);

  // Gerar link de compartilhamento
  const shareLink = tournamentId
    ? `${process.env.NEXT_PUBLIC_APP_URL || window.location.origin}/torneio/${tournamentId}`
    : null;

  return {
    syncStatus,
    shareLink,
    tournamentId,
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
