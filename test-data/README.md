# Dados de Teste

Esta pasta contém arquivos JSON com listas de jogadores pré-configuradas para facilitar os testes do sistema.

## Arquivos Disponíveis

- **`TEST_PLAYERS_28.json`** - 28 jogadores (7 grupos, 7 seeds)
- **`TEST_PLAYERS_32.json`** - 32 jogadores (8 grupos, 8 seeds)
- **`TEST_PLAYERS_36.json`** - 36 jogadores (9 grupos, 9 seeds)
- **`TEST_PLAYERS_40.json`** - 40 jogadores (10 grupos, 10 seeds)

## Como Usar

1. Abra o app na página de **Configurações**
2. Selecione a categoria "Normal" (ou a categoria desejada)
3. Clique no botão **📤 Importar** ao lado de "Participantes"
4. Selecione o arquivo JSON desejado
5. Os jogadores serão importados na lista de espera
6. Clique em **Formar Grupos** para iniciar o torneio

## Formato dos Arquivos

Os arquivos seguem o formato de exportação de jogadores:

```json
{
  "exportDate": "2024-01-01T00:00:00.000Z",
  "categoria": "Normal",
  "totalPlayers": 28,
  "players": [
    {"nome": "Jogador 1", "categoria": "Normal", "isSeed": true},
    {"nome": "Jogador 2", "categoria": "Normal", "isSeed": false}
  ]
}
```

## Distribuição de Seeds

Todos os arquivos seguem a regra de **1 seed por grupo**:
- 28 jogadores = 7 grupos = 7 seeds
- 32 jogadores = 8 grupos = 8 seeds
- 36 jogadores = 9 grupos = 9 seeds
- 40 jogadores = 10 grupos = 10 seeds

## Notas

- Os arquivos podem ser editados manualmente se necessário
- Os nomes dos jogadores são fictícios e podem ser alterados
- A categoria padrão é "Normal", mas pode ser modificada no JSON antes da importação
