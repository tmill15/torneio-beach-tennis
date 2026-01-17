/**
 * Utilitário para operações com KV/Redis
 * Suporta Upstash Redis (produção via Vercel Marketplace) e Redis local (desenvolvimento)
 * 
 * Usa biblioteca 'redis' oficial (recomendada pela Vercel/Upstash)
 * Funciona tanto em desenvolvimento (Redis local) quanto em produção (Upstash)
 * 
 * IMPORTANTE SOBRE LIMITES DA VERCEL:
 * - Tentativas de conexão TCP ao Redis NÃO contam nos limites de requisições HTTP da Vercel
 * - Apenas requisições HTTP (GET, POST, etc) contam nos limites
 * - O cliente Redis gerencia reconexão automaticamente
 */

import { createClient } from 'redis';

// Detectar ambiente
const isDevelopment = process.env.NODE_ENV === 'development';

// URLs de conexão
// Produção: Upstash Redis via variáveis de ambiente da Vercel
// Desenvolvimento: Redis local
// A Vercel/Upstash fornece REDIS_URL quando conectado via Marketplace
const REDIS_URL_ENV = process.env.REDIS_URL; // Fornecido pela Vercel quando Upstash está conectado
const UPSTASH_REDIS_URL = process.env.UPSTASH_REDIS_URL;
const UPSTASH_REDIS_REST_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const UPSTASH_REDIS_REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
const REDIS_URL_LOCAL = 'redis://localhost:6379';

// Cliente Redis (usando biblioteca oficial)
let redisClient: ReturnType<typeof createClient> | null = null;

// Flag para evitar spam de logs de erro (apenas para UX, não afeta funcionalidade)
let redisErrorLogged = false;

// Inicializar cliente Redis
if (isDevelopment) {
  // Desenvolvimento: Redis local
  console.log('🔧 Modo desenvolvimento: usando Redis local');
  try {
    redisClient = createClient({ 
      url: REDIS_URL_LOCAL,
      socket: {
        // Deixar o cliente Redis gerenciar reconexão automaticamente
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return false; // Parar após 10 tentativas
          }
          return Math.min(retries * 100, 3000); // Backoff exponencial
        }
      }
    });
    
    redisClient.on('error', (err) => {
      // Logar apenas uma vez para evitar spam no console
      if (!redisErrorLogged) {
        console.error('❌ Erro na conexão Redis local:', err.message);
        console.warn('💡 Dica: Inicie o Redis com `docker-compose up -d` ou `redis-server`');
        redisErrorLogged = true;
      }
    });
    
    redisClient.on('connect', () => {
      console.log('✅ Conectado ao Redis local com sucesso');
      redisErrorLogged = false; // Reset flag quando conectar
    });
    
    // NÃO conectar na inicialização - deixar totalmente lazy
    // A conexão será feita apenas quando necessário (nas funções getTournament, saveTournament, etc)
  } catch (error) {
    console.error('❌ Erro ao criar cliente Redis local:', error);
  }
} else if (REDIS_URL_ENV) {
  // Produção: Upstash Redis via REDIS_URL (fornecido pela Vercel quando conectado)
  // Usar biblioteca 'redis' oficial (recomendada pela Vercel/Upstash)
  console.log('✅ Upstash Redis: usando REDIS_URL (Vercel Marketplace)');
  
  // Usar a URL exatamente como fornecida pela Vercel
  // A biblioteca 'redis' oficial lida automaticamente com TLS se necessário
  const redisUrl = REDIS_URL_ENV;
  
  // Log da URL (mascarando senha) para debug
  const maskedUrl = redisUrl.replace(/:[^:@]+@/, ':***@');
  console.log('🔗 URL Redis:', maskedUrl);
  console.log('🔒 Protocolo:', redisUrl.startsWith('rediss://') ? 'TLS (rediss://)' : 'Não-TLS (redis://)');
  
  // Usar biblioteca 'redis' oficial (recomendada pela Vercel)
  try {
    redisClient = createClient({ 
      url: redisUrl,
      socket: {
        // Deixar o cliente Redis gerenciar reconexão automaticamente
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return false; // Parar após 10 tentativas
          }
          return Math.min(retries * 200, 5000); // Backoff exponencial
        }
      }
    });
    
    // Tratar erros de conexão
    redisClient.on('error', (err) => {
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        return; // Silenciar durante build
      }
      // Logar apenas uma vez para evitar spam no console
      if (!redisErrorLogged) {
        console.error('❌ Erro na conexão Redis:', err.message);
        console.warn('💡 Verifique o status do Upstash Redis no dashboard da Vercel');
        redisErrorLogged = true;
      }
    });
    
    redisClient.on('connect', () => {
      console.log('✅ Conectado ao Redis com sucesso');
      redisErrorLogged = false; // Reset flag quando conectar
    });
    
    redisClient.on('ready', () => {
      console.log('✅ Redis está pronto para uso');
      redisErrorLogged = false; // Reset flag quando estiver pronto
    });
    
    // NÃO conectar na inicialização - deixar totalmente lazy
    // A conexão será feita apenas quando necessário (nas funções getTournament, saveTournament, etc)
  } catch (error) {
    console.error('❌ Erro ao criar cliente Redis:', error);
  }
} else if (UPSTASH_REDIS_URL) {
  // Produção: Upstash Redis com URL tradicional (alternativa)
  console.log('✅ Upstash Redis: usando UPSTASH_REDIS_URL');
  try {
    // Usar URL exatamente como fornecida
    const url = UPSTASH_REDIS_URL;
    const maskedUrl = url.replace(/:[^:@]+@/, ':***@');
    console.log('🔗 URL Redis:', maskedUrl);
    redisClient = createClient({ 
      url,
      socket: {
        // Deixar o cliente Redis gerenciar reconexão automaticamente
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            return false; // Parar após 10 tentativas
          }
          return Math.min(retries * 200, 5000); // Backoff exponencial
        }
      }
    });
    
    redisClient.on('error', (err) => {
      if (process.env.NEXT_PHASE === 'phase-production-build') {
        return;
      }
      if (!redisErrorLogged) {
        console.error('❌ Erro na conexão Redis:', err.message);
        redisErrorLogged = true;
      }
    });
    
    redisClient.on('connect', () => {
      console.log('✅ Conectado ao Redis com sucesso');
      redisErrorLogged = false;
    });
    
    // NÃO conectar na inicialização - deixar totalmente lazy
    // A conexão será feita apenas quando necessário
  } catch (error) {
    console.error('❌ Erro ao criar cliente Redis:', error);
  }
} else if (UPSTASH_REDIS_REST_URL && UPSTASH_REDIS_REST_TOKEN) {
  // Produção: Upstash Redis via REST API
  console.warn('⚠️ Upstash REST API detectado');
  console.warn('⚠️ Para REST API, considere usar @upstash/redis');
  // Não podemos usar REST API com biblioteca redis padrão
} else {
  console.error('❌ Redis não configurado!');
  console.error('Variáveis disponíveis:', {
    NODE_ENV: process.env.NODE_ENV,
    hasREDIS_URL: !!REDIS_URL_ENV,
    hasUPSTASH_REDIS_URL: !!UPSTASH_REDIS_URL,
    hasUPSTASH_REDIS_REST_URL: !!UPSTASH_REDIS_REST_URL,
    hasUPSTASH_REDIS_REST_TOKEN: !!UPSTASH_REDIS_REST_TOKEN,
    hasKV_REST_API_URL: !!process.env.KV_REST_API_URL,
    hasKV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
  });
  console.error('📋 INSTRUÇÕES:');
  console.error('1. Vercel Dashboard → Seu Projeto → Settings → Environment Variables');
  console.error('2. Verifique se o Upstash está conectado: Storage → Integrations');
  console.error('3. Se conectado, as variáveis devem aparecer automaticamente');
  console.error('4. Se não aparecerem, reconecte o Upstash ao projeto');
  console.error('5. Após conectar, faça um novo deploy');
}

/**
 * Gera hash SHA-256 de um token
 * Funciona tanto no servidor (Node.js) quanto no cliente (browser)
 */
export async function hashToken(token: string): Promise<string> {
  // No servidor (Node.js), usar módulo crypto
  if (typeof window === 'undefined') {
    const crypto = await import('crypto');
    return crypto.createHash('sha256').update(token).digest('hex');
  }
  
  // No cliente (browser), usar Web Crypto API
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data.buffer as ArrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Interface para dados armazenados no KV
 */
export interface TournamentData {
  tournament: any; // Tournament type
  adminTokenHash: string;
  updatedAt: string;
}

/**
 * Buscar torneio do Redis
 */
export async function getTournament(id: string): Promise<TournamentData | null> {
  try {
    const key = `tournament:${id}`;
    let result: string | null = null;

    if (!redisClient) {
      console.error('❌ Redis client não inicializado');
      return null;
    }

    // Garantir que está conectado (deixar o cliente Redis gerenciar)
    if (!redisClient.isOpen) {
      try {
        await redisClient.connect();
      } catch (connectError) {
        // Erro já será logado pelo event handler 'error'
        return null;
      }
    }

    try {
      result = await redisClient.get(key);
    } catch (getError) {
      console.error('❌ Erro ao buscar torneio do Redis:', getError instanceof Error ? getError.message : 'Erro desconhecido');
      return null;
    }

    return result ? JSON.parse(result) : null;
  } catch (error) {
    console.error('❌ Erro ao buscar torneio:', error);
    if (error instanceof Error) {
      console.error('Mensagem:', error.message);
    }
    return null;
  }
}

/**
 * Salvar torneio no Redis com TTL
 */
export async function saveTournament(
  id: string,
  data: TournamentData,
  ttlSeconds: number = 864000 // 10 dias padrão
): Promise<boolean> {
  try {
    const key = `tournament:${id}`;
    const value = JSON.stringify(data);
    console.log(`💾 Salvando torneio ${id} no Redis...`);

    if (!redisClient) {
      console.error('❌ Redis client não inicializado');
      console.error('Verifique se Upstash Redis está configurado no Vercel Marketplace');
      return false;
    }

    // Garantir que está conectado (deixar o cliente Redis gerenciar)
    if (!redisClient.isOpen) {
      try {
        await redisClient.connect();
      } catch (connectError) {
        // Erro já será logado pelo event handler 'error'
        return false;
      }
    }

    try {
      await redisClient.setEx(key, ttlSeconds, value);
      console.log(`✅ Torneio ${id} salvo com sucesso`);
    return true;
    } catch (setError) {
      const errorMessage = setError instanceof Error ? setError.message : 'Erro desconhecido';
      
      // Erro ao salvar - retornar false (erro de conexão já foi logado pelo event handler)
      // Não precisa logar novamente aqui
      
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao salvar torneio:', error);
    if (error instanceof Error) {
      console.error('Mensagem:', error.message);
      console.error('Stack:', error.stack);
    }
    return false;
  }
}

/**
 * Remover torneio do Redis
 */
export async function deleteTournament(id: string): Promise<boolean> {
  try {
    const key = `tournament:${id}`;

    if (!redisClient) {
      console.error('❌ Redis client não inicializado');
      return false;
    }

    // Garantir que está conectado (deixar o cliente Redis gerenciar)
    if (!redisClient.isOpen) {
      try {
        await redisClient.connect();
      } catch (connectError) {
        // Erro já será logado pelo event handler 'error'
        return false;
      }
    }

    try {
      await redisClient.del(key);
      return true;
    } catch (delError) {
      console.error('❌ Erro ao deletar torneio do Redis:', delError instanceof Error ? delError.message : 'Erro desconhecido');
      return false;
    }
  } catch (error) {
    console.error('❌ Erro ao deletar torneio:', error);
    return false;
  }
}

/**
 * Verificar se torneio existe
 */
export async function existsTournament(id: string): Promise<boolean> {
  try {
    const key = `tournament:${id}`;
    let exists = false;

    if (!redisClient) {
      console.error('❌ Redis client não inicializado');
      return false;
    }

    // Garantir que está conectado (deixar o cliente Redis gerenciar)
    if (!redisClient.isOpen) {
      try {
        await redisClient.connect();
      } catch (connectError) {
        // Erro já será logado pelo event handler 'error'
        return false;
      }
    }

    try {
      const result = await redisClient.exists(key);
      exists = result === 1;
    } catch (existsError) {
      console.error('❌ Erro ao verificar existência do torneio no Redis:', existsError instanceof Error ? existsError.message : 'Erro desconhecido');
      return false;
    }

    return exists;
  } catch (error) {
    console.error('❌ Erro ao verificar existência do torneio:', error);
    return false;
  }
}

/**
 * Validar formato UUID
 */
export function isValidUUID(id: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}
