const SIZE = 4;
const GAME_OVER_THRESHOLD = 6;
const HOLE_START_TURN = 3;

let board = [];
let danger = null;
let score = 0;
let turn = 0;
let phase = 1;
let bestScore = 0;
let maxTile = 0;
let coins = 0;
let holeInterval = 2;
let touchStartX = 0;
let touchStartY = 0;
let gameStarted = false;
let gamePaused = false;
let equippedSkills = [];
let ownedSkills = [];
let rankings = []; // ランキングデータ

const boardDiv = document.getElementById("board");
const scoreSpan = document.getElementById("score");
const turnSpan = document.getElementById("turn");
let phaseSpan, remainingSpan;

// ===== スキルデータベース =====
const SKILLS_DB = {
    predict_tile: {
        id: "predict_tile",
        name: "🔮 予測表示",
        rarity: "common",
        desc: "次に出現するタイルの数値を表示する",
        icon: "🔮",
        active: false
    },
    predict_hole: {
        id: "predict_hole",
        name: "🎯 消失予告",
        rarity: "common",
        desc: "次に消える床を1ターン前に表示する",
        icon: "🎯",
        active: false
    },
    merge_guide: {
        id: "merge_guide",
        name: "✨ 合体ガイド",
        rarity: "common",
        desc: "合体可能なタイルをハイライト",
        icon: "✨",
        active: false
    },
    vanish_count: {
        id: "vanish_count",
        name: "⏱️ 消失カウント",
        rarity: "common",
        desc: "次の床消失までの残りターン表示",
        icon: "⏱️",
        active: true
    },
    safe_corner: {
        id: "safe_corner",
        name: "🛡️ 安全角",
        rarity: "common",
        desc: "角マスは消失対象にならない",
        icon: "🛡️",
        active: false
    },
    reduce_small: {
        id: "reduce_small",
        name: "📉 小数抑制",
        rarity: "common",
        desc: "2・4タイルの出現率がわずかに下がる",
        icon: "📉",
        active: false
    },
    perfect_hint: {
        id: "perfect_hint",
        name: "🧠 最善手ヒント",
        rarity: "common",
        desc: "スコア効率が最も高い方向を薄く表示",
        icon: "🧠",
        active: false
    },
    merge_sound: {
        id: "merge_sound",
        name: "🔔 合体通知",
        rarity: "common",
        desc: "大きな合体が起きたとき効果音が変化",
        icon: "🔔",
        active: false
    },
    danger_flash: {
        id: "danger_flash",
        name: "🚨 危険警告",
        rarity: "common",
        desc: "次の一手で詰む可能性があると盤面が赤く点滅",
        icon: "🚨",
        active: false
    },
    time_stop: {
        id: "time_stop",
        name: "⏸️ 時間停止",
        rarity: "rare",
        desc: "1ターンだけ床消失を無効化",
        icon: "⏸️",
        uses: 1,
        active: false
    },
    restore_floor: {
        id: "restore_floor",
        name: "🔧 修復",
        rarity: "rare",
        desc: "消えた床を1マス復活",
        icon: "🔧",
        uses: 1,
        active: false
    },
    force_merge: {
        id: "force_merge",
        name: "⚡ 強制合体",
        rarity: "rare",
        desc: "隣接2タイルを任意で合体",
        icon: "⚡",
        uses: 1,
        active: false
    },
    safe_move: {
        id: "safe_move",
        name: "📦 保険移動",
        rarity: "rare",
        desc: "タイル1つを空きマスへ移動",
        icon: "📦",
        uses: 1,
        active: false
    },
    vanish_deny: {
        id: "vanish_deny",
        name: "🛑 消失拒否",
        rarity: "rare",
        desc: "指定マスを次回消失対象から除外",
        icon: "🛑",
        uses: 1,
        active: false
    },
    double_spawn: {
        id: "double_spawn",
        name: "➕ 二重生成",
        rarity: "rare",
        desc: "次のターンだけタイルが2枚生成される",
        icon: "➕",
        uses: 1,
        active: false
    },
    select_spawn: {
        id: "select_spawn",
        name: "🎯 生成指定",
        rarity: "rare",
        desc: "次に生成されるタイルの数値を選べる",
        icon: "🎯",
        uses: 1,
        active: false
    },
    freeze_tile: {
        id: "freeze_tile",
        name: "❄️ 凍結",
        rarity: "rare",
        desc: "指定タイルを3ターン動かなくする",
        icon: "❄️",
        uses: 1,
        active: false
    },
    stable_gen: {
        id: "stable_gen",
        name: "📈 安定生成",
        rarity: "epic",
        desc: "8以上が低確率で生成",
        icon: "📈",
        active: false
    },
    merge_bonus: {
        id: "merge_bonus",
        name: "💰 合体効率",
        rarity: "epic",
        desc: "連続合体でスコア倍率上昇",
        icon: "💰",
        active: false
    },
    slow_decay: {
        id: "slow_decay",
        name: "🐢 崩壊遅延",
        rarity: "epic",
        desc: "床消失の間隔が長くなる",
        icon: "🐢",
        active: false
    },
    memory_board: {
        id: "memory_board",
        name: "↩️ 記憶盤面",
        rarity: "epic",
        desc: "直前の1手を巻き戻す",
        icon: "↩️",
        uses: 1,
        active: false
    },
    split_merge: {
        id: "split_merge",
        name: "🧬 分裂合体",
        rarity: "epic",
        desc: "合体時、低確率で同値2枚に分裂",
        icon: "🧬",
        active: false
    },
    focus_gen: {
        id: "focus_gen",
        name: "🔺 集中生成",
        rarity: "epic",
        desc: "同じ数値が連続生成されやすい",
        icon: "🔺",
        active: false
    },
    chain_master: {
        id: "chain_master",
        name: "🔥 連鎖支配",
        rarity: "epic",
        desc: "1手で3回以上合体すると床消失を1回無効化",
        icon: "🔥",
        active: false
    },
    reverse_merge: {
        id: "reverse_merge",
        name: "🔁 逆合体",
        rarity: "epic",
        desc: "同値タイルが隣接していると自動で引き寄せられる",
        icon: "🔁",
        active: false
    },
    last_stand: {
        id: "last_stand",
        name: "⚔️ 最後の一手",
        rarity: "epic",
        desc: "ゲームオーバー直前に1回だけ行動可能",
        icon: "⚔️",
        uses: 1,
        active: false
    }
};

// ===== セーブデータ管理 =====
function saveGameData() {
    const gameData = {
        board: board,
        score: score,
        turn: turn,
        phase: phase,
        bestScore: bestScore,
        maxTile: maxTile,
        coins: coins,
        danger: danger,
        gameStarted: gameStarted,
        gamePaused: gamePaused,
        holeInterval: holeInterval,
        equippedSkills: equippedSkills.map(skill => skill.id),
        ownedSkills: ownedSkills.map(skill => skill.id),
        rankings: rankings,
        lastSaved: new Date().toISOString(),
        version: "1.0"
    };

    try {
        localStorage.setItem("fallingFloor2048_saveData", JSON.stringify(gameData));
        console.log("ゲームデータを保存しました");
    } catch (e) {
        console.error("セーブデータの保存に失敗しました:", e);
    }
}

function loadGameData() {
    try {
        const savedData = localStorage.getItem("fallingFloor2048_saveData");
        if (savedData) {
            const gameData = JSON.parse(savedData);

            board = gameData.board || Array(SIZE).fill().map(() => Array(SIZE).fill(0));
            score = gameData.score || 0;
            turn = gameData.turn || 0;
            phase = gameData.phase || 1;
            bestScore = gameData.bestScore || 0;
            maxTile = gameData.maxTile || 0;
            coins = gameData.coins || 0;
            danger = gameData.danger || null;
            gameStarted = gameData.gameStarted || false;
            gamePaused = gameData.gamePaused || false;
            holeInterval = gameData.holeInterval || 2;
            rankings = gameData.rankings || [];

            if (gameData.equippedSkills && Array.isArray(gameData.equippedSkills)) {
                equippedSkills = gameData.equippedSkills
                    .map(skillId => SKILLS_DB[skillId])
                    .filter(skill => skill);
            }

            if (gameData.ownedSkills && Array.isArray(gameData.ownedSkills)) {
                ownedSkills = gameData.ownedSkills
                    .map(skillId => SKILLS_DB[skillId])
                    .filter(skill => skill);
            }

            console.log("ゲームデータを読み込みました");
            return true;
        }
    } catch (e) {
        console.error("セーブデータの読み込みに失敗しました:", e);
    }
    return false;
}

function initializeFirstTimeBonus() {
    const isFirstTime = !loadGameData();
    if (isFirstTime) {
        coins = 100;
        ownedSkills = [
            SKILLS_DB.predict_tile,
            SKILLS_DB.predict_hole,
            SKILLS_DB.merge_guide,
            SKILLS_DB.safe_corner
        ];
        console.log("初回訪問ボーナス: 100コインと初期スキルを付与しました！");
        saveGameData();
    }
}

// ===== ゲームロジック =====
function init() {
    board = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
    score = 0;
    turn = 0;
    phase = 1;
    spawn();
    spawn();
    spawn();
    updateDanger();
    render();
    saveGameData();
}

function spawn() {
    let empty = [];
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            if (board[y][x] === 0) empty.push({ x, y });
        }
    }
    if (empty.length === 0) return;
    let p = empty[Math.floor(Math.random() * empty.length)];
    
    // スキル: 小数抑制
    const hasReduceSmall = equippedSkills.some(s => s.id === 'reduce_small');
    const spawnRate = hasReduceSmall ? 0.85 : 0.9;
    
    // スキル: 安定生成（8以上が低確率で生成）
    const hasStableGen = equippedSkills.some(s => s.id === 'stable_gen');
    if (hasStableGen && Math.random() < 0.05) {
        const values = [8, 16, 32];
        board[p.y][p.x] = values[Math.floor(Math.random() * values.length)];
        return;
    }
    
    board[p.y][p.x] = Math.random() < spawnRate ? 2 : 4;
}

function updateDanger() {
    let min = Infinity;
    let list = [];

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            let v = board[y][x];
            if (v > 0) {
                // スキル: 安全角（角マスは消失対象外）
                const hasSafeCorner = equippedSkills.some(s => s.id === 'safe_corner');
                if (hasSafeCorner) {
                    const isCorner = (x === 0 && y === 0) || (x === 0 && y === SIZE - 1) ||
                                     (x === SIZE - 1 && y === 0) || (x === SIZE - 1 && y === SIZE - 1);
                    if (isCorner) continue;
                }
                
                if (v < min) {
                    min = v;
                    list = [{ x, y }];
                } else if (v === min) {
                    list.push({ x, y });
                }
            }
        }
    }

    danger = list.length ? list[Math.floor(Math.random() * list.length)] : null;
}

function destroyDanger() {
    if (!danger) return;
    board[danger.y][danger.x] = -1;
}

function move(dir) {
    let moved = false;
    let mergeValues = [];
    let merged = Array.from({ length: SIZE }, () => Array(SIZE).fill(false));

    const dx = dir.x;
    const dy = dir.y;

    const range = [...Array(SIZE).keys()];
    if (dx > 0 || dy > 0) range.reverse();

    for (let i of range) {
        for (let j of range) {
            let x = dx !== 0 ? i : j;
            let y = dy !== 0 ? i : j;
            if (board[y][x] <= 0) continue;

            let nx = x, ny = y;

            while (true) {
                let tx = nx + dx;
                let ty = ny + dy;
                if (tx < 0 || tx >= SIZE || ty < 0 || ty >= SIZE) break;
                if (board[ty][tx] === -1) break;

                if (board[ty][tx] === 0) {
                    board[ty][tx] = board[ny][nx];
                    board[ny][nx] = 0;
                    nx = tx;
                    ny = ty;
                    moved = true;
                } else if (board[ty][tx] === board[ny][nx] && !merged[ty][tx]) {
                    let mergeValue = board[ty][tx] * 2;
                    
                    // スキル: 合体効率（連続合体でスコア倍率上昇）
                    const hasMergeBonus = equippedSkills.some(s => s.id === 'merge_bonus');
                    if (hasMergeBonus && mergeValues.length > 0) {
                        mergeValue = Math.floor(mergeValue * (1 + mergeValues.length * 0.1));
                    }
                    
                    board[ty][tx] = mergeValue;
                    score += mergeValue;
                    board[ny][nx] = 0;
                    merged[ty][tx] = true;
                    moved = true;
                    mergeValues.push(mergeValue);
                    
                    // スキル: 分裂合体（低確率で同値2枚に分裂）
                    const hasSplitMerge = equippedSkills.some(s => s.id === 'split_merge');
                    if (hasSplitMerge && Math.random() < 0.15) {
                        const emptySpots = [];
                        for (let sy = 0; sy < SIZE; sy++) {
                            for (let sx = 0; sx < SIZE; sx++) {
                                if (board[sy][sx] === 0) emptySpots.push({ x: sx, y: sy });
                            }
                        }
                        if (emptySpots.length >= 2) {
                            const halfValue = mergeValue / 2;
                            board[ty][tx] = halfValue;
                            const spot = emptySpots[Math.floor(Math.random() * emptySpots.length)];
                            board[spot.y][spot.x] = halfValue;
                        }
                    }
                    
                    break;
                } else {
                    break;
                }
            }
        }
    }

    return { moved, mergeValues };
}

function turnGame(dir) {
    if (gamePaused) return;
    const result = move(dir);
    if (!result.moved) return;
    
    spawn();

    let coinGain = 1;
    result.mergeValues.forEach(value => {
        if (value >= 1024) {
            coinGain += 10;
        } else if (value >= 512) {
            coinGain += 5;
        } else {
            coinGain += 3;
        }
    });
    coins += coinGain;

    if (score > bestScore) {
        bestScore = score;
        saveGameData();
    }

    // 10ターンごとに穴をリセット
    if (turn % 10 === 0) {
        for (let y = 0; y < SIZE; y++) {
            for (let x = 0; x < SIZE; x++) {
                if (board[y][x] === -1) {
                    board[y][x] = 0;
                }
            }
        }
    }

    // スキル: 崩壊遅延（床消失の間隔が長くなる）
    const hasSlowDecay = equippedSkills.some(s => s.id === 'slow_decay');
    const effectiveInterval = hasSlowDecay ? holeInterval + 1 : holeInterval;

    // スキル: 連鎖支配（3回以上合体で床消失を1回無効化）
    const hasChainMaster = equippedSkills.some(s => s.id === 'chain_master');
    const skipHole = hasChainMaster && result.mergeValues.length >= 3;

    // ターン3以降のみ穴化開始
    if (turn >= HOLE_START_TURN && turn % effectiveInterval === 0 && !skipHole) {
        destroyDanger();
    }

    turn++;

    // 50ターンごとに穴が増える間隔を1増やす
    if (turn % 50 === 0) {
        holeInterval++;
    }

    // Phase上昇判定（10ターンごと）
    if (turn % 10 === 0) phase++;

    // 最大タイル更新
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            if (board[y][x] > maxTile) maxTile = board[y][x];
        }
    }

    // 合法手がない場合はゲームオーバー演出
    if (checkGameOver()) {
        if (score > bestScore) bestScore = score;
        saveGameData();
        // init()を削除 - ゲームオーバー画面から選択させる
    } else {
        updateDanger();
    }

    saveGameData();
    render();
}

function checkGameOver() {
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            if (board[y][x] === 0) return false;
        }
    }

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            if (board[y][x] <= 0) continue;
            if (x < SIZE - 1 && board[y][x] === board[y][x + 1]) return false;
            if (y < SIZE - 1 && board[y][x] === board[y + 1][x]) return false;
        }
    }

    // ゲームオーバー時にランキング登録
    addToRanking(score, maxTile, turn);
    
    // ゲームオーバー演出を表示
    showGameOverScreen();
    
    return true;
}

// ===== ゲームオーバー演出 =====
function showGameOverScreen() {
    const gameOverModal = document.getElementById("gameover-modal");
    if (!gameOverModal) return;
    
    // スコア情報を表示
    const finalScoreSpan = document.getElementById("final-score");
    const finalMaxTileSpan = document.getElementById("final-max-tile");
    const finalTurnSpan = document.getElementById("final-turn");
    const finalCoinsSpan = document.getElementById("final-coins");
    
    if (finalScoreSpan) finalScoreSpan.textContent = score.toLocaleString();
    if (finalMaxTileSpan) finalMaxTileSpan.textContent = maxTile;
    if (finalTurnSpan) finalTurnSpan.textContent = turn;
    if (finalCoinsSpan) finalCoinsSpan.textContent = coins;
    
    // ベストスコア更新チェック
    const newRecordBadge = document.getElementById("new-record-badge");
    if (newRecordBadge) {
        if (score === bestScore && rankings.length > 0) {
            newRecordBadge.style.display = "inline-block";
        } else {
            newRecordBadge.style.display = "none";
        }
    }
    
    gameOverModal.classList.add("show");
}

function continueWithSkills() {
    // ゲームオーバーモーダルを閉じる
    const gameOverModal = document.getElementById("gameover-modal");
    if (gameOverModal) gameOverModal.classList.remove("show");
    
    // スキルメニューを開く
    const skillMenuModal = document.getElementById("skill-menu-modal");
    if (skillMenuModal) {
        skillMenuModal.classList.add("show");
        renderSkillMenu();
    }
}

function restartWithoutSkills() {
    // ゲームオーバーモーダルを閉じる
    const gameOverModal = document.getElementById("gameover-modal");
    if (gameOverModal) gameOverModal.classList.remove("show");
    
    // スキルをそのままでゲーム再開
    init();
}

// ===== ランキング機能 =====
function addToRanking(finalScore, finalMaxTile, finalTurn) {
    const newRecord = {
        score: finalScore,
        maxTile: finalMaxTile,
        turn: finalTurn,
        date: new Date().toLocaleString('ja-JP'),
        skills: equippedSkills.map(s => s.name).join(', ') || 'なし'
    };
    
    rankings.push(newRecord);
    
    // スコア順にソート（降順）
    rankings.sort((a, b) => b.score - a.score);
    
    // TOP 10のみ保持
    rankings = rankings.slice(0, 10);
    
    saveGameData();
}

function showRanking() {
    const modal = document.getElementById("ranking-modal");
    if (!modal) return;
    
    const rankingList = document.getElementById("ranking-list");
    if (!rankingList) return;
    
    rankingList.innerHTML = "";
    
    if (rankings.length === 0) {
        rankingList.innerHTML = "<p style='color: #999; text-align: center;'>まだ記録がありません</p>";
    } else {
        rankings.forEach((record, index) => {
            const rankItem = document.createElement("div");
            rankItem.className = "rank-item";
            if (index < 3) rankItem.classList.add(`rank-${index + 1}`);
            
            const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}位`;
            
            rankItem.innerHTML = `
                <div class="rank-position">${medal}</div>
                <div class="rank-details">
                    <div class="rank-score">スコア: ${record.score.toLocaleString()}</div>
                    <div class="rank-info">
                        最大タイル: ${record.maxTile} | ターン: ${record.turn} | ${record.date}
                    </div>
                    <div class="rank-skills">スキル: ${record.skills}</div>
                </div>
            `;
            
            rankingList.appendChild(rankItem);
        });
    }
    
    modal.classList.add("show");
}

function render() {
    if (!boardDiv || !scoreSpan || !turnSpan) return;
    
    boardDiv.innerHTML = "";
    scoreSpan.textContent = score;
    turnSpan.textContent = turn;

    if (!phaseSpan) phaseSpan = document.getElementById("phase");
    if (!remainingSpan) remainingSpan = document.getElementById("remaining");
    let bestScoreSpan = document.getElementById("bestScore");
    let maxTileSpan = document.getElementById("maxTile");
    let coinsSpan = document.getElementById("coins");
    let skillsDisplay = document.getElementById("equipped-skills-display");

    if (skillsDisplay && gameStarted) {
        skillsDisplay.innerHTML = "";
        if (equippedSkills.length > 0) {
            equippedSkills.forEach((skill) => {
                const badge = document.createElement("div");
                badge.className = "skill-badge";
                badge.title = skill.desc;
                badge.textContent = `${skill.icon} ${skill.name}`;
                skillsDisplay.appendChild(badge);
            });
        } else {
            skillsDisplay.innerHTML = "<p style='color: #999; font-size: 12px; margin: 0;'>スキルなし</p>";
        }
    }

    if (phaseSpan) phaseSpan.textContent = phase;
    if (bestScoreSpan) bestScoreSpan.textContent = bestScore;
    if (maxTileSpan) maxTileSpan.textContent = maxTile > 0 ? maxTile : "-";
    if (coinsSpan) coinsSpan.textContent = coins;

    let validCount = 0;
    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            if (board[y][x] > 0) validCount++;
        }
    }
    
    // スキル: 消失カウント（次の床消失までの残りターン表示）
    const hasVanishCount = equippedSkills.some(s => s.id === 'vanish_count');
    if (remainingSpan) {
        if (hasVanishCount && turn >= HOLE_START_TURN) {
            const hasSlowDecay = equippedSkills.some(s => s.id === 'slow_decay');
            const effectiveInterval = hasSlowDecay ? holeInterval + 1 : holeInterval;
            const remaining = effectiveInterval - (turn % effectiveInterval);
            remainingSpan.textContent = `${SIZE * SIZE - validCount} (次: ${remaining}T)`;
        } else {
            remainingSpan.textContent = SIZE * SIZE - validCount;
        }
    }

    for (let y = 0; y < SIZE; y++) {
        for (let x = 0; x < SIZE; x++) {
            let d = document.createElement("div");
            d.className = "cell";

            if (board[y][x] === -1) {
                d.classList.add("hole");
            } else if (board[y][x] === 0) {
                d.classList.add("empty");
            } else {
                d.textContent = board[y][x];
                d.classList.add("v" + board[y][x]);
                
                // スキル: 合体ガイド（合体可能なタイルをハイライト）
                const hasMergeGuide = equippedSkills.some(s => s.id === 'merge_guide');
                if (hasMergeGuide) {
                    const canMerge = checkCanMerge(x, y);
                    if (canMerge) {
                        d.style.boxShadow = "0 0 10px 2px rgba(255, 215, 0, 0.6)";
                    }
                }
            }

            // スキル: 消失予告（次に消える床を表示）
            const hasPredictHole = equippedSkills.some(s => s.id === 'predict_hole');
            if (hasPredictHole && danger && danger.x === x && danger.y === y) {
                d.classList.add("danger");
                d.style.border = "2px solid #ff6b6b";
            } else if (danger && danger.x === x && danger.y === y) {
                d.classList.add("danger");
            }

            boardDiv.appendChild(d);
        }
    }

    const pauseOverlay = document.getElementById("pause-overlay");
    if (pauseOverlay) {
        if (gamePaused) {
            pauseOverlay.classList.add("show");
        } else {
            pauseOverlay.classList.remove("show");
        }
    }
}

// 合体可能かチェックする補助関数
function checkCanMerge(x, y) {
    const value = board[y][x];
    if (value <= 0) return false;
    
    // 上下左右をチェック
    const directions = [
        { dx: 0, dy: -1 }, // 上
        { dx: 0, dy: 1 },  // 下
        { dx: -1, dy: 0 }, // 左
        { dx: 1, dy: 0 }   // 右
    ];
    
    for (let dir of directions) {
        const nx = x + dir.dx;
        const ny = y + dir.dy;
        if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE) {
            if (board[ny][nx] === value) return true;
        }
    }
    
    return false;
}

// ===== イベントリスナー =====
document.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();

    if (e.key === "ArrowLeft") turnGame({ x: -1, y: 0 });
    if (e.key === "ArrowRight") turnGame({ x: 1, y: 0 });
    if (e.key === "ArrowUp") turnGame({ x: 0, y: -1 });
    if (e.key === "ArrowDown") turnGame({ x: 0, y: 1 });

    if (key === "w") turnGame({ x: 0, y: -1 });
    if (key === "s") turnGame({ x: 0, y: 1 });
    if (key === "a") turnGame({ x: -1, y: 0 });
    if (key === "d") turnGame({ x: 1, y: 0 });

    if (key === "p") toggleRuleModal();
    
    if (key === "g") {
        const gachaModal = document.getElementById("gacha-modal");
        if (gachaModal) {
            gachaModal.classList.add("show");
            const gachaMain = document.getElementById("gacha-main");
            const gachaResult = document.getElementById("gacha-result");
            if (gachaMain) gachaMain.style.display = "block";
            if (gachaResult) gachaResult.classList.add("hidden");
            renderGachaUI();
        }
    }

    if (key === "o") {
        const skillMenuModal = document.getElementById("skill-menu-modal");
        if (skillMenuModal) {
            skillMenuModal.classList.add("show");
            renderSkillMenu();
        }
    }

    if (key === " " || e.key === "Escape") {
        e.preventDefault();
        togglePause();
    }
    
    // R キーでランキング表示
    if (key === "r") {
        showRanking();
    }
});

document.addEventListener("touchstart", e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
});

document.addEventListener("touchend", e => {
    const touchEndX = e.changedTouches[0].clientX;
    const touchEndY = e.changedTouches[0].clientY;
    const dx = touchEndX - touchStartX;
    const dy = touchEndY - touchStartY;
    const threshold = 30;

    if (Math.abs(dx) > threshold && Math.abs(dx) > Math.abs(dy)) {
        turnGame(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
    } else if (Math.abs(dy) > threshold && Math.abs(dy) > Math.abs(dx)) {
        turnGame(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
    }
});

// ===== モーダル制御 =====
function toggleRuleModal() {
    const modal = document.getElementById("ruleModal");
    if (modal) modal.classList.toggle("show");
}

function togglePause() {
    if (!gameStarted) return;

    if (gamePaused) {
        gamePaused = false;
        render();
    } else {
        gamePaused = true;
        showPauseDialog();
    }
}

function showPauseDialog() {
    const continueGame = confirm("反復処理を続行しますか？");
    gamePaused = false;
    render();
}

// ===== ガチャシステム =====
function renderGachaUI() {
    const gachaCoinsSpan = document.getElementById("gacha-coins");
    if (gachaCoinsSpan) gachaCoinsSpan.textContent = coins;
}

function getRandomSkills(count = 3) {
    const allSkills = Object.values(SKILLS_DB);
    const selected = [];

    let commonRate = 70;
    let rareRate = 29;
    let epicRate = 1;

    const hasEpic = equippedSkills.some(skill => skill.rarity === 'epic');
    if (hasEpic) {
        epicRate = 0.1;
        const total = commonRate + rareRate + epicRate;
        commonRate = (commonRate / total) * 100;
        rareRate = (rareRate / total) * 100;
        epicRate = (epicRate / total) * 100;
    }

    for (let i = 0; i < count; i++) {
        const rand = Math.random() * 100;
        let rarity;
        if (rand < commonRate) {
            rarity = 'common';
        } else if (rand < commonRate + rareRate) {
            rarity = 'rare';
        } else {
            rarity = 'epic';
        }

        const raritySkills = allSkills.filter(skill => skill.rarity === rarity);
        if (raritySkills.length > 0) {
            const skill = raritySkills[Math.floor(Math.random() * raritySkills.length)];
            selected.push(skill);
        }
    }

    const epicCount = selected.filter(skill => skill.rarity === 'epic').length;
    if (epicCount > 1) {
        let epicFound = 0;
        for (let i = 0; i < selected.length; i++) {
            if (selected[i].rarity === 'epic') {
                epicFound++;
                if (epicFound > 1) {
                    const commonSkills = allSkills.filter(skill => skill.rarity === 'common');
                    if (commonSkills.length > 0) {
                        selected[i] = commonSkills[Math.floor(Math.random() * commonSkills.length)];
                    }
                }
            }
        }
    }

    return selected;
}

function performGacha() {
    if (coins < 100) {
        alert("コインが足りません！100コイン必要です。");
        return;
    }

    coins -= 100;
    saveGameData();
    renderGachaUI();

    const gachaResult = getRandomSkills(3);

    // まず結果エリアを非表示にして初期化
    const gachaResultDiv = document.getElementById("gacha-result");
    if (gachaResultDiv) gachaResultDiv.classList.add("hidden");

    // カードを空にする
    const cards = document.querySelectorAll(".gacha-card");
    cards.forEach(card => {
        card.textContent = "?";
        delete card.dataset.skillId;
    });

    // ガチャ結果エリアを表示
    if (gachaResultDiv) gachaResultDiv.classList.remove("hidden");

    // 少し待ってから演出開始
    setTimeout(() => {
        // カードを1枚ずつめくる演出
        gachaResult.forEach((skill, idx) => {
            setTimeout(() => {
                if (cards[idx]) {
                    cards[idx].textContent = skill.icon;
                    cards[idx].dataset.skillId = skill.id;
                    // カードにアニメーションクラスを追加（オプション）
                    cards[idx].style.transform = "scale(1.2)";
                    setTimeout(() => {
                        cards[idx].style.transform = "scale(1)";
                    }, 200);
                }
            }, idx * 300); // 0.3秒ずつずらして表示
        });

        // さらに1.5秒後にスキル選択画面へ
        setTimeout(() => {
            const gachaMain = document.getElementById("gacha-main");
            const skillSelection = document.getElementById("skill-selection");
            if (gachaMain) gachaMain.style.display = "none";
            if (skillSelection) {
                skillSelection.classList.remove("hidden");
                renderSkillSelection(gachaResult);
            }
        }, gachaResult.length * 300 + 1500);
    }, 100);
}

function renderSkillSelection(skills) {
    const optionsDiv = document.getElementById("skill-options");
    if (!optionsDiv) return;
    optionsDiv.innerHTML = "";

    skills.forEach((skill) => {
        const optionDiv = document.createElement("div");
        optionDiv.className = "skill-option";
        optionDiv.dataset.skillId = skill.id;

        const infoDiv = document.createElement("div");
        infoDiv.style.flex = "1";
        infoDiv.style.textAlign = "left";

        infoDiv.innerHTML = `
            <div class="skill-name">${skill.icon} ${skill.name}</div>
            <div class="skill-desc">${skill.desc}</div>
        `;

        const rarityDiv = document.createElement("div");
        rarityDiv.className = `skill-rarity rarity-${skill.rarity}`;
        rarityDiv.textContent = skill.rarity.toUpperCase();

        optionDiv.appendChild(infoDiv);
        optionDiv.appendChild(rarityDiv);

        optionDiv.addEventListener("click", () => {
            document.querySelectorAll(".skill-option.selected").forEach(opt => {
                opt.classList.remove("selected");
            });
            optionDiv.classList.add("selected");
            updateEquippedList(skills);
        });

        optionsDiv.appendChild(optionDiv);
    });
}

function updateEquippedList(availableSkills) {
    const selected = document.querySelectorAll(".skill-option.selected");
    equippedSkills = [];

    selected.forEach((opt) => {
        const skillId = opt.dataset.skillId;
        const skill = SKILLS_DB[skillId];
        if (skill) equippedSkills.push(skill);
    });

    renderEquippedList();
}

function renderEquippedList() {
    const list = document.getElementById("equipped-list");
    if (!list) return;
    list.innerHTML = "";

    if (equippedSkills.length === 0) {
        list.innerHTML = "<p style='color: #999;'>スキルが選択されていません</p>";
    } else {
        equippedSkills.forEach((skill) => {
            const item = document.createElement("div");
            item.className = "equipped-item";
            item.innerHTML = `
                <span>${skill.icon} ${skill.name}</span>
                <span class="skill-rarity rarity-${skill.rarity}">${skill.rarity}</span>
            `;
            list.appendChild(item);
        });
    }

    const startBtn = document.getElementById("startGameBtn");
    if (startBtn) {
        startBtn.classList.toggle("hidden", equippedSkills.length === 0);
    }
}

function confirmSkills() {
    const selected = document.querySelectorAll(".skill-option.selected");
    selected.forEach((opt) => {
        const skillId = opt.dataset.skillId;
        const skill = SKILLS_DB[skillId];
        if (skill && !ownedSkills.find(s => s.id === skill.id)) {
            ownedSkills.push(skill);
        }
    });

    saveGameData();
    
    const gachaModal = document.getElementById("gacha-modal");
    if (gachaModal) gachaModal.classList.remove("show");
    
    const skillMenuModal = document.getElementById("skill-menu-modal");
    if (skillMenuModal) {
        skillMenuModal.classList.add("show");
        renderSkillMenu();
    }
}

function renderSkillMenu() {
    const availableList = document.getElementById("available-skills-list");
    const equippedList = document.getElementById("equipped-skills-list");
    if (!availableList || !equippedList) return;

    availableList.innerHTML = "";
    ownedSkills.forEach((skill) => {
        const item = document.createElement("div");
        item.className = "skill-item";
        item.innerHTML = `
            <span>${skill.icon} ${skill.name}</span>
            <span class="skill-rarity rarity-${skill.rarity}">${skill.rarity}</span>
        `;
        item.title = skill.desc;
        item.addEventListener("click", () => {
            const index = equippedSkills.findIndex(s => s.id === skill.id);
            if (index > -1) {
                equippedSkills.splice(index, 1);
                renderSkillMenu();
                render();
                saveGameData();
            } else {
                if (equippedSkills.length < 5) {
                    if (skill.rarity === 'epic' && equippedSkills.some(s => s.rarity === 'epic')) {
                        alert("Epicスキルは1つまでしか装備できません。");
                        return;
                    }
                    if (confirm("スキル装着をしたらゲームがリセットされますがいいですか？")) {
                        equippedSkills.push(skill);
                        renderSkillMenu();
                        render();
                        saveGameData();
                        gameStarted = true;
                        init();
                    }
                } else {
                    alert("装備できるスキルは最大5つまでです。");
                }
            }
        });
        availableList.appendChild(item);
    });

    equippedList.innerHTML = "";
    if (equippedSkills.length === 0) {
        equippedList.innerHTML = "<p style='color: #999;'>スキルが装備されていません</p>";
    } else {
        equippedSkills.forEach((skill) => {
            const item = document.createElement("div");
            item.className = "equipped-skill-item";
            item.innerHTML = `
                <span>${skill.icon} ${skill.name}</span>
                <span class="skill-rarity rarity-${skill.rarity}">${skill.rarity}</span>
            `;
            item.title = skill.desc;
            equippedList.appendChild(item);
        });
    }
}

function startGame() {
    const gachaModal = document.getElementById("gacha-modal");
    if (gachaModal) gachaModal.classList.remove("show");
    gameStarted = true;
    init();
}

function lastinit() {
    board = Array(SIZE).fill().map(() => Array(SIZE).fill(0));
    danger = null;
    score = 0;
    bestScore = 0;
    turn = 0;
    phase = 1;
    coins = 0;
    maxTile = 0;
    equippedSkills = [];
    ownedSkills = [];
    gameStarted = false;
    holeInterval = 2;
    gamePaused = false;
    spawn();
    spawn();
    render();
}

function initGachaSystem() {
    const gachaBtn = document.getElementById("gacha-btn");
    const gachaModal = document.getElementById("gacha-modal");
    const closeGachaBtn = document.getElementById("closeGachaBtn");
    const resetBtn = document.getElementById("reset-btn");

    if (gachaBtn) gachaBtn.addEventListener("click", () => {
        if (gachaModal) {
            gachaModal.classList.add("show");
            const gachaMain = document.getElementById("gacha-main");
            const skillSelection = document.getElementById("skill-selection");
            if (gachaMain) gachaMain.style.display = "block";
            if (skillSelection) skillSelection.classList.add("hidden");
            renderGachaUI();
            
            const startBtn = document.getElementById("startGameBtn");
            if (startBtn) {
                startBtn.classList.toggle("hidden", ownedSkills.length === 0);
            }
        }
    });

    if (closeGachaBtn) closeGachaBtn.addEventListener("click", () => {
        if (gachaModal) gachaModal.classList.remove("show");
    });

    const skillMenuBtn = document.getElementById("skill-menu-btn");
    const skillMenuModal = document.getElementById("skill-menu-modal");
    const closeSkillMenuBtn = document.getElementById("closeSkillMenuBtn");

    if (skillMenuBtn) skillMenuBtn.addEventListener("click", () => {
        if (skillMenuModal) {
            skillMenuModal.classList.add("show");
            renderSkillMenu();
        }
    });

    if (closeSkillMenuBtn) closeSkillMenuBtn.addEventListener("click", () => {
        if (skillMenuModal) skillMenuModal.classList.remove("show");
    });

    if (resetBtn) resetBtn.addEventListener("click", () => {
        init();
    });

    const discardBtn = document.getElementById("discard-btn");
    if (discardBtn) discardBtn.addEventListener("click", () => {
        if (confirm("全ての進行状況を破棄しますか？コイン、スキル、ベストスコアが全て失われます。")) {
            bestScore = 0;
            equippedSkills = [];
            gameStarted = false;
            lastinit();
            coins += 100;
            saveGameData();
            if (gachaModal) {
                gachaModal.classList.add("show");
                renderGachaUI();
            }
        }
    });

    window.addEventListener("click", (e) => {
        if (e.target === gachaModal) {
            gachaModal.classList.remove("show");
        }
        if (e.target === skillMenuModal) {
            skillMenuModal.classList.remove("show");
        }
    });

    const gachaGetBtn = document.getElementById("gachaGetBtn");
    if (gachaGetBtn) gachaGetBtn.addEventListener("click", performGacha);

    const confirmBtn = document.getElementById("confirmSkillBtn");
    if (confirmBtn) confirmBtn.addEventListener("click", confirmSkills);

    const startActualBtn = document.getElementById("startActualGameBtn");
    if (startActualBtn) startActualBtn.addEventListener("click", () => {
        if (skillMenuModal) skillMenuModal.classList.remove("show");
        gameStarted = true;
        init();
    });
}

// ===== 初期化 =====
document.addEventListener("DOMContentLoaded", () => {
    const ruleBtn = document.getElementById("ruleBtn");
    const closeRuleBtn = document.getElementById("closeRuleBtn");
    const ruleModal = document.getElementById("ruleModal");

    if (ruleBtn) ruleBtn.addEventListener("click", toggleRuleModal);
    if (closeRuleBtn) closeRuleBtn.addEventListener("click", toggleRuleModal);

    // ランキングボタン
    const rankingBtn = document.getElementById("ranking-btn");
    const closeRankingBtn = document.getElementById("closeRankingBtn");
    const rankingModal = document.getElementById("ranking-modal");

    if (rankingBtn) rankingBtn.addEventListener("click", showRanking);
    if (closeRankingBtn) closeRankingBtn.addEventListener("click", () => {
        if (rankingModal) rankingModal.classList.remove("show");
    });

    // ゲームオーバーボタン
    const continueSkillBtn = document.getElementById("continue-with-skills-btn");
    const restartSameBtn = document.getElementById("restart-same-skills-btn");
    const closeGameOverBtn = document.getElementById("closeGameOverBtn");
    const gameOverModal = document.getElementById("gameover-modal");

    if (continueSkillBtn) continueSkillBtn.addEventListener("click", continueWithSkills);
    if (restartSameBtn) restartSameBtn.addEventListener("click", restartWithoutSkills);
    if (closeGameOverBtn) closeGameOverBtn.addEventListener("click", () => {
        if (gameOverModal) gameOverModal.classList.remove("show");
    });

    window.addEventListener("click", (e) => {
        if (e.target === ruleModal) {
            ruleModal.classList.remove("show");
        }
        if (e.target === rankingModal) {
            rankingModal.classList.remove("show");
        }
    });

    initGachaSystem();

    const hasSaveData = loadGameData();
    initializeFirstTimeBonus();
    
    if (!hasSaveData) {
        init();
    } else {
        render();
    }

    setInterval(saveGameData, 30000);
});
