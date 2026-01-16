# Testes Automatizados de Desempate (Simulação)

Este documento descreve como reproduzir os cenários de teste para validação do sistema de desempate (Empates em Grupo e Empates entre Grupos).

## 1. Teste de Empates na Fase 1 (Grupos)

Este teste simula empates dentro dos grupos na primeira fase do torneio.

### Pré-requisitos
- Script de geração configurado com cenários de empate (`scripts/generate_backup.js`).

### Passos para Reprodução
1.  Execute o script de geração no terminal:
    ```bash
    node scripts/generate_backup.js
    ```
    *Isso gerará o arquivo `tournament_24_players_simulation.json`.*

2.  Abra a aplicação: [http://localhost:3000/config](http://localhost:3000/config)
3.  Vá até a seção **"Zona de Perigo / Backup"**.
4.  Clique em **"Importar Backup"** e selecione o arquivo `tournament_24_players_simulation.json`.
5.  Vá para o **Dashboard** (Fase 1).

### Comportamento Esperado
*   **Grupo A:** Empate triplo nas posições 1, 2 e 3.
    *   *Indicador:* Botão "Resolver empate nas posições 1, 2, 3".
*   **Grupo B:** Empate duplo nas posições 2 e 3.
    *   *Indicador:* Botão "Resolver empate nas posições 2, 3".
*   **Conclusão:** O botão "Concluir Fase 1" deve estar ou bloqueado ou solicitando resolução prévia.

---

## 2. Teste de Empate Entre Grupos (Cross-Group) - Fase 2

Este teste força um cenário onde dois jogadores de grupos diferentes (A e B) disputam a vaga de "Melhor 2º Colocado" com estatísticas idênticas, bloqueando a geração da Fase 3.

### Pré-requisitos
*   Estar na **Fase 2** do torneio (após concluir a Fase 1).

### Passos para Reprodução
1.  Abra o Console do Desenvolvedor no navegador (F12 ou Cmd+Option+I).
2.  Cole e execute o seguinte código JavaScript para injetar os placares simulados:

```javascript
(() => {
  const tournament = JSON.parse(localStorage.getItem('beachtennis-tournament'));
  if (!tournament) return console.error("Torneio não encontrado!");
  
  const fase2Groups = tournament.grupos.filter(g => g.fase === 2);
  if (fase2Groups.length < 3) return console.error("É necessário estar na Fase 2 com 3 grupos (A, B, C).");

  const groupA = fase2Groups.find(g => g.nome === 'A');
  const groupB = fase2Groups.find(g => g.nome === 'B');
  const groupC = fase2Groups.find(g => g.nome === 'C');

  // --- GRUPO A ---
  // Jogador 2 termina em 2º lugar com 2V, Saldo +3
  if (groupA && groupA.matches.length >= 3) {
      // Jogo 1: P1+P2 vencem (6-2) -> P1, P2 (+4)
      groupA.matches[0].sets = [{gamesA: 6, gamesB: 2, tieBreakA: 0, tieBreakB: 0}];
      groupA.matches[0].setsWonA = 1; groupA.matches[0].setsWonB = 0; groupA.matches[0].isFinished = true;

      // Jogo 2: P1+P3 vencem (6-2) -> P1(+4), P3(+4) | P2(-4), P4(-4)
      groupA.matches[1].sets = [{gamesA: 6, gamesB: 2, tieBreakA: 0, tieBreakB: 0}];
      groupA.matches[1].setsWonA = 1; groupA.matches[1].setsWonB = 0; groupA.matches[1].isFinished = true;

      // Jogo 3: P2+P3 vencem (6-0) sobre P1+P4
      // Ajuste fino para garantir estatísticas idênticas ao Grupo B
      groupA.matches[2].sets = [{gamesA: 0, gamesB: 6, tieBreakA: 0, tieBreakB: 0}];
      groupA.matches[2].setsWonA = 0; groupA.matches[2].setsWonB = 1; groupA.matches[2].isFinished = true;
  }

  // --- GRUPO B ---
  // Jogador 6 (ou equivalente) termina em 2º lugar com EXATAMENTE as mesmas estatísticas do 2º do Grupo A
  if (groupB && groupB.matches.length >= 3) {
      groupB.matches[0].sets = [{gamesA: 6, gamesB: 2, tieBreakA: 0, tieBreakB: 0}];
      groupB.matches[0].setsWonA = 1; groupB.matches[0].setsWonB = 0; groupB.matches[0].isFinished = true;

      groupB.matches[1].sets = [{gamesA: 6, gamesB: 2, tieBreakA: 0, tieBreakB: 0}];
      groupB.matches[1].setsWonA = 1; groupB.matches[1].setsWonB = 0; groupB.matches[1].isFinished = true;

      groupB.matches[2].sets = [{gamesA: 0, gamesB: 6, tieBreakA: 0, tieBreakB: 0}];
      groupB.matches[2].setsWonA = 0; groupB.matches[2].setsWonB = 1; groupB.matches[2].isFinished = true;
  }

  // --- GRUPO C ---
  // Apenas preencher para não bloquear por jogos pendentes (Winner take all)
  if (groupC && groupC.matches.length >= 3) {
      groupC.matches.forEach(m => {
          m.sets = [{gamesA: 6, gamesB: 0, tieBreakA: 0, tieBreakB: 0}];
          m.setsWonA = 1; m.setsWonB = 0; m.isFinished = true;
      });
  }

  localStorage.setItem('beachtennis-tournament', JSON.stringify(tournament));
  location.reload();
  console.log("✅ Simulação de Empate Cross-Group aplicada com sucesso!");
})();
```

3.  Após o reload da página, tente clicar em **"Concluir Fase 2"**.

### Comportamento Esperado
1.  **Bloqueio:** A fase não deve ser concluída.
2.  **Mensagem:** Deve aparecer um alerta ou o botão deve mudar para "⚠️ Resolva os desempates para concluir".
3.  **Interface de Empate:** Deve aparecer um box **"🔗 Empate entre Grupos Detectado"**.
4.  **Resolução:** O botão "Resolver Empate entre Grupos" deve estar disponível, permitindo:
    *   Escolher Vencedor (Manual).
    *   Sorteio.
    *   Partida de Simples.
