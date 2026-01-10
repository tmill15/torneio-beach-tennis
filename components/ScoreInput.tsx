/**
 * ScoreInput Component
 * Input dinâmico para inserir placares de partidas (sets/games)
 */

'use client';

import { useState } from 'react';
import type { SetScore, GameConfig } from '@/types';
import { validateSetScore } from '@/services/rankingService';

interface ScoreInputProps {
  matchId: string;
  gameConfig: GameConfig;
  initialSets?: SetScore[];
  onSave: (sets: SetScore[]) => void;
  onFinalize: (sets: SetScore[]) => void;
  disabled?: boolean;
}

export function ScoreInput({
  matchId,
  gameConfig,
  initialSets = [],
  onSave,
  onFinalize,
  disabled = false,
}: ScoreInputProps) {
  const [sets, setSets] = useState<SetScore[]>(
    initialSets.length > 0 
      ? initialSets 
      : Array.from({ length: gameConfig.quantidadeSets }, () => ({
          gamesA: 0,
          gamesB: 0,
        }))
  );

  const handleSetChange = (index: number, field: 'gamesA' | 'gamesB', value: string) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    const newSets = [...sets];
    newSets[index] = { ...newSets[index], [field]: numValue };
    setSets(newSets);
  };

  const isSetValid = (setIndex: number): boolean => {
    const set = sets[setIndex];
    const isDecisive = setIndex === gameConfig.quantidadeSets - 1;
    const validation = validateSetScore(set, gameConfig, isDecisive);
    return validation.isValid;
  };

  const canFinalize = (): boolean => {
    // Pelo menos 1 set deve estar preenchido
    const hasAnySet = sets.some(s => s.gamesA > 0 || s.gamesB > 0);
    if (!hasAnySet) return false;

    // Todos os sets preenchidos devem ser válidos
    for (let i = 0; i < sets.length; i++) {
      if (sets[i].gamesA > 0 || sets[i].gamesB > 0) {
        if (!isSetValid(i)) return false;
      }
    }

    // Deve haver um vencedor
    let setsA = 0;
    let setsB = 0;
    sets.forEach(set => {
      if (set.gamesA > set.gamesB) setsA++;
      else if (set.gamesB > set.gamesA) setsB++;
    });

    const setsNeeded = Math.ceil(gameConfig.quantidadeSets / 2);
    return setsA >= setsNeeded || setsB >= setsNeeded;
  };

  return (
    <div className="space-y-4">
      {sets.map((set, index) => {
        const isDecisive = index === gameConfig.quantidadeSets - 1;
        const isTieBreak = isDecisive && gameConfig.tieBreakDecisivo;
        const isValid = isSetValid(index);
        const hasData = set.gamesA > 0 || set.gamesB > 0;

        return (
          <div
            key={index}
            className={`flex items-center gap-4 p-4 rounded-lg border ${
              hasData && !isValid
                ? 'border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20'
                : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
            }`}
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-16">
              Set {index + 1}
              {isTieBreak && ' (TB)'}
            </span>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                value={set.gamesA || ''}
                onChange={(e) => handleSetChange(index, 'gamesA', e.target.value)}
                disabled={disabled}
                placeholder="0"
                className="w-16 px-3 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <span className="text-gray-500 dark:text-gray-400 font-medium">×</span>
              <input
                type="number"
                min="0"
                value={set.gamesB || ''}
                onChange={(e) => handleSetChange(index, 'gamesB', e.target.value)}
                disabled={disabled}
                placeholder="0"
                className="w-16 px-3 py-2 text-center border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-900 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {hasData && (
              <div className="ml-2">
                {isValid ? (
                  <span className="text-green-600 dark:text-green-400 text-xl" title="Válido">✓</span>
                ) : (
                  <span className="text-red-600 dark:text-red-400 text-xl" title="Inválido">⚠️</span>
                )}
              </div>
            )}
          </div>
        );
      })}

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onSave(sets)}
          disabled={disabled || sets.every(s => s.gamesA === 0 && s.gamesB === 0)}
          className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Salvar Parcial
        </button>
        <button
          onClick={() => onFinalize(sets)}
          disabled={disabled || !canFinalize()}
          className="flex-1 px-4 py-2 bg-primary hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Finalizar Jogo
        </button>
      </div>

      {!canFinalize() && sets.some(s => s.gamesA > 0 || s.gamesB > 0) && (
        <p className="text-sm text-red-600 dark:text-red-400 text-center">
          Verifique os placares - diferença mínima de 2 {gameConfig.tieBreakDecisivo && sets.length > 1 ? 'games/pontos' : 'games'}
        </p>
      )}
    </div>
  );
}
