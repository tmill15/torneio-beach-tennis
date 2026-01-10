'use client';

import { useState } from 'react';
import type { QualifiedPlayer } from '@/services/phaseGenerator';
import type { Tournament } from '@/types';
import { detectCrossGroupTies } from '@/services/phaseGenerator';
import { CrossGroupTiebreakerModal } from './CrossGroupTiebreakerModal';

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
  resolveCrossGroupTieManual?: (categoria: string, phase: number, position: number, winnerId: string, tiedPlayerIds: string[]) => void;
  resolveCrossGroupTieRandom?: (categoria: string, phase: number, position: number, tiedPlayerIds: string[]) => void;
  generateCrossGroupSinglesMatch?: (categoria: string, phase: number, position: number, player1Id: string, player2Id: string) => void;
  tournament?: Tournament;
}

export function PhaseAdvanceCard({
  categoria,
  currentPhase,
  preview,
  hasPendingTies,
  onAdvance,
  resolveCrossGroupTieManual,
  resolveCrossGroupTieRandom,
  generateCrossGroupSinglesMatch,
  tournament,
}: PhaseAdvanceCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [showCrossGroupTieModal, setShowCrossGroupTieModal] = useState(false);
  const [crossGroupTieData, setCrossGroupTieData] = useState<{
    tiedPlayers: { player: any; stats: any; groupOrigin: string }[];
    phase: number;
    position: number;
  } | null>(null);
  
  const nextPhase = currentPhase + 1;
  const isFinal = currentPhase === 3; // Fase 3 é a fase final
  
  // Detectar empates entre grupos
  let crossGroupTies: { player: any; stats: any; groupOrigin: string }[] = [];
  if (tournament) {
    const categoryGroups = tournament.grupos.filter(g => g.categoria === categoria && g.fase === currentPhase);
    if (currentPhase === 1) {
      // Verificar empate em 3º lugar (repescagem)
      crossGroupTies = detectCrossGroupTies(categoryGroups, currentPhase, 2, tournament.crossGroupTiebreaks);
    } else if (currentPhase === 2) {
      const numGroups = categoryGroups.length;
      if (numGroups === 3) {
        // Verificar empate em 2º lugar (melhor 2º colocado)
        crossGroupTies = detectCrossGroupTies(categoryGroups, currentPhase, 1, tournament.crossGroupTiebreaks);
      }
    }
  }
  
  const hasCrossGroupTies = crossGroupTies.length > 1;
  const canComplete = !hasPendingTies && !hasCrossGroupTies;

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
          {!isFinal && (
            <p className={`text-sm font-medium ${
              canComplete 
                ? 'text-green-700 dark:text-green-300' 
                : 'text-yellow-700 dark:text-yellow-300'
            }`}>
              {preview.rule}
            </p>
          )}
          {canComplete && !isFinal && (
            <p className={`text-xs mt-1 ${
              canComplete 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              Total: {preview.total} jogadores para a Fase {nextPhase}
            </p>
          )}
          {isFinal && canComplete && (
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Todos os jogos foram finalizados. Clique em "Concluir Torneio" para finalizar.
            </p>
          )}
          {!canComplete && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              ⚠️ Resolva todos os desempates antes de concluir a fase
              {hasCrossGroupTies && (
                <button
                  onClick={() => {
                    const position = currentPhase === 1 ? 2 : 1;
                    setCrossGroupTieData({
                      tiedPlayers: crossGroupTies,
                      phase: currentPhase,
                      position
                    });
                    setShowCrossGroupTieModal(true);
                  }}
                  className="ml-2 underline font-medium"
                >
                  Resolver empate entre grupos
                </button>
              )}
            </p>
          )}
        </div>
      </div>
      
      {/* Detalhes - Só mostrar se não for fase final */}
      {canComplete && !isFinal && (
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
      
      {showDetails && !isFinal && (
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
      
      {/* Modal de desempate entre grupos */}
      {showCrossGroupTieModal && crossGroupTieData && (
        <CrossGroupTiebreakerModal
          tiedPlayers={crossGroupTieData.tiedPlayers}
          phase={crossGroupTieData.phase}
          position={crossGroupTieData.position}
          onManualSelect={(winnerId) => {
            if (resolveCrossGroupTieManual) {
              resolveCrossGroupTieManual(
                categoria,
                crossGroupTieData.phase,
                crossGroupTieData.position,
                winnerId,
                crossGroupTieData.tiedPlayers.map(t => t.player.id)
              );
            }
            setShowCrossGroupTieModal(false);
            setCrossGroupTieData(null);
          }}
          onRandomSelect={() => {
            if (resolveCrossGroupTieRandom) {
              resolveCrossGroupTieRandom(
                categoria,
                crossGroupTieData.phase,
                crossGroupTieData.position,
                crossGroupTieData.tiedPlayers.map(t => t.player.id)
              );
            }
            setShowCrossGroupTieModal(false);
            setCrossGroupTieData(null);
          }}
          onGenerateSingles={crossGroupTieData.tiedPlayers.length === 2 && generateCrossGroupSinglesMatch ? () => {
            generateCrossGroupSinglesMatch(
              categoria,
              crossGroupTieData.phase,
              crossGroupTieData.position,
              crossGroupTieData.tiedPlayers[0].player.id,
              crossGroupTieData.tiedPlayers[1].player.id
            );
            setShowCrossGroupTieModal(false);
            setCrossGroupTieData(null);
          } : undefined}
          onClose={() => {
            setShowCrossGroupTieModal(false);
            setCrossGroupTieData(null);
          }}
        />
      )}
    </div>
  );
}
