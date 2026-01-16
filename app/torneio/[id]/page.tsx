/**
 * Tournament Viewer Page
 * Página de visualização compartilhada do torneio (modo somente leitura)
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTournamentSync } from '@/hooks/useTournamentSync';
import { ShareTournament } from '@/components/ShareTournament';
import { GroupCard } from '@/components/GroupCard';
import { CrossGroupTiebreakerCard } from '@/components/CrossGroupTiebreakerCard';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import type { Tournament } from '@/types';
import { createEmptyTournament } from '@/services/backupService';
import {
  getMaxPhase as getMaxPhaseService,
  isPhaseComplete as isPhaseCompleteService,
  hasPendingTies as hasPendingTiesService,
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
  // Persistir fase selecionada no localStorage (chave única por torneio)
  const phaseStorageKey = tournamentId ? `beachtennis-viewer-phase-${tournamentId}` : 'beachtennis-viewer-phase';
  const [selectedPhase, setSelectedPhase] = useLocalStorage<number>(phaseStorageKey, 1);
  const [showShareModal, setShowShareModal] = useState(false);

  // Estado para controlar se o torneio não foi encontrado
  const [tournamentNotFound, setTournamentNotFound] = useState(false);
  
  // Ref para rastrear se já selecionamos a categoria inicialmente (evitar loops)
  const hasSelectedInitialCategory = useRef(false);
  // Ref para rastrear a última lista de categorias processada (evitar loops)
  const lastProcessedCategories = useRef<string[]>([]);
  // Ref para rastrear o valor atual de selectedCategory (evitar dependências circulares)
  const selectedCategoryRef = useRef<string>('');
  
  // Atualizar ref sempre que selectedCategory mudar
  useEffect(() => {
    selectedCategoryRef.current = selectedCategory;
  }, [selectedCategory]);

  // Callback para atualizar torneio (usar useCallback para evitar recriação)
  const handleTournamentUpdate = useCallback((updatedTournament: Tournament) => {
    // IMPORTANTE: Substituir completamente o estado, não fazer merge
    // Garantir que as categorias mantêm a ordem original (não ordenar)
    // O array já vem na ordem correta da configuração
    // Criar um novo objeto para garantir que o React detecte a mudança
    const newTournament = {
      ...updatedTournament,
      categorias: [...updatedTournament.categorias], // Criar novo array para garantir imutabilidade
    };
    
    setTournament((prevTournament) => {
      // Verificar se realmente mudou para evitar atualizações desnecessárias
      const prevCategorias = JSON.stringify(prevTournament.categorias || []);
      const newCategorias = JSON.stringify(newTournament.categorias || []);
      const prevGrupos = JSON.stringify(prevTournament.grupos || []);
      const newGrupos = JSON.stringify(newTournament.grupos || []);
      
      // Se nada mudou, retornar o estado anterior (evita re-render)
      if (prevCategorias === newCategorias && prevGrupos === newGrupos && 
          prevTournament.nome === newTournament.nome) {
        return prevTournament;
      }
      
      return newTournament;
    });
    
    setTournamentNotFound(false);
    
    // Usar ref para evitar dependências circulares
    const currentCategory = selectedCategoryRef.current;
    const categorias = Array.isArray(newTournament.categorias) ? newTournament.categorias : [];
    
    // Se a categoria selecionada não existe mais no novo torneio, limpar
    if (currentCategory && categorias.length > 0 && !categorias.includes(currentCategory)) {
      setSelectedCategory('');
      hasSelectedInitialCategory.current = false;
    }
    
    // Selecionar primeira categoria automaticamente se ainda não foi selecionada
    // IMPORTANTE: Fazer isso aqui para garantir que usamos a ordem correta do servidor
    if (!hasSelectedInitialCategory.current && categorias.length > 0) {
      const primeiraCategoria = categorias[0];
      if (primeiraCategoria) {
        setSelectedCategory(primeiraCategoria);
        hasSelectedInitialCategory.current = true;
      }
    }
  }, []); // Array vazio - não depende de nada que mude

  // Usar SWR para buscar dados (modo viewer)
  const { syncStatus, viewerError } = useTournamentSync({
    tournament,
    tournamentId,
    isAdmin: false,
    onTournamentUpdate: handleTournamentUpdate,
  });

  // Verificar erro do SWR (torneio não encontrado)
  useEffect(() => {
    if (viewerError) {
      // Se o erro é 404, o torneio não existe
      if (viewerError.status === 404 || (viewerError.response?.status === 404)) {
        setTournamentNotFound(true);
      }
    } else if (isMounted && tournamentId) {
      // Se não há erro mas também não há dados após um tempo, verificar
      const timer = setTimeout(() => {
        // Se após 3 segundos o torneio ainda estiver vazio (sem categorias), verificar se existe
        if (tournament && (!tournament.categorias || tournament.categorias.length === 0)) {
          fetch(`/api/load?id=${tournamentId}`)
            .then(res => {
              if (res.status === 404) {
                setTournamentNotFound(true);
              }
            })
            .catch(() => {
              // Ignorar erros de rede
            });
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isMounted, tournamentId, tournament, viewerError]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Limpar categoria selecionada se ela não existir mais no torneio
  // Isso evita problemas quando o torneio muda de categorias padrão para categorias reais
  useEffect(() => {
    if (!isMounted) return;
    
    const categorias = Array.isArray(tournament.categorias) ? tournament.categorias : [];
    
    // Só processar se as categorias mudaram (evitar processamento desnecessário)
    // Comparar arrays de forma mais eficiente
    const categoriesString = JSON.stringify(categorias);
    const lastCategoriesString = JSON.stringify(lastProcessedCategories.current);
    
    if (categoriesString === lastCategoriesString) return;
    
    lastProcessedCategories.current = [...categorias];
    
    // Se há uma categoria selecionada mas ela não existe mais no torneio, limpar
    const currentCategory = selectedCategoryRef.current;
    if (currentCategory && categorias.length > 0 && !categorias.includes(currentCategory)) {
      setSelectedCategory('');
      hasSelectedInitialCategory.current = false; // Resetar para permitir nova seleção
    }
  }, [isMounted, tournament.categorias]); // Removido selectedCategory das dependências para evitar loop

  // Selecionar primeira categoria automaticamente quando torneio for carregado
  // IMPORTANTE: Usar a primeira categoria na ordem definida na configuração (não ordenar alfabeticamente)
  // Esta lógica é um fallback caso a seleção no onTournamentUpdate não funcione
  useEffect(() => {
    // Só processar se o torneio estiver montado e tiver categorias
    if (!isMounted) return;
    
    // Se já selecionamos a categoria inicialmente, não fazer nada
    if (hasSelectedInitialCategory.current) return;
    
    // Garantir que estamos usando o array original, sem ordenação
    // O array tournament.categorias já vem na ordem correta definida na configuração
    const categorias = Array.isArray(tournament.categorias) ? tournament.categorias : [];
    
    // IMPORTANTE: Só selecionar se o torneio não for o vazio padrão
    // O torneio vazio tem categorias padrão ['Iniciante', 'Normal']
    // Se o torneio tem grupos ou tem categorias diferentes das padrão, é um torneio real
    const isDefaultTournament = categorias.length === 2 && 
      categorias.includes('Iniciante') && 
      categorias.includes('Normal') &&
      (!tournament.grupos || tournament.grupos.length === 0);
    
    // Se é o torneio padrão vazio, não selecionar ainda (aguardar dados reais)
    if (isDefaultTournament) return;
    
    // Se há categorias disponíveis e nenhuma está selecionada
    // Usar o ref para evitar dependências circulares
    const currentCategory = selectedCategoryRef.current;
    if (categorias.length > 0 && !currentCategory) {
      // Selecionar a primeira categoria na ordem original do array (ordem da configuração)
      // IMPORTANTE: Não aplicar nenhuma ordenação - usar exatamente a ordem do array
      // A primeira categoria (índice 0) é a primeira na ordem definida na configuração
      const primeiraCategoria = categorias[0];
      if (primeiraCategoria) {
        setSelectedCategory(primeiraCategoria);
        hasSelectedInitialCategory.current = true;
      }
    }
  }, [isMounted, tournament.categorias, tournament.grupos]); // Removido selectedCategory das dependências para evitar loop

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

  // Verificar se a categoria selecionada é válida
  const categorias = Array.isArray(tournament.categorias) ? tournament.categorias : [];
  const isValidCategory = selectedCategory && categorias.includes(selectedCategory);

  // Validar e ajustar fase selecionada quando categoria ou torneio mudar
  useEffect(() => {
    if (!isMounted || !isValidCategory) return;
    
    const maxPhase = getMaxPhase(selectedCategory);
    
    // Se a fase selecionada é maior que a fase máxima disponível, ajustar para a fase máxima
    if (selectedPhase > maxPhase && maxPhase > 0) {
      setSelectedPhase(maxPhase);
    }
    // Se a fase selecionada é menor que 1, ajustar para 1
    else if (selectedPhase < 1) {
      setSelectedPhase(1);
    }
  }, [isMounted, isValidCategory, selectedCategory, selectedPhase, setSelectedPhase, tournament.grupos]);

  // Filtra e ordena grupos pela fase
  // Proteção: garantir que grupos seja sempre um array e que a categoria seja válida
  const groupsInCategory = isValidCategory
    ? (tournament.grupos || [])
        .filter((g) => g.categoria === selectedCategory)
        .sort((a, b) => a.fase - b.fase)
    : [];

  // Filtrar grupos normais (excluir grupos de desempate cross-group)
  const groupsInSelectedPhase = isValidCategory
    ? groupsInCategory.filter(
        g => g.fase === selectedPhase && !g.nome.startsWith('DESEMPATE_CROSS_GROUP_')
      )
    : [];

  // Encontrar desempates cross-group para a fase selecionada
  const crossGroupTiebreaks = (tournament.crossGroupTiebreaks || []).filter(
    t => t.phase === selectedPhase
  );

  // Verificar se há empates pendentes dentro dos grupos da fase atual (apenas para UI informativa)
  const hasPendingInGroupTiebreaks = (() => {
    for (const group of groupsInSelectedPhase) {
      const ranking = calculateRanking(group);
      const ties = detectTies(ranking);
      
      // Se há empates detectados não resolvidos
      if (ties.length > 0) {
        return true;
      }
      
      // Se há partidas de desempate pendentes
      const pendingTiebreakerMatches = group.matches.filter(m => m.isTiebreaker && !m.isFinished);
      if (pendingTiebreakerMatches.length > 0) {
        return true;
      }
    }
    return false;
  })();


  // Evita erro de hydration
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

  // Se o torneio não foi encontrado
  if (tournamentNotFound) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        <div className="max-w-full mx-auto px-6 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <div className="max-w-md mx-auto">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Torneio não encontrado
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                O torneio que você está tentando acessar não existe mais ou não está disponível.
              </p>
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-left">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                  Isso pode ocorrer quando:
                </p>
                <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1 list-disc list-inside">
                  <li>O administrador desativou o compartilhamento do torneio</li>
                  <li>O torneio foi excluído do servidor</li>
                  <li>O link compartilhado está incorreto ou expirado</li>
                  <li>O torneio não foi sincronizado ainda</li>
                </ul>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
                Entre em contato com o administrador do torneio para obter um novo link de acesso.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Se não há torneio carregado ainda (mas não é erro de não encontrado)
  if (!tournament || !Array.isArray(tournament.categorias) || tournament.categorias.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        <div className="max-w-full mx-auto px-6 py-8">
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
      <div className="max-w-full mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {tournament.nome}
                </h1>
                {/* Badge Espectador com ícone de compartilhar clicável */}
                <button
                  onClick={() => setShowShareModal(true)}
                  className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full flex items-center gap-1.5 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer"
                >
                  <span>🔗</span>
                  <span>Espectador</span>
                </button>
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
                  const maxPhase = isValidCategory ? getMaxPhase(selectedCategory) : 0;
                  const isLocked = isValidCategory && phase > maxPhase;
                  const isCurrent = phase === selectedPhase;
                  const isCompleted = isValidCategory && phase < maxPhase; // Fase já passou
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

        {/* Mostrar campeão se fase 3 está completa */}
        {isValidCategory &&
          selectedPhase === 3 &&
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
            <div className="grid gap-8 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(500px,698px))]">
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
          <div className="grid gap-8 grid-cols-[repeat(auto-fit,minmax(280px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(500px,698px))]">
            {groupsInSelectedPhase.map((group) => {
              const ranking = getGroupRanking(group.id);
              // Verificar se a fase está realmente concluída (foi avançada):
              // - Para Fase 1 e 2: fase está concluída se existe uma fase seguinte (getMaxPhase > selectedPhase)
              // - Para Fase 3: fase está concluída se a categoria está em completedCategories
              const maxPhase = isValidCategory ? getMaxPhase(selectedCategory) : 0;
              const isPhaseActuallyComplete = isValidCategory && (selectedPhase === 3
                ? (tournament.completedCategories || []).includes(selectedCategory)
                : maxPhase > selectedPhase);

              return (
                <GroupCard
                  key={group.id}
                  group={group}
                  ranking={ranking}
                  gameConfig={tournament.gameConfig}
                  viewMode={viewMode}
                  isReadOnly={true} // Sempre read-only no modo viewer
                  isPhaseComplete={isPhaseActuallyComplete} // Indica se a fase está realmente concluída
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
                {selectedCategory && tournament.categorias.includes(selectedCategory)
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
      {/* Modal de Compartilhamento (espectador) */}
      {showShareModal && (
        <ShareTournament
          onClose={() => setShowShareModal(false)}
          tournamentId={tournamentId}
          isViewer={true}
        />
      )}
    </main>
  );
}
