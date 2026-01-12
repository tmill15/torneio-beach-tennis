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
  // IMPORTANTE: Só verificar empates cross-group quando realmente precisamos selecionar
  // jogadores de uma posição específica entre grupos diferentes
  let crossGroupTies: { player: any; stats: any; groupOrigin: string }[] = [];
  if (tournament) {
    const categoryGroups = tournament.grupos.filter(g => g.categoria === categoria && g.fase === currentPhase);
    if (currentPhase === 1) {
      // Fase 1 → Fase 2: verificar empate em 3º lugar APENAS se precisar de repescagem
      // Calcular se precisa de repescagem
      const directCount = categoryGroups.length * 2; // Top 2 de cada grupo
      const targetGroupSize = 4;
      const idealGroups = Math.floor(directCount / targetGroupSize);
      const remainder = directCount % targetGroupSize;
      const repechageCount = remainder > 0 ? (idealGroups + 1) * targetGroupSize - directCount : 0;
      
      // Só verificar empates cross-group se realmente precisamos de repescagem
      if (repechageCount > 0) {
        crossGroupTies = detectCrossGroupTies(categoryGroups, currentPhase, 2, tournament.crossGroupTiebreaks, repechageCount);
      }
    } else if (currentPhase === 2) {
      const numGroups = categoryGroups.length;
      if (numGroups === 3) {
        // Fase 2 → Fase 3: verificar empate em 2º lugar quando há 3 grupos
        // (quando precisamos pegar o melhor 2º colocado)
        crossGroupTies = detectCrossGroupTies(categoryGroups, currentPhase, 1, tournament.crossGroupTiebreaks);
      } else if (numGroups >= 5) {
        // Fase 2 → Fase 3: verificar empate em Top 1 (posição 0) quando há 5+ grupos
        // (quando precisamos selecionar apenas 4 dos Top 1 para a fase final)
        // Verificar empates na zona de corte (4ª vaga)
        crossGroupTies = detectCrossGroupTies(categoryGroups, currentPhase, 0, tournament.crossGroupTiebreaks, 4);
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
            <div className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
              <p>⚠️ Resolva todos os desempates antes de concluir a fase</p>
              {hasCrossGroupTies && (
                <div className="mt-3 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg border border-yellow-300 dark:border-yellow-700">
                  <p className="font-medium mb-2">
                    🔗 Empate entre Grupos Detectado ({crossGroupTies.length} jogadores)
                  </p>
                  
                  {/* Mostrar estatísticas dos jogadores empatados */}
                  <div className="mb-2 space-y-1">
                    {crossGroupTies.map((tied, index) => (
                      <div key={tied.player.id} className="text-xs bg-white dark:bg-gray-800 p-2 rounded">
                        <span className="font-medium">{tied.player.nome}</span>
                        <span className="text-gray-500 ml-1">(Grupo {tied.groupOrigin})</span>
                        <div className="mt-1 text-gray-600 dark:text-gray-400">
                          {tied.stats.vitorias}V {tied.stats.derrotas}D | 
                          Games: {tied.stats.gamesGanhos}-{tied.stats.gamesPerdidos} | 
                          Saldo: {tied.stats.saldoGames >= 0 ? '+' : ''}{tied.stats.saldoGames}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Explicar por que estão empatados */}
                  <div className="mb-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                    <p className="font-medium mb-1">Por que estão empatados?</p>
                    <ul className="list-disc list-inside space-y-0.5 text-gray-700 dark:text-gray-300">
                      {/* Verificar se todos têm as mesmas vitórias */}
                      {crossGroupTies.every(t => t.stats.vitorias === crossGroupTies[0].stats.vitorias) && (
                        <li>✓ Mesmo número de vitórias ({crossGroupTies[0].stats.vitorias})</li>
                      )}
                      {/* Verificar se todos têm o mesmo saldo de games */}
                      {crossGroupTies.every(t => t.stats.saldoGames === crossGroupTies[0].stats.saldoGames) && (
                        <li>✓ Mesmo saldo de games ({crossGroupTies[0].stats.saldoGames >= 0 ? '+' : ''}{crossGroupTies[0].stats.saldoGames})</li>
                      )}
                      {/* Verificar games ganhos */}
                      {crossGroupTies.every(t => t.stats.gamesGanhos === crossGroupTies[0].stats.gamesGanhos) ? (
                        <li>✓ Mesmo número de games ganhos ({crossGroupTies[0].stats.gamesGanhos})</li>
                      ) : (
                        <li>
                          ⚠ Games ganhos diferentes: {crossGroupTies.map(t => `${t.player.nome} (${t.stats.gamesGanhos})`).join(' vs ')}
                          {crossGroupTies.every(t => t.stats.saldoGames === crossGroupTies[0].stats.saldoGames) && (
                            <span className="ml-1 text-green-600 dark:text-green-400">
                              → Todos têm o mesmo saldo de games ({crossGroupTies[0].stats.saldoGames >= 0 ? '+' : ''}{crossGroupTies[0].stats.saldoGames})
                            </span>
                          )}
                        </li>
                      )}
                    </ul>
                    <p className="mt-2 text-gray-600 dark:text-gray-400">
                      Como todos os critérios principais são iguais, é necessário resolver o empate manualmente.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      // Determinar a posição correta baseada na fase e número de grupos
                      let position: number;
                      if (currentPhase === 1) {
                        position = 2; // 3º lugar
                      } else if (currentPhase === 2) {
                        const numGroups = tournament?.grupos.filter(g => g.categoria === categoria && g.fase === currentPhase).length || 0;
                        if (numGroups >= 5) {
                          position = 0; // Top 1 (para selecionar 4 melhores)
                        } else if (numGroups === 3) {
                          position = 1; // 2º lugar (para melhor 2º colocado)
                        } else {
                          position = 1; // Default: 2º lugar
                        }
                      } else {
                        position = 1; // Default
                      }
                      
                      setCrossGroupTieData({
                        tiedPlayers: crossGroupTies,
                        phase: currentPhase,
                        position
                      });
                      setShowCrossGroupTieModal(true);
                    }}
                    className="w-full px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Resolver Empate entre Grupos
                  </button>
                </div>
              )}
            </div>
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
                  <div className="font-medium">{q.player.nome}</div>
                  <div className="text-gray-500">({q.groupOrigin} - {q.position}º)</div>
                  {q.tiebreakCriteria && (
                    <div className="text-green-700 dark:text-green-300 font-medium mt-1">
                      Critério: {q.tiebreakCriteria}
                    </div>
                  )}
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
                    <div className="font-medium">{q.player.nome}</div>
                    <div className="text-gray-500">({q.groupOrigin} - {q.position}º)</div>
                    {q.tiebreakCriteria && (
                      <div className="text-yellow-700 dark:text-yellow-300 font-medium mt-1">
                        Critério: {q.tiebreakCriteria}
                      </div>
                    )}
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
