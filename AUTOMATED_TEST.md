# Testes Automatizados - Fluxo Completo (Script Unificado)

Este documento descreve o processo de validação de ponta a ponta ("End-to-End") utilizando um script unificado de automação.

## 📋 Pré-requisitos

1.  Aplicação rodando em [http://localhost:3000](http://localhost:3000).
2.  Arquivo de script: `scripts/automate_simulation.js`.

## 🛠️ Configuração do Ambiente de Teste

1.  Abra o arquivo `scripts/automate_simulation.js` no seu editor.
2.  Copie **todo o conteúdo** do arquivo.
3.  No navegador (App), abra o **Console do Desenvolvedor** (F12 ou Cmd+Option+I).
4.  Cole o código no console e pressione Enter.
    *   *Você verá a mensagem: "🎾 Beach Tennis Simulator Loaded!"*

---

## 🚀 Workflow de Teste (9 Passos)

Siga a ordem abaixo rigorosamente.

### Passo 1 & 2: Limpeza e Setup
Gera um torneio novo com o número de participantes desejado (ex: 24).

```javascript
Simulator.setup(24);
```
*A página recarregará automaticamente já na Fase 1.*

### Passo 3: Injetar Placares da Fase 1
Preenche todos os jogos da Fase 1, forçando cenários de empate nos grupos A (triplo) e B (duplo).

```javascript
Simulator.fillPhase1();
```
*A página recarregará com os jogos "Finalizados".*

### Passo 4: Resolver Desempates (Fase 1)
1.  Identifique os grupos com botão **"Resolver Desempate"** (A e B).
2.  Clique e resolva (Use "Sorteio" para agilidade).
3.  Após resolver **todos** os grupos, clique em **"Concluir Fase 1"**.
    *   *Nota: Se aparecer pop-up de confirmação, aceite.*

### Passo 5: Injetar Placares da Fase 2
Estando na Fase 2, execute o comando para preencher jogos e forçar um empate entre grupos (Cross-Group Tie).

```javascript
Simulator.fillPhase2();
```
*A página recarregará.*

### Passo 6: Resolver Desempates (Fase 2)
1.  Resolva primeiramente os empates internos de cada grupo (se houver).
2.  Verifique o box **"Empate entre Grupos"**.
3.  Clique em "Resolver" e finalize o desempate.
4.  Clique em **"Concluir Fase 2"**.

### Passo 7: Injetar Placares da Fase 3 (Final)
Estando na Fase 3, preenche o placar da final.

```javascript
Simulator.fillFinal();
```
*A página recarregará.*

### Passo 8: Concluir Torneio
1.  Verifique que o jogo final está concluído.
2.  Clique em **"Concluir Torneio"**.

### Passo 9: Validação Final
1.  O banner de **CAMPEÃO** deve aparecer.
2.  (Opcional) Gere o PDF do torneio.

---

## ⚠️ Notas de Automação

*   **Pop-ups:** O script não remove os pop-ups nativos do navegador (`window.confirm`). Se estiver rodando um teste totalmente "headless" ou robotizado, lembre-se de mockar: `window.confirm = () => true`.
*   **Ordem:** Jamais pule a etapa de resolução manual. Os scripts apenas preenchem placares; a lógica de transição de fase depende da ação do usuário (ou simulação de clique) para validar as regras de negócio.

### Notas Importantes
*   **Pop-ups de Confirmação:** Ao clicar em "Concluir Fase" (1, 2 ou Final), o navegador exibe um pop-up de confirmação (`window.confirm`). Nos testes automatizados, é necessário interceptar este pop-up ou mockar `window.confirm = () => true` antes de clicar no botão, caso contrário a automação pode travar.
