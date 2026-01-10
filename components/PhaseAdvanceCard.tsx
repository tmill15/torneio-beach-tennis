'use client';

import { useState } from 'react';
import type { QualifiedPlayer } from '@/services/phaseGenerator';

interface PhaseAdvanceCardProps {
  categoria: string;
  currentPhase: number;
  preview: {
    direct: QualifiedPlayer[];
    repechage: QualifiedPlayer[];
    total: number;
    rule: string;
  };
  hasPendingTies: boolean;
  onAdvance: () => void;
}

export function PhaseAdvanceCard({
  categoria,
  currentPhase,
  preview,
  hasPendingTies,
  onAdvance,
}: PhaseAdvanceCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const nextPhase = currentPhase + 1;
  const isFinal = nextPhase === 3;
  const canComplete = !hasPendingTies;

  return (
    <div className={`border-2 rounded-lg p-6 ${
      canComplete 
        ? 'bg-green-50 dark:bg-green-900/20 border-green-500 dark:border-green-600' 
        : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-500 dark:border-yellow-600'
    }`}>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{canComplete ? (isFinal ? '🏆' : '✓') : '⚠️'}</span>
        <div>
          <h3 className={`text-lg font-bold ${
            canComplete 
              ? 'text-green-800 dark:text-green-200' 
              : 'text-yellow-800 dark:text-yellow-200'
          }`}>
            {canComplete 
              ? (isFinal ? 'Torneio Pronto para Conclusão!' : `Fase ${currentPhase} Pronta para Conclusão!`)
              : (isFinal ? 'Torneio com Desempates Pendentes' : `Fase ${currentPhase} com Desempates Pendentes`)
            }
          </h3>
          <p className={`text-sm font-medium ${
            canComplete 
              ? 'text-green-700 dark:text-green-300' 
              : 'text-yellow-700 dark:text-yellow-300'
          }`}>
            {preview.rule}
          </p>
          {canComplete && (
            <p className={`text-xs mt-1 ${
              canComplete 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              Total: {preview.total} jogadores para {isFinal ? 'o GRUPO FINAL' : `a Fase ${nextPhase}`}
            </p>
          )}
          {!canComplete && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              ⚠️ Resolva todos os desempates antes de concluir a fase
            </p>
          )}
        </div>
      </div>
      
      {/* Detalhes */}
      {canComplete && (
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`text-sm underline mb-3 ${
            canComplete 
              ? 'text-green-700 dark:text-green-300' 
              : 'text-yellow-700 dark:text-yellow-300'
          }`}
        >
          {showDetails ? '▼ Ocultar detalhes' : '▶ Ver quem classificou'}
        </button>
      )}
      
      {showDetails && (
        <div className="mb-4 space-y-3">
          {/* Classificados Diretos */}
          <div>
            <h4 className="text-sm font-bold text-green-800 dark:text-green-200 mb-2">
              ✓ Classificados Diretos:
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {preview.direct.map(q => (
                <div key={q.player.id} className="text-xs bg-white dark:bg-gray-800 p-2 rounded">
                  <span className="font-medium">{q.player.nome}</span>
                  <span className="text-gray-500 ml-1">({q.groupOrigin} - {q.position}º)</span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Repescados */}
          {preview.repechage.length > 0 && (
            <div>
              <h4 className="text-sm font-bold text-yellow-700 dark:text-yellow-300 mb-2">
                ⭐ Repescagem:
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {preview.repechage.map(q => (
                  <div key={q.player.id} className="text-xs bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded border border-yellow-300">
                    <span className="font-medium">{q.player.nome}</span>
                    <span className="text-gray-500 ml-1">({q.groupOrigin} - {q.position}º)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Botão */}
      <button
        onClick={() => {
          if (window.confirm(
            `${isFinal ? 'Concluir o Torneio' : `Concluir Fase ${currentPhase}`}?\n\n` +
            `${preview.rule}\n` +
            `Total: ${preview.total} jogadores para ${isFinal ? 'o GRUPO FINAL' : `a Fase ${nextPhase}`}\n\n` +
            `Esta ação não pode ser desfeita.`
          )) {
            onAdvance();
          }
        }}
        disabled={!canComplete}
        className={`w-full px-6 py-3 text-white rounded-lg transition-colors text-base font-bold ${
          canComplete
            ? isFinal 
              ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 cursor-pointer' 
              : 'bg-green-600 hover:bg-green-700 cursor-pointer'
            : 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed opacity-60'
        }`}
      >
        {canComplete 
          ? (isFinal ? '🏆 Concluir Torneio' : `✓ Concluir Fase ${currentPhase}`)
          : (isFinal ? '⚠️ Resolva os desempates para concluir' : `⚠️ Resolva os desempates para concluir`)
        }
      </button>
    </div>
  );
}
