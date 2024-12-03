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
// All voice lines acquired from https://www.sounds-resource.com/nintendo_switch/fireemblemthreehouses/

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

  // Display reachable and attackable tiles for the selected character
  static displayReachableTiles() {
    // Iterate through all characters to find selected character
    for (let character of characters) {
      if (character.isSelected) {
        // Grab information of that character's reachable tiles
        for (let tile of character.reachableTiles) {
          let drawX = tile.x * tilesWidth;
          let drawY = tile.y * tilesHeight;

          // Draw a blue rectangle to highlight the reachable tile
          fill(0, 0, 255, 100);
          noStroke();
          rect(drawX, drawY, tilesWidth, tilesHeight);
        }
        // Highlight attackable tiles in red
        for (let tile of character.attackableTiles) {
          let drawX = tile.x * tilesWidth;
          let drawY = tile.y * tilesHeight;

          // Draw a red rectangle to highlight the reachable tile
          fill(255, 0, 0, 100);
          noStroke();
          rect(drawX, drawY, tilesWidth, tilesHeight);
        }
      }
    }
  }

  // Check if a tile is occupied by another character
  static isTileOccupied(x, y) {
    // Iterate through all character x and y 
    for (let character of characters) {
      if (character.x === x && character.y === y) {
        // The tile is occupied by another character
        return true;  
      }
    }
    // The tile is not occupied
    return false;
  }
}  

// Character Class
class Character {
  constructor(name, classType, x, y, level, hp, strength, skill, speed, luck, defense, resistance, isEnemy, width = 50, height = 50) {
    this.name = name;
    this.classType = classType;
    this.x = x;
    this.y = y;
    this.level = level;
    this.hp = hp;
    this.strength = strength;
    this.skill = skill;
    this.speed = speed;
    this.luck = luck;
    this.defense = defense;
    this.resistance = resistance;
    this.isSelected = false;
    this.animation = null;
    this.isEnemy = isEnemy;
    this.width = width;
    this.height = height;
    this.canMove = true;
    this.isGreyedOut = false;
    this.reachableTiles = [];
    this.attackableTiles = [];
  }

  // Helper function to create new characters
  static createCharacter(data) {
    let character = new Character(data.name, data.classType, data.x, data.y, data.level, data.hp,
      data.strength, data.skill, data.speed, data.luck, data.defense,
      data.resistance, data.isEnemy, data.width, data.height
    );
    character.animation = characterAnimations[data.animation];
    return character;
  }

  // Display character on the map
  displayOnMap() {
    if (this.animation) {
      // Calculate dimensions
      let drawWidth = this.width;
      let drawHeight =  this.height;
      // Adjust if character is selected
      if (this.isSelected) {
        drawWidth += 15;
        drawHeight += 15;
      }

      // Calculate centered position for the character
      let drawX = this.x * tilesWidth + (tilesWidth - drawWidth) / 2;
      let drawY = this.y * tilesHeight + (tilesHeight - drawHeight) / 2;

      // Adjust Y-position if character is selected because character gets bigger or if character is a Cavalier
      if (this.isSelected) {
        drawY -= 7;
        // Horses are drawY - 10 total because their base height is taller
        if (this.classType === "Cavalier") {
          drawY -= 7;
        }
        // Draw a selection border if the character is selected
        noFill();
        stroke(255, 255, 0);
        strokeWeight(3);
        rect(drawX, drawY, drawWidth, drawHeight);
      } 
      // If not selected but classType is Cavalier adjust drawY since base height is taller
      else if (this.classType === "Cavalier") {
        drawY -= 7;
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

  // Move the selected character to a new location
static moveSelectedCharacter(cursor, tiles) {
  if (selectedCharacter && selectedCharacter.canMove) {
    // Calculate distance between the character and where the cursor is
    const distance = Math.abs(cursor.x - selectedCharacter.x) + Math.abs(cursor.y - selectedCharacter.y);

    // Check if the target tile is within movement range
    if (distance <= selectedCharacter.getMovementRange() && selectedCharacter.reachableTiles.some(tile => tile.x === cursor.x && tile.y === cursor.y)) {
      const tile = tiles[cursor.y][cursor.x];

      // Check that the tile is walkable and not occupied
      if (tile.type !== "W" && tile.type !== "M" && !Tile.isTileOccupied(cursor.x, cursor.y)) {
        // Move the character to the new location
        selectedCharacter.moveTo(cursor.x, cursor.y);
        selectedCharacter.canMove = false;
        selectedCharacter.isGreyedOut = true;

        // Reset animation after move
        animationManager(selectedCharacter, "standing");

        console.log(`${selectedCharacter.name} moved to (${cursor.x}, ${cursor.y})`);

        // Deselect the character
        selectedCharacter.isSelected = false;
        selectedCharacter = null;

        // Play move sound effect
        sounds.selectCharacter.amp(0.1);
        sounds.selectCharacter.play();
      } else {
        console.log("Cannot move to this tile.");
      }
    } else {
      console.log("Target location is out of range.");
    }
  }
}

  
  static selectCharacter() {
    // Make sure the character is not an enemy and hasn't moved yet (is not greyed out)
    for (let character of characters) {
      if (character.x === locationCursor.x && character.y === locationCursor.y && !character.isEnemy && !character.isGreyedOut) {
        // Play sound effect
        sounds.selectCharacter.amp(0.1);
        sounds.selectCharacter.play();

        // Play character's select voice line
        const voiceKey = `${character.name}SelectVoice`;
        if (sounds[voiceKey]) {
          sounds[voiceKey].play();
        } 
        else {
          console.warn(`Select voice line for "${character.name}" not preloaded.`);
        }

        // Change cursor image
        cursorImageKey = "selectedCursor";
   
        // Reset animation of currently selected character (if any)
        if (selectedCharacter && selectedCharacter !== character) {
          animationManager(selectedCharacter, "standing");
          selectedCharacter.isSelected = false;
        }

        // Update the newly selected character
        selectedCharacter = character;
        character.isSelected = true;

        // Set selected animation
        animationManager(character, "selected");
        console.log(`${character.name} is now selected.`);

        // Calculate reachable tiles
        character.calculateReachableTiles();
        break;
      }
    }
  }
  
  static unselectCharacter() {
    if (selectedCharacter) {
      // Reset animation for the selected character
      animationManager(selectedCharacter, "standing");

      // Unselect the character
      selectedCharacter.isSelected = false;
      selectedCharacter = null;
  
      // Play unselect sound effect
      sounds.unselectCharacter.amp(0.6);
      sounds.unselectCharacter.play();
  
      console.log("Character deselected.");
    } 
    else {
      console.log("No characters are selected.");
    }
  }

  // Movement range based on class type (How many tiles a character can walk in one turn)
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

  // Determine attack range based on class type (How many tiles a unit can attack from)
  getAttackRange() {
    const attackRanges = {
      "Archer": 2,
      "Mage": 2,
    };
    // Return 1 if not archer or mage
    return attackRanges[this.classType] || 1;
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

    // Sort by movement cost (ascending) and process the tile with the lowest cost
    while (queue.length) {
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

    // Change x or y depending on direction input
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

// GLOBAL VARIABLES
let levelToLoad, lines; // Level file to load and its content (lines)
let tilesHigh, tilesWide, tilesWidth, tilesHeight; // Tile grid dimensions and sizes
let tileImages = {}, tiles = [], tilePaths; // Tile assets, objects, and paths
let sounds = {}, soundPaths; // Sound assets and paths
let characterMapSpritePaths, characterAnimations = {}, characters = [], characterData, selectedCharacter; // Character assets and data
let cursorImages = {}, cursorImageKey = "default", cursorPaths, locationCursor; // Cursor assets and location
const MOVE_DELAY = 200; // Delay before cursor moves to the next tile
const GAME_STATES = { TITLESCREEN: "TITLESCREEN", GAMEPLAY: "gameplay" }; // Possible game states
let lastMoveTimeW = 0, lastMoveTimeA = 0, lastMoveTimeS = 0, lastMoveTimeD = 0; // Last move times for each direction
let gameState = GAME_STATES.GAMEPLAY; // Current game state

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
  for (let charData of characterData.characters) {
    characters.push(Character.createCharacter(charData));
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

// Handles animation changes
function animationManager(character, state) {
  if (!character) {
    console.error("Animation manager called with an invalid character.");
    return;
  }

  // Map states to file paths
  const statePaths = {
    "standing": `Assets/CharacterMapSprites/StandingGifs/${character.classType.toLowerCase()}standing.gif`,
    "selected": `Assets/CharacterMapSprites/SelectedGifs/${character.classType.toLowerCase()}selected.gif`
  };

  // Check if the state exists and load the corresponding animation
  if (statePaths[state]) {
    character.animation = loadImage(statePaths[state]);
  } else {
    console.warn(`Unknown animation state: ${state}`);
  }
}

// Handle all inputs that lead to actions
function keyPressed() {
  cursorImageKey = "default";
  // Select and move key
  if (key === "j") {
    // Reset selectedCharacter variable
    let selectedCharacter;
    // Check if a character is selected
    for (let character of characters) {
      if (character.isSelected) {
        selectedCharacter = character;
        break;
      }
    }
    // If there is a selected character and j is pressed move them
    if (selectedCharacter) {
      Character.moveSelectedCharacter(locationCursor, tiles);
    }
    // If no character is selected, select a new character
    else {
      Character.selectCharacter();
    }
  }
  // Unselect and cancel key
  else if (key === "k") {
    Character.unselectCharacter();
  }
}

// Allows user to hold down movement keys
function holdCursorMovement() {
  // Check current time
  let currentTime = millis();

  // 'W' key - Up
  if (keyIsDown(87) && currentTime - lastMoveTimeW > MOVE_DELAY) { 
    // Send input to move up
    locationCursor.move("up");

    // Update move times for up direction
    lastMoveTimeW = currentTime;
  }
  // 'A' key - Left
  if (keyIsDown(65) && currentTime - lastMoveTimeA > MOVE_DELAY) {  
    // Send input to move left
    locationCursor.move("left");
    
    // Update move times for left direction
    lastMoveTimeA = currentTime;
  }
  // 'S' key - Down
  if (keyIsDown(83) && currentTime - lastMoveTimeS > MOVE_DELAY) {  
    // Send input to move down
    locationCursor.move("down");

    // Update move times for down direction
    lastMoveTimeS = currentTime;
  }
  // 'D' key - Right
  if (keyIsDown(68) && currentTime - lastMoveTimeD > MOVE_DELAY) {  
    // Send input to move right
    locationCursor.move("right");
    
    // Update move times for right direction
    lastMoveTimeD = currentTime;
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
    Tile.displayReachableTiles();

    // Display all characters
    for (let character of characters) {
      character.displayOnMap();
    }

    // Render the cursor
    locationCursor.renderCursor();
  }
}