# 🔍 Guia de Debug - Sincronização

## Como debugar erros de sincronização

### 1. Verificar Logs da Vercel

1. Acesse: https://vercel.com/dashboard
2. Selecione seu projeto
3. Vá em **Deployments** → Clique no último deployment
4. Vá na aba **Functions** → Clique em `/api/save`
5. Veja os logs em tempo real

**O que procurar:**
- `✅ Upstash Redis: usando UPSTASH_REDIS_URL` - Configuração correta
- `⚠️ Upstash REST API detectado` - Pode indicar problema
- `❌ Redis não configurado!` - Variáveis de ambiente faltando
- `❌ Erro ao salvar torneio:` - Erro específico do Redis

### 2. Verificar Variáveis de Ambiente

Na Vercel Dashboard:
1. **Settings** → **Environment Variables**
2. Verifique se existem:
   - `UPSTASH_REDIS_URL` (preferencial - URL Redis tradicional)
   - OU `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`

**Importante:** 
- Se só tiver `UPSTASH_REDIS_REST_URL`, o `ioredis` pode não funcionar
- O Upstash via Vercel Marketplace deve fornecer `UPSTASH_REDIS_URL`

### 3. Verificar Conexão do Upstash

1. Vercel Dashboard → **Storage** (ou **Integrations**)
2. Verifique se o Upstash Redis está conectado ao projeto
3. Clique no banco → Veja as variáveis de ambiente disponíveis

### 4. Testar Manualmente

No console do navegador (F12), execute:

```javascript
// Verificar se compartilhamento está ativo
console.log('Sharing enabled:', localStorage.getItem('beachtennis-sharing-enabled'));
console.log('Tournament ID:', localStorage.getItem('beachtennis-tournament-id'));
console.log('Admin Token:', localStorage.getItem('beachtennis-admin-token') ? 'Existe' : 'Não existe');

// Tentar salvar manualmente
fetch('/api/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tournamentId: localStorage.getItem('beachtennis-tournament-id'),
    adminToken: localStorage.getItem('beachtennis-admin-token'),
    data: { nome: 'Teste', categorias: [], grupos: [], waitingList: [] }
  })
}).then(r => r.json()).then(console.log).catch(console.error);
```

### 5. Possíveis Problemas e Soluções

#### Problema: "Redis não configurado"
**Solução:** 
- Verifique se o Upstash está conectado ao projeto na Vercel
- Verifique se as variáveis de ambiente foram injetadas
- Faça um novo deploy após conectar o Upstash

#### Problema: "Erro ao salvar torneio" (500)
**Possíveis causas:**
1. **Upstash REST API não compatível com ioredis**
   - Se só tiver `UPSTASH_REDIS_REST_URL`, pode precisar instalar `@upstash/redis`
   - Ou verificar se a Vercel fornece `UPSTASH_REDIS_URL`

2. **Conexão falhando**
   - Verifique os logs da Vercel para ver o erro específico
   - Pode ser problema de TLS/certificado

3. **Timeout**
   - Upstash pode estar lento
   - Verifique se o banco está ativo

#### Problema: "Token de autorização inválido"
**Solução:**
- Limpe o localStorage e gere novos tokens
- Ou verifique se o `adminToken` está sendo enviado corretamente

### 6. Logs Adicionados

Os logs agora mostram:
- ✅ Quando Redis é inicializado corretamente
- ❌ Quando há problemas de configuração
- 💾 Quando tenta salvar
- ✅ Quando salva com sucesso
- ❌ Erros detalhados com stack trace

### 7. Próximos Passos

Se o problema persistir:
1. Copie os logs completos da Vercel
2. Verifique qual variável de ambiente está disponível
3. Considere instalar `@upstash/redis` se só tiver REST API
