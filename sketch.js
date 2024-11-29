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

  // Method to display a single tile
  renderTile() {
    if (tileImages[this.type]) {
      image(tileImages[this.type], this.x * this.width, this.y * this.height, this.width, this.height);
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
          drawY -=5;
        }
      }
      else if (this.classType === "Cavalier"){
          drawY -= 5;
      }
    
      // Draw a selection border if the character is selected
      if (this.isSelected) {
        noFill();
        stroke(255, 255, 0); // Yellow border
        strokeWeight(3);
        rect(drawX, drawY, drawWidth, drawHeight);
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
  render() {
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
  tiles = createTiles(lines);

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

// Creates 2D Grid based on the x and y from level txt file
function createTiles(lines) {
  // Clear tiles array before creating new tiles to get rid of previous data
  tiles = []; 
  for (let y = 0; y < lines.length; y++) {
    tiles.push([]);
    for (let x = 0; x < lines[y].length; x++) {
      let tileType = lines[y][x];
      tiles[y].push(new Tile(tileType, x, y, tilesWidth, tilesHeight));
    }
  }
  return tiles;
}

function keyPressed() {
  cursorImageKey = "default";
  // Handle the selection and deselection of characters
  if (key === "j") {
    selectCharacter();
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
  // Check if there's an allied character at the cursor's location
  for (let character of characters) {
    if (character.x === locationCursor.x && character.y === locationCursor.y && !character.isEnemy) {
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

// Iterate through all tiles and display them
function displayTiles() {
  for (let row of tiles) {
    for (let tile of row) {
      tile.renderTile();
    }
  }
}

function draw() {
  // Handle cursor movement with WASD keys 
  holdCursorMovement();
  
  // Display tiles
  displayTiles();

  // Display all characters
  for (let character of characters) {
    character.displayOnMap();
  }

  // Render the cursor
  locationCursor.render();
}