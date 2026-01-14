# 🔧 Configuração do Upstash Redis na Vercel

## Problema: Variáveis de ambiente não estão sendo injetadas

Se você está vendo o erro `❌ Redis não configurado!`, significa que as variáveis de ambiente do Upstash não estão disponíveis.

## Solução Passo a Passo

### 1. Verificar se o Upstash está conectado

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Storage** (ou **Integrations** no menu lateral)
4. Verifique se há um banco Upstash Redis listado
5. Se não houver, vá para o passo 2

### 2. Conectar Upstash Redis (se não estiver conectado)

1. Vercel Dashboard → **Marketplace** (menu lateral)
2. Procure por **"Upstash Redis"**
3. Clique em **"Add Integration"** ou **"Install"**
4. Selecione seu projeto
5. Crie um novo banco ou selecione um existente
6. **IMPORTANTE:** Certifique-se de que o banco está **conectado ao projeto**

### 3. Verificar Variáveis de Ambiente

1. Vercel Dashboard → Seu Projeto → **Settings** → **Environment Variables**
2. Procure por variáveis que começam com:
   - `UPSTASH_REDIS_URL` (preferencial)
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `KV_REST_API_URL` (alternativa)
   - `KV_REST_API_TOKEN` (alternativa)

**Se não encontrar nenhuma variável:**
- O Upstash pode não estar conectado corretamente ao projeto
- Tente desconectar e reconectar o Upstash

### 4. Verificar Conexão do Banco ao Projeto

1. Vercel Dashboard → **Storage**
2. Clique no banco Upstash Redis
3. Verifique se seu projeto está listado em **"Connected Projects"**
4. Se não estiver, clique em **"Connect Project"** e selecione seu projeto

### 5. Fazer Novo Deploy

Após conectar o Upstash:
1. Vá em **Deployments**
2. Clique nos **3 pontos** do último deployment
3. Selecione **"Redeploy"**
4. Ou faça um novo commit e push

### 6. Verificar Logs Após Deploy

1. Vercel Dashboard → **Deployments** → Último deployment
2. Vá em **Functions** → `/api/save`
3. Procure por:
   - `✅ Upstash Redis: usando UPSTASH_REDIS_URL` - ✅ Funcionando!
   - `❌ Redis não configurado!` - ❌ Ainda não configurado

## Variáveis Esperadas

O código procura por estas variáveis (nesta ordem):

1. **`UPSTASH_REDIS_URL`** - URL Redis tradicional (preferencial)
2. **`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`** - REST API
3. **`KV_REST_API_URL` + `KV_REST_API_TOKEN`** - Alternativa (Vercel KV antigo)

## Se Ainda Não Funcionar

Se após seguir todos os passos as variáveis ainda não aparecerem:

1. **Desconecte e reconecte o Upstash:**
   - Storage → Upstash Redis → Disconnect
   - Depois conecte novamente

2. **Verifique se está no projeto correto:**
   - Certifique-se de que está conectando ao projeto certo na Vercel

3. **Contate o suporte da Vercel:**
   - Pode ser um problema com a integração

## Teste Manual

Após configurar, teste manualmente:

```bash
# No terminal da Vercel (ou via API)
curl https://seu-projeto.vercel.app/api/load?id=test-id
```

Se retornar erro 500, verifique os logs para ver qual variável está faltando.
