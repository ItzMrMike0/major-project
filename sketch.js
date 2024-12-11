// Fire Emblem
// Michael Yang
// 2024-11-21

// Credits
// Tileset acquired from https://forums.serenesforest.net/topic/24982-tileset-collection/
// Background music acquired from https://www.youtube.com/watch?v=Cx4GQH2tHYQ
// A lot of sprites taken from https://github.com/Klokinator/FE-Repo/tree/main
// Cursor moving sound acquired from https://www.youtube.com/watch?v=fkmp_YR9RXc
// Select character sound acquired from https://www.youtube.com/watch?v=7Z2sxm7CkPw
// Deselect character sound acquired from https://www.youtube.com/watch?v=U8wAHIaW4S0

// Tile Class: Represents individual tiles on the map, including their type, position, and dimensions
class Tile {
  constructor(type, x, y, width, height) {
    this.type = type;    // Tile type (G = ground, W = wall, M = mountain, etc)
    this.x = x;          // Grid x position
    this.y = y;          // Grid y position
    this.width = width;  // Tile width in pixels
    this.height = height;// Tile height in pixels
  }

  // Makes the map grid from level data
  static createTiles(lines) {
    tiles = [];
    for (let y = 0; y < lines.length; y++) {
      tiles.push([]);
      for (let x = 0; x < lines[y].length; x++) {
        const tileType = lines[y][x];
        tiles[y].push(new Tile(tileType, x, y, tilesWidth, tilesHeight));
      }
    }
    return tiles;
  }

  // Display all map tiles
  static displayAll(tiles) {
    for (let row of tiles) {
      for (let tile of row) {
        tile.renderTile();
      }
    }
  }
 
  // Draws tile using its type
  renderTile() {
    if (tileImages[this.type]) {
      image(tileImages[this.type], this.x * this.width, this.y * this.height, this.width, this.height);
    }
  }
 
  // Check if a tile is occupied by another character
  static isTileOccupied(x, y) {
    // Iterate through all character x and y
    for (let character of characters) {
      if (character.x === x && character.y === y) {
        return true;  
      }
    }
    return false;
  }

  // Check if a tile is walkable
  isWalkable() {
    return this.type !== 'W' && this.type !== 'M';
  }

  // Check if coordinates are within map bounds
  static isWithinMapBounds(x, y) {
    return x >= 0 && x < tilesWide && y >= 0 && y < tilesHigh;
  }

  // Display reachable and attackable tiles for the selected character
  static displayActionableTiles() {
    // Iterate through all characters to find selected character
    for (let character of characters) {
      if (character.isSelected) {
        // Draw blue squares to show character's reachable tiles
        for (let tile of character.reachableTiles) {
          let drawX = tile.x * tilesWidth;
          let drawY = tile.y * tilesHeight;
          fill(0, 0, 255, 100);
          noStroke();
          rect(drawX, drawY, tilesWidth, tilesHeight);
        }

        // Draw red squares to show character's attackable tiles
        for (let tile of character.attackableTiles) {
          let drawX = tile.x * tilesWidth;
          let drawY = tile.y * tilesHeight;
          fill(255, 0, 0, 100);
          noStroke();
          rect(drawX, drawY, tilesWidth, tilesHeight);
        }
      }
    }
  }
}  

// Character Class: Represents a character on the map, including their properties, state, and actions
class Character {
  constructor(name, classType, x, y, level, hp, strength, skill, speed, luck, defense, resistance, isEnemy, width = 50, height = 50) {
    // Basic properties
    this.name = name; // Name of character
    this.classType = classType; // Character class (Lord, Knight, etc)
    this.x = x; // X position on the tile grid
    this.y = y; // Y position on the tile grid
    this.level = level; // Character's level
    this.hp = hp; // HP stat
    this.strength = strength; // Strength stat
    this.skill = skill; // Skill stat
    this.speed = speed; // Speed stat
    this.luck = luck; // Luck stat
    this.defense = defense; // Physical defense stat
    this.resistance = resistance; // Magical defense stat
    this.isEnemy = isEnemy; // Is this character an enemy

    // Visual and gameplay properties
    this.isSelected = false; // Whether the character is selected
    this.canMove = true; // Whether the character can move or not
    this.isGreyedOut = false; // Whether the character is greyed out or not
    this.action = null; // The action the character is going to do (Attack, item, or wait)
    this.previousX = x; // X position of the character before movement
    this.previousY = y; // Y position of the character before movement
    this.width = width; // Width of character
    this.height = height; // Height of character
    this.currentState = "standing"; // Current animation state
    this.isMoving = false; // Whether the character is currently moving

    // Movement and attack calculations
    this.animation = null; // Character visual sprite
    this.reachableTiles = []; // Character reachable movement tiles
    this.attackableTiles = []; // Characters attackable movement tiles
  }

  // Helper function to create new characters based on provided data in character JSON
  static createCharacter(data) {
    // Create a new character with the data attributes
    let character = new Character(data.name, data.classType, data.x, data.y, data.level, data.hp,
      data.strength, data.skill, data.speed, data.luck, data.defense,
      data.resistance, data.isEnemy, data.width, data.height
    );

    // Set character's animation provided in character JSON
    character.animation = characterAnimations[data.animation];

    return character;
  }

  // Display the character on the map at their current position
  displayOnMap() {
    // Calculate the character's drawing dimensions
    let drawWidth = this.width;
    let drawHeight = this.height;

    // Set isSelectedAnimation to true if the character is selected
    const isSelectedAnimation = this.currentState === "selected";

    // Only increase width for left/right walking animations for Lord and Cavalier
    const isHorizontalWalking = this.currentState === "walkleft" || this.currentState === "walkright";
    if (isHorizontalWalking && (this.classType === "Lord" || this.classType === "Cavalier")) {
      drawWidth = 65;  // Larger width for walking animations
    }

    // If the character is selected and has the selected animation, increase the size slightly for visual effect
    if (this.isSelected && isSelectedAnimation) {
      console.log("increase size");
      drawWidth += 15;
      drawHeight += 15;
    }
   
    // Calculate the character's position on the map, centering it within the grid cell
    let drawX = this.x * tilesWidth + (tilesWidth - drawWidth) / 2;
    let drawY = this.y * tilesHeight + (tilesHeight - drawHeight) / 2;

    // Adjust Y-position if the character is selected and has isSelectedAnimation so the character won't display under their grid cell
    if (this.isSelected && isSelectedAnimation) {
      drawY -= 7;
      // Further adjustment for Cavaliers if selected, as their base height is taller
      if (this.classType === "Cavalier") {
        drawY -= 7;
      }

      // Draw a yellow border around the selected character to indicate selection
      noFill();
      stroke(255, 255, 0);
      strokeWeight(3);
      rect(drawX, drawY, drawWidth, drawHeight);
    }

    // If the character is not selected but is a Cavalier, adjust the Y-position as their base height is taller
    else if (this.classType === "Cavalier") {
      drawY -= 7;
    }

    // If the character has already moved or acted, apply a grey tint to show it's inactive
    if (this.isGreyedOut) {
      tint(100);
    }
   
    // If the character is active, ensure no tint is applied
    else {
      noTint();
    }

    // Draw the character's animation at the calculated position
    image(this.animation, drawX, drawY, drawWidth, drawHeight);
  }

  // Selects a character at the cursor's position
  static selectCharacter() {
    // Check for valid character selection at cursor position
    for (let character of characters) {
      if (character.x === locationCursor.x && character.y === locationCursor.y && !character.isEnemy && !character.isGreyedOut) {
        // Play selection sound effect
        sounds.selectCharacter.amp(0.4);
        sounds.selectCharacter.play();
   
        // Update cursor to show selection state
        cursorImageKey = "selectedCursor";

        // Play character-specific voice line
        const voiceKey = `${character.name}SelectVoice`;
        if (sounds[voiceKey]) {
          sounds[voiceKey].play();
        }
        else {
          console.warn(`Select voice line for "${character.name}" not preloaded.`);
        }

        // Update selection state and animation
        selectedCharacter = character;
        character.isSelected = true;
        animationManager(character, "selected");
        console.log(`${character.name} is now selected.`);

        // Calculate possible movement options
        character.calculateActionableTiles();
        break;
      }
    }
  }

  // Deselects the currently selected character
  static unselectCharacter(playSound) {
    if (selectedCharacter) {
      // Reset character's animation and selection state
      animationManager(selectedCharacter, "standing");
      selectedCharacter.isSelected = false;
      selectedCharacter = null;
 
      // Play unselect sound effect
      if (playSound) {
        sounds.unselectCharacter.amp(0.5);
        sounds.unselectCharacter.play();
      }
 
      console.log("Character deselected.");
    }
    else {
      console.log("No characters are selected.");
    }
  }

  // Movement range values based on class type (How many tiles a character can walk in one turn)
  getMovementRange() {
    const movementRanges = {
      "Lord": 3,
      "Knight": 2,
      "Cavalier": 4,
      "Archer": 3,
      "Mage": 3,
    };
    return movementRanges[this.classType];
  }

  // Attack range based on class type (How many tiles a unit can attack from)
  getAttackRange() {
    const attackRanges = {
      "Archer": 2,
      "Mage": 2,
    };
    // Return 1 if not archer or mage
    return attackRanges[this.classType] || 1;
  }

  // Calculate reachable and attackable tiles using Dijkstra's algorithm
  calculateActionableTiles() {
    // Arrays for reachable and attackable tiles
    this.reachableTiles = [];
    this.attackableTiles = [];

    // Get movement range and attack range of character
    const movementRange = this.getMovementRange();
    const attackRange = this.getAttackRange();

    // Initialize visited set and queue for Dijkstra's algorithm, starting at the character's current position
    const visited = new Set([`${this.x},${this.y}`]);
    const queue = [{ x: this.x, y: this.y, cost: 0 }];

    while (queue.length > 0) {
      // Sort by cost and get the lowest cost tile
      queue.sort((a, b) => a.cost - b.cost);
      const current = queue.shift();
      const { x, y, cost } = current;

      // Check if tile is within movement range and add to reachable tiles
      if (cost <= movementRange) {
        this.reachableTiles.push({ x, y });
      }
      // Check if tile is within attack range and walkable, then add to attackable tiles
      else if (cost <= movementRange + attackRange && tiles[y][x].isWalkable()) {
        this.attackableTiles.push({ x, y });
      }

      // Skip exploring further tiles if we've exceeded the combined movement and attack range
      if (cost > movementRange + attackRange) {
        continue;
      }

      // Explore adjacent tiles (up, down, left, right)
      const directions = [
        { x: x, y: y - 1 }, // up
        { x: x, y: y + 1 }, // down
        { x: x + 1, y: y }, // right
        { x: x - 1, y: y }  // left
      ];

      // Process each adjacent tile
      for (const dir of directions) {
        const nextX = dir.x;
        const nextY = dir.y;
        const nextKey = `${nextX},${nextY}`;

        // Skip if out of bounds, already visited, or not walkable
        if (!Tile.isWithinMapBounds(nextX, nextY) ||
            visited.has(nextKey) ||
            !tiles[nextY][nextX].isWalkable()) {
          continue;
        }

        // Add adjacent tile to queue and mark as visited
        queue.push({ x: nextX, y: nextY, cost: cost + 1 });
        visited.add(nextKey);
      }
    }
  }
 
  // Move the character to a new location gradually
  moveTo(newX, newY) {
    // Save the previous position
    this.previousX = this.x;
    this.previousY = this.y;

    const path = Character.findPath({ x: this.x, y: this.y }, { x: newX, y: newY }, tiles);
    if (!path) {
      console.log("No path found!");
      return;
    }
 
    // Character is now moving 
    this.isMoving = true;
 
    // characterWait = false;
    const moveStep = (index) => {
      // If the path is complete, set the final position and stop the movement
      if (index >= path.length) {
        this.x = newX;
        this.y = newY;

        // Keep the character selected and show the action menu
        this.isSelected = true;
        this.isMoving = false;
        actionMenu.show(this.x, this.y);
        return;
      }
 
      // Current and target positions from the path
      const { x: startX, y: startY } = this;
      const { x: targetX, y: targetY } = path[index];
 
      // Calculate direction for movement
      const dx = targetX - startX;
      const dy = targetY - startY;

      // Play walking sound effect depending on the character class
      let walkSound;
      if (this.classType === "Cavalier") {
        walkSound = sounds.horseWalking;
      }
      else if (this.classType === "Knight") {
        walkSound = sounds.armorWalking;
      }
      else {
        walkSound = sounds.regularWalking;
      }
      if (walkSound && walkSound.isLoaded()) {
        walkSound.amp(0.4);
        walkSound.play();
      }
 
      // Set walking animation based on direction
      if (dx === 1) {
        animationManager(this, "walkright");
      }
      else if (dx === -1) {
        animationManager(this, "walkleft");
      }
      else if (dy === 1) {
        animationManager(this, "walkdown");
      }
      else if (dy === -1) {
        animationManager(this, "walkup");
      }
 
      // Duration and progress tracking for smooth movement
      const duration = 200; // ms to move between tiles
      let startTime = millis();
 
      const animateStep = () => {
        let elapsed = millis() - startTime;
        let progress = Math.min(elapsed / duration, 1); // Ensure progress doesn't exceed 1
 
        // Calculate and update position for smooth animation
        this.renderX = startX + (targetX - startX) * progress;
        this.renderY = startY + (targetY - startY) * progress;
 
        // If step is complete, finalize position and proceed to the next step
        if (progress < 1) {
          // Keep animating the current step
          requestAnimationFrame(animateStep);
        }
        else {
          // Finalize position and move to the next step in the path
          this.x = targetX;
          this.y = targetY;
          moveStep(index + 1);
        }
      };
 
      // Start the animation for the current step
      animateStep();
    };
 
    // Begin the movement sequence
    moveStep(0);
  }
 
  // Move the selected character to a new location
  static moveSelectedCharacter(cursor, tiles) {
    if (selectedCharacter && selectedCharacter.canMove) {
      // Calculate the distance to the target tile
      const distance = Math.abs(cursor.x - selectedCharacter.x) + Math.abs(cursor.y - selectedCharacter.y);

      // Check if the target tile is within movement range
      if (distance <= selectedCharacter.getMovementRange() && selectedCharacter.reachableTiles.some(tile => tile.x === cursor.x && tile.y === cursor.y)) {
        const tile = tiles[cursor.y][cursor.x];

        // Ensure the target tile is walkable and not occupied
        if (tile.type !== "W" && tile.type !== "M" && !Tile.isTileOccupied(cursor.x, cursor.y)) {
          // Store previous position before moving
          selectedCharacter.previousX = selectedCharacter.x;
          selectedCharacter.previousY = selectedCharacter.y;

          // Move the character to the new location
          selectedCharacter.moveTo(cursor.x, cursor.y);

          console.log(`${selectedCharacter.name} moved to (${cursor.x}, ${cursor.y})`);

          // When character is walking, set isSelected to false so width and height don't increase
          selectedCharacter.isSelected = false;

          // Play move sound effect
          sounds.selectCharacter.amp(0.1);
          sounds.selectCharacter.play();
        }
        else {
          console.log("Cannot move to this tile.");
        }
      }
      else {
        console.log("Target location is out of range.");
      }
    }
  }


  // Use A* algorithm to find a path to the selected tile
  static findPath(start, goal, tiles) {
    // Stores the tiles to be evaluated. Each tile contains its coordinates, g, and f values
    const openSet = [{ x: start.x, y: start.y, g: 0, f: 0 }];

    // Used to reconstruct the path later (stores the parent of each tile)
    const cameFrom = {};

    // Keeps track of visited tiles to avoid revisiting them
    const visited = new Set();
    visited.add(`${start.x},${start.y}`);
   
    // Define adjacent directions (up, right, down, left)
    const directions = [
      { x: 0, y: 1 }, { x: 1, y: 0 },
      { x: 0, y: -1 }, { x: -1, y: 0 }
    ];
   
    // Heuristic function for estimating the distance between two points using Manhattan distance
    const heuristic = (x1, y1, x2, y2) => Math.abs(x1 - x2) + Math.abs(y1 - y2);
   
    // Process tiles by lowest f score
    while (openSet.length > 0) {
      // Sort by the lowest f score
      openSet.sort((a, b) => a.f - b.f);

      // Get the tile with the lowest f score
      const current = openSet.shift();
   
      // If the goal is reached, reconstruct the path
      if (current.x === goal.x && current.y === goal.y) {
        const path = [];
        let curr = `${goal.x},${goal.y}`;

        // Reconstruct the path by following the "cameFrom" references back to the start
        while (cameFrom[curr]) {
          const [x, y] = curr.split(',').map(Number);
          path.push({ x, y });
          curr = cameFrom[curr];
        }

        // Reverse the path so that it starts from the beginning
        return path.reverse();
      }
   
      // Explore adjacent tiles
      for (const { x: dx, y: dy } of directions) {
        const neighborX = current.x + dx;
        const neighborY = current.y + dy;
        const tileKey = `${neighborX},${neighborY}`;
   
        // Skip tile is not on canvas
        if (neighborX < 0 || neighborX >= tiles[0].length || neighborY < 0 || neighborY >= tiles.length) {
          continue;
        }
   
        // Skip tiles that aren't walkable and have already been visited
        const tile = tiles[neighborY][neighborX];
        if (tile.type === 'W' || tile.type === 'M' || visited.has(tileKey)) {
          continue;
        }

        // Calculate the movement cost to move to this tile
        const g = current.g + 1;

        // Calculate the heuristic estimate of how far the goal is from the current tile
        const h = heuristic(neighborX, neighborY, goal.x, goal.y);

        // f is the total estimated cost (f = g + h)
        const f = g + h;

        // Add the neighbor to the openSet to evaluate it next, with its updated g and f values
        openSet.push({ x: neighborX, y: neighborY, g, f });

        // Mark the neighbor as visited
        visited.add(tileKey);

        // Record the current tile as the parent of the neighbor (for path reconstruction)
        cameFrom[tileKey] = `${current.x},${current.y}`;
      }
    }
    return null; // No path found
  }

  // Helper function to get the selected character
  static getSelectedCharacter() {
    for (let character of characters) {
      if (character.isSelected) {
        return character;
      }
    }
    return null;
  }

  // Attack logic for the character
  attack() {
    // Logic for attacking
  }
}

// Action Menu class: Handles the menu that appears after moving a character
class ActionMenu {
  constructor() {
    this.options = ["Attack", "Item", "Wait"];
    this.selectedOption = 0;
    this.isVisible = false;
    this.x = 0;
    this.y = 0;
  }

  // Show the action menu
  show(x, y) {
    this.x = x * tilesWidth + tilesWidth; // Calculate x location
    this.y = y * tilesHeight; // Calculate y location
    this.isVisible = true; // Set action menu to be visible
    this.selectedOption = 0; // Set option to the very top most option
  }

  // Hide the action menu
  hide() {
    this.isVisible = false;
  }

  // Move the selection choice up or down
  moveSelection(direction) {
    // If user presses W move option up
    if (direction === "up") {
      this.selectedOption = (this.selectedOption - 1 + this.options.length) % this.options.length;
    }
    // If user presses S move option up
    else if (direction === "down") {
      this.selectedOption = (this.selectedOption + 1) % this.options.length;
    }
  }

  // Render the action menu
  display() {
    if (!this.isVisible) {
      return;
    }

    // Menu background
    fill(50, 50, 50);
    stroke(255);
    strokeWeight(2);
    rect(this.x, this.y, 100, this.options.length * 30);
    noStroke();

    // Text of menu
    textSize(16);
    for (let i = 0; i < this.options.length; i++) {
      if (i === this.selectedOption) {
        fill(255, 255, 0);
        rect(this.x + 5, this.y + i * 30 + 5, 90, 25);
        fill(0);
      }
      else {
        fill(255);
      }
      text(this.options[i], this.x + 10, this.y + 22 + i * 30);
    }
  }

  // Obtain the selected option
  getSelectedOption() {
    return this.options[this.selectedOption];
  }
}

// Cursor class: Renders the cursor used for selecting tiles and moving characters
class Cursor {
  constructor(x = 2, y = 12) {
    this.x = x;  // Horizontal position (in tile coordinates)
    this.y = y;  // Vertical position (in tile coordinates)
    this.width = tilesWidth;
    this.height = tilesHeight;
  }

  // Move the cursor based on input (WASD)
  move(direction) {
    // Plays cursor moving sound effect
    sounds.cursorMoving.amp(0.1);
    sounds.cursorMoving.play();

    // Change x or y depending on direction input, ensuring the cursor stays within bounds
    if (direction === 'up' && this.y > 0) {
      this.y--;
    }

    if (direction === 'down' && this.y < tilesHigh - 1) {
      this.y++;
    }

    if (direction === 'left' && this.x > 0) {
      this.x--;
    }

    if (direction === 'right' && this.x < tilesWide - 1) {
      this.x++;
    }
  }

  // Render the cursor on the screen
  renderCursor() {
    // Get the current image based on the key
    let currentImage = cursorImages[cursorImageKey];
 
    // Scale the cursor image vertically (Increase height by 20%)
    let scaledHeight = this.height * 1.2;
   
    // Calculate the offset to center the cursor image vertically
    let offsetY = (scaledHeight - this.height) / 2;
 
    // Draw the cursor image
    image(
      currentImage,
      this.x * this.width,
      this.y * this.height - offsetY,
      this.width,
      scaledHeight
    );
  }
}  

// GLOBAL VARIABLES
let levelToLoad, lines; // Level file to load and its content (lines)
let tilesHigh, tilesWide, tilesWidth, tilesHeight; // Tile grid dimensions and sizes
let tileImages = {}, tiles = [], tilePaths; // Tile assets, objects, and paths
let sounds = {}, soundPaths; // Sound assets and paths
let characterMapSpritePaths, characterAnimations = {}, characters = [], characterData, selectedCharacter; // Character assets and data
let cursorImages = {}, cursorImageKey = "default", cursorPaths, locationCursor; // Cursor assets and location
const GAME_STATES = { TITLESCREEN: "TITLESCREEN", GAMEPLAY: "gameplay" }; // Possible game states
let lastMoveTimeW = 0, lastMoveTimeA = 0, lastMoveTimeS = 0, lastMoveTimeD = 0; // Last move times for each direction
let gameState = GAME_STATES.GAMEPLAY; // Current game state
let actionMenu, actionMenuImages; // Action menu object

function preload() {
  // Preload map information
  levelToLoad = "Assets/Levels/0.txt"; // Path to the level file
  lines = loadStrings(levelToLoad); // Load the level as an array of strings

  // Preload tile images from JSON
  tilePaths = loadJSON("Assets/Tiles/tilesPath.json", setupTileImages);

  // Load the sounds JSON
  soundPaths = loadJSON("Assets/Sounds/sounds.json", setupSounds);

  // Load character map sprite paths for animations
  characterMapSpritePaths = loadJSON("Assets/CharacterMapSprites/characterMapSpritesPaths.json", setupCharacterMapSpriteAnimations);

  // Load character data from JSON
  characterData = loadJSON("Assets/Characters/characters.json");

  // Preload cursor images from JSON
  cursorPaths = loadJSON("Assets/Cursor/cursorImages.json", setupCursorImages);
}

function setup() {
  // 4:3 ratio
  createCanvas(1000, 750);

  // Calculate tile grid dimensions based on the canvas size and level layout
  tilesHigh = lines.length;
  tilesWide = lines[0].length;
  tilesWidth = width / tilesWide;
  tilesHeight = height / tilesHigh;

  // Loop background music and set volume
  sounds.backgroundMusic.loop(true);
  sounds.backgroundMusic.amp(0.1);

  // Disable right-click menu
  window.addEventListener('contextmenu', (e) => e.preventDefault());
 
  // Create a 2D array of Tile objects based on the level layout
  tiles = Tile.createTiles(lines);

  // Create characters from the loaded JSON data
  for (let charData of characterData.characters) {
    // Add each character to the characters array
    characters.push(Character.createCharacter(charData));
  }

  // Initialize the cursor
  locationCursor = new Cursor();

  // Initialize the action menu
  actionMenu = new ActionMenu();
}

// Initialize tileImages after the tile path JSON is loaded
function setupTileImages(data) {
  for (let type in data) {
    // Load the image for each tile type
    tileImages[type] = loadImage(data[type]);
  }
}

// Initialize characterAnimations after the sprite paths JSON is loaded
function setupCharacterMapSpriteAnimations(data) {
  for (let name in data) {
    // Load each character animation sprite
    characterAnimations[name] = loadImage(data[name]);
  }
}

// Initialize sounds after the sounds JSON is loaded
function setupSounds(data) {
  for (let soundName in data) {
    // Load each sound effect
    sounds[soundName] = loadSound(data[soundName]);
  }
}

// Initialize cursorImages after the cursor images JSON is loaded
function setupCursorImages(data) {
  for (let key in data) {
    // Load each cursor image
    cursorImages[key] = loadImage(data[key]);
  }
}

// Initialize actionMenuImages after the action menu paths JSON is loaded
function setupActionMenuImages(data) {
  for (let type in data) {
    // Load the image for each menu element
    actionMenuImages[type] = loadImage(data[type]);
  }
}

// Handles animation changes based on the character's state (e.g., walking, standing)
function animationManager(character, state) {
  if (!character) {
    console.error("Animation manager called with an invalid character.");
    return;
  }

  // Map states to file paths for different animations (e.g., walking, standing)
  const statePaths = {
    "standing": `Assets/CharacterMapSprites/StandingGifs/${character.classType.toLowerCase()}standing.gif`,
    "selected": `Assets/CharacterMapSprites/SelectedGifs/${character.classType.toLowerCase()}selected.gif`,
    "walkleft": `Assets/CharacterMapSprites/WalkingGifs/${character.classType.toLowerCase()}walkleft.gif`,
    "walkright": `Assets/CharacterMapSprites/WalkingGifs/${character.classType.toLowerCase()}walkright.gif`,
    "walkup": `Assets/CharacterMapSprites/WalkingGifs/${character.classType.toLowerCase()}walkup.gif`,
    "walkdown": `Assets/CharacterMapSprites/WalkingGifs/${character.classType.toLowerCase()}walkdown.gif`,
  };

  // If the state exists, load the corresponding animation
  if (statePaths[state]) {
    // Load the animation
    character.animation = loadImage(statePaths[state]);
    // Update the current state
    character.currentState = state;
  }
  else {
    console.warn(`Unknown animation state: ${state}`);
  }
}

// Handle all inputs
function keyPressed() {
  // Reset cursor image to default on key press
  cursorImageKey = "default";

  // Handle action menu navigation first if menu is visible
  if (actionMenu.isVisible) {
    if (key === "w") {
      // If w is pressed move selection up and play sound
      actionMenu.moveSelection("up");
      sounds.cursorSelection.play();
    }
    else if (key === "s") {
      // If s is pressed move selection down and play sound
      actionMenu.moveSelection("down");
      sounds.cursorSelection.play();
    }
    else if (key === "j") {
      // If j is pressed select the highlighted option
      let selectedCharacter = Character.getSelectedCharacter();
      if (selectedCharacter) {
        const selectedOption = actionMenu.getSelectedOption();
       
        // If the option was "Wait"
        if (selectedOption === "Wait") {
          selectedCharacter.canMove = false;
          selectedCharacter.isGreyedOut = true;
          selectedCharacter.action = "wait";
          actionMenu.hide();
          Character.unselectCharacter(false);
          sounds.selectOption.play();
        }
      }
    }
    else if (key === "k") {
      // If k is pressed cancel the action menu and move character back to their previous location
      const selectedCharacter = Character.getSelectedCharacter();
      if (selectedCharacter) {
        sounds.unselectCharacter.play();
        selectedCharacter.x = selectedCharacter.previousX;
        selectedCharacter.y = selectedCharacter.previousY;
        selectedCharacter.isSelected = true;
        selectedCharacter.canMove = true;
        selectedCharacter.isGreyedOut = false;
        animationManager(selectedCharacter, "selected");
        actionMenu.hide();
      }
    }
    // Prevent any other keys from working while menu is open
    return; 
  }

  // If menu is not visible, handle normal game controls
  if (key === "j") {
    const selectedCharacter = Character.getSelectedCharacter();
   
    // If there is a selected character and j is pressed move the character
    if (selectedCharacter) {
      Character.moveSelectedCharacter(locationCursor, tiles);
    }
    // If there is not a selected character and j is pressed select character
    else {
      Character.selectCharacter();
    }
  }
  // If k is pressed unselect character
  else if (key === "k") {
    Character.unselectCharacter(true);
  }
}

// Allows user to hold down movement keys for continuous movement
function holdCursorMovement() {
  // Don't move cursor if action menu is open or character is moving
  if (actionMenu.isVisible || selectedCharacter?.isMoving) {
    return;
  }

  // Get the current time
  const currentTime = millis();
  // Delay before cursor moves to the next tile
  const moveDelay = 200;

  // 'W' key - Move up
  if (keyIsDown(87) && currentTime - lastMoveTimeW > moveDelay) {
    // Send input to move up
    locationCursor.move("up");

    // Update the last move times for up direction
    lastMoveTimeW = currentTime;
  }
  // 'A' key - Move left
  if (keyIsDown(65) && currentTime - lastMoveTimeA > moveDelay) {  
    // Send input to move left
    locationCursor.move("left");
   
    // Update the last move times for left direction
    lastMoveTimeA = currentTime;
  }
  // 'S' key - Move down
  if (keyIsDown(83) && currentTime - lastMoveTimeS > moveDelay) {  
    // Send input to move down
    locationCursor.move("down");

    // Update the last move times for down direction
    lastMoveTimeS = currentTime;
  }
  // 'D' key - Move right
  if (keyIsDown(68) && currentTime - lastMoveTimeD > moveDelay) {  
    // Send input to move right
    locationCursor.move("right");
   
    // Update the last move times for right direction
    lastMoveTimeD = currentTime;
  }
}

// Main game loop for rendering everything on the screen
function draw() {
  // Only run if the game state is gameplay
  if (gameState === GAME_STATES.GAMEPLAY) {
    // Handle cursor movement with WASD keys
    holdCursorMovement();

    // Display all maptiles
    Tile.displayAll(tiles);

    // Highlight reachable tiles in blue and attackable tiles in red
    Tile.displayActionableTiles();

    // Display all characters on the map
    for (let character of characters) {
      character.displayOnMap();
    }

    // Render the cursor
    locationCursor.renderCursor();

    // Display the action menu
    actionMenu.display();
  }
}