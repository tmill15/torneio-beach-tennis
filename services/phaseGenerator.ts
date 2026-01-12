import { v4 as uuidv4 } from 'uuid';
import type { Group, Player, Tournament, RankingEntry, CrossGroupTiebreak } from '@/types';
import { calculateRanking } from './rankingService';
import { generatePairsFor4Players, generateSinglesMatch } from './matchGenerator';
import { shufflePlayers } from './groupGenerator';

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
  // IMPORTANTE: Só verificar empates cross-group quando realmente precisamos selecionar
  // jogadores de uma posição específica entre grupos diferentes
  
  if (phase === 1) {
    // Fase 1 → Fase 2: verificar empates em 3º lugar APENAS se precisar de repescagem
    // Calcular se precisa de repescagem
    const directCount = phaseGroups.length * 2; // Top 2 de cada grupo
    const targetGroupSize = 4;
    const idealGroups = Math.floor(directCount / targetGroupSize);
    const remainder = directCount % targetGroupSize;
    const repechageCount = remainder > 0 ? (idealGroups + 1) * targetGroupSize - directCount : 0;
    
    // Só verificar empates cross-group se realmente precisamos de repescagem
    if (repechageCount > 0) {
      const crossGroupTies = detectCrossGroupTies(phaseGroups, phase, 2, tournament?.crossGroupTiebreaks, repechageCount);
      if (crossGroupTies.length > 1) return true;
    }
  } else if (phase === 2) {
    const numGroups = phaseGroups.length;
    if (numGroups === 3) {
      // Fase 2 → Fase 3: verificar empates em 2º lugar quando há 3 grupos
      // (quando precisamos pegar o melhor 2º colocado)
      const crossGroupTies = detectCrossGroupTies(phaseGroups, phase, 1, tournament?.crossGroupTiebreaks);
      if (crossGroupTies.length > 1) return true;
    } else if (numGroups >= 5) {
      // Fase 2 → Fase 3: verificar empates em Top 1 (posição 0) quando há 5+ grupos
      // (quando precisamos selecionar apenas 4 dos Top 1 para a fase final)
      // Verificar empates na zona de corte (4ª vaga)
      const crossGroupTies = detectCrossGroupTies(phaseGroups, phase, 0, tournament?.crossGroupTiebreaks, 4);
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
  
  // Critério final de desempate: ordem alfabética do nome do jogador
  // Isso garante ordenação determinística quando há empate técnico completo
  // (mesmas vitórias, saldo de games e games ganhos)
  return a.player.nome.localeCompare(b.player.nome, 'pt-BR');
}

/**
 * Detecta empates entre jogadores de grupos diferentes em uma posição específica
 * @param groups - Grupos da fase
 * @param phase - Número da fase
 * @param position - Posição no ranking (0 = 1º, 1 = 2º, 2 = 3º, etc.)
 * @param crossGroupTiebreaks - Desempates cross-group já resolvidos
 * @param repechageCount - Número de vagas disponíveis (opcional, para detectar empates na zona de corte)
 */
export function detectCrossGroupTies(
  groups: Group[],
  phase: number,
  position: number,
  crossGroupTiebreaks?: CrossGroupTiebreak[],
  repechageCount?: number
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
  // IMPORTANTE: Remover o critério alfabético temporariamente para detectar empates técnicos
  candidates.sort((a, b) => {
    if (a.stats.vitorias !== b.stats.vitorias) return b.stats.vitorias - a.stats.vitorias;
    if (a.stats.saldoGames !== b.stats.saldoGames) return b.stats.saldoGames - a.stats.saldoGames;
    if (a.stats.gamesGanhos !== b.stats.gamesGanhos) return b.stats.gamesGanhos - a.stats.gamesGanhos;
    
    // Verificar desempates cross-group resolvidos
    if (crossGroupTiebreaks) {
      const tiebreak = crossGroupTiebreaks.find(
        t => t.phase === phase && 
             t.position === position && 
             t.tiedPlayerIds.includes(a.player.id) && 
             t.tiedPlayerIds.includes(b.player.id)
      );
      
      if (tiebreak) {
        if (tiebreak.winnerId === a.player.id) return -1;
        if (tiebreak.winnerId === b.player.id) return 1;
      }
    }
    
    return 0; // Empate técnico - não usar ordem alfabética aqui
  });
  
  // Determinar quais candidatos estão competindo pela mesma vaga
  // Se há repechageCount definido, verificar empates apenas na zona de corte
  const ties: { player: Player; stats: RankingEntry; groupOrigin: string }[] = [];
  
  if (repechageCount !== undefined && repechageCount > 0) {
    // Verificar empates apenas entre candidatos que competem pela última vaga disponível
    // Exemplo: se precisa de 2 vagas, verificar empates entre o candidato na posição 1 (2ª vaga) 
    // e candidatos seguintes que têm as mesmas estatísticas
    
    const lastQualifiedIndex = repechageCount - 1; // Índice do último candidato que seria classificado
    
    if (candidates.length > lastQualifiedIndex) {
      const lastQualified = candidates[lastQualifiedIndex];
      const lastQualifiedStats = lastQualified.stats;
      
      // Verificar todos os candidatos que têm empate técnico com o último classificado
      // (incluindo o próprio último classificado e os seguintes)
      for (let i = lastQualifiedIndex; i < candidates.length; i++) {
        const candidate = candidates[i];
        const candidateStats = candidate.stats;
        
        // Verificar se tem empate técnico completo com o último classificado
        const isTied = candidateStats.vitorias === lastQualifiedStats.vitorias &&
                       candidateStats.saldoGames === lastQualifiedStats.saldoGames &&
                       candidateStats.gamesGanhos === lastQualifiedStats.gamesGanhos;
        
        if (isTied) {
          // Verificar se não há desempate entre grupos já resolvido ou partida pendente
          // Verificar se há algum tiebreak que inclua este jogador (mesma fase e posição)
          const tiebreak = crossGroupTiebreaks?.find(
            t => t.phase === phase && 
                 t.position === position && 
                 t.tiedPlayerIds.includes(candidate.player.id)
          );
          
          // Se não encontrou, verificar se há algum tiebreak na mesma fase (pode ser posição diferente)
          const anyTiebreakInPhase = !tiebreak ? crossGroupTiebreaks?.find(
            t => t.phase === phase && 
                 t.tiedPlayerIds.includes(candidate.player.id)
          ) : null;
          
          const relevantTiebreak = tiebreak || anyTiebreakInPhase;
          
          // Se há desempate resolvido (com winnerId não vazio) ou partida pendente (com matchId mas sem winnerId), não incluir
          const hasResolved = relevantTiebreak && relevantTiebreak.winnerId && relevantTiebreak.winnerId.length > 0;
          const hasPending = relevantTiebreak && relevantTiebreak.matchId && (!relevantTiebreak.winnerId || relevantTiebreak.winnerId.length === 0);
          const hasResolvedOrPending = hasResolved || hasPending;
          
          if (!hasResolvedOrPending) {
            // Só incluir se não há desempate resolvido nem partida pendente
            ties.push(candidate);
          } else {
            // Se há desempate resolvido ou partida pendente, parar de verificar
            break;
          }
        } else {
          // Se encontrou alguém com estatísticas diferentes, parar (não há mais empates)
          break;
        }
      }
    }
  } else {
    // Sem repechageCount, verificar apenas empates no primeiro candidato (comportamento original)
    const firstStats = candidates[0].stats;
    
    for (const candidate of candidates) {
      const isTied = candidate.stats.vitorias === firstStats.vitorias &&
                     candidate.stats.saldoGames === firstStats.saldoGames &&
                     candidate.stats.gamesGanhos === firstStats.gamesGanhos;
      
      if (isTied) {
        // Verificar se não há desempate entre grupos já resolvido ou partida pendente
        // Verificar se há algum tiebreak que inclua este jogador (mesma fase e posição)
        const tiebreak = crossGroupTiebreaks?.find(
          t => t.phase === phase && 
               t.position === position && 
               t.tiedPlayerIds.includes(candidate.player.id)
        );
        
        // Se não encontrou, verificar se há algum tiebreak na mesma fase (pode ser posição diferente)
        const anyTiebreakInPhase = !tiebreak ? crossGroupTiebreaks?.find(
          t => t.phase === phase && 
               t.tiedPlayerIds.includes(candidate.player.id)
        ) : null;
        
        const relevantTiebreak = tiebreak || anyTiebreakInPhase;
        
        // Se há desempate resolvido (com winnerId não vazio) ou partida pendente (com matchId mas sem winnerId), não incluir
        const hasResolved = relevantTiebreak && relevantTiebreak.winnerId && relevantTiebreak.winnerId.length > 0;
        const hasPending = relevantTiebreak && relevantTiebreak.matchId && (!relevantTiebreak.winnerId || relevantTiebreak.winnerId.length === 0);
        const hasResolvedOrPending = hasResolved || hasPending;
        
        if (!hasResolvedOrPending) {
          // Só incluir se não há desempate resolvido nem partida pendente
          ties.push(candidate);
        }
      } else {
        break;
      }
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
 * GARANTE que a Fase 3 sempre tenha 2 ou 4 jogadores
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
    // Top 2 de cada grupo = 2 ou 4 jogadores (OK)
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
    // Top 1 de cada + melhor 2º = 4 jogadores (OK)
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
    repechage = getBestAtPosition(phaseGroups, phase, 1, 1, 'repechage', tournament);
  } else if (numGroups === 4) {
    // Top 1 de cada = 4 jogadores (OK)
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
  } else {
    // 5+ grupos: Rankear Top 1 de cada e levar apenas os 4 melhores
    // Coletar todos os Top 1
    const top1s: { qualified: QualifiedPlayer, stats: RankingEntry }[] = [];
    for (const group of phaseGroups) {
      const ranking = calculateRanking(group);
      if (ranking.length > 0) {
        top1s.push({
          qualified: {
            player: ranking[0].player,
            type: 'direct',
            groupOrigin: group.nome,
            position: 1
          },
          stats: ranking[0]
        });
      }
    }
    
    // Ordenar por estatísticas (usando compareByRanking para considerar desempates resolvidos)
    top1s.sort((a, b) => compareByRanking(
      a.stats, 
      b.stats, 
      tournament?.crossGroupTiebreaks, 
      phase, 
      0 // Top 1 = posição 0
    ));
    
    // Pegar apenas os 4 melhores
    // Se houver empate na 4ª posição, o sistema de desempate cross-group será acionado automaticamente
    top1s.slice(0, 4).forEach(item => {
      direct.push(item.qualified);
    });
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
    
    // Gerar jogos para o grupo final
    if (groupPlayers.length === 2) {
      // Final com 2 jogadores: partida de simples
      finalGroup.matches = generateSinglesMatch(finalGroup);
    } else if (groupPlayers.length === 4) {
      // Final com 4 jogadores: Round Robin de pareamentos
      finalGroup.matches = generatePairsFor4Players(finalGroup);
    } else {
      // Para outros tamanhos, usar Round Robin de pareamentos (pode ser expandido no futuro)
      console.warn(`Grupo final com ${groupPlayers.length} jogadores - usando Round Robin padrão`);
      finalGroup.matches = generatePairsFor4Players(finalGroup);
    }
    
    newGroups.push(finalGroup);
  } else {
    // Fase 2 = Múltiplos grupos de 4
    const numGroups = Math.floor(totalPlayers / targetGroupSize);
  
    // IMPORTANTE: Embaralhar seeds e non-seeds antes de distribuir
    // Isso evita agrupamento sequencial (A com B, C com D, etc.)
    const shuffledSeeds = shufflePlayers(seeds.map(q => q.player));
    const shuffledNonSeeds = shufflePlayers(nonSeeds.map(q => q.player));
  
    // Distribuir seeds uniformemente (serpentina) para evitar que seeds fiquem juntos
    const seedGroups: Player[][] = Array.from({ length: numGroups }, () => []);
    shuffledSeeds.forEach((seed, index) => {
      const groupIndex = index % numGroups;
      seedGroups[groupIndex].push(seed);
    });
  
    // Distribuir non-seeds sequencialmente nos grupos
    let nonSeedIndex = 0;
    for (let i = 0; i < numGroups; i++) {
      const groupPlayers: Player[] = [...seedGroups[i]]; // Começar com seeds do grupo
      
      // Completar com não-seeds
      while (groupPlayers.length < targetGroupSize && nonSeedIndex < shuffledNonSeeds.length) {
        groupPlayers.push(shuffledNonSeeds[nonSeedIndex++]);
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
