/**
 * Dashboard Page
 * Página principal com visualização dos grupos e jogos
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useTournament } from '@/hooks/useTournament';
import { GroupCard } from '@/components/GroupCard';
import { PhaseAdvanceCard } from '@/components/PhaseAdvanceCard';
import { CrossGroupTiebreakerCard } from '@/components/CrossGroupTiebreakerCard';
import { detectCrossGroupTies } from '@/services/phaseGenerator';

export default function Home() {
  const [isMounted, setIsMounted] = useState(false);
  
  const {
    tournament,
    updateMatchScore,
    finalizeMatch,
    reopenMatch,
    removeMatch,
    getGroupRanking,
    resolveTieManual,
    resolveTieManualOrder,
    resolveTieRandom,
    generateSinglesMatch,
    undoTiebreak,
    resolveCrossGroupTieManual,
    resolveCrossGroupTieRandom,
    generateCrossGroupSinglesMatch,
    undoCrossGroupTiebreak,
    advanceToNextPhase,
    getPhaseAdvancePreview,
    isPhaseComplete,
    hasPendingTies,
    getMaxPhase,
    isFinalPhase,
  } = useTournament();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<string>(
    tournament.categorias[0] || ''
  );

  const [viewMode, setViewMode] = useState<'classificacao' | 'jogos'>('classificacao');
  const [selectedPhase, setSelectedPhase] = useState<number>(1); // Estado para a fase selecionada
  
  // Refs para rastrear mudanças e evitar atualizações desnecessárias
  const lastCategoryRef = useRef<string>('');
  const lastMaxPhaseRef = useRef<number>(0);

  // Filtra e ordena grupos pela fase
  const groupsInCategory = tournament.grupos
    .filter((g) => g.categoria === selectedCategory)
    .sort((a, b) => a.fase - b.fase);

  // Atualizar selectedPhase apenas quando necessário (mudança de categoria ou nova fase criada)
  useEffect(() => {
    if (selectedCategory) {
      const maxPhase = getMaxPhase(selectedCategory);
      const categoryChanged = lastCategoryRef.current !== selectedCategory;
      const newPhaseCreated = maxPhase > lastMaxPhaseRef.current && lastMaxPhaseRef.current > 0;
      
      // Atualiza refs
      lastCategoryRef.current = selectedCategory;
      lastMaxPhaseRef.current = maxPhase;
      
      // Só atualiza selectedPhase se:
      // 1. Categoria mudou (sempre mostra fase máxima da nova categoria)
      // 2. Nova fase foi criada (avança automaticamente)
      // 3. Fase selecionada não existe mais ou é futura
      if (categoryChanged) {
        // Mudou de categoria: mostra fase máxima da nova categoria
        if (maxPhase > 0) {
          setSelectedPhase(maxPhase);
        } else {
          setSelectedPhase(1);
        }
      } else if (newPhaseCreated) {
        // Nova fase criada: avança automaticamente
        setSelectedPhase(maxPhase);
      } else {
        // Verifica se a fase selecionada ainda é válida
        const currentPhaseHasGroups = groupsInCategory.some(g => g.fase === selectedPhase);
        if (!currentPhaseHasGroups && maxPhase > 0) {
          // Fase selecionada não tem mais grupos, vai para a máxima disponível
          setSelectedPhase(maxPhase);
        } else if (selectedPhase > maxPhase && maxPhase > 0) {
          // Fase selecionada é futura, vai para a máxima disponível
          setSelectedPhase(maxPhase);
        } else if (maxPhase === 0 && selectedPhase !== 1) {
          // Não há grupos, volta para Fase 1
          setSelectedPhase(1);
        }
      }
    }
  }, [selectedCategory, tournament.grupos, groupsInCategory, selectedPhase, getMaxPhase]);

  // Filtrar grupos normais (excluir grupos de desempate cross-group)
  const groupsInSelectedPhase = groupsInCategory.filter(
    g => g.fase === selectedPhase && !g.nome.startsWith('DESEMPATE_CROSS_GROUP_')
  );
  
  // Encontrar desempates cross-group para a fase selecionada
  const crossGroupTiebreaks = (tournament.crossGroupTiebreaks || []).filter(
    t => t.phase === selectedPhase
  );

  const handleFinalizeMatch = (groupId: string, matchId: string, sets: typeof tournament.grupos[0]['matches'][0]['sets']) => {
    finalizeMatch(groupId, matchId, sets);
  };

  const handleGenerateSingles = (groupId: string, player1Id: string, player2Id: string) => {
    // Apenas gera a partida (sem mudar aba ou mostrar alert)
    generateSinglesMatch(groupId, player1Id, player2Id);
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

          {/* Navegação de Fases (Sempre visível) */}
          {groupsInCategory.length > 0 && (
            <div className="mt-4">
              <div className="flex gap-1 overflow-x-auto pb-2">
                {[1, 2, 3].map((phase) => {
                  const phaseGroupsExist = groupsInCategory.some(g => g.fase === phase);
                  const maxPhase = getMaxPhase(selectedCategory);
                  const isLocked = phase > maxPhase; // Só bloqueia fases futuras
                  const isCurrent = phase === selectedPhase;
                  const isCompleted = phase < maxPhase; // Fase já passou
                  // Desabilita se for fase futura OU se não existir grupos nessa fase
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
                      {isCompleted && phaseGroupsExist && <span className="ml-1 text-xs">✓</span>}
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

        {/* Botão de Concluir Fase / Torneio */}
        {selectedPhase === getMaxPhase(selectedCategory) && 
         isPhaseComplete(selectedCategory, selectedPhase) && 
         !(selectedPhase === 3 && tournament.completedCategories?.includes(selectedCategory)) && (
          <div className="mb-6">
            <PhaseAdvanceCard
              categoria={selectedCategory}
              currentPhase={selectedPhase}
              preview={getPhaseAdvancePreview(selectedCategory, selectedPhase)}
              hasPendingTies={hasPendingTies(selectedCategory, selectedPhase)}
              onAdvance={() => advanceToNextPhase(selectedCategory, selectedPhase)}
              resolveCrossGroupTieManual={resolveCrossGroupTieManual}
              resolveCrossGroupTieRandom={resolveCrossGroupTieRandom}
              generateCrossGroupSinglesMatch={generateCrossGroupSinglesMatch}
              tournament={tournament}
            />
          </div>
        )}

        {/* Mostrar campeão se fase 3 está completa, sem desempates pendentes E categoria foi concluída */}
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
            <div className="text-2xl font-bold text-white bg-black/20 rounded-lg py-4 px-6 inline-block mb-6">
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
            <button
              onClick={() => {
                import('@/services/pdfService').then(({ generateTournamentPDF }) => {
                  generateTournamentPDF(tournament, selectedCategory, getGroupRanking);
                });
              }}
              className="px-6 py-3 bg-white hover:bg-gray-100 text-orange-600 font-bold rounded-lg transition-colors shadow-lg flex items-center gap-2 mx-auto"
            >
              <span>📄</span>
              <span>Gerar PDF do Torneio</span>
            </button>
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
                // Encontrar a partida se existir
                const tiebreakGroup = tournament.grupos.find(
                  g => g.nome.startsWith('DESEMPATE_CROSS_GROUP_') && 
                       g.categoria === selectedCategory && 
                       g.fase === tiebreak.phase
                );
                const tiebreakMatch = tiebreak.matchId && tiebreakGroup
                  ? tiebreakGroup.matches.find(m => m.id === tiebreak.matchId)
                  : undefined;
                
                // Funções auxiliares para partidas de desempate cross-group
                const handleCrossGroupUpdateScore = (matchId: string, sets: typeof tournament.grupos[0]['matches'][0]['sets']) => {
                  if (tiebreakGroup) {
                    updateMatchScore(tiebreakGroup.id, matchId, sets);
                  }
                };
                
                const handleCrossGroupFinalizeMatch = (matchId: string, sets: typeof tournament.grupos[0]['matches'][0]['sets']) => {
                  if (tiebreakGroup) {
                    finalizeMatch(tiebreakGroup.id, matchId, sets);
                  }
                };
                
                const handleCrossGroupReopenMatch = (matchId: string) => {
                  if (tiebreakGroup) {
                    reopenMatch(tiebreakGroup.id, matchId);
                  }
                };
                
                const maxPhase = getMaxPhase(selectedCategory);
                const isReadOnly = selectedPhase < maxPhase;
                
                return (
                  <CrossGroupTiebreakerCard
                    key={`tiebreak-${tiebreak.phase}-${tiebreak.position}-${index}`}
                    tiebreak={tiebreak}
                    tournament={tournament}
                    categoria={selectedCategory}
                    gameConfig={tournament.gameConfig}
                    isReadOnly={isReadOnly}
                    onUpdateScore={handleCrossGroupUpdateScore}
                    onFinalizeMatch={handleCrossGroupFinalizeMatch}
                    onReopenMatch={handleCrossGroupReopenMatch}
                    onUndoTiebreak={undoCrossGroupTiebreak}
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
              const maxPhase = getMaxPhase(selectedCategory);
              const isReadOnly = selectedPhase < maxPhase; // Fase anterior = read-only

              return (
                <GroupCard
                  key={group.id}
                  group={group}
                  ranking={ranking}
                  gameConfig={tournament.gameConfig}
                  viewMode={viewMode}
                  isReadOnly={isReadOnly}
                  onUpdateScore={updateMatchScore}
                  onFinalizeMatch={handleFinalizeMatch}
                  onReopenMatch={reopenMatch}
                  onRemoveMatch={removeMatch}
                  onResolveTieManual={resolveTieManual}
                  onResolveTieManualOrder={resolveTieManualOrder}
                  onResolveTieRandom={resolveTieRandom}
                  onGenerateSingles={handleGenerateSingles}
                  onUndoTiebreak={undoTiebreak}
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
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {selectedCategory
                  ? `Não há grupos na categoria "${selectedCategory}" para a Fase ${selectedPhase}. Adicione jogadores e forme grupos nas configurações.`
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

        {/* Info Stats (filtradas pela categoria selecionada) */}
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
