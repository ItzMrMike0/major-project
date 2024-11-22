// Fire Emblem 
// Michael Yang
// 2024-11-21
// Extra for Experts:
//

// Credits
// Tileset acquired from https://forums.serenesforest.net/topic/24982-tileset-collection/
// Background music acquired from https://www.youtube.com/watch?v=Cx4GQH2tHYQ

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
  setImageToTile() {
    if (tileImages[this.type]) {
      image(tileImages[this.type], this.x * this.width, this.y * this.height, this.width, this.height);
    }
  }
}

// Character class 
class Character {
  constructor(name, classType, x, y, hp, attack, defense, speed) {
    this.name = name;
    this.classType = classType;
    this.x = x; 
    this.y = y;
    this.hp = hp;
    this.attack = attack;
    this.defense = defense;
    this.speed = speed;
    this.isSelected = false; // Track if the character has been selected
  }
  // Display character
  display() {

  }
  // Move character
  moveTo() {

  }

  // Attack using character
  attack() {

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

function preload() {
  // Load level
  levelToLoad = "Assets/Levels/0.txt";
  lines = loadStrings(levelToLoad);

  // Load tile paths from JSON file
  tilePaths = loadJSON("Assets/Tiles/tilesPath.json", setupTileImages);

  // Load music files
  music.backgroundMusic = loadSound("Assets/Music/backgroundMusic.weba");
}

// Callback to initialize tileImages after JSON is loaded
function setupTileImages(data) {
  tilePaths = data;
  for (let type in tilePaths) {
    tileImages[type] = loadImage(tilePaths[type]);
  }
}

function setup() {
  // 4:3 ratio
  createCanvas(750, 563);
  tilesHigh = lines.length; 
  tilesWide = lines[0].length;
  tilesWidth = width / tilesWide;
  tilesHeight = height / tilesHigh;

  // Loop background music
  music.backgroundMusic.loop(true);
  music.backgroundMusic.amp(0.1);

  // Create a 2D array of Tile objects
  for (let y = 0; y < tilesHigh; y++) {
    tiles.push([]);
    for (let x = 0; x < tilesWide; x++) {
      let tileType = lines[y][x];
      tiles[y].push(new Tile(tileType, x, y, tilesWidth, tilesHeight));
    }
  }
}

// Iterate through all tiles and display them
function display() {
  for (let y = 0; y < tilesHigh; y++) {
    for (let x = 0; x < tilesWide; x++) {
      tiles[y][x].setImageToTile();
    }
  }
}

function draw() {
  display();
}