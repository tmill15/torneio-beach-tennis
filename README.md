# 🎾 BeachTennis Manager

App PWA para gestão completa de torneios de Beach Tennis em modo Round Robin.

## 📱 Características

- ✅ **Progressive Web App (PWA)** - Instalável e funciona offline
- 🎯 **Round Robin Automático** - Gera partidas "todos contra todos"
- 📊 **Ranking em Tempo Real** - Atualização automática após cada jogo
- ⚙️ **Configurações Simplificadas** - 1 ou 3 sets, 4 ou 6 games, tie-break de 7 ou 10 pontos
- 💾 **Backup/Restore** - Export/Import completo em JSON
- 📱 **Mobile-First** - Design otimizado para dispositivos móveis
- 🌙 **Dark Mode** - Suporte a tema escuro
- 🔄 **Sincronização Multi-Dispositivo** - Compartilhe torneios e sincronize em tempo real
- 🔗 **Compartilhamento** - Link público e QR Code para espectadores

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

**Nota:** O Redis é necessário para o sistema de sincronização funcionar. Em desenvolvimento, ele roda localmente via Docker. Em produção, usa Vercel KV.

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
4. **Backup Completo:** Inclui credenciais de sincronização (criptografadas com senha) e estado de compartilhamento
5. **Backup de Categoria:** Exporta apenas uma categoria específica (sem credenciais)

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
│   ├── layout.tsx         # Layout principal com PWA meta tags
│   └── page.tsx           # Dashboard principal
├── components/            # Componentes React
│   ├── BackupPanel.tsx   # Exportar/Importar
│   ├── Footer.tsx        # Rodapé com versão
│   ├── GameConfigForm.tsx # Config de jogo
│   ├── GroupCard.tsx     # Card de grupo
│   ├── MatchList.tsx     # Lista de jogos
│   ├── ScoreInput.tsx    # Input de placar
│   ├── ShareTournament.tsx # Compartilhamento
│   └── SyncStatus.tsx    # Status de sincronização
├── hooks/                 # Custom Hooks
│   ├── useLocalStorage.ts
│   ├── useTournament.ts
│   └── useTournamentSync.ts # Sincronização
├── services/              # Lógica de negócio
│   ├── backupService.ts
│   ├── enrollmentService.ts
│   ├── groupGenerator.ts
│   ├── matchGenerator.ts  # Round Robin
│   └── rankingService.ts
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

### Formação de Grupos
- Grupos de **4 duplas** cada
- Lista de espera ilimitada
- Excedentes aguardam até completar novo grupo
- **Seeds** distribuídos uniformemente entre grupos

### Geração de Jogos (Round Robin)
- Algoritmo: Circle Method
- Cada dupla joga contra todas as outras
- Para 4 duplas: 6 partidas em 3 rodadas
- Exemplo:
  - Rodada 1: A×B, C×D
  - Rodada 2: A×C, B×D
  - Rodada 3: A×D, B×C

### Ranking e Desempate
Critérios de classificação (nesta ordem):
1. **Vitórias** (matches ganhos)
2. **Saldo de Sets** (sets ganhos - perdidos)
3. **Saldo de Games** (games ganhos - perdidos)
4. **Empate Técnico** (decisão manual)

### Configuração de Jogos
- **Sets:** Melhor de 1 ou 3 sets
- **Games por set:** 4 ou 6 games (seguindo regras do tênis)
- **Tie-break decisivo:** Opcional, de 7 ou 10 pontos
- **Flexibilidade:** Sistema permite preencher quantos sets quiser, sem validações rígidas
- **Referência:** Configurações são usadas para referência e exibição no PDF

## 🔧 Tecnologias

- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Estado:** React Hooks + Context API
- **Persistência:** LocalStorage + Vercel KV (produção) / Redis (dev)
- **Sincronização:** SWR para viewers, debounce para admins
- **Validação:** Zod
- **PWA:** next-pwa
- **Cache/DB:** Vercel KV (produção), Redis 7 (desenvolvimento)
- **Versionamento:** Semantic Versioning (SemVer)

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
- **Compartilhamento:** Gere um link público ou QR Code para compartilhar
- **Segurança:** Apenas admins podem editar (controle via token)

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

Para que a sincronização funcione em produção, você precisa configurar:

1. **Upstash Redis (via Vercel Marketplace):**
   - Acesse o dashboard da Vercel: https://vercel.com/dashboard
   - Vá em **Marketplace** (menu lateral)
   - Procure por **"Upstash Redis"** ou **"Upstash"**
   - Clique em **"Add Integration"** ou **"Install"**
   - Selecione seu projeto
   - Crie um novo banco Redis ou use um existente
   - A Vercel automaticamente injeta as variáveis de ambiente necessárias:
     - `UPSTASH_REDIS_URL` (preferencial - URL Redis tradicional)
     - OU `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (fallback)
   - ✅ **Não precisa configurar manualmente** - as variáveis são injetadas automaticamente após conectar o banco ao projeto

2. **Variável de Ambiente (Opcional):**
   - `NEXT_PUBLIC_APP_URL`: URL base da aplicação (ex: `https://seu-app.vercel.app`)
   - Usado para gerar links de compartilhamento
   - Se não configurado, usa `window.location.origin` automaticamente
   - **Configuração:**
     - Vercel Dashboard → Seu Projeto → **Settings** → **Environment Variables**
     - Adicione: `NEXT_PUBLIC_APP_URL` = `https://seu-dominio.vercel.app`

3. **Verificar Deploy:**
   - Após o deploy, teste criando um torneio
   - Ative o compartilhamento nas configurações
   - Gere um link de compartilhamento
   - Acesse o link em outro navegador/dispositivo para testar a sincronização

**Nota:** 
- O Redis local (via Docker) é usado apenas em desenvolvimento
- Em produção, o sistema usa **Upstash Redis** via Vercel Marketplace
- O código detecta automaticamente o ambiente e usa a configuração apropriada

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

**Versão Atual:** 0.4.0  
**Última Atualização:** 14/01/2026  

Desenvolvido por Thiago Milhomem para a comunidade de Beach Tennis

**Nota:** A versão é gerenciada automaticamente via GitHub Actions baseado em Conventional Commits.
