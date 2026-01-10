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
  onAdvance: () => void;
}

export function PhaseAdvanceCard({
  categoria,
  currentPhase,
  preview,
  onAdvance,
}: PhaseAdvanceCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const nextPhase = currentPhase + 1;
  const isFinal = nextPhase === 3;

  return (
    <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="text-3xl">{isFinal ? '🏆' : '✓'}</span>
        <div>
          <h3 className="text-lg font-bold text-green-800 dark:text-green-200">
            Fase {currentPhase} Concluída!
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300 font-medium">
            {preview.rule}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
            Total: {preview.total} jogadores para {isFinal ? 'o GRUPO FINAL' : `a Fase ${nextPhase}`}
          </p>
        </div>
      </div>
      
      {/* Detalhes */}
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-sm text-green-700 dark:text-green-300 underline mb-3"
      >
        {showDetails ? '▼ Ocultar detalhes' : '▶ Ver quem classificou'}
      </button>
      
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
            `Avançar para ${isFinal ? 'o GRUPO FINAL' : `Fase ${nextPhase}`}?\n\n` +
            `${preview.rule}\n` +
            `Total: ${preview.total} jogadores\n\n` +
            `Esta ação não pode ser desfeita.`
          )) {
            onAdvance();
          }
        }}
        className={`w-full px-6 py-3 text-white rounded-lg transition-colors text-base font-bold ${
          isFinal 
            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600' 
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        {isFinal ? '🏆 Avançar para o GRUPO FINAL' : `▶️ Avançar para Fase ${nextPhase}`}
      </button>
    </div>
  );
}
