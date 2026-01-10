/**
 * PDF Service
 * Gera PDF com informações completas do torneio
 */

import jsPDF from 'jspdf';
import type { Tournament, Group, RankingEntry, Match, SetScore } from '@/types';
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
  const darkGray = [64, 64, 64];
  const lightGray = [200, 200, 200];

  // ============================================
  // CABEÇALHO
  // ============================================
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(tournament.nome, pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(`Categoria: ${categoria}`, pageWidth / 2, 32, { align: 'center' });
  
  yPosition = 50;

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

  // Coletar grupos da categoria
  const categoryGroups = tournament.grupos.filter(g => g.categoria === categoria);
  const maxPhase = getMaxPhaseService(categoryGroups, categoria);
  
  // Estatísticas gerais
  const totalGroups = categoryGroups.length;
  const totalMatches = categoryGroups.reduce((sum, g) => sum + g.matches.length, 0);
  const finishedMatches = categoryGroups.reduce((sum, g) => 
    sum + g.matches.filter(m => m.isFinished).length, 0
  );
  
  // Coletar todos os jogadores únicos que participaram
  const allPlayers = new Map<string, { player: any; phases: number[] }>();
  categoryGroups.forEach(group => {
    group.players.forEach(player => {
      if (!allPlayers.has(player.id)) {
        allPlayers.set(player.id, { player, phases: [] });
      }
      const entry = allPlayers.get(player.id)!;
      if (!entry.phases.includes(group.fase)) {
        entry.phases.push(group.fase);
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
  
  let playersPerColumn = 0;
  const maxPlayersPerPage = 25;
  const columnWidth = (pageWidth - 2 * margin) / 2;
  let currentColumn = 0;
  let columnX = margin;

  playersList.forEach((entry, index) => {
    if (playersPerColumn >= maxPlayersPerPage) {
      if (currentColumn === 0) {
        currentColumn = 1;
        columnX = margin + columnWidth;
        yPosition = margin + 18; // Reset Y para segunda coluna
        playersPerColumn = 0;
      } else {
        // Nova página
        doc.addPage();
        yPosition = margin + 18;
        currentColumn = 0;
        columnX = margin;
        playersPerColumn = 0;
      }
    }

    const playerName = entry.player.nome;
    const seedText = entry.player.isSeed ? ' (SEED)' : '';
    
    doc.text(`${playerName}${seedText}`, columnX, yPosition);
    yPosition += 5;
    playersPerColumn++;
  });

  // Reset para próxima seção - calcular Y corretamente
  if (currentColumn === 1) {
    // Se estava na segunda coluna, calcular Y baseado na coluna
    yPosition = margin + 18 + (playersPerColumn * 5) + 10;
  } else {
    yPosition += 10;
  }
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
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`FASE ${phase}${phase === 3 ? ' (FINAL)' : ''}`, margin + 5, yPosition + 2);
    yPosition += 10;

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

      // Cabeçalho da tabela
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(...lightGray);
      doc.rect(margin, yPosition - 4, pageWidth - 2 * margin, 6, 'F');
      
      doc.setTextColor(0, 0, 0);
      doc.text('Pos', margin + 2, yPosition);
      doc.text('Jogador', margin + 15, yPosition);
      doc.text('V', margin + 75, yPosition);
      doc.text('D', margin + 85, yPosition);
      doc.text('Games', margin + 95, yPosition);
      doc.text('Pts (saldo)', margin + 130, yPosition);
      yPosition += 6;

      // Linhas da tabela
      doc.setFont('helvetica', 'normal');
      ranking.forEach((entry, index) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = margin;
        }

        const isChampion = phase === 3 && index === 0;
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
        // Não mostrar badges de classificação/eliminação no PDF - são apenas para visualização histórica
        
        doc.text(playerName.substring(0, 28), margin + 15, yPosition);
        doc.text(`${entry.vitorias}`, margin + 75, yPosition);
        doc.text(`${entry.derrotas}`, margin + 85, yPosition);
        doc.text(`${entry.gamesGanhos}-${entry.gamesPerdidos}`, margin + 95, yPosition);
        doc.text(`${entry.vitorias} (${entry.saldoGames >= 0 ? '+' : ''}${entry.saldoGames})`, margin + 130, yPosition);
        
        yPosition += 5;
      });

      yPosition += 5; // Espaço entre grupos
    });

    yPosition += 5; // Espaço entre fases
  }

  // ============================================
  // RESULTADOS DE JOGOS POR FASE
  // ============================================
  for (let phase = 1; phase <= maxPhase; phase++) {
    const phaseGroups = categoryGroups.filter(g => g.fase === phase);
    if (phaseGroups.length === 0) continue;

    // Verificar se precisa de nova página
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    // Título da seção de jogos
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(`RESULTADOS DOS JOGOS - FASE ${phase}${phase === 3 ? ' (FINAL)' : ''}`, margin, yPosition);
    yPosition += 8;

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
      doc.setTextColor(...darkGray);
      doc.text(`Grupo ${group.nome}`, margin, yPosition);
      yPosition += 6;

      // Função auxiliar para formatar jogadores
      const formatMatchPlayers = (match: Match): string => {
        if (match.isTiebreaker && match.jogador1A.id === match.jogador2A.id && match.jogador1B.id === match.jogador2B.id) {
          // Partida de simples (desempate)
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

    yPosition += 5; // Espaço entre fases
  }

  // ============================================
  // RESULTADOS DE JOGOS POR FASE
  // ============================================
  for (let phase = 1; phase <= maxPhase; phase++) {
    const phaseGroups = categoryGroups.filter(g => g.fase === phase);
    if (phaseGroups.length === 0) continue;

    // Verificar se precisa de nova página
    if (yPosition > pageHeight - 60) {
      doc.addPage();
      yPosition = margin;
    }

    // Título da seção de jogos
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...primaryColor);
    doc.text(`RESULTADOS DOS JOGOS - FASE ${phase}${phase === 3 ? ' (FINAL)' : ''}`, margin, yPosition);
    yPosition += 8;

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
      doc.setTextColor(...darkGray);
      doc.text(`Grupo ${group.nome}`, margin, yPosition);
      yPosition += 6;

      // Função auxiliar para formatar jogadores
      const formatMatchPlayers = (match: Match): string => {
        if (match.isTiebreaker && match.jogador1A.id === match.jogador2A.id && match.jogador1B.id === match.jogador2B.id) {
          // Partida de simples (desempate)
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

    yPosition += 5; // Espaço entre fases
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
        doc.setFillColor(...primaryColor);
        doc.rect(margin, yPosition - 5, pageWidth - 2 * margin, 30, 'F');
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        doc.text('CAMPEAO', pageWidth / 2, yPosition + 5, { align: 'center' });
        yPosition += 8;

        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text(champion.player.nome.toUpperCase(), pageWidth / 2, yPosition + 5, { align: 'center' });
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(
          `Categoria: ${categoria} | Vitorias: ${championStats.vitorias} | Saldo Games: ${championStats.saldoGames >= 0 ? '+' : ''}${championStats.saldoGames}`,
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
