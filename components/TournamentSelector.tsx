'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTournamentManager } from '@/hooks/useTournamentManager';
import type { TournamentMetadata } from '@/types';

export function TournamentSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const {
    tournamentList,
    activeTournamentId,
    activeTournamentMetadata,
    getTournaments,
    activateTournament,
  } = useTournamentManager();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  // Fechar dropdown ao pressionar Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  if (!isMounted) {
    return (
      <div className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg animate-pulse">
        <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    );
  }

  const activeTournament = activeTournamentMetadata;
  const allTournaments = getTournaments();

  const handleSelectTournament = async (tournamentId: string) => {
    if (tournamentId === activeTournamentId) {
      setIsOpen(false);
      return;
    }

    activateTournament(tournamentId);
    setIsOpen(false);
    
    // Sempre recarregar a página para garantir que todos os hooks sejam atualizados
    // Isso é necessário porque useTournament precisa recarregar os dados do localStorage
    window.location.reload();
  };

  return (
    <div className="relative w-full sm:w-auto" ref={dropdownRef}>
      {/* Botão Seletor - Estilo consistente com outros botões */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors w-full sm:w-auto"
        aria-label={`Trocar torneio${activeTournament ? `: ${activeTournament.name}` : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        title={activeTournament ? `Torneio atual: ${activeTournament.name}` : 'Selecionar torneio'}
      >
        <span className="text-base" aria-hidden="true">
          🔄
        </span>
        <span className="text-sm font-medium">Alterar Torneio</span>
        <span className="text-white/80 text-xs flex-shrink-0">
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay para mobile */}
          <div
            className="fixed inset-0 bg-black/20 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:left-0 sm:right-auto sm:mt-2 sm:w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
            role="listbox"
            style={{ top: 'calc(100% + 0.5rem)' }}
          >
          {allTournaments.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
              Nenhum torneio encontrado
            </div>
          ) : (
            <div className="py-2">
              {allTournaments.map((tournament) => {
                const isActive = tournament.id === activeTournamentId;
                
                return (
                  <button
                    key={tournament.id}
                    onClick={() => handleSelectTournament(tournament.id)}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                        : ''
                    }`}
                    role="option"
                    aria-selected={isActive}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {tournament.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {tournament.categories.length} categoria{tournament.categories.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isActive && (
                          <span className="text-blue-600 dark:text-blue-400 text-sm font-bold">
                            ✓
                          </span>
                        )}
                        {tournament.status === 'archived' && (
                          <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded whitespace-nowrap">
                            Arquivado
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          </div>
        </>
      )}
    </div>
  );
}
