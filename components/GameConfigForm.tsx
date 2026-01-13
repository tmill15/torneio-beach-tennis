/**
 * GameConfigForm Component
 * Formulário para configurar regras do jogo (sets, games, tie-break)
 */

'use client';

import type { GameConfig } from '@/types';

interface GameConfigFormProps {
  config: GameConfig;
  onChange: (config: GameConfig) => void;
  disabled?: boolean;
}

export function GameConfigForm({ config, onChange, disabled = false }: GameConfigFormProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Configurações de Jogo
      </h3>

      {/* Quantidade de Sets */}
      <div>
        <label htmlFor="quantidadeSets" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Formato do jogo
        </label>
        <select
          id="quantidadeSets"
          value={config.quantidadeSets}
          onChange={(e) => onChange({ ...config, quantidadeSets: Number(e.target.value) as 1 | 3 })}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value={1}>Melhor de 1 set</option>
          <option value={3}>Melhor de 3 sets</option>
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {config.quantidadeSets === 1 && 'Jogo único (1 set)'}
          {config.quantidadeSets === 3 && 'Primeiro a ganhar 2 sets vence'}
        </p>
      </div>

      {/* Games por Set */}
      <div>
        <label htmlFor="gamesPerSet" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Games por set
        </label>
        <select
          id="gamesPerSet"
          value={config.gamesPerSet}
          onChange={(e) => onChange({ ...config, gamesPerSet: Number(e.target.value) as 4 | 6 })}
          disabled={disabled}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <option value={4}>4 games</option>
          <option value={6}>6 games</option>
        </select>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Primeiro a atingir {config.gamesPerSet} games (com diferença mínima de 2, seguindo regras do tênis)
        </p>
      </div>

      {/* Set Decisivo é Tie-Break */}
      {config.quantidadeSets > 1 && (
        <div>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.tieBreakDecisivo}
              onChange={(e) => onChange({ ...config, tieBreakDecisivo: e.target.checked })}
              disabled={disabled}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Set decisivo é tie-break?
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Se marcado, o último set será decidido em tie-break
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Pontos do Tie-Break */}
      {config.tieBreakDecisivo && (
        <div>
          <label htmlFor="pontosTieBreak" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Pontos do tie-break
          </label>
          <select
            id="pontosTieBreak"
            value={config.pontosTieBreak}
            onChange={(e) => onChange({ ...config, pontosTieBreak: Number(e.target.value) as 7 | 10 })}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value={7}>7 pontos</option>
            <option value={10}>10 pontos</option>
          </select>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Primeiro a atingir {config.pontosTieBreak} pontos (com diferença mínima de 2)
          </p>
        </div>
      )}

      {/* Resumo da Configuração */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Resumo
        </h4>
        <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• {config.quantidadeSets === 1 ? 'Jogo único' : `Melhor de ${config.quantidadeSets} sets`}</li>
          <li>• Primeiro a {config.gamesPerSet} games por set</li>
          {config.tieBreakDecisivo && (
            <li>• Set decisivo: Tie-break de {config.pontosTieBreak} pontos</li>
          )}
          {!config.tieBreakDecisivo && config.quantidadeSets > 1 && (
            <li>• Set decisivo: Formato normal</li>
          )}
        </ul>
      </div>
    </div>
  );
}
