# Sistema de Validação de Placares - Beach Tennis

## 📋 Visão Geral

O sistema implementa validação automática de placares conforme as regras da ITF/CBT, atuando como um **Árbitro Digital** que verifica a consistência e validade dos resultados antes de finalizar uma partida.

## ⚖️ Regras Implementadas

### 1. Sets de 6 Games
- ✅ Vitória por **6x0, 6x1, 6x2, 6x3, 6x4**: Válido
- ✅ Vitória por **7x5**: Válido (após empate em 5x5)
- ✅ Vitória por **7x6**: Válido (tie-break após 6x6)
- ❌ **6x5**: Inválido (não pode terminar assim)
- ❌ **6x6**: Incompleto (deve ir ao tie-break)

### 2. Sets de 4 Games
- ✅ Vitória por **4x0, 4x1, 4x2**: Válido
- ✅ Vitória por **5x3**: Válido (após empate em 3x3)
- ✅ Vitória por **5x4**: Válido (tie-break após 4x4)
- ❌ **4x3**: Inválido (não pode terminar assim)
- ❌ **4x4**: Incompleto (deve ir ao tie-break)

### 3. Tie-break
- Deve ser vencido por **diferença mínima de 2 pontos**
- Exemplos válidos: 7x5, 10x8, 12x10
- Exemplos inválidos: 7x6, 10x9

### 4. Super Tie-break (Set Decisivo)
- Quando configurado como tie-break de 7 ou 10 pontos
- Mesma regra: diferença mínima de 2 pontos
- Exemplos: 10x8, 12x10, 15x13

### 5. Finalização da Partida
- ❌ **Erro**: Time A vence 2x0, mas há um 3º set registrado
- ⚠️ **Aviso**: Partida incompleta (1x1 em melhor de 3)

### 6. Detecção de Inversão de Placar
- ⚠️ **Aviso**: Se Time A vence Set 1 e Set 3, mas perde Set 2
  - Pode indicar que o Set 2 foi digitado com os lados trocados
  - Exemplo: Set 1: 6x2, Set 2: 2x6 (suspeito), Set 3: 6x3
  - Sugestão: O Set 2 deveria ser 6x2 (vitória do Time A)

## 🎯 Funcionamento

### Ao Finalizar uma Partida

1. **Validação Automática**: O sistema valida o placar
2. **Sem Problemas**: Finaliza automaticamente
3. **Com Erros**: Modal vermelho impede finalização
4. **Com Avisos**: Modal amarelo permite confirmar

### Tipos de Mensagens

#### ❌ Erros (Bloqueiam Finalização)
```
Set 1: Placar inválido 6x5. Com 6 games, o adversário só pode ter até 4 games.
Set 2: Tie-break inválido 7x6. É necessário vencer por pelo menos 2 pontos.
```

#### ⚠️ Avisos (Permitem Confirmação)
```
⚠️ Possível inversão de placar no Set 2. Verifique se os lados foram trocados na digitação.
⚠️ Partida deveria ter terminado em 2x0. Há sets extras registrados após a vitória.
```

## 🔧 Configurações do Torneio

As validações respeitam as configurações do torneio:

```typescript
{
  quantidadeSets: 1 ou 3,
  gamesPerSet: 4 ou 6,
  tieBreakDecisivo: boolean,
  pontosTieBreak: 7 ou 10
}
```

## 📱 Interface

### Modal de Validação

O modal apresenta:
- 🔴 **Erros**: Fundo vermelho, bloqueiam finalização
- 🟡 **Avisos**: Fundo amarelo, permitem continuar
- Botões:
  - "Voltar e Corrigir" (sempre disponível)
  - "Confirmar e Finalizar" (apenas para avisos)

### Exemplo de Uso

**Cenário 1: Erro no Placar**
```
Set 1: 6x5
❌ Erro: "Placar inválido 6x5. Com 6 games, o adversário só pode ter até 4 games."
→ Usuário volta e corrige para 6x4
```

**Cenário 2: Possível Inversão**
```
Set 1: 6x2 (Time A vence)
Set 2: 2x6 (Time B vence)
Set 3: 6x3 (Time A vence)

⚠️ Aviso: "Possível inversão de placar no Set 2. Verifique se os lados foram trocados."
→ Usuário pode confirmar se está correto ou voltar e corrigir
```

## 🎓 Benefícios

1. ✅ **Garante Integridade**: Evita placares impossíveis
2. ✅ **Educativo**: Ensina as regras ao usuário
3. ✅ **Detecta Erros de Digitação**: Identifica inversões e inconsistências
4. ✅ **Flexível**: Permite confirmar avisos quando necessário
5. ✅ **Transparente**: Mensagens claras e específicas

## 🔍 Exemplos de Validação

### Válido ✅
```typescript
Sets: [
  { gamesA: 6, gamesB: 2 },
  { gamesA: 6, gamesB: 4 }
]
→ Vitória por 2x0 (6/2 - 6/4)
```

### Inválido ❌
```typescript
Sets: [
  { gamesA: 6, gamesB: 5 }
]
→ Erro: "Placar inválido 6x5. Não é possível ter 6x5 em sets de 6 games."
```

### Com Aviso ⚠️
```typescript
Sets: [
  { gamesA: 6, gamesB: 2 },
  { gamesA: 6, gamesB: 3 },
  { gamesA: 6, gamesB: 1 }
]
→ Aviso: "Partida deveria ter terminado em 2x0. Há sets extras registrados."
```

## 📊 Arquivos do Sistema

- **`services/scoreValidator.ts`**: Lógica de validação
- **`components/ScoreInput.tsx`**: Interface com modal
- **`types/index.ts`**: Tipos TypeScript

## 🚀 Como Usar

O sistema é **automático**. Ao finalizar qualquer partida:
1. Digite o placar normalmente
2. Clique em "Finalizar Jogo"
3. Se houver problemas, o modal aparece
4. Corrija erros ou confirme avisos

**Nota**: O botão "Salvar Parcial" **não** valida (permite salvar rascunhos).
