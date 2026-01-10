# Guia de Testes - BeachTennis Manager

## 🧪 Testes de Integração

### Fluxo Completo (Happy Path)

1. **Configuração Inicial**
   - [ ] Abrir aplicação em `http://localhost:3000`
   - [ ] Verificar nome padrão do torneio exibido
   - [ ] Clicar em "Configurações"

2. **Configurar Torneio**
   - [ ] Alterar nome do torneio
   - [ ] Adicionar categoria "Iniciante"
   - [ ] Adicionar categoria "Avançado"
   - [ ] Configurar jogo: Melhor de 3 sets, 6 games por set
   - [ ] Marcar set decisivo como tie-break de 10 pontos

3. **Adicionar Jogadores**
   - [ ] Adicionar 4 jogadores na categoria "Iniciante":
     - Dupla A (não-seed)
     - Dupla B (seed)
     - Dupla C (não-seed)
     - Dupla D (seed)
   - [ ] Verificar que botão "Formar Grupo" aparece
   - [ ] Clicar em "Formar 1 Grupo"
   - [ ] Verificar que grupo foi criado

4. **Visualizar Dashboard**
   - [ ] Voltar para Dashboard
   - [ ] Verificar que grupo aparece
   - [ ] Verificar que 6 partidas foram geradas (Round Robin)
   - [ ] Verificar distribuição de rodadas (2 jogos por rodada)

5. **Inserir Resultados**
   - [ ] Selecionar primeiro jogo
   - [ ] Inserir placar: Set 1: 6-4, Set 2: 6-2
   - [ ] Clicar em "Finalizar Jogo"
   - [ ] Verificar que jogo aparece como concluído
   - [ ] Verificar que ranking foi atualizado

6. **Validações de Placar**
   - [ ] Tentar inserir placar inválido: 6-5 (deve mostrar erro)
   - [ ] Tentar inserir placar válido: 7-5 (deve aceitar)
   - [ ] Tentar tie-break inválido: 10-9 (deve mostrar erro)
   - [ ] Inserir tie-break válido: 10-8 (deve aceitar)

7. **Backup e Restore**
   - [ ] Ir para Configurações
   - [ ] Clicar em "Baixar Backup"
   - [ ] Verificar que arquivo JSON foi baixado
   - [ ] Adicionar mais um jogador
   - [ ] Clicar em "Selecionar Arquivo" para importar
   - [ ] Selecionar backup anterior
   - [ ] Confirmar importação
   - [ ] Verificar que dados foram restaurados

## 🌐 Testes PWA

### Instalabilidade

#### Desktop (Chrome/Edge)
- [ ] Abrir aplicação no Chrome
- [ ] Verificar ícone de instalação na barra de endereço
- [ ] Clicar para instalar
- [ ] Verificar que app abre em janela própria
- [ ] Fechar e abrir novamente do menu Iniciar

#### Mobile (Android)
- [ ] Abrir aplicação no Chrome mobile
- [ ] Menu → "Adicionar à tela inicial"
- [ ] Verificar que ícone aparece na home
- [ ] Abrir app pela home (deve abrir fullscreen)

#### Mobile (iOS/Safari)
- [ ] Abrir no Safari
- [ ] Botão compartilhar → "Adicionar à Tela de Início"
- [ ] Verificar ícone na home
- [ ] Abrir app (deve funcionar offline após primeira visita)

### Funcionalidade Offline

- [ ] Abrir aplicação com internet
- [ ] Adicionar alguns dados (torneio, jogadores, etc)
- [ ] Desabilitar internet (modo avião)
- [ ] Recarregar página
- [ ] Verificar que dados persistem (LocalStorage)
- [ ] Adicionar mais dados offline
- [ ] Reconectar internet
- [ ] Verificar que tudo ainda funciona

### Performance

#### Lighthouse Audit
```bash
# Instalar Lighthouse (se não tiver)
npm install -g lighthouse

# Rodar audit
lighthouse http://localhost:3000 --view
```

**Metas:**
- [ ] Performance > 90
- [ ] Accessibility > 90
- [ ] Best Practices > 90
- [ ] SEO > 90
- [ ] PWA: 100

### Service Worker

- [ ] Abrir DevTools → Application → Service Workers
- [ ] Verificar que service worker está registrado
- [ ] Verificar status "activated"
- [ ] Application → Cache Storage
- [ ] Verificar que arquivos estão cacheados

## ⚙️ Testes de Configuração de Jogo

### Diferentes Formatos

**Jogo Único (1 set)**
- [ ] Configurar: 1 set, 6 games
- [ ] Criar grupo e jogar partida
- [ ] Inserir placar: 6-4
- [ ] Verificar que jogo finaliza com 1 set

**Melhor de 3 com Tie-Break**
- [ ] Configurar: 3 sets, 6 games, tie-break 10 pts
- [ ] Jogar partida até set decisivo
- [ ] Inserir: Set 1: 6-4, Set 2: 4-6, Set 3 (TB): 10-8
- [ ] Verificar cálculo correto de sets e games

**Melhor de 5**
- [ ] Configurar: 5 sets, 6 games
- [ ] Verificar que exige 3 sets para vencer
- [ ] Testar vitória por 3-0, 3-1, 3-2

## 📊 Testes de Ranking

### Critérios de Desempate

**Cenário 1: Desempate por Vitórias**
```
Dupla A: 3 vitórias
Dupla B: 2 vitórias
Dupla C: 1 vitória
Dupla D: 0 vitórias
```
- [ ] Verificar ordenação correta

**Cenário 2: Desempate por Saldo de Sets**
```
Dupla A: 2 vitórias, 4-2 sets (saldo +2)
Dupla B: 2 vitórias, 4-1 sets (saldo +3)
```
- [ ] Verificar que Dupla B fica à frente

**Cenário 3: Desempate por Saldo de Games**
```
Dupla A: 2 vitórias, 4-2 sets, 26-20 games (saldo +6)
Dupla B: 2 vitórias, 4-2 sets, 28-18 games (saldo +10)
```
- [ ] Verificar que Dupla B fica à frente

## 🔄 Testes de Backup

### Estrutura do JSON

- [ ] Exportar backup
- [ ] Abrir JSON em editor
- [ ] Verificar campos obrigatórios:
  - version
  - exportDate
  - tournament (nome, categorias, gameConfig, grupos, waitingList)

### Validações

**Arquivo Inválido**
- [ ] Tentar importar arquivo de texto
- [ ] Verificar mensagem de erro: "Arquivo inválido"

**JSON Inválido**
- [ ] Criar arquivo JSON com estrutura errada
- [ ] Tentar importar
- [ ] Verificar erro de validação

**Versão Incompatível**
- [ ] Modificar "version" para "2.0.0"
- [ ] Tentar importar
- [ ] Verificar erro de incompatibilidade

### Ciclo Completo

- [ ] Criar torneio A com dados
- [ ] Exportar backup A
- [ ] Criar torneio B diferente
- [ ] Importar backup A
- [ ] Verificar que dados de A foram restaurados
- [ ] Verificar que dados de B foram sobrescritos

## 🎨 Testes de Responsividade

### Mobile (320px - 768px)

- [ ] Abrir em dispositivo mobile ou DevTools responsive
- [ ] Verificar que layout adapta (1 coluna)
- [ ] Verificar que botões são touch-friendly (min 44x44px)
- [ ] Verificar que inputs são legíveis
- [ ] Verificar que Footer não sobrepõe conteúdo
- [ ] Testar rotação (portrait/landscape)

### Tablet (768px - 1024px)

- [ ] Verificar layout intermediário
- [ ] Cards de grupos devem ocupar bem o espaço
- [ ] Navegação deve ser confortável

### Desktop (1024px+)

- [ ] Verificar layout 2 colunas para grupos
- [ ] Verificar que não há desperdício de espaço
- [ ] Verificar que conteúdo está centralizado (max-width)

## ♿ Testes de Acessibilidade

### Navegação por Teclado

- [ ] Navegar apenas com Tab
- [ ] Verificar ordem lógica de foco
- [ ] Verificar indicadores visuais de foco
- [ ] Testar Enter/Espaço em botões

### Contraste de Cores

- [ ] Verificar contraste texto/fundo > 4.5:1
- [ ] Testar modo escuro
- [ ] Verificar legibilidade de placares

### Screen Readers

- [ ] Testar com NVDA/JAWS (Windows)
- [ ] Testar com VoiceOver (Mac/iOS)
- [ ] Verificar labels em inputs
- [ ] Verificar que estados (pendente/concluído) são anunciados

## ✅ Checklist Final

Antes de considerar MVP completo:

- [ ] Todos os fluxos principais funcionam
- [ ] PWA instalável e funciona offline
- [ ] Lighthouse PWA score = 100
- [ ] Backup/restore funcionando perfeitamente
- [ ] Responsivo em todos os tamanhos de tela
- [ ] Sem erros no console
- [ ] Versão exibida corretamente no Footer
- [ ] Documentação (README, PROJECT_STATUS) atualizada

---

**Última atualização:** 10/01/2026  
**Versão testada:** v0.1.0
