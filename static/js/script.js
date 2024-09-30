let landmarks = [];
let currentPair = [];
let comparisonCount = 0;
const TOTAL_COMPARISONS = 25;

async function fetchLandmarks() {
    const response = await fetch('/api/landmarks');
    landmarks = await response.json();
    selectNewPair();
    updateUI();
}

function selectNewPair() {
    currentPair = landmarks.sort(() => 0.5 - Math.random()).slice(0, 2);
}

function updateUI() {
    const comparisonElement = document.getElementById('comparison');
    comparisonElement.innerHTML = `
        <div class="landmark" onclick="handleChoice(0)">
            <h3>${currentPair[0].name_en}</h3>
            <p>${currentPair[0].states_name_en}</p>
        </div>
        <div class="landmark" onclick="handleChoice(1)">
            <h3>${currentPair[1].name_en}</h3>
            <p>${currentPair[1].states_name_en}</p>
        </div>
    `;

    document.getElementById('progress').textContent = `Comparison ${comparisonCount + 1} of ${TOTAL_COMPARISONS}`;

    updateLeaderboard();
}

async function handleChoice(chosenIndex) {
    const winner = currentPair[chosenIndex];
    const loser = currentPair[1 - chosenIndex];

    const response = await fetch('/api/compare', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            winner_id: winner.id,
            loser_id: loser.id,
        }),
    });

    if (response.ok) {
        comparisonCount++;
        if (comparisonCount < TOTAL_COMPARISONS) {
            await fetchLandmarks();
        } else {
            document.getElementById('comparison').innerHTML = '<h2>Comparisons complete!</h2>';
            updateLeaderboard();
        }
    }
}

function updateLeaderboard() {
    const leaderboardElement = document.getElementById('leaderboard');
    const sortedLandmarks = landmarks.sort((a, b) => b.elo - a.elo).slice(0, 10);
    
    leaderboardElement.innerHTML = '<h2>Leaderboard</h2><ol>' +
        sortedLandmarks.map(landmark => `
            <li>${landmark.name_en} (${landmark.states_name_en}) - ELO: ${Math.round(landmark.elo)}</li>
        `).join('') +
    '</ol>';
}

fetchLandmarks();
