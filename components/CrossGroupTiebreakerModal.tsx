/**
 * CrossGroupTiebreakerModal Component
 * Modal para resolução de empates entre jogadores de grupos diferentes
 */

'use client';

import type { Player, RankingEntry } from '@/types';

interface CrossGroupTiebreakerModalProps {
  tiedPlayers: { player: Player; stats: RankingEntry; groupOrigin: string }[];
  phase: number;
  position: number;
  onManualSelect: (winnerId: string) => void;
  onRandomSelect: () => void;
  onGenerateSingles?: () => void;
  onClose: () => void;
}

export function CrossGroupTiebreakerModal({
  tiedPlayers,
  phase,
  position,
  onManualSelect,
  onRandomSelect,
  onGenerateSingles,
  onClose,
}: CrossGroupTiebreakerModalProps) {
  const positionLabel = position === 1 ? '2º colocado' : position === 2 ? '3º colocado' : `${position + 1}º colocado`;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Resolver Desempate - Melhor {positionLabel}
        </h3>
        
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {tiedPlayers.length} jogador{tiedPlayers.length !== 1 ? 'es' : ''} empatado{tiedPlayers.length !== 1 ? 's' : ''} de grupos diferentes:
          </p>
          <ul className="space-y-2">
            {tiedPlayers.map(({ player, stats, groupOrigin }) => (
              <li key={player.id} className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {player.nome}
                    </span>
                    {player.isSeed && (
                      <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        SEED
                      </span>
                    )}
                    <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                      (Grupo {groupOrigin})
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {stats.vitorias}V {stats.derrotas}D | {stats.saldoGames >= 0 ? '+' : ''}{stats.saldoGames}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          {/* Seleção Manual */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selecionar Vencedor:
            </p>
            <div className="space-y-2">
              {tiedPlayers.map(({ player, groupOrigin }) => (
                <button
                  key={player.id}
                  onClick={() => onManualSelect(player.id)}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  {player.nome} (Grupo {groupOrigin})
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-3">
            {/* Sortear */}
            <button
              onClick={onRandomSelect}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium mb-2"
            >
              🎲 Sortear Vencedor
            </button>

            {/* Partida de Simples (só para 2 jogadores) */}
            {tiedPlayers.length === 2 && onGenerateSingles && (
              <button
                onClick={onGenerateSingles}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                ⚔️ Gerar Partida de Simples
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
