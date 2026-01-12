/**
 * TiebreakerModal Component
 * Modal para resolução de empates no ranking
 */

'use client';

import { useState } from 'react';
import type { Player } from '@/types';
import type { TieGroup } from '@/services/rankingService';

interface TiebreakerModalProps {
  tieGroup: TieGroup;
  onManualSelect: (winnerId: string) => void;
  onManualOrder?: (orderedPlayerIds: string[]) => void;
  onRandomSelect: () => void;
  onGenerateSingles?: () => void;
  onClose: () => void;
}

export function TiebreakerModal({
  tieGroup,
  onManualSelect,
  onManualOrder,
  onRandomSelect,
  onGenerateSingles,
  onClose,
}: TiebreakerModalProps) {
  const [orderedPlayers, setOrderedPlayers] = useState<Player[]>(tieGroup.players);
  const [showManualSelection, setShowManualSelection] = useState(false);

  const movePlayer = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newOrder = [...orderedPlayers];
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
      setOrderedPlayers(newOrder);
    } else if (direction === 'down' && index < orderedPlayers.length - 1) {
      const newOrder = [...orderedPlayers];
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
      setOrderedPlayers(newOrder);
    }
  };

  const handleConfirmOrder = () => {
    if (onManualOrder) {
      const orderedIds = orderedPlayers.map(p => p.id);
      onManualOrder(orderedIds);
    }
  };

  const startPosition = tieGroup.positions[0]; // Posição inicial do empate

  // Se ainda não escolheu o método, mostrar opções
  if (!showManualSelection) {
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
            {/* Botão Seleção Manual */}
            <button
              onClick={() => setShowManualSelection(true)}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
            >
              ✋ Seleção Manual
            </button>

            {/* Botão Sortear */}
            <button
              onClick={onRandomSelect}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              🎲 Sortear
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
            className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium mt-3"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  // Modal de seleção manual
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full shadow-xl">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Seleção Manual - Posições {tieGroup.positions.join(', ')}
        </h3>
        
        {tieGroup.players.length >= 3 ? (
          // Ordenação para 3+ jogadores
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Ordene os jogadores da melhor para a pior posição:
            </p>
            {orderedPlayers.map((player, index) => (
              <div
                key={player.id}
                className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => movePlayer(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Mover para cima"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => movePlayer(index, 'down')}
                    disabled={index === orderedPlayers.length - 1}
                    className="p-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Mover para baixo"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {startPosition + index}º lugar: {player.nome}
                    </span>
                    {player.isSeed && (
                      <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                        SEED
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <button
              onClick={handleConfirmOrder}
              className="w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors font-medium mt-4"
            >
              Confirmar Ordem
            </button>
          </div>
        ) : (
          // Seleção simples para 2 jogadores
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
        )}

        <button
          onClick={() => setShowManualSelection(false)}
          className="w-full px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors font-medium mt-3"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
