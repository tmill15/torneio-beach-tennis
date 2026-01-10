/**
 * GroupCard Component
 * Card de grupo com tabela de classificação e lista de jogos
 */

'use client';

import type { Group, RankingEntry, SetScore, GameConfig } from '@/types';
import { MatchList } from './MatchList';

interface GroupCardProps {
  group: Group;
  ranking: RankingEntry[];
  gameConfig: GameConfig;
  onUpdateScore: (groupId: string, matchId: string, sets: SetScore[]) => void;
  onFinalizeMatch: (groupId: string, matchId: string, sets: SetScore[]) => void;
}

export function GroupCard({
  group,
  ranking,
  gameConfig,
  onUpdateScore,
  onFinalizeMatch,
}: GroupCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-orange-500 px-6 py-4">
        <h3 className="text-xl font-bold text-white">
          Grupo {group.nome} - Fase {group.fase}
        </h3>
        <p className="text-orange-100 text-sm mt-1">
          {group.categoria}
        </p>
      </div>

      {/* Classificação */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
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
                  <th className="text-center py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Sets</th>
                  <th className="text-center py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Games</th>
                  <th className="text-center py-2 px-2 text-gray-600 dark:text-gray-400 font-medium">Pts</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((entry, index) => (
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
                      {index + 1}
                    </td>
                    <td className="py-3 px-2 text-gray-900 dark:text-white">
                      {entry.player.nome}
                      {entry.player.isSeed && (
                        <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                          SEED
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
                      {entry.setsGanhos}-{entry.setsPerdidos}
                    </td>
                    <td className="py-3 px-2 text-center text-gray-700 dark:text-gray-300 text-xs">
                      {entry.gamesGanhos}-{entry.gamesPerdidos}
                    </td>
                    <td className="py-3 px-2 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-bold text-sm">
                        {entry.vitorias}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 dark:text-gray-400 py-4">
            Nenhum jogo finalizado ainda
          </p>
        )}
      </div>

      {/* Jogos */}
      <div className="px-6 py-4">
        <MatchList
          matches={group.matches}
          gameConfig={gameConfig}
          onUpdateScore={(matchId, sets) => onUpdateScore(group.id, matchId, sets)}
          onFinalizeMatch={(matchId, sets) => onFinalizeMatch(group.id, matchId, sets)}
        />
      </div>
    </div>
  );
}
