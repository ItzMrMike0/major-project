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

// Tile class
class Tile {
  constructor(type, x, y, width, height) {
    this.type = type;  // Type of the tile ("G", "W", etc.)
    this.x = x;        // x-coordinate in the grid
    this.y = y;        // y-coordinate in the grid
    this.width = width; // Width of the tile
    this.height = height; // Height of the tile
  }

  // Render a single tile
  renderTile() {
    if (tileImages[this.type]) {
      image(tileImages[this.type], this.x * this.width, this.y * this.height, this.width, this.height);
    }
  }
  
  // Create a grid of tiles from lines of data
  static createTiles(lines) {
    // Clear tiles array before creating new tiles to get rid of previous data
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

  // Iterate through all tiles and display them
  static displayAll(tiles) {
    for (let row of tiles) {
      for (let tile of row) {
        tile.renderTile();
      }
    }
  }
}  


// Character class
class Character {
  constructor(name, classType, x, y, level, hp, strength, skill, speed, luck, defense, resistance, isEnemy, width = 50, height = 50) {
    this.name = name; // Character name
    this.classType = classType; // Character class type
    this.x = x; // Character x location
    this.y = y; // Character y location
    this.level = level; // Character level
    this.hp = hp; // Character hp stat
    this.strength = strength; // Character strength stat for physical attacks
    this.skill = skill; // Character skill stat for magic attacks
    this.speed = speed; // Character speed stat
    this.luck = luck; // Character luck stat
    this.defense = defense; // Character defense stat agaisnt physical attacks
    this.resistance = resistance; // Character resistance stat agaisnt magic attacks
    this.isSelected = false; // Track if the character has been selected
    this.animation = null; // Character's GIF animation
    this.isEnemy = isEnemy; // Key to see if character is enemy or not
    this.width = width; // Width for displaying GIF (default 65)
    this.height = height; // Height for displaying GIF (default 65)
    this.canMove = true; // Track if the character can make a move this turn
    this.isGreyedOut = false; // Property for greying out once turn has been used
    this.reachableTiles = []; // Property to store reachable tiles
    this.attackableTiles = []; // Property to store attackable range tiles
  }

  // Determine how many tiles a unit can move based off of class type
  getMovementRange() {
    // Movement range based on class type
    const movementRanges = {
      "Lord": 3,
      "Knight": 2,
      "Cavalier": 4,
      "Archer": 3,
      "Mage": 3
    };
    return movementRanges[this.classType];
  }

  // Determine how many tiles a unit can attack from based on class type
  getAttackRange() {
    const attackRanges = {
      "Archer": 2, // Archers can attack 2 tiles away
      "Mage": 2,   // Mages can attack 2 tiles away
    };
    return attackRanges[this.classType] || 1; // Default is 1 tile for melee attackers
  }

  // Calculate reachable and attackable tiles using Dijkstra's algorithm
  calculateReachableTiles() {
    // Clear previously stored tiles
    this.reachableTiles = []; 
    this.attackableTiles = [];

    // Get movement range and attack range of character
    const movementRange = this.getMovementRange();
    const attackRange = this.getAttackRange();

    // Priority queue for Dijkstra, starts with the character's current position
    const queue = [{ x: this.x, y: this.y, cost: 0 }];
    // Track visited tiles to avoid revisiting
    const visited = new Set();
    visited.add(`${this.x},${this.y}`);

    // Directions for adjacent tiles (up, down, left, right)
    const directions = [{ dx: 0, dy: 1 }, { dx: 0, dy: -1 }, { dx: 1, dy: 0 }, { dx: -1, dy: 0 }];

    while (queue.length) {
      // Sort by movement cost (ascending) and process the tile with the lowest cost
      queue.sort((a, b) => a.cost - b.cost);
      const { x, y, cost } = queue.shift();

      // Add the tile to reachable tiles if it's within movement range
      if (cost <= movementRange) {
        this.reachableTiles.push({ x, y });
      }

      // Add to attackable tiles if it's within attack range but outside movement range
      if (cost > movementRange && cost <= movementRange + attackRange) {
        const tile = tiles[y][x];
        if (tile.type !== 'W' && tile.type !== 'M') {
          this.attackableTiles.push({ x, y });
        }
      }

      // Explore adjacent tiles
      for (const { dx, dy } of directions) {
        const nextX = x + dx;
        const nextY = y + dy;

        // Check if the next tile is within map bounds
        if (nextX >= 0 && nextX < tilesWide && nextY >= 0 && nextY < tilesHigh) {
          const tile = tiles[nextY][nextX];
          const nextTileKey = `${nextX},${nextY}`;

          // Skip tiles that are water, mountains, or already visited
          if (tile.type === 'W' || tile.type === 'M' || visited.has(nextTileKey)) {
            continue;
          }

          // Add the next tile to the queue with an incremented cost
          queue.push({ x: nextX, y: nextY, cost: cost + 1 });
          // Mark the tile as visited
          visited.add(nextTileKey); 
        }
      }
    }
  }


  // Display the character on the map
  displayOnMap() {
    if (this.animation) {
      let drawWidth = this.width;
      let drawHeight = this.height;

      // Adjust dimensions if the character is selected
      if (this.isSelected) {
        drawWidth += 15;
        drawHeight += 15;
      }

      // Calculate centered position for the character
      let drawX = this.x * tilesWidth + (tilesWidth - drawWidth) / 2;
      let drawY = this.y * tilesHeight + (tilesHeight - drawHeight) / 2;

      // Adjust Y-position based classType
      if (this.isSelected) {
        if (this.classType === "Cavalier") {
          drawY -= 10;
        }
        else {
          drawY -= 5;
        }
      }
      else if (this.classType === "Cavalier") {
        drawY -= 5;
      }
   
      // Draw a selection border if the character is selected
      if (this.isSelected) {
        noFill();
        stroke(255, 255, 0); // Yellow border
        strokeWeight(3);
        rect(drawX, drawY, drawWidth, drawHeight);
      }

      // Apply a grey tint to the character if the character has used their turn
      if (this.isGreyedOut) {
        tint(100);
      }
      else {
        // Ensure no tint is applied if the character has not moved yet
        noTint();
      }

      // Draw the character's animation at the calculated position
      image(this.animation, drawX, drawY, drawWidth, drawHeight);
    }
  }

  // Move the character to a new location
  moveTo(newX, newY) {
    this.x = newX;
    this.y = newY;
  }

  // Attack logic for the character
  attack() {
    // Logic for attacking
  }
}

// Cursor class
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
    // Center the image vertically
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

// Global variables
let levelToLoad; // Text file to load
let lines; // What each line from text file says
let tilesHigh; // How many tiles high
let tilesWide; // How many tiles wide
let tilesWidth; // How wide each tile is
let tilesHeight; // How tall each tile is
let tileImages = {}; // Object to store tile images
let tiles = []; // Array to store Tile objects
let tilePaths; // To store the tile paths loaded from JSON
let sounds = {}; // Object to store sounds
let soundPaths; // To store the sound paths loaded from JSON
let characterMapSpritePaths; // To store character paths loaded from JSON
let characterAnimations = {}; // Object to store character animations
let characters = []; // Array to store character instances
let characterData; // Holds character data information
let cursorImages = {}; // Object to hold cursor images
let cursorImageKey = "default"; // Tracks the current cursor image key
let cursorPaths; // To store the cursor paths loaded from JSON
const MOVE_DELAY = 200; // Delay in frames before moving cursor to the next tile
let lastMoveTimeW = 0; // Tracks the time of the last cursor movement upwards
let lastMoveTimeA = 0; // Tracks the time of the last cursor movement to the left
let lastMoveTimeS = 0; // Tracks the time of the last cursor movement downwards
let lastMoveTimeD = 0; // Tracks the time of the last cursor movement to the right
const GAME_STATES = { // Possible game states
  TITLESCREEN: "TITLESCREEN",
  GAMEPLAY: "gameplay",
}
let gameState = GAME_STATES.GAMEPLAY; // Set gameState 


function preload() {
  // Preload map information
  levelToLoad = "Assets/Levels/0.txt";
  lines = loadStrings(levelToLoad);

  // Preload tile images
  tilePaths = loadJSON("Assets/Tiles/tilesPath.json", setupTileImages);

  // Load the sounds JSON
  soundPaths = loadJSON("Assets/Sounds/sounds.json", setupSounds);

  // Load character map sprite paths from JSON
  characterMapSpritePaths = loadJSON("Assets/CharacterMapSprites/characterMapSpritesPaths.json", setupCharacterMapSpriteAnimations);

  // Load character data from JSON
  characterData = loadJSON("Assets/Characters/characters.json");

  // Preload images of cursor
  cursorPaths = loadJSON("Assets/Cursor/cursorImages.json", setupCursorImages);
}

function setup() {
  // 4:3 ratio
  createCanvas(1000, 750);
  tilesHigh = lines.length;
  tilesWide = lines[0].length;
  tilesWidth = width / tilesWide;
  tilesHeight = height / tilesHigh;

  // Loop background music
  sounds.backgroundMusic.loop(true);
  sounds.backgroundMusic.amp(0.1);

  // Disable right-click menu
  window.addEventListener('contextmenu', (e) => e.preventDefault());
 
  // Create a 2D array of Tile objects
  tiles = Tile.createTiles(lines);

  // Create characters from JSON
  for (let char of characterData.characters) {
    createCharacter(
      char.name,
      char.classType,
      char.x,
      char.y,
      char.level,
      char.hp,
      char.strength,
      char.skill,
      char.speed,
      char.luck,
      char.defense,
      char.resistance,
      char.animation,
      char.isEnemy,
      char.width,
      char.height
    );
  }
 
  // Initialize the cursor at the top-left tile
  locationCursor = new Cursor();
}

// Initialize tileImages after JSON is loaded
function setupTileImages(data) {
  for (let type in data) {
    tileImages[type] = loadImage(data[type]);
  }
}

// Initialize characterAnimations after JSON is loaded
function setupCharacterMapSpriteAnimations(data) {
  for (let name in data) {
    characterAnimations[name] = loadImage(data[name]);
  }
}

// Initialize sounds after JSON is loaded
function setupSounds(data) {
  for (let soundName in data) {
    sounds[soundName] = loadSound(data[soundName]);
  }
}

// Initialize cursorImages after JSON is loaded
function setupCursorImages(data) {
  for (let key in data) {
    cursorImages[key] = loadImage(data[key]);
  }
}

// Helper function to create new characters
function createCharacter(name, classType, x, y, level, hp, strength, skill, speed, luck, defense, resistance, animationName, isEnemy, width, height) {
  let character = new Character(name, classType, x, y, level, hp, strength, skill, speed, luck, defense, resistance, isEnemy, width, height);
  character.animation = characterAnimations[animationName];
  characters.push(character);
}


// Handle all inputs that lead to actions
function keyPressed() {
  cursorImageKey = "default";
  if (key === "j") {
    // Check if a character is selected
    let selectedCharacter = null;
    for (let character of characters) {
      if (character.isSelected) {
        selectedCharacter = character;
        break;
      }
    }
    if (selectedCharacter) {
      // If a character is already selected, move them
      moveSelectedCharacter();
    }
    else {
      // If no character is selected, select a new character
      selectCharacter();
    }
  }
  else if (key === "k") {
    unselectCharacter();
  }
}

// Allows user to hold down movement keys
function holdCursorMovement() {
  let currentTime = millis();
  if (keyIsDown(87) && currentTime - lastMoveTimeW > MOVE_DELAY) {  // 'W' key - Up
    locationCursor.move("up");
    lastMoveTimeW = currentTime;
  }
  if (keyIsDown(65) && currentTime - lastMoveTimeA > MOVE_DELAY) {  // 'A' key - Left
    locationCursor.move("left");
    lastMoveTimeA = currentTime;
  }
  if (keyIsDown(83) && currentTime - lastMoveTimeS > MOVE_DELAY) {  // 'S' key - Down
    locationCursor.move("down");
    lastMoveTimeS = currentTime;
  }
  if (keyIsDown(68) && currentTime - lastMoveTimeD > MOVE_DELAY) {  // 'D' key - Right
    locationCursor.move("right");
    lastMoveTimeD = currentTime;
  }
}

function selectCharacter() {
  // Make sure the character is not an enemy and hasn't moved yet (is not greyed out)
  for (let character of characters) {
    if (character.x === locationCursor.x && character.y === locationCursor.y && !character.isEnemy && !character.isGreyedOut) {
      // Play sound effect
      sounds.selectCharacter.amp(0.1);
      sounds.selectCharacter.play();

      // Change cursor image
      cursorImageKey = "selectedCursor";

      // Deselect all other characters
      for (let otherCharacter of characters) {
        otherCharacter.isSelected = false;
      }

      // Select the current character
      character.isSelected = true;
      console.log(`${character.name} is now selected.`);

      // Calculate reachable tiles
      character.calculateReachableTiles();
      break;
    }
  }
}

function unselectCharacter() {
  // Check if any characters have been selected to begin with
  let isAnyCharacterSelected = false;
  for (let character of characters) {
    if (character.isSelected) {
      isAnyCharacterSelected = true;
      break;
    }
  }

  // If there is a selected character, unselect them
  if (isAnyCharacterSelected) {
    for (let character of characters) {
      character.isSelected = false;
    }
    // Play sound effect
    sounds.unselectCharacter.amp(0.6);
    sounds.unselectCharacter.play();

    // Change cursor image
    cursorImageKey = "default";
    console.log("Character deselected.");
  }
  else {
    console.log("No characters are selected.");
  }
}

function moveSelectedCharacter() {
  // Iterate through all characters and check for character that is selected and can also move
  for (let character of characters) {
    if (character.isSelected && character.canMove) {
      // Calculate Manhattan distance between the character and where the cursor is
      let distance = Math.abs(locationCursor.x - character.x) + Math.abs(locationCursor.y - character.y);

      // Check if the character is selected and if the target tile is within movement range
      if (distance <= character.getMovementRange()) {
        // Check if the destination is within reachable tiles
        let targetTile = { x: locationCursor.x, y: locationCursor.y };
        let isReachable = character.reachableTiles.some(tile => tile.x === targetTile.x && tile.y === targetTile.y);
       
        if (isReachable) {
          // Validate the tile is walkable (not water, mountain, etc.) and not occupied
          let tile = tiles[locationCursor.y][locationCursor.x];
          if (tile.type !== "W" && tile.type !== "M" && !isTileOccupied(locationCursor.x, locationCursor.y)) {
            // Move character to new location
            character.moveTo(locationCursor.x, locationCursor.y);
            // Disable further movement this turn
            character.canMove = false;
            // Deselect the character after they move
            character.isSelected = false;
            // Grey out the character
            character.isGreyedOut = true;

            console.log(`${character.name} moved to (${character.x}, ${character.y})`);

            // Play move sound effect
            sounds.selectCharacter.amp(0.1);
            sounds.selectCharacter.play();
          } else {
            console.log("Cannot move to this tile (either it's a wall or occupied by another character).");
          }
        } else {
          console.log("This tile is not reachable.");
        }
      } else {
        console.log("Target location is out of range.");
      }
      break;
    }
  }
}


// Helper function to check if a tile is occupied by another character
function isTileOccupied(x, y) {
  for (let character of characters) {
    if (character.x === x && character.y === y) {
      // The tile is occupied by another character
      return true;  
    }
  }
   // The tile is not occupied
  return false;
}


function displayReachableTiles() {
  // Iterate through all characters to find selected character
  for (let character of characters) {
    if (character.isSelected) {
      // Grab information of that character's reachable tiles
      for (let tile of character.reachableTiles) {
        let x = tile.x;
        let y = tile.y;
        let drawX = x * tilesWidth;
        let drawY = y * tilesHeight;
       
        // Draw a blue rectangle to highlight the reachable tile
        fill(0, 0, 255, 100);
        noStroke();
        rect(drawX, drawY, tilesWidth, tilesHeight);
      }
      // Highlight attackable tiles in red
      for (let tile of character.attackableTiles) {
        let x = tile.x;
        let y = tile.y;
        let drawX = x * tilesWidth;
        let drawY = y * tilesHeight;

        // Draw a red rectangle to highlight the reachable tile
        fill(255, 0, 0, 100);
        noStroke();
        rect(drawX, drawY, tilesWidth, tilesHeight);
      }
    }
  }
}

function draw() {
  // Only run if gamestate is in gameplay
  if (gameState === GAME_STATES.GAMEPLAY) {
    // Handle cursor movement with WASD keys
    holdCursorMovement();

    // Display tiles
    Tile.displayAll(tiles);

    // Highlight reachable tiles in blue
    displayReachableTiles();

    // Display all characters
    for (let character of characters) {
      character.displayOnMap();
    }

    // Render the cursor
    locationCursor.renderCursor();
  }
}