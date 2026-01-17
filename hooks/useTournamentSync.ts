/**
 * Hook de Sincronização de Torneio
 * Gerencia sincronização entre cliente e servidor (Vercel KV/Redis)
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { useLocalStorage } from './useLocalStorage';
import { useTournamentManager } from './useTournamentManager';
import type { Tournament } from '@/types';

const TOURNAMENT_ID_KEY = 'beachtennis-tournament-id';
const ADMIN_TOKEN_KEY_BASE = 'beachtennis-admin-token'; // Token global (deprecated)
export const SHARING_ENABLED_KEY = 'beachtennis-sharing-enabled'; // Chave base (compatibilidade)

/**
 * Gera chave de adminToken para um torneio específico
 */
export function getAdminTokenKey(tournamentId: string): string {
  return `beachtennis-admin-token-${tournamentId}`;
}

/**
 * Obtém adminToken para um torneio específico
 * Retorna token específico ou token global (fallback para compatibilidade)
 */
export function getAdminToken(tournamentId: string | null): string | null {
  if (!tournamentId || typeof window === 'undefined') return null;
  
  // Tentar token específico do torneio
  const specificKey = getAdminTokenKey(tournamentId);
  const specificToken = localStorage.getItem(specificKey);
  if (specificToken) return specificToken;
  
  // Fallback: token global (compatibilidade com versões antigas)
  return localStorage.getItem(ADMIN_TOKEN_KEY_BASE);
}

/**
 * Define adminToken para um torneio específico
 */
export function setAdminToken(tournamentId: string, adminToken: string): void {
  if (typeof window === 'undefined') return;
  
  const key = getAdminTokenKey(tournamentId);
  localStorage.setItem(key, adminToken);
}

/**
 * Remove adminToken de um torneio específico
 */
export function removeAdminToken(tournamentId: string): void {
  if (typeof window === 'undefined') return;
  
  const key = getAdminTokenKey(tournamentId);
  localStorage.removeItem(key);
}

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
  forceSync: () => void; // Função para forçar sincronização imediata
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
  const { activeTournamentId } = useTournamentManager();
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  // Usar tournamentId externo, activeTournamentId do manager, ou do localStorage (compatibilidade)
  const tournamentId = externalTournamentId || activeTournamentId || (typeof window !== 'undefined' ? localStorage.getItem(TOURNAMENT_ID_KEY) : null);
  
  // Obter adminToken específico do torneio (ou fallback para global)
  const storedAdminToken = tournamentId ? getAdminToken(tournamentId) : null;

  // Determinar chave de sharingEnabled baseada no torneio ativo
  const getSharingKey = useCallback(() => {
    const currentTournamentId = externalTournamentId || activeTournamentId;
    if (currentTournamentId) {
      return `beachtennis-sharing-enabled-${currentTournamentId}`;
    }
    // Fallback para chave antiga (compatibilidade)
    return SHARING_ENABLED_KEY;
  }, [externalTournamentId, activeTournamentId]);

  const sharingKey = getSharingKey();
  const [sharingEnabled, setSharingEnabled] = useLocalStorage<boolean>(
    sharingKey,
    false
  );

  const lastSyncedData = useRef<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const retryTimer = useRef<NodeJS.Timeout | null>(null);
  const retryCount = useRef(0);
  const maxRetries = 3; // Tentativas imediatas com backoff exponencial
  const retryDelays = [2000, 4000, 8000]; // 2s, 4s, 8s

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
  // Usar ref para onTournamentUpdate para evitar dependências circulares
  const onTournamentUpdateRef = useRef(onTournamentUpdate);
  useEffect(() => {
    onTournamentUpdateRef.current = onTournamentUpdate;
  }, [onTournamentUpdate]);

  useEffect(() => {
    if (!isAdmin && viewerData?.tournament && onTournamentUpdateRef.current) {
      onTournamentUpdateRef.current(viewerData.tournament);
    }
  }, [isAdmin, viewerData]); // Removido onTournamentUpdate das dependências

  // Função para realizar o sync
  const performSync = useCallback(async (isRetry: boolean = false) => {
    if (!isAdmin || !tournamentId || !storedAdminToken || !sharingEnabled) {
      if (!isAdmin) console.log('⏸️ Sync pausado: não é admin');
      if (!tournamentId) console.log('⏸️ Sync pausado: sem tournamentId');
      if (!storedAdminToken) console.log('⏸️ Sync pausado: sem adminToken');
      if (!sharingEnabled) console.log('⏸️ Sync pausado: compartilhamento desativado');
      return;
    }

    const currentDataString = JSON.stringify(tournament);

    // Dirty checking: só salvar se houver mudança real (exceto em retry manual)
    if (!isRetry && currentDataString === lastSyncedData.current) {
      return;
    }

    setSyncStatus('saving');
    
    console.log('🔄 Iniciando sincronização:', {
      tournamentId,
      hasAdminToken: !!storedAdminToken,
      sharingEnabled,
    });

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
          tournamentId,
          hasAdminToken: !!storedAdminToken,
        });
        
        // Se o erro for 401 (token inválido), pode ser que o torneio já existe com token diferente
        // Nesse caso, tentar deletar o torneio antigo e tentar novamente
        if (response.status === 401 && !isRetry) {
          console.log('🔄 Token inválido detectado. Tentando limpar torneio antigo...');
          try {
            // Tentar deletar o torneio (pode falhar se não tivermos o token correto)
            await fetch(`/api/tournament/${tournamentId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${storedAdminToken}`,
                'Content-Type': 'application/json',
              },
            });
            // Aguardar um pouco e tentar novamente
            setTimeout(() => {
              performSync(false);
            }, 1000);
          } catch {
            // Ignorar erro de deleção
          }
        }
        
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
    ? `${process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/torneio/${tournamentId}`
    : null;

  // Função para forçar sync imediato (útil quando ativar compartilhamento pela primeira vez)
  const forceSync = useCallback(() => {
    // Limpar debounce e disparar sync imediatamente
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    performSync(true);
  }, [performSync]);

  return {
    syncStatus,
    shareLink,
    tournamentId,
    viewerError: !isAdmin ? viewerError : undefined,
    retrySync,
    forceSync,
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
