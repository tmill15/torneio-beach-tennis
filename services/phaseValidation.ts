export interface PhaseValidationResult {
  isValid: boolean;
  path: PhaseInfo[];
  blockingReason?: string;
}

export interface PhaseInfo {
  phase: number;
  groups: number;
  playersPerGroup: number;
  totalPlayers: number;
  directQualified: number;
  needsRepechage: number;
  qualificationRule: string; // Descrição de como classificam
}

/**
 * Valida se o número de jogadores permite um torneio de 3 fases viável
 */
export function validateThreePhaseTournament(
  initialPlayers: number
): PhaseValidationResult {
  const path: PhaseInfo[] = [];
  const TARGET_GROUP_SIZE = 4;

  // Validação mínima: pelo menos 8 jogadores (2 grupos na Fase 1)
  if (initialPlayers < 8) {
    return {
      isValid: false,
      path: [],
      blockingReason: `Mínimo de 8 jogadores necessário para torneio de 3 fases. ` +
                     `Você tem ${initialPlayers} jogador(es).`
    };
  }

  // FASE 1: Calcular grupos completos (sobra vai para lista de espera)
  // Sistema JÁ tem lista de espera implementada, então não precisa bloquear por sobra!
  const phase1Groups = Math.floor(initialPlayers / TARGET_GROUP_SIZE);
  const phase1WaitingList = initialPlayers % TARGET_GROUP_SIZE;
  
  // IMPORTANTE: Mesmo que sobrem jogadores, o torneio é válido!
  // Exemplo: 18 jogadores → 4 grupos (16 jogam) + 2 na lista de espera

  const phase1Direct = phase1Groups * 2; // Top 2 de cada
  const phase1RepechageAvailable = phase1Groups; // 3º lugares

  // Calcular Fase 2
  let phase2Players = phase1Direct;
  const phase2IdealGroups = Math.floor(phase2Players / TARGET_GROUP_SIZE);
  const phase2Remainder = phase2Players % TARGET_GROUP_SIZE;

  let phase1Repechage = 0;
  
  // IMPORTANTE: Repescagem APENAS se necessário para completar grupos simétricos
  // Exemplos:
  // - 12 jogadores: 12 % 4 = 0 → Não precisa repescagem (3 grupos completos)
  // - 14 jogadores: 14 % 4 = 2 → Precisa 2 repescados para fazer 4 grupos de 4
  // - 10 jogadores: 10 % 4 = 2 → Precisa 2 repescados para fazer 3 grupos de 4
  if (phase2Remainder > 0) {
    phase1Repechage = (phase2IdealGroups + 1) * TARGET_GROUP_SIZE - phase2Players;
    
    if (phase1Repechage > phase1RepechageAvailable) {
      return {
        isValid: false,
        path: [],
        blockingReason: `Impossível formar grupos simétricos na Fase 2.\n` +
                       `Necessário: ${phase1Repechage} repescados, Disponível: ${phase1RepechageAvailable}`
      };
    }
    
    phase2Players += phase1Repechage;
  }

  const phase2Groups = phase2Players / TARGET_GROUP_SIZE;

  path.push({
    phase: 1,
    groups: phase1Groups,
    playersPerGroup: TARGET_GROUP_SIZE,
    totalPlayers: phase1Groups * TARGET_GROUP_SIZE, // Apenas jogadores nos grupos
    directQualified: phase1Direct,
    needsRepechage: phase1Repechage,
    qualificationRule: `Top 2 de cada grupo (${phase1Direct})` +
                      (phase1Repechage > 0 ? ` + ${phase1Repechage} melhores 3º` : '') +
                      (phase1WaitingList > 0 ? ` [${phase1WaitingList} na lista de espera]` : '')
  });

  // FASE 2: Determinar classificação para Fase 3
  let phase3Players: number;
  let phase2Rule: string;

  if (phase2Groups <= 2) {
    // Top 2 de cada
    phase3Players = phase2Groups * 2;
    phase2Rule = `Top 2 de cada grupo (${phase3Players} jogadores)`;
  } else if (phase2Groups === 3) {
    // Top 1 de cada + melhor 2º
    phase3Players = 4;
    phase2Rule = `Top 1 de cada grupo + melhor 2º colocado (4 jogadores)`;
  } else {
    // Top 1 de cada
    phase3Players = phase2Groups;
    phase2Rule = `Top 1 de cada grupo (${phase3Players} jogadores)`;
  }

  path.push({
    phase: 2,
    groups: phase2Groups,
    playersPerGroup: TARGET_GROUP_SIZE,
    totalPlayers: phase2Players,
    directQualified: phase3Players,
    needsRepechage: 0,
    qualificationRule: phase2Rule
  });

  // FASE 3 (Final)
  path.push({
    phase: 3,
    groups: 1,
    playersPerGroup: phase3Players,
    totalPlayers: phase3Players,
    directQualified: 1,
    needsRepechage: 0,
    qualificationRule: `Grupo único final - 1º lugar = Campeão`
  });

  return {
    isValid: true,
    path
  };
}
