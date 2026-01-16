/**
 * Backup Service
 * Export/Import de torneios em formato JSON
 */

import type { Tournament, TournamentBackup, TournamentListBackup, TournamentList, GameConfig } from '@/types';
import { z } from 'zod';

/**
 * Funções de criptografia usando Web Crypto API
 */

/**
 * Deriva uma chave de criptografia a partir de uma senha usando PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordData = encoder.encode(password);
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    passwordData.buffer as ArrayBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Criptografa dados usando AES-GCM
 */
async function encryptData(data: string, password: string): Promise<{ encrypted: string; salt: string; iv: string }> {
  // Gerar salt e IV aleatórios
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derivar chave da senha
  const key = await deriveKey(password, salt);

  // Criptografar dados
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    dataBuffer.buffer as ArrayBuffer
  );

  // Converter para base64 para armazenamento
  const encryptedArray = new Uint8Array(encrypted);
  const saltArray = Array.from(salt);
  const ivArray = Array.from(iv);
  
  return {
    encrypted: btoa(String.fromCharCode.apply(null, Array.from(encryptedArray))),
    salt: btoa(String.fromCharCode.apply(null, saltArray)),
    iv: btoa(String.fromCharCode.apply(null, ivArray)),
  };
}

/**
 * Descriptografa dados usando AES-GCM
 */
async function decryptData(encrypted: string, password: string, salt: string, iv: string): Promise<string> {
  // Converter de base64
  const encryptedData = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const saltData = Uint8Array.from(atob(salt), c => c.charCodeAt(0));
  const ivData = Uint8Array.from(atob(iv), c => c.charCodeAt(0));

  // Derivar chave da senha
  const key = await deriveKey(password, saltData);

  // Descriptografar dados
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivData },
    key,
    encryptedData.buffer as ArrayBuffer
  );

  const decoder = new TextDecoder();
  return decoder.decode(decrypted);
}

/**
 * Versão atual do formato de backup
 */
const BACKUP_VERSION = '1.0.0';

/**
 * Schema Zod para validação de backup
 */
const tournamentBackupSchema = z.object({
  version: z.string(),
  exportDate: z.string(),
  tournament: z.object({
    nome: z.string(),
    categorias: z.array(z.string()),
    gameConfig: z.object({
      quantidadeSets: z.number(),
      gamesPerSet: z.number(),
      tieBreakDecisivo: z.boolean(),
      pontosTieBreak: z.number(),
    }),
    grupos: z.array(z.any()), // Simplified for now
    waitingList: z.array(z.any()), // Simplified for now
  }),
  isFullBackup: z.boolean().optional(), // Campo opcional para compatibilidade com backups antigos
  syncCredentials: z.object({
    encrypted: z.string(),
    salt: z.string(),
    iv: z.string(),
  }).optional(),
  sharingEnabled: z.boolean().optional(),
});

/**
 * Exporta torneio para string JSON (completo ou filtrado por categoria)
 * @param tournament - Torneio completo
 * @param categoria - Categoria específica (opcional). Se não informada, faz backup de todas as categorias
 * @param password - Senha para criptografar credenciais (opcional). Apenas para backup completo.
 */
export async function exportTournament(
  tournament: Tournament, 
  categoria?: string,
  password?: string
): Promise<string> {
  let filteredTournament: Tournament = tournament;
  
  // Se categoria for especificada, filtrar apenas dados dessa categoria
  if (categoria) {
    filteredTournament = {
      ...tournament,
      grupos: tournament.grupos.filter(g => g.categoria === categoria),
      waitingList: tournament.waitingList.filter(p => p.categoria === categoria),
      categorias: [categoria], // Manter apenas a categoria selecionada
    };
  }
  
  const isFullBackup = !categoria; // Backup completo se não há categoria específica
  
  const backup: TournamentBackup = {
    version: BACKUP_VERSION,
    exportDate: new Date().toISOString(),
    tournament: filteredTournament,
    isFullBackup, // Indica explicitamente se é backup completo ou de categoria
  };

  // Incluir credenciais criptografadas e estado de compartilhamento apenas se:
  // 1. É backup completo (sem categoria específica)
  // 2. Senha foi fornecida
  // 3. Estamos no navegador (localStorage disponível)
  if (isFullBackup && password && typeof window !== 'undefined') {
    const tournamentId = localStorage.getItem('beachtennis-tournament-id');
    const adminToken = localStorage.getItem('beachtennis-admin-token');
    const sharingEnabled = localStorage.getItem('beachtennis-sharing-enabled') === 'true';

    if (tournamentId && adminToken) {
      // Criptografar credenciais
      const credentials = JSON.stringify({ tournamentId, adminToken });
      const encrypted = await encryptData(credentials, password);

      backup.syncCredentials = {
        encrypted: encrypted.encrypted,
        salt: encrypted.salt,
        iv: encrypted.iv,
      };
      
      // Incluir estado de compartilhamento
      backup.sharingEnabled = sharingEnabled;
    }
  }

  return JSON.stringify(backup, null, 2);
}

/**
 * Gera nome do arquivo de backup
 */
function generateBackupFilename(tournament: Tournament, categoria?: string): string {
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
  
  // Sanitiza nome do torneio (remove caracteres especiais)
  const tournamentName = tournament.nome
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .toLowerCase()
    .substring(0, 30);
  
  // Sanitiza nome da categoria (se houver)
  const categoryName = categoria
    ? categoria
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
        .substring(0, 20)
    : 'todas';
  
  return `backup-${tournamentName}-${categoryName}-${dateStr}-${timeStr}.json`;
}

/**
 * Gera e faz download do arquivo de backup
 * @param tournament - Torneio completo
 * @param categoria - Categoria específica (opcional). Se não informada, faz backup de todas as categorias
 * @param password - Senha para criptografar credenciais (opcional). Apenas para backup completo.
 */
export async function downloadBackup(
  tournament: Tournament, 
  categoria?: string,
  password?: string
): Promise<void> {
  const json = await exportTournament(tournament, categoria, password);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  // Gera nome do arquivo com nome do torneio, categoria e data
  const filename = generateBackupFilename(tournament, categoria);

  // Cria link temporário e aciona download
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exporta todos os torneios para string JSON
 * @param tournamentList - Lista de metadados dos torneios
 * @param tournaments - Map de ID -> Tournament com todos os torneios
 * @param password - Senha para criptografar credenciais
 */
export async function exportAllTournaments(
  tournamentList: TournamentList,
  tournaments: Record<string, Tournament>,
  password: string
): Promise<string> {
  if (!password || password.length < 6) {
    throw new Error('A senha deve ter pelo menos 6 caracteres');
  }

  if (typeof window === 'undefined') {
    throw new Error('Esta função só pode ser executada no navegador');
  }

  // Coletar credenciais e sharingEnabled de todos os torneios
  const credentials: Record<string, { tournamentId: string; adminToken: string }> = {};
  const sharingEnabled: Record<string, boolean> = {};

  for (const metadata of tournamentList.tournaments) {
    const tournamentId = metadata.id;
    const storedId = localStorage.getItem(`beachtennis-tournament-id`);
    const storedToken = localStorage.getItem('beachtennis-admin-token');
    const sharingKey = `beachtennis-sharing-enabled-${tournamentId}`;
    const sharingValue = localStorage.getItem(sharingKey);

    // Se este torneio tem credenciais no localStorage
    if (storedId === tournamentId && storedToken) {
      credentials[tournamentId] = {
        tournamentId: storedId,
        adminToken: storedToken,
      };
    }

    // Se este torneio tem sharingEnabled
    if (sharingValue !== null) {
      sharingEnabled[tournamentId] = sharingValue === 'true';
    }
  }

  // Criptografar credenciais
  const credentialsJson = JSON.stringify(credentials);
  const encrypted = await encryptData(credentialsJson, password);

  const backup: TournamentListBackup = {
    version: BACKUP_VERSION,
    exportDate: new Date().toISOString(),
    tournamentList,
    tournaments,
    credentials: {
      encrypted: encrypted.encrypted,
      salt: encrypted.salt,
      iv: encrypted.iv,
    },
    sharingEnabled,
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Faz download do backup de todos os torneios
 */
export async function downloadAllTournamentsBackup(
  tournamentList: TournamentList,
  tournaments: Record<string, Tournament>,
  password: string
): Promise<void> {
  const json = await exportAllTournaments(tournamentList, tournaments, password);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const date = new Date();
  const dateStr = date.toISOString().split('T')[0];
  const timeStr = date.toTimeString().split(' ')[0].replace(/:/g, '-');
  const filename = `backup-todos-torneios-${dateStr}-${timeStr}.json`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Importa todos os torneios a partir de string JSON
 */
export async function importAllTournaments(
  jsonData: string,
  password: string
): Promise<{
  tournamentList: TournamentList;
  tournaments: Record<string, Tournament>;
  credentials: Record<string, { tournamentId: string; adminToken: string }>;
  sharingEnabled: Record<string, boolean>;
}> {
  const data = JSON.parse(jsonData);

  // Validar estrutura básica
  if (!data.version || !data.tournamentList || !data.tournaments) {
    throw new Error('Formato de backup inválido');
  }

  // Verificar versão
  if (!isVersionCompatible(data.version)) {
    throw new Error(`Versão do backup (${data.version}) não é compatível com a versão atual (${BACKUP_VERSION})`);
  }

  // Descriptografar credenciais
  let credentials: Record<string, { tournamentId: string; adminToken: string }> = {};
  if (data.credentials) {
    const decrypted = await decryptData(
      data.credentials.encrypted,
      password,
      data.credentials.salt,
      data.credentials.iv
    );
    credentials = JSON.parse(decrypted);
  }

  // Normalizar todos os torneios
  const normalizedTournaments: Record<string, Tournament> = {};
  for (const [id, tournament] of Object.entries(data.tournaments)) {
    normalizedTournaments[id] = {
      ...(tournament as Tournament),
      gameConfig: normalizeGameConfig((tournament as Tournament).gameConfig),
    };
  }

  return {
    tournamentList: data.tournamentList,
    tournaments: normalizedTournaments,
    credentials: credentials || {},
    sharingEnabled: data.sharingEnabled || {},
  };
}

/**
 * Normaliza gameConfig para valores válidos (4 ou 6 games, 1 ou 3 sets, 7 ou 10 pontos)
 */
function normalizeGameConfig(config: any): GameConfig {
  // Normalizar quantidadeSets: 1 ou 3 (qualquer outro valor vira 1)
  let quantidadeSets: 1 | 3 = 1;
  if (config.quantidadeSets === 3) {
    quantidadeSets = 3;
  } else if (config.quantidadeSets !== 1) {
    quantidadeSets = 1; // Padrão para valores inválidos
  }

  // Normalizar gamesPerSet: 4 ou 6 (valores próximos vão para o mais próximo)
  let gamesPerSet: 4 | 6 = 6;
  if (config.gamesPerSet === 4) {
    gamesPerSet = 4;
  } else if (config.gamesPerSet !== 6) {
    // Se for 5 ou menos, vira 4; se for 7 ou mais, vira 6
    gamesPerSet = config.gamesPerSet <= 5 ? 4 : 6;
  }

  // Normalizar pontosTieBreak: 7 ou 10 (valores próximos vão para o mais próximo)
  let pontosTieBreak: 7 | 10 = 7;
  if (config.pontosTieBreak === 7) {
    pontosTieBreak = 7;
  } else if (config.pontosTieBreak === 10) {
    pontosTieBreak = 10;
  } else if (config.pontosTieBreak !== undefined) {
    // Se for 8 ou menos, vira 7; se for 9 ou mais, vira 10
    pontosTieBreak = config.pontosTieBreak <= 8 ? 7 : 10;
  }

  return {
    quantidadeSets,
    gamesPerSet,
    tieBreakDecisivo: config.tieBreakDecisivo || false,
    pontosTieBreak,
  };
}

/**
 * Importa torneio a partir de string JSON
 * Retorna o torneio importado, indica se é backup de categoria específica e credenciais descriptografadas (se houver)
 * @param jsonData - JSON do backup
 * @param password - Senha para descriptografar credenciais (opcional, apenas se backup tiver credenciais)
 */
export async function importTournament(
  jsonData: string,
  password?: string
): Promise<{ 
  tournament: Tournament; 
  isSingleCategory: boolean; 
  category?: string;
  credentials?: { tournamentId: string; adminToken: string };
  sharingEnabled?: boolean;
}> {
  try {
    const data = JSON.parse(jsonData);
    const backup = tournamentBackupSchema.parse(data);
    
    // Verifica versão
    if (!isVersionCompatible(backup.version)) {
      throw new Error(`Versão do backup (${backup.version}) não é compatível com a versão atual (${BACKUP_VERSION})`);
    }

    // Normalizar gameConfig para valores válidos
    const normalizedTournament: Tournament = {
      ...backup.tournament,
      gameConfig: normalizeGameConfig(backup.tournament.gameConfig),
    };

    // Verifica se é backup de categoria específica
    // Usa o campo isFullBackup se existir, caso contrário usa lógica de fallback para compatibilidade
    let isSingleCategory: boolean;
    if (backup.isFullBackup !== undefined) {
      // Novo formato: usa campo explícito
      isSingleCategory = !backup.isFullBackup;
    } else {
      // Fallback para backups antigos: se tem credenciais, é completo; senão, verifica número de categorias
      const hasCredentials = !!backup.syncCredentials || backup.sharingEnabled !== undefined;
      isSingleCategory = !hasCredentials && normalizedTournament.categorias.length === 1;
    }
    const category = isSingleCategory ? normalizedTournament.categorias[0] : undefined;

    // Descriptografar credenciais se existirem
    let credentials: { tournamentId: string; adminToken: string } | undefined;
    if (backup.syncCredentials) {
      if (!password) {
        throw new Error('Este backup contém credenciais criptografadas. É necessária uma senha para restaurá-las.');
      }

      try {
        // Descriptografar credenciais
        const decrypted = await decryptData(
          backup.syncCredentials.encrypted,
          password,
          backup.syncCredentials.salt,
          backup.syncCredentials.iv
        );
        const decryptedData = JSON.parse(decrypted);
        credentials = {
          tournamentId: decryptedData.tournamentId,
          adminToken: decryptedData.adminToken,
        };
      } catch (error) {
        throw new Error('Senha incorreta ou dados corrompidos. Não foi possível descriptografar as credenciais.');
      }
    }

    return {
      tournament: normalizedTournament,
      isSingleCategory,
      category,
      credentials,
      sharingEnabled: backup.sharingEnabled,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error('Estrutura do backup inválida: ' + error.message);
    }
    throw error;
  }
}

/**
 * Valida se o JSON é um backup válido
 */
export function validateBackup(jsonData: string): boolean {
  try {
    const data = JSON.parse(jsonData);
    tournamentBackupSchema.parse(data);
    return true;
  } catch {
    return false;
  }
}

/**
 * Verifica compatibilidade de versão
 */
function isVersionCompatible(backupVersion: string): boolean {
  // Por enquanto, aceita apenas versão 1.x.x
  const [major] = backupVersion.split('.');
  const [currentMajor] = BACKUP_VERSION.split('.');
  return major === currentMajor;
}

/**
 * Extrai metadados do backup sem fazer parse completo
 */
export function getBackupMetadata(jsonData: string): {
  version: string;
  exportDate: string;
  tournamentName: string;
  categorias: string[];
  totalGroups: number;
  totalPlayers: number;
  hasCredentials: boolean;
} | null {
  try {
    const data = JSON.parse(jsonData);
    const backup = tournamentBackupSchema.parse(data);

    const totalPlayers = 
      backup.tournament.waitingList.length +
      backup.tournament.grupos.reduce((sum, group) => sum + (group.players?.length || 0), 0);

    return {
      version: backup.version,
      exportDate: backup.exportDate,
      tournamentName: backup.tournament.nome,
      categorias: backup.tournament.categorias,
      totalGroups: backup.tournament.grupos.length,
      totalPlayers,
      hasCredentials: !!backup.syncCredentials,
    };
  } catch {
    return null;
  }
}

// Versão atual dos dados
const CURRENT_DATA_VERSION = '0.4.0';

/**
 * Cria um torneio vazio
 */
export function createEmptyTournament(): Tournament {
  return {
    version: CURRENT_DATA_VERSION,
    nome: 'Novo Torneio',
    categorias: ['Iniciante', 'Normal'],
    gameConfig: {
      quantidadeSets: 1,
      gamesPerSet: 6,
      tieBreakDecisivo: false,
      pontosTieBreak: 7,
    } as GameConfig,
    grupos: [],
    waitingList: [],
    completedCategories: [],
  };
}

/**
 * Valida estrutura BÁSICA do torneio (modo compatível)
 * Apenas verifica campos essenciais, aceita variações
 */
export function isValidTournamentStructure(tournament: any): boolean {
  if (!tournament || typeof tournament !== 'object') return false;
  
  // Verifica APENAS estrutura básica essencial
  if (typeof tournament.nome !== 'string') return false;
  if (!Array.isArray(tournament.categorias)) return false;
  if (!tournament.gameConfig || typeof tournament.gameConfig !== 'object') return false;
  if (!Array.isArray(tournament.grupos)) return false;
  if (!Array.isArray(tournament.waitingList)) return false;
  
  // ✅ MODO COMPATÍVEL: Aceita pequenas variações
  // Não valida estrutura interna profunda para evitar perda de dados
  
  return true;
}

/**
 * Valida se o torneio está na estrutura EXATA da v0.4.0
 * Usado apenas para detecção, NÃO para rejeitar dados
 */
export function isExactV040Structure(tournament: any): boolean {
  if (!isValidTournamentStructure(tournament)) return false;
  
  // Verifica se waitingList tem estrutura de jogadores individuais (v0.4.0)
  if (tournament.waitingList.length > 0) {
    const firstItem = tournament.waitingList[0];
    // Se tem jogador1/jogador2, NÃO é v0.4.0
    if (firstItem.jogador1 || firstItem.jogador2) return false;
    // Deve ter nome direto (jogador individual)
    if (!firstItem.nome) return false;
  }
  
  // Verifica grupos
  if (tournament.grupos.length > 0) {
    const firstGroup = tournament.grupos[0];
    // Se tem 'duplas', NÃO é v0.4.0
    if (firstGroup.duplas) return false;
    // Deve ter 'players' (v0.4.0)
    if (!firstGroup.players) return false;
    
    // Verifica matches se existirem
    if (firstGroup.matches && firstGroup.matches.length > 0) {
      const firstMatch = firstGroup.matches[0];
      // Se tem duplaA/duplaB, NÃO é v0.4.0
      if (firstMatch.duplaA || firstMatch.duplaB) return false;
      // Deve ter jogador1A, jogador2A, jogador1B, jogador2B (v0.4.0)
      if (!firstMatch.jogador1A || !firstMatch.jogador2A || 
          !firstMatch.jogador1B || !firstMatch.jogador2B) return false;
    }
  }
  
  return true;
}

/**
 * Detecta se os dados são da v0.3.0 (estrutura de duplas)
 */
export function isV030Structure(tournament: any): boolean {
  if (!tournament || typeof tournament !== 'object') return false;
  
  // Verifica waitingList com duplas
  if (tournament.waitingList && tournament.waitingList.length > 0) {
    const firstItem = tournament.waitingList[0];
    if (firstItem.jogador1 || firstItem.jogador2) return true;
  }
  
  // Verifica grupos com duplas
  if (tournament.grupos && tournament.grupos.length > 0) {
    const firstGroup = tournament.grupos[0];
    if (firstGroup.duplas) return true;
  }
  
  return false;
}

/**
 * Cria backup automático dos dados antes de qualquer migração
 */
export function createAutoBackup(tournament: any): void {
  if (typeof window === 'undefined') return;
  
  try {
    const timestamp = new Date().toISOString();
    const backupKey = `beachtennis-backup-${timestamp}`;
    const backup = {
      version: tournament.version || '0.3.0',
      timestamp,
      data: tournament,
    };
    window.localStorage.setItem(backupKey, JSON.stringify(backup));
    console.log(`💾 Backup automático criado: ${backupKey}`);
    
    // Limita quantidade de backups automáticos (mantém últimos 5)
    cleanOldAutoBackups();
  } catch (error) {
    console.error('Erro ao criar backup automático:', error);
  }
}

/**
 * Lista todos os backups automáticos disponíveis
 */
export function listAutoBackups(): Array<{ key: string; timestamp: string; version: string }> {
  if (typeof window === 'undefined') return [];
  
  const backups: Array<{ key: string; timestamp: string; version: string }> = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('beachtennis-backup-')) {
        const data = localStorage.getItem(key);
        if (data) {
          const backup = JSON.parse(data);
          backups.push({
            key,
            timestamp: backup.timestamp,
            version: backup.version,
          });
        }
      }
    }
  } catch (error) {
    console.error('Erro ao listar backups:', error);
  }
  
  return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * Remove backups automáticos antigos (mantém últimos 5)
 */
function cleanOldAutoBackups(): void {
  if (typeof window === 'undefined') return;
  
  try {
    const backups = listAutoBackups();
    if (backups.length > 5) {
      // Remove backups mais antigos
      const toRemove = backups.slice(5);
      toRemove.forEach(backup => {
        localStorage.removeItem(backup.key);
        console.log(`🗑️  Backup antigo removido: ${backup.key}`);
      });
    }
  } catch (error) {
    console.error('Erro ao limpar backups antigos:', error);
  }
}

/**
 * Migra dados da v0.3.0 (duplas) para v0.4.0 (jogadores individuais)
 * Converte cada dupla em 2 jogadores individuais
 */
export function migrateV030ToV040(oldTournament: any): Tournament {
  const { v4: uuidv4 } = require('uuid');
  
  console.log('🔄 Migrando dados de v0.3.0 para v0.4.0...');
  
  // Cria backup antes de migrar
  createAutoBackup(oldTournament);
  
  const newTournament: Tournament = {
    version: CURRENT_DATA_VERSION,
    nome: oldTournament.nome || 'Novo Torneio',
    categorias: oldTournament.categorias || ['Iniciante', 'Normal'],
    gameConfig: normalizeGameConfig(oldTournament.gameConfig || {
      quantidadeSets: 1,
      gamesPerSet: 6,
      tieBreakDecisivo: false,
      pontosTieBreak: 7,
    }),
    grupos: [],
    waitingList: [],
  };

  // Migra waitingList: cada dupla vira 2 jogadores
  if (oldTournament.waitingList && Array.isArray(oldTournament.waitingList)) {
    for (const dupla of oldTournament.waitingList) {
      if (dupla.jogador1 && dupla.jogador2) {
        // Jogador 1
        newTournament.waitingList.push({
          id: uuidv4(),
          nome: dupla.jogador1.nome,
          categoria: dupla.categoria,
          isSeed: dupla.isSeed || false,
          status: dupla.status || 'waiting',
        });
        // Jogador 2
        newTournament.waitingList.push({
          id: uuidv4(),
          nome: dupla.jogador2.nome,
          categoria: dupla.categoria,
          isSeed: dupla.isSeed || false,
          status: dupla.status || 'waiting',
        });
      }
    }
  }

  // Migra grupos: cada dupla vira 2 jogadores
  if (oldTournament.grupos && Array.isArray(oldTournament.grupos)) {
    for (const oldGroup of oldTournament.grupos) {
      const newPlayers: any[] = [];
      
      // Converte duplas em jogadores individuais
      if (oldGroup.duplas && Array.isArray(oldGroup.duplas)) {
        for (const dupla of oldGroup.duplas) {
          if (dupla.jogador1 && dupla.jogador2) {
            newPlayers.push({
              id: uuidv4(),
              nome: dupla.jogador1.nome,
              categoria: oldGroup.categoria,
              isSeed: dupla.isSeed || false,
              status: dupla.status || 'enrolled',
            });
            newPlayers.push({
              id: uuidv4(),
              nome: dupla.jogador2.nome,
              categoria: oldGroup.categoria,
              isSeed: dupla.isSeed || false,
              status: dupla.status || 'enrolled',
            });
          }
        }
      }

      // Cria novo grupo (sem matches - serão regerados)
      newTournament.grupos.push({
        id: oldGroup.id || uuidv4(),
        nome: oldGroup.nome || 'A',
        fase: oldGroup.fase || 1,
        categoria: oldGroup.categoria,
        players: newPlayers,
        matches: [], // Matches serão regerados automaticamente
      });
    }
  }

  console.log(`✅ Migração concluída: ${newTournament.waitingList.length} jogadores na lista de espera, ${newTournament.grupos.length} grupos`);
  
  return newTournament;
}
