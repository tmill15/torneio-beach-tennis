/**
 * AUTOMATED TOURNAMENT SIMULATION SCRIPT
 * 
 * Usage in Browser Console:
 * 1. Copy the entire content of this file and paste it into the DevTools Console.
 * 2. Run the commands as instructed in AUTOMATED_TEST.md
 */

const Simulator = {
    // Helper to generate UUIDs
    uuid: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },

    // Helper to create a player
    createPlayer: (i) => ({
        id: Simulator.uuid(),
        nome: `Jogador ${i}`,
        categoria: 'Geral',
        isSeed: false,
        status: 'enrolled'
    }),

    /**
     * STEP 1 & 2: Setup Tournament with N players
     */
    setup: (numPlayers = 24) => {
        localStorage.clear();

        const players = [];
        for (let i = 1; i <= numPlayers; i++) {
            players.push(Simulator.createPlayer(i));
        }

        // Divide initial players into groups (placeholder logic, real grouping happens in app)
        // actually, we should just populate the 'players' and let the app form groups.
        // BUT, the request says "Importar usuários e Injetar placares". 
        // If we just put players in 'waitingList' or 'config', the user has to click "Form Groups".
        // To automate Step 2 "Carregar usuários", we can just inject a fresh tournament object with players.

        // HOWEVER, to be safer and rely on app logic for grouping, maybe we just set the tournament 
        // with players in 'enrolled' state but no groups? 
        // The app might expect groups to be formed.
        // Let's create a "Configured" state where players are ready to be grouped.
        // Actually, better: Let's create the groups manually to ensure we know who is in which group for the Ties.
        // Beacuse if we let the app randomise groups, our fixed "Group A Tie" logic might break 
        // if Player 1 is not in Group A.

        // So, we MUST pre-calculate groups to guarantee the scenario.

        const groups = [];
        const groupNames = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'].slice(0, Math.ceil(numPlayers / 4));

        for (let i = 0; i < groupNames.length; i++) {
            const groupPlayers = players.slice(i * 4, (i + 1) * 4);
            // Ensure we have 4 players
            if (groupPlayers.length < 4) break;

            const groupId = Simulator.uuid();

            // Create matches placeholders (will be filled by the app usually, but we need them for data injection)
            // Actually, we can just create the group structure and let the app logic run, 
            // OR we fully mock the state. Fully mocking is safer for "Scenario Reproduction".

            const matches = Simulator.generateRoundRobinMatches(groupId, groupPlayers);

            groups.push({
                id: groupId,
                nome: groupNames[i],
                fase: 1,
                categoria: "Geral",
                players: groupPlayers,
                matches: matches
            });
        }

        const tournament = {
            nome: `Torneio Simulação (${numPlayers} Jogadores)`,
            categorias: ["Geral"],
            gameConfig: {
                quantidadeSets: 1,
                gamesPerSet: 6,
                tieBreakDecisivo: false,
                pontosTieBreak: 7
            },
            grupos: groups,
            waitingList: [],
            completedCategories: [],
            crossGroupTiebreaks: []
        };

        localStorage.setItem('beachtennis-tournament', JSON.stringify(tournament));
        console.log(`✅ Tournament setup with ${numPlayers} players. Reloading...`);
        setTimeout(() => location.reload(), 1000);
    },

    generateRoundRobinMatches: (groupId, players) => {
        const matches = [];
        const [p1, p2, p3, p4] = players;

        // Round 1
        matches.push(Simulator.createMatch(groupId, p1, p2, p3, p4, 1));

        // Round 2
        matches.push(Simulator.createMatch(groupId, p1, p3, p2, p4, 2));

        // Round 3
        matches.push(Simulator.createMatch(groupId, p1, p4, p2, p3, 3));

        return matches;
    },

    createMatch: (groupId, t1p1, t1p2, t2p1, t2p2, round) => {
        return {
            id: Simulator.uuid(),
            groupId: groupId,
            jogador1A: t1p1,
            jogador2A: t1p2,
            jogador1B: t2p1,
            jogador2B: t2p2,
            sets: [],
            setsWonA: 0,
            setsWonB: 0,
            isFinished: false,
            rodada: round
        };
    },

    /**
     * STEP 3: Inject Phase 1 Scores (Tie Scenarios)
     */
    fillPhase1: () => {
        const tournament = JSON.parse(localStorage.getItem('beachtennis-tournament'));
        if (!tournament) return console.error("❌ No tournament found!");

        const groups = tournament.grupos.filter(g => g.fase === 1 && g.categoria === 'Geral');

        groups.forEach(group => {
            // Logic to apply scores
            if (group.nome === 'A') {
                // Triple Tie for 1st
                Simulator.setMatchResult(group.matches[0], 6, 4); // P1+P2 Win
                Simulator.setMatchResult(group.matches[1], 4, 6); // P2+P4 Win
                Simulator.setMatchResult(group.matches[2], 6, 4); // P1+P4 Win
            } else if (group.nome === 'B') {
                // Double Tie for 2nd
                Simulator.setMatchResult(group.matches[0], 6, 2);
                Simulator.setMatchResult(group.matches[1], 2, 6);
                Simulator.setMatchResult(group.matches[2], 6, 3);
            } else {
                // Random/Standard wins to ensure no blocks
                group.matches.forEach((m, idx) => {
                    if (idx % 2 === 0) Simulator.setMatchResult(m, 6, 1);
                    else Simulator.setMatchResult(m, 1, 6);
                });
            }
        });

        localStorage.setItem('beachtennis-tournament', JSON.stringify(tournament));
        console.log("✅ Phase 1 scores injected. Reloading...");
        setTimeout(() => location.reload(), 1000);
    },

    /**
     * STEP 5: Inject Phase 2 Scores (Cross-Group Tie)
     */
    fillPhase2: () => {
        const tournament = JSON.parse(localStorage.getItem('beachtennis-tournament'));
        if (!tournament) return console.error("❌ No tournament found!");

        const groups = tournament.grupos.filter(g => g.fase === 2 && g.categoria === 'Geral');

        if (groups.length < 3) return console.warn("⚠️ Warning: Less than 3 groups in Phase 2. Cross-group tie simulation might not work as intended.");

        const groupA = groups.find(g => g.nome === 'A');
        const groupB = groups.find(g => g.nome === 'B');
        const groupC = groups.find(g => g.nome === 'C');

        // Force Identical Stats for 2nd Place in Group A and Group B
        if (groupA) {
            Simulator.setMatchResult(groupA.matches[0], 6, 2);
            Simulator.setMatchResult(groupA.matches[1], 6, 2);
            Simulator.setMatchResult(groupA.matches[2], 0, 6);
        }
        if (groupB) {
            Simulator.setMatchResult(groupB.matches[0], 6, 2);
            Simulator.setMatchResult(groupB.matches[1], 6, 2);
            Simulator.setMatchResult(groupB.matches[2], 0, 6);
        }
        // Fill others
        groups.forEach(g => {
            if (g !== groupA && g !== groupB) {
                g.matches.forEach(m => Simulator.setMatchResult(m, 6, 0));
            }
        });

        localStorage.setItem('beachtennis-tournament', JSON.stringify(tournament));
        console.log("✅ Phase 2 scores injected. Reloading...");
        setTimeout(() => location.reload(), 1000);
    },

    /**
     * STEP 7: Inject Phase 3 Scores (Final)
     */
    fillFinal: () => {
        const tournament = JSON.parse(localStorage.getItem('beachtennis-tournament'));
        if (!tournament) return console.error("❌ No tournament found!");

        const finalGroup = tournament.grupos.find(g => g.fase === 3);
        if (!finalGroup) return console.error("❌ No Final group found!");

        // Assuming 1 match in final for 4 players usually, or 2 players.
        if (finalGroup.matches.length > 0) {
            finalGroup.matches.forEach(m => {
                Simulator.setMatchResult(m, 6, 4);
            });
        }

        localStorage.setItem('beachtennis-tournament', JSON.stringify(tournament));
        console.log("✅ Final scores injected. Reloading...");
        setTimeout(() => location.reload(), 1000);
    },

    // Standard scoring helper
    setMatchResult: (match, gamesA, gamesB) => {
        match.sets = [{
            gamesA, gamesB, tieBreakA: 0, tieBreakB: 0
        }];
        match.setsWonA = gamesA > gamesB ? 1 : 0;
        match.setsWonB = gamesB > gamesA ? 1 : 0;
        match.isFinished = true;
    }
};

// Expose to window
window.Simulator = Simulator;
console.log(`
🎾 Beach Tennis Simulator Loaded!
Available commands:
   Simulator.setup(24)     -> Clears LS, creates 24 players/Groups
   Simulator.fillPhase1()  -> Fills Phase 1 matches (Scenario A & B ties)
   Simulator.fillPhase2()  -> Fills Phase 2 matches (Cross-Group tie)
   Simulator.fillFinal()   -> Fills Phase 3 matches (Champion)
`);
