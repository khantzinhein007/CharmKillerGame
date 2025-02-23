const output = document.getElementById('output');
const choicesDiv = document.getElementById('choices');
const killSound = document.getElementById('kill-sound');
let score = 0, heat = 0, charm = 100, cash = 200, closeCalls = 0, sanity = 100, media = 0, streak = 0, escapes = 2, trophies = 0, stress = 0;
let tools = { fakeCast: 2, rope: 1, chloroform: 0, shovel: 0, flashlight: 0, lockpick: 0, disguise: { type: null, turns: 0 } };
let difficulty = null, turn = 0, currentLocation = "Washington", weather = "Clear", accomplice = null;
let modSettings = { infiniteCash: false, noHeat: false, maxTools: false, stealthMode: false, extraLives: 0, innerVoice: true, killEffects: true, luck: false };
let gameState = { currentVictim: null, inGame: false, signature: null };
let signatureChosen = false;
let killedVictims = [];

const difficulties = {
    "Easy": { cash: 500, fakeCast: 2, rope: 2, heatRate: 0.5, charmDrain: 0.5, killsToWin: 5, intro: "The streets trust easily. Charm is your blade." },
    "Normal": { cash: 200, fakeCast: 1, rope: 1, heatRate: 1, charmDrain: 1, killsToWin: 7, intro: "Eyes flicker. Keep the mask tight." },
    "Hard": { cash: 100, fakeCast: 1, rope: 1, heatRate: 1.5, charmDrain: 1.5, killsToWin: 10, intro: "Cops sniff closer. Charm’s a thin veil." },
    "Nightmare": { cash: 50, fakeCast: 0, rope: 1, heatRate: 2, charmDrain: 2, killsToWin: 30, intro: "Every shadow traps you. Charm cuts fast." }
};

const victims = [
    { name: "College Student", profile: "Young, trusting, carries books", worth: 200, trait: "Trusting", resistChance: 0.2, trustThreshold: 70 },
    { name: "Hitchhiker", profile: "Desperate, thumb out, wary", worth: 180, trait: "Wary", resistChance: 0.3, trustThreshold: 60 },
    { name: "Bar Waitress", profile: "Tired, flirty, late shift", worth: 150, trait: "Flirty", resistChance: 0.25, trustThreshold: 65 },
    { name: "Tourist", profile: "Lost, chatty, new city", worth: 220, trait: "Naive", resistChance: 0.2, trustThreshold: 70 },
    { name: "Jogger", profile: "Fit, headphones, distracted", worth: 160, trait: "Distracted", resistChance: 0.35, trustThreshold: 55 },
    { name: "Witness", profile: "Saw too much, scared, jumpy", worth: 300, risk: true, trait: "Paranoid", resistChance: 0.5, trustThreshold: 40 },
    { name: "Cop’s Daughter", profile: "Curious, naive, connected", worth: 400, risk: true, trait: "Connected", resistChance: 0.3, trustThreshold: 60 },
    { name: "Sorority Sister", profile: "Social, carefree, campus-bound", worth: 170, trait: "Carefree", resistChance: 0.25, trustThreshold: 65 },
    { name: "Teen Runaway", profile: "Defiant, alone, street-smart", worth: 190, trait: "Defiant", resistChance: 0.4, trustThreshold: 50 },
    { name: "Nurse", profile: "Compassionate, overworked, night shift", worth: 210, trait: "Compassionate", resistChance: 0.3, trustThreshold: 60 },
    { name: "Lakegoer", profile: "Relaxed, swimsuit, summer night", worth: 180, trait: "Relaxed", resistChance: 0.2, trustThreshold: 70 },
    { name: "Drifter Woman", profile: "Transient, trusting, no ties", worth: 140, trait: "Trusting", resistChance: 0.35, trustThreshold: 55 },
    { name: "Businesswoman", profile: "Busy, distracted, late meeting", worth: 250, trait: "Distracted", resistChance: 0.25, trustThreshold: 65 }
];

const victimTraits = ["Rich", "Connected", "Drunk", "Trusting", "Wary", "Flirty", "Naive", "Distracted", "Paranoid", "Carefree", "Defiant", "Compassionate", "Relaxed"];
const locations = {
    "Washington": { heatMod: 1, cashMod: 1, charmDrain: 1, policePresence: 0.1 },
    "Utah": { heatMod: 1.2, cashMod: 2, charmDrain: 1, policePresence: 0.15 },
    "Colorado": { heatMod: 1, cashMod: 1, charmDrain: 0.5, policePresence: 0.2 },
    "Florida": { heatMod: 1.5, cashMod: 1.5, charmDrain: 1, policePresence: 0.25, highRiskOnly: true },
    "Oregon Forest": { heatMod: 0.7, cashMod: 0.8, charmDrain: 1, policePresence: 0.05 },
    "Idaho Backroads": { heatMod: 0.8, cashMod: 1, charmDrain: 0.9, policePresence: 0.08 }
};
const weatherEffects = {
    "Fog": { heatMod: 0.8, charmMod: 0.9, stressMod: 1.1 },
    "Storm": { instantKill: true, heatMod: 1.3, stressMod: 1.2 },
    "Clear": { charmMod: 1.2, heatMod: 1.1, stressMod: 1 }
};

const blackMarket = {
    "Fake Cast": { cost: 100, action: () => tools.fakeCast++ },
    "Rope": { cost: 50, action: () => tools.rope++ },
    "Chloroform": { cost: 150, action: () => tools.chloroform++ },
    "Shovel": { cost: 80, action: () => tools.shovel++ },
    "Flashlight": { cost: 100, action: () => tools.flashlight++ },
    "Lockpick": { cost: 120, action: () => tools.lockpick++ },
    "Disguise Kit": { cost: 250, action: () => tools.disguise = { type: prompt("Choose: Student, Cop, Worker") || "Student", turns: 3 } },
    "Fake Badge": { cost: 400, action: () => tools.badge = 1 },
    "Pills": { cost: 150, action: () => { sanity = Math.min(100, sanity + 30); stress -= 20; } },
    "New Plates": { cost: 300, action: () => heat = Math.max(0, heat - 30) },
    "Lookout": { cost: 400, action: () => accomplice = { type: "Lookout", turns: 5 } },
    "Sell Trophy": { profit: () => Math.floor(Math.random() * 201) + 100, action: () => trophies--, condition: () => trophies > 0 }
};

const jobs = {
    "Burglary": { earnings: 150, risk: 0.3, heatIncrease: 10, stressIncrease: 15 },
    "Mugging": { earnings: 100, risk: 0.2, heatIncrease: 5, stressIncrease: 10 },
    "Black Market Deal": { earnings: 200, risk: 0.4, heatIncrease: 15, stressIncrease: 20 }
};

const tips = [
    "Use charm to lure trusting victims and reduce resist chances.",
    "Wear a disguise to lower heat and evade police suspicion.",
    "Avoid high-risk victims like the Witness to minimize media attention.",
    "Sell trophies for quick cash, but watch the heat rise.",
    "Rest often with Pills to maintain sanity and reduce stress."
];

function displayText(text, delay = 0) {
    return new Promise(resolve => setTimeout(() => { output.innerHTML += `${text}<br>`; output.scrollTop = output.scrollHeight; resolve(); }, delay));
}

function clearChoices() { choicesDiv.innerHTML = ''; }

function addChoiceButton(text, callback) {
    const button = document.createElement('button');
    button.textContent = text;
    button.onclick = () => {
        callback();
        button.style.pointerEvents = 'auto';
        button.style.cursor = 'pointer';
    };
    choicesDiv.appendChild(button);
}

function addKillFlash(victimName) {
    const flash = document.createElement('div');
    flash.className = 'kill-flash victim';
    document.getElementById('game-container').appendChild(flash);
    if (modSettings.killEffects && killSound) { killSound.muted = false; killSound.play().catch(() => {}); }
    setTimeout(() => flash.remove(), 500);
}

function getRandomItem(array) { return array[Math.floor(Math.random() * array.length)]; }

async function selectDifficulty() {
    output.innerHTML = '';
    await displayText("I’m Ted Bundy—charm’s my lure, blood my art. How deep do I carve?");
    if (!signatureChosen) {
        await displayText("Choose your signature:", 1000);
        const signatures = [
            { name: "Strangler", action: () => { gameState.signature = "Strangler"; signatureChosen = true; selectDifficulty(); } },
            { name: "Charmer", action: () => { gameState.signature = "Charmer"; signatureChosen = true; selectDifficulty(); } },
            { name: "Driver", action: () => { gameState.signature = "Driver"; signatureChosen = true; selectDifficulty(); } }
        ];
        signatures.forEach(sig => addChoiceButton(sig.name, () => { sig.action(); clearChoices(); }));
    } else {
        await displayText("<br>Choose your mask:", 1000);
        for (let diff in difficulties) addChoiceButton(diff, () => startGame(diff));
    }
}

async function showModMenu() {
    clearChoices();
    await displayText("<br>Mod Menu - Twist the Charm:");
    addChoiceButton(`Infinite Cash: ${modSettings.infiniteCash ? 'ON' : 'OFF'}`, () => {
        modSettings.infiniteCash = !modSettings.infiniteCash;
        if (!modSettings.infiniteCash) cash = Math.max(cash, 0);
        showModMenu();
    });
    addChoiceButton(`No Heat: ${modSettings.noHeat ? 'ON' : 'OFF'}`, () => {
        modSettings.noHeat = !modSettings.noHeat;
        if (modSettings.noHeat) heat = 0;
        showModMenu();
    });
    addChoiceButton(`Max Tools: ${modSettings.maxTools ? 'ON' : 'OFF'}`, () => {
        modSettings.maxTools = !modSettings.maxTools;
        if (modSettings.maxTools) tools = { fakeCast: 99, rope: 99, chloroform: 99, shovel: 99, flashlight: 99, lockpick: 99, disguise: { type: "Student", turns: 99 } };
        showModMenu();
    });
    addChoiceButton(`Stealth Mode: ${modSettings.stealthMode ? 'ON' : 'OFF'}`, () => {
        modSettings.stealthMode = !modSettings.stealthMode;
        showModMenu();
    });
    addChoiceButton(`Add Close Call (${closeCalls})`, () => {
        closeCalls++;
        modSettings.extraLives = closeCalls;
        showModMenu();
    });
    addChoiceButton(`Inner Voice: ${modSettings.innerVoice ? 'ON' : 'OFF'}`, () => {
        modSettings.innerVoice = !modSettings.innerVoice;
        showModMenu();
    });
    addChoiceButton(`Kill Effects: ${modSettings.killEffects ? 'ON' : 'OFF'}`, () => {
        modSettings.killEffects = !modSettings.killEffects;
        showModMenu();
    });
    addChoiceButton(`Luck: ${modSettings.luck ? 'ON' : 'OFF'}`, () => {
        modSettings.luck = !modSettings.luck;
        showModMenu();
    });
    addChoiceButton("Reset Stats", () => { 
        score = 0; heat = 0; charm = 100; cash = difficulty.cash; sanity = 100; media = 0; streak = 0; trophies = 0; stress = 0; 
        tools = { fakeCast: difficulty.fakeCast, rope: difficulty.rope, chloroform: 0, shovel: 0, flashlight: 0, lockpick: 0, disguise: { type: null, turns: 0 } }; 
        killedVictims = []; showModMenu(); 
    });
    addChoiceButton("Change Difficulty", showDifficultyChange);
    addChoiceButton("Back", () => { if (gameState.inGame && gameState.currentVictim) showScene(gameState.currentVictim); else selectDifficulty(); });
}

async function showDifficultyChange() {
    clearChoices();
    await displayText("<br>Shift the Hunt:");
    for (let diff in difficulties) addChoiceButton(diff, () => { difficulty = difficulties[diff]; cash = difficulty.cash; tools.fakeCast = difficulty.fakeCast; tools.rope = difficulty.rope; showModMenu(); });
    addChoiceButton("Back to Mods", showModMenu);
}

async function startGame(selectedDifficulty) {
    difficulty = difficulties[selectedDifficulty];
    score = 0; heat = 0; charm = 100; cash = difficulty.cash; closeCalls = 0; sanity = 100; media = 0; streak = 0; escapes = 2; trophies = 0; stress = 0;
    tools = { fakeCast: difficulty.fakeCast, rope: difficulty.rope, chloroform: 0, shovel: 0, flashlight: 0, lockpick: 0, disguise: { type: null, turns: 0 } };
    turn = 0; currentLocation = "Washington"; accomplice = null; killedVictims = [];
    gameState.inGame = true;
    gameState.currentVictim = getRandomVictim(); // Automatically assign a random victim at game start
    output.innerHTML = '';
    await displayText("I’m Ted Bundy—charm’s my lure, blood my art.");
    await displayText("The streets tremble under my smile, deadly and deceptive.", 1000);
    await displayText(difficulty.intro, 1000);
    await displayText("The hunt is endless—charm or vanish.", 1000);
    if (selectedDifficulty === "Nightmare") await displayText("Survive in the darkest charm. The hunt never ends.", 1000);
    else await displayText(`Carve 30 kills with your mask. No escape, only blood.`, 1000);
    showTips();
    showScene(gameState.currentVictim);
}

function getRandomVictim() {
    const availableVictims = victims.filter(v => !killedVictims.includes(v.name));
    if (availableVictims.length === 0) {
        // Reset killedVictims to allow reuse of all victims, ensuring endless gameplay
        killedVictims = [];
        return { ...getRandomItem(victims), trait: getRandomItem(victimTraits) };
    }
    return { ...getRandomItem(availableVictims), trait: getRandomItem(victimTraits) };
}

async function showScene(victim = null) {
    clearChoices();
    turn++;
    if (!victim) {
        gameState.currentVictim = getRandomVictim();
        if (!gameState.currentVictim) {
            // This should never happen due to resetting killedVictims, but keep as fallback
            await displayText("No prey remains. The streets fall silent.");
            await displayText("Your charm fades in shadows.", 1000);
            playAgain();
            return;
        }
    } else {
        gameState.currentVictim = victim;
    }
    weather = Math.random() < 0.2 ? getRandomItem(["Fog", "Storm", "Clear"]) : "Clear";
    const isNight = turn % 2 === 0; // Bundy operates day and night, alternating turns
    if (turn % 5 === 0) await moveLocation();

    // Update difficulty to Nightmare if score reaches 30
    if (score >= 30 && difficulty !== difficulties["Nightmare"]) {
        difficulty = difficulties["Nightmare"];
        await displayText("<br>The bloodlust peaks—nightmare consumes you. Difficulty shifts to Nightmare!", 1000);
    }

    await displayText(`<br>${isNight ? "Night" : "Day"} ${turn} - ${currentLocation} - ${weather}`);
    await displayText(`<span class="stat-bar">Kills: ${score} | Heat: ${heat}% | Charm: ${charm}% | Cash: $${cash} | Sanity: ${sanity}% | Media: ${media}% | Stress: ${stress}% | Streak: ${streak} | Escapes: ${escapes} | Trophies: ${trophies}</span>`);
    await displayText(`Tools: Fake Cast=${tools.fakeCast}, Rope=${tools.rope}, Chloroform=${tools.chloroform}, Shovel=${tools.shovel}, Flashlight=${tools.flashlight}, Lockpick=${tools.lockpick}, Disguise=${tools.disguise.type ? tools.disguise.type : 'None'} (${tools.disguise.turns} turns)`);
    if (accomplice) await displayText(`Accomplice: ${accomplice.type} (${accomplice.turns} turns left)`);
    if (heat > 75) await displayText(`<span class="warning">Cops close in—charm weakens!</span>`);
    if (charm < 25) await displayText(`<span class="warning">Charm’s gone—too exposed!</span>`);
    if (sanity < 25) await displayText(`<span class="warning">Mind fractures—losing grip!</span>`);
    if (media > 75) await displayText(`<span class="warning">Media screams my name—panic rises!</span>`);
    if (stress > 75) await displayText(`<span class="warning">Pulse races—mask slips!</span>`);
    await displayText(`<br>Target: ${gameState.currentVictim.name} - ${gameState.currentVictim.profile} (${gameState.currentVictim.trait})`);
    await displayText("The streets beckon—charm or vanish:");
    if (tools.fakeCast > 0) addChoiceButton("1. Lure with Fake Cast", () => handleChoice(1, gameState.currentVictim));
    if (tools.rope > 0) addChoiceButton("2. Strangle with Rope", () => handleChoice(2, gameState.currentVictim));
    if (tools.chloroform > 0) addChoiceButton("3. Knock Out with Chloroform", () => handleChoice(3, gameState.currentVictim));
    addChoiceButton("4. Flirt and Stall", () => handleChoice(4, gameState.currentVictim));
    if (tools.flashlight > 0) addChoiceButton("5. Distract and Abduct", () => handleChoice(5, gameState.currentVictim));
    if (tools.shovel > 0) addChoiceButton("Bury Evidence", () => handleChoice(6, gameState.currentVictim));
    addChoiceButton("Craft Alibi", () => handleChoice(7, gameState.currentVictim));
    addChoiceButton("Scout Area", () => handleChoice(8, gameState.currentVictim));
    if (heat > 75 && escapes > 0) addChoiceButton("Plan Escape", () => handleChoice(9, gameState.currentVictim));
    addChoiceButton("Admire Trophies", () => handleChoice(10, gameState.currentVictim));
    addChoiceButton("Leak a Clue", () => handleChoice(11, gameState.currentVictim));
    if (tools.lockpick > 0) addChoiceButton("Break into Car", () => handleChoice(12, gameState.currentVictim));
    addChoiceButton("Skip Victim", () => handleSkipVictim()); // Option to skip victim
    if (gameState.inGame) addChoiceButton("Mod Menu", showModMenu);
    addChoiceButton("Black Market", () => showBlackMarket(gameState.currentVictim));
    addChoiceButton("Take a Job", () => showJobs());

    if (Math.random() < 0.05) await handleFlashback();
    if (Math.random() < 0.15 && modSettings.innerVoice) await handleInnerVoice();
    if (Math.random() < locations[currentLocation].policePresence) await handlePolicePursuit();

    await displayNarrations();
}

async function displayNarrations() {
    const narrations = [
        "The moon casts a deceptive glow, masking my charm.",
        "A chilling smile spreads—my next victim trusts me blindly.",
        "The scent of fear mixes with my charisma, drawing them near.",
        "The streets tremble, unaware of Bundy’s deadly allure.",
        "Memories of past kills flicker, fueling my twisted charm.",
        "The endless hunt stretches on—your legacy grows in blood and deception."
    ];
    if (Math.random() < 0.3) await displayText(getRandomItem(narrations), 1000);
}

async function showTips() {
    await displayText("<br>Tips for the Hunt:", 1000);
    tips.forEach(tip => displayText(`- ${tip}`, 500));
}

async function showBlackMarket(victim) {
    clearChoices();
    await displayText("<br>Black Market - Shadow Deals:");
    for (let item in blackMarket) {
        const { cost, profit, condition } = blackMarket[item];
        const price = cost ? Math.floor(cost * (0.8 + Math.random() * 0.4)) : (profit ? profit() : 0);
        if (condition && condition()) addChoiceButton(`${item} (+$${price})`, () => handleBlackMarket(item, victim, price));
        else if (!condition && (!tools[item] || !accomplice || item === "Pills" || item === "New Plates")) addChoiceButton(`${item} (-$${price})`, () => handleBlackMarket(item, victim, price));
    }
    addChoiceButton("Back to Hunt", () => showScene(gameState.currentVictim));
}

async function handleBlackMarket(item, victim, price) {
    clearChoices();
    const { action, condition } = blackMarket[item];
    if (condition && condition()) {
        cash += price;
        action();
        await displayText(`Sold ${item.replace("Sell ", "")} for $${price}. The charm tightens its grip.`);
    } else if (cash >= price || modSettings.infiniteCash) {
        if (!modSettings.infiniteCash) cash -= price;
        action();
        await displayText(`Acquired ${item} for $${price}. The hunt grows darker.`);
    } else await displayText("No cash—charm fades away.");
    showScene(gameState.currentVictim);
}

async function showJobs() {
    clearChoices();
    await displayText("<br>Take a Job for Cash:");
    for (let job in jobs) {
        const { earnings, risk, heatIncrease, stressIncrease } = jobs[job];
        addChoiceButton(`${job} (+$${earnings})`, () => handleJob(job, earnings, risk, heatIncrease, stressIncrease));
    }
    addChoiceButton("Back to Hunt", () => showScene(gameState.currentVictim));
}

async function handleJob(job, earnings, risk, heatIncrease, stressIncrease) {
    clearChoices();
    let successChance = 1 - risk;
    if (modSettings.luck) successChance += 0.2; // Increase success by 20% with luck
    if (Math.random() < successChance) {
        cash += earnings;
        await displayText(`Successfully completed ${job}—earned $${earnings}. Charm hides the risk.`);
    } else {
        heat += heatIncrease;
        stress += stressIncrease;
        await displayText(`Failed ${job}—cops notice! Heat +${heatIncrease}%, Stress +${stressIncrease}%.`);
    }
    showScene(gameState.currentVictim);
}

async function handleChoice(choice, victim) {
    clearChoices();
    let heatMultiplier = (modSettings.noHeat ? 0 : (modSettings.stealthMode ? 0.5 : 1)) * locations[currentLocation].heatMod * (weatherEffects[weather].heatMod || 1) * (media > 75 ? 1.5 : 1);
    let charmMultiplier = locations[currentLocation].charmDrain * (weatherEffects[weather].charmMod || 1) * (sanity < 25 ? 2 : 1);
    let cashMultiplier = locations[currentLocation].cashMod;
    let stressMultiplier = (weatherEffects[weather].stressMod || 1) * (stress > 75 ? 1.5 : 1);
    const isNight = turn % 2 === 0; // Bundy operates day and night, alternating turns
    let resistChance = victim.resistChance;
    if (modSettings.luck) {
        resistChance *= 0.5; // Halve resist chance with luck
    }
    if (tools.disguise.turns > 0 && tools.disguise.type === "Student") resistChance *= 0.8; // 20% lower resist with Student disguise
    if (tools.disguise.turns > 0 && tools.disguise.type === "Cop") resistChance *= 0.9; // 10% lower resist with Cop disguise
    if (tools.disguise.turns > 0 && tools.disguise.type === "Worker") resistChance *= 1.0; // No resist change with Worker
    let resisted = charm < victim.trustThreshold && Math.random() < resistChance;

    if (choice === 1 && tools.fakeCast > 0) {
        tools.fakeCast--; charm -= 5 * charmMultiplier; cash += 50 * cashMultiplier; heat += Math.floor(Math.random() * 5 * difficulty.heatRate * heatMultiplier); stress += 5 * stressMultiplier;
        if (resisted) { await displayText("She resists the cast—suspicion rises!"); heat += 15; stress += 10; } else await displayText("Cast hooks her. She trusts my smile.");
    } else if (choice === 2 && tools.rope > 0) {
        tools.rope--; addKillFlash(victim.name);
        score += 1; charm -= 10 * charmMultiplier; cash += victim.worth * cashMultiplier * (gameState.signature === "Strangler" ? 1.5 : 1); 
        heat += (victim.risk ? 30 : 15) * difficulty.heatRate * heatMultiplier * (gameState.signature === "Strangler" ? 0.9 : 1);
        sanity -= 10; media += victim.risk ? 15 : 5; stress += 15 * stressMultiplier;
        if (charm > 80) streak++; else streak = 0;
        if (Math.random() < 0.5) { trophies++; await displayText("A chilling trophy claimed—her trust lingers."); }
        if (victim.trait === "Drunk") heat -= 5;
        killedVictims.push(victim.name);
        await displayText(`Strangled with rope. $${victim.worth} from ${victim.name}. Blood stains my charm.`);
        gameState.currentVictim = getRandomVictim(); // Assign new random victim after kill
    } else if (choice === 3 && tools.chloroform > 0) {
        tools.chloroform--; charm -= 8 * charmMultiplier; heat += Math.floor(Math.random() * 10 * difficulty.heatRate * heatMultiplier); stress += 10 * stressMultiplier;
        if (resisted && victim.name !== "Witness") { await displayText("She fights it off—panic erupts!"); heat += 10; } else { 
            score += 1; cash += victim.worth * cashMultiplier; sanity -= 5; media += 5; 
            killedVictims.push(victim.name);
            await displayText(`Silenced with chloroform. $${victim.worth} taken. Her trust betrayed.`); 
            gameState.currentVictim = getRandomVictim(); // Assign new random victim after kill
        }
    } else if (choice === 4) {
        charm += (isNight ? 10 : 20) * (weather === "Clear" ? 1.2 : 1) * (gameState.signature === "Charmer" ? 1.5 : 1); 
        heat += Math.floor(Math.random() * 5 * difficulty.heatRate * heatMultiplier * (isNight ? 0.5 : 1));
        cash += gameState.signature === "Charmer" ? 20 : 0;
        stress -= 5;
        await displayText("Smile disarms. She lingers, trusting my charm.");
    } else if (choice === 5 && tools.flashlight > 0) {
        tools.flashlight--; addKillFlash(victim.name);
        score += 1; charm -= 15 * charmMultiplier; cash += victim.worth * cashMultiplier * (gameState.signature === "Driver" ? 1.5 : 1); 
        heat += (victim.risk ? 40 : 20) * difficulty.heatRate * heatMultiplier * (weather === "Fog" ? 0 : 1);
        sanity -= 15; media += victim.risk ? 20 : 10; stress += 20 * stressMultiplier;
        if (charm > 80) streak++; else streak = 0;
        if (Math.random() < 0.5) { trophies++; await displayText("A dazzling trophy claimed—her fear masked by trust."); }
        if (victim.trait === "Trusting") heat -= 5;
        killedVictims.push(victim.name);
        await displayText(`${victim.name} distracted and taken. $${victim.worth} gained. Charm deceives.`);
        gameState.currentVictim = getRandomVictim(); // Assign new random victim after kill
    } else if (choice === 6 && tools.shovel > 0) {
        tools.shovel--; heat = Math.max(0, heat - (gameState.signature === "Driver" ? 40 : 20)); charm -= 5 * charmMultiplier; stress += 5 * stressMultiplier;
        await displayText("Dirt hides the red—charm remains intact.");
    } else if (choice === 7) {
        heat += 5 * difficulty.heatRate * heatMultiplier; cash -= 50; charm += 10;
        await displayText("Alibi crafted—$50 spent, but trust holds firm.");
    } else if (choice === 8) {
        heat -= 5; charm -= 5 * charmMultiplier; stress -= 10;
        await displayText("Scouted the area—charm reveals safe paths ahead.");
    } else if (choice === 9 && escapes > 0) {
        escapes--; heat = 0; cash -= 300; stress += 20 * stressMultiplier;
        await displayText("Escaped with a smile—$300 lost, but charm saves you."); showScene(null); return;
    } else if (choice === 10 && trophies > 0) {
        charm += 10; heat += 5 * difficulty.heatRate * heatMultiplier; sanity -= 5; stress += 5 * stressMultiplier;
        await displayText("Trophies gleam—her trust echoes, fueling my mask.");
    } else if (choice === 11) {
        media += 20; heat += 10 * difficulty.heatRate * heatMultiplier; stress += 10 * stressMultiplier;
        await displayText("Leaked a clue—papers buzz, drawing heat closer.");
    } else if (choice === 12 && tools.lockpick > 0) {
        tools.lockpick--; heat += 10 * difficulty.heatRate * heatMultiplier; cash += 150 * cashMultiplier; stress += 15 * stressMultiplier;
        if (Math.random() < 0.3) { await displayText("Alarm triggers—cops close in!"); heat += 20; } else await displayText("Broke in—$150 stolen with charm.");
    } else if (choice === 13) { // Skip Victim
        await handleSkipVictim();
    } else await displayText("No tools—charm fails, shadows betray you.");

    applyModifiers();
    if ([2, 3, 5].includes(choice) && !resisted) {
        await checkGameState(true);
    } else {
        await checkGameState(false);
    }
}

async function handleSkipVictim() {
    clearChoices();
    let heatIncrease = 5 * (modSettings.stealthMode ? 0.5 : 1); // Reduced with Stealth Mode
    let stressIncrease = 10;
    if (modSettings.luck) {
        heatIncrease *= 0.8; // 20% reduction with Luck
        stressIncrease *= 0.9; // 10% reduction with Luck
    }
    heat += heatIncrease;
    stress += stressIncrease;
    await displayText(`Skipped ${gameState.currentVictim.name}—the streets grow tense. Heat +${heatIncrease}%, Stress +${stressIncrease}%.`);
    gameState.currentVictim = getRandomVictim(); // Assign new random victim
    showScene(gameState.currentVictim);
}

async function applyModifiers() {
    if (modSettings.noHeat) heat = 0;
    else heat = Math.max(0, Math.min(100, heat)); // Cap at 100, arrest if > 100
    if (modSettings.infiniteCash) cash = Infinity;
    if (modSettings.maxTools) tools = { fakeCast: 99, rope: 99, chloroform: 99, shovel: 99, flashlight: 99, lockpick: 99, disguise: { type: "Student", turns: 99 } };
    if (accomplice) {
        accomplice.turns--;
        if (accomplice.type === "Lookout") heat = Math.max(0, heat - 20);
        if (accomplice.turns <= 0 || Math.random() < 0.1) { await displayText(`${accomplice.type} betrays you!`); heat += 50; stress += 20; accomplice = null; }
    }
    if (tools.disguise.turns > 0) {
        tools.disguise.turns--;
        if (tools.disguise.turns === 0) tools.disguise.type = null;
        if (tools.disguise.type === "Student") { heat *= 0.8; charm += 10; }
        if (tools.disguise.type === "Cop") { heat *= 0.5; charm += 5; }
        if (tools.disguise.type === "Worker") { cash += 50; charm += 5; }
    }
    if (trophies >= 5) { heat += 20; sanity -= 5; }
    if (streak >= 3) { cash += 100; await displayText("Streak bonus: +$100—charm deepens."); }
    if (streak >= 5) { closeCalls++; await displayText("Streak bonus: +1 Close Call—trust protects."); }
    if (streak >= 7) { heat = 0; await displayText("Streak bonus: Heat reset—charm hides all."); streak = 0; }
    if (stress > 90 && Math.random() < 0.3) { await displayText("Stress peaks—I hesitate under pressure!"); charm -= 10; heat += 10; }
    charm = Math.max(0, Math.min(100, charm)); // Cap at 100, arrest if > 100
    sanity = Math.max(0, Math.min(100, sanity)); // Cap at 100, arrest if > 100
    media = Math.max(0, Math.min(100, media)); // Cap at 100, arrest if > 100
    stress = Math.max(0, Math.min(100, stress)); // Cap at 100, arrest if > 100
}

async function checkGameState(killed = false) {
    // Check for arrest if any stat exceeds 100
    if (heat > 100 || charm > 100 || sanity > 100 || stress > 100 || media > 100) {
        await displayText("<br>Overwhelmed—cops swarm, lights blaze. You’re arrested!");
        await displayText("<span class='warning'>Caught!</span>");
        playAgain();
        return;
    }

    if (heat >= 100) {
        if (closeCalls > 0) {
            await displayText("<br>Cops close in—too close! A narrow escape with charm."); closeCalls--; heat = 50; stress += 20; showScene(null);
        } else await handleCourtroom();
    } else if (charm <= 0) {
        if (closeCalls > 0) {
            await displayText("<br>Charm’s gone—exposed! A smile saves me."); closeCalls--; charm = 50; stress += 10; showScene(null);
        } else {
            await displayText("<br>Charm fails. No trust left."); await displayText("<span class='warning'>Caught in the Light!</span>"); playAgain();
        }
    } else if (sanity <= 0) {
        await displayText("<br>Mind shatters—memories consume me."); await displayText("<span class='warning'>Broken in Madness!</span>"); playAgain();
    } else if (stress >= 100) {
        await displayText("<br>Stress breaks me—I falter under pressure!"); await displayText("<span class='warning'>Trapped in Panic!</span>"); playAgain();
    } else {
        if (Math.random() > 0.9) { await displayText("Pawned mementos: +$50."); cash += 50; }
        showScene(killed ? null : gameState.currentVictim);
    }
}

async function handlePolicePursuit() {
    clearChoices();
    await displayText("<br>Sirens wail—cops hunt the charm!");
    stress += 15;
    let hideChance = 0.7;
    if (modSettings.luck) hideChance = 0.8; // Increase hide success with luck
    addChoiceButton("Flee", async () => { charm -= 20; heat -= 10; stress += 10; await displayText("I escape with a smile."); showScene(null); });
    addChoiceButton("Hide (Requires Shovel or Flashlight)", async () => { if (tools.shovel > 0 || tools.flashlight > 0) { if (Math.random() < hideChance) { await displayText("Hidden with charm—cops pass by."); heat -= 20; stress -= 5; } else { await displayText("They spot me!"); heat += 20; stress += 10; } } else await displayText("No cover—exposed!"); showScene(null); });
    addChoiceButton("Talk Your Way Out", async () => { if (charm > 50 && Math.random() < 0.5) { await displayText("Smooth talk works—charm buys time."); heat = 0; stress -= 10; } else { await displayText("They don’t buy it—cops tighten the net."); heat += 30; stress += 15; } showScene(null); });
}

async function handleFlashback() {
    clearChoices();
    await displayText("<br>Memory hits—1974, Lake Sammamish.");
    await displayText("Two targets: College Student and Tourist.");
    stress += 10;
    let successChance = 0.5;
    if (modSettings.luck) successChance = 0.75; // Increase success chance with luck
    addChoiceButton("Lure Both", async () => {
        if (Math.random() < successChance) {
            heat += 60; cash += 420; score += 2; sanity -= 20; media += 30; stress += 20; trophies += Math.random() < 0.5 ? 1 : 0;
            killedVictims.push("College Student", "Tourist");
            await displayText("Both fall—$420 gained, charm masks the blood."); showScene(null);
        } else {
            await displayText("The plan fails—cops close in!"); heat += 40; stress += 15;
            showScene(null);
        }
    });
    addChoiceButton("Pass", () => showScene(gameState.currentVictim));
}

async function handleInnerVoice() {
    const thoughts = [
        { text: "They’re nothing—charm bends them.", charm: 10, heat: 5, stress: -5 },
        { text: "I’m untouchable with my smile.", score: 1, heat: 20, stress: 10 },
        { text: "What if they catch me?", charm: -20, heat: -10, stress: 15 }
    ];
    const thought = getRandomItem(thoughts);
    await displayText(`<br>Thought: "${thought.text}"`);
    charm += thought.charm || 0; heat += thought.heat || 0; score += thought.score || 0; stress += thought.stress || 0;
}

async function handleCourtroom() {
    clearChoices();
    await displayText("<br>Cops catch me. Trial begins under glaring lights.");
    stress += 20;
    let charmChance = 0.6;
    let bribeChance = 0.8;
    if (modSettings.luck) {
        charmChance = 0.75; // Increase charm success with luck
        bribeChance = 0.9; // Increase bribe success with luck
    }
    addChoiceButton("Charm Jury", async () => {
        if (charm > 70 && Math.random() < charmChance) { await displayText("Jury sways—charm frees me."); heat = 30; stress -= 15; showScene(null); } else { await displayText("Guilty—charm fails."); await displayText("<span class='warning'>Caught!</span>"); playAgain(); }
    });
    addChoiceButton("Bribe", async () => {
        if (cash >= 500) { cash -= 500; if (Math.random() < bribeChance) { await displayText("Money buys freedom—charm resumes."); heat = 30; stress -= 10; showScene(null); } else { await displayText("Bribe fails—justice closes in."); await displayText("<span class='warning'>Caught!</span>"); playAgain(); } } else await displayText("No cash—light blinds me."); playAgain();
    });
    addChoiceButton("Flee", async () => {
        if (Math.random() < (modSettings.luck ? 0.6 : 0.5)) { await displayText("Bolted—charm hides my escape."); heat = 50; stress += 20; tools = { fakeCast: 0, rope: 0, chloroform: 0, shovel: 0, flashlight: 0, lockpick: 0, disguise: { type: null, turns: 0 } }; showScene(null); } else { await displayText("Recaptured—night ends here."); await displayText("<span class='warning'>Caught!</span>"); playAgain(); }
    });
}

async function moveLocation() {
    clearChoices();
    await displayText("<br>Five kills here—shift the charm.");
    const nextLocations = Object.keys(locations).filter(l => l !== currentLocation);
    nextLocations.forEach(loc => addChoiceButton(`Move to ${loc}`, () => { currentLocation = loc; heat += 20; stress += 10; showScene(null); }));
    addChoiceButton("Stay ($150)", () => { cash -= 150; heat = 20; stress += 5; showScene(null); });
}

function playAgain() { 
    clearChoices(); 
    gameState.inGame = false; 
    signatureChosen = false;
    addChoiceButton("New Hunt", selectDifficulty); 
    addChoiceButton("Fade to Shadows", () => { output.innerHTML = "Blood cools. Charm fades forever."; clearChoices(); }); 
}

selectDifficulty();