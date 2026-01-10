/**
 * TiebreakerModal Component
 * Modal para resolução de empates no ranking
 */

'use client';

import type { Player } from '@/types';
import type { TieGroup } from '@/services/rankingService';

interface TiebreakerModalProps {
  tieGroup: TieGroup;
  onManualSelect: (winnerId: string) => void;
  onRandomSelect: () => void;
  onGenerateSingles?: () => void;
  onClose: () => void;
}

export function TiebreakerModal({
  tieGroup,
  onManualSelect,
  onRandomSelect,
  onGenerateSingles,
  onClose,
}: TiebreakerModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Resolver Desempate - Posições {tieGroup.positions.join(', ')}
        </h3>
        
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            {tieGroup.players.length} jogador{tieGroup.players.length !== 1 ? 'es' : ''} empatado{tieGroup.players.length !== 1 ? 's' : ''}:
          </p>
          <ul className="space-y-1">
            {tieGroup.players.map(player => (
              <li key={player.id} className="text-sm text-gray-900 dark:text-white">
                • {player.nome}
                {player.isSeed && (
                  <span className="ml-2 text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                    SEED
                  </span>
                )}
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
              {tieGroup.players.map(player => (
                <button
                  key={player.id}
                  onClick={() => onManualSelect(player.id)}
                  className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  {player.nome}
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
            {tieGroup.players.length === 2 && onGenerateSingles && (
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
