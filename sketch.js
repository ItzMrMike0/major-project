// Fire Emblem 
// Michael Yang
// 2024-11-21

// Credits
// Tileset acquired from https://forums.serenesforest.net/topic/24982-tileset-collection/
// Background music acquired from https://www.youtube.com/watch?v=Cx4GQH2tHYQ
// A lot of sprites taken from https://github.com/Klokinator/FE-Repo/tree/main

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
  constructor(name, classType, x, y, hp, attack, defense, speed, width = 65, height = 65) {
    this.name = name; // Character name
    this.classType = classType; // Character class type
    this.x = x; // Character x location
    this.y = y; // Character y location
    this.hp = hp; // Character hp stat
    this.attack = attack; // Character attack stat
    this.defense = defense; // Character defense stat
    this.speed = speed; // Character speed stat
    this.isSelected = false; // Track if the character has been selected
    this.animation = null;  // Character's GIF animation
    this.width = width;     // Width for displaying GIF (default 65)
    this.height = height;   // Height for displaying GIF (default 65)
  }

  // Display the character on the map
  displayOnMap() {
    if (this.animation) {
      // Calculate centered position for the character
      let drawX = this.x * tilesWidth + (tilesWidth - this.width) / 2;
      let drawY = this.y * tilesHeight + (tilesHeight - this.height) / 2;

      // Adjust drawY for specific character height adjustments
      if (this.name === "Lance" || this.name === "Allen") {
        // Shift the position down slightly and ensure the feet don't go into the underneath tile
        drawY += 5;
        drawY = Math.min(drawY, this.y * tilesHeight + tilesHeight - this.height); 
      } 
      else {
        // For other characters, adjust slightly upwards
        drawY -= 5;
      }

      // Draw the character's animation at the calculated position
      image(this.animation, drawX, drawY, this.width, this.height);
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
    // Scale the cursor image vertically (Increase height by 20%)
    let scaledHeight = this.height * 1.2; 
     // Center the image vertically
    let offsetY = (scaledHeight - this.height) / 2;

    // Draw the cursor image
    image(
      cursorImage,
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
let music = {}; // Object to store music
let characterMapSpritePaths; // To store character paths loaded from JSON
let characterAnimations = {}; // Object to store character animations
let characters = []; // Array to store character instances
let characterData; // Holds character data information
let cursorImage; // Variable to hold the cursor image


function preload() {
  // Preload map information 
  levelToLoad = "Assets/Levels/0.txt";
  lines = loadStrings(levelToLoad);

  // Preload tile images
  tilePaths = loadJSON("Assets/Tiles/tilesPath.json", setupTileImages);

  // Load music files
  music.backgroundMusic = loadSound("Assets/Music/backgroundMusic.weba");

  // Load character map sprite paths from JSON
  characterMapSpritePaths = loadJSON("Assets/CharacterMapSprites/characterMapSpritesPaths.json", setupCharacterMapSpriteAnimations);

  // Load character data from JSON
  characterData = loadJSON("Assets/Characters/characters.json");

  // Preload images of cursor
  cursorImage = loadImage("Assets/Cursor/cursorOnCharacter.png"); // Preload cursor image
}

function setup() {
  // 4:3 ratio
  createCanvas(1000, 750);
  tilesHigh = lines.length; 
  tilesWide = lines[0].length;
  tilesWidth = width / tilesWide;
  tilesHeight = height / tilesHigh;

  // Loop background music
  music.backgroundMusic.loop(true);
  music.backgroundMusic.amp(0.1);

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
      char.hp,
      char.attack,
      char.defense,
      char.speed,
      char.animation,
      char.width || 65,
      char.height || 65
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

// initialize characterAnimations after JSON is loaded
function setupCharacterMapSpriteAnimations(data) {
  for (let name in data) {
    characterAnimations[name] = loadImage(data[name]);
  }
}

// Helper function to create new characters
function createCharacter(name, classType, x, y, hp, attack, defense, speed, animationName, width = 65, height = 65) {
  let character = new Character(name, classType, x, y, hp, attack, defense, speed, width, height);
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

// Controls using keybiard
function keyPressed() {
  // Move cursor
  if (key === "w") {
    locationCursor.move("up");
  }
  else if (key === "a") {
    locationCursor.move("left");
  }
  else if (key === "s") {
    locationCursor.move("down");
  }
  else if (key === "d") {
    locationCursor.move("right");
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
  // Display tiles
  displayTiles();

  // Display all characters
  for (let character of characters) {
    character.displayOnMap();
  }

  // Render the cursor
  locationCursor.render();
}