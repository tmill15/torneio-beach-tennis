/**
 * Config Page
 * Tela de configuração do torneio
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTournament } from '@/hooks/useTournament';
import { GameConfigForm } from '@/components/GameConfigForm';
import { BackupPanel } from '@/components/BackupPanel';
import { getWaitingListStats } from '@/services/enrollmentService';
import { validateThreePhaseTournament } from '@/services/phaseValidation';

export default function ConfigPage() {
  const [isMounted, setIsMounted] = useState(false);
  
  const {
    tournament,
    updateTournamentName,
    addCategory,
    removeCategory,
    moveCategoryUp,
    moveCategoryDown,
    updateGameConfig,
    addPlayer,
    removePlayer,
    formGroups,
    resetAndRedrawGroups,
    importTournament,
    getMaxPhase,
  } = useTournament();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(tournament.categorias[0] || '');
  const [isPlayerSeed, setIsPlayerSeed] = useState(false);
  const [activeTab, setActiveTab] = useState<'espera' | 'torneio'>('torneio');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Atualiza selectedCategory se não estiver mais nas categorias disponíveis
  useEffect(() => {
    if (!tournament.categorias.includes(selectedCategory) && tournament.categorias.length > 0) {
      setSelectedCategory(tournament.categorias[0]);
    }
  }, [tournament.categorias, selectedCategory]);

  const waitingListStats = getWaitingListStats(tournament);

  const handleAddCategory = () => {
    if (newCategoryName.trim() && !tournament.categorias.includes(newCategoryName.trim())) {
      addCategory(newCategoryName.trim());
      setNewCategoryName('');
    }
  };

  const handleAddPlayer = () => {
    if (newPlayerName.trim() && selectedCategory) {
      addPlayer(newPlayerName.trim(), selectedCategory, isPlayerSeed);
      setNewPlayerName('');
      setIsPlayerSeed(false);
    }
  };

  const handleFormGroups = (categoria: string) => {
    const waitingCount = tournament.waitingList.filter(p => p.categoria === categoria).length;
    const existingPhase1Groups = tournament.grupos.filter(g => g.categoria === categoria && g.fase === 1);
    
    // Verificar se já existem grupos na Fase 1
    if (existingPhase1Groups.length > 0) {
      // Verificar se há jogos com placares registrados
      const hasFinishedMatches = existingPhase1Groups.some(group => 
        group.matches?.some(match => match.isFinished)
      );
      
      if (hasFinishedMatches) {
        alert(
          `⚠️ Não é possível adicionar novos grupos!\n\n` +
          `Existem jogos com placares já registrados nesta categoria.\n\n` +
          `Para adicionar mais jogadores:\n` +
          `1. Use "Resortear Grupos" para reiniciar a Fase 1, OU\n` +
          `2. Aguarde o término do torneio atual`
        );
        return;
      }
      
      // Permitir adicionar grupos adicionais se não há placares
      if (waitingCount < 4) {
        alert(
          `⚠️ Jogadores insuficientes!\n\n` +
          `São necessários pelo menos 4 jogadores na lista de espera para formar um novo grupo.\n` +
          `Você tem ${waitingCount} jogador(es).`
        );
        return;
      }
      
      const groupsToAdd = Math.floor(waitingCount / 4);
      const remaining = waitingCount % 4;
      
      const confirmMessage = 
        `Adicionar ${groupsToAdd} novo(s) grupo(s) à Fase 1?\n\n` +
        `Jogadores na lista de espera: ${waitingCount}\n` +
        `Novos grupos: ${groupsToAdd} grupo(s) de 4\n` +
        (remaining > 0 
          ? `Lista de espera: ${remaining} jogador(es)\n\n`
          : `Todos os jogadores entrarão nos grupos\n\n`) +
        `Os jogadores serão distribuídos nos novos grupos.\n\n` +
        `Continuar?`;
      
      if (window.confirm(confirmMessage)) {
        formGroups(categoria, 1);
      }
      return;
    }
    
    // Primeira formação de grupos - validar estrutura de 3 fases
    const validation = validateThreePhaseTournament(waitingCount);
    
    if (!validation.isValid) {
      alert(
        `⚠️ Impossível formar torneio de 3 fases!\n\n` +
        `${validation.blockingReason}\n\n` +
        `Ajuste o número de jogadores antes de continuar.`
      );
      return;
    }
    
    // Preview do caminho
    const pathPreview = validation.path.map(p => 
      `Fase ${p.phase}: ${p.groups} grupo${p.groups > 1 ? 's' : ''} de ${p.playersPerGroup}\n` +
      `   → ${p.qualificationRule}`
    ).join('\n\n');
    
    // Calcular jogadores que ficarão na lista de espera
    const groupsPlayers = validation.path[0].groups * 4;
    const waitingListPlayers = waitingCount - groupsPlayers;
    
    const confirmMessage = 
      `Formar torneio de 3 fases para "${categoria}"?\n\n` +
      `Total de inscritos: ${waitingCount} jogadores\n` +
      (waitingListPlayers > 0 
        ? `Jogarão: ${groupsPlayers} jogadores\n` +
          `Lista de espera: ${waitingListPlayers} jogadores\n\n` +
          `(Jogadores na lista de espera aguardarão próximo torneio)\n\n`
        : `Todos os ${waitingCount} jogadores jogarão\n\n`) +
      `${pathPreview}\n\n` +
      `Continuar?`;
    
    if (window.confirm(confirmMessage)) {
      formGroups(categoria, 1);
    }
  };

  const handleRedrawGroups = (categoria: string) => {
    const phase1Groups = tournament.grupos.filter(g => g.categoria === categoria && g.fase === 1);
    
    if (phase1Groups.length === 0) {
      alert(`Não há grupos na Fase 1 para resortear.`);
      return;
    }
    
    const message = `Tem certeza que deseja resortear a Fase 1?\n\n` +
      `Isso irá:\n` +
      `- Apagar ${phase1Groups.length} grupo(s) da Fase 1\n` +
      `- Apagar todos os jogos e placares desta fase\n` +
      `- Retornar jogadores para lista de espera\n\n` +
      `Esta ação não pode ser desfeita!`;
    
    if (window.confirm(message)) {
      resetAndRedrawGroups(categoria, 1);
    }
  };

  const handleImportPlayers = (players: typeof tournament.waitingList) => {
    players.forEach(player => {
      addPlayer(player.nome, player.categoria, player.isSeed || false);
    });
  };

  // Jogadores na lista de espera da categoria selecionada (para o formulário)
  const waitingPlayers = selectedCategory 
    ? tournament.waitingList.filter(p => p.categoria === selectedCategory)
    : tournament.waitingList;

  // Jogadores já alocados em grupos da categoria selecionada (para o formulário)
  const enrolledPlayers = selectedCategory
    ? tournament.grupos
        .filter(g => g.categoria === selectedCategory)
        .flatMap(g => g.players)
    : tournament.grupos.flatMap(g => g.players);

  // Contadores totais para as abas (todas as categorias)
  const totalWaitingPlayers = tournament.waitingList.length;
  const totalEnrolledPlayers = tournament.grupos.flatMap(g => g.players).length;

  // Evita erro de hydration - só renderiza após montar no cliente
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Configurações
            </h1>
            <Link
              href="/"
              className="px-4 py-2 bg-primary hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
            >
              Ver Dashboard
            </Link>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Configure seu torneio, adicione jogadores e gerencie categorias
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Coluna Esquerda */}
          <div className="space-y-8">
            {/* Nome do Torneio */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Nome do Torneio
              </h2>
              <input
                type="text"
                value={tournament.nome}
                onChange={(e) => updateTournamentName(e.target.value)}
                placeholder="Ex: Torneio Beach Tennis 2026"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
              />
            </div>

            {/* Categorias */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Categorias
              </h2>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  placeholder="Nova categoria"
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />
                <button
                  onClick={handleAddCategory}
                  className="px-4 py-2 bg-primary hover:bg-orange-600 text-white rounded-lg font-medium transition-colors"
                >
                  Adicionar
                </button>
              </div>

              <div className="space-y-2">
                {tournament.categorias.map((cat, index) => (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <span className="text-gray-900 dark:text-white font-medium">{cat}</span>
                    
                    <div className="flex items-center gap-2">
                      {/* Botões de ordenação */}
                      <button
                        onClick={() => moveCategoryUp(cat)}
                        disabled={index === 0}
                        className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Mover para cima"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      
                      <button
                        onClick={() => moveCategoryDown(cat)}
                        disabled={index === tournament.categorias.length - 1}
                        className="p-1 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Mover para baixo"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      
                      {/* Botão de remover */}
                      <button
                        onClick={() => {
                          if (window.confirm(`Remover categoria "${cat}"?`)) {
                            removeCategory(cat);
                          }
                        }}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-2"
                      >
                        Remover
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Configurações de Jogo */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <GameConfigForm
                config={tournament.gameConfig}
                onChange={updateGameConfig}
              />
            </div>
          </div>

          {/* Coluna Direita */}
          <div className="space-y-8">
            {/* Adicionar Jogador */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Adicionar Jogador
              </h2>

              <div className="space-y-4">
                <input
                  type="text"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddPlayer()}
                  placeholder="Nome do jogador"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                />

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  {tournament.categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPlayerSeed}
                    onChange={(e) => setIsPlayerSeed(e.target.checked)}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Marcar como cabeça de chave (Seed)
                  </span>
                </label>

                <button
                  onClick={handleAddPlayer}
                  disabled={!newPlayerName.trim() || !selectedCategory}
                  className="w-full px-4 py-2 bg-primary hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Adicionar à Lista de Espera
                </button>
              </div>
            </div>

            {/* Participantes (com Abas) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Participantes
              </h2>

              {/* Tabs */}
              <div className="mb-6">
                <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setActiveTab('torneio')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      activeTab === 'torneio'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    No Torneio ({totalEnrolledPlayers})
                  </button>
                  <button
                    onClick={() => setActiveTab('espera')}
                    className={`px-4 py-2 font-medium transition-colors ${
                      activeTab === 'espera'
                        ? 'border-b-2 border-primary text-primary'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    Lista de Espera ({totalWaitingPlayers})
                  </button>
                </div>
              </div>

              {/* Conteúdo da Aba: Lista de Espera */}
              {activeTab === 'espera' && (
                <>
                  {Object.entries(waitingListStats).map(([categoria, stats]) => (
                    <div key={categoria} className="mb-6 last:mb-0">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {categoria}
                        </h3>
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {stats.total} jogador{stats.total !== 1 ? 'es' : ''}
                          </span>
                          {stats.canFormGroup && (
                            <button
                              onClick={() => handleFormGroups(categoria)}
                              className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded font-medium transition-colors"
                            >
                              Formar {stats.groupsReady} Grupo{stats.groupsReady !== 1 ? 's' : ''}
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {tournament.waitingList
                          .filter((p) => p.categoria === categoria)
                          .map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                            >
                              <span className="text-gray-900 dark:text-white">
                                {player.nome}
                                {player.isSeed && (
                                  <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                    SEED
                                  </span>
                                )}
                              </span>
                              <button
                                onClick={() => removePlayer(player.id)}
                                className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm"
                              >
                                Remover
                              </button>
                            </div>
                          ))}
                      </div>

                      {stats.remaining > 0 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                          {stats.remaining} jogador{stats.remaining !== 1 ? 'es' : ''} restante{stats.remaining !== 1 ? 's' : ''} (precisa de 4 para formar grupo)
                        </p>
                      )}
                    </div>
                  ))}

                  {tournament.waitingList.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      Nenhum jogador na lista de espera
                    </p>
                  )}
                </>
              )}

              {/* Conteúdo da Aba: No Torneio */}
              {activeTab === 'torneio' && (
                <>
                  {tournament.categorias.map((categoria) => {
                    const groupsInCategory = tournament.grupos.filter(g => g.categoria === categoria);
                    if (groupsInCategory.length === 0) return null;

                    // Coletar todos os jogadores da categoria (de todos os grupos)
                    const playersInCategory = groupsInCategory.flatMap(g => g.players);
                    
                    // Verificar se há grupos em Fase 2 ou superior
                    const hasAdvancedPhases = groupsInCategory.some(g => g.fase >= 2);
                    const canRedraw = !hasAdvancedPhases;

                    return (
                      <div key={categoria} className="mb-6 last:mb-0">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {categoria}
                          </h3>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {playersInCategory.length} jogador{playersInCategory.length !== 1 ? 'es' : ''}
                            </span>
                            <button
                              onClick={() => handleRedrawGroups(categoria)}
                              disabled={!canRedraw}
                              className={`px-3 py-1 text-white text-sm rounded font-medium transition-colors ${
                                canRedraw
                                  ? 'bg-yellow-600 hover:bg-yellow-700 cursor-pointer'
                                  : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-60'
                              }`}
                              title={
                                canRedraw
                                  ? 'Resorteia a Fase 1 e retorna jogadores para a lista de espera'
                                  : 'Não é possível resortear: torneio já avançou para Fase 2 ou superior'
                              }
                            >
                              Resortear Fase 1
                            </button>
                          </div>
                        </div>

                        <div className="space-y-2">
                          {playersInCategory.map((player) => (
                            <div
                              key={player.id}
                              className="flex items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                            >
                              <span className="text-gray-900 dark:text-white">
                                {player.nome}
                                {player.isSeed && (
                                  <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                                    SEED
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {tournament.grupos.length === 0 && (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                      Nenhum grupo formado ainda
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Backup & Restauração */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <BackupPanel 
                tournament={tournament} 
                onImport={importTournament}
                onImportPlayers={handleImportPlayers}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
