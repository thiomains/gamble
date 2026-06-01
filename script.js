// MEGA SLOT MACHINE - Maximum Dopamine Edition! 🎰💥

// ==================== GAME CONFIG ====================
// DOPAMINE OPTIMIZED WEIGHTS - Mehr kleine Gewinne!
const SYMBOLS = [
    { emoji: '🍒', name: 'cherry', value: 2, weight: 50, color: '#ff4444' },   // Erhöht
    { emoji: '🍋', name: 'lemon', value: 3, weight: 40, color: '#ffff44' },   // Erhöht
    { emoji: '🍇', name: 'grape', value: 4, weight: 35, color: '#8844ff' },    // Erhöht
    { emoji: '🔔', name: 'bell', value: 5, weight: 25, color: '#ffaa00' },     // Erhöht
    { emoji: '💎', name: 'diamond', value: 10, weight: 15, color: '#00ffff' }, // Erhöht
    { emoji: '7️⃣', name: 'seven', value: 50, weight: 8, color: '#ff0000' }    // Erhöht für Jackpot-Chance
];

// Gesamt: 173 (mehr Symbole = bessere Gewinnchance bei 3 gleichen)

const REELS_COUNT = 5;
let SPIN_DURATION = 3500; // Total spin time (staggered stops)
let REEL_STOP_DELAY = 300; // Delay between each reel stopping

// ==================== GAME STATE ====================
let coins = 100;
let currentBet = 100;
let isSpinning = false;
let level = 1;
let xp = 0;
let winStreak = 0;
let totalSpins = 0;
let jackpotCount = 0;
let biggestWin = 0;
let comboMultiplier = 1;
let comboCount = 0;
let autoSpin = false;
let soundEnabled = true;
let lastWinTime = 0;
let spinSpeedMultiplier = 1.0;
let winChanceBoost = 0;
let forcedMatchChance = 0;
let forcedMatchSymbol = null;

// ==================== BET MULTIPLIER ====================
function getBetMultiplier() {
    // Einsatz-Multiplikator für Gewinnberechnung
    // 10 Coins = 0.75 (75% Gewinn)
    // 50 Coins = 0.85 (85% Gewinn)
    // 100 Coins = 1.0 (100% Gewinn)
    // 500 Coins = 2.0 (200% Gewinn)
    // 1000 Coins = 4.0 (400% Gewinn)

    if (currentBet <= 10) return 0.75;
    if (currentBet <= 50) return 0.85;
    if (currentBet <= 100) return 1.0;
    if (currentBet <= 500) return 2.0;
    return 4.0; // currentBet >= 1000
}

// ==================== AUDIO CONTEXT ====================
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new AudioContext();
    }
}

// Sound Effects
function playSound(type) {
    if (!soundEnabled || !audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    switch(type) {
        case 'spin':
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(200, now);
            oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            oscillator.start(now);
            oscillator.stop(now + 0.1);
            break;

        case 'tick':
            // Mechanical tick sound for reels
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(800 + Math.random() * 400, now);
            gainNode.gain.setValueAtTime(0.03, now);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.02);
            oscillator.start(now);
            oscillator.stop(now + 0.02);
            break;

        case 'stop':
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(800, now);
            oscillator.frequency.exponentialRampToValueAtTime(400, now + 0.1);
            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
            oscillator.start(now);
            oscillator.stop(now + 0.15);
            break;

        case 'win':
            // Arpeggio
            [440, 554, 659, 880].forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.type = 'sine';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0, now + i * 0.1);
                gain.gain.linearRampToValueAtTime(0.15, now + i * 0.1 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.3);
                osc.start(now + i * 0.1);
                osc.stop(now + i * 0.1 + 0.3);
            });
            break;

        case 'bigwin':
            // Power chord
            [220, 330, 440, 550].forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.type = i % 2 === 0 ? 'sawtooth' : 'square';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0, now + i * 0.05);
                gain.gain.linearRampToValueAtTime(0.2, now + i * 0.05 + 0.02);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 2);
                osc.start(now + i * 0.05);
                osc.stop(now + 2);
            });
            break;

        case 'jackpot':
            // Fanfare
            [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98, 2093.00].forEach((freq, i) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.type = 'square';
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0, now + i * 0.15);
                gain.gain.linearRampToValueAtTime(0.25, now + i * 0.15 + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);
                osc.start(now + i * 0.15);
                osc.stop(now + i * 0.15 + 0.4);
            });
            break;
    }
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    initAudio();
    loadGameState();
    updateUI();
    createBackgroundParticles();
    checkDailyBonus();
    selectBet(100);

    // Initialize reel strips
    initializeReels();

    // Click anywhere to init audio
    document.addEventListener('click', () => {
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }, { once: true });
});

// ==================== LOCAL STORAGE ====================
function loadGameState() {
    const saved = localStorage.getItem('megaSlots_v2');
    if (saved) {
        const data = JSON.parse(saved);
        coins = data.coins ?? 100;
        level = data.level ?? 1;
        xp = data.xp ?? 0;
        totalSpins = data.totalSpins ?? 0;
        jackpotCount = data.jackpotCount ?? 0;
        biggestWin = data.biggestWin ?? 0;
        winStreak = data.winStreak ?? 0;
    }
}

function saveGameState() {
    const data = {
        coins,
        level,
        xp,
        totalSpins,
        jackpotCount,
        biggestWin,
        winStreak,
        lastSave: Date.now()
    };
    localStorage.setItem('megaSlots_v2', JSON.stringify(data));
}

// ==================== REEL INITIALIZATION ====================
function initializeReels() {
    for (let i = 1; i <= REELS_COUNT; i++) {
        const reel = document.getElementById(`reel${i}`);
        if (reel) {
            // Create reel inner container
            const inner = document.createElement('div');
            inner.className = 'reel-inner';
            inner.id = `reelInner${i}`;

            // Create strip with random symbols
            for (let j = 0; j < 20; j++) {
                const symbol = getRandomSymbol();
                const symbolDiv = document.createElement('div');
                symbolDiv.className = 'symbol';
                symbolDiv.textContent = symbol.emoji;
                inner.appendChild(symbolDiv);
            }

            // Reset any previous animations
            inner.style.animation = 'none';
            inner.style.transform = 'translateY(0)';

            reel.innerHTML = '';
            reel.appendChild(inner);
        }
    }
}

// ==================== GAME FUNCTIONS ====================
function getRandomSymbol(useForced = true) {
    // Wenn forcedMatch aktiv ist und useForced erlaubt, gib das Symbol zurück
    if (useForced && forcedMatchSymbol) {
        return forcedMatchSymbol;
    }

    // Gewinnchance massiv erhöhen bei niedrigen Einsätzen
    // Niedriger Einsatz = viel mehr hochwertige Symbole
    // Bei 10 Coins: ~60% Chance auf 3+ gleiche Symbole
    // Bei 1000 Coins: Basis-Chance (sehr niedrig)

    const lowBet = 10;
    const highBet = 1000;
    const factor = (highBet - currentBet) / (highBet - lowBet); // 1 bei 10, 0 bei 1000

    // Aggressiver Boost für hochwertige Symbole bei niedrigen Einsätzen
    // Faktor 15 statt 3, und invertierte Logik für niedrigwertige
    const adjustedSymbols = SYMBOLS.map((s, index) => {
        let newWeight = s.weight;

        if (factor > 0) {
            // Hochwertige Symbole (hinten im Array) massiv boosten
            const highValueBoost = factor * (index + 1) * 15;
            newWeight = s.weight + highValueBoost;

            // Niedrigwertige Symbole (vorne im Array) etwas reduzieren
            if (index < 2) {
                newWeight = Math.max(5, s.weight * (1 - factor * 0.3));
            }
        }

        // DEBUG: Zusätzlicher Win-Boost (globale Gewinnchance)
        if (winChanceBoost > 0 && index >= 2) {
            const boost = (winChanceBoost / 100) * (index + 1) * 10;
            newWeight += boost;
        }

        return { ...s, weight: newWeight };
    });

    const totalWeight = adjustedSymbols.reduce((sum, s) => sum + s.weight, 0);
    let random = Math.random() * totalWeight;

    for (const symbol of adjustedSymbols) {
        random -= symbol.weight;
        if (random <= 0) {
            return symbol;
        }
    }
    return SYMBOLS[0];
}

function selectBet(amount) {
    if (isSpinning) return;

    currentBet = amount;

    document.querySelectorAll('.bet-btn').forEach(btn => {
        btn.classList.remove('active');
        if (parseInt(btn.dataset.bet) === amount) {
            btn.classList.add('active');
        }
    });

    playSound('spin');
}

async function spin() {
    if (isSpinning) return;
    if (coins < currentBet) {
        showResult('❌ NICHT GENUG COINS!', 'error');
        shakeElement(document.getElementById('coinBox'));
        return;
    }

    initAudio();
    isSpinning = true;
    totalSpins++;

    // Deduct bet
    coins -= currentBet;
    saveGameState();
    updateCoinDisplay();

    // Disable spin button
    const spinBtn = document.getElementById('spinBtn');
    spinBtn.disabled = true;

    // Pull lever animation
    const lever = document.getElementById('lever');
    lever.classList.add('pulled');
    setTimeout(() => lever.classList.remove('pulled'), 500 / spinSpeedMultiplier);

    // Show spinning message
    showResult('🎰 DIE WALZEN DREHEN...', 'spinning');

    // Frame lights animation
    document.querySelectorAll('.frame-light').forEach(light => {
        light.classList.add('active');
    });

    // DEBUG: Forced Match vorbereiten
    forcedMatchSymbol = null;
    if (forcedMatchChance > 0 && Math.random() * 100 < forcedMatchChance) {
        forcedMatchSymbol = getRandomSymbol(false); // Symbol ohne forcedMatch-Logik wählen
    }

    // Generate results
    const results = [];
    for (let i = 0; i < REELS_COUNT; i++) {
        results.push(getRandomSymbol());
    }

    // Start ALL reels spinning simultaneously
    const reels = [];

    for (let i = 1; i <= REELS_COUNT; i++) {
        const reel = document.getElementById(`reel${i}`);
        const inner = document.getElementById(`reelInner${i}`);

        // Reset animation state
        inner.style.animation = 'none';
        inner.style.transition = 'none';
        inner.offsetHeight; // Force reflow
        inner.style.transform = 'translateY(0)';

        // Create long spinning strip
        let html = '';
        for (let j = 0; j < 30; j++) {
            html += `<div class="symbol">${getRandomSymbol(false).emoji}</div>`;
        }
        inner.innerHTML = html;

        reels.push({ reel, inner });
        reel.classList.add('spinning');

        // Start spinning animation for all reels at once
        inner.style.animation = `reelSpin 0.08s linear infinite`;
    }

    playSound('spin');

    // Let all reels spin for a moment (skaliert mit Speed)
    await delay(800 / spinSpeedMultiplier);

    // Stop reels one by one with realistic deceleration
    for (let i = 0; i < REELS_COUNT; i++) {
        const { reel, inner } = reels[i];
        const result = results[i];

        // Stop this reel with bounce effect
        await stopReelWithBounce(inner, result, i);

        reel.classList.remove('spinning');
        playSound('stop');

        // Delay before stopping next reel (skaliert mit Speed)
        if (i < REELS_COUNT - 1) {
            await delay((300 + Math.random() * 100) / spinSpeedMultiplier);
        }
    }

    // Wait for animations to finish (skaliert mit Speed)
    await delay(500 / spinSpeedMultiplier);

    // Check for wins
    const winData = calculateWin(results);

    // Update debug panel
    updateDebugPanel(results, winData);

    if (winData.amount > 0) {
        handleWin(winData, results);
    } else {
        handleLoss();
    }

    // Stop frame lights
    document.querySelectorAll('.frame-light').forEach(light => {
        light.classList.remove('active');
    });

    isSpinning = false;
    spinBtn.disabled = false;

    // Auto spin (skaliert mit Speed)
    if (autoSpin && coins >= currentBet) {
        setTimeout(() => spin(), 1000 / spinSpeedMultiplier);
    }
}

// ==================== REALISTIC REEL STOP ====================
async function stopReelWithBounce(inner, result, reelIndex) {
    return new Promise(resolve => {
        // Stop the infinite spin animation
        inner.style.animation = 'none';

        // Create final strip with result symbol in the middle
        // Show 3 symbols: one above (random), the result in middle, one below (random)
        const prevSymbol = getRandomSymbol(false);
        const nextSymbol = getRandomSymbol(false);

        // Create a spinning strip that ends at the result
        let html = '';
        // Add some spinning symbols first for the slowdown effect
        const slowdownSymbols = 8 + Math.floor(Math.random() * 3);
        for (let j = 0; j < slowdownSymbols; j++) {
            html += `<div class="symbol">${getRandomSymbol(false).emoji}</div>`;
        }
        // Then add the final result position
        html += `<div class="symbol">${prevSymbol.emoji}</div>`;
        html += `<div class="symbol winner">${result.emoji}</div>`;
        html += `<div class="symbol">${nextSymbol.emoji}</div>`;

        inner.innerHTML = html;

        // Calculate total height to spin through
        const totalSymbols = slowdownSymbols + 3;
        const symbolHeight = window.innerWidth <= 768 ? 90 : 140; // Responsive for mobile
        const totalHeight = totalSymbols * symbolHeight;

        // Start position: show the result symbol in center
        // We want the result (index slowdownSymbols + 1) to be in the visible area
        const resultIndex = slowdownSymbols + 1; // 0-indexed position of result
        const targetPosition = -resultIndex * symbolHeight; // Show the result symbol

        // Animate to final position with bounce
        inner.style.transition = 'none';
        inner.style.transform = 'translateY(0)';
        inner.offsetHeight; // Force reflow

        // Skalierte Dauer für Tick-Sounds und Animation
        const tickDelay = Math.max(10, 50 / spinSpeedMultiplier);
        const animDuration = Math.max(50, (600 + reelIndex * 80) / spinSpeedMultiplier);
        const resolveDelay = Math.max(50, (700 + reelIndex * 80) / spinSpeedMultiplier);

        // Play tick sounds during slowdown
        let tickCount = 0;
        const tickInterval = setInterval(() => {
            if (tickCount < 5) {
                playSound('tick');
                tickCount++;
            } else {
                clearInterval(tickInterval);
            }
        }, tickDelay);

        // Start the slowdown animation
        requestAnimationFrame(() => {
            inner.style.transition = `transform ${animDuration}ms cubic-bezier(0.15, 0.8, 0.2, 1)`;
            inner.style.transform = `translateY(${targetPosition}px)`;
        });

        // Resolve after animation completes
        setTimeout(() => {
            clearInterval(tickInterval);
            inner.style.transition = '';
            resolve();
        }, resolveDelay);
    });
}

function calculateWin(results) {
    // Check for consecutive matching symbols anywhere in the reel
    // Find the longest consecutive sequence of same symbols

    let bestWin = { amount: 0, symbol: null, count: 0 };

    for (let startIndex = 0; startIndex < results.length; startIndex++) {
        const startSymbol = results[startIndex];
        let consecutiveCount = 1;

        // Count consecutive matches from this position
        for (let i = startIndex + 1; i < results.length; i++) {
            if (results[i].name === startSymbol.name) {
                consecutiveCount++;
            } else {
                break;
            }
        }

        // Only consider if at least 3 consecutive
        if (consecutiveCount >= 3 && consecutiveCount > bestWin.count) {
            bestWin = {
                symbol: startSymbol,
                count: consecutiveCount,
                startIndex: startIndex
            };
        }
    }

    // No win found
    if (bestWin.count < 3) {
        return { amount: 0, symbol: null, count: 0 };
    }

    const symbol = bestWin.symbol;
    let multiplier = 0;

    if (bestWin.count === 3) {
        multiplier = symbol.value;
    } else if (bestWin.count === 4) {
        multiplier = symbol.value * 5;
    } else if (bestWin.count === 5) {
        // Special mega jackpot for 5 sevens
        if (symbol.name === 'seven') {
            multiplier = 100; // MEGA JACKPOT
        } else {
            multiplier = symbol.value * 10;
        }
    }

    const betMultiplier = getBetMultiplier();
    const winAmount = currentBet * multiplier * comboMultiplier * betMultiplier;

    return {
        amount: winAmount,
        symbol: symbol,
        count: bestWin.count,
        startIndex: bestWin.startIndex
    };
}

function handleWin(winData, results) {
    const { amount, symbol, count } = winData;

    // Update stats
    coins += amount;
    winStreak++;

    if (amount > biggestWin) {
        biggestWin = amount;
    }

    // XP gain
    const xpGain = Math.floor(amount / 10) + (winStreak * 5);
    addXP(xpGain);

    // Update combo
    comboCount++;
    if (comboCount >= 3) {
        comboMultiplier = Math.min(1 + (comboCount - 2) * 0.5, 5);
        showHotStreak();
    }

    // Highlight winning reels
    highlightWinningReels(results, count, winData.startIndex);

    // Show win line
    document.querySelector('.win-line').classList.add('active');
    setTimeout(() => document.querySelector('.win-line').classList.remove('active'), 3000);

    // Determine win type
    const isJackpot = count === 5 && symbol?.name === 'seven';
    const isBigWin = amount >= currentBet * 20;

    if (isJackpot) {
        jackpotCount++;
        playSound('jackpot');
        showJackpot(amount);
        createScreenFlash();
        createGoldRain();
    } else if (isBigWin) {
        playSound('bigwin');
        showBigWin(amount);
        createConfetti();
    } else {
        playSound('win');
        showResult(`✨ GEWONNEN! +${amount.toLocaleString()} Coins`, 'win');
        createFloatingText(`+${amount.toLocaleString()}`, window.innerWidth / 2, window.innerHeight / 2);
    }

    // Screen shake for big wins
    if (amount >= currentBet * 10) {
        document.body.classList.add('screen-shake');
        setTimeout(() => document.body.classList.remove('screen-shake'), 500);
    }

    // Add to last wins
    addToLastWins(amount, count);

    // Save
    saveGameState();
    updateUI();

    // Animate coin box
    const coinBox = document.getElementById('coinBox');
    coinBox.style.animation = 'none';
    coinBox.offsetHeight;
    coinBox.style.animation = 'coinPulse 0.5s ease-in-out';
}

function handleLoss() {
    winStreak = 0;
    comboCount = 0;
    comboMultiplier = 1;
    hideHotStreak();

    showResult('💨 Kein Gewinn. Versuch es nochmal!', 'lose');
    saveGameState();
    updateUI();
}

function highlightWinningReels(results, matchCount, startIndex = 0) {
    // Highlight the winning consecutive reels starting from startIndex
    for (let i = 0; i < matchCount; i++) {
        const reel = document.getElementById(`reel${startIndex + i + 1}`);
        reel.classList.add('winning');
        setTimeout(() => reel.classList.remove('winning'), 3000);
    }
}

// ==================== UI FUNCTIONS ====================
function updateUI() {
    updateCoinDisplay();
    updateLevelDisplay();
    updateStatsDisplay();
    updateComboDisplay();
}

function updateCoinDisplay() {
    const coinAmount = document.getElementById('coinAmount');
    coinAmount.textContent = coins.toLocaleString();
}

function updateLevelDisplay() {
    document.getElementById('levelNum').textContent = level;
    document.getElementById('currentXP').textContent = xp;
    const nextLevelXP = level * 100;
    document.getElementById('nextLevelXP').textContent = nextLevelXP;

    const xpFill = document.getElementById('xpFill');
    xpFill.style.width = `${(xp / nextLevelXP) * 100}%`;
}

function updateStatsDisplay() {
    document.getElementById('winStreak').textContent = winStreak;
    document.getElementById('totalSpins').textContent = totalSpins.toLocaleString();
    document.getElementById('jackpotCount').textContent = jackpotCount;
    document.getElementById('biggestWin').textContent = biggestWin.toLocaleString();
}

function updateComboDisplay() {
    const comboDisplay = document.getElementById('comboDisplay');
    if (comboCount >= 2) {
        comboDisplay.classList.add('active');
        document.getElementById('comboMultiplier').textContent = comboMultiplier.toFixed(1);
        document.getElementById('comboFill').style.width = `${Math.min((comboCount / 10) * 100, 100)}%`;
    } else {
        comboDisplay.classList.remove('active');
    }
}

function showHotStreak() {
    document.getElementById('hotStreak').classList.add('active');
}

function hideHotStreak() {
    document.getElementById('hotStreak').classList.remove('active');
}

function addXP(amount) {
    xp += amount;
    const nextLevelXP = level * 100;

    while (xp >= nextLevelXP) {
        xp -= nextLevelXP;
        level++;
        showLevelUp();
    }

    updateLevelDisplay();
}

function showLevelUp() {
    createFloatingText(`LEVEL UP! ${level}`, window.innerWidth / 2, window.innerHeight / 3);
    createConfetti();
}

function showResult(message, type) {
    const resultText = document.getElementById('resultText');
    const resultDisplay = document.getElementById('resultDisplay');

    resultText.textContent = message;
    resultText.className = 'result-text';
    resultDisplay.classList.remove('win');

    if (type === 'win') {
        resultText.classList.add('win');
        resultDisplay.classList.add('win');
    } else if (type === 'jackpot') {
        resultText.classList.add('jackpot');
    } else if (type === 'error') {
        resultText.style.color = '#ff4444';
    }
}

// ==================== BIG WIN / JACKPOT OVERLAYS ====================
function showBigWin(amount) {
    const overlay = document.getElementById('bigWinOverlay');
    const title = document.getElementById('bigWinTitle');
    const winAmount = document.getElementById('bigWinAmount');

    winAmount.textContent = `+${amount.toLocaleString()}`;
    overlay.classList.add('show');

    // Create stars
    createBigWinStars();

    // Auto close after 3 seconds
    setTimeout(() => {
        overlay.classList.remove('show');
    }, 3000);
}

function createBigWinStars() {
    const container = document.getElementById('bigWinStars');
    container.innerHTML = '';

    for (let i = 0; i < 20; i++) {
        const star = document.createElement('div');
        star.textContent = '⭐';
        star.style.position = 'absolute';
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;
        star.style.fontSize = `${1 + Math.random() * 2}rem`;
        star.style.animation = `starPulse ${0.5 + Math.random()}s ease-in-out infinite alternate`;
        container.appendChild(star);
    }
}

function showJackpot(amount) {
    const overlay = document.getElementById('jackpotOverlay');
    const jackpotAmount = document.getElementById('jackpotAmount');

    jackpotAmount.textContent = `+${amount.toLocaleString()}`;
    overlay.classList.add('show');

    createJackpotCoins();
}

function closeJackpotOverlay() {
    document.getElementById('jackpotOverlay').classList.remove('show');
}

function createJackpotCoins() {
    const container = document.getElementById('jackpotCoins');
    container.innerHTML = '';

    for (let i = 0; i < 50; i++) {
        setTimeout(() => {
            const coin = document.createElement('div');
            coin.textContent = ['💰', '💎', '🪙', '⭐'][Math.floor(Math.random() * 4)];
            coin.className = 'gold-coin';
            coin.style.left = `${Math.random() * 100}%`;
            coin.style.top = '-50px';
            coin.style.fontSize = `${1.5 + Math.random()}rem`;
            coin.style.animationDuration = `${2 + Math.random() * 3}s`;
            container.appendChild(coin);

            setTimeout(() => coin.remove(), 5000);
        }, i * 50);
    }
}

// ==================== VISUAL EFFECTS ====================
function createBackgroundParticles() {
    const container = document.getElementById('bgParticles');

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'bg-particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 10}s`;
        particle.style.animationDuration = `${8 + Math.random() * 4}s`;
        container.appendChild(particle);
    }
}

function createConfetti() {
    const colors = ['#ffd700', '#ff4444', '#44ff44', '#4444ff', '#ff44ff', '#00ffff'];

    for (let i = 0; i < 80; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.className = 'particle';
            confetti.style.cssText = `
                position: fixed;
                width: ${8 + Math.random() * 8}px;
                height: ${8 + Math.random() * 8}px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * 100}vw;
                top: -20px;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                z-index: 9999;
            `;
            confetti.style.animationDuration = `${3 + Math.random() * 2}s`;
            document.body.appendChild(confetti);

            setTimeout(() => confetti.remove(), 5000);
        }, i * 20);
    }
}

function createGoldRain() {
    for (let i = 0; i < 100; i++) {
        setTimeout(() => {
            const coin = document.createElement('div');
            coin.textContent = ['💰', '💎', '🪙'][Math.floor(Math.random() * 3)];
            coin.style.cssText = `
                position: fixed;
                left: ${Math.random() * 100}vw;
                top: -50px;
                font-size: ${1.5 + Math.random()}rem;
                z-index: 9998;
                animation: goldRainFall ${2 + Math.random() * 2}s linear forwards;
            `;
            document.body.appendChild(coin);

            setTimeout(() => coin.remove(), 4000);
        }, i * 30);
    }
}

function createScreenFlash() {
    const flash = document.getElementById('screenFlash');
    flash.classList.add('active');
    setTimeout(() => flash.classList.remove('active'), 300);
}

function createFloatingText(text, x, y) {
    const container = document.getElementById('floatingTextContainer');
    const el = document.createElement('div');
    el.className = 'floating-text';
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = 'translate(-50%, -50%)';
    container.appendChild(el);

    setTimeout(() => el.remove(), 2000);
}

function shakeElement(element) {
    element.style.animation = 'none';
    element.offsetHeight;
    element.style.animation = 'shake 0.5s ease-in-out';
}

function addToLastWins(amount, count) {
    const list = document.getElementById('lastWinsList');
    const item = document.createElement('div');
    item.className = 'last-win-item';
    item.innerHTML = `
        <span class="last-win-amount">+${amount.toLocaleString()}</span>
        <span class="last-win-multiplier">${count}x</span>
    `;
    list.insertBefore(item, list.firstChild);

    // Keep only last 5
    while (list.children.length > 5) {
        list.removeChild(list.lastChild);
    }
}

// ==================== CONTROLS ====================
function togglePaytable() {
    const paytable = document.getElementById('paytable');
    const toggle = document.querySelector('.paytable-toggle');

    paytable.classList.toggle('open');
    toggle.classList.toggle('open');
}

function toggleAutoSpin() {
    autoSpin = !autoSpin;
    const btn = document.querySelector('.control-btn');
    const icon = document.getElementById('autoSpinIcon');
    const text = document.getElementById('autoSpinText');

    btn.classList.toggle('active', autoSpin);
    icon.textContent = autoSpin ? '⏸️' : '▶️';
    text.textContent = autoSpin ? 'Auto: ON' : 'Auto Spin';
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const icon = document.getElementById('soundIcon');
    const text = document.getElementById('soundText');

    icon.textContent = soundEnabled ? '🔊' : '🔇';
    text.textContent = soundEnabled ? 'Sound ON' : 'Sound OFF';
}

function resetCoins() {
    if (confirm('🔄 Coins auf 100 zurücksetzen?')) {
        coins = 100;
        level = 1;
        xp = 0;
        winStreak = 0;
        comboCount = 0;
        comboMultiplier = 1;
        totalSpins = 0;
        jackpotCount = 0;
        biggestWin = 0;

        saveGameState();
        updateUI();
        showResult('🎉 Coins zurückgesetzt! Los geht\'s!', '');
    }
}

// ==================== DAILY BONUS ====================
function checkDailyBonus() {
    const lastClaim = localStorage.getItem('lastDailyBonus');
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    if (!lastClaim || now - parseInt(lastClaim) > oneDay) {
        document.getElementById('dailyBonus').classList.add('show');
    }
}

function claimDailyBonus() {
    coins += 50;
    localStorage.setItem('lastDailyBonus', Date.now().toString());
    document.getElementById('dailyBonus').classList.remove('show');

    createFloatingText('+50 DAILY BONUS!', window.innerWidth / 2, window.innerHeight / 2);
    createConfetti();
    saveGameState();
    updateCoinDisplay();
}

// ==================== UTILITY ====================
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ==================== DEBUG ====================
let debugVisible = false;

function toggleDebug() {
    debugVisible = !debugVisible;
    document.getElementById('debugPanel').style.display = debugVisible ? 'block' : 'none';
    if (debugVisible) {
        refreshDebugValues();
    }
}

function refreshDebugValues() {
    document.getElementById('dbgCoins').value = coins;
    document.getElementById('dbgLevel').value = level;
    document.getElementById('dbgXP').value = xp;
    document.getElementById('dbgWinStreak').value = winStreak;
    document.getElementById('dbgTotalSpins').value = totalSpins;
    document.getElementById('dbgJackpotCount').value = jackpotCount;
    document.getElementById('dbgBiggestWin').value = biggestWin;
    document.getElementById('dbgComboCount').value = comboCount;
    document.getElementById('dbgComboMultiplier').value = comboMultiplier;
    document.getElementById('dbgBet').value = currentBet;
    document.getElementById('dbgSpinDuration').value = SPIN_DURATION;
    document.getElementById('dbgReelStopDelay').value = REEL_STOP_DELAY;
    document.getElementById('dbgAutoSpin').checked = autoSpin;
    document.getElementById('dbgSound').checked = soundEnabled;

    // Spin & Chancen Slider
    const spinSpeedInput = document.getElementById('dbgSpinSpeed');
    if (spinSpeedInput) {
        spinSpeedInput.value = spinSpeedMultiplier;
        document.getElementById('dbgSpinSpeedVal').textContent = spinSpeedMultiplier.toFixed(1) + 'x';
    }
    const winBoostInput = document.getElementById('dbgWinBoost');
    if (winBoostInput) {
        winBoostInput.value = winChanceBoost;
        document.getElementById('dbgWinBoostVal').textContent = winChanceBoost + '%';
    }
    const matchChanceInput = document.getElementById('dbgMatchChance');
    if (matchChanceInput) {
        matchChanceInput.value = forcedMatchChance;
        document.getElementById('dbgMatchChanceVal').textContent = forcedMatchChance + '%';
    }

    SYMBOLS.forEach((s, i) => {
        const valInput = document.getElementById(`dbgVal${i}`);
        const wgtInput = document.getElementById(`dbgWgt${i}`);
        if (valInput) valInput.value = s.value;
        if (wgtInput) wgtInput.value = s.weight;
    });
}

// ---- DEBUG SETTERS ----
function dbgSetCoins(v) { coins = parseInt(v) || 0; updateUI(); }
function dbgSetLevel(v) { level = parseInt(v) || 1; updateUI(); }
function dbgSetXP(v) { xp = parseInt(v) || 0; updateUI(); }
function dbgSetWinStreak(v) { winStreak = parseInt(v) || 0; updateUI(); }
function dbgSetTotalSpins(v) { totalSpins = parseInt(v) || 0; updateUI(); }
function dbgSetJackpotCount(v) { jackpotCount = parseInt(v) || 0; updateUI(); }
function dbgSetBiggestWin(v) { biggestWin = parseInt(v) || 0; updateUI(); }
function dbgSetComboCount(v) {
    comboCount = parseInt(v) || 0;
    if (comboCount >= 3) {
        comboMultiplier = Math.min(1 + (comboCount - 2) * 0.5, 5);
        showHotStreak();
    } else {
        comboMultiplier = 1;
        hideHotStreak();
    }
    updateUI();
}
function dbgSetComboMultiplier(v) {
    comboMultiplier = parseFloat(v) || 1;
    updateUI();
}
function dbgSetBet(v) {
    const amount = parseInt(v);
    if (amount) selectBet(amount);
}
function dbgSetSpinDuration(v) { SPIN_DURATION = parseInt(v) || 3500; }
function dbgSetReelStopDelay(v) { REEL_STOP_DELAY = parseInt(v) || 300; }
function dbgSetSpinSpeed(v) {
    spinSpeedMultiplier = parseFloat(v) || 1.0;
    const valEl = document.getElementById('dbgSpinSpeedVal');
    if (valEl) valEl.textContent = spinSpeedMultiplier.toFixed(1) + 'x';
}
function dbgSetWinBoost(v) {
    winChanceBoost = parseInt(v) || 0;
    const valEl = document.getElementById('dbgWinBoostVal');
    if (valEl) valEl.textContent = winChanceBoost + '%';
}
function dbgSetMatchChance(v) {
    forcedMatchChance = parseInt(v) || 0;
    const valEl = document.getElementById('dbgMatchChanceVal');
    if (valEl) valEl.textContent = forcedMatchChance + '%';
}
function dbgToggleAutoSpin(checked) {
    autoSpin = checked;
    const icon = document.getElementById('autoSpinIcon');
    const text = document.getElementById('autoSpinText');
    if (icon) icon.textContent = autoSpin ? '⏹️' : '▶️';
    if (text) text.textContent = autoSpin ? 'Auto Stop' : 'Auto Spin';
}
function dbgToggleSound(checked) {
    soundEnabled = checked;
    const icon = document.getElementById('soundIcon');
    const text = document.getElementById('soundText');
    if (icon) icon.textContent = soundEnabled ? '🔊' : '🔇';
    if (text) text.textContent = soundEnabled ? 'Sound ON' : 'Sound OFF';
}
function dbgSetSymbolValue(index, v) {
    if (SYMBOLS[index]) SYMBOLS[index].value = parseInt(v) || 1;
}
function dbgSetSymbolWeight(index, v) {
    if (SYMBOLS[index]) SYMBOLS[index].weight = parseInt(v) || 1;
}
function dbgAddCoins(amount) {
    coins += amount;
    updateUI();
    createFloatingText(`+${amount} DEBUG`, window.innerWidth / 2, window.innerHeight / 2);
}
function dbgClearCombo() {
    comboCount = 0;
    comboMultiplier = 1;
    hideHotStreak();
    updateUI();
}
function dbgForceWin() {
    // Setzt alle Gewichtungen auf 0 außer das erste Symbol, damit garantiert 5x 🍒 kommt
    const originalWeights = SYMBOLS.map(s => s.weight);
    SYMBOLS.forEach(s => s.weight = 0);
    SYMBOLS[0].weight = 9999;

    // Spin auslösen
    spin().then(() => {
        // Gewichtungen wiederherstellen
        SYMBOLS.forEach((s, i) => s.weight = originalWeights[i]);
        showResult('🛠️ DEBUG WIN erzwungen!', 'win');
    });
}

function updateDebugPanel(results, winData) {
    // Show results array with emojis
    const emojis = results.map(r => r.emoji).join(' ');
    document.getElementById('debugResults').textContent = emojis;

    // Show symbol names
    const names = results.map(r => r.name).join(', ');
    document.getElementById('debugNames').textContent = names;

    // Show win check result
    if (winData.amount > 0) {
        document.getElementById('debugWin').textContent = `✅ GEWINN - ${winData.symbol.emoji} ${winData.symbol.name}`;
        document.getElementById('debugWin').style.color = '#0f0';
    } else {
        document.getElementById('debugWin').textContent = '❌ Kein Gewinn';
        document.getElementById('debugWin').style.color = '#f44';
    }

    // Show win details
    document.getElementById('debugAmount').textContent = winData.amount > 0 ? winData.amount : '-';
    document.getElementById('debugCount').textContent = winData.count > 0 ? winData.count : '-';
    document.getElementById('debugStart').textContent = winData.startIndex !== undefined ? winData.startIndex : '-';
}

function updateRouletteDebugPanel(randomIndex, result, wheelFinalAngle, ballFinalAngle) {
    const segmentAngle = 360 / ROULETTE_NUMBERS.length;

    document.getElementById('debugRouletteIndex').textContent = randomIndex;
    document.getElementById('debugRouletteNumber').textContent = result.num;
    document.getElementById('debugRouletteColor').textContent = result.color;
    document.getElementById('debugRouletteColor').style.color = result.color === 'red' ? '#e53935' : result.color === 'black' ? '#888' : '#0f0';

    // Wheel final angle (mod 360 for display)
    const wheelAngleMod = ((wheelFinalAngle % 360) + 360) % 360;
    document.getElementById('debugWheelAngle').textContent = `${wheelFinalAngle.toFixed(1)}° (${wheelAngleMod.toFixed(1)}° mod 360)`;

    // Ball always lands at top (0°)
    const ballAngleMod = ((ballFinalAngle % 360) + 360) % 360;
    document.getElementById('debugBallAngle').textContent = `${ballFinalAngle.toFixed(1)}° (${ballAngleMod.toFixed(1)}° final = TOP)`;

    // After wheel rotation clockwise by wheelFinalAngle:
    // Position 0 (top) shows gradient position (360 - wheelFinalAngle) mod 360
    // With wheelFinalAngle = rotations*360 - randomIndex*segmentAngle:
    // Position 0 shows gradient position randomIndex*segmentAngle
    // That's exactly where segment randomIndex is!

    // Calculate which segment is visually at top for verification
    const segmentAtTop = Math.round((segmentAngle * randomIndex) / segmentAngle) % ROULETTE_NUMBERS.length;

    document.getElementById('debugSegmentTop').textContent = `Index ${randomIndex}: ${result.num} (${result.color})`;
    document.getElementById('debugSegmentTop').style.color = result.color === 'red' ? '#e53935' : result.color === 'black' ? '#888' : '#0f0';

    // Ball lands at top, which is where the winning segment should be
    document.getElementById('debugBallLand').textContent = `TOP (0°) - MATCHES!`;
    document.getElementById('debugBallLand').style.color = '#0f0';

    // Visual debug: Update the pointer to show target
    const pointer = document.getElementById('wheelPointer');
    const colorCode = result.color === 'red' ? '#e53935' : result.color === 'black' ? '#888' : '#00ff00';
    pointer.style.color = colorCode;
    pointer.style.textShadow = `0 0 15px ${colorCode}`;
    pointer.title = `Ball lands here: ${result.num} (${result.color})`;
}

function addWheelDebugMarker(targetIndex, segmentAngle) {
    // Legacy function - no longer needed as we use the fixed pointer
}

let wheelNumbersVisible = false;

function toggleWheelNumbers() {
    const wheel = document.getElementById('rouletteWheel');
    const existingNumbers = document.getElementById('wheelNumbers');

    if (existingNumbers) {
        existingNumbers.remove();
        wheelNumbersVisible = false;
        return;
    }

    wheelNumbersVisible = true;
    const segmentAngle = 360 / ROULETTE_NUMBERS.length;
    const radius = 75; // Distance from center

    const numbersContainer = document.createElement('div');
    numbersContainer.id = 'wheelNumbers';
    numbersContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 5;
    `;

    ROULETTE_NUMBERS.forEach((item, index) => {
        const angle = (index * segmentAngle) + (segmentAngle / 2); // Center of segment
        const angleRad = (angle - 90) * Math.PI / 180; // Convert to radians, offset by -90 so 0° is at top

        const x = 100 + radius * Math.cos(angleRad); // Center at 100px (half of 200px wheel)
        const y = 100 + radius * Math.sin(angleRad);

        const numEl = document.createElement('div');
        numEl.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            transform: translate(-50%, -50%);
            font-size: 8px;
            font-weight: bold;
            color: white;
            text-shadow: 0 0 2px black, 0 0 2px black;
            font-family: monospace;
        `;
        numEl.textContent = item.num;
        numEl.title = `Index ${index}: ${item.num} (${item.color})`;
        numbersContainer.appendChild(numEl);
    });

    wheel.appendChild(numbersContainer);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        spin();
    } else if (e.code === 'KeyA') {
        toggleAutoSpin();
    } else if (e.code === 'KeyX') {
        toggleDebug();
    }
});

// Prevent context menu
// document.addEventListener('contextmenu', e => e.preventDefault());

// ==================== ROULETTE GAME ====================
const ROULETTE_NUMBERS = [
    { num: 0, color: 'green' },
    { num: 32, color: 'red' }, { num: 15, color: 'black' }, { num: 19, color: 'red' },
    { num: 4, color: 'black' }, { num: 21, color: 'red' }, { num: 2, color: 'black' },
    { num: 25, color: 'red' }, { num: 17, color: 'black' }, { num: 34, color: 'red' },
    { num: 6, color: 'black' }, { num: 27, color: 'red' }, { num: 13, color: 'black' },
    { num: 36, color: 'red' }, { num: 11, color: 'black' }, { num: 30, color: 'red' },
    { num: 8, color: 'black' }, { num: 23, color: 'red' }, { num: 10, color: 'black' },
    { num: 5, color: 'red' }, { num: 24, color: 'black' }, { num: 16, color: 'red' },
    { num: 33, color: 'black' }, { num: 1, color: 'red' }, { num: 20, color: 'black' },
    { num: 14, color: 'red' }, { num: 31, color: 'black' }, { num: 9, color: 'red' },
    { num: 22, color: 'black' }, { num: 18, color: 'red' }, { num: 29, color: 'black' },
    { num: 7, color: 'red' }, { num: 28, color: 'black' }, { num: 12, color: 'red' },
    { num: 35, color: 'black' }, { num: 3, color: 'red' }, { num: 26, color: 'black' }
];

let rouletteBets = [];
let rouletteHistory = [];
let isRouletteSpinning = false;

function switchGame(game) {
    const slotsSection = document.getElementById('slotsSection');
    const rouletteSection = document.getElementById('rouletteSection');
    const slotsTab = document.getElementById('slotsTab');
    const rouletteTab = document.getElementById('rouletteTab');

    if (game === 'slots') {
        slotsSection.style.display = 'block';
        rouletteSection.style.display = 'none';
        slotsTab.classList.add('active');
        rouletteTab.classList.remove('active');
    } else {
        slotsSection.style.display = 'none';
        rouletteSection.style.display = 'block';
        slotsTab.classList.remove('active');
        rouletteTab.classList.add('active');
    }
}

function placeRouletteBet(type, value) {
    if (isRouletteSpinning) return;
    if (coins < currentBet) {
        showResult('❌ NICHT GENUG COINS!', 'error');
        return;
    }

    // Check if bet already exists
    const existingBet = rouletteBets.find(b => b.type === type && b.value === value);
    if (existingBet) {
        existingBet.amount += currentBet;
    } else {
        rouletteBets.push({ type, value, amount: currentBet });
    }

    coins -= currentBet;
    updateCoinDisplay();
    updateRouletteBetsDisplay();
    highlightBetChip(type, value);

    playSound('spin');
}

function highlightBetChip(type, value) {
    let selector = '';
    if (type === 'number') {
        selector = `[data-bet="${value}"]`;
    } else {
        selector = `[data-bet="${value}"]`;
    }

    const chip = document.querySelector(`.roulette-number${selector}, .roulette-bet${selector}, .roulette-zero${selector}`);
    if (chip) {
        chip.classList.add('selected');
    }
}

function updateRouletteBetsDisplay() {
    const list = document.getElementById('rouletteBetsList');
    const totalEl = document.getElementById('rouletteTotalBet');

    if (rouletteBets.length === 0) {
        list.innerHTML = '<span style="color: #666;">Keine Wetten</span>';
        totalEl.textContent = '0';
        return;
    }

    let html = '';
    let total = 0;

    rouletteBets.forEach(bet => {
        let label = '';
        if (bet.type === 'number') {
            label = `Nr. ${bet.value}`;
        } else if (bet.type === 'color') {
            label = bet.value === 'red' ? '🔴 Rot' : '⚫ Schwarz';
        } else if (bet.type === 'even') {
            label = 'Gerade';
        } else if (bet.type === 'odd') {
            label = 'Ungerade';
        } else if (bet.type === 'range') {
            label = bet.value;
        } else if (bet.type === 'dozen') {
            label = `${bet.value} Dutzend`;
        }

        html += `<span class="bet-chip">${label}: ${bet.amount}</span>`;
        total += bet.amount;
    });

    list.innerHTML = html;
    totalEl.textContent = total.toLocaleString();
}

function clearRouletteBets() {
    if (isRouletteSpinning) return;

    // Refund bets
    const totalRefund = rouletteBets.reduce((sum, bet) => sum + bet.amount, 0);
    coins += totalRefund;
    updateCoinDisplay();

    // Clear bets
    rouletteBets = [];
    updateRouletteBetsDisplay();

    // Clear highlights
    document.querySelectorAll('.roulette-number.selected, .roulette-bet.selected, .roulette-zero.selected').forEach(el => {
        el.classList.remove('selected');
    });

    playSound('spin');
}

async function spinRoulette() {
    if (isRouletteSpinning) return;
    if (rouletteBets.length === 0) {
        showResult('❌ Platziere zuerst eine Wette!', 'error');
        return;
    }

    initAudio();
    isRouletteSpinning = true;
    document.getElementById('rouletteSpinBtn').disabled = true;

    // Generate random result
    const randomIndex = Math.floor(Math.random() * ROULETTE_NUMBERS.length);
    const result = ROULETTE_NUMBERS[randomIndex];

    // Get elements
    const wheel = document.getElementById('rouletteWheel');
    const ball = document.getElementById('wheelBall');

    // Reset wheel rotation for consistent animation
    wheel.style.transition = 'none';
    wheel.style.transform = 'rotate(0deg)';
    ball.classList.remove('spinning');
    ball.style.opacity = '0';

    // Force reflow
    wheel.offsetHeight;

    // Calculate rotations
    const wheelRotations = 5 + Math.floor(Math.random() * 3);
    const ballRotations = 6 + Math.floor(Math.random() * 2);

    // Calculate final angles
    // Each number segment on the wheel
    const segmentAngle = 360 / ROULETTE_NUMBERS.length;

    // Wheel spins clockwise, ending with result at top (where ball lands)
    // The winning segment rotates to position 0 (top)
    // When rotating clockwise by A: position 0 shows gradient position (360-A)
    // So to show segment at position randomIndex*segmentAngle: A = 360 - randomIndex*segmentAngle
    const wheelFinalAngle = wheelRotations * 360 - (randomIndex * segmentAngle);

    // Ball spins counter-clockwise and always lands at top (position 0)
    // This is where the winning segment will be after wheel rotation
    const ballFinalAngle = -(ballRotations * 360);

    // Debug output
    updateRouletteDebugPanel(randomIndex, result, wheelFinalAngle, ballFinalAngle);

    // Apply animations
    wheel.style.transition = 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)';
    wheel.style.transform = `rotate(${wheelFinalAngle}deg)`;

    // Animate ball - orbit around wheel edge
    ball.style.opacity = '1';
    ball.style.animation = 'none';
    ball.offsetHeight; // Force reflow

    // Set up ball animation with CSS custom property
    const ballOrbitRadius = 90; // Distance from center (slightly less than wheel radius)
    ball.style.setProperty('--ball-radius', `${ballOrbitRadius}px`);
    ball.style.setProperty('--ball-end-angle', `${ballFinalAngle}deg`);
    ball.style.animation = `ballOrbit 4s cubic-bezier(0.17, 0.67, 0.12, 0.99) forwards`;

    playSound('spin');

    // Wait for animation
    await delay(4000);

    // Show result
    const resultEl = document.getElementById('rouletteResult');
    resultEl.textContent = `${result.num} ${result.color === 'red' ? '🔴' : result.color === 'black' ? '⚫' : '🟢'}`;
    resultEl.className = `roulette-result ${result.color}`;

    // Calculate winnings
    const winnings = calculateRouletteWinnings(result);

    if (winnings > 0) {
        coins += winnings;
        playSound('win');
        showResult(`✨ GEWONNEN! +${winnings.toLocaleString()} Coins`, 'win');
        createFloatingText(`+${winnings.toLocaleString()}`, window.innerWidth / 2, window.innerHeight / 2);

        if (winnings >= 500) {
            createConfetti();
        }
    } else {
        playSound('stop');
        showResult('💨 Kein Gewinn. Versuch es nochmal!', 'lose');
    }

    // Add to history
    rouletteHistory.unshift(result);
    if (rouletteHistory.length > 10) {
        rouletteHistory.pop();
    }
    updateRouletteHistory();

    // Clear bets
    rouletteBets = [];
    updateRouletteBetsDisplay();

    // Clear highlights
    document.querySelectorAll('.roulette-number.selected, .roulette-bet.selected, .roulette-zero.selected').forEach(el => {
        el.classList.remove('selected');
    });

    saveGameState();
    updateUI();

    isRouletteSpinning = false;
    document.getElementById('rouletteSpinBtn').disabled = false;
}

function calculateRouletteWinnings(result) {
    let totalWinnings = 0;

    rouletteBets.forEach(bet => {
        let won = false;
        let multiplier = 0;

        switch (bet.type) {
            case 'number':
                if (bet.value === result.num) {
                    won = true;
                    multiplier = 36; // 35:1 + original bet
                }
                break;
            case 'color':
                if (bet.value === result.color) {
                    won = true;
                    multiplier = 2;
                }
                break;
            case 'even':
                if (result.num !== 0 && result.num % 2 === 0) {
                    won = true;
                    multiplier = 2;
                }
                break;
            case 'odd':
                if (result.num !== 0 && result.num % 2 === 1) {
                    won = true;
                    multiplier = 2;
                }
                break;
            case 'range':
                if (bet.value === '1-18' && result.num >= 1 && result.num <= 18) {
                    won = true;
                    multiplier = 2;
                } else if (bet.value === '19-36' && result.num >= 19 && result.num <= 36) {
                    won = true;
                    multiplier = 2;
                }
                break;
            case 'dozen':
                if (bet.value === '1st' && result.num >= 1 && result.num <= 12) {
                    won = true;
                    multiplier = 3;
                } else if (bet.value === '2nd' && result.num >= 13 && result.num <= 24) {
                    won = true;
                    multiplier = 3;
                } else if (bet.value === '3rd' && result.num >= 25 && result.num <= 36) {
                    won = true;
                    multiplier = 3;
                }
                break;
        }

        if (won) {
            totalWinnings += bet.amount * multiplier;
        }
    });

    return totalWinnings;
}

function updateRouletteHistory() {
    const container = document.getElementById('rouletteHistory');
    container.innerHTML = '';

    rouletteHistory.forEach(entry => {
        const numEl = document.createElement('div');
        numEl.className = `history-number ${entry.color}`;
        numEl.textContent = entry.num;
        container.appendChild(numEl);
    });
}
