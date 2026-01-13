/**
 * MatchList Component
 * Lista de jogos de um grupo (concluídos e pendentes)
 */

'use client';

import type { Match, SetScore, GameConfig } from '@/types';
import { formatDupla } from '@/types';
import { ScoreInput } from './ScoreInput';

interface MatchListProps {
  matches: Match[];
  gameConfig: GameConfig;
  isReadOnly?: boolean; // Indica se é modo somente visualização
  onUpdateScore: (matchId: string, sets: SetScore[]) => void;
  onFinalizeMatch: (matchId: string, sets: SetScore[]) => void;
  onReopenMatch: (matchId: string) => void;
  onRemoveMatch?: (matchId: string) => void; // Opcional: remover partida
}

export function MatchList({
  matches,
  gameConfig,
  isReadOnly = false,
  onUpdateScore,
  onFinalizeMatch,
  onReopenMatch,
  onRemoveMatch,
}: MatchListProps) {
  const finishedMatches = matches.filter(m => m.isFinished);
  const pendingMatches = matches.filter(m => !m.isFinished);

  const formatSetScore = (set: SetScore): string => {
    if (set.tieBreakA !== undefined && set.tieBreakB !== undefined) {
      return `${set.gamesA}-${set.gamesB} (${set.tieBreakA}-${set.tieBreakB})`;
    }
    return `${set.gamesA}-${set.gamesB}`;
  };

  // Filtrar sets vazios para exibição
  const getDisplayedSets = (match: Match): SetScore[] => {
    return match.sets.filter(set => set.gamesA > 0 || set.gamesB > 0);
  };

  // Função para formatar o nome dos jogadores (simples ou duplas)
  const formatMatchPlayers = (match: Match): string => {
    // Se é partida de simples (jogadores duplicados - pode ser desempate ou final)
    const isSingles = match.jogador1A.id === match.jogador2A.id && match.jogador1B.id === match.jogador2B.id;
    if (isSingles) {
      return `${match.jogador1A.nome} × ${match.jogador1B.nome}`;
    }
    // Se é duplas normal
    return `${formatDupla(match.jogador1A, match.jogador2A)} × ${formatDupla(match.jogador1B, match.jogador2B)}`;
  };

  return (
    <div className="space-y-6">
      {/* Jogos Concluídos */}
      {finishedMatches.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="text-green-600 dark:text-green-400">✓</span>
            Jogos Concluídos
          </h4>
          <div className="space-y-2">
            {finishedMatches.map((match) => (
              <div
                key={match.id}
                className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      <span className="text-gray-500 dark:text-gray-400">R{match.rodada}:</span>{' '}
                      {formatMatchPlayers(match)}{' '}
                      <span className="font-bold text-primary">
                        ({getDisplayedSets(match).map(formatSetScore).join(', ')})
                      </span>
                      {match.isTiebreaker && (
                        <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded font-medium">
                          DESEMPATE
                        </span>
                      )}
                    </p>
                  </div>
                  {!isReadOnly && (
                    <button
                      onClick={() => onReopenMatch(match.id)}
                      className="ml-4 px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                      title="Reabrir para editar"
                    >
                      Reabrir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Jogos Pendentes */}
      {pendingMatches.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span className="text-orange-600 dark:text-orange-400">⏱</span>
            Jogos Pendentes
          </h4>
          <div className="space-y-4">
            {pendingMatches.map((match) => (
              <div
                key={match.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
              >
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    <span className="text-gray-500 dark:text-gray-400">Rodada {match.rodada}:</span>{' '}
                    {formatMatchPlayers(match)}
                    {match.isTiebreaker && (
                      <span className="ml-2 text-xs bg-yellow-500 text-white px-2 py-0.5 rounded font-medium">
                        DESEMPATE
                      </span>
                    )}
                  </p>
                </div>
                
                {!isReadOnly ? (
                  <div>
                    <ScoreInput
                      matchId={match.id}
                      gameConfig={gameConfig}
                      initialSets={match.sets}
                      onSave={(sets) => onUpdateScore(match.id, sets)}
                      onFinalize={(sets) => onFinalizeMatch(match.id, sets)}
                    />
                    {/* Botão para remover partida de desempate não finalizada */}
                    {match.isTiebreaker && onRemoveMatch && (
                      <button
                        onClick={() => {
                          if (window.confirm('Remover esta partida de desempate? Isso não pode ser desfeito.')) {
                            onRemoveMatch(match.id);
                          }
                        }}
                        className="mt-3 w-full px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                      >
                        🗑️ Remover Partida de Desempate
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-2">
                    Partida pendente (modo visualização)
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nenhum jogo */}
      {matches.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum jogo gerado ainda
          </p>
        </div>
      )}
    </div>
  );
}
