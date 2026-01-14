/**
 * GroupCard Component
 * Card de grupo com tabela de classificação e lista de jogos
 */

'use client';

import { useState } from 'react';
import type { Group, RankingEntry, SetScore, GameConfig } from '@/types';
import { MatchList } from './MatchList';
import { TiebreakerModal } from './TiebreakerModal';
import { detectTies } from '@/services/rankingService';

interface GroupCardProps {
  group: Group;
  ranking: RankingEntry[];
  gameConfig: GameConfig;
  viewMode: 'classificacao' | 'jogos';
  isReadOnly?: boolean; // Indica se a fase é anterior (somente visualização)
  isPhaseComplete?: boolean; // Indica se a fase está completa (para mensagem no rodapé)
  onUpdateScore: (groupId: string, matchId: string, sets: SetScore[]) => void;
  onFinalizeMatch: (groupId: string, matchId: string, sets: SetScore[]) => void;
  onReopenMatch: (groupId: string, matchId: string) => void;
  onRemoveMatch?: (groupId: string, matchId: string) => void; // Opcional: remover partida
  onResolveTieManual: (groupId: string, winnerId: string, tiedPlayerIds: string[]) => void;
  onResolveTieManualOrder?: (groupId: string, orderedPlayerIds: string[], startPosition: number) => void;
  onResolveTieRandom: (groupId: string, tiedPlayerIds: string[]) => void;
  onGenerateSingles: (groupId: string, player1Id: string, player2Id: string) => void;
  onUndoTiebreak: (groupId: string, playerIds: string[]) => void;
  onChangeViewMode?: (mode: 'classificacao' | 'jogos') => void;
}

export function GroupCard({
  group,
  ranking,
  gameConfig,
  viewMode,
  isReadOnly = false,
  isPhaseComplete = false,
  onUpdateScore,
  onFinalizeMatch,
  onReopenMatch,
  onRemoveMatch,
  onResolveTieManual,
  onResolveTieManualOrder,
  onResolveTieRandom,
  onGenerateSingles,
  onUndoTiebreak,
  onChangeViewMode,
}: GroupCardProps) {
  const [showTiebreakerModal, setShowTiebreakerModal] = useState<any>(null);

  // Detectar empates
  const ties = detectTies(ranking);
  const getTieInfo = (index: number) => {
    return ties.find(tie => tie.positions.includes(index + 1));
  };

  // Detectar jogadores com desempate resolvido
  const playersWithTiebreak = ranking.filter(entry => entry.player.tiebreakOrder);

  // Detectar partidas de desempate pendentes
  const pendingTiebreakerMatches = group.matches.filter(m => m.isTiebreaker && !m.isFinished);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-orange-500 px-6 py-4">
        <h3 className="text-xl font-bold text-white">
          {group.fase === 3
            ? `Grupo ${group.nome === 'Final' ? 'A' : (group.nome || 'A')} - Fase Final`
            : group.nome && group.nome.startsWith('Grupo ')
              ? `${group.nome} - Fase ${group.fase}`
              : `Grupo ${group.nome || '?'} - Fase ${group.fase}`
          }
        </h3>
        <p className="text-orange-100 text-sm mt-1">
          {group.categoria}
        </p>
      </div>

      {/* Conteúdo baseado no viewMode */}
      {viewMode === 'classificacao' && (
        <div className="px-6 py-4">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 uppercase tracking-wide">
            Classificação
          </h4>
          
          {ranking.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Pos</th>
                    <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Jogador</th>
                    <th className="text-center py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">V</th>
                    <th className="text-center py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">D</th>
                    <th className="text-center py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Games</th>
                    <th className="text-center py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Pts (saldo)</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((entry, index) => {
                    const tieInfo = getTieInfo(index);
                    
                    return (
                      <tr
                        key={entry.player.id}
                        className={`border-b border-gray-100 dark:border-gray-800 ${
                          index === 0
                            ? 'bg-yellow-50 dark:bg-yellow-900/10'
                            : index === 1
                            ? 'bg-gray-50 dark:bg-gray-900/30'
                            : ''
                        }`}
                      >
                        <td className="py-3 px-2 text-gray-900 dark:text-white font-medium">
                          <div className="flex items-center gap-1">
                            {index + 1}
                            {tieInfo && (
                              <span className="text-yellow-600 dark:text-yellow-400" title="Empate técnico">
                                ⚠️
                              </span>
                            )}
                          </div>
                        </td>
                      <td className="py-3 px-2 text-gray-900 dark:text-white">
                        {entry.player.nome}
                        {entry.player.isSeed && (
                          <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                            SEED
                          </span>
                        )}
                        {/* Badge de desempate - sempre mostrar se existir (independente de read-only) */}
                        {entry.player.tiebreakOrder && (
                          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded" title="Classificado por desempate manual">
                            DESEMPATE
                          </span>
                        )}
                        {/* Badges de classificação - APENAS em fases anteriores (read-only) */}
                        {isReadOnly && entry.player.qualificationType === 'direct' && (
                          <span className="ml-2 text-xs bg-green-500 text-white px-2 py-0.5 rounded">
                            CLASSIFICADO
                          </span>
                        )}
                        {isReadOnly && entry.player.qualificationType === 'repechage' && (
                          <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded">
                            REPESCAGEM
                          </span>
                        )}
                        {/* ELIMINADO só aparece se não foi classificado (sem qualificationType) */}
                        {isReadOnly && entry.player.status === 'eliminated' && !entry.player.qualificationType && (
                          <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                            ELIMINADO
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center text-gray-900 dark:text-white font-semibold">
                        {entry.vitorias}
                      </td>
                      <td className="py-3 px-2 text-center text-gray-600 dark:text-gray-400">
                        {entry.derrotas}
                      </td>
                      <td className="py-3 px-2 text-center text-gray-700 dark:text-gray-300 text-xs">
                        {entry.gamesGanhos}-{entry.gamesPerdidos}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm">
                            {entry.vitorias}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            ({entry.saldoGames > 0 ? '+' : ''}{entry.saldoGames})
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4">
              Nenhum jogo finalizado ainda
            </p>
          )}
        </div>
      )}

      {viewMode === 'jogos' && (
        <div className="px-6 py-4">
          <MatchList
            matches={group.matches}
            gameConfig={gameConfig}
            isReadOnly={isReadOnly}
            onUpdateScore={(matchId, sets) => onUpdateScore(group.id, matchId, sets)}
            onFinalizeMatch={(matchId, sets) => onFinalizeMatch(group.id, matchId, sets)}
            onReopenMatch={(matchId) => onReopenMatch(group.id, matchId)}
            onRemoveMatch={onRemoveMatch ? (matchId) => onRemoveMatch(group.id, matchId) : undefined}
          />
        </div>
      )}

      {/* Alertas de Empate */}
      {!isReadOnly && viewMode === 'classificacao' && ties.length > 0 && (
        <div className="px-6 pb-6">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-3">
              ⚠️ {ties.length > 1 ? `${ties.length} empates detectados` : 'Empate detectado'}
            </p>
            <div className="space-y-2">
              {ties.map((tie, idx) => (
                <button
                  key={idx}
                  onClick={() => setShowTiebreakerModal(tie)}
                  className="w-full px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                >
                  Resolver empate nas posições {tie.positions.join(', ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Partida de Desempate Pendente */}
      {viewMode === 'classificacao' && pendingTiebreakerMatches.length > 0 && (
        <div className="px-6 pb-6">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">🎾</span>
              <p className="text-sm font-bold text-green-800 dark:text-green-200">
                Partida de Desempate Gerada!
              </p>
            </div>
            <div className="space-y-2 mb-3">
              {pendingTiebreakerMatches.map((match) => (
                <div key={match.id} className="text-sm text-green-700 dark:text-green-300 font-medium">
                  ⚔️ Rodada {match.rodada}: {match.jogador1A.nome} × {match.jogador1B.nome}
                </div>
              ))}
            </div>
            <button
              onClick={() => onChangeViewMode?.('jogos')}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-bold flex items-center justify-center gap-2"
            >
              ▶️ Ir para a Partida
            </button>
          </div>
        </div>
      )}

      {/* Desempates Resolvidos */}
      {!isReadOnly && viewMode === 'classificacao' && playersWithTiebreak.length > 0 && (
        <div className="px-6 pb-6">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-3">
              ℹ️ Desempates Resolvidos
              {playersWithTiebreak[0]?.player.tiebreakMethod === 'manual' && ' (Seleção Manual)'}
              {playersWithTiebreak[0]?.player.tiebreakMethod === 'random' && ' (Sorteio)'}
              {playersWithTiebreak[0]?.player.tiebreakMethod === 'singles' && ' (Partida de Simples)'}
            </p>
            <div className="space-y-2 mb-3">
              {playersWithTiebreak.map((entry) => (
                <div key={entry.player.id} className="text-sm text-blue-700 dark:text-blue-300">
                  • {entry.player.nome} (posição {ranking.indexOf(entry) + 1})
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                const playerIds = playersWithTiebreak.map(e => e.player.id);
                if (window.confirm(`Desfazer desempate para ${playersWithTiebreak.length} jogador${playersWithTiebreak.length !== 1 ? 'es' : ''}?\n\nIsso removerá a ordem de desempate e eles voltarão a estar empatados.`)) {
                  onUndoTiebreak(group.id, playerIds);
                }
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              ↩️ Desfazer Desempate
            </button>
          </div>
        </div>
      )}

      {/* Modal de Resolução */}
      {showTiebreakerModal && (
        <TiebreakerModal
          tieGroup={showTiebreakerModal}
          onManualSelect={(winnerId) => {
            onResolveTieManual(group.id, winnerId, showTiebreakerModal.players.map((p: any) => p.id));
            setShowTiebreakerModal(null);
          }}
          onManualOrder={onResolveTieManualOrder ? (orderedPlayerIds) => {
            const startPosition = showTiebreakerModal.positions[0];
            onResolveTieManualOrder(group.id, orderedPlayerIds, startPosition);
            setShowTiebreakerModal(null);
          } : undefined}
          onRandomSelect={() => {
            onResolveTieRandom(group.id, showTiebreakerModal.players.map((p: any) => p.id));
            setShowTiebreakerModal(null);
          }}
          onGenerateSingles={
            showTiebreakerModal.players.length === 2
              ? () => {
                  onGenerateSingles(group.id, showTiebreakerModal.players[0].id, showTiebreakerModal.players[1].id);
                  setShowTiebreakerModal(null);
                }
              : undefined
          }
          onClose={() => setShowTiebreakerModal(null)}
        />
      )}

      {/* Indicador de Read-Only */}
      {isReadOnly && (
        <div className="px-6 py-3 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-700">
          <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
            {isPhaseComplete
              ? '📋 Modo visualização - Esta fase já foi concluída'
              : '👁️ Modo visualização - Acompanhando em tempo real'}
          </p>
        </div>
      )}
    </div>
  );
}
