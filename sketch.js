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
    if (this.type === "G") {
      image(grassTile, this.x * this.width, this.y * this.height, this.width, this.height);
    } 
    else if (this.type === "g") {
      image(clearGrassTile, this.x * this.width, this.y * this.height, this.width, this.height);
    } 
    else if (this.type === "W") {
      image(waterTile, this.x * this.width, this.y * this.height, this.width, this.height);
    } 
    else if (this.type === "P") {
      image(pathTile, this.x * this.width, this.y * this.height, this.width, this.height);
    }
    else if (this.type === "T") {
      image(treeTile, this.x * this.width, this.y * this.height, this.width, this.height);
    }
    else if (this.type === "H") {
      image(houseTile, this.x * this.width, this.y * this.height, this.width, this.height);
    }
    else if (this.type === "M") {
      image(mountainTile, this.x * this.width, this.y * this.height, this.width, this.height);
    }
    else if (this.type === "7") {
      image(topLeft, this.x * this.width, this.y * this.height, this.width, this.height);
    }
    else if (this.type === "8") {
      image(topMiddle, this.x * this.width, this.y * this.height, this.width, this.height);
    }
    else if (this.type === "9") {
      image(topRight, this.x * this.width, this.y * this.height, this.width, this.height);
    }
    else if (this.type === "4") {
      image(middleLeft, this.x * this.width, this.y * this.height, this.width, this.height);
    }
    else if (this.type === "5") {
      image(middleMiddle, this.x * this.width, this.y * this.height, this.width, this.height);
    }
    else if (this.type === "6") {
      image(middleRight, this.x * this.width, this.y * this.height, this.width, this.height);
    }
    else if (this.type === "1") {
      image(bottomLeft, this.x * this.width, this.y * this.height, this.width, this.height);
    }
    else if (this.type === "2") {
      image(bottomMiddle, this.x * this.width, this.y * this.height, this.width, this.height);
    }
    else if (this.type === "3") {
      image(bottomRight, this.x * this.width, this.y * this.height, this.width, this.height);
    }
  } 
}

function preload() {
  // Load level
  levelToLoad = "Assets/Levels/0.txt";
  lines = loadStrings(levelToLoad);

  // Load tile images
  grassTile = loadImage("Assets/Tiles/grass.png");
  clearGrassTile = loadImage("Assets/Tiles/cleargrass.png");
  waterTile = loadImage("Assets/Tiles/water.png");
  pathTile = loadImage("Assets/Tiles/path.png");
  treeTile = loadImage("Assets/TIles/trees.png");
  houseTile = loadImage("Assets/Tiles/house.png");
  mountainTile = loadImage("Assets/Tiles/mountain.png");
  topLeft = loadImage("Assets/Tiles/Castle/topleft.png");
  topMiddle = loadImage("Assets/Tiles/Castle/topmiddle.png");
  topRight = loadImage("Assets/Tiles/Castle/topright.png");
  middleLeft = loadImage("Assets/Tiles/Castle/middleLeft.png");
  middleMiddle = loadImage("Assets/Tiles/Castle/middleMiddle.png");
  middleRight = loadImage("Assets/Tiles/Castle/middleRight.png");
  bottomLeft = loadImage("Assets/Tiles/Castle/bottomleft.png");
  bottomMiddle = loadImage("Assets/Tiles/Castle/bottommiddle.png");
  bottomRight = loadImage("Assets/Tiles/Castle/bottomright.png");
};

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
