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
    this.animation = null;  // Placeholder for the character's GIF animation
    this.width = width;     // Width for displaying GIF (default 65)
    this.height = height;   // Height for displaying GIF (default 65)
  }

  // Display the character on the map
  displayOnMap() {
    if (this.animation) {
      // Calculate centered position for the character
      let drawX = this.x * tilesWidth + (tilesWidth - this.width) / 2;
      let drawY = this.y * tilesHeight + (tilesHeight - this.height) / 2;

      // Adjust drawY for characters with height 70 (Cavalier) or others with height 65
      if (this.name === "Lance") {
        // Add 5 to shift the position down slightly
        drawY += 5; 
        // Ensure it doesn't overflow below the tile
        if (drawY + this.height > this.y * tilesHeight + tilesHeight) {
          drawY = this.y * tilesHeight + tilesHeight - this.height; 
        }
      } 
      // For other characters, adjust slightly upwards
      else {
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
    // Logic for attacking (can be implemented later)
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


function preload() {
  // Preload map information 
  levelToLoad = "Assets/Levels/0.txt";
  lines = loadStrings(levelToLoad);

  // Preload tile images
  tilePaths = loadJSON("Assets/Tiles/tilesPath.json", setupTileImages);

  // Load music files
  music.backgroundMusic = loadSound("Assets/Music/backgroundMusic.weba");

  // Load character paths from JSON
  characterMapSpritePaths = loadJSON("Assets/CharacterMapSprites/characterMapSpritesPaths.json", setupCharacterMapSpriteAnimations);
}

// Callback to initialize tileImages after JSON is loaded
function setupTileImages(data) {
  tilePaths = data;
  for (let type in tilePaths) {
    tileImages[type] = loadImage(tilePaths[type]);
  }
}

// Callback to initialize characterMapSpriteAnimations after JSON is loaded
function setupCharacterMapSpriteAnimations(data) {
  characterMapSpritePaths = data;
  for (let name in characterMapSpritePaths) {
    characterAnimations[name] = loadImage(characterMapSpritePaths[name]);
  }
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
  for (let y = 0; y < tilesHigh; y++) {
    tiles.push([]);
    for (let x = 0; x < tilesWide; x++) {
      let tileType = lines[y][x];
      tiles[y].push(new Tile(tileType, x, y, tilesWidth, tilesHeight));
    }
  }

  // Create characters
  // Roy (Lord)
  let roy = new Character("Roy", "Lord", 2, 12, 24, 8, 6, 5);
  roy.animation = characterAnimations["RoyIdle"];
  characters.push(roy);

  // Bors (Knight)
  let bors = new Character("Bors", "Knight", 1, 13, 27, 6, 8, 2);
  bors.animation = characterAnimations["KnightIdle"];
  characters.push(bors);

  // Lance (Cavalier)
  let lance = new Character("Lance", "Cavalier", 4, 14, 21, 5, 5, 8, 65, 70);  // Set height to 70 instead of 65
  lance.animation = characterAnimations["CavalierIdle"];
  characters.push(lance);

  // Allen (Cavalier)
  let allen = new Character("Allen", "Cavalier", 4, 11, 21, 5, 5, 8, 65, 70);  // Set height to 70 instead of 65
  allen.animation = characterAnimations["CavalierIdle"];
  characters.push(allen);

  // Wolt (Archer)
  let wolt = new Character("Wolt", "Archer", 0, 11, 17, 7, 3, 6)
  wolt.animation = characterAnimations["ArcherIdle"];
  characters.push(wolt);

  // Lugh (Mage)
  let lugh = new Character("Lugh", "Mage", 1, 10, 16, 9, 2 , 4 )
  lugh.animation = characterAnimations["MageIdle"];
  characters.push(lugh);

  // Enemy Characters
  let enemyFighter = new Character("Enemy Fighter", "Fighter", 4, 7 , 16, 7, 6, 5);
  enemyFighter.animation = characterAnimations["EnemyFighterIdle"];
  characters.push(enemyFighter);

  let enemyFighter1 = new Character("Enemy Fighter", "Fighter", 7, 1 , 16, 7, 6, 5);
  enemyFighter1.animation = characterAnimations["EnemyFighterIdle"];
  characters.push(enemyFighter1);

  let enemyFighter2 = new Character("Enemy Fighter", "Fighter", 8, 0 , 16, 7, 6, 5);
  enemyFighter2.animation = characterAnimations["EnemyFighterIdle"];
  characters.push(enemyFighter2);

  let enemyFighter3 = new Character("Enemy Fighter", "Fighter", 5, 0 , 16, 7, 6, 5);
  enemyFighter3.animation = characterAnimations["EnemyFighterIdle"];
  characters.push(enemyFighter3);

  let enemyFighter4 = new Character("Enemy Fighter", "Fighter", 6, 8 , 16, 7, 6, 5);
  enemyFighter4.animation = characterAnimations["EnemyFighterIdle"];
  characters.push(enemyFighter4);

  let enemyFighter5 = new Character("Enemy Fighter", "Fighter", 7, 10 , 16, 7, 6, 5);
  enemyFighter5.animation = characterAnimations["EnemyFighterIdle"];
  characters.push(enemyFighter5);

  let enemyFighter6 = new Character("Enemy Fighter", "Fighter", 8, 9 , 16, 7, 6, 5);
  enemyFighter6.animation = characterAnimations["EnemyFighterIdle"];
  characters.push(enemyFighter6);

  let enemyFighter7 = new Character("Enemy Fighter", "Fighter", 9, 5 , 16, 7, 6, 5);
  enemyFighter7.animation = characterAnimations["EnemyFighterIdle"];
  characters.push(enemyFighter7);

  let enemyFighter8 = new Character("Enemy Fighter", "Fighter", 10, 4 , 16, 7, 6, 5);
  enemyFighter8.animation = characterAnimations["EnemyFighterIdle"];
  characters.push(enemyFighter8);

  let enemyFighter9 = new Character("Enemy Fighter", "Fighter", 11, 13 , 16, 7, 6, 5);
  enemyFighter9.animation = characterAnimations["EnemyFighterIdle"];
  characters.push(enemyFighter9);

  let enemyFighter10 = new Character("Enemy Fighter", "Fighter", 10, 9 , 16, 7, 6, 5);
  enemyFighter10.animation = characterAnimations["EnemyFighterIdle"];
  characters.push(enemyFighter10);
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

  // Display all characters
  for (let character of characters) {
    character.displayOnMap();
  }
}