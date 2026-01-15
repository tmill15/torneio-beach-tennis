/**
 * CrossGroupTiebreakerCard Component
 * Card para exibir e gerenciar desempates entre grupos
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import type { CrossGroupTiebreak, Tournament, Match, SetScore, GameConfig } from '@/types';
import { MatchList } from './MatchList';

interface CrossGroupTiebreakerCardProps {
  tiebreak: CrossGroupTiebreak;
  tournament: Tournament;
  categoria: string;
  gameConfig: GameConfig;
  isReadOnly?: boolean;
  onUpdateScore?: (matchId: string, sets: SetScore[]) => void;
  onFinalizeMatch?: (matchId: string, sets: SetScore[]) => void;
  onReopenMatch?: (matchId: string) => void;
  onUndoTiebreak?: (tiebreak: CrossGroupTiebreak) => void;
}

export function CrossGroupTiebreakerCard({
  tiebreak,
  tournament,
  categoria,
  gameConfig,
  isReadOnly = false,
  onUpdateScore,
  onFinalizeMatch,
  onReopenMatch,
  onUndoTiebreak,
}: CrossGroupTiebreakerCardProps) {
  // Encontrar os jogadores envolvidos (garantir unicidade por ID)
  // Incluir tanto grupos normais quanto grupos de desempate cross-group
  const categoryGroups = useMemo(() => {
    return tournament.grupos.filter(
      g => g.categoria === categoria && g.fase === tiebreak.phase
    );
  }, [tournament.grupos, categoria, tiebreak.phase]);
  
  // Usar Map para garantir que cada jogador apareça apenas uma vez
  const playersMap = new Map<string, typeof categoryGroups[0]['players'][0]>();
  categoryGroups.forEach(group => {
    group.players.forEach(player => {
      if (tiebreak.tiedPlayerIds.includes(player.id) && !playersMap.has(player.id)) {
        playersMap.set(player.id, player);
      }
    });
  });
  
  const players = Array.from(playersMap.values());

  // Encontrar a partida de desempate se existir (usar useMemo para recalcular quando tournament mudar)
  const tiebreakMatch: Match | undefined = useMemo(() => {
    if (!tiebreak.matchId) return undefined;
    
    // Procurar em todos os grupos da categoria e fase (incluindo grupos de desempate)
    for (const group of categoryGroups) {
      const match = group.matches.find(m => m.id === tiebreak.matchId);
      if (match) {
        return match;
      }
    }
    return undefined;
  }, [tiebreak.matchId, categoryGroups]);

  // Inicializar viewMode: se for partida extra e a partida não estiver finalizada, começar na aba "Partida"
  const [viewMode, setViewMode] = useState<'info' | 'match'>('info');

  // Atualizar viewMode baseado no estado da partida
  useEffect(() => {
    if (tiebreak.method === 'singles' && tiebreakMatch) {
      if (tiebreakMatch.isFinished || tiebreak.winnerId) {
        // Se a partida está finalizada ou há um vencedor, mostrar aba de informações
        setViewMode('info');
      } else {
        // Se a partida não está finalizada, mostrar aba de partida
        setViewMode('match');
      }
    } else {
      // Se não há partida ou não é método singles, sempre mostrar informações
      setViewMode('info');
    }
  }, [tiebreak.method, tiebreakMatch, tiebreak.winnerId]);

  // Encontrar o vencedor (usar useMemo para recalcular quando tiebreak.winnerId mudar)
  const winner = useMemo(() => {
    if (!tiebreak.winnerId) return undefined;
    return players.find(p => p.id === tiebreak.winnerId);
  }, [tiebreak.winnerId, players]);
  
  const losers = useMemo(() => {
    if (!tiebreak.winnerId) return [];
    return players.filter(p => p.id !== tiebreak.winnerId);
  }, [tiebreak.winnerId, players]);

  // Determinar o grupo de origem de cada jogador
  const getPlayerGroup = (playerId: string) => {
    // Primeiro, procurar em grupos normais
    for (const group of categoryGroups) {
      if (!group.nome.startsWith('DESEMPATE_CROSS_GROUP_') && group.players.some(p => p.id === playerId)) {
        return group.nome;
      }
    }
    // Se não encontrou em grupos normais, pode estar no grupo de desempate
    // Nesse caso, procurar o grupo original do jogador antes do desempate
    // ou retornar "Desempate" se estiver no grupo de desempate
    for (const group of categoryGroups) {
      if (group.nome.startsWith('DESEMPATE_CROSS_GROUP_') && group.players.some(p => p.id === playerId)) {
        return 'Desempate';
      }
    }
    // Se ainda não encontrou, procurar em todos os grupos (fallback)
    for (const group of categoryGroups) {
      if (group.players.some(p => p.id === playerId)) {
        // Se for grupo de desempate, retornar "Desempate", senão o nome do grupo
        return group.nome.startsWith('DESEMPATE_CROSS_GROUP_') ? 'Desempate' : group.nome;
      }
    }
    return '?';
  };

  const getMethodLabel = () => {
    switch (tiebreak.method) {
      case 'manual':
        return 'Seleção Manual';
      case 'random':
        return 'Sorteio';
      case 'singles':
        return 'Partida de Simples';
      default:
        return 'Desconhecido';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-yellow-500 dark:border-yellow-600 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-500 to-orange-500 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-white">
              Desempate entre Grupos
            </h3>
            <p className="text-yellow-100 text-sm mt-1">
              Fase {tiebreak.phase} - {categoria}
            </p>
          </div>
          {!isReadOnly && onUndoTiebreak && tiebreak.winnerId && (
            <button
              onClick={() => onUndoTiebreak(tiebreak)}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors"
              title="Desfazer desempate"
            >
              ↶ Desfazer
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          <button
            onClick={() => setViewMode('info')}
            className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
              viewMode === 'info'
                ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-b-2 border-yellow-500'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            Informações
          </button>
          {tiebreakMatch && (
            <button
              onClick={() => setViewMode('match')}
              className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'match'
                  ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border-b-2 border-yellow-500'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
            >
              Partida
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {viewMode === 'info' ? (
          <div className="space-y-4">
            {/* Participantes */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Participantes Empatados:
              </h4>
              <div className="space-y-2">
                {players.map(player => (
                  <div
                    key={player.id}
                    className={`p-3 rounded-lg border ${
                      player.id === tiebreak.winnerId
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">
                          {player.nome}
                          {player.id === tiebreak.winnerId && (
                            <span className="ml-2 text-green-600 dark:text-green-400 font-bold">
                              ✓ Vencedor
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Grupo {getPlayerGroup(player.id)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Método de Desempate */}
            <div>
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                Método de Desempate:
              </h4>
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="font-medium text-blue-800 dark:text-blue-200">
                  {getMethodLabel()}
                </div>
                {tiebreak.method === 'singles' && tiebreakMatch && (
                  <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    {tiebreakMatch.isFinished
                      ? 'Partida finalizada'
                      : 'Partida pendente'}
                  </div>
                )}
              </div>
            </div>

            {/* Resultado */}
            {tiebreak.winnerId && winner && (
              <div>
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  Resultado:
                </h4>
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg">
                  <div className="font-bold text-green-800 dark:text-green-200 text-lg">
                    {winner.nome} (Grupo {getPlayerGroup(winner.id)})
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                    Classificado para a próxima fase
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          // View: Match
          tiebreakMatch ? (
            <div>
              {onUpdateScore && onFinalizeMatch && onReopenMatch ? (
                <MatchList
                  matches={[tiebreakMatch]}
                  gameConfig={gameConfig}
                  isReadOnly={isReadOnly}
                  onUpdateScore={onUpdateScore}
                  onFinalizeMatch={onFinalizeMatch}
                  onReopenMatch={onReopenMatch}
                />
              ) : (
                <div className="text-center text-gray-500 dark:text-gray-400 py-4">
                  Funções de gerenciamento não disponíveis
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              Partida não encontrada
            </div>
          )
        )}
      </div>
    </div>
  );
}
