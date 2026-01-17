/**
 * ScoreInput Component
 * Input dinâmico para inserir placares de partidas (sets/games)
 */

'use client';

import { useState } from 'react';
import type { SetScore, GameConfig } from '@/types';
import { validateMatchScore, type ScoreValidationConfig } from '@/services/scoreValidator';

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
  
  const [showWarningsModal, setShowWarningsModal] = useState(false);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  
  // Verificar se há placar parcial salvo
  const hasPartialScore = initialSets.length > 0 && initialSets.some(s => s.gamesA > 0 || s.gamesB > 0);

  const handleSetChange = (index: number, field: 'gamesA' | 'gamesB', value: string) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    const newSets = [...sets];
    const currentSet = newSets[index];
    newSets[index] = { ...currentSet, [field]: numValue };
    setSets(newSets);
  };

  // Validação em tempo real
  const getValidationStatus = () => {
    const filledSets = sets.filter(s => s.gamesA > 0 || s.gamesB > 0);
    
    if (filledSets.length === 0) {
      return { canFinalize: false, errors: [], warnings: [] };
    }

    // Verificar se há vencedor
    let setsA = 0;
    let setsB = 0;
    filledSets.forEach(set => {
      if (set.gamesA > set.gamesB) setsA++;
      else if (set.gamesB > set.gamesA) setsB++;
    });

    if (!(setsA > setsB || setsB > setsA)) {
      return { canFinalize: false, errors: ['Não há vencedor definido'], warnings: [] };
    }

    // Configurar validação
    const config: ScoreValidationConfig = {
      quantidadeSets: gameConfig.quantidadeSets,
      gamesPerSet: gameConfig.gamesPerSet,
      tieBreakDecisivo: gameConfig.tieBreakDecisivo,
      pontosTieBreak: gameConfig.pontosTieBreak,
    };

    // Validar placar
    const validation = validateMatchScore(filledSets, config);

    return {
      canFinalize: validation.isValid,
      errors: validation.errors,
      warnings: validation.warnings,
    };
  };

  const validationStatus = getValidationStatus();

  const handleFinalizeClick = () => {
    const filledSets = sets.filter(s => s.gamesA > 0 || s.gamesB > 0);
    
    if (filledSets.length === 0 || !validationStatus.canFinalize) {
      return;
    }

    // Se há avisos, mostrar modal para confirmação
    if (validationStatus.warnings.length > 0) {
      setValidationWarnings(validationStatus.warnings);
      setShowWarningsModal(true);
    } else {
      // Sem avisos, finalizar diretamente
      onFinalize(filledSets);
    }
  };

  const handleConfirmFinalize = () => {
    const filledSets = sets.filter(s => s.gamesA > 0 || s.gamesB > 0);
    setShowWarningsModal(false);
    setValidationWarnings([]);
    onFinalize(filledSets);
  };

  const handleSavePartial = () => {
    const filledSets = sets.filter(s => s.gamesA > 0 || s.gamesB > 0);
    if (filledSets.length > 0) {
      onSave(filledSets);
    }
  };

  return (
    <div className="space-y-4">
      {sets.map((set, index) => {
        const isSetFilled = set.gamesA > 0 || set.gamesB > 0;
        return (
          <div
            key={index}
            className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
          >
            <div className="flex items-center gap-2 w-16">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Set {index + 1}
              </span>
              {hasPartialScore && isSetFilled && (
                <span className="text-xs text-blue-600 dark:text-blue-400" title="Placar parcial salvo">
                  ●
                </span>
              )}
            </div>

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
          </div>
        );
      })}

      <div className="flex gap-3 pt-2 items-stretch">
        {/* Botão Salvar Parcial */}
        <div className="flex-1 min-w-0 flex">
          <button
            onClick={handleSavePartial}
            disabled={disabled || sets.every(s => s.gamesA === 0 && s.gamesB === 0)}
            className="w-full px-4 py-2 min-h-[2.75rem] bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            Salvar Parcial
          </button>
        </div>
        
        {/* Botão Finalizar com Tooltip de Erros */}
        <div className="flex-1 min-w-0 relative group flex">
          <button
            onClick={handleFinalizeClick}
            disabled={disabled || !validationStatus.canFinalize}
            className="w-full px-4 py-2 min-h-[2.75rem] bg-primary hover:bg-orange-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            Finalizar Jogo
          </button>
          
          {/* Tooltip com Erros */}
          {!disabled && validationStatus.errors.length > 0 && (
            <div className="absolute bottom-full left-0 right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
              <div className="bg-gray-800 dark:bg-gray-700 text-white text-xs rounded-lg p-3 shadow-lg border border-gray-600 dark:border-gray-500">
                <p className="font-semibold mb-1 text-red-300">❌ Não é possível finalizar:</p>
                <ul className="space-y-1 text-gray-100">
                  {validationStatus.errors.map((error, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="mt-0.5">•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                  <div className="border-8 border-transparent border-t-gray-800 dark:border-t-gray-700"></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Avisos (apenas warnings, sem erros) */}
      {showWarningsModal && validationWarnings.length > 0 && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              ⚠️ Atenção
            </h3>

            <div className="space-y-4 max-h-96 overflow-y-auto">
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                  ⚠️ Avisos Detectados:
                </p>
                <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-300">
                  {validationWarnings.map((warning, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-0.5">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Deseja finalizar mesmo assim?
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowWarningsModal(false);
                  setValidationWarnings([]);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmFinalize}
                className="flex-1 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium transition-colors"
              >
                Confirmar e Finalizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
