/**
 * Config Page
 * Tela de configuração do torneio
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTournament } from '@/hooks/useTournament';
import { GameConfigForm } from '@/components/GameConfigForm';
import { BackupPanel } from '@/components/BackupPanel';
import { getWaitingListStats } from '@/services/enrollmentService';
import { validateThreePhaseTournament } from '@/services/phaseValidation';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { generateTournamentShare, SHARING_ENABLED_KEY } from '@/hooks/useTournamentSync';
import { ShareTournament } from '@/components/ShareTournament';

const ADMIN_TOKEN_KEY = 'beachtennis-admin-token';
const TOURNAMENT_ID_KEY = 'beachtennis-tournament-id';

export default function ConfigPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);
  const [adminToken, setAdminToken] = useLocalStorage<string | null>(ADMIN_TOKEN_KEY, null);
  const [tournamentId, setTournamentId] = useLocalStorage<string | null>(TOURNAMENT_ID_KEY, null);
  const [sharingEnabled, setSharingEnabled] = useLocalStorage<boolean>(SHARING_ENABLED_KEY, false);
  const [showShareModal, setShowShareModal] = useState(false);
  
  // Gerar adminToken automaticamente se não existir (primeira vez)
  useEffect(() => {
    if (isMounted && !adminToken) {
      // Gerar novo token e tournamentId se não existirem
      const { tournamentId: newTournamentId, adminToken: newAdminToken } = generateTournamentShare();
      setAdminToken(newAdminToken);
      if (!tournamentId) {
        setTournamentId(newTournamentId);
      }
    }
  }, [isMounted, adminToken, tournamentId, setAdminToken, setTournamentId]);

  // Handler para toggle de compartilhamento
  const handleToggleSharing = async (enabled: boolean) => {
    if (enabled) {
      // Ativar: gerar credenciais se não existirem
      if (!tournamentId || !adminToken) {
        const { tournamentId: newId, adminToken: newToken } = generateTournamentShare();
        setTournamentId(newId);
        setAdminToken(newToken);
      }
      setSharingEnabled(enabled);
    } else {
      // Desativar: apagar dados do Redis e salvar estado
      if (tournamentId && adminToken) {
        try {
          // Apagar registro do Redis
          const response = await fetch(`/api/tournament/${tournamentId}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${adminToken}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (!response.ok) {
            console.warn('⚠️ Não foi possível apagar o torneio do Redis:', await response.text());
          } else {
            console.log('✅ Torneio removido do Redis');
          }
        } catch (error) {
          console.error('❌ Erro ao apagar torneio do Redis:', error);
        }
      }
      setSharingEnabled(enabled);
    }
  };
  
  const {
    tournament,
    updateTournamentName,
    addCategory,
    removeCategory,
    updateCategoryName,
    moveCategoryUp,
    moveCategoryDown,
    updateGameConfig,
    addPlayer,
    addMultiplePlayers,
    removePlayer,
    clearWaitingList,
    formGroups,
    resetAndRedrawGroups,
    redrawGroupsInPlace,
    clearCategory,
    importTournament,
    getMaxPhase,
    isPhaseComplete,
  } = useTournament();

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(tournament.categorias[0] || '');
  const [isPlayerSeed, setIsPlayerSeed] = useState(false);
  const [activeTab, setActiveTab] = useState<'espera' | 'torneio'>('torneio');
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState('');
  
  // Estados para modais de export/import
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [exportCategory, setExportCategory] = useState<string>('all');
  const [importCategory, setImportCategory] = useState<string>('');
  const [importOverwrite, setImportOverwrite] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importFileInfo, setImportFileInfo] = useState<{ totalPlayers: number; categoria?: string } | null>(null);

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
      try {
        addPlayer(newPlayerName.trim(), selectedCategory, isPlayerSeed);
        setNewPlayerName('');
        setIsPlayerSeed(false);
      } catch (error) {
        alert(error instanceof Error ? error.message : 'Erro ao adicionar jogador');
      }
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
      
      // Adiciona grupos sem confirmação
      formGroups(categoria, 1);
      return;
    }
    
    // Primeira formação de grupos - validar estrutura de 3 fases
    const validation = validateThreePhaseTournament(waitingCount);
    
    if (!validation.isValid) {
      // Não mostrar alerta - o botão já está desabilitado
      return;
    }
    
    // Forma grupos sem confirmação
    formGroups(categoria, 1);
  };

  const handleRedrawGroups = (categoria: string) => {
    const phase1Groups = tournament.grupos.filter(g => g.categoria === categoria && g.fase === 1);
    
    if (phase1Groups.length === 0) {
      alert(`Não há grupos na Fase 1 para resortear.`);
      return;
    }
    
    const playersCount = phase1Groups.flatMap(g => g.players).length;
    
    const message = `Tem certeza que deseja resortear a Fase 1?\n\n` +
      `Isso irá:\n` +
      `- Apagar ${phase1Groups.length} grupo(s) da Fase 1\n` +
      `- Apagar todos os jogos e placares desta fase\n` +
      `- Resortear os ${playersCount} jogadores em novos grupos\n\n` +
      `⚠️ Os mesmos jogadores permanecerão no torneio (não voltam para lista de espera)\n\n` +
      `Esta ação não pode ser desfeita!`;
    
    if (window.confirm(message)) {
      redrawGroupsInPlace(categoria, 1);
    }
  };

  // Limpar toda a lista de espera de uma categoria
  const handleClearWaitingList = (categoria: string) => {
    const playersInCategory = tournament.waitingList.filter(p => p.categoria === categoria);
    
    if (playersInCategory.length === 0) {
      alert(`Não há jogadores na lista de espera da categoria "${categoria}".`);
      return;
    }

    const message = `⚠️ ATENÇÃO: Remover TODOS os jogadores da lista de espera?\n\n` +
      `Categoria: ${categoria}\n` +
      `Jogadores: ${playersInCategory.length}\n\n` +
      `Esta ação não pode ser desfeita!`;
    
    if (window.confirm(message)) {
      // Limpar toda a lista de espera da categoria em uma única operação
      clearWaitingList(categoria);
    }
  };

  // Limpar todos os jogadores do torneio de uma categoria
  const handleClearTournamentPlayers = (categoria: string) => {
    const groupsInCategory = tournament.grupos.filter(g => g.categoria === categoria);
    
    if (groupsInCategory.length === 0) {
      alert(`Não há grupos na categoria "${categoria}".`);
      return;
    }

    const hasFinishedMatches = groupsInCategory.some(g => 
      g.matches?.some(m => m.isFinished)
    );

    // Verificar se o torneio está completo (Fase 3 finalizada)
    const maxPhase = getMaxPhase(categoria);
    const isTournamentComplete = maxPhase === 3 && isPhaseComplete(categoria, 3);

    // Permitir limpar se o torneio estiver completo, mesmo com jogos finalizados
    if (hasFinishedMatches && !isTournamentComplete) {
      alert(
        `⚠️ Não é possível limpar a categoria!\n\n` +
        `Existem jogos com placares já registrados.\n\n` +
        `Para limpar esta categoria:\n` +
        `1. Use "Resortear Grupos" para resetar apenas a Fase 1, OU\n` +
        `2. Finalize o torneio antes de limpar`
      );
      return;
    }

    const playersCount = groupsInCategory.flatMap(g => g.players).length;

    const message = `⚠️ ATENÇÃO: Remover TODOS os grupos e jogadores do torneio?\n\n` +
      `Categoria: ${categoria}\n` +
      `Grupos: ${groupsInCategory.length}\n` +
      `Jogadores: ${playersCount}\n\n` +
      `Os jogadores retornarão para a lista de espera.\n\n` +
      `Esta ação não pode ser desfeita!`;
    
    if (window.confirm(message)) {
      // Limpar completamente a categoria (remove todos os grupos e retorna jogadores para lista de espera)
      clearCategory(categoria);
    }
  };

  // Export de jogadores com opções
  const handleExportPlayers = () => {
    try {
      let allPlayers: typeof tournament.waitingList = [];
      let categoryLabel = '';

      if (exportCategory === 'all') {
        // Todas as categorias
        const enrolledAll = tournament.grupos.flatMap(g => g.players);
        const waitingAll = tournament.waitingList;
        allPlayers = [...enrolledAll, ...waitingAll];
        categoryLabel = 'Todas';
      } else {
        // Categoria específica
        const enrolledInCategory = tournament.grupos
          .filter(g => g.categoria === exportCategory)
          .flatMap(g => g.players);
        const waitingInCategory = tournament.waitingList
          .filter(p => p.categoria === exportCategory);
        allPlayers = [...enrolledInCategory, ...waitingInCategory];
        categoryLabel = exportCategory;
      }

      if (allPlayers.length === 0) {
        alert(`Não há jogadores para exportar.`);
        return;
      }

      const playersData = {
        exportDate: new Date().toISOString(),
        categoria: exportCategory === 'all' ? 'Todas' : exportCategory,
        totalPlayers: allPlayers.length,
        players: allPlayers.map(p => ({
          nome: p.nome,
          categoria: p.categoria,
          isSeed: p.isSeed || false,
        })),
      };

      const dataStr = JSON.stringify(playersData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const filename = `jogadores-${categoryLabel.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setShowExportModal(false);
    } catch (err) {
      alert('Erro ao exportar jogadores');
      console.error(err);
    }
  };

  const handleImportFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Lê o arquivo para verificar a categoria
      const json = await file.text();
      const data = JSON.parse(json);
      
      // Valida estrutura básica
      if (!data.players || !Array.isArray(data.players)) {
        alert('Arquivo inválido: campo "players" não encontrado ou não é um array.');
        e.target.value = '';
        return;
      }
      
      // Tenta usar a categoria do arquivo, se existir e for válida
      let defaultCategory = selectedCategory;
      if (data.categoria && tournament.categorias.includes(data.categoria)) {
        defaultCategory = data.categoria;
      } else if (data.categoria) {
        console.warn(`Categoria "${data.categoria}" do arquivo não existe. Usando "${selectedCategory}"`);
      }
      
      setImportFile(file);
      setImportCategory(defaultCategory);
      setImportFileInfo({
        totalPlayers: data.players.length,
        categoria: data.categoria
      });
      setShowImportModal(true);
    } catch (err) {
      console.error('Erro ao ler arquivo:', err);
      alert(`Erro ao ler o arquivo:\n\n${err instanceof Error ? err.message : 'Erro desconhecido'}\n\nVerifique se é um JSON válido.`);
    }
    
    // Limpa input
    e.target.value = '';
  };

  const handleImportPlayers = async () => {
    if (!importFile) {
      alert('Nenhum arquivo selecionado');
      return;
    }

    try {
      console.log('📤 Iniciando importação...', importFile.name);
      
      const json = await importFile.text();
      console.log('📄 Arquivo lido, tamanho:', json.length);
      
      const data = JSON.parse(json);
      console.log('✅ JSON parseado:', data);

      // Validação básica
      if (!data.players || !Array.isArray(data.players)) {
        alert(`Arquivo de jogadores inválido.\n\nEsperado: campo "players" (array)\nRecebido: ${JSON.stringify(Object.keys(data))}`);
        console.error('Estrutura inválida:', data);
        return;
      }

      if (data.players.length === 0) {
        alert('O arquivo não contém jogadores para importar.');
        return;
      }

      const targetCategory = importCategory || selectedCategory;
      
      if (!targetCategory) {
        alert('Por favor, selecione uma categoria de destino.');
        return;
      }

      console.log(`🎯 Importando ${data.players.length} jogador(es) para categoria "${targetCategory}"`);

      // Se sobrescrever, remover jogadores existentes
      if (importOverwrite) {
        console.log('🗑️ Modo sobrescrever ativo, removendo jogadores existentes...');
        
        // Remover da lista de espera
        const playersToRemove = tournament.waitingList
          .filter(p => p.categoria === targetCategory);
        console.log(`Removendo ${playersToRemove.length} jogador(es) da lista de espera`);
        playersToRemove.forEach(p => removePlayer(p.id));

        // Remover grupos da categoria (resortear Fase 1)
        const phase1Groups = tournament.grupos.filter(
          g => g.categoria === targetCategory && g.fase === 1
        );
        if (phase1Groups.length > 0) {
          console.log(`Removendo ${phase1Groups.length} grupo(s) da Fase 1`);
          resetAndRedrawGroups(targetCategory, 1);
        }
      }

      // Adicionar jogadores de uma vez (evita problemas de estado)
      let skippedCount = 0;
      let duplicateCount = 0;
      
      const playersToAdd = data.players
        .filter((p: any) => {
          if (!p.nome || p.nome.trim() === '') {
            console.warn('Jogador sem nome ignorado:', p);
            skippedCount++;
            return false;
          }
          
          // Verifica duplicatas antes de adicionar
          const normalizedName = p.nome.trim().toLowerCase();
          const isDuplicate = tournament.waitingList.some(
            w => w.categoria === targetCategory && w.nome.trim().toLowerCase() === normalizedName
          ) || tournament.grupos.some(group => 
            group.categoria === targetCategory &&
            group.players.some(
              player => player.nome.trim().toLowerCase() === normalizedName
            )
          );
          
          if (isDuplicate) {
            console.warn(`Jogador duplicado ignorado: "${p.nome}" na categoria "${targetCategory}"`);
            duplicateCount++;
            return false;
          }
          
          return true;
        })
        .map((p: any) => ({
          nome: p.nome.trim(),
          categoria: targetCategory,
          isSeed: p.isSeed || false,
        }));

      // Adiciona todos os jogadores de uma vez
      if (playersToAdd.length > 0) {
        console.log(`Adicionando ${playersToAdd.length} jogador(es) de uma vez...`);
        addMultiplePlayers(playersToAdd);
      }

      const addedCount = playersToAdd.length;
      const totalSkipped = skippedCount + duplicateCount;
      console.log(`✅ Importação concluída: ${addedCount} adicionado(s), ${totalSkipped} ignorado(s) (${skippedCount} sem nome, ${duplicateCount} duplicados)`);

      setShowImportModal(false);
      setImportFile(null);
      setImportFileInfo(null);
      setImportOverwrite(false);
      
      const skippedMessages = [];
      if (skippedCount > 0) skippedMessages.push(`${skippedCount} sem nome`);
      if (duplicateCount > 0) skippedMessages.push(`${duplicateCount} duplicado(s)`);
      const skippedText = skippedMessages.length > 0 ? `\n\n⚠️ ${skippedMessages.join(', ')} ignorado(s).` : '';
      
      const message = addedCount > 0
        ? `✅ ${addedCount} jogador(es) importado(s) com sucesso para "${targetCategory}"!${skippedText}`
        : `⚠️ Nenhum jogador foi importado.${skippedText}`;
      
      alert(message);
    } catch (err) {
      console.error('❌ Erro ao importar jogadores:', err);
      alert(`Erro ao importar jogadores:\n\n${err instanceof Error ? err.message : 'Erro desconhecido'}\n\nVerifique o console para mais detalhes.`);
    }
  };

  // Jogadores na lista de espera da categoria selecionada (para o formulário)
  const waitingPlayers = selectedCategory 
    ? tournament.waitingList.filter(p => p.categoria === selectedCategory)
    : tournament.waitingList;

  // Jogadores já alocados em grupos da categoria selecionada (para o formulário)
  // IMPORTANTE: Usar Set para garantir que cada jogador apareça apenas uma vez (mesmo que esteja em múltiplas fases)
  const enrolledPlayersRaw = selectedCategory
    ? tournament.grupos
        .filter(g => g.categoria === selectedCategory)
        .flatMap(g => g.players)
    : tournament.grupos.flatMap(g => g.players);
  
  // Remover duplicatas por ID
  const enrolledPlayersMap = new Map<string, typeof enrolledPlayersRaw[0]>();
  enrolledPlayersRaw.forEach(player => {
    if (!enrolledPlayersMap.has(player.id)) {
      enrolledPlayersMap.set(player.id, player);
    }
  });
  const enrolledPlayers = Array.from(enrolledPlayersMap.values());

  // Contadores totais para as abas (todas as categorias)
  // IMPORTANTE: Contar apenas jogadores únicos (por ID) para evitar duplicatas quando jogadores avançam de fase
  const totalWaitingPlayers = tournament.waitingList.length;
  const allEnrolledPlayers = tournament.grupos.flatMap(g => g.players);
  const uniqueEnrolledPlayerIds = new Set(allEnrolledPlayers.map(p => p.id));
  const totalEnrolledPlayers = uniqueEnrolledPlayerIds.size;

  // Evita erro de hydration - só renderiza após montar no cliente
  // Também aguarda geração do adminToken se necessário
  if (!isMounted || !adminToken) {
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
                    {editingCategory === cat ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingCategoryName}
                          onChange={(e) => setEditingCategoryName(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              try {
                                updateCategoryName(cat, editingCategoryName);
                                setEditingCategory(null);
                                setEditingCategoryName('');
                              } catch (error) {
                                alert(error instanceof Error ? error.message : 'Erro ao renomear categoria');
                              }
                            } else if (e.key === 'Escape') {
                              setEditingCategory(null);
                              setEditingCategoryName('');
                            }
                          }}
                          autoFocus
                          className="flex-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        />
                        <button
                          onClick={() => {
                            try {
                              updateCategoryName(cat, editingCategoryName);
                              setEditingCategory(null);
                              setEditingCategoryName('');
                            } catch (error) {
                              alert(error instanceof Error ? error.message : 'Erro ao renomear categoria');
                            }
                          }}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                          title="Salvar"
                        >
                          ✓
                        </button>
                        <button
                          onClick={() => {
                            setEditingCategory(null);
                            setEditingCategoryName('');
                          }}
                          className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-sm rounded transition-colors"
                          title="Cancelar"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="text-gray-900 dark:text-white font-medium">{cat}</span>
                        
                        <div className="flex items-center gap-2">
                          {/* Botão de editar */}
                          <button
                            onClick={() => {
                              setEditingCategory(cat);
                              setEditingCategoryName(cat);
                            }}
                            className="p-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                            title="Editar nome"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          
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
                      </>
                    )}
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Participantes
                </h2>
                
                {/* Botões Export/Import */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setExportCategory(selectedCategory);
                      setShowExportModal(true);
                    }}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded font-medium transition-colors flex items-center gap-1"
                    title="Exportar jogadores"
                  >
                    <span>📥</span>
                    Exportar
                  </button>
                  
                  <label
                    htmlFor="import-players-inline"
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded font-medium transition-colors cursor-pointer flex items-center gap-1"
                    title="Importar jogadores"
                  >
                    <span>📤</span>
                    Importar
                  </label>
                  <input
                    id="import-players-inline"
                    type="file"
                    accept=".json,application/json"
                    onChange={handleImportFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

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
                      <div className="mb-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {categoria}
                            </h3>
                            <span className="text-xs text-gray-600 dark:text-gray-400 sm:hidden">
                              {stats.total} jogador{stats.total !== 1 ? 'es' : ''}
                            </span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                              {stats.total} jogador{stats.total !== 1 ? 'es' : ''}
                            </span>
                            {stats.total > 0 && (
                              <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
                                <div className="relative group flex-1 sm:flex-none">
                              {(() => {
                                const existingPhase1Groups = tournament.grupos.filter(g => g.categoria === categoria && g.fase === 1);
                                const isFirstFormation = existingPhase1Groups.length === 0;
                                const needsMinPlayers = isFirstFormation && stats.total < 8;
                                const validation = isFirstFormation ? validateThreePhaseTournament(stats.total) : { isValid: true };
                                const isDisabled = !validation.isValid || needsMinPlayers;
                                
                                return (
                                  <>
                                    <button
                                      onClick={() => handleFormGroups(categoria)}
                                      disabled={isDisabled}
                                      className={`w-full sm:w-auto px-3 py-1 text-white text-sm rounded font-medium transition-colors ${
                                        isDisabled
                                          ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-60'
                                          : 'bg-green-600 hover:bg-green-700'
                                      }`}
                                    >
                                      Formar {stats.groupsReady > 0 ? stats.groupsReady : 0} Grupo{stats.groupsReady !== 1 ? 's' : ''}
                                    </button>
                                    {/* Aviso para mobile (sempre visível quando desabilitado) */}
                                    {isDisabled && (
                                      <div className="md:hidden mt-1 text-xs text-yellow-600 dark:text-yellow-400 max-w-xs">
                                        {needsMinPlayers 
                                          ? `⚠️ Mínimo de 8 jogadores necessário para iniciar o torneio`
                                          : ('blockingReason' in validation ? validation.blockingReason : 'Não é possível formar grupos')
                                        }
                                      </div>
                                    )}
                                    {/* Tooltip para desktop (hover) */}
                                    {isDisabled && (
                                      <div className="hidden md:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 whitespace-nowrap max-w-xs">
                                        {needsMinPlayers 
                                          ? `Mínimo de 8 jogadores necessário para iniciar torneio de 3 fases`
                                          : ('blockingReason' in validation ? validation.blockingReason : 'Não é possível formar grupos')
                                        }
                                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                                          <div className="border-4 border-transparent border-t-gray-900 dark:border-t-gray-800"></div>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                              </div>
                              <button
                                onClick={() => handleClearWaitingList(categoria)}
                                className="flex-1 sm:flex-none px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded font-medium transition-colors whitespace-nowrap"
                                title="Remover todos os jogadores da lista de espera"
                              >
                                Limpar Tudo
                              </button>
                              </div>
                            )}
                          </div>
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

                    // Coletar todos os jogadores únicos da categoria (de todos os grupos)
                    // IMPORTANTE: Remover duplicatas quando um jogador aparece em múltiplas fases
                    const playersInCategoryRaw = groupsInCategory.flatMap(g => g.players);
                    const playersInCategoryMap = new Map<string, typeof playersInCategoryRaw[0]>();
                    playersInCategoryRaw.forEach(player => {
                      if (!playersInCategoryMap.has(player.id)) {
                        playersInCategoryMap.set(player.id, player);
                      }
                    });
                    const playersInCategory = Array.from(playersInCategoryMap.values());
                    
                    // Verificar se há grupos em Fase 2 ou superior
                    const hasAdvancedPhases = groupsInCategory.some(g => g.fase >= 2);
                    const canRedraw = !hasAdvancedPhases;
                    
                    // Verificar se há jogos com placares registrados
                    const hasFinishedMatches = groupsInCategory.some(g => 
                      g.matches?.some(m => m.isFinished)
                    );
                    
                    // Verificar se o torneio está completo (Fase 3 finalizada)
                    const maxPhase = getMaxPhase(categoria);
                    const isTournamentComplete = maxPhase === 3 && isPhaseComplete(categoria, 3);
                    
                    // Permitir limpar se não houver jogos finalizados OU se o torneio estiver completo
                    const canClearCategory = !hasFinishedMatches || isTournamentComplete;

                    return (
                      <div key={categoria} className="mb-6 last:mb-0">
                        <div className="mb-3">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-0">
                            <div>
                              <h3 className="font-medium text-gray-900 dark:text-white">
                                {categoria}
                              </h3>
                              <span className="text-xs text-gray-600 dark:text-gray-400 sm:hidden">
                                {playersInCategory.length} jogador{playersInCategory.length !== 1 ? 'es' : ''}
                              </span>
                            </div>
                            <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
                              <span className="hidden sm:inline text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                                {playersInCategory.length} jogador{playersInCategory.length !== 1 ? 'es' : ''}
                              </span>
                              <button
                              onClick={() => handleRedrawGroups(categoria)}
                              disabled={!canRedraw}
                              className={`flex-1 sm:flex-none px-3 py-1 text-white text-sm rounded font-medium transition-colors ${
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
                            <button
                              onClick={() => handleClearTournamentPlayers(categoria)}
                              disabled={!canClearCategory}
                              className={`flex-1 sm:flex-none px-3 py-1 text-white text-sm rounded font-medium transition-colors ${
                                canClearCategory
                                  ? 'bg-red-600 hover:bg-red-700 cursor-pointer'
                                  : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-60'
                              }`}
                              title={
                                canClearCategory
                                  ? isTournamentComplete
                                    ? 'Torneio completo - Remove todos os grupos e retorna jogadores para a lista de espera'
                                    : 'Remove todos os grupos e retorna jogadores para a lista de espera'
                                  : 'Não é possível limpar: existem jogos com placares registrados (torneio ainda não finalizado)'
                              }
                            >
                              Limpar Categoria
                            </button>
                          </div>
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

            {/* Compartilhamento */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                🔗 Compartilhamento
              </h3>

              <div className="space-y-4">
                {/* Toggle de Compartilhamento */}
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Compartilhar Torneio
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Permite que espectadores visualizem o torneio em tempo real através de um link público
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleSharing(!sharingEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      sharingEnabled
                        ? 'bg-blue-600'
                        : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        sharingEnabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {/* Botão Compartilhar (só aparece se ativo) */}
                {sharingEnabled && (
                  <div className="space-y-3">
                    <button
                      onClick={() => setShowShareModal(true)}
                      className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                    >
                      <span>🔗</span>
                      <span>Compartilhar Torneio</span>
                    </button>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Gere um link público e QR Code para compartilhar com espectadores
                    </p>
                  </div>
                )}

                {/* Aviso quando desativado */}
                {!sharingEnabled && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      O compartilhamento está desativado. Ative para permitir que espectadores visualizem o torneio.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Backup & Restauração */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <BackupPanel 
                tournament={tournament} 
                onImport={importTournament}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Compartilhamento */}
      {showShareModal && sharingEnabled && (
        <ShareTournament
          onClose={() => setShowShareModal(false)}
          onShareGenerated={(id) => {
            // Tournament ID já é gerenciado pelo ShareTournament via localStorage
          }}
        />
      )}

      {/* Modal de Exportação */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📥 Exportar Jogadores
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Selecionar Categoria
                </label>
                <select
                  value={exportCategory}
                  onChange={(e) => setExportCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  <option value="all">Todas as Categorias</option>
                  {tournament.categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
                <p className="text-sm text-purple-900 dark:text-purple-200">
                  ℹ️ Serão exportados jogadores <strong>no torneio + lista de espera</strong> da{exportCategory === 'all' ? 's' : ''} categoria{exportCategory === 'all' ? 's' : ''} selecionada{exportCategory === 'all' ? 's' : ''}.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleExportPlayers}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Importação */}
      {showImportModal && importFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              📤 Importar Jogadores
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Categoria de Destino
                </label>
                <select
                  value={importCategory}
                  onChange={(e) => setImportCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                >
                  {tournament.categorias.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Jogadores serão adicionados à lista de espera desta categoria
                </p>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="overwrite-checkbox"
                  checked={importOverwrite}
                  onChange={(e) => setImportOverwrite(e.target.checked)}
                  className="mt-1 w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                />
                <label
                  htmlFor="overwrite-checkbox"
                  className="ml-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <strong>Sobrescrever jogadores existentes</strong>
                  <br />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Remove todos os jogadores da categoria antes de importar
                  </span>
                </label>
              </div>

              {importOverwrite && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  <p className="text-sm text-yellow-900 dark:text-yellow-200 flex items-start gap-2">
                    <span className="text-lg">⚠️</span>
                    <span>
                      <strong>Atenção:</strong> Todos os jogadores da categoria "{importCategory}" serão removidos (torneio + espera) antes da importação!
                    </span>
                  </p>
                </div>
              )}
            </div>

            {importFileInfo && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  📄 <strong>Arquivo:</strong> {importFile?.name}<br />
                  👥 <strong>Jogadores:</strong> {importFileInfo.totalPlayers}
                  {importFileInfo.categoria && (
                    <>
                      <br />
                      📋 <strong>Categoria no arquivo:</strong> {importFileInfo.categoria}
                    </>
                  )}
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                  setImportFileInfo(null);
                  setImportOverwrite(false);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportPlayers}
                className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
              >
                Importar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
