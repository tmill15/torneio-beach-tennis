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
- 🔄 **LocalStorage** - Persistência automática dos dados

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

# Execute em modo desenvolvimento
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

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

### 4. Backup dos Dados

1. Em Configurações → Backup & Restauração
2. Clique em "Baixar Backup (.json)"
3. Para restaurar, selecione o arquivo JSON

## 🏗️ Estrutura do Projeto

```
torneio-beach-tennis/
├── app/                    # Páginas Next.js (App Router)
│   ├── config/            # Tela de configuração
│   ├── layout.tsx         # Layout principal com PWA meta tags
│   └── page.tsx           # Dashboard principal
├── components/            # Componentes React
│   ├── BackupPanel.tsx   # Exportar/Importar
│   ├── Footer.tsx        # Rodapé com versão
│   ├── GameConfigForm.tsx # Config de jogo
│   ├── GroupCard.tsx     # Card de grupo
│   ├── MatchList.tsx     # Lista de jogos
│   └── ScoreInput.tsx    # Input de placar
├── hooks/                 # Custom Hooks
│   ├── useLocalStorage.ts
│   └── useTournament.ts
├── services/              # Lógica de negócio
│   ├── backupService.ts
│   ├── enrollmentService.ts
│   ├── groupGenerator.ts
│   ├── matchGenerator.ts  # Round Robin
│   └── rankingService.ts
├── types/                 # Interfaces TypeScript
│   └── index.ts
├── public/                # Assets PWA
│   └── manifest.json
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
- **Persistência:** LocalStorage
- **Validação:** Zod
- **PWA:** next-pwa
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
Dados são salvos automaticamente no dispositivo.

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

**Versão Atual:** 0.2.3  
**Última Atualização:** 10/01/2026  

Desenvolvido por Thiago Milhomem para a comunidade de Beach Tennis

**Nota:** A versão é gerenciada automaticamente via GitHub Actions baseado em Conventional Commits.
