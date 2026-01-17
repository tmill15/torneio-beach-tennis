# 🎾 BeachTennis Manager

App PWA para gestão completa de torneios de Beach Tennis em modo Round Robin.

## 📱 Características

- ✅ **Progressive Web App (PWA)** - Instalável e funciona offline
- 🎯 **Round Robin Automático** - Gera partidas "todos contra todos"
- 📊 **Ranking em Tempo Real** - Atualização automática após cada jogo
- 🗂️ **Múltiplos Torneios** - Crie, gerencie e alterne entre vários torneios
- ⚙️ **Configurações Simplificadas** - 1 ou 3 sets, 4 ou 6 games, tie-break de 7 ou 10 pontos
- 💾 **Backup/Restore** - Export/Import completo em JSON por torneio
- 📱 **Mobile-First** - Design otimizado para dispositivos móveis
- 🌙 **Dark Mode** - Suporte a tema escuro
- 🔄 **Sincronização Multi-Dispositivo** - Compartilhe torneios e sincronize em tempo real
- 🔗 **Compartilhamento** - Link público e QR Code para espectadores
- 🔐 **Segurança por Torneio** - Token de admin único para cada torneio

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/tmill15/torneio-beach-tennis.git
cd torneio-beach-tennis

# Instale as dependências
npm install

# Execute em modo desenvolvimento (com Redis)
npm run dev:full
```

**Ou manualmente:**

```bash
# 1. Subir Redis (necessário para sincronização)
npm run dev:redis

# 2. Iniciar Next.js
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

**Nota:** O Redis é necessário para o sistema de sincronização funcionar. Em desenvolvimento, ele roda localmente via Docker. Em produção, usa Upstash Redis via Vercel Marketplace.

## 🗂️ Gerenciamento de Múltiplos Torneios

O sistema permite criar e gerenciar **múltiplos torneios simultaneamente**:

### Criar Novo Torneio
1. Clique no botão **"Criar Novo Torneio"** no topo da página
2. Digite o nome do torneio
3. Confirme a criação
4. O novo torneio é automaticamente ativado

### Alternar Entre Torneios
- Use o **dropdown no topo** para alternar entre torneios ativos
- A mudança é instantânea, sem recarregar a página
- Cada torneio mantém suas próprias configurações, jogadores e jogos

### Gerenciar Torneios
Acesse **"Gerenciar Torneios"** para:
- **Visualizar todos os torneios** (ativos e arquivados)
- **Filtrar** por status: Todos, Ativos ou Arquivados
- **Selecionar** um torneio para torná-lo ativo
- **Editar** o nome do torneio
- **Arquivar** torneios finalizados (ficam ocultos do dropdown)
- **Desarquivar** torneios arquivados
- **Deletar** torneios permanentemente
- **Fazer backup** de todos os torneios de uma vez

### Compartilhamento Individual
- Cada torneio tem seu próprio **token de administrador**
- Você pode compartilhar torneios diferentes em dispositivos diferentes
- O token é único por torneio, garantindo segurança e isolamento

### Backup e Restauração
- **Backup completo** inclui credenciais de compartilhamento (criptografadas)
- Ao restaurar, o sistema verifica se o torneio já existe:
  - Se existe: Solicita confirmação para sobrescrever
  - Se não existe: Cria automaticamente o torneio e restaura os dados
- **Backup de múltiplos torneios** disponível no modal de gerenciamento

## 📖 Como Usar

### 1. Configurar Torneio

1. Acesse **Configurações** (⚙️)
2. Digite o nome do torneio
3. Adicione categorias (ex: Iniciante, Avançado)
4. Configure as regras do jogo:
   - Quantidade de sets: Melhor de 1 ou 3 sets
   - Games por set: 4 ou 6 games
   - Set decisivo em tie-break (opcional): 7 ou 10 pontos

### 2. Adicionar Jogadores

1. Em Configurações, adicione jogadores à lista de espera
2. Selecione a categoria
3. Marque como "Seed" (cabeça de chave) se necessário
4. Quando tiver 4 jogadores, clique em "Formar Grupo"

### 3. Registrar Resultados

1. No Dashboard, selecione a categoria
2. Visualize os grupos e partidas geradas
3. Para cada jogo, insira o placar set por set
4. Clique em "Finalizar Jogo"
5. O ranking atualiza automaticamente

### 4. Compartilhar Torneio

1. No Dashboard, clique em "Compartilhar Torneio"
2. Copie o link ou escaneie o QR Code
3. Espectadores podem acessar o link para ver atualizações em tempo real
4. Alterações são sincronizadas automaticamente

### 5. Backup dos Dados

1. Em Configurações → Backup & Restauração
2. Clique em "Baixar Backup (.json)"
3. Para restaurar, selecione o arquivo JSON
4. **Backup Completo do Torneio:** 
   - Inclui todas as configurações, jogadores, grupos, jogos e placares
   - Inclui credenciais de sincronização (criptografadas)
   - Inclui estado de compartilhamento
   - Ao restaurar, o sistema detecta se o torneio existe e oferece opções adequadas
5. **Backup de Todos os Torneios:** 
   - Disponível no modal "Gerenciar Torneios"
   - Exporta todos os torneios de uma vez
   - Útil para migração completa de dispositivo

## 🏗️ Estrutura do Projeto

```
torneio-beach-tennis/
├── app/                    # Páginas Next.js (App Router)
│   ├── api/               # APIs REST
│   │   ├── load/         # Carregar torneio
│   │   ├── save/         # Salvar torneio
│   │   └── tournament/   # Info do torneio
│   ├── config/            # Tela de configuração
│   ├── torneio/           # Páginas públicas
│   │   └── [id]/         # Visualização pública
│   ├── torneios/          # Gerenciamento de torneios
│   ├── layout.tsx         # Layout principal com PWA meta tags
│   └── page.tsx           # Dashboard principal
├── components/            # Componentes React
│   ├── BackupPanel.tsx   # Exportar/Importar
│   ├── Footer.tsx        # Rodapé com versão
│   ├── GameConfigForm.tsx # Config de jogo
│   ├── GroupCard.tsx     # Card de grupo
│   ├── MatchList.tsx     # Lista de jogos
│   ├── ScoreInput.tsx    # Input de placar (com validação ITF/CBT)
│   ├── ShareTournament.tsx # Compartilhamento
│   ├── SyncStatus.tsx    # Status de sincronização
│   └── TournamentSelector.tsx # Seletor de torneios
├── hooks/                 # Custom Hooks
│   ├── useLocalStorage.ts
│   ├── useTournament.ts
│   ├── useTournamentManager.ts # Gerenciamento de múltiplos torneios
│   └── useTournamentSync.ts # Sincronização
├── services/              # Lógica de negócio
│   ├── backupService.ts
│   ├── enrollmentService.ts
│   ├── groupGenerator.ts
│   ├── matchGenerator.ts  # Round Robin
│   ├── rankingService.ts
│   └── scoreValidator.ts  # Validação ITF/CBT
├── types/                 # Interfaces TypeScript
│   └── index.ts
├── lib/                   # Utilitários
│   └── kv.ts             # Operações KV/Redis
├── public/                # Assets PWA
│   └── manifest.json
├── docker-compose.yml     # Redis local (dev)
├── PROJECT_STATUS.md      # Status do desenvolvimento
└── TESTING.md            # Guia de testes

```

## 📋 Regras de Negócio

### Estrutura do Torneio

O torneio é dividido em **3 fases progressivas**:

- **Fase 1:** Grupos iniciais (múltiplos grupos de 4 jogadores)
- **Fase 2:** Grupos semifinais (múltiplos grupos de 4 jogadores)
- **Fase 3:** Final (grupo único com 2 ou 4 jogadores)

### Formação de Grupos
- Grupos de **4 jogadores** cada
- Lista de espera ilimitada
- Excedentes aguardam até completar novo grupo
- **Seeds** distribuídos uniformemente entre grupos

### Geração de Jogos (Round Robin)
- Algoritmo: Circle Method
- Cada jogador joga contra todos os outros do grupo
- Para 4 jogadores: 6 partidas em 3 rodadas
- Exemplo:
  - Rodada 1: A×B, C×D
  - Rodada 2: A×C, B×D
  - Rodada 3: A×D, B×C

### Classificação entre Fases

#### Fase 1 → Fase 2
- **Classificação Direta:** Top 2 de cada grupo
- **Repescagem:** Melhores 3º lugares (quando necessário para completar grupos)
- **Regra:** Apenas repescagem se o número de classificados diretos não formar grupos completos de 4

#### Fase 2 → Fase 3 (Final)
A classificação depende do número de grupos na Fase 2:
- **≤ 2 grupos:** Top 2 de cada grupo (2 ou 4 jogadores na final)
- **3 grupos:** Top 1 de cada grupo + melhor 2º colocado (4 jogadores na final)
- **4 grupos:** Top 1 de cada grupo (4 jogadores na final)
- **5+ grupos:** Top 1 de cada grupo, selecionados os 4 melhores por estatísticas (4 jogadores na final)

#### Fase 3 (Final)
- Grupo único com 2 ou 4 jogadores
- Campeão: 1º lugar do grupo final

### Classificação por Número de Participantes

| Participantes | Fase 1 | Classificação F1→F2 | Fase 2 | Classificação F2→F3 | Fase 3 |
|--------------|--------|---------------------|--------|---------------------|--------|
| **8** | 2 grupos (4+4) | Top 2 de cada (4) | 1 grupo (4) | Top 2 (2) | Final (2) |
| **12** | 3 grupos (4+4+4) | Top 2 de cada (6) + 2 repescados = 8 | 2 grupos (4+4) | Top 2 de cada (4) | Final (4) |
| **16** | 4 grupos (4+4+4+4) | Top 2 de cada (8) | 2 grupos (4+4) | Top 2 de cada (4) | Final (4) |
| **20** | 5 grupos (4+4+4+4+4) | Top 2 de cada (10) | 2 grupos (8+8) + 2 repescados = 3 grupos (4+4+4) | Top 1 de cada + melhor 2º (4) | Final (4) |
| **24** | 6 grupos (4+4+4+4+4+4) | Top 2 de cada (12) | 3 grupos (4+4+4) | Top 1 de cada + melhor 2º (4) | Final (4) |
| **28** | 7 grupos (4+4+4+4+4+4+4) | Top 2 de cada (14) | 3 grupos (12+12) + 2 repescados = 4 grupos (4+4+4+4) | Top 1 de cada (4) | Final (4) |
| **32** | 8 grupos (4+4+4+4+4+4+4+4) | Top 2 de cada (16) | 4 grupos (4+4+4+4) | Top 1 de cada (4) | Final (4) |
| **36+** | Múltiplos grupos | Top 2 de cada | Múltiplos grupos | Top 1 de cada, selecionados os 4 melhores | Final (4) |

**Nota:** Participantes que não completam um grupo na Fase 1 ficam na lista de espera até formar um novo grupo completo.

### Ranking e Desempate

#### Critérios Dentro do Grupo
Classificação de jogadores no mesmo grupo (nesta ordem):
1. **Vitórias** (matches ganhos)
2. **Saldo de Games** (games ganhos - perdidos)
3. **Empate Técnico** (decisão manual, sorteio ou partida extra)

#### Critérios Entre Grupos (Repescagem)
Classificação de jogadores de grupos diferentes (nesta ordem):
1. **Vitórias** (matches ganhos)
2. **Saldo de Games** (games ganhos - perdidos)
3. **Games Ganhos** (total de games ganhos)
4. **Empate Técnico** (decisão manual, sorteio ou partida extra)

**Desempate entre Grupos:**
- Quando há empate técnico entre jogadores de grupos diferentes (ex: melhores 3º lugares), o sistema oferece:
  - Decisão manual (administrador escolhe)
  - Sorteio aleatório
  - Partida extra de simples (para 2 jogadores empatados)

### Configuração de Jogos
- **Sets:** Melhor de 1 ou 3 sets
- **Games por set:** 4 ou 6 games (seguindo regras do tênis)
- **Tie-break decisivo:** Opcional, de 7 ou 10 pontos
- **Flexibilidade:** Sistema permite preencher quantos sets quiser, sem validações rígidas
- **Referência:** Configurações são usadas para referência e exibição no PDF

## 🔧 Tecnologias

### Stack Principal
- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Estado:** React Hooks + LocalStorage
- **Validação:** Zod

### Persistência e Sincronização
- **Cliente:** LocalStorage (dados locais)
- **Servidor (Produção):** Upstash Redis via Vercel Marketplace
- **Servidor (Desenvolvimento):** Redis 7 via Docker
- **Sincronização:** 
  - SWR para espectadores (refresh a cada 1 minuto)
  - Debounce + Dirty Checking para admins (2 segundos)
- **TTL:** 10 dias (renovado automaticamente a cada sync)

### Bibliotecas
- **PWA:** @ducanh2912/next-pwa
- **QR Code:** qrcode.react
- **PDF:** jspdf
- **UUID:** uuid
- **HTTP Client:** fetch API nativo

### Versionamento
- **Semantic Versioning (SemVer)** automático via GitHub Actions
- Baseado em Conventional Commits

## 📱 PWA - Progressive Web App

### Como Instalar

**Android:**
1. Abra no Chrome
2. Menu → "Adicionar à tela inicial"
3. Ícone aparece na home

**iOS:**
1. Abra no Safari
2. Compartilhar → "Adicionar à Tela de Início"

**Desktop (Chrome/Edge):**
1. Ícone de instalação na barra de endereço
2. Clique para instalar

### Funciona Offline!
Após a primeira visita, a aplicação funciona completamente offline.
Dados são salvos automaticamente no dispositivo e sincronizados quando online.

### Sincronização Multi-Dispositivo
- **Admin:** Alterações são salvas automaticamente após 2 segundos
- **Espectador:** Dados atualizam automaticamente a cada 1 minuto
- **Compartilhamento:** Gere um link público ou QR Code para compartilhar cada torneio
- **Segurança:** Cada torneio tem seu próprio token de admin único
- **Isolamento:** Compartilhe torneios diferentes em dispositivos diferentes sem conflitos

## 🧪 Testes

Para executar testes manuais, consulte [TESTING.md](TESTING.md).

```bash
# Build de produção
npm run build

# Rodar build localmente
npm start

# Lighthouse audit
lighthouse http://localhost:3000 --view
```

## 🔄 Versionamento

A versão do projeto é gerenciada **automaticamente** via GitHub Actions baseado em [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` → Bump Minor (0.2.3 → 0.3.0)
- `fix:` → Bump Patch (0.2.3 → 0.2.4)
- `BREAKING CHANGE:` → Bump Major (0.2.3 → 1.0.0)
- `chore/docs/refactor:` → Sem bump (não cria release)

**⚠️ Não altere a versão manualmente no `package.json`** - O GitHub Actions cuida disso automaticamente!

## 📦 Build e Deploy

### Build de Produção

```bash
npm run build
```

### Deploy (Vercel)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/tmill15/torneio-beach-tennis)

Ou via CLI:
```bash
npm install -g vercel
vercel
```

### Configuração para Produção (Vercel)

#### 1. Variáveis de Ambiente

##### Obrigatórias (Injetadas Automaticamente)
Após conectar o Upstash Redis via Vercel Marketplace, as seguintes variáveis são injetadas automaticamente:

- **`REDIS_URL`** (preferencial) - URL Redis completa fornecida pela Vercel
- **OU `UPSTASH_REDIS_URL`** - URL Redis tradicional (alternativa)
- **OU `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`** - REST API (fallback)
- **OU `KV_REST_API_URL` + `KV_REST_API_TOKEN`** - Vercel KV antigo (fallback)

**Como configurar:**
1. Acesse: https://vercel.com/dashboard
2. Vá em **Marketplace** (menu lateral)
3. Procure por **"Upstash Redis"**
4. Clique em **"Add Integration"** ou **"Install"**
5. Selecione seu projeto
6. Crie um novo banco Redis ou use um existente
7. ✅ As variáveis são injetadas automaticamente - **não precisa configurar manualmente**

##### Opcionais
- **`NEXT_PUBLIC_APP_URL`**: URL base da aplicação (ex: `https://seu-app.vercel.app`)
  - Usado para gerar links de compartilhamento
  - Se não configurado, usa `window.location.origin` automaticamente
  - **Configuração:**
    - Vercel Dashboard → Seu Projeto → **Settings** → **Environment Variables**
    - Adicione: `NEXT_PUBLIC_APP_URL` = `https://seu-dominio.vercel.app`

#### 2. Deploy em Desenvolvimento

```bash
# Opção 1: Comando único (recomendado)
npm run dev:full

# Opção 2: Manual (2 terminais)
# Terminal 1: Subir Redis
npm run dev:redis

# Terminal 2: Iniciar Next.js
npm run dev
```

**Requisitos:**
- Docker instalado (para Redis local)
- Node.js 18+
- npm ou yarn

**Nota:** O Redis local é necessário apenas para testar sincronização em desenvolvimento. O app funciona sem Redis, mas a sincronização não estará disponível.

#### 3. Deploy em Produção

##### Via Vercel Dashboard
1. Conecte seu repositório GitHub à Vercel
2. Configure o Upstash Redis (veja seção "Variáveis de Ambiente")
3. Configure `NEXT_PUBLIC_APP_URL` (opcional)
4. Faça deploy automático ou manual

##### Via Vercel CLI
```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer deploy
vercel

# Deploy em produção
vercel --prod
```

##### Verificar Deploy
Após o deploy:
1. Teste criando um torneio
2. Ative o compartilhamento nas configurações
3. Gere um link de compartilhamento
4. Acesse o link em outro navegador/dispositivo para testar a sincronização
5. Verifique os logs em: Vercel Dashboard → Deployments → Functions → `/api/save`
   - ✅ `✅ Upstash Redis: usando REDIS_URL` = Funcionando!
   - ❌ `❌ Redis não configurado!` = Verificar configuração

**Nota:** 
- O Redis local (via Docker) é usado apenas em desenvolvimento
- Em produção, o sistema usa **Upstash Redis** via Vercel Marketplace
- O código detecta automaticamente o ambiente e usa a configuração apropriada
- TTL de dados no Redis: 10 dias (renovado automaticamente a cada sync)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 👨‍💻 Desenvolvimento

### Roadmap

Consulte [PROJECT_STATUS.md](PROJECT_STATUS.md) para o status atual e próximos passos.

### Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

### Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

## 🙏 Créditos

- **Referência de Stack:** [sorteador-duplas](https://github.com/tmill15/sorteador-duplas)
- **Algoritmo Round Robin:** Circle Method

---

Desenvolvido por Thiago Milhomem para a comunidade de Beach Tennis

**Nota:** A versão é gerenciada automaticamente via GitHub Actions baseado em Conventional Commits. Consulte os [releases do GitHub](https://github.com/tmill15/torneio-beach-tennis/releases) para ver a versão atual e histórico de atualizações.
