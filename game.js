// Character class definition
class Character {
    constructor(name, gender, race, attributes) {
        this.name = name;
        this.gender = gender;
        this.level = 1;
        this.race = race;
        this.attributes = attributes;
        this.inventory = [];
        this.position = { x: 10, y: 10 }; // Default starting position
        this.health = Math.max(5, this.attributes.endurance * 2); // Minimum 5 HP
        this.magic = this.attributes.intelligence;
        this.money = 0;
        this.isAlive = true;
    }

    // Take damage and check if character dies
    takeDamage(amount) {
        this.health = Math.max(0, this.health - amount);
        if (this.health <= 0) {
            this.isAlive = false;
            return true; // Character died
        }
        return false; // Character survived
    }

    // Heal character
    heal(amount) {
        this.health = Math.min(this.health + amount, this.attributes.endurance * 2);
    }

    // Add money
    addMoney(amount) {
        this.money += amount;
    }

    // Spend money
    spendMoney(amount) {
        if (this.money >= amount) {
            this.money -= amount;
            return true;
        }
        return false;
    }

    // Use a potion from inventory
    usePotion() {
        const potionIndex = this.inventory.indexOf('healing potion');
        if (potionIndex !== -1) {
            this.inventory.splice(potionIndex, 1);
            this.heal(3);
            updateStats();
            updateInventory();
            return true;
        }
        return false;
    }
}

// Character generation utilities
const characterGenerator = {
    // Lists of possible values
    names: {
        Male: ['Aric', 'Bran', 'Cedric', 'Dain', 'Erik', 'Finn', 'Gareth', 'Hakon', 'Ivar', 'Jorn'],
        Female: ['Aria', 'Brienne', 'Cara', 'Dana', 'Eira', 'Freya', 'Gwen', 'Hilda', 'Iris', 'Jade']
    },
    races: ['Human', 'Elf', 'Dwarf', 'Orc', 'Halfling', 'Gnome'],
    
    // Generate random attributes (0-10)
    generateAttributes() {
        return {
            strength: Math.floor(Math.random() * 11),
            endurance: Math.floor(Math.random() * 11),
            agility: Math.floor(Math.random() * 11),
            perception: Math.floor(Math.random() * 11),
            intelligence: Math.floor(Math.random() * 11),
            wisdom: Math.floor(Math.random() * 11)
        };
    },
    
    // Generate a random character
    generateCharacter() {
        const gender = Math.random() < 0.5 ? 'Male' : 'Female';
        const name = this.names[gender][Math.floor(Math.random() * this.names[gender].length)];
        const race = this.races[Math.floor(Math.random() * this.races.length)];
        const attributes = this.generateAttributes();
        
        return new Character(name, gender, race, attributes);
    }
};

// Game state
const gameState = {
    character: null, // Will be initialized with a random character
    npcs: [], // Array to store NPCs
    inventory: [],
    isWaitingForChoice: false // Add this to track if we're waiting for a choice
};

// Map generation
function generateMap() {
    const map = document.getElementById('map');
    map.innerHTML = '';
    
    const MAP_SIZE = 20;
    const WATER_CHANCE = 0.3;
    
    for (let y = 0; y < MAP_SIZE; y++) {
        for (let x = 0; x < MAP_SIZE; x++) {
            const tile = document.createElement('div');
            tile.className = 'map-tile';
            tile.dataset.x = x;
            tile.dataset.y = y;
            
            // Randomly determine if the tile is water or land
            if (Math.random() < WATER_CHANCE) {
                tile.classList.add('water');
            } else {
                tile.classList.add('land');
            }
            
            map.appendChild(tile);
        }
    }
    
    // Place character and NPCs on the map
    placeCharacter();
    placeNPCs();
}

// Check if a position has enough surrounding land tiles
function isValidSpawnPosition(x, y) {
    const directions = [
        { x: 0, y: -1 },  // up
        { x: 0, y: 1 },   // down
        { x: -1, y: 0 },  // left
        { x: 1, y: 0 }    // right
    ];
    
    // Check if the center tile is land
    const centerTile = document.querySelector(`.map-tile[data-x="${x}"][data-y="${y}"]`);
    if (!centerTile || centerTile.classList.contains('water')) {
        return false;
    }
    
    // Check if at least 3 surrounding tiles are land
    let landCount = 0;
    for (const dir of directions) {
        const newX = x + dir.x;
        const newY = y + dir.y;
        
        // Check if the position is within map bounds
        if (newX >= 0 && newX < 20 && newY >= 0 && newY < 20) {
            const tile = document.querySelector(`.map-tile[data-x="${newX}"][data-y="${newY}"]`);
            if (tile && !tile.classList.contains('water')) {
                landCount++;
            }
        }
    }
    
    return landCount >= 3; // Require at least 3 surrounding land tiles
}

// Generate random position that's not water and has surrounding land
function getRandomValidPosition() {
    const MAP_SIZE = 20;
    let x, y;
    let attempts = 0;
    const MAX_ATTEMPTS = 100;
    
    do {
        x = Math.floor(Math.random() * MAP_SIZE);
        y = Math.floor(Math.random() * MAP_SIZE);
        attempts++;
        
        // If we've tried too many times, find any valid land position
        if (attempts >= MAX_ATTEMPTS) {
            // Search for any valid land position
            for (let searchY = 0; searchY < MAP_SIZE; searchY++) {
                for (let searchX = 0; searchX < MAP_SIZE; searchX++) {
                    if (isValidSpawnPosition(searchX, searchY)) {
                        return { x: searchX, y: searchY };
                    }
                }
            }
            // If no valid position found, return center
            return { x: 10, y: 10 };
        }
    } while (!isValidSpawnPosition(x, y));
    
    return { x, y };
}

// Place or update character position on the map
function placeCharacter() {
    // Remove character from previous position
    const previousCharacter = document.querySelector('.character');
    if (previousCharacter) {
        previousCharacter.remove();
    }
    
    // Get the tile at the character's position
    const tile = document.querySelector(`.map-tile[data-x="${gameState.character.position.x}"][data-y="${gameState.character.position.y}"]`);
    if (tile) {
        const character = document.createElement('div');
        character.className = 'character';
        tile.appendChild(character);
    }
}

// Place or update NPCs on the map
function placeNPCs() {
    // Remove all NPCs
    const previousNPCs = document.querySelectorAll('.npc');
    previousNPCs.forEach(npc => npc.remove());
    
    // Place each NPC
    gameState.npcs.forEach((npc, index) => {
        const tile = document.querySelector(`.map-tile[data-x="${npc.position.x}"][data-y="${npc.position.y}"]`);
        if (tile) {
            const npcElement = document.createElement('div');
            npcElement.className = 'npc';
            npcElement.dataset.npcIndex = index;
            tile.appendChild(npcElement);
        }
    });
}

// Move NPCs randomly
function moveNPCs() {
    const directions = ['up', 'down', 'left', 'right'];
    
    gameState.npcs.forEach(npc => {
        if (!npc.isAlive) return; // Skip dead NPCs
        
        const direction = directions[Math.floor(Math.random() * directions.length)];
        const newPosition = { ...npc.position };
        
        switch (direction) {
            case 'up':
                if (newPosition.y > 0) newPosition.y--;
                break;
            case 'down':
                if (newPosition.y < 19) newPosition.y++;
                break;
            case 'left':
                if (newPosition.x > 0) newPosition.x--;
                break;
            case 'right':
                if (newPosition.x < 19) newPosition.x++;
                break;
        }
        
        // Check if the new position is valid (not water)
        const newTile = document.querySelector(`.map-tile[data-x="${newPosition.x}"][data-y="${newPosition.y}"]`);
        if (newTile && !newTile.classList.contains('water')) {
            npc.position = newPosition;
            // Trigger event for NPC
            eventSystem.triggerEvent(npc);
        }
    });
    
    placeNPCs();
}

// Check if player is on the same tile as any NPC
function checkNPCInteraction() {
    return gameState.npcs.find(npc => 
        npc.position.x === gameState.character.position.x && 
        npc.position.y === gameState.character.position.y
    );
}

// Move character in a direction
function moveCharacter(direction) {
    // Don't allow movement while waiting for a choice
    if (gameState.isWaitingForChoice) {
        addToChat("You must make a choice first!");
        return false;
    }

    const newPosition = { ...gameState.character.position };
    
    switch (direction) {
        case 'up':
            if (newPosition.y > 0) newPosition.y--;
            break;
        case 'down':
            if (newPosition.y < 19) newPosition.y++;
            break;
        case 'left':
            if (newPosition.x > 0) newPosition.x--;
            break;
        case 'right':
            if (newPosition.x < 19) newPosition.x++;
            break;
    }
    
    // Check if the new position is valid (not water)
    const newTile = document.querySelector(`.map-tile[data-x="${newPosition.x}"][data-y="${newPosition.y}"]`);
    if (newTile && !newTile.classList.contains('water')) {
        gameState.character.position = newPosition;
        placeCharacter();
        moveNPCs(); // Move NPCs after player moves
        
        // Trigger event for player
        eventSystem.triggerEvent(gameState.character);
        
        return true;
    }
    return false;
}

// Update character stats display
function updateStats() {
    const stats = gameState.character;
    document.getElementById('char-name').textContent = stats.name;
    document.getElementById('char-gender').textContent = stats.gender;
    document.getElementById('char-level').textContent = stats.level;
    document.getElementById('char-race').textContent = stats.race;
    document.getElementById('char-strength').textContent = stats.attributes.strength;
    document.getElementById('char-endurance').textContent = stats.attributes.endurance;
    document.getElementById('char-agility').textContent = stats.attributes.agility;
    document.getElementById('char-perception').textContent = stats.attributes.perception;
    document.getElementById('char-intelligence').textContent = stats.attributes.intelligence;
    document.getElementById('char-wisdom').textContent = stats.attributes.wisdom;
    document.getElementById('char-health').textContent = stats.health;
    document.getElementById('char-magic').textContent = stats.magic;
    document.getElementById('char-money').textContent = stats.money;
}

// Update inventory display
function updateInventory() {
    const inventoryLog = document.getElementById('inventory-log');
    inventoryLog.innerHTML = '';
    
    if (gameState.character.inventory.length === 0) {
        inventoryLog.textContent = 'Inventory is empty';
        return;
    }
    
    const itemCounts = {};
    gameState.character.inventory.forEach(item => {
        itemCounts[item] = (itemCounts[item] || 0) + 1;
    });
    
    for (const [item, count] of Object.entries(itemCounts)) {
        const itemElement = document.createElement('div');
        itemElement.textContent = `${item} x${count}`;
        inventoryLog.appendChild(itemElement);
    }
}

// Add message to chat log
function addToChat(message) {
    const chatLog = document.getElementById('chat-log');
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    chatLog.appendChild(messageElement);
    chatLog.scrollTop = chatLog.scrollHeight;
}

// Handle command input
function handleCommand(command) {
    command = command.toLowerCase().trim();
    addToChat(`> ${command}`);
    
    // If waiting for a choice, only process numbers
    if (gameState.isWaitingForChoice) {
        const choiceNum = parseInt(command);
        if (!isNaN(choiceNum) && choiceNum >= 1 && choiceNum <= eventSystem.currentEvent.choices.length) {
            const choice = eventSystem.currentEvent.choices[choiceNum - 1].value;
            eventSystem.processChoice(choice);
            return;
        } else {
            addToChat(`Please enter a number between 1 and ${eventSystem.currentEvent.choices.length}`);
            return;
        }
    }
    
    // Basic command handling
    switch (command) {
        case 'help':
            addToChat('Available commands: help, clear, look, move up, move down, move left, move right, use potion');
            break;
        case 'clear':
            document.getElementById('chat-log').innerHTML = '';
            break;
        case 'look':
            const npc = checkNPCInteraction();
            if (npc) {
                addToChat(`You see ${npc.name}, a ${npc.gender.toLowerCase()} ${npc.race}.`);
            } else {
                addToChat('You look around and see a randomly generated landscape.');
            }
            break;
        case 'use potion':
            if (gameState.character.usePotion()) {
                addToChat('You use a healing potion and restore 3 health!');
            } else {
                addToChat('You don\'t have any potions to use!');
            }
            break;
        case 'move up':
        case 'move down':
        case 'move left':
        case 'move right':
            const direction = command.split(' ')[1];
            if (moveCharacter(direction)) {
                addToChat(`You move ${direction}.`);
            } else {
                addToChat(`You cannot move ${direction} - there is water in the way or you've reached the edge of the map.`);
            }
            break;
        default:
            addToChat('Unknown command. Type "help" for available commands.');
    }
}

// Event system
const eventSystem = {
    currentEvent: null, // Track the current event
    // List of possible events
    events: [
        {
            name: "Combat",
            description: "You encounter a hostile creature! What will you do?",
            choices: [
                { text: "Fight the creature", value: "fight" },
                { text: "Try to run away", value: "run" }
            ],
            check: (character, choice) => {
                if (choice === 'run') {
                    const roll = Math.floor(Math.random() * (character.attributes.agility + 1));
                    return roll > 3; // Need to roll higher than 3 to escape
                } else {
                    const roll = Math.floor(Math.random() * (character.attributes.strength + 1));
                    return roll > 3; // Need to roll higher than 3 to win
                }
            },
            success: (character, choice) => {
                if (choice === 'run') {
                    return "You successfully escape the creature!";
                } else {
                    character.attributes.strength += 1;
                    updateStats();
                    return "You win the fight and feel stronger!";
                }
            },
            failure: (character, choice) => {
                if (choice === 'run') {
                    character.takeDamage(1);
                    updateStats();
                    return "You fail to escape and take 1 damage!";
                } else {
                    character.takeDamage(2);
                    updateStats();
                    return "You lose the fight and take 2 damage!";
                }
            }
        },
        {
            name: "Treasure",
            description: "You find a treasure chest!",
            check: (character) => {
                const roll = Math.floor(Math.random() * (character.attributes.perception + 1));
                return roll > 2; // Need to roll higher than 2 to find treasure
            },
            success: (character) => {
                const gold = Math.floor(Math.random() * 10) + 1;
                character.addMoney(gold);
                updateStats();
                return `You find ${gold} gold pieces!`;
            },
            failure: () => {
                return "The chest is empty...";
            }
        },
        {
            name: "Merchant",
            description: (character) => {
                const basePrice = 5;
                const discount = Math.floor(character.attributes.wisdom / 2);
                const finalPrice = Math.max(1, basePrice - discount);
                return `A traveling merchant offers you a healing potion for ${finalPrice} gold.`;
            },
            choices: [
                { text: "Buy the potion", value: "yes" },
                { text: "Decline the offer", value: "no" }
            ],
            check: (character, choice) => {
                if (choice === 'no') return false;
                const basePrice = 5;
                const discount = Math.floor(character.attributes.wisdom / 2);
                const finalPrice = Math.max(1, basePrice - discount);
                return character.money >= finalPrice;
            },
            success: (character) => {
                const basePrice = 5;
                const discount = Math.floor(character.attributes.wisdom / 2);
                const finalPrice = Math.max(1, basePrice - discount);
                if (character.spendMoney(finalPrice)) {
                    character.inventory.push('healing potion');
                    updateStats();
                    updateInventory();
                    return `You buy a healing potion for ${finalPrice} gold!`;
                }
                return "You don't have enough money...";
            },
            failure: () => {
                return "You decide not to buy the potion.";
            }
        },
        {
            name: "Training",
            description: "You find a training dummy. Which attribute would you like to train?",
            choices: [
                { text: "Strength", value: "strength" },
                { text: "Endurance", value: "endurance" },
                { text: "Agility", value: "agility" },
                { text: "Perception", value: "perception" },
                { text: "Intelligence", value: "intelligence" },
                { text: "Wisdom", value: "wisdom" }
            ],
            check: (character, choice) => {
                return ['strength', 'endurance', 'agility', 'perception', 'intelligence', 'wisdom'].includes(choice);
            },
            success: (character, choice) => {
                character.attributes[choice] += 1;
                updateStats();
                return `You practice and improve your ${choice}!`;
            },
            failure: () => "" // Never fails
        },
        {
            name: "Riddle",
            description: "A mysterious figure challenges you with a riddle.",
            choices: [
                { text: "Attempt to solve the riddle", value: "yes" },
                { text: "Decline the challenge", value: "no" }
            ],
            check: (character, choice) => {
                if (choice === 'no') return false;
                const roll = Math.floor(Math.random() * (character.attributes.intelligence + 1));
                return roll > 4; // Need to roll higher than 4 to solve
            },
            success: (character) => {
                const gold = Math.floor(Math.random() * 15) + 5;
                character.addMoney(gold);
                updateStats();
                return `You solve the riddle and earn ${gold} gold!`;
            },
            failure: (character, choice) => {
                if (choice === 'no') {
                    return "You decide not to attempt the riddle.";
                }
                character.takeDamage(1);
                updateStats();
                return "You fail to solve the riddle and take 1 damage from frustration!";
            }
        },
        {
            name: "Magic Fountain",
            description: "You find a magical fountain.",
            choices: [
                { text: "Drink from the fountain", value: "yes" },
                { text: "Leave it alone", value: "no" }
            ],
            check: (character, choice) => {
                if (choice === 'no') return false;
                const roll = Math.floor(Math.random() * (character.attributes.magic + 1));
                return roll > 2; // Need to roll higher than 2 to benefit
            },
            success: (character) => {
                character.magic += 1;
                updateStats();
                return "The fountain's magic enhances your magical abilities!";
            },
            failure: (character, choice) => {
                if (choice === 'no') {
                    return "You leave the magic fountain alone.";
                }
                character.takeDamage(1);
                updateStats();
                return "The fountain's magic backfires and you take 1 damage!";
            }
        }
    ],

    // Trigger a random event
    triggerEvent(character) {
        const event = this.events[Math.floor(Math.random() * this.events.length)];
        this.currentEvent = event; // Set the current event
        
        // Only show events in chat if it's the player character
        const isPlayer = character === gameState.character;
        if (isPlayer) {
            // Show event description
            if (typeof event.description === 'function') {
                addToChat(event.description(character));
            } else {
                addToChat(event.description);
            }
            
            // If this is a choice event, wait for player input
            if (event.choices) {
                gameState.isWaitingForChoice = true;
                addToChat("Choose an option:");
                event.choices.forEach((choice, index) => {
                    addToChat(`${index + 1}. ${choice.text}`);
                });
                
                const commandInput = document.getElementById('command-input');
                const sendButton = document.getElementById('send-command');
                
                const originalPlaceholder = commandInput.placeholder;
                commandInput.placeholder = "Enter the number of your choice...";
                
                const handleChoice = (input) => {
                    const choiceNum = parseInt(input);
                    if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > event.choices.length) {
                         // addToChat(`Please enter a number between 1 and ${event.choices.length}`);
                        return;
                    }
                    
                    const choice = event.choices[choiceNum - 1].value;
                    commandInput.placeholder = originalPlaceholder;
                    commandInput.removeEventListener('keypress', keyHandler);
                    sendButton.removeEventListener('click', clickHandler);
                    
                    this.processChoice(choice);
                };
                
                const keyHandler = (e) => {
                    if (e.key === 'Enter') {
                        handleChoice(commandInput.value);
                        commandInput.value = '';
                    }
                };
                
                const clickHandler = () => {
                    handleChoice(commandInput.value);
                    commandInput.value = '';
                };
                
                // Remove existing listeners to prevent duplicates
                commandInput.removeEventListener('keypress', keyHandler);
                sendButton.removeEventListener('click', clickHandler);
                
                commandInput.addEventListener('keypress', keyHandler);
                sendButton.addEventListener('click', clickHandler);
                return;
            }
        }
        
        // For non-choice events or NPC events, use default choice
        const success = event.check(character, event.choices ? event.choices[0].value : undefined);
        if (success) {
            const message = event.success(character);
            if (isPlayer && message) {
                addToChat(message);
            }
        } else {
            const message = event.failure(character);
            if (isPlayer && message) {
                addToChat(message);
            }
        }

        // Check for death after event
        if (!character.isAlive) {
            handleDeath(character);
        }
    },

    // Process the chosen option
    processChoice(choice) {
        const event = this.currentEvent;
        const character = gameState.character;
        const success = event.check(character, choice);
        if (success) {
            const message = event.success(character, choice);
            if (message) addToChat(message);
        } else {
            const message = event.failure(character, choice);
            if (message) addToChat(message);
        }
        
        gameState.isWaitingForChoice = false;
        updateInventory(); // Ensure inventory is updated
        
        // Check for death after event
        if (!character.isAlive) {
            handleDeath(character);
        }
    }
};

// Handle character death
function handleDeath(character) {
    if (character === gameState.character) {
        addToChat("GAME OVER! You have died. Refresh the page to start over.");
        // Disable command input
        const commandInput = document.getElementById('command-input');
        const sendButton = document.getElementById('send-command');
        commandInput.disabled = true;
        sendButton.disabled = true;
        commandInput.placeholder = "Game Over - Refresh to restart";
    } else {
        // Only show NPC death in chat if they die on the same tile as the player
        const npc = checkNPCInteraction();
        if (npc === character) {
            addToChat(`${character.name} has died!`);
        }
        // Remove dead NPC
        gameState.npcs = gameState.npcs.filter(npc => npc !== character);
        placeNPCs(); // Update NPC display
    }
}

// Initialize the game
function initGame() {
    // Generate a random character for the player first
    gameState.character = characterGenerator.generateCharacter();
    
    // Generate the map
    generateMap();
    
    // Set the character's position after the map exists
    gameState.character.position = getRandomValidPosition();
    
    // Generate 5 random NPCs
    for (let i = 0; i < 5; i++) {
        const npc = characterGenerator.generateCharacter();
        npc.position = getRandomValidPosition();
        gameState.npcs.push(npc);
    }
    
    // Place all characters on the map
    placeCharacter();
    placeNPCs();
    
    updateStats();
    updateInventory();
    addToChat(`Welcome to Ages of the Seven Kingdoms, ${gameState.character.name}! Press the arrow keys to move around, and the number of your choice for events. Type "help" for additional options.`);
    
    // Set up command input handling
    const commandInput = document.getElementById('command-input');
    const sendButton = document.getElementById('send-command');
    
    function processCommand() {
        const command = commandInput.value;
        if (command.trim()) {
            handleCommand(command);
            commandInput.value = '';
        }
    }
    
    sendButton.addEventListener('click', processCommand);
    commandInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            processCommand();
        }
    });
    
    // Add event listener for arrow keys and number keys
    window.addEventListener('keydown', (e) => {
        if (gameState.isWaitingForChoice) {
            const choiceNum = parseInt(e.key);
            if (!isNaN(choiceNum) && choiceNum >= 1 && choiceNum <= eventSystem.currentEvent.choices.length) {
                const choice = eventSystem.currentEvent.choices[choiceNum - 1].value;
                eventSystem.processChoice(choice);
            }
        } else {
            switch (e.key) {
                case 'ArrowUp':
                    moveCharacter('up');
                    break;
                case 'ArrowDown':
                    moveCharacter('down');
                    break;
                case 'ArrowLeft':
                    moveCharacter('left');
                    break;
                case 'ArrowRight':
                    moveCharacter('right');
                    break;
            }
        }
    });
}

// Start the game when the page loads
window.addEventListener('load', initGame); 