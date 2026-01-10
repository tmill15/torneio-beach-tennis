import { v4 as uuidv4 } from 'uuid';
import type { Group, Player, Tournament, RankingEntry } from '@/types';
import { calculateRanking } from './rankingService';
import { generatePairsFor4Players } from './matchGenerator';

export type QualificationType = 'direct' | 'repechage' | 'eliminated';

export interface QualifiedPlayer {
  player: Player;
  type: QualificationType;
  groupOrigin: string;
  position: number;
}

/**
 * Verifica se todos os jogos de uma fase estão concluídos
 */
export function isPhaseComplete(groups: Group[], phase: number): boolean {
  const phaseGroups = groups.filter(g => g.fase === phase);
  if (phaseGroups.length === 0) return false;
  
  return phaseGroups.every(group => 
    group.matches.every(match => match.isFinished)
  );
}

/**
 * Compara dois candidatos à repescagem/segundo lugar
 */
function compareByRanking(a: RankingEntry, b: RankingEntry): number {
  if (a.vitorias !== b.vitorias) return b.vitorias - a.vitorias;
  if (a.saldoGames !== b.saldoGames) return b.saldoGames - a.saldoGames;
  if (a.gamesGanhos !== b.gamesGanhos) return b.gamesGanhos - a.gamesGanhos;
  return 0;
}

/**
 * Obtém os melhores de uma posição específica (ex: melhores 2º ou 3º lugares)
 */
function getBestAtPosition(
  groups: Group[],
  phase: number,
  position: number,
  count: number,
  type: QualificationType
): QualifiedPlayer[] {
  const candidates: { qualified: QualifiedPlayer, stats: RankingEntry }[] = [];
  
  for (const group of groups.filter(g => g.fase === phase)) {
    const ranking = calculateRanking(group);
    if (ranking.length > position) {
      const entry = ranking[position];
      candidates.push({
        qualified: {
          player: entry.player,
          type,
          groupOrigin: group.nome,
          position: position + 1
        },
        stats: entry
      });
    }
  }
  
  candidates.sort((a, b) => compareByRanking(a.stats, b.stats));
  return candidates.slice(0, count).map(c => c.qualified);
}

/**
 * Obtém classificados e repescagem para Fase 1 → Fase 2
 */
export function getPhase1ToPhase2Classification(
  groups: Group[],
  phase: number
): { direct: QualifiedPlayer[], repechage: QualifiedPlayer[] } {
  const phaseGroups = groups.filter(g => g.fase === phase);
  const direct: QualifiedPlayer[] = [];
  
  // Top 2 de cada grupo
  for (const group of phaseGroups) {
    const ranking = calculateRanking(group);
    ranking.slice(0, 2).forEach((entry, index) => {
      direct.push({
        player: entry.player,
        type: 'direct',
        groupOrigin: group.nome,
        position: index + 1
      });
    });
  }
  
  // Calcular repescagem necessária (APENAS se não fechar grupos simétricos)
  const directCount = direct.length;
  const targetGroupSize = 4;
  const idealGroups = Math.floor(directCount / targetGroupSize);
  const remainder = directCount % targetGroupSize;
  
  let repechageCount = 0;
  if (remainder > 0) {
    // Precisa completar para formar (idealGroups + 1) grupos completos
    repechageCount = (idealGroups + 1) * targetGroupSize - directCount;
    // Exemplos:
    // - 10 diretos: 10%4=2 → precisa 2 repescados → 12 total (3 grupos)
    // - 14 diretos: 14%4=2 → precisa 2 repescados → 16 total (4 grupos)
    // - 12 diretos: 12%4=0 → precisa 0 repescados → 12 total (3 grupos)
  }
  
  // Obter melhores 3º lugares (pode ser 0, 1, 2, 3... dependendo do necessário)
  const repechage = getBestAtPosition(phaseGroups, phase, 2, repechageCount, 'repechage');
  
  return { direct, repechage };
}

/**
 * Obtém classificados para Fase 2 → Fase 3 (Final)
 * Lógica dinâmica baseada no número de grupos
 */
export function getPhase2ToPhase3Classification(
  groups: Group[],
  phase: number
): { direct: QualifiedPlayer[], repechage: QualifiedPlayer[] } {
  const phaseGroups = groups.filter(g => g.fase === phase);
  const numGroups = phaseGroups.length;
  const direct: QualifiedPlayer[] = [];
  let repechage: QualifiedPlayer[] = [];
  
  if (numGroups <= 2) {
    // Top 2 de cada grupo
    for (const group of phaseGroups) {
      const ranking = calculateRanking(group);
      ranking.slice(0, 2).forEach((entry, index) => {
        direct.push({
          player: entry.player,
          type: 'direct',
          groupOrigin: group.nome,
          position: index + 1
        });
      });
    }
  } else if (numGroups === 3) {
    // Top 1 de cada + melhor 2º
    for (const group of phaseGroups) {
      const ranking = calculateRanking(group);
      if (ranking.length > 0) {
        direct.push({
          player: ranking[0].player,
          type: 'direct',
          groupOrigin: group.nome,
          position: 1
        });
      }
    }
    repechage = getBestAtPosition(phaseGroups, phase, 1, 1, 'repechage');
  } else {
    // Top 1 de cada grupo (4+ grupos)
    for (const group of phaseGroups) {
      const ranking = calculateRanking(group);
      if (ranking.length > 0) {
        direct.push({
          player: ranking[0].player,
          type: 'direct',
          groupOrigin: group.nome,
          position: 1
        });
      }
    }
  }
  
  return { direct, repechage };
}

/**
 * Marca jogadores como eliminados
 */
export function markEliminatedPlayers(
  tournament: Tournament,
  phase: number,
  qualified: QualifiedPlayer[]
): Tournament {
  const qualifiedIds = new Set(qualified.map(q => q.player.id));
  
  return {
    ...tournament,
    grupos: tournament.grupos.map(group => {
      if (group.fase !== phase) return group;
      
      return {
        ...group,
        players: group.players.map(player => {
          if (qualifiedIds.has(player.id)) {
            return player;
          } else {
            return { 
              ...player, 
              status: 'eliminated' as const,
              eliminatedInPhase: phase 
            };
          }
        })
      };
    })
  };
}

/**
 * Gera próxima fase com lógica específica para cada transição
 */
export function generateNextPhase(
  tournament: Tournament,
  currentPhase: number,
  categoria: string
): Tournament {
  const categoryGroups = tournament.grupos.filter(
    g => g.categoria === categoria && g.fase === currentPhase
  );
  
  let direct: QualifiedPlayer[];
  let repechage: QualifiedPlayer[];
  let nextPhase = currentPhase + 1;
  
  // Determinar classificação baseado na fase atual
  if (currentPhase === 1) {
    // Fase 1 → Fase 2
    ({ direct, repechage } = getPhase1ToPhase2Classification(categoryGroups, currentPhase));
  } else if (currentPhase === 2) {
    // Fase 2 → Fase 3 (Final)
    ({ direct, repechage } = getPhase2ToPhase3Classification(categoryGroups, currentPhase));
  } else {
    // Não há fase após a 3
    return tournament;
  }
  
  const allQualified = [...direct, ...repechage];
  
  // IMPORTANTE: SEMPRE separar e distribuir seeds uniformemente
  // Seeds devem estar em grupos diferentes em TODAS as fases do torneio
  // Isso garante competição equilibrada e evita que seeds se enfrentem cedo
  const seeds = allQualified.filter(q => q.player.isSeed);
  const nonSeeds = allQualified.filter(q => !q.player.isSeed);
  
  // Criar grupos
  const newGroups: Group[] = [];
  const totalPlayers = allQualified.length;
  const targetGroupSize = 4;
  
  if (nextPhase === 3) {
    // Fase 3 = Grupo Final Único
    const groupPlayers = [...seeds.map(q => q.player), ...nonSeeds.map(q => q.player)];
    
    const finalGroup: Group = {
      id: uuidv4(),
      nome: 'Grupo Final',
      fase: 3,
      categoria,
      players: groupPlayers.map(p => ({ 
        ...p, 
        status: 'enrolled',
        qualificationType: allQualified.find(q => q.player.id === p.id)?.type,
        // Limpar badges da fase anterior
        tiebreakOrder: undefined,
        tiebreakMethod: undefined,
        eliminatedInPhase: undefined
      })),
      matches: []
    };
    
    // Gerar jogos para o grupo final
    if (groupPlayers.length === 4) {
      finalGroup.matches = generatePairsFor4Players(finalGroup);
    } else {
      // TODO: Implementar gerador para grupos maiores que 4
      finalGroup.matches = generatePairsFor4Players(finalGroup);
    }
    
    newGroups.push(finalGroup);
  } else {
    // Fase 2 = Múltiplos grupos de 4
    const numGroups = Math.floor(totalPlayers / targetGroupSize);
  
  let seedIndex = 0;
  let nonSeedIndex = 0;
  
    for (let i = 0; i < numGroups; i++) {
    const groupPlayers: Player[] = [];
    
      // Distribuir seeds uniformemente
      const seedsPerGroup = Math.ceil(seeds.length / numGroups);
      for (let j = 0; j < seedsPerGroup && seedIndex < seeds.length; j++) {
        groupPlayers.push(seeds[seedIndex++].player);
    }
    
    // Completar com não-seeds
      while (groupPlayers.length < targetGroupSize && nonSeedIndex < nonSeeds.length) {
        groupPlayers.push(nonSeeds[nonSeedIndex++].player);
    }
    
      const groupName = String.fromCharCode(65 + i); // A, B, C...
      const group: Group = {
        id: uuidv4(),
        nome: `Grupo ${groupName}`,
        fase: nextPhase,
        categoria,
        players: groupPlayers.map(p => ({ 
          ...p, 
          status: 'enrolled',
          qualificationType: allQualified.find(q => q.player.id === p.id)?.type,
          // Limpar badges da fase anterior
          tiebreakOrder: undefined,
          tiebreakMethod: undefined,
          eliminatedInPhase: undefined
        })),
        matches: []
      };
      
      group.matches = generatePairsFor4Players(group);
      newGroups.push(group);
    }
  }
  
  return {
    ...tournament,
    grupos: [...tournament.grupos, ...newGroups]
  };
}

/**
 * Obtém o número da fase mais alta de uma categoria
 */
export function getMaxPhase(groups: Group[], categoria: string): number {
  const categoryGroups = groups.filter(g => g.categoria === categoria);
  if (categoryGroups.length === 0) return 0;
  return Math.max(...categoryGroups.map(g => g.fase));
}

/**
 * Verifica se é a fase final (fase 3)
 */
export function isFinalPhase(phase: number): boolean {
  return phase === 3;
}
