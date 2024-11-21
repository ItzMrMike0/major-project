// Project Title
// Your Name
// Date
// Extra for Experts:
// - describe what you did to take this project "above and beyond"

let levelToLoad; // Text file to load
let lines; // What each line from text file says
let tilesHigh; // How many tiles high
let tilesWide; // How many tiles wide
let tilesWidth; // How wide each tile is
let tilesHeight; // How tall each tile is
let grassTile, clearGrassTile, waterTile, pathTile, treeTile, houseTile, mountainTile; // Tile Images
let bottomLeft, bottomMiddle, bottomRight, middleLeft, middleMiddle, middleRight, topLeft, topMiddle, topRight; // Castle Images
let tiles = []; // Array to store Tile object
let imageTiles = {};

function preload() {
  // Load level
  levelToLoad = "Assets/Levels/0.txt";
  lines = loadStrings(levelToLoad);

  // Load JSON file
  tileJson = loadJSON("tiles.json");

  // Load every image in JSON file
  for (const tile in tileJson) {
    imageTiles.tile = loadImage(tileJson[tile]);
  }
};

// imageTiles["grassTile"]
// imageTiles.grassTile

class Tile {
  constructor(type, x, y, width, height) {
    this.type = type;  // Type of the tile ("G", "W", etc.)
    this.x = x;        // x-coordinate in the grid
    this.y = y;        // y-coordinate in the grid
    this.width = width; // Width of the tile
    this.height = height; // Height of the tile
  }

  // // Method to display a single tile
  setImageToTile() {
    const mapping = {
      "G": "grassTile",
      "g": "clearGrassTile",
      "W": "waterTile",
      "P": "pathTile",
      "T": "treeTile",
      "H": "houseTile",
      "M": "mountainTile",
      "7": "topLeft",
      "8": "topMiddle",
      "9": "topRight",
      "4": "middleLeft",
      "5": "middleMiddle",
      "6": "middleRight",
      "1": "bottomLeft",
      "2": "bottomMiddle",
      "3": "bottomRight",
    };

    for (let character in mapping) {
      if (this.type === character) {
        image(imageTiles[mapping[character]], this.x * this.width, this.y * this.height, this.width, this.height);
        break;
      }
    }
  }
} 

function setup() {
  // 4:3 ratio
  createCanvas(750, 563);

  tilesHigh = lines.length; 
  tilesWide = lines[0].length;

  tilesWidth = width / tilesWide;
  tilesHeight = height / tilesHigh;

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