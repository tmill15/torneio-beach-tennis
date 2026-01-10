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
  onUpdateScore: (matchId: string, sets: SetScore[]) => void;
  onFinalizeMatch: (matchId: string, sets: SetScore[]) => void;
}

export function MatchList({
  matches,
  gameConfig,
  onUpdateScore,
  onFinalizeMatch,
}: MatchListProps) {
  const finishedMatches = matches.filter(m => m.isFinished);
  const pendingMatches = matches.filter(m => !m.isFinished);

  const formatSetScore = (set: SetScore): string => {
    if (set.tieBreakA !== undefined && set.tieBreakB !== undefined) {
      return `${set.gamesA}-${set.gamesB} (${set.tieBreakA}-${set.tieBreakB})`;
    }
    return `${set.gamesA}-${set.gamesB}`;
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
                      {formatDupla(match.jogador1A, match.jogador2A)} <span className="font-bold text-primary">{match.setsWonA}</span> × <span className="font-bold text-primary">{match.setsWonB}</span> {formatDupla(match.jogador1B, match.jogador2B)}
                    </p>
                    {match.sets.length > 0 && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        ({match.sets.map(formatSetScore).join(', ')})
                      </p>
                    )}
                  </div>
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
                    {formatDupla(match.jogador1A, match.jogador2A)} × {formatDupla(match.jogador1B, match.jogador2B)}
                  </p>
                </div>
                
                <ScoreInput
                  matchId={match.id}
                  gameConfig={gameConfig}
                  initialSets={match.sets}
                  onSave={(sets) => onUpdateScore(match.id, sets)}
                  onFinalize={(sets) => onFinalizeMatch(match.id, sets)}
                />
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
