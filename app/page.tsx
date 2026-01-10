/**
 * Dashboard Page
 * Página principal com visualização dos grupos e jogos
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTournament } from '@/hooks/useTournament';
import { GroupCard } from '@/components/GroupCard';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  
  const {
    tournament,
    updateMatchScore,
    finalizeMatch,
    getGroupRanking,
  } = useTournament();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string>(
    tournament.categorias[0] || ''
  );

  const groupsInCategory = tournament.grupos.filter(
    (g) => g.categoria === selectedCategory
  );

  const handleFinalizeMatch = (groupId: string, matchId: string, sets: typeof tournament.grupos[0]['matches'][0]['sets']) => {
    updateMatchScore(groupId, matchId, sets);
    finalizeMatch(groupId, matchId);
  };

  // Evita erro de hydration - só renderiza após montar no cliente
  if (!isMounted) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {tournament.nome}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Painel do Torneio
              </p>
            </div>
            <Link
              href="/config"
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              ⚙️ Configurações
            </Link>
          </div>

          {/* Seletor de Categoria */}
          {tournament.categorias.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {tournament.categorias.map((cat) => {
                const groupCount = tournament.grupos.filter(
                  (g) => g.categoria === cat
                ).length;

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-primary text-white'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    {cat}
                    {groupCount > 0 && (
                      <span className="ml-2 text-xs opacity-75">
                        ({groupCount} grupo{groupCount !== 1 ? 's' : ''})
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Grupos */}
        {groupsInCategory.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {groupsInCategory.map((group) => {
              const ranking = getGroupRanking(group.id);

              return (
                <GroupCard
                  key={group.id}
                  group={group}
                  ranking={ranking}
                  gameConfig={tournament.gameConfig}
                  onUpdateScore={updateMatchScore}
                  onFinalizeMatch={handleFinalizeMatch}
                />
              );
            })}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🎾</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Nenhum grupo formado ainda
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {selectedCategory
                  ? `Não há grupos na categoria "${selectedCategory}". Adicione jogadores e forme grupos nas configurações.`
                  : 'Crie categorias e adicione jogadores para começar o torneio.'}
              </p>
              <Link
                href="/config"
                className="inline-block px-6 py-3 bg-primary hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
              >
                Ir para Configurações
              </Link>
            </div>
          </div>
        )}

        {/* Info Stats */}
        {tournament.grupos.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {tournament.grupos.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Grupos Ativos
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {tournament.grupos.reduce((sum, g) => sum + g.matches.length, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Partidas Geradas
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {tournament.grupos.reduce(
                  (sum, g) => sum + g.matches.filter((m) => m.isFinished).length,
                  0
                )}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Jogos Concluídos
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
