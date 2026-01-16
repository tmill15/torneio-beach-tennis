/**
 * Dashboard Page
 * Página principal com visualização dos grupos e jogos
 */

'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTournament } from '@/hooks/useTournament';
import { useTournamentManager } from '@/hooks/useTournamentManager';
import { useTournamentSync } from '@/hooks/useTournamentSync';
import { GroupCard } from '@/components/GroupCard';
import { PhaseAdvanceCard } from '@/components/PhaseAdvanceCard';
import { CrossGroupTiebreakerCard } from '@/components/CrossGroupTiebreakerCard';
import { SyncStatus } from '@/components/SyncStatus';
import { ShareTournament } from '@/components/ShareTournament';
import { detectCrossGroupTies } from '@/services/phaseGenerator';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { SHARING_ENABLED_KEY } from '@/hooks/useTournamentSync';

const ADMIN_TOKEN_KEY = 'beachtennis-admin-token';
const TOURNAMENT_ID_KEY = 'beachtennis-tournament-id'; // Mantido apenas para compatibilidade com hooks

export default function Home() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [adminToken] = useLocalStorage<string | null>(ADMIN_TOKEN_KEY, null);
  const { activeTournamentId, tournamentList, activeTournamentMetadata } = useTournamentManager();
  
  // Determinar chave de sharingEnabled baseada no torneio ativo
  // Usar apenas activeTournamentId (não precisa mais de fallback para compatibilidade)
  const sharingKey = useMemo(() => {
    if (activeTournamentId) {
      return `beachtennis-sharing-enabled-${activeTournamentId}`;
    }
    // Fallback para chave antiga (compatibilidade apenas para migração)
    return SHARING_ENABLED_KEY;
  }, [activeTournamentId]);
  
  const [sharingEnabled, setSharingEnabled] = useLocalStorage<boolean>(sharingKey, false);
  
  const {
    tournament,
    updateTournament,
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
    finalizeTournament,
  } = useTournament();

  // Sincronização (modo admin)
  const isAdmin = !!adminToken;
  
  // Garantir que o tournamentId no localStorage esteja sincronizado com activeTournamentId
  // (necessário apenas para compatibilidade com hooks que ainda usam TOURNAMENT_ID_KEY)
  useEffect(() => {
    if (activeTournamentId && typeof window !== 'undefined') {
      const storedId = localStorage.getItem(TOURNAMENT_ID_KEY);
      if (storedId !== activeTournamentId) {
        localStorage.setItem(TOURNAMENT_ID_KEY, activeTournamentId);
      }
    }
  }, [activeTournamentId]);
  
  const { syncStatus, shareLink, retrySync } = useTournamentSync({
    tournament,
    tournamentId: activeTournamentId || undefined, // Usar apenas activeTournamentId (converter null para undefined)
    isAdmin,
    onTournamentUpdate: (updatedTournament) => {
      updateTournament(() => updatedTournament);
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirecionar para /config se não houver torneios
  useEffect(() => {
    if (isMounted && tournamentList.tournaments.length === 0) {
      router.push('/config');
    }
  }, [isMounted, tournamentList.tournaments.length, router]);

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

  // Calcular preview de classificação (sempre recalcula no render para garantir atualização)
  const shouldShowPhaseAdvance = selectedPhase === getMaxPhase(selectedCategory) && 
    isPhaseComplete(selectedCategory, selectedPhase) && 
    !(selectedPhase === 3 && tournament.completedCategories?.includes(selectedCategory));
  
  const phaseAdvancePreview = shouldShowPhaseAdvance 
    ? getPhaseAdvancePreview(selectedCategory, selectedPhase)
    : null;

  const handleFinalizeMatch = (groupId: string, matchId: string, sets: typeof tournament.grupos[0]['matches'][0]['sets']) => {
    finalizeMatch(groupId, matchId, sets);
  };

  const handleGenerateSingles = (groupId: string, player1Id: string, player2Id: string) => {
    // Apenas gera a partida (sem mudar aba ou mostrar alert)
    generateSinglesMatch(groupId, player1Id, player2Id);
  };

  // Verificar se não há torneios
  const hasNoTournaments = isMounted && tournamentList.tournaments.length === 0;
  const hasNoActiveTournament = isMounted && !activeTournamentId;

  // Evita erro de hydration - só renderiza após montar no cliente
  if (!isMounted) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        <div className="max-w-full mx-auto px-6 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        </div>
      </main>
    );
  }

  // Se não há torneios ou não há torneio ativo, mostrar mensagem
  if (hasNoTournaments || hasNoActiveTournament) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        <div className="max-w-full mx-auto px-6 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {hasNoTournaments ? 'Nenhum torneio encontrado' : 'Nenhum torneio ativo'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {hasNoTournaments
                  ? 'Você ainda não criou nenhum torneio. Crie um novo torneio para começar.'
                  : 'Nenhum torneio está ativo no momento. Selecione ou crie um torneio para começar.'}
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-left mb-6">
                <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-2">
                  Para começar:
                </p>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside">
                  <li>Acesse a página de Configurações</li>
                  <li>Clique em "Gerenciar Torneios"</li>
                  <li>Crie um novo torneio ou selecione um existente</li>
                </ul>
              </div>
              <Link
                href="/config"
                className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                ⚙️ Ir para Configurações
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <div className="max-w-full mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start sm:items-center justify-between mb-4 gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {tournament.nome}
                </h1>
                {activeTournamentMetadata?.status === 'archived' && (
                  <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm font-medium rounded-full flex items-center gap-1.5">
                    <span>📦</span>
                    <span>Torneio Arquivado</span>
                  </span>
                )}
                {/* Indicador de compartilhamento (desktop) */}
                {sharingEnabled && (
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="hidden sm:inline-flex px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full items-center gap-1 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer"
                  >
                    <span>🔗</span>
                    <span>Compartilhado</span>
                  </button>
                )}
              </div>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Painel do Torneio
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3 flex-shrink-0">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Status de sincronização (tablet/desktop - ao lado de Configurações) */}
                {isAdmin && sharingEnabled && (
                  <div className="hidden sm:block">
                    <SyncStatus status={syncStatus} onRetry={retrySync} />
                  </div>
                )}
                
                <Link
                  href="/config"
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors w-full sm:w-auto text-center"
                >
                  ⚙️ Configurações
                </Link>
              </div>
              
              {/* Indicador de compartilhamento e sync (mobile apenas) */}
              {sharingEnabled && (
                <div className="flex flex-col gap-2 w-full sm:hidden">
                  <button
                    onClick={() => setShowShareModal(true)}
                    className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full flex items-center justify-center gap-1.5 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors w-full"
                  >
                    <span>🔗</span>
                    <span>Compartilhado</span>
                  </button>
                  {/* Status de sincronização (mobile - abaixo do botão Compartilhado) */}
                  {/* Reservar espaço mesmo quando não há status para evitar deslocamento */}
                  <div className="flex justify-center min-h-[24px]">
                    {isAdmin && <SyncStatus status={syncStatus} onRetry={retrySync} />}
                  </div>
                </div>
              )}
            </div>
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
         !(selectedPhase === 3 && tournament.completedCategories?.includes(selectedCategory)) && 
         phaseAdvancePreview && (
          <div className="mb-6" key={JSON.stringify(tournament.crossGroupTiebreaks || [])}>
            <PhaseAdvanceCard
              categoria={selectedCategory}
              currentPhase={selectedPhase}
              preview={phaseAdvancePreview}
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
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <button
                onClick={() => {
                  import('@/services/pdfService').then(({ generateTournamentPDF }) => {
                    generateTournamentPDF(tournament, selectedCategory, getGroupRanking);
                  });
                }}
                className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-gray-100 text-orange-600 font-bold rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <span>📄</span>
                <span>Gerar PDF do Torneio</span>
              </button>
              
              <button
                onClick={async () => {
                  const { downloadBackup } = await import('@/services/backupService');
                  await downloadBackup(tournament, selectedCategory);
                }}
                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <span>💾</span>
                <span>Realizar Backup</span>
              </button>
              
              <button
                onClick={() => {
                  const message = `⚠️ ATENÇÃO: Finalizar o torneio da categoria "${selectedCategory}"?\n\n` +
                    `Isso irá:\n` +
                    `- Apagar todos os grupos desta categoria\n` +
                    `- Apagar todos os jogos e placares desta categoria\n` +
                    `- Retornar todos os participantes desta categoria para a lista de espera\n` +
                    `- Limpar desempates e classificações desta categoria\n\n` +
                    `Esta ação não pode ser desfeita!\n\n` +
                    `Deseja continuar?`;
                  
                  if (window.confirm(message)) {
                    finalizeTournament(selectedCategory).catch(console.error);
                  }
                }}
                className="w-full sm:w-auto px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors shadow-lg flex items-center justify-center gap-2"
              >
                <span>🏁</span>
                <span>Finalizar Torneio</span>
              </button>
            </div>
          </div>
        ) : null}

        {/* Desempates Cross-Group */}
        {crossGroupTiebreaks.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Desempates entre Grupos
            </h2>
            <div className="grid gap-8 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(500px,1fr))]">
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
          <div className="grid gap-8 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(500px,1fr))]">
            {groupsInSelectedPhase.map((group) => {
              const ranking = getGroupRanking(group.id);
              const maxPhase = getMaxPhase(selectedCategory);
              const isReadOnly = selectedPhase < maxPhase; // Fase anterior = read-only
              const groupPhaseComplete = isReadOnly ? isPhaseComplete(selectedCategory, selectedPhase) : false;

              return (
                <GroupCard
                  key={group.id}
                  group={group}
                  ranking={ranking}
                  gameConfig={tournament.gameConfig}
                  viewMode={viewMode}
                  isReadOnly={isReadOnly}
                  isPhaseComplete={groupPhaseComplete}
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

      {/* Modal de Compartilhamento (mobile) */}
      {showShareModal && sharingEnabled && (
        <ShareTournament
          onClose={() => setShowShareModal(false)}
          onShareGenerated={(id) => {
            // Tournament ID já é gerenciado pelo ShareTournament via localStorage
          }}
        />
      )}
    </main>
  );
}
