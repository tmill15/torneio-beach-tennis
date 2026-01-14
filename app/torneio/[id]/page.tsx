/**
 * Tournament Viewer Page
 * Página de visualização compartilhada do torneio (modo somente leitura)
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTournamentSync } from '@/hooks/useTournamentSync';
import { GroupCard } from '@/components/GroupCard';
import { PhaseAdvanceCard } from '@/components/PhaseAdvanceCard';
import { CrossGroupTiebreakerCard } from '@/components/CrossGroupTiebreakerCard';
import type { Tournament } from '@/types';
import { createEmptyTournament } from '@/services/backupService';
import {
  getMaxPhase as getMaxPhaseService,
  isPhaseComplete as isPhaseCompleteService,
  hasPendingTies as hasPendingTiesService,
  getPhase1ToPhase2Classification,
  getPhase2ToPhase3Classification,
} from '@/services/phaseGenerator';
import { calculateRanking } from '@/services/rankingService';

export default function TournamentViewerPage() {
  const params = useParams();
  const router = useRouter();
  const tournamentId = params.id as string;
  const [isMounted, setIsMounted] = useState(false);
  const [tournament, setTournament] = useState<Tournament>(createEmptyTournament());
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [viewMode, setViewMode] = useState<'classificacao' | 'jogos'>('classificacao');
  const [selectedPhase, setSelectedPhase] = useState<number>(1);

  // Usar SWR para buscar dados (modo viewer)
  const { syncStatus } = useTournamentSync({
    tournament,
    tournamentId,
    isAdmin: false,
    onTournamentUpdate: (updatedTournament) => {
      setTournament(updatedTournament);
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Selecionar primeira categoria automaticamente quando torneio for carregado
  useEffect(() => {
    if (Array.isArray(tournament.categorias) && tournament.categorias.length > 0 && !selectedCategory) {
      setSelectedCategory(tournament.categorias[0]);
    }
  }, [tournament.categorias, selectedCategory]);

  // Funções auxiliares para compatibilidade com componentes
  const getGroupRanking = (groupId: string) => {
    const group = (tournament.grupos || []).find(g => g.id === groupId);
    if (!group) return [];
    return calculateRanking(group);
  };

  const getMaxPhase = (categoria: string) => {
    return getMaxPhaseService(tournament.grupos || [], categoria);
  };

  const isPhaseComplete = (categoria: string, phase: number) => {
    const categoryGroups = (tournament.grupos || []).filter(g => g.categoria === categoria);
    return isPhaseCompleteService(categoryGroups, phase);
  };

  const hasPendingTies = (categoria: string, phase: number) => {
    const categoryGroups = (tournament.grupos || []).filter(g => g.categoria === categoria);
    return hasPendingTiesService(
      categoryGroups,
      phase,
      (group) => getGroupRanking(group.id),
      tournament
    );
  };

  const getPhaseAdvancePreview = (categoria: string, phase: number) => {
    const categoryGroups = (tournament.grupos || []).filter(
      g => g.categoria === categoria && g.fase === phase
    );
    
    let direct, repechage;
    if (phase === 1) {
      ({ direct, repechage } = getPhase1ToPhase2Classification(categoryGroups, phase));
    } else if (phase === 2) {
      ({ direct, repechage } = getPhase2ToPhase3Classification(categoryGroups, phase, tournament));
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
      } else if (numGroups === 4) {
        rule = 'Top 1 de cada grupo';
      } else {
        rule = '4 melhores entre os Top 1 de cada grupo';
      }
    }
      
    return {
      direct,
      repechage,
      total: direct.length + repechage.length,
      rule
    };
  };

  // Filtra e ordena grupos pela fase
  // Proteção: garantir que grupos seja sempre um array
  const groupsInCategory = (tournament.grupos || [])
    .filter((g) => g.categoria === selectedCategory)
    .sort((a, b) => a.fase - b.fase);

  // Filtrar grupos normais (excluir grupos de desempate cross-group)
  const groupsInSelectedPhase = groupsInCategory.filter(
    g => g.fase === selectedPhase && !g.nome.startsWith('DESEMPATE_CROSS_GROUP_')
  );

  // Encontrar desempates cross-group para a fase selecionada
  const crossGroupTiebreaks = (tournament.crossGroupTiebreaks || []).filter(
    t => t.phase === selectedPhase
  );

  // Calcular preview de classificação
  const shouldShowPhaseAdvance = selectedPhase === getMaxPhase(selectedCategory) &&
    isPhaseComplete(selectedCategory, selectedPhase) &&
    !(selectedPhase === 3 && tournament.completedCategories?.includes(selectedCategory));

  const phaseAdvancePreview = shouldShowPhaseAdvance
    ? getPhaseAdvancePreview(selectedCategory, selectedPhase)
    : null;

  // Evita erro de hydration
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

  // Se não há torneio carregado ainda
  if (!tournament || !Array.isArray(tournament.categorias) || tournament.categorias.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">⏳</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Carregando torneio...
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Aguarde enquanto os dados são carregados.
              </p>
            </div>
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
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {tournament.nome}
                </h1>
                <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
                  Modo Espectador
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Visualização em tempo real
              </p>
            </div>
          </div>

          {/* Seletor de Categoria */}
          {Array.isArray(tournament.categorias) && tournament.categorias.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {tournament.categorias.map((cat) => {
                const groupCount = (tournament.grupos || []).filter(
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

          {/* Navegação de Fases */}
          {groupsInCategory.length > 0 && (
            <div className="mt-4">
              <div className="flex gap-1 overflow-x-auto pb-2">
                {[1, 2, 3].map((phase) => {
                  const phaseGroupsExist = groupsInCategory.some(g => g.fase === phase);
                  const maxPhase = getMaxPhase(selectedCategory);
                  const isLocked = phase > maxPhase;
                  const isCurrent = phase === selectedPhase;
                  const isDisabled = isLocked || !phaseGroupsExist;

                  return (
                    <button
                      key={phase}
                      onClick={() => setSelectedPhase(phase)}
                      disabled={isDisabled}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                        isCurrent
                          ? 'bg-primary text-white'
                          : isDisabled
                            ? 'cursor-not-allowed bg-gray-200 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {phase === 3 ? 'FINAL' : `Fase ${phase}`}
                      {isLocked && <span className="ml-1">🔒</span>}
                      {isCurrent && phase === maxPhase && <span className="ml-1 text-xs opacity-75">(Atual)</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Toggle de Visualização */}
          {groupsInCategory.length > 0 && (
            <div className="flex justify-center mt-6">
              <div className="inline-flex gap-2 bg-gray-200 dark:bg-gray-700 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('classificacao')}
                  className={`flex items-center justify-center gap-2 min-w-[160px] px-6 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                    viewMode === 'classificacao'
                      ? 'bg-white dark:bg-gray-800 text-primary shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span>📊</span>
                  <span>Classificação</span>
                </button>
                <button
                  onClick={() => setViewMode('jogos')}
                  className={`flex items-center justify-center gap-2 min-w-[160px] px-6 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                    viewMode === 'jogos'
                      ? 'bg-white dark:bg-gray-800 text-primary shadow'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <span>🎾</span>
                  <span>Jogos</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Botão de Concluir Fase (somente visualização, desabilitado) */}
        {shouldShowPhaseAdvance && phaseAdvancePreview && (
          <div className="mb-6">
            <PhaseAdvanceCard
              categoria={selectedCategory}
              currentPhase={selectedPhase}
              preview={phaseAdvancePreview}
              hasPendingTies={hasPendingTies(selectedCategory, selectedPhase)}
              onAdvance={() => {}} // Desabilitado no modo viewer
              resolveCrossGroupTieManual={() => {}} // Desabilitado
              resolveCrossGroupTieRandom={() => {}} // Desabilitado
              generateCrossGroupSinglesMatch={() => {}} // Desabilitado
              tournament={tournament}
            />
          </div>
        )}

        {/* Mostrar campeão se fase 3 está completa */}
        {selectedPhase === 3 &&
          isPhaseComplete(selectedCategory, 3) &&
          !hasPendingTies(selectedCategory, 3) &&
          tournament.completedCategories?.includes(selectedCategory) &&
          groupsInSelectedPhase.length === 1 ? (
          <div className="mb-6 bg-gradient-to-r from-yellow-400 to-orange-500 border-4 border-yellow-600 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🏆</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              CAMPEÃO DA CATEGORIA {selectedCategory.toUpperCase()}
            </h2>
            <div className="text-2xl font-bold text-white bg-black/20 rounded-lg py-4 px-6 inline-block">
              {(() => {
                const finalGroup = groupsInSelectedPhase[0];
                if (finalGroup) {
                  const ranking = getGroupRanking(finalGroup.id);
                  if (ranking.length > 0) {
                    return ranking[0].player.nome;
                  }
                }
                return '???';
              })()}
            </div>
          </div>
        ) : null}

        {/* Desempates Cross-Group */}
        {crossGroupTiebreaks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Desempates entre Grupos
            </h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {crossGroupTiebreaks.map((tiebreak, index) => {
                const tiebreakGroup = (tournament.grupos || []).find(
                  g => g.nome.startsWith('DESEMPATE_CROSS_GROUP_') &&
                    g.categoria === selectedCategory &&
                    g.fase === tiebreak.phase
                );

                return (
                  <CrossGroupTiebreakerCard
                    key={`tiebreak-${tiebreak.phase}-${tiebreak.position}-${index}`}
                    tiebreak={tiebreak}
                    tournament={tournament}
                    categoria={selectedCategory}
                    gameConfig={tournament.gameConfig}
                    isReadOnly={true} // Sempre read-only no modo viewer
                    onUpdateScore={() => {}} // Desabilitado
                    onFinalizeMatch={() => {}} // Desabilitado
                    onReopenMatch={() => {}} // Desabilitado
                    onUndoTiebreak={() => {}} // Desabilitado
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Grupos */}
        {groupsInSelectedPhase.length > 0 ? (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {groupsInSelectedPhase.map((group) => {
              const ranking = getGroupRanking(group.id);
              // Verificar se a fase está completa: todos os grupos da fase devem ter todos os jogos finalizados
              const phaseGroups = (tournament.grupos || []).filter(
                g => g.categoria === selectedCategory && g.fase === selectedPhase
              );
              const groupPhaseComplete = phaseGroups.length > 0 && phaseGroups.every(g => 
                g.matches.every(m => m.isFinished)
              );

              return (
                <GroupCard
                  key={group.id}
                  group={group}
                  ranking={ranking}
                  gameConfig={tournament.gameConfig}
                  viewMode={viewMode}
                  isReadOnly={true} // Sempre read-only no modo viewer
                  isPhaseComplete={groupPhaseComplete} // Indica se a fase está completa
                  onUpdateScore={() => {}} // Desabilitado
                  onFinalizeMatch={() => {}} // Desabilitado
                  onReopenMatch={() => {}} // Desabilitado
                  onRemoveMatch={() => {}} // Desabilitado
                  onResolveTieManual={() => {}} // Desabilitado
                  onResolveTieManualOrder={() => {}} // Desabilitado
                  onResolveTieRandom={() => {}} // Desabilitado
                  onGenerateSingles={() => {}} // Desabilitado
                  onUndoTiebreak={() => {}} // Desabilitado
                  onChangeViewMode={setViewMode}
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
              <p className="text-gray-600 dark:text-gray-400">
                {selectedCategory
                  ? `Não há grupos na categoria "${selectedCategory}" para a Fase ${selectedPhase}.`
                  : 'Aguardando formação de grupos.'}
              </p>
            </div>
          </div>
        )}

        {/* Info Stats */}
        {groupsInCategory.length > 0 && (
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {groupsInCategory.length}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Grupos Ativos
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {groupsInCategory.reduce((sum, g) => sum + g.matches.length, 0)}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Partidas Geradas
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {groupsInCategory.reduce(
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
