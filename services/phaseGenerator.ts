import { v4 as uuidv4 } from 'uuid';
import type { Group, Player, Tournament, RankingEntry, CrossGroupTiebreak } from '@/types';
import { calculateRanking } from './rankingService';
import { generatePairsFor4Players } from './matchGenerator';

export type QualificationType = 'direct' | 'repechage' | 'eliminated';

export interface QualifiedPlayer {
  player: Player;
  type: QualificationType;
  groupOrigin: string;
  position: number;
  tiebreakCriteria?: string; // Critério usado para desempate (ex: "Games vencidos")
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
 * Verifica se há desempates pendentes em uma fase
 * Retorna true se há desempates não resolvidos
 */
export function hasPendingTies(
  groups: Group[], 
  phase: number, 
  calculateRanking: (group: Group) => any[],
  tournament?: Tournament
): boolean {
  const phaseGroups = groups.filter(g => g.fase === phase);
  if (phaseGroups.length === 0) return false;
  
  // Importar detectTies dinamicamente para evitar dependência circular
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { detectTies } = require('@/services/rankingService');
  
  // Verificar empates dentro de grupos
  for (const group of phaseGroups) {
    const ranking = calculateRanking(group);
    const ties = detectTies(ranking);
    
    // Se há empates detectados, há desempates pendentes
    if (ties.length > 0) {
      return true;
    }
  }
  
  // Verificar empates entre grupos (para repescagem)
  // Fase 1 → Fase 2: verificar empates em 3º lugar
  // Fase 2 → Fase 3: verificar empates em 2º lugar (quando há 3 grupos)
  if (phase === 1) {
    const crossGroupTies = detectCrossGroupTies(phaseGroups, phase, 2, tournament?.crossGroupTiebreaks);
    if (crossGroupTies.length > 1) return true;
  } else if (phase === 2) {
    const numGroups = phaseGroups.length;
    if (numGroups === 3) {
      // Verificar empate em 2º lugar (melhor 2º colocado)
      const crossGroupTies = detectCrossGroupTies(phaseGroups, phase, 1, tournament?.crossGroupTiebreaks);
      if (crossGroupTies.length > 1) return true;
    }
  }
  
  return false;
}

/**
 * Compara dois candidatos à repescagem/segundo lugar
 */
function compareByRanking(a: RankingEntry, b: RankingEntry, crossGroupTiebreaks?: CrossGroupTiebreak[], phase?: number, position?: number): number {
  if (a.vitorias !== b.vitorias) return b.vitorias - a.vitorias;
  if (a.saldoGames !== b.saldoGames) return b.saldoGames - a.saldoGames;
  if (a.gamesGanhos !== b.gamesGanhos) return b.gamesGanhos - a.gamesGanhos;
  
  // Se há empate técnico, verificar se há desempate entre grupos resolvido
  if (crossGroupTiebreaks && phase !== undefined && position !== undefined) {
    const tiebreak = crossGroupTiebreaks.find(
      t => t.phase === phase && 
           t.position === position && 
           t.tiedPlayerIds.includes(a.player.id) && 
           t.tiedPlayerIds.includes(b.player.id)
    );
    
    if (tiebreak) {
      // Se um dos jogadores é o vencedor do desempate, ele vem primeiro
      if (tiebreak.winnerId === a.player.id) return -1;
      if (tiebreak.winnerId === b.player.id) return 1;
    }
  }
  
  return 0;
}

/**
 * Detecta empates entre jogadores de grupos diferentes em uma posição específica
 */
export function detectCrossGroupTies(
  groups: Group[],
  phase: number,
  position: number,
  crossGroupTiebreaks?: CrossGroupTiebreak[]
): { player: Player; stats: RankingEntry; groupOrigin: string }[] {
  const candidates: { player: Player; stats: RankingEntry; groupOrigin: string }[] = [];
  
  // Coletar todos os candidatos da posição especificada
  for (const group of groups.filter(g => g.fase === phase)) {
    const ranking = calculateRanking(group);
    if (ranking.length > position) {
      const entry = ranking[position];
      candidates.push({
        player: entry.player,
        stats: entry,
        groupOrigin: group.nome
      });
    }
  }
  
  if (candidates.length === 0) return [];
  
  // Ordenar candidatos considerando desempates entre grupos já resolvidos
  candidates.sort((a, b) => compareByRanking(a.stats, b.stats, crossGroupTiebreaks, phase, position));
  
  // Verificar se há empate técnico (mesmas estatísticas brutas) entre os primeiros candidatos
  // IMPORTANTE: Comparar apenas estatísticas brutas, sem considerar desempates entre grupos
  // Critério de empate entre grupos: mesmo número de vitórias E mesmo saldo de games E mesmo games ganhos
  // Se games ganhos for diferente, não é empate (o que tem mais games ganhos é classificado automaticamente)
  const ties: { player: Player; stats: RankingEntry; groupOrigin: string }[] = [];
  const firstStats = candidates[0].stats;
  
  // Verificar se o primeiro candidato tem empate técnico com outros
  for (const candidate of candidates) {
    // Comparar vitórias, saldo de games e games ganhos para detectar empate técnico entre grupos
    // Se todos os critérios são iguais, é empate e precisa resolução manual
    const isTied = candidate.stats.vitorias === firstStats.vitorias &&
                   candidate.stats.saldoGames === firstStats.saldoGames &&
                   candidate.stats.gamesGanhos === firstStats.gamesGanhos;
    
    if (isTied) {
      // Verificar se não há desempate entre grupos já resolvido
      const hasResolvedTiebreak = crossGroupTiebreaks?.some(
        t => t.phase === phase && 
             t.position === position && 
             t.tiedPlayerIds.includes(candidate.player.id) &&
             t.winnerId && t.winnerId.length > 0 // Deve ter um vencedor definido
      );
      
      if (!hasResolvedTiebreak) {
        ties.push(candidate);
      }
    } else {
      // Se encontrou alguém melhor, parar de procurar empates
      break;
    }
  }
  
  // Se há mais de um jogador empatado e não há desempate resolvido, retornar empate
  return ties.length > 1 ? ties : [];
}

/**
 * Obtém os melhores de uma posição específica (ex: melhores 2º ou 3º lugares)
 * Considera desempates entre grupos já resolvidos
 */
function getBestAtPosition(
  groups: Group[],
  phase: number,
  position: number,
  count: number,
  type: QualificationType,
  tournament?: Tournament
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
  
  // Ordenar considerando desempates entre grupos resolvidos
  candidates.sort((a, b) => compareByRanking(
    a.stats, 
    b.stats, 
    tournament?.crossGroupTiebreaks, 
    phase, 
    position
  ));
  
  // Verificar se o critério de games ganhos foi usado para desempate
  const result = candidates.slice(0, count).map((c, index) => {
    const qualified = c.qualified;
    const currentStats = c.stats;
    
    // Verificar se há outros candidatos com mesmas vitórias e saldo, mas games ganhos diferente
    // Se sim, games ganhos foi o critério usado para classificar este jogador
    const hasTieWithDifferentGames = candidates.some((other, otherIndex) => {
      if (otherIndex === index) return false; // Não comparar com ele mesmo
      if (otherIndex >= count) return false; // Só verificar candidatos selecionados
      
      const otherStats = other.stats;
      // Se vitórias e saldo são iguais, mas games ganhos é diferente
      return currentStats.vitorias === otherStats.vitorias &&
             currentStats.saldoGames === otherStats.saldoGames &&
             currentStats.gamesGanhos !== otherStats.gamesGanhos;
    });
    
    // Se este jogador tem mais games ganhos que alguém com mesmas vitórias e saldo, mostrar critério
    if (hasTieWithDifferentGames) {
      const tiedWithLessGames = candidates.some((other, otherIndex) => {
        if (otherIndex === index) return false;
        if (otherIndex >= count) return false;
        
        const otherStats = other.stats;
        return currentStats.vitorias === otherStats.vitorias &&
               currentStats.saldoGames === otherStats.saldoGames &&
               currentStats.gamesGanhos > otherStats.gamesGanhos;
      });
      
      if (tiedWithLessGames) {
        return {
          ...qualified,
          tiebreakCriteria: 'Games vencidos'
        };
      }
    }
    
    return qualified;
  });
  
  return result;
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
  // Nota: tournament não está disponível aqui, será passado quando necessário
  const repechage = getBestAtPosition(phaseGroups, phase, 2, repechageCount, 'repechage');
  
  return { direct, repechage };
}

/**
 * Obtém classificados para Fase 2 → Fase 3 (Final)
 * Lógica dinâmica baseada no número de grupos
 */
export function getPhase2ToPhase3Classification(
  groups: Group[],
  phase: number,
  tournament?: Tournament
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
    // Nota: tournament será passado quando necessário via função wrapper
    repechage = getBestAtPosition(phaseGroups, phase, 1, 1, 'repechage', tournament);
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
    ({ direct, repechage } = getPhase2ToPhase3Classification(categoryGroups, currentPhase, tournament));
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
      nome: 'A', // Usa letra como os outros grupos
      fase: 3,
      categoria,
      players: groupPlayers.map(p => {
        return {
          ...p,
          status: 'enrolled' as const, // Todos os jogadores na fase final estão enrolled
          // Fase 3 é a final - não há próxima fase, então não precisa de qualificationType
          qualificationType: undefined,
          // Limpar badges e status da fase anterior
          tiebreakOrder: undefined,
          tiebreakMethod: undefined,
          eliminatedInPhase: undefined
        };
      }),
      matches: []
    };
    
    // Gerar jogos para o grupo final (não há partidas de desempate ainda, então pode gerar normalmente)
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
        nome: groupName, // Apenas a letra (A, B, C...)
        fase: nextPhase,
        categoria,
        players: groupPlayers.map(p => {
          return {
            ...p,
            status: 'enrolled' as const, // Todos os jogadores na nova fase estão enrolled
            // NÃO atribuir qualificationType aqui - isso será feito quando avançar para a próxima fase
            qualificationType: undefined,
            // Limpar badges e status da fase anterior
            tiebreakOrder: undefined,
            tiebreakMethod: undefined,
            eliminatedInPhase: undefined
          };
        }),
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
