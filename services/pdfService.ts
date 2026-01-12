/**
 * PDF Service
 * Gera PDF com informações completas do torneio
 */

import jsPDF from 'jspdf';
import type { Tournament, Group, RankingEntry, Match, SetScore, Player, CrossGroupTiebreak } from '@/types';
import { getMaxPhase as getMaxPhaseService } from './phaseGenerator';
import { formatDupla } from '@/types';

/**
 * Gera PDF com informações completas do torneio para uma categoria
 */
export function generateTournamentPDF(
  tournament: Tournament,
  categoria: string,
  getGroupRanking: (groupId: string) => RankingEntry[]
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Cores
  const primaryColor = [255, 140, 0]; // Laranja
  const primaryColorDark = [230, 120, 0]; // Laranja escuro
  const darkGray = [64, 64, 64];
  const lightGray = [240, 240, 240]; // Cinza mais claro
  const accentColor = [255, 200, 100]; // Laranja claro
  const successColor = [34, 197, 94]; // Verde
  const dangerColor = [239, 68, 68]; // Vermelho

  // ============================================
  // CABEÇALHO
  // ============================================
  // Fundo com gradiente (simulado com retângulos)
  doc.setFillColor(...primaryColorDark);
  doc.rect(0, 0, pageWidth, 45, 'F');
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  // Linha decorativa inferior
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 40, pageWidth, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text(tournament.nome.toUpperCase(), pageWidth / 2, 22, { align: 'center' });
  
  doc.setFontSize(13);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(255, 255, 255);
  doc.text(`Categoria: ${categoria.toUpperCase()}`, pageWidth / 2, 34, { align: 'center' });
  
  yPosition = 55;

  // ============================================
  // DATA E INFORMAÇÕES GERAIS
  // ============================================
  const currentDate = new Date();
  const dateStr = currentDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  doc.setTextColor(...darkGray);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data de geração: ${dateStr}`, margin, yPosition);
  yPosition += 6;
  
  // Configurações do jogo
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.text(
    `Formato: Melhor de ${tournament.gameConfig.quantidadeSets} set(s), ${tournament.gameConfig.gamesPerSet} games por set${tournament.gameConfig.tieBreakDecisivo ? ', tie-break decisivo' : ''}`,
    margin,
    yPosition
  );
  yPosition += 8;

  // Coletar grupos da categoria (excluir grupos especiais de desempate cross-group)
  const categoryGroups = tournament.grupos.filter(
    g => g.categoria === categoria && !g.nome.startsWith('DESEMPATE_CROSS_GROUP_')
  );
  const maxPhase = getMaxPhaseService(categoryGroups, categoria);
  
  // Estatísticas gerais
  const totalGroups = categoryGroups.length;
  const totalMatches = categoryGroups.reduce((sum, g) => sum + g.matches.length, 0);
  const finishedMatches = categoryGroups.reduce((sum, g) => 
    sum + g.matches.filter(m => m.isFinished).length, 0
  );
  
  // Coletar todos os jogadores únicos que participaram
  // Um jogador pode aparecer em múltiplas fases, mas deve aparecer apenas UMA VEZ na lista
  const allPlayers = new Map<string, { player: Player; phases: number[] }>();
  categoryGroups.forEach(group => {
    group.players.forEach(player => {
      if (!allPlayers.has(player.id)) {
        allPlayers.set(player.id, { player, phases: [group.fase] });
      } else {
        const entry = allPlayers.get(player.id)!;
        if (!entry.phases.includes(group.fase)) {
          entry.phases.push(group.fase);
        }
      }
    });
  });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMAÇÕES GERAIS', margin, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total de Grupos: ${totalGroups}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Total de Partidas: ${totalMatches}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Partidas Finalizadas: ${finishedMatches}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Total de Jogadores: ${allPlayers.size}`, margin, yPosition);
  yPosition += 6;
  doc.text(`Fases Realizadas: ${maxPhase}`, margin, yPosition);
  yPosition += 10;

  // Verificar se precisa de nova página
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = margin;
  }

  // ============================================
  // LISTA DE JOGADORES
  // ============================================
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('PARTICIPANTES', margin, yPosition);
  yPosition += 8;

  const playersList = Array.from(allPlayers.values())
    .sort((a, b) => a.player.nome.localeCompare(b.player.nome));

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const maxPlayersPerColumn = 25;
  const columnWidth = (pageWidth - 2 * margin) / 2;
  const startY = yPosition;
  let column1Y = startY;
  let column2Y = startY;
  let column1Count = 0;
  let column2Count = 0;
  let isFirstPage = true;

  playersList.forEach((entry) => {
    const playerName = entry.player.nome;
    const seedText = entry.player.isSeed ? ' (SEED)' : '';
    const fullText = `${playerName}${seedText}`;
    
    // Decidir em qual coluna colocar
    if (column1Count < maxPlayersPerColumn) {
      // Coluna 1
      doc.text(fullText, margin, column1Y);
      column1Y += 5;
      column1Count++;
    } else if (column2Count < maxPlayersPerColumn) {
      // Coluna 2
      doc.text(fullText, margin + columnWidth, column2Y);
      column2Y += 5;
      column2Count++;
    } else {
      // Nova página - resetar tudo
      doc.addPage();
      // Reescrever título na nova página
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkGray);
      doc.text('PARTICIPANTES', margin, margin + 8);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      column1Y = margin + 16;
      column2Y = margin + 16;
      column1Count = 0;
      column2Count = 0;
      doc.text(fullText, margin, column1Y);
      column1Y += 5;
      column1Count++;
    }
  });

  // Calcular Y final baseado na coluna mais baixa
  yPosition = Math.max(column1Y, column2Y) + 10;
  
  // Verificar se precisa de nova página
  if (yPosition > pageHeight - 40) {
    doc.addPage();
    yPosition = margin;
  }

  // ============================================
  // RESULTADOS POR FASE
  // ============================================
  for (let phase = 1; phase <= maxPhase; phase++) {
    const phaseGroups = categoryGroups.filter(g => g.fase === phase);
    if (phaseGroups.length === 0) continue;

    // Verificar se precisa de nova página
    if (yPosition > pageHeight - 80) {
      doc.addPage();
      yPosition = margin;
    }

    // Título da fase com fundo colorido
    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 8, 'F');
    
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`FASE ${phase}${phase === 3 ? ' (FINAL)' : ''}`, margin + 5, yPosition + 2);
    yPosition += 12;

    phaseGroups.forEach((group, groupIndex) => {
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = margin;
      }

      const ranking = getGroupRanking(group.id);
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkGray);
      doc.text(`Grupo ${group.nome}`, margin, yPosition);
      yPosition += 6;

      // Cabeçalho da tabela com estilo melhorado
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      // Fundo com gradiente sutil
      doc.setFillColor(...primaryColor);
      doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 6, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.text('Pos', margin + 2, yPosition);
      doc.text('Jogador', margin + 12, yPosition);
      doc.text('Status', margin + 58, yPosition);
      doc.text('V', margin + 88, yPosition);
      doc.text('D', margin + 95, yPosition);
      doc.text('Games', margin + 103, yPosition);
      doc.text('Pts (saldo)', margin + 138, yPosition);
      yPosition += 7;

      // Linhas da tabela com cores alternadas
      doc.setFont('helvetica', 'normal');
      ranking.forEach((entry, index) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = margin;
        }

        const isChampion = phase === 3 && index === 0;
        
        // Fundo alternado para melhor legibilidade (exceto campeão)
        if (!isChampion && index % 2 === 1) {
          doc.setFillColor(...lightGray);
          doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 5, 'F');
        }

        if (isChampion) {
          doc.setFillColor(...primaryColor);
          doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 5, 'F');
          doc.setTextColor(255, 255, 255);
        } else {
          doc.setTextColor(0, 0, 0);
        }

        doc.text(`${index + 1}`, margin + 2, yPosition);
        
        let playerName = entry.player.nome;
        if (entry.player.isSeed) playerName += ' (SEED)';
        
        // Determinar status: CLASSIFICADO ou ELIMINADO (ou posição na fase final)
        let statusText = '-';
        let hasTiebreak = false;
        
        // Na fase final (Fase 3), mostrar posição ao invés de status
        if (phase === 3) {
          const position = index + 1;
          statusText = `${position}º lugar`;
        } else {
          // Para outras fases, usar status normal
          if (entry.player.qualificationType === 'direct' || entry.player.qualificationType === 'repechage') {
            statusText = entry.player.qualificationType === 'repechage' ? 'REPESCAGEM' : 'CLASSIFICADO';
          } else if (entry.player.status === 'eliminated' && !entry.player.qualificationType) {
            statusText = 'ELIMINADO';
          }
        }
        
        // Verificar se houve desempate
        if (entry.player.tiebreakOrder) {
          hasTiebreak = true;
        }
        
        // Truncar nome se necessário, mas usar splitTextToSize para quebrar linha se muito longo
        const maxNameWidth = 43; // Largura máxima para nome (até coluna Status)
        const nameLines = doc.splitTextToSize(playerName, maxNameWidth);
        const nameY = yPosition;
        nameLines.forEach((line: string, lineIndex: number) => {
          doc.text(line, margin + 12, nameY + (lineIndex * 4));
        });
        
        // Ajustar Y position se nome quebrou em múltiplas linhas
        const nameHeight = nameLines.length > 1 ? (nameLines.length - 1) * 4 : 0;
        const statsY = yPosition + nameHeight;
        
        // Coluna de Status - apenas CLASSIFICADO ou ELIMINADO, com (*) se houver desempate
        // Na fase final, mostrar posição (1º lugar, 2º lugar, etc.)
        doc.setFontSize(8);
        const statusWithAsterisk = hasTiebreak ? `${statusText} (*)` : statusText;
        
        // Cor do status baseado no tipo (não aplicar cores na fase final)
        if (phase === 3) {
          // Fase final: texto preto normal
          doc.setTextColor(0, 0, 0);
        } else {
          // Outras fases: cores específicas
          if (statusText === 'CLASSIFICADO') {
            doc.setTextColor(...successColor);
          } else if (statusText === 'REPESCAGEM') {
            doc.setTextColor(255, 215, 0); // Amarelo
          } else if (statusText === 'ELIMINADO') {
            doc.setTextColor(...dangerColor);
          } else {
            doc.setTextColor(0, 0, 0);
          }
        }
        
        doc.text(statusWithAsterisk, margin + 58, statsY);
        
        // Restaurar cor padrão
        if (isChampion) {
          doc.setTextColor(255, 255, 255);
        } else {
          doc.setTextColor(0, 0, 0);
        }
        
        // Usar a maior altura entre nome e status para alinhar as outras colunas
        const finalStatsY = statsY;
        
        doc.text(`${entry.vitorias}`, margin + 88, finalStatsY);
        doc.text(`${entry.derrotas}`, margin + 95, finalStatsY);
        doc.text(`${entry.gamesGanhos}-${entry.gamesPerdidos}`, margin + 103, finalStatsY);
        doc.text(`${entry.vitorias} (${entry.saldoGames >= 0 ? '+' : ''}${entry.saldoGames})`, margin + 138, finalStatsY);
        
        // Ajustar Y position baseado na maior altura (nome ou status)
        const maxHeight = nameHeight;
        yPosition += 5 + maxHeight;
      });

      yPosition += 5; // Espaço entre grupos
    });

    // Adicionar legenda do asterisco no final de toda a classificação da fase
    // Verificar se há algum desempate em algum grupo da fase
    const hasTiebreakInPhase = phaseGroups.some(group => {
      const ranking = getGroupRanking(group.id);
      return ranking.some(entry => entry.player.tiebreakOrder);
    });

    if (hasTiebreakInPhase) {
      yPosition += 3;
      doc.setFontSize(7);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 100); // Cinza
      doc.text('(*) Desempate realizado', margin + 58, yPosition);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      yPosition += 10; // Mais espaço após a legenda
    }

    // ============================================
    // RESULTADOS DOS JOGOS DA FASE ATUAL
    // ============================================
    // Verificar se precisa de nova página
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    // Título da seção de jogos com estilo
    doc.setFillColor(...primaryColor);
    doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, 6, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`RESULTADOS DOS JOGOS - FASE ${phase}${phase === 3 ? ' (FINAL)' : ''}`, margin + 5, yPosition + 2);
    yPosition += 10;

    // Função auxiliar para formatar jogadores (definida uma vez por fase)
    const formatMatchPlayers = (match: Match): string => {
      // Verificar se é partida de simples (jogadores duplicados - pode ser desempate ou final)
      const isSingles = match.jogador1A.id === match.jogador2A.id && match.jogador1B.id === match.jogador2B.id;
      if (isSingles) {
        // Partida de simples (desempate ou final com 2 jogadores)
        return `${match.jogador1A.nome} × ${match.jogador1B.nome}`;
      }
      // Partida de duplas
      const duplaA = formatDupla(match.jogador1A, match.jogador2A);
      const duplaB = formatDupla(match.jogador1B, match.jogador2B);
      return `${duplaA} × ${duplaB}`;
    };

    // Função auxiliar para formatar placar
    const formatSetScore = (set: SetScore): string => {
      if (set.tieBreakA !== undefined && set.tieBreakB !== undefined) {
        return `${set.gamesA}-${set.gamesB} (${set.tieBreakA}-${set.tieBreakB})`;
      }
      return `${set.gamesA}-${set.gamesB}`;
    };

    phaseGroups.forEach((group) => {
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = margin;
      }

      const finishedMatches = group.matches.filter(m => m.isFinished);
      if (finishedMatches.length === 0) {
        yPosition += 5;
        return;
      }

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text(`Grupo ${group.nome}`, margin, yPosition);
      
      // Linha decorativa
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition + 2, margin + 30, yPosition + 2);
      
      yPosition += 8;

      // Ordenar jogos por rodada
      const sortedMatches = [...finishedMatches].sort((a, b) => a.rodada - b.rodada);

      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);

      sortedMatches.forEach((match) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = margin;
        }

        const playersText = formatMatchPlayers(match);
        const scoreText = match.sets.map(formatSetScore).join(', ');
        const isTiebreaker = match.isTiebreaker ? ' [DESEMPATE]' : '';
        
        // Truncar texto se muito longo
        const maxWidth = pageWidth - 2 * margin - 10;
        const matchText = `R${match.rodada}: ${playersText} (${scoreText})${isTiebreaker}`;
        
        // Quebrar linha se necessário
        const lines = doc.splitTextToSize(matchText, maxWidth);
        lines.forEach((line: string) => {
          doc.text(line, margin + 5, yPosition);
          yPosition += 4;
        });
        
        yPosition += 2; // Espaço entre jogos
      });

      yPosition += 5; // Espaço entre grupos
    });

    // ============================================
    // DESEMPATES ENTRE GRUPOS DA FASE ATUAL
    // ============================================
    const phaseCrossGroupTiebreaks = (tournament.crossGroupTiebreaks || []).filter(
      t => t.phase === phase
    );

    if (phaseCrossGroupTiebreaks.length > 0) {
      // Verificar se precisa de nova página
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = margin;
      }

      // Título da seção
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...primaryColor);
      doc.text(`DESEMPATES ENTRE GRUPOS - FASE ${phase}${phase === 3 ? ' (FINAL)' : ''}`, margin, yPosition);
      yPosition += 8;

      phaseCrossGroupTiebreaks.forEach((tiebreak) => {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 50) {
          doc.addPage();
          yPosition = margin;
        }

        // Encontrar os jogadores envolvidos
        const playersMap = new Map<string, Player>();
        phaseGroups.forEach(group => {
          group.players.forEach(player => {
            if (tiebreak.tiedPlayerIds.includes(player.id) && !playersMap.has(player.id)) {
              playersMap.set(player.id, player);
            }
          });
        });
        const players = Array.from(playersMap.values());

        // Encontrar o grupo de origem de cada jogador
        const getPlayerGroup = (playerId: string) => {
          for (const group of phaseGroups) {
            if (group.players.some(p => p.id === playerId)) {
              return group.nome;
            }
          }
          return '?';
        };

        // Encontrar a partida de desempate se existir
        // Buscar em grupos normais e grupos especiais de desempate
        let tiebreakMatch: Match | undefined;
        if (tiebreak.matchId) {
          // Buscar em grupos normais
          for (const group of phaseGroups) {
            const match = group.matches.find(m => m.id === tiebreak.matchId);
            if (match) {
              tiebreakMatch = match;
              break;
            }
          }
          
          // Se não encontrou, buscar em grupos especiais de desempate
          if (!tiebreakMatch) {
            const allCategoryGroups = tournament.grupos.filter(
              g => g.categoria === categoria && g.fase === phase
            );
            for (const group of allCategoryGroups) {
              const match = group.matches.find(m => m.id === tiebreak.matchId);
              if (match) {
                tiebreakMatch = match;
                break;
              }
            }
          }
        }

        // Encontrar o vencedor
        const winner = players.find(p => p.id === tiebreak.winnerId);
        
        const getMethodLabel = () => {
          switch (tiebreak.method) {
            case 'manual':
              return 'Seleção Manual';
            case 'random':
              return 'Sorteio';
            case 'singles':
              return 'Partida de Simples';
            default:
              return 'Desconhecido';
          }
        };

        // Box do desempate
        doc.setFillColor(255, 250, 200); // Amarelo claro
        doc.rect(margin, yPosition - 3, pageWidth - 2 * margin, 8, 'F');
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`Desempate entre ${players.length} jogador(es)`, margin + 5, yPosition + 2);
        yPosition += 10;

        // Participantes
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkGray);
        doc.text('Participantes:', margin + 5, yPosition);
        yPosition += 6;

        players.forEach(player => {
          if (yPosition > pageHeight - 20) {
            doc.addPage();
            yPosition = margin;
          }

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0); // Preto para todos
          
          const playerText = `${player.nome} (Grupo ${getPlayerGroup(player.id)})`;
          doc.text(playerText, margin + 10, yPosition);
          yPosition += 5;
        });

        // Método de desempate
        yPosition += 3;
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...darkGray);
        doc.text(`Método: ${getMethodLabel()}`, margin + 5, yPosition);
        yPosition += 6;

        // Resultado (se houver vencedor)
        if (winner) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0); // Preto
          doc.text(`Resultado: ${winner.nome} (Grupo ${getPlayerGroup(winner.id)}) classificado`, margin + 5, yPosition);
          yPosition += 6;
        }

        // Partida de desempate (se existir e estiver finalizada)
        if (tiebreakMatch && tiebreakMatch.isFinished) {
          yPosition += 3;
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(0, 0, 0);
          
          const formatSetScore = (set: SetScore): string => {
            if (set.tieBreakA !== undefined && set.tieBreakB !== undefined) {
              return `${set.gamesA}-${set.gamesB} (${set.tieBreakA}-${set.tieBreakB})`;
            }
            return `${set.gamesA}-${set.gamesB}`;
          };

          const isSingles = tiebreakMatch.jogador1A.id === tiebreakMatch.jogador2A.id && 
                           tiebreakMatch.jogador1B.id === tiebreakMatch.jogador2B.id;
          const playersText = isSingles
            ? `${tiebreakMatch.jogador1A.nome} × ${tiebreakMatch.jogador1B.nome}`
            : `${formatDupla(tiebreakMatch.jogador1A, tiebreakMatch.jogador2A)} × ${formatDupla(tiebreakMatch.jogador1B, tiebreakMatch.jogador2B)}`;
          const scoreText = tiebreakMatch.sets.map(formatSetScore).join(', ');
          
          doc.text(`Partida: ${playersText} (${scoreText})`, margin + 10, yPosition);
          yPosition += 6;
        }

        yPosition += 8; // Espaço entre desempates
      });
    }

    yPosition += 10; // Espaço entre fases
  }

  // ============================================
  // CAMPEÃO (se fase 3 existe)
  // ============================================
  if (maxPhase === 3) {
    const finalGroups = categoryGroups.filter(g => g.fase === 3);
    if (finalGroups.length > 0) {
      const finalGroup = finalGroups[0];
      const finalRanking = getGroupRanking(finalGroup.id);
      
      if (finalRanking.length > 0 && tournament.completedCategories?.includes(categoria)) {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          yPosition = margin;
        }

        const champion = finalRanking[0];
        const championStats = champion;
        
        // Box destacado para o campeão
        // Fundo laranja simples
        doc.setFillColor(...primaryColor);
        doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 33, 'F');
        
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('CAMPEÃO', pageWidth / 2, yPosition + 4, { align: 'center' });
        yPosition += 10;

        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text(champion.player.nome.toUpperCase(), pageWidth / 2, yPosition + 6, { align: 'center' });
        yPosition += 10;

        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(255, 255, 255);
        doc.text(
          `Categoria: ${categoria.toUpperCase()} | Vitórias: ${championStats.vitorias} | Saldo Games: ${championStats.saldoGames >= 0 ? '+' : ''}${championStats.saldoGames}`,
          pageWidth / 2,
          yPosition + 5,
          { align: 'center' }
        );
        yPosition += 15;
      }
    }
  }

  // ============================================
  // RODAPÉ
  // ============================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }

  // ============================================
  // SALVAR PDF
  // ============================================
  const fileName = `${tournament.nome.replace(/\s+/g, '_')}_${categoria}_${currentDate.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
