# PROJECT STATUS - BeachTennis Manager

## 📋 Objetivo do Projeto

Desenvolver uma aplicação PWA completa para gestão de torneios de Beach Tennis com:
- Sistema de inscrição individual e formação de grupos (4 jogadores por grupo)
- Geração automática de partidas em duplas no formato Round Robin de pareamentos
- Ranking individual em tempo real com critérios de desempate
- Configurações simplificadas de jogo (1 ou 3 sets, 4 ou 6 games, tie-break de 7 ou 10 pontos)
- Sistema de backup/restore (export/import JSON)
- Funciona offline e é instalável

## 🎯 Regras de Negócio Implementadas

### ✅ Estrutura Geral - COMPLETO
- [x] Separação por categorias
- [x] Configuração de nome do torneio
- [x] PWA configurado (instalável, offline-ready)
- [x] Versionamento SemVer automático via CI/CD
- [x] Footer com versão visível (sincronizada automaticamente)

### ✅ Inscrição e Grupos - COMPLETO
- [x] Sistema de inscrição individual com lista de espera
- [x] Formação automática de grupos (4 jogadores)
- [x] Distribuição de seeds
- [x] Algoritmo Round Robin de pareamentos para geração de jogos
- [x] Validação de grupos completos
- [x] Cada jogador joga COM e CONTRA todos os outros

### ✅ Partidas e Ranking - COMPLETO
- [x] Cálculo de ranking INDIVIDUAL (Vitórias > Saldo Sets > Saldo Games)
- [x] Jogos em formato de duplas (4 jogadores por jogo)
- [x] Estatísticas individuais acumuladas de todos os jogos
- [x] Configurações de jogo simplificadas (1 ou 3 sets, 4 ou 6 games, tie-break de 7 ou 10 pontos)
- [x] Input de placares flexível (sem validações rígidas)
- [x] Diferenciação visual jogos pendentes/concluídos
- [x] Atualização automática de ranking individual

### ✅ Backup e PWA - COMPLETO
- [x] Sistema de backup/restore completo (export/import JSON)
- [x] Export/Import contextual de jogadores por categoria
- [x] Validação de backups
- [x] Metadata de backup
- [x] PWA instalável (Android, iOS, Desktop)
- [x] Funciona offline completamente

### ✅ Sincronização Multi-Dispositivo - COMPLETO
- [x] Sincronização em tempo real com Vercel KV (produção) e Redis (desenvolvimento)
- [x] Modo Admin com debounce (2s) e dirty checking para otimização
- [x] Modo Viewer com SWR (refresh automático a cada 1 minuto)
- [x] Controle de acesso com adminToken (hash SHA-256)
- [x] Compartilhamento de torneio com link público e QR Code
- [x] Página pública de visualização (/torneio/[id])
- [x] Status de sincronização na UI (Salvando/Salvo/Erro)
- [x] Retry automático com backoff exponencial
- [x] TTL de 90 dias para dados no KV

### ✅ Interface - COMPLETO
- [x] Interface de configuração completa
- [x] Dashboard com cards de grupos
- [x] Toggle de visualização (Classificação/Jogos)
- [x] Design responsivo (mobile, tablet, desktop)
- [x] Dark mode suportado
- [x] Navegação intuitiva

## 🎉 Status do Projeto: ATIVO EM DESENVOLVIMENTO

**Última atualização:** 14/01/2026  
**Versão:** v0.4.0  
**Status:** ✅ Pronto para uso com sincronização em tempo real

Todas as funcionalidades core foram implementadas e testadas. O sistema está pronto para gerenciar torneios de Beach Tennis com 3 fases progressivas e sincronização multi-dispositivo!

## 📦 Status dos Módulos

### Fase 1: Fundação e Estrutura ✅
- [x] Setup Next.js + TypeScript + Tailwind
- [x] Estrutura de pastas criada
- [x] Configurações iniciais (tsconfig, tailwind, etc)
- [x] PROJECT_STATUS.md criado
- [x] Configuração PWA completa

### Fase 2: Tipos e Interfaces ✅
- [x] Interface Player
- [x] Interface GameConfig
- [x] Interface SetScore
- [x] Interface Match
- [x] Interface Group
- [x] Interface Tournament
- [x] Interface RankingEntry
- [x] Interfaces auxiliares (Backup, Validation)

### Fase 3: Services ✅
- [x] EnrollmentService
- [x] GroupGenerator
- [x] MatchGenerator (Round Robin) - CRÍTICO
- [x] RankingService
- [x] BackupService

### Fase 4: Hooks ✅
- [x] useLocalStorage
- [x] useTournament
- [x] useTournamentSync (sincronização com KV/Redis)

### Fase 5: Componentes UI ✅
- [x] GameConfigForm
- [x] ScoreInput
- [x] BackupPanel
- [x] Footer (com versão)
- [x] GroupCard
- [x] MatchList
- [x] ShareTournament (compartilhamento com QR Code)
- [x] SyncStatus (indicador de sincronização)

### Fase 6: Páginas ✅
- [x] Tela de Configuração
- [x] Dashboard Principal
- [x] Layout com Footer
- [x] Página pública de visualização (/torneio/[id])

### Fase 7: Testes e Integração ✅
- [x] Documentação de testes (TESTING.md)
- [x] Guia de testes de fluxo completo
- [x] Guia de testes de backup/restore
- [x] Guia de testes PWA
- [x] Instruções de Lighthouse audit

### Fase 8: Refinamentos ✅
- [x] UX/UI polimento
- [x] Design responsivo implementado
- [x] Dark mode suportado
- [x] Documentação completa (README.md)

### Fase 9: CI/CD e Versionamento Automático ✅
- [x] GitHub Actions workflow para auto-release
- [x] Versionamento automático baseado em Conventional Commits
- [x] Exposição de versão via variável de ambiente Next.js
- [x] Footer atualizado para usar versão do build
- [x] Integração com Vercel para deploy automático

### Fase 10: Sincronização Multi-Dispositivo ✅
- [x] APIs REST para save/load de torneios
- [x] Integração com Vercel KV (produção) e Redis local (dev)
- [x] Hook useTournamentSync com SWR para viewers
- [x] Debounce e dirty checking para otimização de writes
- [x] Sistema de autenticação com adminToken
- [x] Compartilhamento de torneio com link e QR Code
- [x] Página pública read-only para visualização
- [x] Status de sincronização em tempo real
- [x] Retry automático com backoff exponencial

**Detalhes da Implementação:**
- **Workflow:** `.github/workflows/release.yml`
  - Disparado automaticamente em push para `main`
  - Usa `mathieudutour/github-tag-action` para calcular bump de versão
  - Atualiza `package.json` automaticamente
  - Cria GitHub Release com changelog automático
  - Commit do bump inclui `[skip ci]` para evitar loops

- **Versionamento Automático:**
  - Versão é gerenciada **exclusivamente** via GitHub Actions
  - **NÃO altere a versão manualmente** no `package.json`
  - Versão atual: **0.2.3** (conforme `package.json`)
  - Regras de bump:
    - `feat:` → Bump Minor (0.2.3 → 0.3.0)
    - `fix:` → Bump Patch (0.2.3 → 0.2.4)
    - `BREAKING CHANGE:` → Bump Major (0.2.3 → 1.0.0)
    - `chore/docs/refactor:` → Sem bump (não cria release)
  - `package.json` é atualizado automaticamente pelo workflow
  - Versão sempre sincronizada entre `package.json` e GitHub Releases

- **Exposição de Versão:**
  - Variável `NEXT_PUBLIC_APP_VERSION` exposta no build
  - Lida automaticamente do `package.json` no `next.config.mjs`
  - Footer usa `process.env.NEXT_PUBLIC_APP_VERSION`
  - Versão sempre sincronizada com o `package.json`

- **Deploy Vercel:**
  - Deploy automático na branch `main`
  - Build Command: `npm run build`
  - Output Directory: `.next`
  - Versão exposta automaticamente no build

## 📊 Checklist de Funcionalidades

### Core ✅
- [x] Projeto Next.js inicializado
- [x] PWA configurado (manifest, service worker, ícones)
- [x] Sistema de types TypeScript completo
- [x] Persistência com LocalStorage
- [x] Export/Import de torneios (backup)

### Torneio ✅
- [x] Criar torneio com nome e categorias
- [x] Cadastrar jogadores (nome, categoria, seed)
- [x] Lista de espera automática
- [x] Formar grupos de 4 duplas
- [x] Distribuir seeds uniformemente

### Partidas ✅
- [x] Gerar jogos Round Robin automaticamente
- [x] Configurar formato do jogo (1 ou 3 sets, 4 ou 6 games, tie-break de 7 ou 10 pontos)
- [x] Inserir placares (interface flexível, sem validações rígidas)
- [x] Salvar parcial e finalizar partida
- [x] Mostrar jogos pendentes e concluídos

### Ranking ✅
- [x] Calcular ranking automaticamente
- [x] Ordenar por: Vitórias > Saldo Sets > Saldo Games
- [x] Mostrar estatísticas completas
- [x] Atualizar em tempo real

### Interface ✅
- [x] Dashboard com cards de grupos
- [x] Tela de configuração completa
- [x] Footer com versão do sistema
- [x] Design mobile-first
- [x] Tema claro/escuro implementado

## 🔄 Histórico de Versões

### v0.4.0 - Sistema de Sincronização Multi-Dispositivo ✅
**Data:** 14/01/2026

**Adicionado:**
- ✅ **Sincronização em tempo real:** Sistema completo de sincronização entre dispositivos usando Vercel KV (produção) e Redis local (desenvolvimento)
- ✅ **Modo Admin otimizado:**
  - Debounce de 2 segundos antes de salvar
  - Dirty checking para evitar saves desnecessários
  - Status de sincronização na UI (Salvando/Salvo/Erro)
  - Retry automático com backoff exponencial (2s, 4s, 8s)
- ✅ **Modo Viewer (Espectador):**
  - Atualização automática a cada 1 minuto usando SWR
  - Revalidação ao focar na aba ou reconectar
  - Visualização read-only sem necessidade de autenticação
- ✅ **Sistema de compartilhamento:**
  - Geração de link público único por torneio
  - QR Code para compartilhamento rápido
  - Modal de compartilhamento integrado
- ✅ **Controle de acesso:**
  - AdminToken armazenado no localStorage
  - Hash SHA-256 para segurança
  - Validação de token nas APIs de escrita
- ✅ **Página pública de visualização:**
  - Rota `/torneio/[id]` para visualização read-only
  - Interface otimizada para espectadores
  - Sincronização automática de dados
- ✅ **APIs REST:**
  - `POST /api/save` - Salvar torneio (requer adminToken)
  - `GET /api/load` - Carregar torneio público
  - `GET /api/tournament/[id]` - Informações do torneio
- ✅ **Infraestrutura:**
  - Docker Compose para Redis local em desenvolvimento
  - Suporte automático a Vercel KV em produção
  - TTL de 90 dias para dados no KV

**Modificado:**
- 🔄 `hooks/useTournamentSync.ts` (NOVO):
  - Hook completo para gerenciar sincronização
  - Lógica de debounce e dirty checking
  - Integração com SWR para modo viewer
- 🔄 `lib/kv.ts` (NOVO):
  - Utilitários para operações com KV/Redis
  - Detecção automática de ambiente (dev/prod)
  - Funções de hash para tokens
- 🔄 `components/ShareTournament.tsx` (NOVO):
  - Modal de compartilhamento com QR Code
  - Geração automática de links
- 🔄 `components/SyncStatus.tsx` (NOVO):
  - Indicador visual de status de sincronização
- 🔄 `app/torneio/[id]/page.tsx` (NOVO):
  - Página pública para visualização de torneios
  - Interface read-only otimizada
- 🔄 `app/page.tsx`:
  - Integração com useTournamentSync
  - Botão de compartilhamento
  - Status de sincronização
- 🔄 `app/config/page.tsx`:
  - Integração com sistema de sincronização
  - Geração de tournamentId e adminToken

**Arquivos Criados:**
- `app/api/load/route.ts` - API de carregamento
- `app/api/save/route.ts` - API de salvamento
- `app/api/tournament/[id]/route.ts` - API de informações
- `hooks/useTournamentSync.ts` - Hook de sincronização
- `lib/kv.ts` - Utilitários KV/Redis
- `components/ShareTournament.tsx` - Componente de compartilhamento
- `components/SyncStatus.tsx` - Componente de status
- `app/torneio/[id]/page.tsx` - Página pública
- `docker-compose.yml` - Configuração Redis local

**Benefícios:**
- ✅ **Multi-dispositivo:** Torneios sincronizados entre vários dispositivos
- ✅ **Tempo real:** Espectadores veem atualizações automaticamente
- ✅ **Performance:** Otimizações de debounce e dirty checking
- ✅ **Segurança:** Controle de acesso com tokens hashados
- ✅ **Compartilhamento:** Fácil compartilhamento com link e QR Code
- ✅ **Desenvolvimento:** Redis local para testes sem dependência externa

**Como usar:**
1. Admin: Cria torneio e clica em "Compartilhar" para gerar link
2. Espectador: Acessa link público e vê atualizações em tempo real
3. Admin: Alterações são salvas automaticamente após 2 segundos
4. Espectador: Dados atualizam automaticamente a cada 1 minuto

---

### v0.15.0 - Simplificação e Melhorias na Configuração de Jogos ✅
**Data:** 10/01/2026

**Adicionado:**
- ✅ **Configurações simplificadas de jogos:**
  - Opções de games: 4 ou 6 games por set
  - Opções de sets: Melhor de 1 ou 3 sets
  - Tie-break decisivo: 7 ou 10 pontos
  - Interface mais limpa e intuitiva
- ✅ **Simplificação da interface de placares:**
  - Removidos campos de tie-break em cada set
  - Removidas validações rígidas de preenchimento
  - Usuário pode preencher quantos sets quiser
  - Configurações mantidas apenas para referência e PDF
- ✅ **PDF atualizado:**
  - Mostra pontos do tie-break quando configurado (7 ou 10 pontos)
  - Informação completa das configurações do jogo

**Modificado:**
- 🔄 `types/index.ts`:
  - `GameConfig` agora usa tipos restritos: `quantidadeSets: 1 | 3`, `gamesPerSet: 4 | 6`, `pontosTieBreak: 7 | 10`
- 🔄 `components/GameConfigForm.tsx`:
  - Selects ao invés de inputs numéricos
  - Opções claras e limitadas
- 🔄 `components/ScoreInput.tsx`:
  - Removidos campos de tie-break
  - Removidas validações rígidas
  - Interface simplificada
- 🔄 `services/rankingService.ts`:
  - Validação simplificada (apenas verifica se há vencedor)
  - Removida lógica complexa de tie-break em sets normais
- 🔄 `services/pdfService.ts`:
  - Mostra pontos do tie-break no formato do jogo
- 🔄 `services/backupService.ts`:
  - Função de normalização para compatibilidade com backups antigos

**Comportamento:**
- Configurações de sets/games/tie-break são apenas para referência
- Usuário tem total flexibilidade ao preencher placares
- PDF mostra informações completas das configurações
- Backups antigos são normalizados automaticamente

**Benefícios:**
- ✅ Interface mais simples e intuitiva
- ✅ Flexibilidade total para diferentes formatos de jogo
- ✅ Menos validações bloqueando o usuário
- ✅ Configurações claras e limitadas

---

### v0.14.5 - Correção: Limpar Categoria e Lista de Espera ✅
**Data:** 10/01/2026

**Corrigido:**
- 🐛 **Limpar Categoria não mostrava jogadores na lista de espera:** O contador mostrava o número correto, mas a lista estava vazia
  - **Problema:** Jogadores eram adicionados com categoria incorreta ou não apareciam devido a categorias órfãs
  - **Solução:** 
    - Garantia explícita de categoria ao retornar jogadores para lista de espera
    - `getWaitingListStats` agora inclui categorias encontradas na lista de espera, mesmo que não estejam no array de categorias
  - **Resultado:** Lista de espera mostra todos os jogadores corretamente após limpar categoria

**Modificado:**
- 🔄 `hooks/useTournament.ts`:
  - `clearCategory` agora garante explicitamente `categoria: categoria` ao retornar jogadores
- 🔄 `services/enrollmentService.ts`:
  - `getWaitingListStats` agora inclui todas as categorias únicas encontradas na lista de espera

---

### v0.7.0 - Sistema de 3 Fases Progressivas ✅
**Data:** 10/01/2026

**Adicionado:**
- ✅ **Sistema completo de 3 fases fixas:**
  - Fase 1: Múltiplos grupos de 4 (Round Robin)
  - Fase 2: Múltiplos grupos de 4 com repescagem
  - Fase 3 (FINAL): 1 único grupo final
- ✅ **Validação automática de torneio viável** (`phaseValidation.ts`)
  - Bloqueia formação se número de jogadores não permite 3 fases simétricas
  - Integrado com lista de espera (jogadores excedentes ficam aguardando)
  - Preview do caminho completo das 3 fases antes de formar grupos
- ✅ **Lógica de classificação dinâmica:**
  - Fase 1 → 2: Top 2 de cada grupo + repescagem flexível (melhores 3º)
  - Fase 2 → 3: Regras dinâmicas baseadas no nº de grupos:
    - ≤2 grupos: Top 2 de cada
    - 3 grupos: Top 1 cada + melhor 2º
    - ≥4 grupos: Top 1 de cada
- ✅ **Distribuição uniforme de seeds em TODAS as fases**
  - Seeds sempre separados em grupos diferentes
  - Garante competição equilibrada e progressão justa
- ✅ **Navegação por fases no dashboard:**
  - 3 abas fixas sempre visíveis (Fase 1, Fase 2, FINAL)
  - Abas bloqueadas (🔒) quando fase não foi gerada
  - Abas concluídas marcadas com ✓
- ✅ **PhaseAdvanceCard component:**
  - Preview de quem classificou (diretos + repescagem)
  - Botão "Avançar para Fase X" com confirmação
  - Estilo especial para botão "Avançar para GRUPO FINAL" (gradiente 🏆)
- ✅ **Banner de CAMPEÃO:**
  - Exibido automaticamente quando Fase Final está completa
  - Design gradiente amarelo/laranja com borda dourada
  - Nome do campeão destacado
- ✅ **Badges de status de classificação no ranking:**
  - CLASSIFICADO (verde) - classificou direto
  - REPESCAGEM (amarelo) - classificou por repescagem
  - ELIMINADO (vermelho) - eliminado nesta fase
- ✅ **Seletor de fase para resorteio:**
  - Permite resortear apenas uma fase específica
  - Jogadores retornam à lista de espera
  - Preserva dados de outras fases
- ✅ **Tipos atualizados:**
  - `Player.eliminatedInPhase?: number`
  - `Player.qualificationType?: 'direct' | 'repechage'`
  - `QualifiedPlayer` interface para tracking de classificação

**Modificado:**
- 🔄 `useTournament` hook:
  - `advanceToNextPhase(categoria, currentPhase)` - avança para próxima fase
  - `getPhaseAdvancePreview(categoria, phase)` - preview de classificados
  - `resetAndRedrawGroups(categoria, fase)` - agora aceita fase específica
  - `isPhaseComplete(categoria, phase)` - verifica se fase está completa
  - `getMaxPhase(categoria)` - retorna fase máxima da categoria
  - `isFinalPhase(phase)` - verifica se é fase final
- 🔄 Dashboard (`app/page.tsx`):
  - Filtro de grupos por fase selecionada
  - PhaseAdvanceCard quando fase está completa
  - Banner de campeão quando Final está completa
  - Estatísticas continuam filtradas por categoria
- 🔄 Config Page (`app/config/page.tsx`):
  - Validação integrada ao formar grupos
  - Preview claro do caminho de 3 fases
  - Aviso se jogadores ficarão na lista de espera
  - Seletor de fase para resorteio
- 🔄 GroupCard:
  - Badges de classificação/eliminação no ranking
  - Preserva funcionalidades de desempate

**Novos Services:**
- `services/phaseValidation.ts` - Validação de viabilidade de 3 fases
- `services/phaseGenerator.ts` - Lógica completa de geração e transição de fases

**Novos Components:**
- `components/PhaseAdvanceCard.tsx` - Card de avanço de fase com preview

**Exemplo Prático:**

```
20 jogadores inscritos na categoria "Normal":

Fase 1 (5 grupos de 4):
- Top 2 cada = 10 diretos
- 10 % 4 = 2 (sobra) → Pega 2 melhores 3º
- Total: 12 classificados

Fase 2 (3 grupos de 4):
- Top 1 cada = 3 diretos
- Melhor 2º lugar = 1 repescado
- Total: 4 classificados

Fase 3 (1 grupo final de 4):
- Top 1 = CAMPEÃO 🏆
```

**Regras de Bloqueio:**

- ✅ 8+ jogadores: Torneio pode ser formado
- ❌ <8 jogadores: Bloqueado (mínimo 2 grupos na Fase 1)
- ✅ Lista de espera: Sobras não bloqueiam (ex: 18 jogadores → 16 jogam, 2 aguardam)

**Compatibilidade:**

Esta versão mantém compatibilidade com backups da v0.6.x. Novos campos opcionais não quebram estruturas antigas.

---

### v0.14.4 - Correção: Lista de Jogadores Duplicados ✅
**Data:** 10/01/2026

**Corrigido:**
- 🐛 **Lista de jogadores duplicada:** Jogadores que apareciam em múltiplas fases estavam sendo exibidos múltiplas vezes na lista
  - **Problema:** Um jogador que participa da Fase 1, 2 e 3 aparecia 3 vezes na lista visual
  - **Causa:** `playersInCategory` usava `flatMap` que incluía o mesmo jogador de todos os grupos (múltiplas fases)
  - **Solução:** Usar `Map` com `player.id` para garantir que cada jogador apareça apenas uma vez na lista
  - **Resultado:** Lista mostra apenas jogadores únicos, mesmo que participem de múltiplas fases

**Modificado:**
- 🔄 `app/config/page.tsx`:
  - `playersInCategory` agora remove duplicatas usando `Map` antes de renderizar
  - Comentário explicativo adicionado

**Antes:**
```typescript
const playersInCategory = groupsInCategory.flatMap(g => g.players);
// Resultado: Jogador aparece 3x se estiver em 3 fases
```

**Agora:**
```typescript
const playersInCategoryRaw = groupsInCategory.flatMap(g => g.players);
const playersInCategoryMap = new Map<string, typeof playersInCategoryRaw[0]>();
playersInCategoryRaw.forEach(player => {
  if (!playersInCategoryMap.has(player.id)) {
    playersInCategoryMap.set(player.id, player);
  }
});
const playersInCategory = Array.from(playersInCategoryMap.values());
// Resultado: Cada jogador aparece apenas uma vez ✅
```

---

### v0.14.3 - Correção: Contagem de Jogadores Duplicados ✅
**Data:** 10/01/2026

**Corrigido:**
- 🐛 **Contagem duplicada de jogadores:** Jogadores que avançavam de fase estavam sendo contados múltiplas vezes
  - **Problema:** Um jogador que participa da Fase 1, 2 e 3 aparecia 3 vezes na contagem total
  - **Causa:** `totalEnrolledPlayers` usava `flatMap` que incluía o mesmo jogador de todos os grupos (múltiplas fases)
  - **Solução:** Usar `Set` com `player.id` para contar apenas jogadores únicos
  - **Resultado:** Contagem correta de jogadores únicos, independente de quantas fases participaram

**Modificado:**
- 🔄 `app/config/page.tsx`:
  - `totalEnrolledPlayers` agora usa `Set` para contar apenas IDs únicos
  - `enrolledPlayers` (lista filtrada) também remove duplicatas por ID
  - Comentários explicativos adicionados

**Antes:**
```typescript
const totalEnrolledPlayers = tournament.grupos.flatMap(g => g.players).length;
// Resultado: 40 jogadores (24 únicos × múltiplas fases)
```

**Agora:**
```typescript
const allEnrolledPlayers = tournament.grupos.flatMap(g => g.players);
const uniqueEnrolledPlayerIds = new Set(allEnrolledPlayers.map(p => p.id));
const totalEnrolledPlayers = uniqueEnrolledPlayerIds.size;
// Resultado: 24 jogadores únicos ✅
```

---

### v0.14.2 - Melhoria: Reorganização do PDF por Fase ✅
**Data:** 10/01/2026

**Melhorado:**
- 📄 **Estrutura do PDF reorganizada:** Resultados dos jogos agora aparecem logo após as classificações de cada fase
  - **Antes:** Todas as classificações primeiro, depois todos os resultados
  - **Agora:** Para cada fase, mostra classificações e resultados juntos
  - **Estrutura:**
    - Fase 1: Apresentação dos grupos → Resultados dos jogos
    - Fase 2: Apresentação dos grupos → Resultados dos jogos
    - Fase Final: Apresentação dos grupos → Resultados dos jogos
  - **Resultado:** PDF mais organizado e fácil de navegar, com informações relacionadas agrupadas por fase

**Modificado:**
- 🔄 `services/pdfService.ts`:
  - Movida lógica de resultados dos jogos para dentro do loop de fases
  - Resultados aparecem imediatamente após as classificações de cada fase
  - Removida seção duplicada de resultados no final

---

### v0.14.1 - Melhoria: PDF com Resultados de Jogos ✅
**Data:** 10/01/2026

**Melhorado:**
- 📄 **Lista de participantes simplificada:** Removida informação de fases participadas
  - **Antes:** "Jogador (SEED) - Fases: 1, 2, 3"
  - **Agora:** "Jogador (SEED)"
  - **Resultado:** Lista mais limpa e focada

- 📄 **Resultados de todos os jogos adicionados:** PDF agora inclui resultados completos de todos os jogos
  - **Conteúdo:**
    - Seção "RESULTADOS DOS JOGOS" para cada fase
    - Jogos organizados por grupo e rodada
    - Formato: "R1: Jogador1 e Jogador2 × Jogador3 e Jogador4 (6-2, 6-4)"
    - Partidas de desempate marcadas com [DESEMPATE]
    - Partidas de simples formatadas corretamente
  - **Resultado:** PDF completo com histórico de todos os jogos do torneio

**Modificado:**
- 🔄 `services/pdfService.ts`:
  - Removida informação de fases da lista de participantes
  - Adicionada seção completa de resultados de jogos por fase
  - Funções auxiliares para formatar jogadores e placares
  - Suporte a partidas de simples (desempate) e duplas
  - Quebra de linha automática para textos longos

**Estrutura do PDF (Atualizada):**
```
1. Cabeçalho
2. Informações Gerais
3. Lista de Participantes (simplificada)
4. Classificações por Fase
5. Resultados dos Jogos por Fase (NOVO)
6. Campeão
7. Rodapé
```

---

### v0.14.0 - Feature: Geração de PDF do Torneio ✅
**Data:** 10/01/2026

**Adicionado:**
- 📄 **Geração de PDF completo do torneio:** Após finalizar o torneio, é possível gerar um PDF com todas as informações
  - **Conteúdo do PDF:**
    - Cabeçalho com nome do torneio e categoria
    - Data de geração
    - Configurações do jogo (formato, sets, games, tie-break)
    - Informações gerais (total de grupos, partidas, jogadores, fases)
    - Lista completa de participantes (alfabética, com seeds e fases participadas)
    - Resultados de todas as fases (classificações finais de cada grupo)
    - Campeão destacado (se fase 3 foi concluída)
    - Numeração de páginas
  - **Localização:** Botão "Gerar PDF do Torneio" no banner do campeão (após concluir o torneio)
  - **Formato:** PDF A4 com formatação profissional

**Modificado:**
- 🔄 `services/pdfService.ts` (NOVO):
  - Serviço completo para geração de PDFs usando jsPDF
  - Formatação profissional com cores e layout organizado
  - Suporte a múltiplas páginas automático
  - Destaque especial para o campeão
- 🔄 `app/page.tsx`:
  - Botão "Gerar PDF do Torneio" adicionado ao banner do campeão
  - Import dinâmico do serviço de PDF
- 🔄 `package.json`:
  - Adicionada dependência `jspdf`

**Estrutura do PDF:**
```
1. Cabeçalho (laranja)
   - Nome do Torneio
   - Categoria

2. Informações Gerais
   - Data de geração
   - Configurações do jogo
   - Estatísticas (grupos, partidas, jogadores, fases)

3. Lista de Participantes
   - Ordenada alfabeticamente
   - Indica seeds e fases participadas
   - Layout em colunas

4. Resultados por Fase
   - Fase 1: Classificações de todos os grupos
   - Fase 2: Classificações de todos os grupos
   - Fase 3 (Final): Classificação do grupo final

5. Campeão (se aplicável)
   - Box destacado em laranja
   - Nome do campeão
   - Estatísticas do campeão

6. Rodapé
   - Numeração de páginas
```

**Exemplo de uso:**
1. Finalizar todas as fases do torneio
2. Clicar em "Concluir Torneio" na fase final
3. Clicar em "Gerar PDF do Torneio" no banner do campeão
4. PDF é gerado e baixado automaticamente

---

### v0.13.1 - Correção: Campeão e Card na Fase Final ✅
**Data:** 10/01/2026

**Corrigido:**
- 🐛 **Campeão aparecendo automaticamente após resolver desempate:** O campeão estava aparecendo assim que não havia desempates pendentes, sem precisar clicar em "Concluir Torneio"
  - **Problema:** O banner do campeão aparecia automaticamente quando não havia desempates pendentes
  - **Solução:** Adicionado campo `completedCategories` no Tournament para marcar categorias concluídas. O campeão só aparece quando a categoria está marcada como concluída (após clicar em "Concluir Torneio")
  - **Resultado:** O campeão só aparece após clicar em "Concluir Torneio" na fase final

- 🐛 **Card verde mostrando informações sem sentido na fase final:** O card mostrava "Total: 0 jogadores para o GRUPO FINAL" e lista vazia de classificados
  - **Problema:** O card mostrava preview de classificação para a próxima fase, mas na fase final não há próxima fase
  - **Solução:** 
    - Card não mostra preview de classificação na fase final
    - Mostra mensagem: "Todos os jogos foram finalizados. Clique em 'Concluir Torneio' para finalizar."
    - Card é escondido após clicar em "Concluir Torneio"
  - **Resultado:** Card mostra informações relevantes apenas na fase final

**Modificado:**
- 🔄 `types/index.ts`:
  - Adicionado campo `completedCategories?: string[]` no Tournament para marcar categorias concluídas
- 🔄 `hooks/useTournament.ts`:
  - `advanceToNextPhase` agora marca a categoria como concluída quando `currentPhase === 3`
  - Quando fase 3 é concluída, adiciona a categoria em `completedCategories`
- 🔄 `services/backupService.ts`:
  - `createEmptyTournament` agora inclui `completedCategories: []`
- 🔄 `components/PhaseAdvanceCard.tsx`:
  - Não mostra preview de classificação na fase final (`isFinal`)
  - Mostra mensagem específica para fase final
  - Botão "Ver quem classificou" não aparece na fase final
- 🔄 `app/page.tsx`:
  - Card não aparece quando a categoria foi concluída (fase 3)
  - Campeão só aparece quando `completedCategories` inclui a categoria

**Comportamento:**
```
Fase Final (antes de concluir):
  🏆 Torneio Pronto para Conclusão!
  Todos os jogos foram finalizados. Clique em "Concluir Torneio" para finalizar.
  [🏆 Concluir Torneio] ← Ativo

Fase Final (após concluir):
  (Card verde desaparece)
  🏆 CAMPEÃO DA CATEGORIA NORMAL
  [Nome do Campeão]
```

---

### v0.13.0 - Botão "Concluir Fase" com Validação de Desempates ✅
**Data:** 10/01/2026

**Adicionado:**
- ✅ **Botão "Concluir Fase" com validação:** Agora é necessário clicar em "Concluir Fase" para finalizar uma fase, e o botão só fica ativo quando todos os desempates foram resolvidos
  - **Problema:** O card de "Fase Concluída" aparecia mesmo quando havia desempates pendentes
  - **Solução:** 
    - Criada função `hasPendingTies()` para verificar se há desempates pendentes em uma fase
    - Card agora mostra "Fase Pronta para Conclusão" ou "Fase com Desempates Pendentes"
    - Botão "Concluir Fase" só fica ativo quando não há desempates pendentes
    - Na Fase 3, o botão é "Concluir Torneio"
  - **Resultado:** Usuário precisa resolver todos os desempates antes de poder concluir a fase

**Modificado:**
- 🔄 `services/phaseGenerator.ts`:
  - Nova função `hasPendingTies(groups, phase, calculateRanking)` que verifica se há desempates pendentes
- 🔄 `hooks/useTournament.ts`:
  - Exportada função `hasPendingTies` que usa `getGroupRanking` para calcular rankings
- 🔄 `components/PhaseAdvanceCard.tsx`:
  - Adicionada prop `hasPendingTies` para controlar estado do botão
  - Card muda de cor (verde/amarelo) baseado em `hasPendingTies`
  - Botão desabilitado quando há desempates pendentes
  - Texto do botão: "Concluir Fase X" ou "Concluir Torneio" (Fase 3)
  - Mensagem de aviso quando há desempates pendentes
- 🔄 `app/page.tsx`:
  - Card agora aparece para todas as fases (incluindo Fase 3)
  - Verifica `hasPendingTies` antes de mostrar o card
  - Passa `hasPendingTies` para o `PhaseAdvanceCard`

**Comportamento:**
```
Fase com desempates pendentes:
  ⚠️ Fase X com Desempates Pendentes
  ⚠️ Resolva todos os desempates antes de concluir a fase
  [⚠️ Resolva os desempates para concluir] ← Desabilitado

Fase sem desempates pendentes:
  ✓ Fase X Pronta para Conclusão!
  Total: X jogadores para a Fase Y
  [✓ Concluir Fase X] ← Ativo

Fase 3 sem desempates pendentes:
  🏆 Torneio Pronto para Conclusão!
  Total: X jogadores para o GRUPO FINAL
  [🏆 Concluir Torneio] ← Ativo
```

---

### v0.12.3 - Correção: Limpar Tudo na Lista de Espera ✅
**Data:** 10/01/2026

**Corrigido:**
- 🐛 **Botão "Limpar Tudo" removia apenas o primeiro participante:** A função estava chamando `removePlayer` múltiplas vezes em um loop, causando problemas de estado
  - **Problema:** `handleClearWaitingList` chamava `removePlayer` para cada jogador em um `forEach`, mas cada chamada atualizava o estado, causando inconsistências
  - **Solução:** Criada função `clearWaitingList` no hook que remove todos os jogadores da categoria da lista de espera em uma única operação de estado
  - **Resultado:** Agora remove todos os jogadores da lista de espera da categoria corretamente

**Modificado:**
- 🔄 `hooks/useTournament.ts`:
  - Nova função `clearWaitingList(categoria: string)` que remove todos os jogadores da categoria da lista de espera em uma única atualização de estado
- 🔄 `app/config/page.tsx`:
  - `handleClearWaitingList()` agora usa `clearWaitingList()` ao invés de chamar `removePlayer` múltiplas vezes
  - Importação de `clearWaitingList` do hook

**Comportamento:**
```
Antes: Limpar Tudo → removePlayer() múltiplas vezes → Remove apenas o primeiro ❌
Agora: Limpar Tudo → clearWaitingList() → Remove todos de uma vez ✅
```

---

### v0.12.2 - Correção: Limpar Categoria Remove Todos os Grupos ✅
**Data:** 10/01/2026

**Corrigido:**
- 🐛 **Limpar Categoria não estava removendo todos os grupos:** A função estava chamando `resetAndRedrawGroups` múltiplas vezes, causando problemas de estado
  - **Problema:** `handleClearTournamentPlayers` chamava `resetAndRedrawGroups` para cada fase individualmente, o que não garantia remoção completa
  - **Solução:** Criada função `clearCategory` no hook que remove todos os grupos da categoria e retorna todos os jogadores para a lista de espera em uma única operação de estado
  - **Resultado:** Agora limpa completamente o torneio da categoria, removendo todos os grupos de todas as fases e retornando todos os jogadores para a lista de espera

**Modificado:**
- 🔄 `hooks/useTournament.ts`:
  - Nova função `clearCategory(categoria: string)` que:
    - Coleta todos os jogadores de todos os grupos da categoria
    - Remove todos os grupos da categoria
    - Adiciona todos os jogadores de volta à lista de espera
    - Limpa campos relacionados a fases (tiebreakOrder, tiebreakMethod, eliminatedInPhase, qualificationType)
    - Tudo em uma única atualização de estado
- 🔄 `app/config/page.tsx`:
  - `handleClearTournamentPlayers()` agora usa `clearCategory()` ao invés de chamar `resetAndRedrawGroups` múltiplas vezes
  - Importação de `clearCategory` do hook

**Comportamento:**
```
Antes: Limpar Categoria → Chamava resetAndRedrawGroups para cada fase → Problemas de estado ❌
Agora: Limpar Categoria → clearCategory() → Remove tudo de uma vez ✅
```

---

### v0.12.1 - Reabilitação: Limpar Categoria Após Término do Torneio ✅
**Data:** 10/01/2026

**Modificado:**
- 🔓 **Reabilitado botão "Limpar Categoria" após término do torneio:** Agora é possível limpar a categoria mesmo com jogos finalizados, desde que o torneio esteja completo
  - **Problema:** Botão estava desabilitado sempre que havia jogos finalizados, mesmo após o término completo do torneio
  - **Solução:** Verificação se o torneio está completo (Fase 3 finalizada) antes de bloquear
  - **Lógica:**
    - Se não há jogos finalizados: permite limpar (como antes)
    - Se há jogos finalizados MAS o torneio está completo (Fase 3 finalizada): permite limpar
    - Se há jogos finalizados E o torneio NÃO está completo: bloqueia (como antes)
  - **Resultado:** Usuários podem limpar a categoria após finalizar o torneio para começar um novo

**Modificado:**
- 🔄 `app/config/page.tsx`:
  - `handleClearTournamentPlayers()` - verifica se torneio está completo antes de bloquear
  - Adicionada verificação `isPhaseComplete(categoria, 3)` para detectar torneio completo
  - Tooltip atualizado para indicar quando o torneio está completo
  - Variável `isTournamentComplete` para controle de estado

**Comportamento:**
```
Torneio em andamento (com jogos finalizados):
  [Limpar Categoria] ← Cinza, desabilitado 🔒

Torneio completo (Fase 3 finalizada):
  [Limpar Categoria] ← Vermelho, ativo ✅
```

---

### v0.12.0 - Correção: Badge de Desempate na Fase Final e Persistência ✅
**Data:** 10/01/2026

**Corrigido:**
- 🐛 **Badge de DESEMPATE não aparecia na fase final:** Badge só aparecia em fases anteriores (read-only), mas desempates podem ocorrer na fase final
  - **Problema:** Badge de DESEMPATE só aparecia quando `isReadOnly === true`, mas na fase final `isReadOnly === false`
  - **Solução:** Badge de DESEMPATE agora aparece sempre que houver `tiebreakOrder`, independente de `isReadOnly`
  - **Resultado:** Badge de DESEMPATE aparece corretamente na fase final após resolver desempate

- 🐛 **Dados de desempate sendo perdidos ao recarregar página:** Migração estava limpando dados de desempate da Fase 3
  - **Problema:** Migração v0.7.0 limpava `tiebreakOrder` e `tiebreakMethod` de todas as fases 2+, incluindo Fase 3
  - **Solução:** Migração ajustada para limpar apenas da Fase 2, preservando dados de desempate da Fase 3 (fase final)
  - **Resultado:** Dados de desempate da fase final são preservados ao recarregar página ou navegar entre páginas

**Modificado:**
- 🔄 `components/GroupCard.tsx`:
  - Badge de DESEMPATE agora aparece sempre que houver `tiebreakOrder`, não apenas em read-only
- 🔄 `hooks/useTournament.ts`:
  - Migração v0.7.0 ajustada para não limpar dados de desempate da Fase 3
  - Fase 3 (fase final) pode ter desempates e esses dados são preservados

**Nota:**
- Desempates podem ocorrer em qualquer fase, incluindo a fase final
- Dados de desempate (`tiebreakOrder`, `tiebreakMethod`) são preservados corretamente em todas as fases
- Badge de DESEMPATE aparece em todas as fases quando houver desempate resolvido

---

### v0.11.9 - Correção: Badges Incorretos na Fase 2 ✅
**Data:** 10/01/2026

**Corrigido:**
- 🐛 **Todos os jogadores marcados como CLASSIFICADO na Fase 2:** Todos os jogadores da Fase 2 estavam recebendo `qualificationType` quando apenas os classificados deveriam ter
  - **Problema:** Quando a Fase 2 era criada, todos os jogadores recebiam `qualificationType` da Fase 1
  - **Solução:** 
    - Removido `qualificationType` da criação de grupos na Fase 2 e Fase 3
    - `qualificationType` agora só é atribuído quando a fase avança (na função `advanceToNextPhase`)
    - Migração v0.11.8 que limpa `qualificationType` incorreto de jogadores na Fase 2 que não foram classificados
  - **Resultado:** Apenas jogadores realmente classificados têm badges na Fase 2

**Modificado:**
- 🔄 `services/phaseGenerator.ts`:
  - Removido `qualificationType` da criação de grupos na Fase 2 e Fase 3
  - `qualificationType` agora é `undefined` quando grupos são criados
- 🔄 `hooks/useTournament.ts`:
  - Nova migração v0.11.8 que limpa `qualificationType` incorreto da Fase 2
  - Migração verifica quais jogadores realmente foram classificados (estão na Fase 3) e mantém apenas esses

**Nota sobre Badges:**
- **CLASSIFICADO:** Apenas para jogadores com `qualificationType: 'direct'` (classificação direta)
- **REPESCAGEM:** Apenas para jogadores com `qualificationType: 'repechage'` (melhor 2º/3º lugar)
- Jogadores classificados via repescagem têm APENAS o badge REPESCAGEM, não CLASSIFICADO (isso está correto)

---

### v0.11.8 - Correção: Badges na Fase Atual e Nome do Grupo Final ✅
**Data:** 10/01/2026

**Corrigido:**
- 🐛 **Badges aparecendo na fase atual:** Badges de CLASSIFICADO/REPESCAGEM/ELIMINADO apareciam na fase atual quando não deveriam
  - **Problema:** `qualificationType` estava sendo mantido em jogadores da fase atual
  - **Solução:** 
    - Migração automática v0.11.7 que limpa `qualificationType` de jogadores na fase atual
    - `qualificationType` só deve existir em jogadores de fases anteriores (read-only)
  - **Resultado:** Badges só aparecem em fases anteriores (read-only), não na fase atual

- 🏆 **Nome do Grupo Final:** Corrigido para usar "A" ao invés de "Final"
  - **Problema:** Grupos antigos ainda tinham `nome: 'Final'` ou `nome: 'Grupo Final'`
  - **Solução:**
    - Migração automática que corrige grupos com nome "Final" ou "Grupo Final"
    - Atribui letra "A" para o grupo final
    - Componente `GroupCard` trata grupos antigos com nome "Final"
  - **Resultado:** Grupo final agora mostra "Grupo A - Fase Final" consistentemente

**Modificado:**
- 🔄 `hooks/useTournament.ts`:
  - Nova migração v0.11.7 que limpa `qualificationType` da fase atual
  - Migração expandida para corrigir grupos com nome "Final" ou "Grupo Final"
- 🔄 `components/GroupCard.tsx`:
  - Tratamento para grupos antigos com nome "Final" (converte para "A")

**Lógica de Badges (Atualizada):**
```
Fase Anterior (read-only, selectedPhase < maxPhase):
  - SEED: sempre visível
  - CLASSIFICADO: se qualificationType === 'direct'
  - REPESCAGEM: se qualificationType === 'repechage'
  - ELIMINADO: se status === 'eliminated' E !qualificationType
  - DESEMPATE: se tiebreakOrder existe

Fase Atual (editável, selectedPhase === maxPhase):
  - SEED: sempre visível
  - Nenhum outro badge (qualificationType é limpo automaticamente)
```

---

### v0.11.7 - Correção: Badges e Título da Fase Final ✅
**Data:** 10/01/2026

**Corrigido:**
- 🐛 **Badges conflitantes na Fase 2:** Jogadores apareciam com CLASSIFICADO e ELIMINADO simultaneamente
  - **Problema:** Jogadores classificados mantinham `status: 'eliminated'` da fase anterior
  - **Solução:** 
    - Garantir que todos os jogadores em novas fases tenham `status: 'enrolled'`
    - Badge ELIMINADO só aparece se não houver `qualificationType` (não foi classificado)
  - **Resultado:** Badges agora são mutuamente exclusivos (CLASSIFICADO ou ELIMINADO, nunca ambos)

- 🏆 **Título do Grupo Final:** Corrigido para manter nomenclatura consistente
  - **Problema:** Aparecia "Grupo Final - Fase 3"
  - **Solução:**
    - Grupo final agora usa letra "A" como os outros grupos
    - Título exibe "Grupo A - Fase Final" ao invés de "Grupo Final - Fase 3"
  - **Resultado:** Nomenclatura consistente e clara

**Modificado:**
- 🔄 `services/phaseGenerator.ts`:
  - Grupo final agora usa `nome: 'A'` ao invés de `'Final'`
  - Garantido que todos os jogadores em novas fases têm `status: 'enrolled'`
  - Limpeza adequada de status ao criar grupos das fases 2 e 3
- 🔄 `components/GroupCard.tsx`:
  - Título da Fase 3 agora mostra "Fase Final" ao invés de "Fase 3"
  - Badge ELIMINADO só aparece se `!qualificationType` (não foi classificado)

**Lógica de Badges:**
```
Fase Anterior (read-only):
  - SEED: sempre visível
  - CLASSIFICADO: se qualificationType === 'direct'
  - REPESCAGEM: se qualificationType === 'repechage'
  - ELIMINADO: se status === 'eliminated' E !qualificationType

Fase Atual (editável):
  - SEED: sempre visível
  - Sem outros badges
```

---

### v0.11.6 - Correção: Duplicação "Grupo" no Título ✅
**Data:** 10/01/2026

**Corrigido:**
- 🐛 **Bug no título dos cards:** Títulos apareciam como "Grupo Grupo A - Fase 2"
  - **Problema:** `phaseGenerator.ts` estava salvando `nome: "Grupo A"` ao invés de apenas `"A"`
  - **Causa:** Inconsistência entre como grupos são nomeados (alguns lugares usam apenas letra, outros usam "Grupo " + letra)
  - **Solução:** 
    - Corrigido `phaseGenerator.ts` para salvar apenas a letra (A, B, C...)
    - Fase 3 agora salva apenas "Final" ao invés de "Grupo Final"
    - Adicionada verificação no `GroupCard.tsx` para não duplicar "Grupo " se o nome já começar com isso
  - **Resultado:** Títulos agora aparecem corretamente como "Grupo A - Fase 2"

**Modificado:**
- 🔄 `services/phaseGenerator.ts`:
  - Linha 300: `nome: groupName` (removido "Grupo " antes)
  - Linha 252: `nome: 'Final'` (removido "Grupo " antes)
- 🔄 `components/GroupCard.tsx`:
  - Verificação para não duplicar "Grupo " se o nome já contiver

---

### v0.11.3 - Correção Definitiva: Letras dos Grupos ✅
**Data:** 10/01/2026

**Corrigido:**
- 🔤 **Migração automática para grupos sem nome:** Sistema agora corrige grupos existentes
  - **Problema:** Grupos criados antes da correção não tinham o campo `nome` definido
  - **Solução:** 
    - Migração automática v0.11.2 que detecta e corrige grupos sem nome
    - Atribui letras (A, B, C...) baseado na ordem na categoria e fase
    - Usa função `getGroupName()` para garantir consistência
  - **Resultado:** Todos os grupos agora têm letras identificadoras

**Modificado:**
- 🔄 `hooks/useTournament.ts`:
  - Nova migração v0.11.2 que corrige grupos sem nome
  - `redrawGroupsInPlace()` agora usa `getGroupName()` ao invés de `String.fromCharCode()`
  - Importação de `getGroupName` do módulo de tipos
- 🔄 `components/GroupCard.tsx`:
  - Fallback simples para grupos sem nome (mostra "?" temporariamente)

**Como funciona a migração:**
1. Sistema detecta grupos sem `nome` ou com `nome` vazio
2. Calcula índice baseado na ordem na mesma categoria e fase
3. Atribui letra usando `getGroupName(index)`
4. Salva automaticamente no localStorage

**Exemplo:**
```
Antes: Grupo - Fase 1 ❌
Depois: Grupo A - Fase 1 ✅
        Grupo B - Fase 1 ✅
```

---

### v0.11.2 - Correção: Letras dos Grupos no Resorteio ✅
**Data:** 10/01/2026

**Corrigido:**
- 🐛 **Bug nas letras dos grupos:** Grupos resorteados perdiam as letras identificadoras (A, B, C...)
  - **Problema:** Grupos apareciam como "Grupo - Fase 1" sem a letra
  - **Causa Raiz 1:** Propriedade `name` usada ao invés de `nome` (interface `Group` usa `nome`)
  - **Causa Raiz 2:** IDs dos grupos usando `Date.now() + i` podiam gerar duplicatas
  - **Solução:** 
    - Corrigido para usar `nome` (não `name`)
    - Mudado para UUID garantindo IDs únicos
    - Atribuir apenas a letra (A, B, C...) pois componente adiciona "Grupo" automaticamente
  - **Resultado:** Grupos agora aparecem corretamente como "Grupo A - Fase 1", "Grupo B - Fase 1", etc.

**Modificado:**
- 🔄 `hooks/useTournament.ts`:
  - `redrawGroupsInPlace()` agora usa `nome` ao invés de `name`
  - UUID para IDs únicos ao invés de `Date.now()`
  - Simplificado para apenas a letra (componente adiciona "Grupo")

**Exemplo:**
```typescript
// ANTES (❌):
name: `Grupo ${String.fromCharCode(65 + i)}`  // Propriedade errada
id: (Date.now() + i).toString()                // Pode duplicar

// DEPOIS (✅):
nome: String.fromCharCode(65 + i)              // Apenas letra
id: uuidv4()                                   // UUID único
```

---

### v0.11.1 - Correção: Erro ao Resortear Grupos ✅
**Data:** 10/01/2026

**Corrigido:**
- 🐛 **Bug crítico no resorteio:** Erro "Can't find variable: generateRoundRobinMatches"
  - **Problema:** Função `generateRoundRobinMatches` chamada incorretamente
  - **Causa:** A função precisa receber um objeto `Group` completo, não `players` e `groupId` separados
  - **Solução:** 
    - Criar objeto `Group` temporário antes de gerar partidas
    - Usar `generatePairsFor4Players()` que já estava importado
  - **Resultado:** Resorteio agora funciona corretamente

**Modificado:**
- 🔄 `hooks/useTournament.ts`:
  - Ajustada chamada de geração de partidas em `redrawGroupsInPlace()`
  - Criação de objeto `Group` temporário
  - Uso correto de `generatePairsFor4Players()`

---

### v0.11.0 - Resorteio Inteligente: Mantém Jogadores no Torneio ✅
**Data:** 10/01/2026

**Modificado:**
- 🎯 **Resorteio sem perda de vagas:** Jogadores que já estão no torneio permanecem nele
  - **Problema anterior:** Ao resortear, todos voltavam para lista de espera → risco de ficarem de fora no novo sorteio
  - **Solução:** Nova função `redrawGroupsInPlace()` que resorteia apenas os jogadores dos grupos existentes
  - **Benefício:** Garante que quem estava jogando continua jogando, apenas em grupos diferentes

**Como funciona:**
1. Sistema coleta jogadores dos grupos da Fase 1
2. Remove os grupos antigos
3. Distribui seeds uniformemente nos novos grupos
4. Cria novos grupos com os **mesmos jogadores** (resorteados)
5. Gera novos jogos (Round Robin)

**Antes:**
```
Fase 1: 16 jogadores em 4 grupos
↓ Resortear
Lista de Espera: 16 jogadores
↓ Formar novos grupos (se houver 20 na espera)
Fase 1: 16 jogadores (podem ser outros!) + 4 na espera ❌
```

**Depois:**
```
Fase 1: 16 jogadores em 4 grupos
↓ Resortear
Fase 1: Os mesmos 16 jogadores em 4 novos grupos ✅
```

**Modificado:**
- 🔄 `hooks/useTournament.ts`:
  - Nova função `redrawGroupsInPlace(categoria, fase)` 
  - Mantém `resetAndRedrawGroups()` para outros casos (limpar categoria)
  - Lógica de distribuição de seeds preservada
  - Geração de partidas Round Robin
- 🔄 `app/config/page.tsx`:
  - `handleRedrawGroups()` agora usa `redrawGroupsInPlace()`
  - Mensagem de confirmação atualizada
  - Aviso claro: "Os mesmos jogadores permanecerão no torneio"

**Benefícios:**
- ✅ **Justiça:** Ninguém perde a vaga por azar do sorteio
- ✅ **Previsibilidade:** Mesmo número de grupos e jogadores
- ✅ **Seeds preservados:** Distribuição uniforme mantida
- ✅ **Segurança:** Confirmação antes de executar

---

### v0.10.3 - UX: Remoção de Pop-ups ao Formar Grupos ✅
**Data:** 10/01/2026

**Modificado:**
- 🚀 **Formação de grupos mais ágil:** Removidos pop-ups de confirmação
  - **Antes:** Ao clicar "Formar Grupos", aparecia pop-up com preview e "Continuar?"
  - **Depois:** Clicou, formou! Ação direta e rápida
  - **Mantido:** Alertas de erro (jogadores insuficientes, validação de 3 fases)
  - **Benefício:** Fluxo mais rápido e menos cliques

**Cenários afetados:**
1. **Primeira formação de grupos:**
   - ❌ Removido: Pop-up com preview das 3 fases
   - ✅ Mantido: Alerta se não for possível formar torneio de 3 fases

2. **Adicionar grupos incrementalmente:**
   - ❌ Removido: Pop-up "Adicionar X novo(s) grupo(s)..."
   - ✅ Mantido: Alerta se menos de 4 jogadores
   - ✅ Mantido: Alerta se já há placares registrados

**Modificado:**
- 🔄 `app/config/page.tsx`:
  - `handleFormGroups()` - executa `formGroups()` diretamente
  - Removidas variáveis `confirmMessage` e `pathPreview`
  - Mantida validação e alertas de erro

**Resultado:**
```
Clique no botão → Grupos formados! ⚡
(Antes: Clique → Pop-up → Confirmar → Grupos formados)
```

---

### v0.10.2 - Proteção: Botão Limpar Categoria ✅
**Data:** 10/01/2026

**Modificado:**
- 🔒 **Proteção do botão "Limpar Categoria":** Botão desabilitado quando há jogos registrados
  - **Verificação:** Sistema verifica se há jogos com placares em qualquer grupo da categoria
  - **Se há placares:** 
    - Botão fica desabilitado (cinza)
    - Cursor `not-allowed`
    - Tooltip: "Não é possível limpar: existem jogos com placares registrados"
    - Ao clicar: Alerta explicativo com alternativas
  - **Se não há placares:** 
    - Botão ativo (vermelho)
    - Permite limpeza normal
  - **Benefício:** Previne perda acidental de dados de torneios em andamento

**Alerta quando bloqueado:**
```
⚠️ Não é possível limpar a categoria!

Existem jogos com placares já registrados.

Para limpar esta categoria:
1. Use "Resortear Grupos" para resetar apenas a Fase 1, OU
2. Finalize o torneio antes de limpar
```

**Modificado:**
- 🔄 `app/config/page.tsx`:
  - `handleClearTournamentPlayers()` - bloqueia se houver jogos finalizados
  - Variável `hasFinishedMatches` para verificação
  - Variável `canClearCategory` para controle do botão
  - Classes CSS condicionais no botão
  - Tooltip dinâmico baseado no estado

**Estados do botão:**
```
Sem placares: [Limpar Categoria] ← Vermelho, ativo ✅
Com placares: [Limpar Categoria] ← Cinza, desabilitado 🔒
```

---

### v0.10.1 - Gerenciamento de Jogadores: Remoção em Massa ✅
**Data:** 10/01/2026

**Adicionado:**
- 🗑️ **Botões de remoção em massa:** Controle completo sobre listas de jogadores
  - **"Limpar Tudo"** na aba Lista de Espera:
    - Remove todos os jogadores da lista de espera de uma categoria
    - Confirmação de segurança antes de executar
    - Apenas visível quando há jogadores
  - **"Limpar Categoria"** na aba No Torneio:
    - Remove todos os grupos e jogadores da categoria
    - Retorna jogadores para a lista de espera
    - Aviso especial se há jogos com placares registrados
    - Limpa todas as fases (1, 2 e Final)

**Funcionalidades de Remoção:**

1. **Individual (Lista de Espera):**
   - Botão "Remover" ao lado de cada jogador
   - Já existia, mantido

2. **Em Massa (Lista de Espera):**
   - Novo botão vermelho "Limpar Tudo"
   - Remove todos os jogadores da categoria
   - Confirmação: "⚠️ ATENÇÃO: Remover TODOS os jogadores..."

3. **Em Massa (Torneio):**
   - Novo botão vermelho "Limpar Categoria"
   - Remove todos os grupos de todas as fases
   - Jogadores retornam para lista de espera
   - Confirmação com alerta se há placares

**Interface:**
```
Lista de Espera:
┌────────────────────────────────────────┐
│ Normal     20 jogadores [Formar Grupos] [Limpar Tudo] │
│ • Thiago SEED               [Remover]   │
│ • Dayanna SEED              [Remover]   │
└────────────────────────────────────────┘

No Torneio:
┌────────────────────────────────────────┐
│ Normal     20 jogadores [Resortear Fase 1] [Limpar Categoria] │
│ • Thiago SEED                           │
│ • Dayanna SEED                          │
└────────────────────────────────────────┘
```

**Modificado:**
- 🔄 `app/config/page.tsx`:
  - `handleClearWaitingList(categoria)` - limpa lista de espera
  - `handleClearTournamentPlayers(categoria)` - limpa todos os grupos da categoria
  - Confirmações de segurança com contadores
  - Botões vermelhos para indicar ação destrutiva

**Benefícios:**
- ✅ **Limpeza rápida:** Reinicie categorias com um clique
- ✅ **Segurança:** Confirmações claras antes de remover
- ✅ **Flexibilidade:** Limpa espera ou torneio separadamente
- ✅ **Feedback visual:** Botões vermelhos indicam ação destrutiva

---

### v0.10.0 - Modais Avançados de Export/Import ✅
**Data:** 10/01/2026

**Adicionado:**
- 🎨 **Modais interativos para Export/Import:** Interface completa com opções avançadas
  - **Modal de Exportação:**
    - Dropdown para selecionar categoria específica ou "Todas as Categorias"
    - Preview de quantos jogadores serão exportados
    - Exporta jogadores no torneio + lista de espera
  - **Modal de Importação:**
    - Dropdown para selecionar categoria de destino
    - Checkbox "Sobrescrever jogadores existentes"
    - Aviso visual quando sobrescrever está ativo
    - Validação e confirmação antes de importar

**Funcionalidades da Importação:**
- ✅ **Modo Normal:** Adiciona jogadores à lista de espera (mantém existentes)
- ✅ **Modo Sobrescrever:** 
  - Remove todos os jogadores da categoria (torneio + espera)
  - Resorteia Fase 1 se houver grupos
  - Importa novos jogadores limpos
- ✅ **Feedback:** Mensagem de sucesso com quantidade importada

**Interface:**
```
Modal de Exportação:
┌─────────────────────────────────┐
│ 📥 Exportar Jogadores          │
│                                 │
│ Selecionar Categoria            │
│ [Todas as Categorias ▼]        │
│                                 │
│ ℹ️ Serão exportados jogadores  │
│    no torneio + lista de espera│
│                                 │
│ [Cancelar] [Exportar]           │
└─────────────────────────────────┘

Modal de Importação:
┌─────────────────────────────────┐
│ 📤 Importar Jogadores          │
│                                 │
│ Categoria de Destino            │
│ [Normal ▼]                      │
│                                 │
│ ☐ Sobrescrever jogadores       │
│   existentes                    │
│                                 │
│ ⚠️ Atenção: Todos os jogadores │
│    serão removidos...           │
│                                 │
│ [Cancelar] [Importar]           │
└─────────────────────────────────┘
```

**Modificado:**
- 🔄 `app/config/page.tsx`:
  - Estados para controle dos modais
  - `handleExportPlayers()` - exporta categoria específica ou todas
  - `handleImportPlayers()` - importa com opção de sobrescrever
  - Modais com backdrop escuro e design moderno
  - Validações e feedback aprimorados

**Benefícios:**
- ✅ **Flexibilidade total:** Exporta 1 categoria ou todas
- ✅ **Controle preciso:** Escolhe categoria de destino na importação
- ✅ **Sobrescrita segura:** Opção para limpar e recomeçar
- ✅ **UX profissional:** Modais claros e avisos visuais

---

### v0.9.0 - Melhoria: Export/Import de Jogadores por Categoria ✅
**Data:** 10/01/2026

**Modificado:**
- 🎯 **Export/Import contextual por categoria:** Funcionalidade movida e melhorada
  - **Localização:** Botões agora aparecem na seção "Participantes", ao lado do título
  - **Escopo:** Exporta/importa jogadores da **categoria selecionada** apenas
  - **Abrangência:** Inclui jogadores **no torneio + lista de espera** (não apenas espera)
  - **UX aprimorada:** Botões próximos à lista de participantes (mais intuitivo)
  - **Desabilitação inteligente:** Botão "Exportar" desabilitado se não há jogadores na categoria

**Antes:**
```
Seção: Backup & Restauração (parte inferior)
Exportava: Apenas lista de espera (todas categorias)
Problema: Desabilitado se jogadores já estavam no torneio
```

**Depois:**
```
Seção: Participantes (topo da seção)
Exporta: Torneio + Espera (categoria selecionada)
Sempre habilitado: Se há jogadores na categoria
```

**Formato do JSON atualizado:**
```json
{
  "exportDate": "2026-01-10T...",
  "categoria": "Normal",
  "totalPlayers": 22,
  "players": [
    { "nome": "Thiago", "categoria": "Normal", "isSeed": true },
    { "nome": "Dayanna", "categoria": "Normal", "isSeed": false }
  ]
}
```

**Modificado:**
- 🔄 `app/config/page.tsx`:
  - Novos botões Export/Import ao lado do título "Participantes"
  - `handleExportCategoryPlayers()` - exporta jogadores da categoria (torneio + espera)
  - `handleImportCategoryPlayers()` - importa para a categoria selecionada
  - Botões compactos com ícones (📥 Exportar, 📤 Importar)
- 🔄 `components/BackupPanel.tsx`:
  - Removida seção de export/import de jogadores
  - Mantido apenas backup completo do torneio
  - Interface simplificada

**Benefícios:**
- ✅ **Contexto claro:** Exporta apenas a categoria que você está vendo
- ✅ **Sempre funcional:** Pega jogadores do torneio + espera
- ✅ **UX melhorada:** Botões onde fazem sentido (junto aos participantes)
- ✅ **Mais útil:** Facilita gerenciar categorias individualmente

---

### v0.8.4 - Proteção: Botão Resortear ✅
**Data:** 10/01/2026

**Modificado:**
- 🔒 **Proteção do botão "Resortear Fase 1":** Botão agora é desabilitado quando o torneio já avançou
  - **Lógica:** Verifica se há grupos na Fase 2 ou superior para a categoria
  - **Se Fase 2+ existe:** Botão fica desabilitado (cinza) com cursor `not-allowed`
  - **Se apenas Fase 1:** Botão permanece ativo (amarelo) e funcional
  - **Tooltip dinâmico:** 
    - Ativo: "Resorteia a Fase 1 e retorna jogadores para a lista de espera"
    - Desabilitado: "Não é possível resortear: torneio já avançou para Fase 2 ou superior"
  - **Benefício:** Previne destruição acidental de torneios em andamento

**Modificado:**
- 🔄 `app/config/page.tsx`:
  - Variável `hasAdvancedPhases` verifica presença de Fase 2+
  - Variável `canRedraw` determina se botão deve ser habilitado
  - Classes CSS condicionais baseadas em `canRedraw`
  - Tooltip contextual baseado no estado do botão

**Exemplo:**
```
Torneio em Fase 1 apenas:
  → Botão amarelo, ativo ✅

Torneio avançou para Fase 2:
  → Botão cinza, desabilitado 🔒
```

---

### v0.8.3 - Simplificação: Botão Resortear ✅
**Data:** 10/01/2026

**Modificado:**
- 🎨 **Simplificação da UX de resorteio:** Removido dropdown desnecessário na lista de participantes
  - **Antes:** Dropdown para selecionar fase (1, 2 ou Final) + botão "Resortear Grupos"
  - **Depois:** Apenas botão "Resortear Fase 1" com tooltip explicativo
  - **Justificativa:** Resortear outras fases (2 ou Final) é raro e pode ser feito pelo dashboard. A página de configuração é focada em setup inicial (Fase 1)
  - **Benefício:** Interface mais limpa e intuitiva

**Modificado:**
- 🔄 `app/config/page.tsx`:
  - Removido estado `selectedPhaseForReset`
  - `handleRedrawGroups()` sempre resorteia Fase 1
  - Botão renomeado para "Resortear Fase 1" com tooltip
  - Interface mais limpa na seção de participantes

---

### v0.8.2 - Correção: Contadores de Participantes ✅
**Data:** 10/01/2026

**Corrigido:**
- 🐛 **Bug nos contadores das abas de participantes:** Contadores agora exibem totais corretos
  - **Problema:** Contadores "No Torneio" e "Lista de Espera" mostravam (0) mesmo com jogadores visíveis
  - **Causa:** Contadores eram filtrados por `selectedCategory` (mostravam apenas 1 categoria), mas as listas de jogadores mostravam TODAS as categorias
  - **Solução:** 
    - Criadas variáveis `totalEnrolledPlayers` e `totalWaitingPlayers` para contadores
    - Contadores agora somam jogadores de TODAS as categorias
    - Mantida variável `enrolledPlayers` e `waitingPlayers` (filtradas) para uso no formulário
  - **Benefício:** Números nas abas agora são consistentes com o que é exibido nas listas

**Modificado:**
- 🔄 `app/config/page.tsx`:
  - Separação de variáveis para contadores (totais) e para formulário (filtradas por categoria)
  - `useEffect` para garantir que `selectedCategory` seja atualizado quando categorias mudarem

---

### v0.8.1 - Correção: Adição Incremental de Grupos ✅
**Data:** 10/01/2026

**Corrigido:**
- 🐛 **Bug crítico na formação de grupos:** Sistema agora permite adicionar grupos incrementalmente à Fase 1
  - **Problema:** Ao tentar formar grupos adicionais com jogadores da lista de espera, o sistema validava apenas os jogadores restantes (ex: 4) e bloqueava com mensagem de "mínimo 8 jogadores"
  - **Causa:** Validação de 3 fases era aplicada sempre, ignorando grupos já existentes
  - **Solução:** 
    - Detecta se já existem grupos na Fase 1
    - Verifica se há jogos com placares registrados
    - Se SIM (há placares): BLOQUEIA formação de novos grupos
    - Se NÃO (sem placares): PERMITE adicionar grupos incrementalmente (mínimo 4 jogadores por grupo)
    - Validação de 3 fases só é aplicada na primeira formação de grupos

**Exemplo de funcionamento:**
```
Situação: 20 jogadores inscritos
1. Formou 4 grupos (16 jogadores) - 4 ficam em lista de espera
2. Adiciona mais 2 jogadores - total 6 na lista de espera
3. Clica "Formar Grupos":
   - ✅ Sistema permite adicionar 1 novo grupo (4 jogadores)
   - 📋 2 jogadores ficam na lista de espera
   - ⚠️ Só bloqueia se houver placares registrados
```

**Modificado:**
- 🔄 `app/config/page.tsx`:
  - `handleFormGroups()` agora tem lógica condicional:
    - Verifica existência de grupos na Fase 1
    - Verifica presença de placares registrados
    - Aplica validação apropriada ao contexto
  - Mensagens mais claras e específicas para cada situação

---

### v0.8.0 - Export/Import de Lista de Jogadores ✅
**Data:** 10/01/2026

**Adicionado:**
- ✅ **Exportação de lista de jogadores** (`BackupPanel.tsx`)
  - Botão "Exportar Jogadores" para baixar JSON com lista de jogadores
  - Formato simplificado: nome, categoria e seed
  - Facilita reutilização de listas entre torneios
- ✅ **Importação de lista de jogadores**
  - Botão "Importar Jogadores" para carregar JSON de jogadores
  - Jogadores importados são adicionados à lista de espera
  - Validação de formato do arquivo
  - Confirmação antes de importar
- ✅ **Nova seção no BackupPanel:**
  - Design com gradiente roxo/índigo para destacar a funcionalidade
  - Separada visualmente do backup completo do torneio
  - Dica informativa sobre o uso

**Modificado:**
- 🔄 `BackupPanel` component:
  - Nova prop `onImportPlayers` para callback de importação
  - Funções `handleExportPlayers` e `handleImportPlayers`
  - Novo input file independente para importação de jogadores
  - Layout reorganizado com seções claras
- 🔄 Config Page (`app/config/page.tsx`):
  - Nova função `handleImportPlayers` integrada
  - Passa callback para `BackupPanel`

**Benefícios:**
- 🔄 Facilita recomeçar torneios mantendo os mesmos jogadores
- 📤 Permite compartilhar listas entre diferentes dispositivos
- ⚡ Agiliza configuração de torneios recorrentes
- 🎯 Formato leve e focado (apenas jogadores, sem dados de partidas)

**Formato do JSON:**
```json
{
  "exportDate": "2026-01-10T...",
  "totalPlayers": 20,
  "players": [
    { "nome": "Thiago", "categoria": "Normal", "isSeed": true },
    { "nome": "Dayanna", "categoria": "Normal", "isSeed": false }
  ]
}
```

---

### v0.6.3 - Estatísticas por Categoria ✅
**Data:** 10/01/2026

**Corrigido:**
- 📊 Estatísticas do dashboard (Grupos Ativos, Partidas Geradas, Jogos Concluídos) agora refletem apenas a categoria selecionada
- 🎯 Mudança de categoria atualiza as estatísticas em tempo real

**Problema Identificado:**
As estatísticas no rodapé do dashboard mostravam sempre os totais de **todas as categorias**, mesmo quando o usuário estava visualizando apenas uma categoria específica. Isso causava confusão, pois mostrava números que não correspondiam aos grupos visíveis na tela.

**Exemplo do Bug:**
```
Categoria: Iniciante (0 grupos)
Grupos visíveis: (nenhum)

Estatísticas exibidas:
- 5 Grupos Ativos      ← De TODAS as categorias ❌
- 15 Partidas Geradas  ← De TODAS as categorias ❌
- 6 Jogos Concluídos   ← De TODAS as categorias ❌
```

**Solução Implementada:**
Substituído `tournament.grupos` por `groupsInCategory` no cálculo das estatísticas. Agora os cards mostram apenas os dados da categoria atualmente selecionada.

**Resultado Esperado:**
```
Categoria: Iniciante (0 grupos)
Grupos visíveis: (nenhum)

Estatísticas exibidas:
- 0 Grupos Ativos      ← Apenas Iniciante ✅
- 0 Partidas Geradas   ← Apenas Iniciante ✅
- 0 Jogos Concluídos   ← Apenas Iniciante ✅

Categoria: Normal (5 grupos)
Estatísticas exibidas:
- 5 Grupos Ativos      ← Apenas Normal ✅
- 15 Partidas Geradas  ← Apenas Normal ✅
- 6 Jogos Concluídos   ← Apenas Normal ✅
```

**Tipo:** Patch (correção de bug nas estatísticas)

### v0.6.2 - Correção de Detecção de Empates ✅
**Data:** 10/01/2026

**Corrigido:**
- 🐛 Empates não são mais detectados em grupos sem jogos finalizados
- 📝 Mensagem alterada de "1 empate detectado" para "Empate detectado"
- ✨ Mensagem plural mantida para múltiplos empates: "2 empates detectados", "3 empates detectados", etc.

**Problema Identificado:**
1. Em grupos recém-criados (sem jogos finalizados), o sistema detectava "empate" porque todos os jogadores tinham 0 vitórias, 0 derrotas, 0 saldo. Isso causava confusão, pois não faz sentido resolver empate antes de qualquer jogo.
2. A mensagem "1 empate detectado" era redundante e menos elegante que simplesmente "Empate detectado".

**Solução Implementada:**
1. **`rankingService.ts`**: Adicionada verificação `if (ranking[i].jogos === 0) continue;` na função `detectTies`
2. Empates só são detectados quando há pelo menos 1 jogo finalizado no grupo
3. **`GroupCard.tsx`**: Mensagem simplificada:
   - 1 empate: "⚠️ Empate detectado"
   - 2+ empates: "⚠️ 2 empates detectados"

**Exemplo:**
```
Antes (v0.6.1):
Grupo recém-criado (0 jogos):
⚠️ 1 empate detectado  ← Confuso!

Agora (v0.6.2):
Grupo recém-criado (0 jogos):
(Nenhum alerta)  ← Correto!

Após jogos finalizados com empate:
⚠️ Empate detectado  ← Mais limpo!
```

**Tipo:** Patch (correção de bug + melhoria de mensagem)

### v0.6.1 - Indicador de Partida de Desempate Gerada (UX) ✅
**Data:** 10/01/2026

**Melhorado:**
- 🎯 Removido popup (alert) ao gerar partida de desempate
- ✨ Adicionado card visual elegante indicando "Partida de Desempate Gerada!"
- 🔘 Botão "▶️ Ir para a Partida" para navegar manualmente para a aba "Jogos"
- 📍 Card verde com borda destacada mostra rodada e jogadores da partida gerada

**Experiência do Usuário:**

**Antes (v0.6.0):**
1. Clicava em "⚔️ Gerar Partida de Simples"
2. ⚠️ Popup aparecia (intrusivo)
3. Aba mudava automaticamente para "Jogos" (sem controle do usuário)

**Agora (v0.6.1):**
1. Clica em "⚔️ Gerar Partida de Simples"
2. ✅ Card verde elegante aparece na aba "Classificação":
   ```
   🎾 Partida de Desempate Gerada!
   ⚔️ Rodada 4: Dayanna × Amanda
   [▶️ Ir para a Partida]
   ```
3. Usuário clica no botão quando estiver pronto
4. Aba muda para "Jogos" com a partida visível

**Design do Card:**
- 🟢 Fundo verde claro com borda verde destacada
- 🎾 Ícone de tênis para chamar atenção
- ⚔️ Detalhes da partida (rodada e jogadores)
- 🔘 Botão de ação claro e direto

**Tipo:** Patch (melhoria de UX/UI)

### v0.6.0 - Partidas de Desempate Isoladas do Ranking ✅
**Data:** 10/01/2026

**Mudança Importante:**
- 🎯 Partidas de desempate (`isTiebreaker: true`) agora são **isoladas** do ranking principal
- 📊 Vitórias, derrotas e saldos de partidas de desempate **NÃO** contam mais no ranking
- 🏆 Partidas de desempate servem **EXCLUSIVAMENTE** para resolver empates
- ✨ Feedback visual ao gerar partida: alerta com nomes dos jogadores e mudança automática para aba "Jogos"

**Problema Identificado:**
Ao gerar uma partida de desempate de simples (ex: Dayanna × Amanda 6x0), a vitória e o saldo de games eram contabilizados no ranking geral, o que podia fazer um jogador **cair** na classificação ao "vencer" o desempate. Isso violava a lógica de que desempates devem apenas resolver posições iguais, não alterar estatísticas gerais.

**Exemplo do Bug:**
```
Antes da partida de desempate:
2. Dayanna  1V 2D  7-12  1 pt (-5)
3. Amanda   1V 2D  7-12  1 pt (-5)
⚠️ Empate

Após Dayanna × Amanda (6-0):
2. Dayanna  2V 2D  13-12  2 pts (+1)  ← Saldo melhorou!
3. Amanda   1V 3D  7-18  1 pt (-11) ← Piorou muito!
4. Carla    1V 2D  6-13  1 pt (-7)  ← Carla subiu!

PROBLEMA: Dayanna deveria ficar em 2º, mas a vitória a fez subir tanto que Carla passou Amanda!
```

**Solução Implementada:**
1. **`rankingService.ts`**: `getPlayerStats` agora ignora partidas com `isTiebreaker: true`
2. **Ranking isolado**: Partidas de desempate não afetam V/D/Sets/Games
3. **Posição definida apenas por `tiebreakOrder`**: Vencedor = 1, Perdedor = 2
4. **Feedback UX**: 
   - Alert: "✅ Partida de desempate gerada! Jogador1 × Jogador2"
   - Mudança automática para aba "Jogos"

**Resultado Esperado Agora:**
```
Antes da partida de desempate:
2. Dayanna  1V 2D  7-12  1 pt (-5)
3. Amanda   1V 2D  7-12  1 pt (-5)
⚠️ Empate

Após Dayanna × Amanda (6-0):
2. Dayanna [DESEMPATE] 1V 2D  7-12  1 pt (-5)  ← Estatísticas inalteradas!
3. Amanda [DESEMPATE]  1V 2D  7-12  1 pt (-5)  ← Estatísticas inalteradas!

Partida de desempate serviu APENAS para definir quem fica em 2º e 3º!
```

**Tipo:** Minor (mudança de comportamento importante - nova regra de cálculo)

### v0.5.1 - Remoção de Partida de Simples ao Desfazer Desempate ✅
**Data:** 10/01/2026

**Corrigido:**
- 🗑️ Ao desfazer desempate resolvido via partida de simples, a partida é removida do grupo
- 📊 Estatísticas (vitórias, saldo) da partida removida não contam mais no ranking
- 🧹 Limpeza completa: remove `tiebreakOrder`, `tiebreakMethod` E a partida

**Problema Identificado:**
Ao desfazer um desempate resolvido via partida de simples (ex: Dayanna × Amanda), a partida R4 continuava existindo no grupo e suas estatísticas (vitória, saldo de games) continuavam sendo contabilizadas no ranking, mesmo após o desempate ser desfeito.

**Solução Implementada:**
1. `undoTiebreak` agora detecta se o desempate foi via `tiebreakMethod: 'singles'`
2. Se sim, busca e remove as partidas de desempate de simples (`isTiebreaker: true`) entre esses jogadores
3. Remove `tiebreakOrder` e `tiebreakMethod` dos jogadores
4. Ranking é recalculado automaticamente sem a partida removida

**Comportamento Esperado:**
- **Antes de desfazer:** R4: Dayanna × Amanda (6-3) [DESEMPATE] ✓
- **Após desfazer:** R4 desaparece, jogadores voltam ao empate original

**Tipo:** Patch (correção de bug na lógica de desfazer desempate)

### v0.5.0 - Resolução Automática de Desempate via Partida de Simples ✅
**Data:** 10/01/2026

**Adicionado:**
- 🎾 Resolução automática de desempate ao finalizar partida de simples
- 🏆 Sistema aplica automaticamente `tiebreakOrder` e `tiebreakMethod: 'singles'` ao finalizar
- 📊 Vencedor recebe `tiebreakOrder: 1`, perdedor recebe `tiebreakOrder: 2`
- 💎 Card de "Desempates Resolvidos (Partida de Simples)" aparece automaticamente no dashboard

**Como Funciona:**
1. Usuário gera partida de simples para resolver empate entre 2 jogadores
2. Partida é jogada normalmente (ex: Dayanna × Amanda)
3. Ao finalizar o resultado (ex: 6-3), o sistema detecta que é `isTiebreaker: true`
4. Automaticamente aplica o método de desempate:
   - Vencedor: `tiebreakOrder: 1, tiebreakMethod: 'singles'`
   - Perdedor: `tiebreakOrder: 2, tiebreakMethod: 'singles'`
5. Dashboard exibe card azul: "ℹ️ Desempates Resolvidos (Partida de Simples)"

**Exemplo:**
```
Antes de finalizar:
⚠️ Empate detectado: Dayanna e Amanda (posições 2-3)
[Gerar Partida de Simples]

Após finalizar R4: Dayanna × Amanda (6-3):
ℹ️ Desempates Resolvidos (Partida de Simples)
• Dayanna (posição 2) - VENCEDOR
• Amanda (posição 3)
```

**Tipo:** Minor (nova funcionalidade automática de resolução de desempate)

### v0.4.9 - Exibição Correta de Partidas de Simples ✅
**Data:** 10/01/2026

**Corrigido:**
- 🎾 Partidas de simples (desempate) agora exibem apenas o nome de cada jogador uma vez
- 🔧 Removida duplicação "Dayanna e Dayanna × Amanda e Amanda"
- ✨ Nova função `formatMatchPlayers` para diferenciar simples de duplas

**Problema Identificado:**
Ao gerar uma partida de simples para desempate, o sistema duplicava o jogador (Dayanna + Dayanna como dupla) e exibia "Dayanna e Dayanna × Amanda e Amanda" ao invés de "Dayanna × Amanda".

**Solução Implementada:**
1. Criada função `formatMatchPlayers` que detecta se é simples ou duplas
2. Para simples: Exibe apenas "Jogador1 × Jogador2"
3. Para duplas: Usa `formatDupla` normal ("Jogador1 e Jogador2 × Jogador3 e Jogador4")
4. Detecção: `isTiebreaker === true` E `jogador1A.id === jogador2A.id`

**Exemplo:**
- **Antes:** R4: Dayanna e Dayanna × Amanda e Amanda [DESEMPATE]
- **Agora:** R4: Dayanna × Amanda [DESEMPATE]

**Tipo:** Patch (correção de UX para partidas de simples)

### v0.4.8 - Identificação do Método de Desempate ✅
**Data:** 10/01/2026

**Adicionado:**
- 🎯 Campo `tiebreakMethod` no `Player` para identificar o método usado ('manual', 'random', 'singles')
- 📝 Exibição correta do método usado no card de desempates resolvidos
- 🧹 Remoção do `tiebreakMethod` ao desfazer desempate

**Problema Identificado:**
O card sempre exibia "Desempates Resolvidos Manualmente" mesmo quando o desempate foi feito por sorteio.

**Solução Implementada:**
1. Adicionado campo `tiebreakMethod` na interface `Player`
2. `resolveTieManual` recebe parâmetro `method` (padrão 'manual')
3. `resolveTieRandom` passa `method: 'random'`
4. UI agora exibe:
   - "(Seleção Manual)" para desempates manuais
   - "(Sorteio)" para desempates aleatórios
   - "(Partida de Simples)" para desempates via jogo (futuro)

**Tipo:** Patch (melhoria de UX e clareza)

### v0.4.7 - Correção Crítica da Atribuição de tiebreakOrder ✅
**Data:** 10/01/2026

**Corrigido:**
- 🐛 Bug crítico na atribuição de `tiebreakOrder` que causava ordem incorreta
- 🐛 Vencedor de desempate agora sempre recebe `tiebreakOrder: 1` (melhor posição)
- 🐛 Perdedores recebem `tiebreakOrder: 2, 3, 4...` na sequência correta
- 🐛 Sorteio aleatório simplificado para seleção direta por índice

**Problema Identificado:**
A lógica anterior podia atribuir o mesmo `tiebreakOrder` para vários jogadores ou valores invertidos. Mesmo com sorteio funcionando (índices variando), o ranking não refletia o vencedor correto porque a atribuição de ordem estava errada.

**Exemplo do Bug:**
- Array: [Dayanna_ID, Amanda_ID]
- Se Amanda vencia (índice 1): Amanda recebia `tiebreakOrder: 1`, Dayanna recebia `0 + 1 = 1` → Ambos com 1!
- Ranking ordenava de forma inconsistente

**Solução Implementada:**
1. Vencedor sempre recebe `tiebreakOrder: 1`
2. Perdedores são filtrados e recebem `2, 3, 4...` baseado em sua posição entre os perdedores
3. Sorteio simplificado: gera índice aleatório direto ao invés de embaralhar array
4. Log no console para debug durante testes

**Tipo:** Patch (correção de bug crítico na lógica de desempate)

### v0.4.6 - Correção do Sorteio de Desempate ✅
**Data:** 10/01/2026

**Corrigido:**
- 🐛 Algoritmo de sorteio substituído por seleção aleatória direta
- 🐛 Sorteio agora é verdadeiramente aleatório e uniformemente distribuído

**Tipo:** Patch (correção de bug no sorteio)

### v0.4.5 - Melhorias no Sistema de Desempate ✅
**Data:** 10/01/2026

**Adicionado:**
- ✅ Badge "DESEMPATE" na tabela de classificação para jogadores classificados por desempate manual
- ✅ Card informativo mostrando todos os jogadores com desempate resolvido
- ✅ Função `undoTiebreak` para desfazer resolução de desempate
- ✅ Botão "Desfazer Desempate" no card de desempates resolvidos
- ✅ Confirmação antes de desfazer desempate

**Modificado:**
- 🔄 Interface mais clara sobre status de desempate dos jogadores
- 🔄 Jogadores com `tiebreakOrder` exibem badge azul "DESEMPATE"
- 🔄 Possibilidade de reverter decisão de desempate para escolher outro método

**Benefícios:**
- Transparência Total: Fica explícito quem foi classificado por desempate manual
- Flexibilidade: Permite reverter e escolher outro método de desempate
- UX Melhorada: Informação clara e opção de correção sempre disponível
- Auditoria: Fácil identificar quais classificações foram definidas manualmente

**Impacto nos dados:** Nenhum (apenas apresentação e funcionalidade de desfazer)

### v0.4.4 - Sistema de Resolução de Desempate ✅
**Data:** 10/01/2026

**Adicionado:**
- ✅ Detecção automática de empates no ranking (mesmas vitórias e saldo de games)
- ✅ Indicador visual (⚠️) nas posições empatadas da tabela de classificação
- ✅ Componente `TiebreakerModal` para resolução de empates
- ✅ Três métodos de resolução de empate:
  - Seleção manual do vencedor
  - Sorteio aleatório
  - Geração de partida de simples (apenas para 2 jogadores)
- ✅ Campo `tiebreakOrder` no Player para persistir resolução manual
- ✅ Campo `isTiebreaker` no Match para identificar partidas de desempate
- ✅ Badge "DESEMPATE" em partidas de simples
- ✅ Função `detectTies` no rankingService
- ✅ Funções de resolução no useTournament: `resolveTieManual`, `resolveTieRandom`, `generateSinglesMatch`

**Modificado:**
- 🔄 Função `compareRanking` agora considera `tiebreakOrder` antes do empate técnico
- 🔄 GroupCard detecta e exibe alertas de empate na aba de Classificação
- 🔄 MatchList exibe badge especial para partidas de desempate
- 🔄 Tabela de classificação atualizada com "Pts (saldo)" para maior clareza
- 🔄 Coluna "Sets" removida da tabela (simplificação)
- 🔄 Saldo de games exibido ao lado dos pontos: "3 (+9)"

**Benefícios:**
- Transparência: Empates são claramente identificados e sinalizados
- Flexibilidade: Múltiplas opções para resolver empates conforme a situação
- Fairness: Partidas de simples permitem desempate justo entre 2 jogadores
- Persistência: Resoluções manuais são salvas e respeitadas no ranking

**Impacto nos dados:** Adiciona campos opcionais sem quebrar compatibilidade

### v0.4.3 - Melhorias de Gestão de Torneio ✅
**Data:** 10/01/2026

**Adicionado:**
- ✅ Sistema de abas na página de configuração (Lista de Espera / No Torneio)
- ✅ Função para reabrir jogos finalizados e corrigir placares
- ✅ Função para resortear grupos com confirmação
- ✅ Botão "Reabrir" em jogos concluídos
- ✅ Botão "Resortear Grupos" na aba "No Torneio"
- ✅ Visualização de jogadores por grupo na aba "No Torneio"

**Modificado:**
- 🔄 Hook `useTournament` com funções `reopenMatch` e `resetAndRedrawGroups`
- 🔄 Componente `MatchList` aceita prop `onReopenMatch`
- 🔄 Componente `GroupCard` passa handler de reabrir
- 🔄 Página de configuração reorganizada com sistema de abas
- 🔄 Separação clara entre jogadores em espera e jogadores alocados em grupos

**Benefícios:**
- Correção de placares: Jogos finalizados podem ser reabertos para edição
- Flexibilidade: Possibilidade de refazer sorteio de grupos quando necessário
- Organização: Visualização clara do status dos jogadores (espera vs torneio)
- UX melhorada: Interface mais intuitiva para gerenciar participantes

**Impacto nos dados:** Sistema de backup automático protege contra perda ao resortear

### v0.4.2 - Toggle de Visualização no Dashboard ✅
**Data:** 10/01/2026

**Adicionado:**
- ✅ Toggle global no dashboard para alternar entre "Classificação" e "Jogos"
- ✅ Botões estilizados com estado ativo/inativo
- ✅ Renderização condicional nos GroupCards baseada no modo de visualização
- ✅ Interface mais limpa e focada: usuário vê apenas o que escolheu

**Modificado:**
- 🔄 Componente `GroupCard` agora aceita prop `viewMode`
- 🔄 Layout do dashboard com controles de visualização centralizados
- 🔄 Experiência mobile melhorada com menos scroll

**Benefícios:**
- Foco: Usuário pode se concentrar apenas em classificação ou apenas em jogos
- Performance: Renderiza menos conteúdo por vez
- UX: Interface mais organizada e menos sobrecarregada
- Mobile-friendly: Reduz significativamente o scroll em dispositivos móveis

**Impacto nos dados:** Nenhum (apenas mudança de apresentação)

### v0.4.1 - Sistema de Proteção de Dados ✅
**Data:** 10/01/2026

**Adicionado:**
- ✅ Versionamento automático de dados (campo `version` no Tournament)
- ✅ Sistema de backup automático antes de qualquer modificação
- ✅ Migração inteligente de v0.3.0 para v0.4.0 (preserva jogadores)
- ✅ Histórico de backups automáticos (mantém últimos 5)
- ✅ Validação robusta de estrutura de dados

**Modificado:**
- 🔄 Hook `useTournament` agora cria backup antes de qualquer alteração
- 🔄 Função `migrateV030ToV040` converte duplas em jogadores individuais
- 🔄 Validação `isValidTournamentStructure` mais permissiva

**Contexto:**
Implementado após detectar perda de dados durante refatoração v0.3.0 → v0.4.0. Garante que futuras atualizações não causem perda de dados dos torneios em andamento.

### v0.4.0 - Sistema Individual com Duplas nos Jogos ✅
**Data:** 10/01/2026

**REESTRUTURAÇÃO COMPLETA:**
Esta versão corrige fundamentalmente a estrutura do sistema para refletir corretamente as regras do Beach Tennis:
- Cadastro e ranking são INDIVIDUAIS
- Duplas são formadas apenas nos JOGOS
- Cada jogador acumula suas próprias estatísticas

**Adicionado:**
- Sistema de cadastro individual de jogadores
- Ranking individual (cada jogador tem suas próprias estatísticas)
- Algoritmo Round Robin de pareamentos: cada jogador joga COM e CONTRA todos os outros
- Match com 4 jogadores (jogador1A, jogador2A, jogador1B, jogador2B)
- Função helper `formatDupla()` para exibição de duplas nos jogos
- Estatísticas individuais aplicadas aos jogadores de cada dupla após o jogo

**Modificado:**
- Player agora é individual (id, nome, categoria, isSeed, status)
- Group contém `players[]` (4 jogadores individuais)
- Tournament.waitingList contém jogadores individuais
- RankingEntry calcula estatísticas por jogador
- UI de cadastro voltou para 1 campo de input
- Lista de espera mostra jogadores individuais
- Componentes atualizados para exibir jogadores e duplas corretamente

**Removido:**
- Tipo `Dupla` e `DuplaStatus`
- Função `getDuplaName()`
- Sistema de cadastro de duplas fixas

**Exemplo Prático:**
```
Grupo A: Thiago, Dayanna, Silva, Flavio

Jogos Gerados:
- Jogo 1: (Thiago + Dayanna) vs (Silva + Flavio)
- Jogo 2: (Thiago + Silva) vs (Dayanna + Flavio)
- Jogo 3: (Thiago + Flavio) vs (Dayanna + Silva)

Se Jogo 1 terminar 6x2:
- Thiago: +1V, +6GF, +2GC
- Dayanna: +1V, +6GF, +2GC
- Silva: +1D, +2GF, +6GC
- Flavio: +1D, +2GF, +6GC
```

**Nota de Compatibilidade:**
Esta versão quebra compatibilidade com backups da v0.3.0 devido à mudança estrutural de duplas para jogadores individuais.

### v0.3.0 - Sistema de Duplas e Nomenclatura de Grupos (OBSOLETO)
**Data:** 10/01/2026

**Adicionado:**
- ✅ Sistema completo de DUPLAS (2 jogadores por dupla)
- ✅ Nomenclatura alfabética dos grupos (A, B, C, D...)
- ✅ UI atualizada para cadastro de duplas (2 campos de input)
- ✅ Exibição de duplas formatada ("Jogador 1 / Jogador 2")
- ✅ Tipos atualizados: `Dupla`, `Player`, helper `getDuplaName()`

**Modificado:**
- 🔄 Estrutura de dados migrada de Players individuais para Duplas
- 🔄 Todos os serviços adaptados (enrollment, group, match, ranking)
- 🔄 Hooks atualizados (`useTournament` agora usa `addDupla`/`removeDupla`)
- 🔄 Componentes UI atualizados (GroupCard, MatchList, BackupPanel)
- 🔄 Nomenclatura dos grupos agora usa letras (A, B, C...) em vez de IDs aleatórios

**Contexto:**
Beach Tennis é jogado em DUPLAS, não em simples. Esta versão corrige a estrutura fundamental do sistema para refletir a natureza real do esporte. Jogos de simples só serão criados para desempate ao final de cada fase (funcionalidade futura).

### v0.2.0 - Ordenação de Categorias ✅
**Data:** 10/01/2026

**Adicionado:**
- ✅ Sistema de ordenação de categorias
- ✅ Botões de ordenação (mover para cima/baixo) na página de configuração
- ✅ Dashboard reflete a ordem customizada das categorias
- ✅ Ordem persistida no LocalStorage
- ✅ Validação de limites (primeira/última categoria)
- ✅ Ícones SVG para indicadores visuais

**Melhorado:**
- UI da página de configuração com controles de ordenação intuitivos
- Experiência do usuário ao organizar torneios com múltiplas categorias
- Grupos no dashboard agora ordenados por fase dentro de cada categoria

### v0.1.0 - MVP Completo ✅
**Data:** 10/01/2026

**Adicionado:**
- ✅ Estrutura completa do projeto Next.js 14 com TypeScript
- ✅ Configuração PWA (next-pwa, manifest, service worker)
- ✅ Sistema completo de tipos TypeScript
- ✅ Todos os services implementados:
  - EnrollmentService (inscrição e lista de espera)
  - GroupGenerator (formação de grupos com seeds)
  - MatchGenerator (Round Robin - CRÍTICO)
  - RankingService (cálculo de ranking)
  - BackupService (export/import JSON)
- ✅ Hooks customizados (useLocalStorage, useTournament)
- ✅ Componentes UI completos:
  - Footer com versão
  - GameConfigForm (config de jogo)
  - ScoreInput (input de placares)
  - BackupPanel (backup/restore)
  - GroupCard (card de grupo)
  - MatchList (lista de jogos)
- ✅ Páginas implementadas:
  - Dashboard principal
  - Tela de configuração
- ✅ Documentação completa:
  - README.md atualizado
  - TESTING.md criado
  - PROJECT_STATUS.md atualizado

**Funcionalidades:**
- Sistema de torneios com categorias múltiplas
- Formação automática de grupos de 4 duplas
- Geração de partidas Round Robin (todos contra todos)
- Configuração simplificada de jogo (1 ou 3 sets, 4 ou 6 games, tie-break de 7 ou 10 pontos)
- Input de placares com validação em tempo real
- Ranking automático com critérios de desempate
- Backup/Restore completo em JSON
- PWA instalável e funciona offline
- Design responsivo mobile-first
- Dark mode suportado

**Próximas Versões (Roadmap):**
- v0.5.0: Jogos de simples para desempate (ao final das fases)
- v0.6.0: Melhorias de UX (animações, feedback visual)
- v0.7.0: Navegação entre fases (classificatórios, finais)
- v0.8.0: Histórico de torneios
- v1.0.0: Release estável com todos os refinamentos

---

## 📝 Notas de Desenvolvimento

### Stack Tecnológica
- **Framework:** Next.js 14 (App Router)
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Estado:** React Hooks + Context API
- **Persistência:** LocalStorage + Vercel KV (produção) / Redis (dev)
- **Sincronização:** SWR para viewers, debounce para admins
- **Validação:** Zod
- **PWA:** next-pwa
- **Cache/DB:** Vercel KV (produção), Redis 7 (desenvolvimento)

### Decisões Técnicas
- Mobile-first design
- PWA para funcionar offline
- LocalStorage para persistência local + Vercel KV para sincronização
- Sincronização otimizada: debounce (2s) e dirty checking para admins
- SWR para atualização automática de viewers (1 minuto)
- Versionamento semântico (SemVer) automático via CI/CD
- Footer exibe versão via variável de ambiente (NEXT_PUBLIC_APP_VERSION)
- GitHub Actions para releases automáticos baseados em Conventional Commits
- Deploy automático na Vercel
- Redis local via Docker Compose para desenvolvimento

### Melhorias Futuras
- [ ] Autenticação de usuários
- [ ] Múltiplos torneios simultâneos
- [ ] Histórico de torneios passados
- [ ] Notificações push
- [ ] Melhorias de performance (cache, otimizações)
- [ ] Analytics e estatísticas avançadas

---

**Última atualização:** 14/01/2026  
**Versão atual:** v0.4.0 (gerenciada automaticamente via GitHub Actions)  
**Status:** ✅ ATIVO - Sistema completo de 3 fases progressivas com sincronização multi-dispositivo em tempo real, validação automática, classificação dinâmica, repescagem inteligente, navegação por fases fixas, badges de status, preview de classificados, banner de campeão, export/import avançado com modais (todas categorias ou específica, com sobrescrita), adição incremental de grupos, remoção em massa protegida, resorteio inteligente corrigido que preserva vagas, grupos com letras identificadoras (A, B, C...), formação de grupos ágil sem pop-ups, UX profissional otimizada, proteção integral contra perda de dados, configurações de jogo simplificadas (1 ou 3 sets, 4 ou 6 games, tie-break de 7 ou 10 pontos), interface de placares flexível sem validações rígidas, compartilhamento com link e QR Code, página pública de visualização, e todas as funcionalidades anteriores mantidas!

**⚠️ Importante sobre Versionamento:**
- A versão é gerenciada **automaticamente** via GitHub Actions
- **NÃO altere manualmente** a versão no `package.json`
- Versão atual: **0.2.3** (conforme `package.json`)
- O workflow atualiza o `package.json` e cria GitHub Releases automaticamente
- Consulte a seção "Fase 9: CI/CD e Versionamento Automático" para detalhes
