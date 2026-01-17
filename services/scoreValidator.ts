/**
 * Score Validator Service
 * Valida placares de Beach Tennis conforme regras ITF/CBT
 */

import type { SetScore, Tournament } from '@/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ScoreValidationConfig {
  quantidadeSets: number; // 1 ou 3
  gamesPerSet: number; // 4 ou 6
  tieBreakDecisivo: boolean; // Se o set decisivo é tie-break
  pontosTieBreak: number; // 7 ou 10
}

/**
 * Valida um placar completo de uma partida
 */
export function validateMatchScore(
  sets: SetScore[],
  config: ScoreValidationConfig
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // 1. Validar número de sets
  if (sets.length === 0) {
    errors.push('Nenhum set registrado');
    return { isValid: false, errors, warnings };
  }

  // 2. Validar cada set individualmente
  sets.forEach((set, index) => {
    const setNumber = index + 1;
    const isDecisiveSet = config.quantidadeSets === 3 && setNumber === 3;
    const setValidation = validateSet(set, config, isDecisiveSet);
    
    errors.push(...setValidation.errors.map(e => `Set ${setNumber}: ${e}`));
    warnings.push(...setValidation.warnings.map(w => `Set ${setNumber}: ${w}`));
  });

  // 3. Validar sequência de sets (vencedor do jogo)
  const setsWonA = sets.filter(s => s.gamesA > s.gamesB).length;
  const setsWonB = sets.filter(s => s.gamesB > s.gamesA).length;
  
  const setsNeededToWin = Math.ceil(config.quantidadeSets / 2);

  // 4. Verificar finalização prematura ou tardia
  if (setsWonA >= setsNeededToWin || setsWonB >= setsNeededToWin) {
    // Alguém já venceu
    if (sets.length > setsWonA + setsWonB) {
      errors.push(
        `Partida deveria ter terminado em ${setsWonA}x${setsWonB}. ` +
        `Há sets extras registrados após a vitória.`
      );
    }
  } else {
    // Ninguém venceu ainda
    if (config.quantidadeSets === 3 && sets.length === 2) {
      warnings.push(
        `Partida incompleta: Placar atual ${setsWonA}x${setsWonB}. ` +
        `É necessário um terceiro set para definir o vencedor.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Valida um set individual
 */
function validateSet(
  set: SetScore,
  config: ScoreValidationConfig,
  isDecisiveSet: boolean
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { gamesA, gamesB } = set;
  const maxGames = config.gamesPerSet;
  const winner = gamesA > gamesB ? 'A' : 'B';
  const winnerGames = Math.max(gamesA, gamesB);
  const loserGames = Math.min(gamesA, gamesB);

  // Se é set decisivo com tie-break especial
  if (isDecisiveSet && config.tieBreakDecisivo) {
    return validateTieBreakSet(set, config.pontosTieBreak);
  }

  // Validação de sets normais (4 ou 6 games)
  if (maxGames === 6) {
    // Sets de 6 games
    if (winnerGames === 6) {
      // Vitória normal por 6
      if (loserGames > 4) {
        errors.push(
          `Placar inválido ${gamesA}x${gamesB}. ` +
          `Com 6 games, o adversário só pode ter até 4 games (não ${loserGames}).`
        );
      }
    } else if (winnerGames === 7) {
      // Vitória por 7 (após empate em 5x5 ou 6x6 com tie-break)
      if (loserGames === 6) {
        // Tie-break: 7x6 é válido
      } else if (loserGames === 5) {
        // Vitória por 7x5 (após 5x5) é válida
      } else {
        errors.push(
          `Placar inválido ${gamesA}x${gamesB}. ` +
          `Com 7 games, o adversário deve ter 5 ou 6 games.`
        );
      }
    } else if (winnerGames === 5 && loserGames === 6) {
      errors.push(
        `Placar impossível ${gamesA}x${gamesB}. ` +
        `Não é possível ter 6x5 em sets de 6 games.`
      );
    } else if (winnerGames < 6) {
      errors.push(
        `Placar incompleto ${gamesA}x${gamesB}. ` +
        `O vencedor deve ter pelo menos 6 games.`
      );
    } else if (winnerGames > 7) {
      errors.push(
        `Placar inválido ${gamesA}x${gamesB}. ` +
        `O máximo de games em um set de 6 é 7 (tie-break em 6x6).`
      );
    }
  } else if (maxGames === 4) {
    // Sets de 4 games
    if (winnerGames === 4) {
      // Vitória normal por 4
      if (loserGames > 2) {
        errors.push(
          `Placar inválido ${gamesA}x${gamesB}. ` +
          `Com 4 games, o adversário só pode ter até 2 games (não ${loserGames}).`
        );
      }
    } else if (winnerGames === 5) {
      // Vitória por 5 (após empate em 3x3 ou 4x4 com tie-break)
      if (loserGames === 4) {
        // Tie-break: 5x4 é válido
      } else if (loserGames === 3) {
        // Vitória por 5x3 (após 3x3) é válida
      } else {
        errors.push(
          `Placar inválido ${gamesA}x${gamesB}. ` +
          `Com 5 games, o adversário deve ter 3 ou 4 games.`
        );
      }
    } else if (winnerGames === 3 && loserGames === 4) {
      errors.push(
        `Placar impossível ${gamesA}x${gamesB}. ` +
        `Não é possível ter 4x3 em sets de 4 games.`
      );
    } else if (winnerGames < 4) {
      errors.push(
        `Placar incompleto ${gamesA}x${gamesB}. ` +
        `O vencedor deve ter pelo menos 4 games.`
      );
    } else if (winnerGames > 5) {
      errors.push(
        `Placar inválido ${gamesA}x${gamesB}. ` +
        `O máximo de games em um set de 4 é 5 (tie-break em 4x4).`
      );
    }
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Valida um set de tie-break (decisivo)
 */
function validateTieBreakSet(
  set: SetScore,
  minPoints: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const { gamesA, gamesB } = set;
  const winnerPoints = Math.max(gamesA, gamesB);
  const loserPoints = Math.min(gamesA, gamesB);
  const difference = winnerPoints - loserPoints;

  // Tie-break deve ser vencido por no mínimo 2 pontos de diferença
  if (difference < 2) {
    errors.push(
      `Tie-break inválido ${gamesA}x${gamesB}. ` +
      `É necessário vencer por pelo menos 2 pontos de diferença.`
    );
  }

  // Verificar se atingiu o mínimo de pontos
  if (winnerPoints < minPoints) {
    errors.push(
      `Tie-break incompleto ${gamesA}x${gamesB}. ` +
      `O vencedor deve ter no mínimo ${minPoints} pontos.`
    );
  }

  // Se o vencedor tem exatamente o mínimo, o perdedor deve ter no máximo minPoints-2
  if (winnerPoints === minPoints && loserPoints > minPoints - 2) {
    errors.push(
      `Tie-break inválido ${gamesA}x${gamesB}. ` +
      `Com ${minPoints} pontos, o adversário deve ter no máximo ${minPoints - 2} pontos.`
    );
  }

  return { isValid: errors.length === 0, errors, warnings };
}

/**
 * Helper para obter config de validação do torneio
 */
export function getValidationConfig(tournament: Tournament): ScoreValidationConfig {
  return {
    quantidadeSets: tournament.gameConfig.quantidadeSets,
    gamesPerSet: tournament.gameConfig.gamesPerSet,
    tieBreakDecisivo: tournament.gameConfig.tieBreakDecisivo,
    pontosTieBreak: tournament.gameConfig.pontosTieBreak,
  };
}
