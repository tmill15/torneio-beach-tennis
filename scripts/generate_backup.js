const fs = require('fs');
// Simple UUID generator to avoid dependency issues if not linked
function uuidv4() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

const players = [];
for (let i = 1; i <= 24; i++) {
    players.push({
        id: uuidv4(),
        nome: `Jogador ${i}`,
        categoria: 'Geral',
        isSeed: false,
        status: 'waiting'
    });
}

// Distribute players into groups
const groups = [];
const groupNames = ['A', 'B', 'C', 'D', 'E', 'F'];

// Helper to create match
function createMatch(groupId, p1, p2, p3, p4, round, scoreA, scoreB) {
    const sets = [{
        gamesA: scoreA,
        gamesB: scoreB,
        tieBreakA: 0,
        tieBreakB: 0
    }];

    let setsWonA = 0;
    let setsWonB = 0;

    if (scoreA > scoreB) setsWonA = 1;
    else if (scoreB > scoreA) setsWonB = 1;

    return {
        id: uuidv4(),
        groupId: groupId,
        jogador1A: p1,
        jogador2A: p2,
        jogador1B: p3,
        jogador2B: p4,
        sets: sets,
        setsWonA: setsWonA,
        setsWonB: setsWonB,
        isFinished: true,
        rodada: round
    };
}

for (let i = 0; i < 6; i++) {
    const groupPlayers = players.slice(i * 4, (i + 1) * 4);
    const groupId = uuidv4();

    // Update status
    groupPlayers.forEach(p => p.status = 'enrolled');

    const group = {
        id: groupId,
        nome: groupNames[i],
        fase: 1,
        categoria: "Geral",
        players: groupPlayers,
        matches: []
    };

    const [p1, p2, p3, p4] = groupPlayers;

    // --- Tie Scenarios ---

    // Group A: 3-way tie for 1st place (P1, P2, P4) - 2 Wins, +2 balance each
    if (group.nome === 'A') {
        group.matches.push(createMatch(groupId, p1, p2, p3, p4, 1, 6, 4));
        group.matches.push(createMatch(groupId, p1, p3, p2, p4, 2, 4, 6)); // P2+P4 Win
        group.matches.push(createMatch(groupId, p1, p4, p2, p3, 3, 6, 4));
    }
    // Group B: 2-way tie for 2nd place (P1, P4) - 2 Wins, +3 balance each. P2 is 1st.
    else if (group.nome === 'B') {
        group.matches.push(createMatch(groupId, p1, p2, p3, p4, 1, 6, 2));
        group.matches.push(createMatch(groupId, p1, p3, p2, p4, 2, 2, 6));
        group.matches.push(createMatch(groupId, p1, p4, p2, p3, 3, 6, 3));
    }
    // Group C: 3-way tie for LAST place (P1, P2, P4 with 1 Win, -2 balance). P3 is 1st.
    else if (group.nome === 'C') {
        group.matches.push(createMatch(groupId, p1, p2, p3, p4, 1, 4, 6)); // P3+P4 Win
        group.matches.push(createMatch(groupId, p1, p3, p2, p4, 2, 6, 4)); // P1+P3 Win
        group.matches.push(createMatch(groupId, p1, p4, p2, p3, 3, 4, 6)); // P2+P3 Win
    }
    // Group D: 3-way tie, different balances.
    else if (group.nome === 'D') {
        group.matches.push(createMatch(groupId, p1, p2, p3, p4, 1, 6, 0));
        group.matches.push(createMatch(groupId, p1, p3, p2, p4, 2, 6, 0));
        group.matches.push(createMatch(groupId, p1, p4, p2, p3, 3, 6, 0));
    }
    // Group E: Randomish
    else if (group.nome === 'E') {
        group.matches.push(createMatch(groupId, p1, p2, p3, p4, 1, 6, 3));
        group.matches.push(createMatch(groupId, p1, p3, p2, p4, 2, 3, 6));
        group.matches.push(createMatch(groupId, p1, p4, p2, p3, 3, 6, 5));
    }
    // Group F: Randomish
    else {
        group.matches.push(createMatch(groupId, p1, p2, p3, p4, 1, 7, 5));
        group.matches.push(createMatch(groupId, p1, p3, p2, p4, 2, 6, 1));
        group.matches.push(createMatch(groupId, p1, p4, p2, p3, 3, 2, 6));
    }

    groups.push(group);
}

const backup = {
    version: "0.7.0", // Matching the version in package.json
    exportDate: new Date().toISOString(),
    isFullBackup: true,
    tournament: {
        nome: "Torneio 24 Jogadores (Simulação Empates)",
        categorias: ["Geral"],
        gameConfig: {
            quantidadeSets: 1,
            gamesPerSet: 6,
            tieBreakDecisivo: false,
            pontosTieBreak: 7
        },
        grupos: groups,
        waitingList: [], // All players moved to groups
        completedCategories: [],
        crossGroupTiebreaks: []
    },
    sharingEnabled: false
};

fs.writeFileSync('tournament_24_players_simulation.json', JSON.stringify(backup, null, 2));
console.log('Backup generated: tournament_24_players_simulation.json');
