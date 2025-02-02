// Fire Emblem
// Michael Yang
// 2024-11-21

// Credits
// Tileset acquired from https://forums.serenesforest.net/topic/24982-tileset-collection/
// Music when not in battle https://www.youtube.com/watch?v=ip66HSkmVZo
// Music when in battle https://www.youtube.com/watch?v=MqHlnJjCrbc
// Sprites taken from https://github.com/Klokinator/FE-Repo/tree/main
// Fire effect taken from https://www.spriters-resource.com/game_boy_advance/fireemblemthebindingblade
// Weapon and items images, and most in battle UI taken from https://www.spriters-resource.com/nintendo_switch/fireemblemengage
// Cursor moving sound acquired from https://www.youtube.com/watch?v=fkmp_YR9RXc
// Select character sound acquired from https://www.youtube.com/watch?v=7Z2sxm7CkPw
// Deselect character sound acquired from https://www.youtube.com/watch?v=U8wAHIaW4S0
// Formulas for combat and stats taken from https://www.fe3h.com/calculations
// Miss sound effect  https://www.youtube.com/watch?v=GFbJNL26y3I
// Hit sound effect https://www.youtube.com/watch?v=ziCTyMB7U5o
// Crit sound effect https://www.youtube.com/watch?v=qy5Y0_qmbrc
// Death sound effect https://www.youtube.com/watch?v=mISX89sfWvc
// Tile name images, Other sounds taken from Fire Emblem: Three Houses
// Game over and win images taken from Fire Emblem: Engage

// Tile Class: Represents individual tiles on the map, including their type, position, and dimensions
class Tile {
  constructor(type, x, y, width, height) {
    this.type = type; // Tile type (G = ground, W = wall, M = mountain, etc)
    this.x = x; // Grid x position
    this.y = y; // Grid y position
    this.width = width; // Tile width in pixels
    this.height = height; // Tile height in pixels
  }

  // Creates the map grid from level data
  static createTiles(lines) {
    tiles = [];
    for (let y = 0; y < lines.length; y++) {
      tiles.push([]); // Initialize row array
      for (let x = 0; x < lines[y].length; x++) {
        const tileType = lines[y][x]; // Get tile type from level data
        tiles[y].push(new Tile(tileType, x, y, tilesWidth, tilesHeight)); // Create new Tile object
      }
    }
    return tiles; // Return the created tiles grid
  }

  // Displays all map tiles
  static displayAll(tiles) {
    for (let row of tiles) {
      for (let tile of row) {
        tile.renderTile(); // Render each tile
      }
    }
  }
 
  // Draws the tile using its type
  renderTile() {
    if (tileImages[this.type]) { // Check if there's an image for this tile type
      image(tileImages[this.type], this.x * this.width, this.y * this.height, this.width, this.height);
    }
  }
 
  // Checks if a tile is blocked by an enemy (useful for pathfinding and display)
  static isTileBlockedByEnemy(x, y) {
    const selectedChar = Character.getSelectedCharacter();

    if (!selectedChar) { // If no character is selected, consider the tile blocked
      return true;
    }

    // Check each character
    for (let character of characters) {
      if (character.x === x && character.y === y) {
        // If it's an enemy, the tile is blocked
        if (character.isEnemy !== selectedChar.isEnemy) {
          return true;
        }
      }
    }
    return false; // Tile is not blocked by an enemy
  }

  // Checks if a tile is occupied by any character
  static isTileOccupied(x, y) {
    const selectedChar = Character.getSelectedCharacter();
    if (!selectedChar) { // If no character is selected, consider the tile occupied
      return true;
    }

    // Check each character
    for (let character of characters) {
      // Skip if it's the selected character
      if (character === selectedChar) {
        continue;
      }

      // If any character is at the location
      if (character.x === x && character.y === y) {
        return true; // Tile is occupied
      }
    }
    return false; // Tile is not occupied
  }

  // Checks if a tile is walkable
  isWalkable() {
    return this.type !== 'W' && this.type !== 'M'; // Tiles with 'W' (wall) or 'M' (mountain) are not walkable
  }

  // Checks if coordinates are within map bounds
  static isWithinMapBounds(x, y) {
    return x >= 0 && x < tilesWide && y >= 0 && y < tilesHigh; // Coordinates must be within defined map bounds
  }

  // Displays reachable and attackable tiles for the selected character
  static displayActionableTiles() {
    // Iterate through all characters to find the selected character
    for (let character of characters) {
      if (character.isSelected) {
        // Draw blue squares to show the character's reachable tiles
        for (let tile of character.reachableTiles) {
          let drawX = tile.x * tilesWidth;
          let drawY = tile.y * tilesHeight;
          fill(0, 0, 255, 150);  
          noStroke();
          rect(drawX, drawY, tilesWidth, tilesHeight);
        }

        // Draw red squares to show the character's attackable tiles
        for (let tile of character.attackableTiles) {
          let drawX = tile.x * tilesWidth;
          let drawY = tile.y * tilesHeight;
          fill(255, 0, 0, 150); 
          noStroke();
          rect(drawX, drawY, tilesWidth, tilesHeight);
        }
      }
    }
  }

  // Get the stat buffs provided by this tile type
  getStatBuffs() {
    const buffs = {
      defenseBonus: 0, // Default defense bonus
      resistanceBonus: 0, // Default resistance bonus
      dexterityBonus: 0 // Default dexterity bonus
    };

    // Apply stat changes based on tile type
    if (this.type === 'H') { // House tile increases defense and resistance
      buffs.defenseBonus = 1;
      buffs.resistanceBonus = 1;
    } 
    else if (this.type === 'T') { // Forest/tree tile
      buffs.dexterityBonus = 0.8; // Store as multiplier for dexterity
    } 
    else if (this.type === '5') { // Stronghold tile increases defense and resistance
      buffs.defenseBonus = 2;
      buffs.resistanceBonus = 2;
    }
    
    return buffs; // Return the calculated stat buffs
  }
}

// Character Class: Represents a character on the map, including their properties, state, and actions
class Character {
  constructor(name, classType, x, y, level, hp, strength, magic, dexterity, speed, luck, defense, resistance, might, hit, isEnemy, width = 50, height = 50) {
    // Basic properties
    this.name = name; // Name of character
    this.classType = classType; // Character class (Lord, Knight, etc)
    this.x = x; // X position on the tile grid
    this.y = y; // Y position on the tile grid
    this.level = level; // Character's level
    this.maxHP = hp; // Maximum HP stat
    this.currentHP = hp; // Current HP stat (Start at the max HP)
    this.strength = strength; // Strength stat (Attack for physical attacks)
    this.magic = magic; // Magic stat (Attack for magical attacks)
    this.dexterity = dexterity; // Dexterity stat (Affects hit chance, critical hit chance, and evasion)
    this.baseDexterity = dexterity; // Base dexterity stat 
    this.speed = speed; // Speed stat (Determines whether a unit can double attack)
    this.luck = luck; // Luck stat (Affects critical hit chance, avoiding critical hits, and hit chance)
    this.defense = defense; // Physical defense stat (Reduces damage from physical attacks)
    this.baseDefense = defense; // Base defense stat
    this.resistance = resistance; // Magical defense stat (Reduces damage from magical attacks)
    this.baseResistance = resistance; // Base resistance stat
    this.might = might; // Attack power (Base damage of a weapon or spell)
    this.hit = hit; // Hit chance (Base accuracy of a weapon or spell)
    
    // Visual and gameplay properties
    this.isEnemy = isEnemy; // Indicates if this character is an enemy
    this.isSelected = false; // Whether the character is selected
    this.canMove = true; // Whether the character can move or not
    this.isGreyedOut = false; // Whether the character is greyed out or not
    this.action = null; // The action the character is going to perform (Attack, item, or wait)
    this.previousX = x; // X position of the character before movement
    this.previousY = y; // Y position of the character before movement
    this.width = width; // Width of character
    this.height = height; // Height of character
    this.currentState = "standing"; // Current animation state
    this.isMoving = false; // Whether the character is currently moving
    this.attackInterfaceConfirmed = false; // Whether the user has confirmed the attack interface

    // Movement and attack calculations
    this.animation = null; // Character visual sprite
    this.reachableTiles = []; // Character's reachable movement tiles
    this.attackableTiles = []; // Character's attackable movement tiles

    // Buffs given by the tile the character is standing on
    this.tileBuffs = {
      defenseBonus: 0, // Defense bonus
      resistanceBonus: 0, // Resistance bonus
      dexterityBonus: 0 // Dexterity bonus
    };
  }

  // Helper function to create new characters based on provided data in character JSON
  static createCharacter(data) {
    // Create either an EnemyCharacter or regular Character based on isEnemy flag
    let character;
    if (data.isEnemy) {
      character = new EnemyCharacter(
        data.name, data.classType, data.x, data.y, data.level, data.hp,
        data.strength, data.magic, data.dexterity, data.speed, data.luck, data.defense,
        data.resistance, data.might, data.hit, data.isEnemy, data.width, data.height
      );
    } 
    else {
      character = new Character(
        data.name, data.classType, data.x, data.y, data.level, data.hp,
        data.strength, data.magic, data.dexterity, data.speed, data.luck, data.defense,
        data.resistance, data.might, data.hit, data.isEnemy, data.width, data.height
      );
    }

    // Set initial animation to standing
    animationManager(character, "standing");

    return character;
  }

  // Display the character on the map at their current position
  displayOnMap() {
    // Calculate the character's drawing dimensions
    let drawWidth = this.width;
    let drawHeight = this.height;

    // Set isSelectedAnimation to true if the character is selected
    const isSelectedAnimation = this.currentState === "selected";
    const isWalkingAnimation = ["walkleft", "walkright", "walkup", "walkdown"].includes(this.currentState);

    // Scale up enemy walking animations
    if (this.isEnemy && isWalkingAnimation) {
      drawWidth += 5;
      drawHeight += 7;
    } 
    else if ((this.currentState === "walkleft" || this.currentState === "walkright") && (this.classType === "Lord" || this.classType === "Cavalier")) {
      // Only increase width for left/right walking animations for Lord and Cavalier
      drawWidth = 65;  
    }

    // If the character is selected and has the selected animation, increase the size slightly for visual effect
    if (this.isSelected && isSelectedAnimation) {
      if (this.classType === "Fighter") {
        // Smaller width increase for Fighter class
        drawWidth += 10;
      } 
      else {
        drawWidth += 15;
      }
     
      if (this.isEnemy) {
        // Scale enemy characters much higher when selected
        drawHeight += 35;
      } 
      else {
        drawHeight += 15;
      }
    }
   
    // Calculate the character's position on the map, centering it within the grid cell
    let drawX = this.x * tilesWidth + (tilesWidth - drawWidth) / 2;
    let drawY = this.y * tilesHeight + (tilesHeight - drawHeight) / 2;

    if (this.isEnemy && isWalkingAnimation) {
      // Adjust Y-position for walking animations if enemy
      drawY -= 4;
    }

    if (this.isSelected && isSelectedAnimation) {
      // Adjust Y-position if the character is selected and has isSelectedAnimation
      if (this.isEnemy) {
        // Adjust Y position more for enemy characters since they're scaled much higher
        drawY -= 20;
      } 
      else {
        drawY -= 7;
      }

      if (this.classType === "Cavalier") {
        // Further adjustment for Cavaliers if selected, as their base height is taller
        drawY -= 7;
      }

      // Draw a yellow border around the selected character to indicate selection
      noFill();
      stroke(255, 255, 0);
      strokeWeight(3);
      rect(drawX, drawY, drawWidth, drawHeight);
    } 
    else if (this.classType === "Cavalier") {
      // If the character is not selected but is a Cavalier, adjust the Y-position as their base height is taller
      drawY -= 7;
    }

    if (this.isGreyedOut) {
      // If the character has already moved or acted, apply a grey tint to show it's inactive
      tint(100);
    }

    // Draw the character's animation at the calculated position
    image(this.animation, drawX, drawY, drawWidth, drawHeight);

    // Reset tint after drawing
    noTint();
  }

  // Selects a character at the cursor's position
  static selectCharacter() {
    // Check for valid character selection at cursor position
    for (let character of characters) {
      if (character.x === locationCursor.x && character.y === locationCursor.y) {
        // If it's an enemy character, only show range
        if (character.isEnemy) {
          // Play selection sound effect
          sounds.selectCharacter.amp(0.4);
          sounds.selectCharacter.play();
       
          // Update selection state and calculate range
          selectedCharacter = character;
          character.isSelected = true;
          character.calculateActionableTiles();
          animationManager(character, "selected");
          return;
        }
     
        if (!character.isGreyedOut) {
          // For non-enemy characters, proceed with normal selection if not greyed out
          sounds.selectCharacter.amp(0.4);
          // Play selection sound effect
          sounds.selectCharacter.play();
       
          // Update cursor to show selection state
          cursorImageKey = "selectedCursor";

          // Play character-specific voice line
          const voiceKey = `${character.name.toLowerCase()}SelectVoice`;
          sounds[voiceKey].play();

          // Update selection state and animation
          selectedCharacter = character;
          character.isSelected = true;
          animationManager(character, "selected");

          // Calculate possible movement options
          character.calculateActionableTiles();
          break;
        }
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
 
      if (playSound) {
        // Play unselect sound effect
        sounds.unselectCharacter.amp(0.5);
        sounds.unselectCharacter.play();
      }
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
      "Fighter": 3,
      "Brigand": 3
    };
    return movementRanges[this.classType]; // Return movement range based on character class type
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

  // Helper function to calculate attackable tiles from a position
  calculateAttackTiles() {
    const attackRange = this.getAttackRange(); // Get the attack range of the character
    const attackVisited = new Set([`${this.x},${this.y}`]); // Initialize a set to track visited tiles, starting with the current position
    const attackQueue = [{ x: this.x, y: this.y, cost: 0 }]; // Initialize the queue for breadth-first search with the starting position and cost 0
    const attackableTiles = new Set(); // Set to store coordinates of attackable tiles

    // Process the queue until it's empty
    while (attackQueue.length > 0) {
      const current = attackQueue.shift(); // Remove the first element from the queue and set it as the current tile
      const { x, y, cost } = current; // Destructure the current tile's coordinates and cost

      // If the current tile is within attack range and walkable, add it to the attackable tiles set
      if (cost > 0 && cost <= attackRange && tiles[y][x].isWalkable()) {
        attackableTiles.add(`${x},${y}`); // Add the tile's coordinates as a string to the set
      }

      // Stop exploring further from this tile if the cost exceeds the attack range
      if (cost >= attackRange) {
        continue;
      }

      // Loop through the four possible directions to explore adjacent tiles
      for (const dir of DIRECTIONS) {
        const nextX = x + dir.x; // Calculate the x-coordinate of the adjacent tile
        const nextY = y + dir.y; // Calculate the y-coordinate of the adjacent tile
        const nextKey = `${nextX},${nextY}`; // Create a string key for the adjacent tile's coordinates

        // Skip this adjacent tile if it is out of bounds, already visited, or not walkable
        if (!Tile.isWithinMapBounds(nextX, nextY) ||
            attackVisited.has(nextKey) ||
            !tiles[nextY][nextX].isWalkable()) {
          continue;
        }

        // Add the adjacent tile to the queue for further exploration and mark it as visited
        attackQueue.push({ x: nextX, y: nextY, cost: cost + 1 }); // Add the adjacent tile to the queue with an incremented cost
        attackVisited.add(nextKey); // Mark the adjacent tile as visited by adding it to the set
      }
    }

    // Convert the set of attackable tiles to an array of coordinates
    return Array.from(attackableTiles).map(key => {
      const [x, y] = key.split(',').map(Number); // Split the key string into coordinates and convert them to numbers
      return { x, y }; // Return the coordinates as an object
    });
  }

  // Calculate reachable and attackable tiles using breadth-first search
  calculateActionableTiles() {
    this.reachableTiles = []; // Initialize an empty array to store reachable tiles
    this.attackableTiles = []; // Initialize an empty array to store attackable tiles

    // If the character is in attack mode, only calculate attackable tiles from the current position
    if (this.action === "attack") { 
      this.attackableTiles = this.calculateAttackTiles(); // Call the helper function to calculate attackable tiles
      return;
    }

    // Calculate the movement range for the character
    const movementRange = this.getMovementRange(); // Get the movement range of the character
    const visited = new Set([`${this.x},${this.y}`]); // Initialize a set to track visited tiles, starting with the current position
    const movementQueue = [{ x: this.x, y: this.y, cost: 0 }]; // Initialize the queue for breadth-first search with the starting position and cost 0
    const attackableTilesSet = new Set(); // Set to store coordinates of attackable tiles found during movement

    // Process the queue until it's empty
    while (movementQueue.length > 0) {
      const current = movementQueue.shift(); // Remove the first element from the queue and set it as the current tile
      const { x, y, cost } = current; // Destructure the current tile's coordinates and cost

      // If the current tile is within movement range and not blocked by an enemy, add it to reachable tiles
      if (cost <= movementRange && !Tile.isTileBlockedByEnemy(x, y)) {
        this.reachableTiles.push({ x, y }); // Add the tile's coordinates as an object to the reachable tiles array
      }

      // Stop exploring further from this tile if the cost exceeds the movement range
      if (cost >= movementRange) {
        continue;
      }

      // Loop through the four possible directions to explore adjacent tiles
      for (const dir of DIRECTIONS) {
        const nextX = x + dir.x; // Calculate the x-coordinate of the adjacent tile
        const nextY = y + dir.y; // Calculate the y-coordinate of the adjacent tile
        const nextKey = `${nextX},${nextY}`; // Create a string key for the adjacent tile's coordinates

        // Skip this adjacent tile if it is out of bounds, already visited, not walkable, or blocked by an enemy
        if (!Tile.isWithinMapBounds(nextX, nextY) ||
            visited.has(nextKey) ||
            !tiles[nextY][nextX].isWalkable() ||
            Tile.isTileBlockedByEnemy(nextX, nextY)) {
          continue;
        }

        // Add the adjacent tile to the queue for further exploration and mark it as visited
        movementQueue.push({ x: nextX, y: nextY, cost: cost + 1 }); // Add the adjacent tile to the queue with an incremented cost
        visited.add(nextKey); // Mark the adjacent tile as visited by adding it to the set
      }
    }

    // Calculate attack tiles from each reachable position
    const originalX = this.x; // Store the original x-coordinate of the character
    const originalY = this.y; // Store the original y-coordinate of the character
    
    // Loop through each reachable tile to calculate attackable tiles
    for (const pos of this.reachableTiles) {
      this.x = pos.x; // Temporarily set the character's x-coordinate to the reachable tile's x-coordinate
      this.y = pos.y; // Temporarily set the character's y-coordinate to the reachable tile's y-coordinate
      
      const attackTiles = this.calculateAttackTiles(); // Calculate attackable tiles from the current reachable tile
      
      // Loop through each attackable tile
      for (const tile of attackTiles) {
        const tileKey = `${tile.x},${tile.y}`; // Create a string key for the attackable tile's coordinates
        
        // If the attackable tile is not in the reachable tiles array, add it to the attackable tiles set
        if (!this.reachableTiles.some(reachable => 
          reachable.x === tile.x && reachable.y === tile.y)) {
          attackableTilesSet.add(tileKey); // Add the attackable tile's coordinates as a string to the set
        }
      }
    }
    
    this.x = originalX; // Restore the original x-coordinate of the character
    this.y = originalY; // Restore the original y-coordinate of the character

    // Convert the set of attackable tiles to an array of coordinates
    this.attackableTiles = Array.from(attackableTilesSet).map(key => {
      const [x, y] = key.split(',').map(Number); // Split the key string into coordinates and convert them to numbers
      return { x, y };
    });
  }

  // Move the character to a new location gradually
  moveTo(newX, newY, isEnemy = false) {
    // Store previous position
    this.previousX = this.x;
    this.previousY = this.y;

    // Check if character is actually moving to a new position
    const isActuallyMoving = newX !== this.x || newY !== this.y;

    // Get path based on character type
    const path = isEnemy ?
      this.findPath({ x: this.x, y: this.y }, { x: newX, y: newY }) :
      Character.findPath({ x: this.x, y: this.y }, { x: newX, y: newY }, tiles);

    // If no path is found, return
    if (!path) {
      return;
    }

    // Character is now moving
    this.isMoving = true;

    const moveStep = (index) => {
      // If the path is complete, set the final position and stop the movement
      if (index >= path.length) {
        this.x = newX;
        this.y = newY;
        this.renderX = newX;
        this.renderY = newY;

        // Update tile buffs for new position
        this.updateTileBuffs();

        // Different end behavior for enemy vs player
        if (isEnemy) {
          this.isMoving = false;
          this.canMove = false;
          animationManager(this, "standing");
        } 
        else {
          // Keep the character selected and show the action menu
          this.isSelected = true;
          this.isMoving = false;
          actionMenu.show(this.x);
        }
        return;
      }

      // Current and target positions from the path
      const startX = this.x;
      const startY = this.y;
      const targetX = path[index].x;
      const targetY = path[index].y;

      // Only play walking sound and set animation if character actually moving to a new final position
      if (isActuallyMoving) {
        let walkSound;
        if (this.classType === "Cavalier") {
          walkSound = sounds.horseWalking;
          walkSound.amp(0.6);
        } 
        else if (this.classType === "Knight") {
          walkSound = sounds.armorWalking;
          walkSound.amp(0.6);
        } 
        else {
          walkSound = sounds.regularWalking;
          walkSound.amp(1);
        }
        if (walkSound && walkSound.isLoaded()) {
          walkSound.play();
        }

        // Set walking animation based on direction
        if (targetX > startX) {
          animationManager(this, "walkright");
        } 
        else if (targetX < startX) {
          animationManager(this, "walkleft");
        } 
        else if (targetY > startY) {
          animationManager(this, "walkdown");
        } 
        else if (targetY < startY) {
          animationManager(this, "walkup");
        }
      }

      // Move to next position
      this.x = targetX;
      this.y = targetY;

      // Schedule next step
      setTimeout(() => {
        moveStep(index + 1);
      }, 200); // 200 ms delay between steps
    };

    // Begin the movement sequence
    moveStep(0);
  }

  // Move the selected character to a new location
  static moveSelectedCharacter(cursor, tiles) {
    const selectedCharacter = Character.getSelectedCharacter();
    if (selectedCharacter && selectedCharacter.canMove) {
      // Check if the target tile is within movement range and reachable
      if (selectedCharacter.reachableTiles.some(tile => tile.x === cursor.x && tile.y === cursor.y)) {
        // Check if we can move to this tile
        if (!Tile.isTileOccupied(cursor.x, cursor.y)) {
          // Only store previous position if actually moving
          if (cursor.x !== selectedCharacter.x || cursor.y !== selectedCharacter.y) {
            selectedCharacter.previousX = selectedCharacter.x;
            selectedCharacter.previousY = selectedCharacter.y;
          }

          // Move the character to the new location
          selectedCharacter.moveTo(cursor.x, cursor.y);
        }
      }
    }
  }

  // Use A* algorithm to find a path to the selected tile
  static findPath(start, goal, tiles, isEnemy = false) {
    // First check if the start or goal positions are invalid
    if (!Tile.isWithinMapBounds(start.x, start.y) || !Tile.isWithinMapBounds(goal.x, goal.y)) {
      return null;
    }

    // Check if start or goal is walkable
    if (!tiles[start.y][start.x].isWalkable()) {
      return null;
    }

    // For enemy pathfinding, we allow moving towards player positions
    if (!tiles[goal.y][goal.x].isWalkable() && (!isEnemy || !this.isPositionBlockedByPlayer?.(goal.x, goal.y))) {
      return null;
    }

    // Initialize the open set with the starting node, containing its position, g (cost from start), and f (estimated total cost)
    const openSet = [{
      x: start.x,
      y: start.y,
      g: 0,
      f: Character.heuristic(start, goal)
    }];

    // Closed set to track nodes that have already been calculated
    const closedSet = new Set();

    // Map to track the path (stores which node leads to another)
    const cameFrom = new Map();

    // Map to track the cost from start to each node
    const gScore = new Map();
    gScore.set(`${start.x},${start.y}`, 0); // Initial g-score for the starting node is 0

    // While there are nodes to evaluate in the open set
    while (openSet.length > 0) {
      let current = openSet[0];
      let currentIndex = 0;

      // Find the node in the open set with the lowest f-score
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < current.f) {
          current = openSet[i];
          currentIndex = i;
        }
      }

      // If the goal node is reached, reconstruct and return the path (For enemy pathfinding, allow stopping adjacent to the goal)
      if (current.x === goal.x && current.y === goal.y ||
          isEnemy && Math.abs(current.x - goal.x) + Math.abs(current.y - goal.y) === 1) {
        const path = [];
        let curr = current;
        while (cameFrom.has(`${curr.x},${curr.y}`)) {
          path.unshift(curr); // Add the current node to the path
          curr = cameFrom.get(`${curr.x},${curr.y}`); // Move to the previous node in the path
        }
        if (isEnemy) {
          path.unshift(start);
        }
        return path; // Return the reconstructed path
      }

      // Remove the current node from the open set and add it to the closed set
      openSet.splice(currentIndex, 1);
      closedSet.add(`${current.x},${current.y}`);

      // Explore all valid neighbors (adjacent tiles)
      for (const dir of DIRECTIONS) {
        const neighbor = {
          x: current.x + dir.x,
          y: current.y + dir.y
        };
        // Create a unique key for the neighbor
        const neighborKey = `${neighbor.x},${neighbor.y}`;

        if (closedSet.has(neighborKey)) {
          continue;
        }

        // Skip the neighbor if it is; out of bounds, not walkable, blocked by an enemy or has already been evaluated
        if (!Tile.isWithinMapBounds(neighbor.x, neighbor.y) ||
            !tiles[neighbor.y][neighbor.x].isWalkable()) {
          continue;
        }

        // Enemy-specific collision handling
        if (isEnemy) {
          let isBlocked = false;
          let costModifier = 0;
        
          for (let character of characters) {
            if (character.x === neighbor.x && character.y === neighbor.y) {
              if (!character.isEnemy) {
                // Player characters block the path unless it's the goal
                if (neighbor.x !== goal.x || neighbor.y !== goal.y) {
                  continue;
                }
                isBlocked = true;
                break;
              } 
              else if (character !== this) {
                // Enemy characters add a movement penalty; this allows for pathfinding around enemy characters
                costModifier = 5;
              }
            }
          }

          // Skip if the path is blocked by a player character
          if (isBlocked) {
            continue; 
          }

          // Calculate score with enemy-specific cost modifier (cost of the path from start to this neighbor)
          const tentativeGScore = gScore.get(`${current.x},${current.y}`) + 1 + costModifier;

          // Check if the neighbor is already in the open set
          let neighborNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);

          // If the neighbor is not in the open set, add it
          if (!neighborNode) {
            neighborNode = {
              x: neighbor.x,
              y: neighbor.y,
              g: tentativeGScore, // Set the g-score for this node
              f: tentativeGScore + Character.heuristic(neighbor, goal) // Calculate the f-score (g + heuristic)
            };
            openSet.push(neighborNode); // Add the neighbor node to the open set
            gScore.set(neighborKey, tentativeGScore); // Track the g-score for this node
            cameFrom.set(neighborKey, current); // Set the current node as the previous node for this neighbor
          } 
          else if (tentativeGScore < gScore.get(neighborKey)) {
            // If the tentative g-score is lower than the current g-score, update the neighbor's scores
            neighborNode.g = tentativeGScore;
            neighborNode.f = tentativeGScore + Character.heuristic(neighbor, goal);
            gScore.set(neighborKey, tentativeGScore);
            cameFrom.set(neighborKey, current);
          }
        } 
        else {
          // Enemy-specific collision handling
          if (Tile.isTileBlockedByEnemy(neighbor.x, neighbor.y) &&
              (neighbor.x !== goal.x || neighbor.y !== goal.y)) {
            continue;
          }
          // Calculate the tentative g-score for the neighbor
          const tentativeGScore = gScore.get(`${current.x},${current.y}`) + 1;
          let neighborNode = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);

          // If the neighbor is not in the open set, add it
          if (!neighborNode) {
            neighborNode = {
              x: neighbor.x,
              y: neighbor.y,
              g: tentativeGScore,
              f: tentativeGScore + Character.heuristic(neighbor, goal)
            };
            openSet.push(neighborNode);
            gScore.set(neighborKey, tentativeGScore);
            cameFrom.set(neighborKey, current);
          } 
          else if (tentativeGScore < gScore.get(neighborKey)) {
            // If the tentative g-score is lower than the current g-score, update the neighbor's scores
            neighborNode.g = tentativeGScore;
            neighborNode.f = tentativeGScore + Character.heuristic(neighbor, goal);
            gScore.set(neighborKey, tentativeGScore);
            cameFrom.set(neighborKey, current);
          }
        }
      }
    }
    return null;
  }

  // Heuristic function for A* pathfinding (Manhattan distance)
  static heuristic(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
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

  // Draw movement preview for the selected character
  drawMovementPreview() {
    // Skip drawing if the action menu is visible or the character is moving
    if (actionMenu.isVisible || this.isMoving) {
      return;
    }

    // Check if the cursor is on a tile that the character can reach
    const isReachableTile = this.reachableTiles.some(
      tile => tile.x === locationCursor.x && tile.y === locationCursor.y
    );

    if (isReachableTile) {
      // Find the path from the character's current position to the cursor position
      const path = Character.findPath(
        { x: this.x, y: this.y },
        { x: locationCursor.x, y: locationCursor.y },
        tiles
      );

      // Draw arrow path to selected tile
      if (path) {
        // Draw continuous line for all segments except the last one
        stroke(41, 214, 255, 200);
        strokeWeight(10);
        noFill();
        strokeCap(PROJECT); // Use square end caps instead of round
        
        // Start drawing the shape from the character's current position
        beginShape();
        const startX = this.x * tilesWidth + tilesWidth / 2;
        const startY = this.y * tilesHeight + tilesHeight / 2;
        vertex(startX, startY);
        
        // Add vertices for each point in the path except the last one where the arrowhead is drawn
        for (let i = 0; i < path.length - 1; i++) {
          const x = path[i].x * tilesWidth + tilesWidth / 2;
          const y = path[i].y * tilesHeight + tilesHeight / 2;
          vertex(x, y);
        }

        // For the last segment, draw it slightly shorter
        if (path.length > 0) {
          const lastPoint = path[path.length - 1];
          const prevPoint = path.length > 1 ? path[path.length - 2] : { x: this.x, y: this.y };
          
          // Calculate direction vector
          const dx = lastPoint.x - prevPoint.x;
          const dy = lastPoint.y - prevPoint.y;
          
          // Calculate the endpoint to make sure line does not go into arrowhead
          const shortenAmount = Math.abs(dy) > 0 && dx === 0 ? 0.4 : 0.28; // Use 0.4 for vertical arrows, 0.28 for horizontal arrows
          const endX = lastPoint.x * tilesWidth + tilesWidth / 2 - dx * tilesWidth * shortenAmount;
          const endY = lastPoint.y * tilesHeight + tilesHeight / 2 - dy * tilesHeight * shortenAmount;
          
          vertex(endX, endY);
        }
        endShape();

        // Draw arrowhead at cursor position
        if (path.length > 0) {
          // Get the last point in the path
          const lastPoint = path[path.length - 1];

          // Determine the previous point in the path, or if there's only one point, use the character's position
          const prevPoint = path.length > 1 ? path[path.length - 2] : { x: this.x, y: this.y };
          
          // Calculate the difference in x and y coordinates between the last point and the previous point
          const dx = lastPoint.x - prevPoint.x;
          const dy = lastPoint.y - prevPoint.y;

          // Calculate the x and y coordinates for the endpoint of the path, adjusted for tile size
          const endX = lastPoint.x * tilesWidth + tilesWidth / 2;
          const endY = lastPoint.y * tilesHeight + tilesHeight / 2;

          // Align path to the map and move arrowhead further into the tile
          push();
          const arrowOffset = 15; // How many pixels to move the arrowhead forward
          translate(endX + dx * arrowOffset, endY + dy * arrowOffset);
          rotate(atan2(dy, dx));

          // Draw the arrowhead
          fill(41, 214, 255, 200);
          noStroke();
          const arrowSize = 30;
          triangle(0, 0, -arrowSize, -arrowSize/2, -arrowSize, arrowSize/2);
          pop();
        }
      }
    }
  }

  // Check if there are any enemies within attack range
  hasEnemiesInRange() {
    const attackableTiles = this.calculateAttackTiles();
    return attackableTiles.some(tile => 
      characters.some(char => char.isEnemy && char.x === tile.x && char.y === tile.y)
    );
  }

  // Attack logic for the character
  attack(opponent) {
    // Both attacker and defender should update their tile buffs before combat
    this.updateTileBuffs();
    if (opponent) {
      opponent.updateTileBuffs();
    }

    // Attack formula - use magic for mages
    let attack;
    if (this.classType === "Mage") {
      attack = this.magic + this.might;
    } 
    else {
      attack = this.strength + this.might;
    }

    // Protection and resistance formula
    let protection, resistance;
    if (opponent) {
      protection = opponent.baseDefense + opponent.tileBuffs.defenseBonus;
      resistance = opponent.baseResistance + opponent.tileBuffs.resistanceBonus;
    } 
    else {
      protection = this.baseDefense + this.tileBuffs.defenseBonus;
      resistance = this.baseResistance + this.tileBuffs.resistanceBonus;
    }

    // Damage Per Attack formula - use resistance for mage
    if (this.classType === "Mage") {
      this.displayedDamage = Math.max(0, attack - resistance);
    } 
    else {
      this.displayedDamage = Math.max(0, attack - protection);
    }

    // Attack Speed Formula
    const attackSpeed = this.speed - (6 - this.strength/5);

    // Hit Chance Formula
    let hit;
    const buffedDexterity = this.baseDexterity + this.tileBuffs.dexterityBonus;
    if (this.classType === "Mage") {
      hit = this.hit + (buffedDexterity + this.luck)/2;
    } 
    else {
      hit = this.hit + buffedDexterity;
    }

    // Avoid Formula
    let avoid;
    if (opponent) {
      const opponentSpeed = opponent.speed - (6 - opponent.strength/5);
      if (opponent.classType === "Mage") {
        avoid = (opponent.speed + opponent.luck)/2;
      } 
      else {
        avoid = opponentSpeed;
      }
    } 
    else {
      // If mage use different avoid formula
      if (this.classType === "Mage") {
        avoid = (this.speed + this.luck)/2;
      } 
      else {
        avoid = attackSpeed;
      }
    }

    // Displayed Hit Chance
    this.displayedHit = Math.max(0, hit - avoid);

    // Crit Chance Formula
    const crit = buffedDexterity + this.luck;

    // Crit Avoidance Formula
    let critAvoid;
    if (opponent) {
      critAvoid = opponent.luck;
    } 
    else {
      critAvoid = this.luck;
    }

    // Displayed Crit Chance
    this.displayedCrit = Math.max(0, crit - critAvoid);
  }

  // Update tile buffs based on current tile
  updateTileBuffs() {
    // Reset buffs first
    const oldDefBonus = this.tileBuffs.defenseBonus;
    const oldResBonus = this.tileBuffs.resistanceBonus;
    const oldDexBonus = this.tileBuffs.dexterityBonus;
    
    // Get buffs from current tile
    const currentTile = tiles[this.y][this.x];
    const tileBuffs = currentTile.getStatBuffs();
    
    // Apply the buffs
    this.tileBuffs.defenseBonus = tileBuffs.defenseBonus;
    this.tileBuffs.resistanceBonus = tileBuffs.resistanceBonus;
    // Handle dexterity specially since it's based on character's base stat
    this.tileBuffs.dexterityBonus = tileBuffs.dexterityBonus ? Math.floor(this.baseDexterity * tileBuffs.dexterityBonus) : 0;

    // Update stats with new buffs
    this.defense = this.baseDefense - oldDefBonus + this.tileBuffs.defenseBonus;
    this.resistance = this.baseResistance - oldResBonus + this.tileBuffs.resistanceBonus;
    this.dexterity = this.baseDexterity - oldDexBonus + this.tileBuffs.dexterityBonus;
  }

  // HP Management Methods
  // Sets the character's current HP to a specific value, ensuring it stays between 0 and maxHP
  setCurrentHP(value) {
    // Math.max ensures HP doesn't go below 0 and Math.min ensures HP doesn't exceed maxHP
    this.currentHP = Math.max(0, Math.min(value, this.maxHP));
  }

  // Reduces the character's current HP by the specified amount of damage
  takeDamage(amount) {
    // Uses setCurrentHP to ensure HP stays within valid range (0 to maxHP)
    this.setCurrentHP(this.currentHP - amount);
  }

  // Increases the character's current HP by the specified amount of healing
  heal(amount) {
    this.currentHP = Math.min(this.maxHP, this.currentHP + amount);
  }

  // Checks if the character has been defeated (HP reduced to 0)
  isDead() {
    return this.currentHP <= 0;
  }

  // Calculates what fraction of max HP the character currently has (Used for displaying HP bars and other UI elements)
  getCurrentHPRatio() {
    return this.currentHP / this.maxHP;
  }
}

// EnemyCharacter Class: Extends Character with enemy-specific behavior
class EnemyCharacter extends Character {
  constructor(name, classType, x, y, level, hp, strength, magic, dexterity, speed, luck, defense, resistance, might, hit, isEnemy, width = 50, height = 50) {
    super(name, classType, x, y, level, hp, strength, magic, dexterity, speed, luck, defense, resistance, might, hit, isEnemy, width, height);
  }

  // Check if a player has adjacent enemies
  hasAdjacentEnemies(player) {
    const adjacentPositions = DIRECTIONS.map(dir => ({
      x: player.x + dir.x,
      y: player.y + dir.y
    }));

    // Count how many adjacent positions are occupied by enemies
    let enemyCount = 0;
    for (let pos of adjacentPositions) {
      for (let character of characters) {
        if (character.isEnemy && character.x === pos.x && character.y === pos.y) {
          enemyCount++;
          break;
        }
      }
    }

    // Return true if all walkable adjacent positions are occupied by enemies
    let walkableAdjacents = adjacentPositions.filter(pos => 
      Tile.isWithinMapBounds(pos.x, pos.y) && tiles[pos.y][pos.x].isWalkable()
    ).length;

    return enemyCount >= walkableAdjacents;
  }

  // Find the nearest player character that isn't surrounded by enemies
  findNearestPlayer() {
    let playerDistances = [];

    // Calculate distances to all non-enemy characters
    for (let character of characters) {
      if (!character.isEnemy) {
        const distance = Math.abs(this.x - character.x) + Math.abs(this.y - character.y);
        playerDistances.push({
          player: character,
          distance: distance
        });
      }
    }

    // Sort by distance
    playerDistances.sort((a, b) => a.distance - b.distance);

    // Find the first player that isn't surrounded by enemies
    for (let playerDist of playerDistances) {
      // If this is an adjacent player, return them regardless of surroundings
      if (playerDist.distance === 1) {
        return playerDist.player;
      }
      
      // Otherwise, check if they're surrounded
      if (!this.hasAdjacentEnemies(playerDist.player)) {
        return playerDist.player;
      }
    }

    // If all players are surrounded, return the nearest one anyway
    return playerDistances[0]?.player || null;
  }

  // Use findPath for enemy-specific behavior
  findPath(start, goal) {
    return Character.findPath(start, goal, tiles, true);
  }

  // Helper method to check if a position is blocked by a player
  isPositionBlockedByPlayer(x, y) {
    for (let character of characters) {
      if (character.x === x && character.y === y && !character.isEnemy) {
        return true;
      }
    }
    return false;
  }

  // Execute AI movement
  executeAIMove() {
    // Check if enemy can move and if enemy movement is allowed
    if (!this.canMove || !canEnemyMove) {
      return;
    }

    // Reset enemy initiated flag at start of move
    isEnemyInitiated = false;

    // Find nearest player character
    const nearestPlayer = this.findNearestPlayer();

    // Find path to nearest player location
    const path = this.findPath(
      {x: this.x, y: this.y},
      {x: nearestPlayer.x, y: nearestPlayer.y}
    );

    if (path && path.length > 0) {
      const movementRange = this.getMovementRange();
     
      // Try each position in the path until we find one that's not blocked
      let targetPos = null;
      for (let i = Math.min(movementRange, path.length - 1); i >= 0; i--) {
        const pos = path[i];
        let isBlocked = false;
        for (let character of characters) {
          if (character !== this && character.x === pos.x && character.y === pos.y) {
            isBlocked = true;
            break;
          }
        }
        if (!isBlocked) {
          targetPos = pos;
          break;
        }
      }

      // If we found a valid position, move there
      if (targetPos) {
        canEnemyMove = false;  // Prevent other enemies from moving as soon as we find a valid move
        this.previousX = this.x;
        this.previousY = this.y;
        this.moveTo(targetPos.x, targetPos.y);
      } 
      else {
        canEnemyMove = true;  // Allow next enemy to move if no valid position
      }
    } 
    else {
      canEnemyMove = true;  // Allow next enemy to move if no path
    }
  }

  // Use moveTo for enemy-specific behavior
  moveTo(newX, newY) {
    super.moveTo(newX, newY, true);
    
    // Set up a check for when movement is complete
    const checkMovement = () => {
      if (!this.isMoving) {
        // Movement is complete, check for possible attacks
        this.calculateActionableTiles();
        let hasTarget = false;
        
        for (let character of characters) {
          if (!character.isEnemy) {
            // Check if player character is in attack range
            const distance = Math.abs(this.x - character.x) + Math.abs(this.y - character.y);
            if (distance <= this.getAttackRange()) {
              hasTarget = true;
              
              // Wait 500ms before setting up battle
              setTimeout(() => {
                // Set up for battle
                isEnemyInitiated = true;
                selectedCharacter = character;
                locationCursor.x = this.x;
                locationCursor.y = this.y;
                enemySelectedForAttack = true;
                selectedCharacter.attackInterfaceConfirmed = true;
                selectedCharacter.action = "attack";
              }, 500);
              break;
            }
          }
        }

        // If no enemies to attack
        if (!hasTarget) {
          canEnemyMove = true;  // Allow next enemy to move
          this.isGreyedOut = true;  // Grey out immediately
        }
        
        // Stop the repeated movement check since we're done moving
        clearInterval(moveCheckInterval);
      }
    };
    
    // Start checking every 300ms if the enemy has finished their movement animation (need this because movement happens gradually over time)
    const moveCheckInterval = setInterval(checkMovement, 300);
  }
}

// Action Menu class: Handles the menu that appears after moving a character
class ActionMenu {
  constructor() {
    // Available menu options for the selected character
    this.options = ["Attack", "Item", "Wait"];
    this.selectedOption = 0;
    this.isVisible = false;
    
    // Menu position and dimensions
    this.x = 0;
    this.y = 0;
    this.actionMenuWidth = 250;
    this.actionMenuHeight = 75;
  }

  // Show the action menu
  show(x) {
    // Calculate the half way point of the map (width-wise)
    const mapWidthMidpoint = tilesWide / 2;

    // Position on right side of canvas if x is less than half,  position on left if x is more than half
    this.x = x < mapWidthMidpoint ? width - this.actionMenuWidth * 1.2 :  this.actionMenuWidth * 0.2;

    // Center the menu vertically
    this.y = height / 2 - this.actionMenuHeight * 1.3;

    // Set action menu to be visible
    this.isVisible = true;

    // Set option to the very top most option
    this.selectedOption = 0;
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

    // Enable smoothing for UI elements
    smooth();

    // Display menu options using images
    for (let i = 0; i < this.options.length; i++) {
      const option = this.options[i].toLowerCase();
      const isSelected = i === this.selectedOption;
      const imageKey = option === "item" ? "items" + (isSelected ? "Selected" : "") : option + (isSelected ? "Selected" : "");
     
      // Spacing between images
      const yOffset = i * this.actionMenuHeight * 1.2;

      // Draw the menu image
      if (actionMenuImages[imageKey]) {
        image(actionMenuImages[imageKey], this.x, this.y + yOffset, this.actionMenuWidth, this.actionMenuHeight);
      }
    }

    // Disable smoothing again for game elements
    noSmooth();
  }

  // Obtain the selected option
  getSelectedOption() {
    return this.options[this.selectedOption];
  }
}

// Cursor class: Renders the cursor used for selecting tiles and moving characters
class Cursor {
  constructor(x = 4, y = 12) {
    this.x = x;  // Horizontal position (in tile coordinates)
    this.y = y;  // Vertical position (in tile coordinates)
    this.width = tilesWidth;
    this.height = tilesHeight;
  }

  // Move the cursor based on input (WASD)
  move(direction) {
    // Plays cursor moving sound effect
    sounds.cursorMoving.amp(0.3);
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
    // Don't render cursor if game is over
    if (isGameOver) {
      return;
    }
    
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

// UIManager class: Handles all UI-related rendering and functionality
class UIManager {
  constructor() {
    // Constants for character info display
    this.characterInfoWidth = 400;
    this.characterInfoHeight = 120;
    this.characterInfoPadding = 20;

    // Constants for turn image display
    this.turnImageWidth = 600;
    this.turnImageHeight = 125;

    // Properties for items
    this.selectedItemIndex = 0;
    this.itemConfirmationMode = false;
    // List of items available to use
    this.items = [
      { name: "Vulnerary", image: "vulnerary" },
      { name: "Vulnerary", image: "vulnerary" },
      { name: "Vulnerary", image: "vulnerary" }
    ];
    // Game over image alpha value
    this.gameOverAlpha = 0;
  }

  // Battle info preview function to show combat forecast
  battleInfoPreview() {
    
    // Enable smoothing for UI elements
    smooth();
    
    // Scale down the images to 80% of their original size
    const scaledWidth = UIImages.allyBox.width * 0.8;
    const scaledHeight = UIImages.allyBox.height * 0.8;
    
    // Move ally and enemy boxes 55% down the screen
    const yPosition = height * 0.55;
    
    // Draw the ally box image on the left
    image(UIImages.allyBox, 0, yPosition, scaledWidth, scaledHeight);

    // Draw character name above the line for ally
    textSize(30);
    textFont("DMT Shuei MGo Std Bold");
    textAlign(CENTER, CENTER);
    stroke(0);
    strokeWeight(3);
    fill(255);
    text(selectedCharacter.name, scaledWidth/2, yPosition + scaledHeight/3);

    // Draw white line through middle of ally box 
    stroke(255);
    strokeWeight(1.5);  
    const lineWidth = scaledWidth * 0.6;
    const lineStart = (scaledWidth - lineWidth) / 2;  // Center the line
    line(lineStart, yPosition + scaledHeight/2, lineStart + lineWidth, yPosition + scaledHeight/2);

    // Draw the enemy box image on the right
    const enemyBoxX = width - scaledWidth;
    image(UIImages.enemyBox, enemyBoxX, yPosition, scaledWidth, scaledHeight);

    // Draw white line through middle of enemy box
    line(enemyBoxX + lineStart, yPosition + scaledHeight/2, enemyBoxX + lineStart + lineWidth, yPosition + scaledHeight/2);

    // Find enemy at cursor position
    const targetEnemy = characters.find(
      char => char.isEnemy && char.x === locationCursor.x && char.y === locationCursor.y
    );

    // Draw class name above the line for enemy
    textSize(30);
    textFont("DMT Shuei MGo Std Bold");
    textAlign(CENTER, CENTER);
    stroke(0);
    strokeWeight(3);
    fill(255);
    text(targetEnemy.classType, enemyBoxX + scaledWidth/2, yPosition + scaledHeight/3);

    // Calculate the remaining vertical space
    const remainingHeight = height - (yPosition + scaledHeight);
    
    // Draw the calculation box below both boxes using full screen width
    image(UIImages.calculationBox, 0, yPosition + scaledHeight, width, remainingHeight);

    // Add arrows to show attack order
    const arrowSpacing = 45;  // Spacing between arrows
    const scaledArrowWidth = UIImages.playerArrow.width * 0.7;  // Scaled width
    const scaledArrowHeight = UIImages.playerArrow.height * 0.7;  // Scaled height
    const centerX = width / 2 - scaledArrowWidth / 2;  // Center position accounting for arrow width
    const arrowYOffset = 80;  // Increased Y offset for arrows

    // Calculate speed differences to determine if there double attacks
    const playerSpeedDiff = selectedCharacter.speed - targetEnemy.speed;
    const enemySpeedDiff = targetEnemy.speed - selectedCharacter.speed;

    // Calculate distance between attacker and target
    const distance = Math.abs(selectedCharacter.x - targetEnemy.x) + Math.abs(selectedCharacter.y - targetEnemy.y);
    const isRangedAttack = distance === 2;

    // Setup text style for damage numbers
    textSize(30);
    textFont("DMT Shuei MGo Std Bold");
    textAlign(LEFT, CENTER);
    stroke(255, 0, 0);
    strokeWeight(1);
    fill(255);

    // Calculate player character's individual hit damage if double attack
    let hitDamage = selectedCharacter.displayedDamage;  
    if (playerSpeedDiff >= 4) {
      // If character will double attack, show the individual hit damage
      hitDamage = selectedCharacter.displayedDamage; 
    } 

    // Calculate enemy's individual hit damage if double attack
    let enemyHitDamage = targetEnemy.displayedDamage;
    if (enemySpeedDiff >= 4) {
      enemyHitDamage = targetEnemy.displayedDamage;  
    } 

    // Draw player arrow
    image(UIImages.playerArrow, centerX, yPosition + scaledHeight + arrowYOffset, 
      scaledArrowWidth, scaledArrowHeight);

    // Draw first attack damage to the right of the player arrow
    text(hitDamage, centerX + scaledArrowWidth + 20, yPosition + scaledHeight + arrowYOffset + scaledArrowHeight/2);

    // If attack is over 2 tiles, do not show enemy counterattack arrow
    if (!isRangedAttack) {
      // Enemy counterattack arrow
      image(UIImages.enemyArrow, centerX, yPosition + scaledHeight + arrowYOffset + arrowSpacing,
        scaledArrowWidth, scaledArrowHeight);
      // Draw enemy attack damage to the left of the enemy arrow
      text(enemyHitDamage, centerX - 40, yPosition + scaledHeight + arrowYOffset + arrowSpacing + scaledArrowHeight/2);
        
      // If player is 4 or more speed faster, show second player arrow with individual hit damage
      if (playerSpeedDiff >= 4) {
        image(UIImages.playerArrow, centerX, yPosition + scaledHeight + arrowYOffset + arrowSpacing * 2,
          scaledArrowWidth, scaledArrowHeight);
                  
        // Draw second attack damage (same individual hit damage)
        text(hitDamage, centerX + scaledArrowWidth + 20, 
          yPosition + scaledHeight + arrowYOffset + arrowSpacing * 2 + scaledArrowHeight/2);
      }
      // If enemy is 4 or more speed faster, show second enemy arrow
      else if (enemySpeedDiff >= 4) {
        image(UIImages.enemyArrow, centerX, yPosition + scaledHeight + arrowYOffset + arrowSpacing * 2,
          scaledArrowWidth, scaledArrowHeight);

        // Draw second enemy attack damage to the left of the arrow
        text(enemyHitDamage, centerX - 40, 
          yPosition + scaledHeight + arrowYOffset + arrowSpacing * 2 + scaledArrowHeight/2);
      }
    }

    // Draw HP text for player side (left)
    textSize(33);
    textFont("DMT Shuei MGo Std Bold");
    textAlign(LEFT, TOP);
    stroke(0);
    strokeWeight(5);
    fill(244, 235, 215);
    text("HP", 35, yPosition + scaledHeight + 20);
    // Draw HP text for enemy side (right)
    text("HP", width/2 + 35, yPosition + scaledHeight + 20);
    
    // Draw current HP number for player and enemy
    textSize(40);
    fill(255);
    text(selectedCharacter.currentHP, 90, yPosition + scaledHeight + 15);
    text(targetEnemy.currentHP, width/2 + 90, yPosition + scaledHeight + 15);

    // HP bar constants
    const barWidth = 300;
    const barHeight = 20;
    const cornerRadius = 10;

    // Draw player HP bar
    const playerBarX = 150;
    const playerBarY = yPosition + scaledHeight + 23;
    const playerHPRatio = selectedCharacter.currentHP / selectedCharacter.maxHP;

    // Draw bar fill - top half (player)
    noStroke();
    fill(210, 255, 255);
    rect(playerBarX, playerBarY, barWidth * playerHPRatio, barHeight/2, cornerRadius, cornerRadius, 0, 0);

    // Draw bar fill - bottom half (player)
    fill(146, 251, 254);
    rect(playerBarX, playerBarY + barHeight/2, barWidth * playerHPRatio, barHeight/2, 0, 0, cornerRadius, cornerRadius);

    // Draw bar outline (player)
    stroke(140, 107, 49);
    strokeWeight(4);
    noFill();
    rect(playerBarX, playerBarY, barWidth, barHeight, cornerRadius);

    // Draw enemy HP bar
    const enemyBarX = width/2 + 150;
    const enemyBarY = yPosition + scaledHeight + 23;
    const enemyHPRatio = targetEnemy.currentHP / targetEnemy.maxHP;

    // Draw bar fill - top half (enemy)
    noStroke();
    fill(248, 202, 126);
    rect(enemyBarX, enemyBarY, barWidth * enemyHPRatio, barHeight/2, cornerRadius, cornerRadius, 0, 0);

    // Draw bar fill - bottom half (enemy)
    fill(242, 118, 105);
    rect(enemyBarX, enemyBarY + barHeight/2, barWidth * enemyHPRatio, barHeight/2, 0, 0, cornerRadius, cornerRadius);

    // Draw bar outline (enemy)
    stroke(140, 107, 49);
    strokeWeight(4);
    noFill();
    rect(enemyBarX, enemyBarY, barWidth, barHeight, cornerRadius);

    // Draw three lines below player HP bar
    stroke(255, 255, 200); 
    strokeWeight(1.5);
    for (let i = 0; i < 3; i++) {
      const lineY = playerBarY + barHeight + 50 + i * 35;
      line(playerBarX - 120, lineY, playerBarX + barWidth - 120, lineY);
    }

    // Draw three lines below enemy HP bar
    for (let i = 0; i < 3; i++) {
      const lineY = enemyBarY + barHeight + 50 + i * 35;
      line(enemyBarX + 20, lineY, enemyBarX + barWidth + 20, lineY);
    }

    // Draw DMG, HIT, and CRIT text for player side on each line 
    textSize(25);
    textFont("DMT Shuei MGo Std Bold");
    textAlign(LEFT, BOTTOM);
    stroke(0);
    strokeWeight(3);
    fill(244, 235, 215);
    text("DMG", playerBarX - 85, playerBarY + barHeight + 50); 
    text("HIT", playerBarX - 85, playerBarY + barHeight + 85); 
    text("CRIT", playerBarX - 85, playerBarY + barHeight + 121); 

    // Draw DMG, HIT, and CRIT text for enemy side on each line 
    text("DMG", enemyBarX + 55, enemyBarY + barHeight + 50); 
    text("HIT", enemyBarX + 55, enemyBarY + barHeight + 85); 
    text("CRIT", enemyBarX + 55, enemyBarY + barHeight + 121); 

    // Draw hit, crit, and damage values
    fill(255);
    textAlign(RIGHT, BOTTOM);

    // Calculate attacking values first
    selectedCharacter.attack(targetEnemy);
    targetEnemy.attack(selectedCharacter);

    // Double damage if speed difference is 4 or more
    if (playerSpeedDiff >= 4) {
      selectedCharacter.displayedDamage *= 2;
    }
    if (enemySpeedDiff >= 4) {
      targetEnemy.displayedDamage *= 2;
    }

    // Display player values
    text(selectedCharacter.displayedDamage, playerBarX + barWidth - 140, playerBarY + barHeight + 50);  // DMG
    text(Math.floor(selectedCharacter.displayedHit) + "%", playerBarX + barWidth - 140, playerBarY + barHeight + 85);  // HIT
    text(Math.floor(selectedCharacter.displayedCrit) + "%", playerBarX + barWidth - 140, playerBarY + barHeight + 121);  // CRIT

    // Display enemy values
    if (isRangedAttack) {
      text("-", enemyBarX + barWidth, enemyBarY + barHeight + 50);  // DMG
      text("-", enemyBarX + barWidth, enemyBarY + barHeight + 85);  // HIT
      text("-", enemyBarX + barWidth, enemyBarY + barHeight + 121);  // CRIT
    } 
    else {
      text(targetEnemy.displayedDamage, enemyBarX + barWidth, enemyBarY + barHeight + 50);  // DMG
      text(Math.floor(targetEnemy.displayedHit) + "%", enemyBarX + barWidth, enemyBarY + barHeight + 85);  // HIT
      text(Math.floor(targetEnemy.displayedCrit) + "%", enemyBarX + barWidth, enemyBarY + barHeight + 121);  // CRIT
    }

    // Disable smoothing again for game elements
    noSmooth();
  }

  // Display character info when hovering over a character
  displayCharacterInfo(character) {
    // Enable smoothing for UI elements
    smooth();
    
    // Set up rectangle properties
    const rectX = width - this.characterInfoWidth - this.characterInfoPadding;
    const rectY = this.characterInfoPadding;
    
    // Draw outer border (white)
    stroke(243, 255, 255);
    strokeWeight(2);
    noFill();
    rect(rectX, rectY, this.characterInfoWidth, this.characterInfoHeight);
    
    // Draw inner border (blue-grey)
    stroke(127, 148, 209);
    strokeWeight(1);
    rect(rectX + 2, rectY + 2, this.characterInfoWidth - 4, this.characterInfoHeight - 4);
    
    // Draw main rectangle (light blue)
    fill(193, 214, 255, 180);
    noStroke();
    rect(rectX + 3, rectY + 3, this.characterInfoWidth - 6, this.characterInfoHeight - 6);

    // Draw portrait of character
    let portraitKey = character.isEnemy ? 
      character.classType.toLowerCase() + "Portrait" : 
      character.name.toLowerCase() + "Portrait";

    if (portraitImages[portraitKey]) {
      const portraitHeight = this.characterInfoHeight - 12;
      const portraitWidth = portraitHeight * 1.2;
      
      // Set up variables for portrait position and size
      let finalWidth = portraitWidth;
      let finalHeight = portraitHeight;
      let xOffset = 6;
      let yOffset = 3;

      // Scale down fighter portrait
      if (portraitKey === "fighterPortrait") {
        finalWidth *= 0.9;  
        finalHeight *= 0.95;
        xOffset = 15; 
        yOffset = 13;  
      }
      else {
        // Scale up all other portraits by 1.1x
        finalWidth *= 1.1;
        finalHeight *= 1.1;
        xOffset = 3;  
        yOffset = 0;  
      }
      
      // Display the portrait
      image(portraitImages[portraitKey], rectX + xOffset, rectY + yOffset, finalWidth, finalHeight);

      // Display HP text
      textSize(33);
      textFont("DMT Shuei MGo Std Bold");
      textAlign(LEFT, TOP);
      stroke(0);  
      strokeWeight(5);  
      fill(255);  
      const hpX = rectX + finalWidth + xOffset + 35;
      const hpY = rectY + 55;
      text("HP", hpX, hpY);

      // Display HP fraction
      const hpFractionX = hpX + 50;
      textSize(35);
      stroke(255); 
      strokeWeight(1); 
      fill(0); 
      text(character.currentHP + "/" + character.maxHP, hpFractionX, hpY);

      // Draw HP bar
      const barWidth = 220;
      const barHeight = 20;
      const barX = hpX - 30; 
      const barY = hpY + 35;
      const hpRatio = character.currentHP / character.maxHP;
      const cornerRadius = 10;

      // Draw bar fill - top half
      noStroke();
      fill(247, 247, 255);
      rect(barX, barY, barWidth * hpRatio, barHeight/2, cornerRadius, cornerRadius, 0, 0);

      // Draw bar fill - bottom half
      fill(247, 239, 115);
      rect(barX, barY + barHeight/2, barWidth * hpRatio, barHeight/2, 0, 0, cornerRadius, cornerRadius);

      // Draw bar outline
      stroke(140, 107, 49);
      strokeWeight(4);
      noFill();
      rect(barX, barY, barWidth, barHeight, cornerRadius);

      // Display character name
      textSize(40);
      textAlign(LEFT, TOP);
      stroke(0); 
      strokeWeight(1);  
      fill(0);
      const nameX = rectX + finalWidth + xOffset + 60;
      const nameY = rectY + 10;
      text(character.isEnemy ? character.classType : character.name, nameX, nameY);
    }
    
    // Disable smoothing again for game elements
    noSmooth();
  }

  // Display turn phase image in the center of screen
  displayTurnImage() {
    // Enable smoothing for UI elements
    smooth();

    // Show image in the middle of the screen after 2 seconds
    if (showTurnImage && millis() - turnImageTimer < 2000) {
      const imageKey = isPlayerTurn ? "playerTurn" : "enemyTurn";
      image(
        UIImages[imageKey], 
        width/2 - this.turnImageWidth/2, 
        height/2 - this.turnImageHeight/2, 
        this.turnImageWidth, 
        this.turnImageHeight
      );
    }
    else {
      showTurnImage = false;
    }

    // Disable smoothing again for game elements
    noSmooth();
  }

  // Display tile location image based on cursor position
  displayTileLocationImage() {
    const currentTile = tiles[locationCursor.y][locationCursor.x];
    let imageKey;
    
    // Map tile types to their corresponding UI images
    if (currentTile.type === 'G' || currentTile.type === 'g') {
      imageKey = 'grassland';
    }
    else if (currentTile.type === 'P') {
      imageKey = 'plain';
    }
    else if (currentTile.type === 'W') {
      imageKey = 'river';
    }
    else if (currentTile.type === 'T') {
      imageKey = 'forest';
    }
    else if (currentTile.type === 'H') {
      imageKey = 'house';
    }
    else if (currentTile.type === 'M') {
      imageKey = 'cliff';
    }
    else if (['7', '8', '9', '4', '5', '6', '1', '2', '3'].includes(currentTile.type)) {
      imageKey = 'stronghold';
    }
    else {
      return; // Don't display anything for unknown tile types
    }

    if (UIImages[imageKey]) {
      // Enable smoothing for UI elements
      smooth();
      
      // Image dimensions
      const imageWidth = 275;
      const imageHeight = 80;
      
      // Calculate Y position based on cursor position
      const isAboveMiddle = locationCursor.y < tilesHigh / 2;
      const yPosition = isAboveMiddle ? height - imageHeight - 20 : 20;
      
      // Draw the image
      image(UIImages[imageKey], 0, yPosition, imageWidth, imageHeight);
      
      // Disable smoothing again for game elements
      noSmooth();
    }
  }

  // Draw the battle interface
  drawBattleInterface(selectedCharacter, targetEnemy) {
    // Switch to battle music by adjusting volumes
    sounds.outBattleMusic.amp(0.3);
    sounds.inBattleMusic.amp(0.2);
  
    // Draw the battle background first
    image(UIImages.battleBackground, 0, 0, width, height);
    
    // Draw the attack interface image centered on screen
    const interfaceWidth = width * 1.05;
    const interfaceHeight = height;
    const x = (width - interfaceWidth) / 2;
    const y = (height - interfaceHeight) / 2;
    image(UIImages.attackInterface, x, y, interfaceWidth, interfaceHeight);
  
    // Setup text style for character names at top
    textSize(50);
    textFont("DMT Shuei MGo Std Bold");
    textAlign(CENTER, CENTER);
    stroke(0);
    strokeWeight(7);
    fill(255);
  
    // Draw player character name at top left
    text(selectedCharacter.name, width * 0.13, height * 0.11);
  
    // Draw enemy character class at top right
    text(targetEnemy.classType, width * 0.88, height * 0.11);

    // Draw HP bars at bottom of screen
    const barWidth = 10; // Width of HP Bar
    const barHeight = 18; //  Height of HP bar
    const barSpacing = 1;  // Space between rectangles
    const barY = height * 0.92; // Y position

    // Draw "HP" text for both bars
    textSize(40);
    textFont("DMT Shuei MGo Std Bold");
    textAlign(LEFT, TOP);
    stroke(0);
    strokeWeight(5);
    fill(244, 235, 215);

    // Player side HP text
    text("HP", width * 0.02, barY - 10);

    // Enemy side HP text
    text("HP", width * 0.54, barY - 10);

    // Draw player HP bar (left side)
    const playerBarStartX = width * 0.08;
    // Draw empty/background bars first
    for (let i = 0; i < selectedCharacter.maxHP; i++) {
      stroke(90, 0, 0);
      strokeWeight(3);
      fill(100, 0, 0);
      rect(playerBarStartX + i * (barWidth + barSpacing), barY, barWidth, barHeight);
    }
    // Draw filled bars up to currentHP
    for (let i = 0; i < selectedCharacter.currentHP; i++) {
      stroke(0, 90, 0);
      strokeWeight(3);
      fill(156, 255, 0);
      rect(playerBarStartX + i * (barWidth + barSpacing), barY, barWidth, barHeight);
    }

    // Draw enemy HP bar (right side)
    const enemyBarStartX = width * 0.60;
    // Draw empty/background bars first
    for (let i = 0; i < targetEnemy.maxHP; i++) {
      stroke(90, 0, 0);
      strokeWeight(3);
      fill(100, 0, 0);
      rect(enemyBarStartX + i * (barWidth + barSpacing), barY, barWidth, barHeight);
    }
    // Draw filled bars up to currentHP
    for (let i = 0; i < targetEnemy.currentHP; i++) {
      stroke(0, 90, 0);
      strokeWeight(3);
      fill(156, 255, 0);
      rect(enemyBarStartX + i * (barWidth + barSpacing), barY, barWidth, barHeight);
    }

    // Reset text style for weapon names
    textAlign(CENTER, CENTER);
    textFont("DMT Shuei MGo Std Bold");
    textSize(35);
    stroke(0);
    strokeWeight(4);
    fill(255);
  
    // Get weapon text and image based on character
    let playerWeaponText, playerWeaponImage;
    let enemyWeaponText, enemyWeaponImage;
  
    // Set player weapon text and image
    if (selectedCharacter.name === "Roy") {
      playerWeaponText = "Steel Sword";
      playerWeaponImage = UIImages.sword;
    }
    else if (selectedCharacter.name === "Wolt") {
      playerWeaponText = "Steel Bow";
      playerWeaponImage = UIImages.bow;
    }
    else if (selectedCharacter.name === "Bors") {
      playerWeaponText = "Steel Lance";
      playerWeaponImage = UIImages.lance;
    }
    else if (selectedCharacter.name === "Lance" || selectedCharacter.name === "Allen") {
      playerWeaponText = "Steel Spear";
      playerWeaponImage = UIImages.spear;
    }
    else if (selectedCharacter.name === "Lugh") {
      playerWeaponText = "Fire Tome";
      playerWeaponImage = UIImages.fireTome;
    }
  
    // Set enemy weapon text and image
    if (targetEnemy.classType === "Fighter" || targetEnemy.classType === "Brigand") {
      enemyWeaponText = "Iron Axe";
      enemyWeaponImage = UIImages.axe;
    }
  
    // Draw player weapon text and image
    text(playerWeaponText, width * 0.32, height * 0.8);
    if (playerWeaponImage) {
      const weaponSize = 45;
      image(playerWeaponImage, width * 0.45 - weaponSize/2, height * 0.76, weaponSize, weaponSize);
    }
  
    // Draw enemy weapon text and image
    text(enemyWeaponText, width * 0.63, height * 0.8);
    if (enemyWeaponImage) {
      const weaponSize = 45;
      image(enemyWeaponImage, width * 0.76 - weaponSize/2, height * 0.76, weaponSize, weaponSize);
    }
  
    // Calculate positions for bottom stats
    const playerStatsX = width * 0.1;
    const enemyStatsX = width * 0.92;
    const baseStatsY = height * 0.745;
  
    // Setup text style for stats labels
    textSize(25);
    textFont("DMT Shuei MGo Std Bold");
    textAlign(LEFT, BOTTOM);
    stroke(0);
    strokeWeight(3);  // Reduced from 5 to 3 to make text cleaner
    fill(244, 235, 215);
  
    // Draw DMG, HIT, and CRIT text for player side
    text("DMG", playerStatsX - 85, baseStatsY);
    text("HIT", playerStatsX - 85, baseStatsY + 36);
    text("CRIT", playerStatsX - 85, baseStatsY + 73);
  
    // Draw DMG, HIT, and CRIT text for enemy 
    text("DMG", enemyStatsX - 85, baseStatsY);
    text("HIT", enemyStatsX - 85, baseStatsY + 36);
    text("CRIT", enemyStatsX - 85, baseStatsY + 73);
  
    // Calculate if it's a ranged attack
    const distance = Math.abs(selectedCharacter.x - targetEnemy.x) + Math.abs(selectedCharacter.y - targetEnemy.y);
    const isRangedAttack = distance === 2;
  
    // Calculate speed differences for double attacks
    const playerSpeedDiff = selectedCharacter.speed - targetEnemy.speed;
    const enemySpeedDiff = targetEnemy.speed - selectedCharacter.speed;
  
    // Calculate attacking values
    selectedCharacter.attack(targetEnemy);
    targetEnemy.attack(selectedCharacter);
  
    // Double damage if speed difference is 4 or more
    if (playerSpeedDiff >= 4) {
      selectedCharacter.displayedDamage *= 2;
    }
    if (enemySpeedDiff >= 4) {
      targetEnemy.displayedDamage *= 2;
    }
  
    // Draw values
    fill(255);
    textAlign(RIGHT, BOTTOM);
  
    // Display player values
    text(selectedCharacter.displayedDamage, playerStatsX + 50, baseStatsY);
    text(Math.floor(selectedCharacter.displayedHit) + "%", playerStatsX + 50, baseStatsY + 36);
    text(Math.floor(selectedCharacter.displayedCrit) + "%", playerStatsX + 50, baseStatsY + 72);
  
    // Display enemy values if it's a ranged attack set to -
    if (isRangedAttack) {
      text("-", enemyStatsX + 50, baseStatsY);
      text("-", enemyStatsX + 50, baseStatsY + 35);
      text("-", enemyStatsX + 50, baseStatsY + 70);
    } 
    else {
      text(targetEnemy.displayedDamage, enemyStatsX + 50, baseStatsY);
      text(Math.floor(targetEnemy.displayedHit) + "%", enemyStatsX + 50, baseStatsY + 36);
      text(Math.floor(targetEnemy.displayedCrit) + "%", enemyStatsX + 50, baseStatsY + 72);
    }
  }

  // Draw the item interface
  itemsInterface() {
    const itemBoxWidth = width * 0.3;
    const itemBoxHeight = height * 0.4;
    
    // Center vertically a little lower than half way down the screen
    const yOffset = (height - itemBoxHeight) / 2 + 50;  

    // Get selected character
    const selectedCharacter = Character.getSelectedCharacter();
    
    // Calculate the half way point of the map (width-wise)
    const mapWidthMidpoint = tilesWide / 2;
    
    // Position on left side if character is past midpoint, right side if before midpoint
    const xPos = selectedCharacter.x >= mapWidthMidpoint ? itemBoxWidth * 0.2 : width - itemBoxWidth * 1.2;

    // Draw item box
    image(UIImages.itemBox, xPos, yOffset, itemBoxWidth, itemBoxHeight);

    // Draw confirmation text if the item has been selected
    if (this.itemConfirmationMode) {
      textSize(25);
      textFont("DMT Shuei MGo Std Bold");
      textAlign(CENTER, CENTER);
      stroke(0);
      strokeWeight(3);
      fill(255);
      const selectedItem = this.items[this.selectedItemIndex];
      text(`Use ${selectedItem.name}\nto heal 15 HP?`, xPos + itemBoxWidth/2, yOffset + itemBoxHeight/2);
    } 
    else {
      // Draw item list
      const itemSpacing = 60;
      const startY = yOffset + 30;

      this.items.forEach((item, index) => {
        const currentY = startY + index * itemSpacing;
        
        // Draw grey circle with white stroke
        fill(128);
        stroke(255);
        strokeWeight(2);
        const circleSize = 40;
        const circleX = xPos + 50;
        const circleY = currentY;
        
        if (index === this.selectedItemIndex) {
          fill(180);
          strokeWeight(3);
        }
        
        circle(circleX, circleY, circleSize);

        // Draw item image inside the circle
        const itemSize = circleSize * 0.8;
        image(UIImages[item.image], circleX - itemSize/2 - 1, currentY - itemSize/2, itemSize, itemSize);

        // Draw item name text
        textSize(30);
        textFont("DMT Shuei MGo Std Bold");
        textAlign(LEFT, BOTTOM);
        stroke(0);
        strokeWeight(3);
        fill(255);
        if (index === this.selectedItemIndex) {
          fill(51, 102, 255);
        }
        text(item.name, circleX + circleSize/2 + 15, currentY + 15);
      });
    }
  }

  // Handle W and S keys for item selection
  moveItemSelection(direction) {
    if (direction === "up") {
      this.selectedItemIndex = Math.max(0, this.selectedItemIndex - 1);
    } 
    else if (direction === "down") {
      this.selectedItemIndex = Math.min(this.items.length - 1, this.selectedItemIndex + 1);
    }
    sounds.cursorSelection.play();
  }

  // Display game over screen if game is over and no battle is in progress
  displayGameOver() {
    if (isGameOver && gameOverImage && (!battleManager.state || !battleManager.state.isPlaying)) {
      // Add dark tint to the background with fade
      fill(0, 0, 0, this.gameOverAlpha * 0.4); // 40% of the alpha for background
      noStroke();
      rect(0, 0, width, height);
      
      // Display the game over image centered with fade
      imageMode(CENTER);
      tint(255, this.gameOverAlpha);
      image(gameOverImage, width/2, height/2);
      noTint();
      imageMode(CORNER);

      // Increase alpha smoothly
      if (this.gameOverAlpha < 255) {
        this.gameOverAlpha += 10;
      }
    }
  }
}

// BattleManager class: Handles all battle animations and effects
class BattleManager {
  constructor() {
    // Initialize battle state object to track various animation states and timings
    this.state = {
      // Core battle state
      isPlaying: false, // Whether a battle animation is currently playing
      currentPhase: "prepare",  // Current phase of the battle animation (prepare, playerAttack, enemyAttack, etc)
      startTime: 0, // Timestamp when the current phase started
      lastFrame: -1,  // Last animation frame that was displayed
      
      // Combat outcome calculations
      willPlayerCrit: false, // Whether player's attack will be a critical hit
      willEnemyCrit: false, // Whether enemy's attack will be a critical hit
      willPlayerHit: false, // Whether player's attack will land
      willEnemyHit: false,  // Whether enemy's attack will land
      
      // Double attack flags based on speed differences
      hasPlayerDouble: false, // Whether player is fast enough to attack twice
      hasEnemyDouble: false,  // Whether enemy is fast enough to attack twice
      
      // Hit and Crit calculations for potential second attacks
      willPlayerSecondCrit: null, // Whether player's second attack will crit
      willEnemySecondCrit: null,  // Whether enemy's second attack will crit
      willPlayerSecondHit: null,  // Whether player's second attack will hit
      willEnemySecondHit: null, // Whether enemy's second attack will hit
      
      // Animation state tracking for dodge animations
      playerDodgePlayed: false, // Whether player's dodge animation has played
      enemyDodgePlayed: false,  // Whether enemy's dodge animation has played
      playerSecondDodgePlayed: false, // Whether player's second dodge animation has played
      enemySecondDodgePlayed: false,  // Whether enemy's second dodge animation has played
      
      // Timing variables for various effects
      dodgeStartTime: 0,  // When dodge animation started
      missTextStartTime: 0, // When "MISS" text started displaying
      critTextStartTime: 0, // When "CRITICAL" text started displaying
      hitEffectStartTime: 0,  // When hit effect animation started
      
      // Hit effect animation states
      hitEffectPlayed: false, // Whether hit effect animation has played
      hitEffectStarted: false,  // Whether hit effect animation has started
      hitEffectFrame: -1, // Current frame of hit effect animation
      whiteFlashFrame: 0, // Frame counter for white flash effect on critical hits
      
      // Special effects for magic attacks
      fireEffectStarted: false, // Whether fire effect has started (for magic attacks)
      fireEffectPlayed: false, // Whether fire effect has completed
      
      // Track character to be removed after battle
      characterToRemove: null,

      // Add new flag for death handling
      willTransitionToConclude: false,

      // Track if critical voice line has been played
      critVoicePlayed: false,

      // Track if kill voice line has been played
      killVoicePlayed: false,

      // Track if death voice line has been played
      deathVoicePlayed: false,
    };
  }
  // Display "MISS" text when an attack doesn't land
  showMissText(isEnemyAttacking, now) {
    // Initialize the start time if this is the first frame
    if (this.state.missTextStartTime === 0) {
      this.state.missTextStartTime = now;
    }
    
    // Show the miss text for 400ms (0.4 seconds)
    if (now - this.state.missTextStartTime <= 400) {
      // Position the text differently based on who is attacking
      const missX = isEnemyAttacking ? width * 0.3 : width * 0.57;  // Left side for enemy attacks, right side for player
      const missY = height * 0.4;  // 40% down from the top of the screen
      image(UIImages.missText, missX, missY);
    }
  }

  // Display "CRITICAL" text for critical hits
  showCritText(isEnemyAttacking, now, attackerName, defenderName) {
    // Convert names to lowercase for key lookup
    const key = `${attackerName.toLowerCase()}_${defenderName.toLowerCase()}`;
    
    // Map of delay timings for each possible attacker-defender combination
    const critDelayMap = {
      'roy_fighter': 1850,  // Roy attacking Fighter
      'roy_brigand': 1850,  // Roy attacking Brigand 

      'bors_fighter': 1425, // Bors attacking Fighter
      'bors_brigand': 1425, // Bors attacking Brigand

      'allen_fighter': 2250,  // Allen attacking Fighter
      'allen_brigand': 2250,  // Allen attacking Brigand

      'lance_fighter': 1350,  // Lance attacking Fighter
      'lance_brigand': 1350,  // Lance attacking Brigand

      'wolt_fighter': 2750, // Wolt attacking Fighter
      'wolt_brigand': 2750, // Wolt attacking Brigand 
      
      'lugh_fighter': 2100, // Lugh attacking Fighter
      'lugh_brigand': 2100, // Lugh attacking Brigand
      
      'fighter_roy': 900, // Fighter attacking Roy
      'fighter_bors': 650,  // Fighter attacking Bors
      'fighter_allen': 775, // Fighter attacking Allen
      'fighter_lance': 775, // Fighter attacking Lance
      'fighter_wolt': 925,  // Fighter attacking Wolt
      'fighter_lugh': 800, // Fighter attacking Lugh

      'brigand_roy': 2050, // Brigand attacking Roy
      'brigand_bors': 1975,  // Brigand attacking Bors
      'brigand_allen': 2075, // Brigand attacking Allen
      'brigand_lance': 2075, // Brigand attacking Lance
      'brigand_wolt': 2050,  // Brigand attacking Wolt
      'brigand_lugh': 2000 // Brigand attacking Lugh
    };

    // Get the appropriate delay for this combination
    const critDelay = critDelayMap[key];

    // Initialize the start time if this is the first frame
    if (this.state.critTextStartTime === 0) {
      this.state.critTextStartTime = now;
    }
    
    // Calculate how long the text has been showing
    const timeSinceStart = now - this.state.critTextStartTime;
    
    // Different voice line delays for different characters
    let voiceLineDelay = 600; // Default delay

    const attackerLower = attackerName.toLowerCase();
    if (attackerLower === 'lugh') {
      voiceLineDelay = 1800;
    } 
    else if (attackerLower === 'allen' || attackerLower === 'lance' ||  attackerLower === 'bors' || attackerLower === 'wolt') {
      voiceLineDelay = 1100;
    }
    
    // Play critical voice line before the crit text appears
    if (timeSinceStart >= critDelay - voiceLineDelay && !this.state.critVoicePlayed) {
      if (!isEnemyAttacking) {
        const attackerBaseName = attackerName.toLowerCase();
        const criticalVoiceLine = sounds[attackerBaseName + "Critical"];
        if (criticalVoiceLine) {
          criticalVoiceLine.setVolume(2.0); // Increase volume
          criticalVoiceLine.play();
        }
      }
      // Set critVoicePlayed to true when the voice line is played so it doesn't play again
      this.state.critVoicePlayed = true;
    }
    
    // Show the critical text for 400ms after the appropriate delay
    if (timeSinceStart >= critDelay && timeSinceStart <= critDelay + 400) {
      // Position the text differently based on who is attacking
      const critX = isEnemyAttacking ? width * 0.26 : width * 0.52;  // Left side for enemy, right for player
      const critY = height * 0.4;  // 40% down from the top

      // Scale the critical text to 70% of its original size
      const critWidth = UIImages.criticalText.width * 0.7;
      const critHeight = UIImages.criticalText.height * 0.7;
      image(UIImages.criticalText, critX, critY, critWidth, critHeight);
    }
  }

  // Get the appropriate delay before showing a dodge animation based on the attacker/defender combo
  getDodgeDelay(attackerName, defenderName, isCrit = false) {
    // Create a unique key combining attacker and defender names
    const key = `${attackerName.toLowerCase()}_${defenderName.toLowerCase()}`;
    
    // Map of delay timings for each attacker-defender combination
    // Different delays for critical hits vs normal attacks
    const dodgeDelayMap = {
      'roy_fighter': isCrit ? 1850 : 700, // Roy attacking Fighter
      'roy_brigand': isCrit ? 1900 : 700, // Roy attacking Brigand

      'bors_fighter': isCrit ? 1425 : 1475, // Bors attacking Fighter
      'bors_brigand': isCrit ? 1425 : 1425, // Bors attacking Brigand 

      'allen_fighter': isCrit ? 2250 : 800, // Allen attacking Fighter
      'allen_brigand': isCrit ? 2390 : 910, // Allen attacking Brigand

      'lance_fighter': isCrit ? 1350 : 850, // Lance attacking Fighter
      'lance_brigand': isCrit ? 1460 : 875, // Lance attacking Brigand

      'wolt_fighter': isCrit? 2750 : 1400,  // Wolt attacking Fighter
      'wolt_brigand': isCrit? 2750 : 1375,  // Wolt attacking Brigand

      'lugh_fighter': isCrit? 1850 : 1500,  // Lugh attacking Fighter
      'lugh_brigand': isCrit? 1675 : 1400,  // Lugh attacking Brigand

      'fighter_roy': isCrit ? 900 : 1000, // Fighter attacking Roy
      'fighter_bors': isCrit ? 650 : 825, // Fighter attacking Bors
      'fighter_allen': isCrit ? 775 : 950,  // Fighter attacking Allen
      'fighter_lance': isCrit ? 775 : 1000, // Fighter attacking Lance
      'fighter_wolt': isCrit ? 925 : 1000,  // Fighter attacking Wolt
      'fighter_lugh': isCrit ? 800 : 900, // Fighter attacking Lugh

      'brigand_roy': isCrit ? 2150 : 1100,  // Brigand attacking Roy
      'brigand_bors': isCrit ? 2050 : 950,  // Brigand attacking Bors
      'brigand_allen': isCrit ? 2080 : 975, // Brigand attacking Allen
      'brigand_lance': isCrit ? 2080 : 975, // Brigand attacking Lance
      'brigand_wolt': isCrit ? 2250 : 1125, // Brigand attacking Wolt
      'brigand_lugh': isCrit ? 2100 : 1000  // Brigand attacking Lugh
    };
    // Return the appropriate delay
    return dodgeDelayMap[key];
  }

  // Handle the dodge animation when a character avoids an attack
  handleDodgeAnimation(dodgerName, dodgerX, dodgerY, width, height, now, attacker, defender, isSecondDodge = false) {
    // Get the dodge animation for the character
    const dodgeAnim = attackingAnimationPaths[dodgerName + "Dodge"];
    
    if (dodgeAnim) {
      // Initialize the dodge start time if this is the first frame
      if (this.state.dodgeStartTime === 0) {
        this.state.dodgeStartTime = now;
      }
      
      // Determine if this dodge is in response to a critical hit
      const isCrit = isSecondDodge ? 
        // For second attacks, check second crit flags
        attacker.isEnemy ? this.state.willEnemySecondCrit : this.state.willPlayerSecondCrit :
        // For first attacks, check first crit flags
        attacker.isEnemy ? this.state.willEnemyCrit : this.state.willPlayerCrit;
      
      // Get the proper keys for timing lookup based on attacker/defender character
      const attackerKey = attacker.isEnemy ? attacker.classType : attacker.name;
      const defenderKey = defender.isEnemy ? defender.classType : defender.name;
      
      // Get the appropriate delay before showing the dodge animation
      const dodgeDelay = this.getDodgeDelay(attackerKey, defenderKey, isCrit);
      
      // Once we've waited for the delay, show the dodge animation
      if (now - this.state.dodgeStartTime >= dodgeDelay) {
        // Determine which dodge flag to check/set based on who is dodging and if it's a second attack
        const dodgeFlag = isSecondDodge ? 
          dodgerName.includes("enemy") ? "enemySecondDodgePlayed" : "playerSecondDodgePlayed" :
          dodgerName.includes("enemy") ? "enemyDodgePlayed" : "playerDodgePlayed";

        // If we haven't played this dodge animation yet
        if (!this.state[dodgeFlag]) {
          // Reset and start the dodge animation
          dodgeAnim.reset();
          dodgeAnim.play();
          // Mark this dodge as played and reset miss text timing
          this.state[dodgeFlag] = true;
          this.state.missTextStartTime = 0;
          // Play miss sound effect
          sounds.miss.play();
        }
        
        // Draw the dodge animation at the specified position
        image(dodgeAnim, dodgerX, dodgerY, width, height);

        // Show the "MISS" text along with the dodge
        if (UIImages.missText) {
          this.showMissText(attacker.isEnemy, now);
        }

        // If we've reached the last frame, pause the animation
        if (dodgeAnim.getCurrentFrame() === dodgeAnim.numFrames() - 1) {
          dodgeAnim.pause();
        }
      } 
      else {
        // While waiting for dodge timing, show standing animation
        image(attackingAnimationPaths[dodgerName + "Standing"], dodgerX, dodgerY, width, height);
      }
    }
  }

  // Handle the timing of hit effects during an attack
  handleHitTiming(attackerName, isSecondAttack, currentFrame, isCrit, width, height, selectedCharacter, targetEnemy) {
    // Get current time
    const now = millis();
    
    // Check if this is an enemy attack based on attacker name
    const isEnemyAttacking = attackerName.includes("fighter") || attackerName.includes("brigand");
    
    // Get the appropriate hit flag based on attacker type and whether this is a second attack
    const willHit = isEnemyAttacking ? 
      isSecondAttack ? this.state.willEnemySecondHit : this.state.willEnemyHit : 
      isSecondAttack ? this.state.willPlayerSecondHit : this.state.willPlayerHit;
    
    // Get the appropriate delay before showing hit effect
    const hitDelay = this.getHitDelay(attackerName, isCrit);
    // Hit effects last 500ms
    const hitEffectDuration = 500;

    // Special handling for Lugh's fire magic attack
    if (!isEnemyAttacking && attackerName === "lugh" && currentFrame > 0 && !this.state.fireEffectPlayed) {
      // Initialize hit effect timing if not already set
      if (this.state.hitEffectStartTime === 0) {
        this.state.hitEffectStartTime = now;
      }

      // After appropriate delay, show fire effect
      if (now - this.state.hitEffectStartTime >= hitDelay) {
        // Start fire effect animation if not already started
        if (!this.state.fireEffectStarted) {
          UIImages.fireHitEffect.reset();
          UIImages.fireHitEffect.play();
          this.state.fireEffectStarted = true;
        }
        // Position and display fire effect
        const xPos = 50;
        const yPos = 85;
        image(UIImages.fireHitEffect, xPos-120, yPos, width, height);

        // Check if fire effect has completed one full cycle
        if (UIImages.fireHitEffect.getCurrentFrame() === UIImages.fireHitEffect.numFrames() - 1) {
          UIImages.fireHitEffect.pause();
          this.state.fireEffectPlayed = true;
        }
      }
    }

    // Handle regular hit effects if attack will hit and hasn't been played yet
    if (willHit && !this.state.hitEffectPlayed && currentFrame > 0) {
      // Initialize hit effect timing if not already set
      if (this.state.hitEffectStartTime === 0) {
        this.state.hitEffectStartTime = now;
      }

      // After appropriate delay plus small buffer, show hit effect
      if (now - this.state.hitEffectStartTime >= hitDelay + 50) {
        this.handleHitEffect(now, isEnemyAttacking, isCrit, hitDelay, hitEffectDuration, width, height, selectedCharacter, targetEnemy, isSecondAttack);
      }
    }
  }

  // Get the appropriate delay before showing hit effect based on attacker and if it's a critical hit
  getHitDelay(attackerName, isCrit = false) {
    // Convert character name to lowercase 
    let baseName = attackerName.toLowerCase();
    if (baseName.includes('fighter')) {
      baseName = 'fighter';
    } 
    else if (baseName.includes('brigand')) {
      baseName = 'brigand';
    }

    // Map of hit delays for each character, with different timings for critical hits
    const hitDelayMap = {
      'roy': isCrit ? 1350 : 265, // Roy's attack timing
      'bors': isCrit ? 1300 : 850,  // Bors's attack timing
      'allen': isCrit ? 2200 : 350, // Allen's attack timing
      'lance': isCrit ? 1150 : 400, // Lance's attack timing
      'wolt': isCrit ? 2275 : 800,  // Wolt's attack timing
      'lugh': isCrit ? 1800 : 1000, // Lugh's attack timing
      'fighter': isCrit ? 850 : 490, // Fighter's attack timing
      'brigand': isCrit ? 1600 : 490 // Brigand's attack timing
    };
    
    // Return the character's specific delay timing
    return hitDelayMap[baseName];
  }

  // Handle the visual hit effect when an attack lands
  handleHitEffect(now, isEnemyAttacking, isCrit, hitDelay, hitEffectDuration, width, height, selectedCharacter, targetEnemy, isSecondAttack = false) {
    // Choose the appropriate hit effect based on attacker and if it's a critical hit
    const hitEffect = isEnemyAttacking ? 
      isCrit ? UIImages.criticalHitEffectLeft : UIImages.regularHitEffectLeft :   // Enemy attacks come from left
      isCrit ? UIImages.criticalHitEffectRight : UIImages.regularHitEffectRight;  // Player attacks come from right
    
    // Get attacker and defender names for positioning
    const attackerKey = isEnemyAttacking ? selectedCharacter.classType.toLowerCase() : selectedCharacter.name.toLowerCase();
    const defenderKey = isEnemyAttacking ? targetEnemy.name.toLowerCase() : targetEnemy.classType.toLowerCase();
    const comboKey = `${attackerKey}_${defenderKey}`;

    // Helper function to normalize enemy type (treats Fighter and Brigand as same)
    const normalizeEnemyType = (type) => {
      return type.toLowerCase().includes('fighter') || type.toLowerCase().includes('brigand') ? 'enemy' : type.toLowerCase();
    };

    // Create lookup key using normalized enemy type
    const lookupKey = `${normalizeEnemyType(attackerKey)}_${normalizeEnemyType(defenderKey)}`;

    // Map of x-positions for hit effects based on attacker-defender combinations
    const hitEffectXPositions = {
      'roy_enemy': 50,    // Roy attacking Fighter/Brigand
      'bors_enemy': 50,   // Bors attacking Fighter/Brigand
      'allen_enemy': 50,  // Allen attacking Fighter/Brigand
      'lance_enemy': 50,  // Lance attacking Fighter/Brigand
      'wolt_enemy': 44,   // Wolt attacking Fighter/Brigand
      'lugh_enemy': 50,   // Lugh attacking Fighter/Brigand
      'enemy_roy': 77,    // Fighter/Brigand attacking Roy
      'enemy_bors': 72,   // Fighter/Brigand attacking Bors
      'enemy_allen': 90,  // Fighter/Brigand attacking Allen
      'enemy_lance': 90,  // Fighter/Brigand attacking Lance
      'enemy_wolt': 90,   // Fighter/Brigand attacking Wolt
      'enemy_lugh': 85    // Fighter/Brigand attacking Lugh
    };

    // Map of y-positions for hit effects based on attacker-defender combinations
    const hitEffectYPositions = {
      'roy_enemy': 60,    // Roy attacking Fighter/Brigand
      'bors_enemy': 107,  // Bors attacking Fighter/Brigand
      'allen_enemy': 80,  // Allen attacking Fighter/Brigand
      'lance_enemy': 70,  // Lance attacking Fighter/Brigand
      'wolt_enemy': 84,   // Wolt attacking Fighter/Brigand
      'lugh_enemy': 85,   // Lugh attacking Fighter/Brigand
      'enemy_roy': 50,    // Fighter/Brigand attacking Roy
      'enemy_bors': 33,   // Fighter/Brigand attacking Bors
      'enemy_allen': 26,  // Fighter/Brigand attacking Allen
      'enemy_lance': 26,  // Fighter/Brigand attacking Lance
      'enemy_wolt': 50,   // Fighter/Brigand attacking Wolt
      'enemy_lugh': 50    // Fighter/Brigand attacking Lugh
    };

    // Get the appropriate x and y positions for this combination
    const xPos = hitEffectXPositions[lookupKey];
    const yPos = hitEffectYPositions[lookupKey];
    
    // If this is the first frame of the hit effect
    if (!this.state.hitEffectStarted) {
      if (hitEffect) {
        // Reset and start the hit effect animation
        hitEffect.reset();
        hitEffect.play();
        this.state.hitEffectStarted = true;
        this.state.whiteFlashFrame = 0;  // Reset white flash counter

        // Get hit/miss and critical hit flags based on attacker type and whether this is a second attack
        const willHit = isEnemyAttacking ? 
          isSecondAttack ? this.state.willEnemySecondHit : this.state.willEnemyHit : 
          isSecondAttack ? this.state.willPlayerSecondHit : this.state.willPlayerHit;

        const willCrit = isEnemyAttacking ? 
          isSecondAttack ? this.state.willEnemySecondCrit : this.state.willEnemyCrit : 
          isSecondAttack ? this.state.willPlayerSecondCrit : this.state.willPlayerCrit;

        // Only apply damage if the attack successfully hits (not dodged/missed)
        if (willHit) {
          // Play hit sound effect
          if (willCrit) {
            sounds.crit.play();
          } 
          else {
            sounds.hit.play();
          }

          // selectedCharacter is always the attacker (whether player or enemy)
          const attacker = selectedCharacter;

          // targetEnemy is always the defender (whether player or enemy)
          const defender = targetEnemy;
          
          // Get base damage
          let damage = attacker.displayedDamage;

          // Check if it's a double attack
          const isDoubleAttack = isEnemyAttacking ? this.state.hasEnemyDouble : this.state.hasPlayerDouble;

          // For double attacks, always divide damage by 2 since each hit should do half damage
          if (isDoubleAttack) {
            damage = Math.floor(damage / 2);
          }

          // For critical hits, triple the damage
          if (willCrit) {
            damage *= 3;
          }
          
          // Apply the calculated damage to the defender's HP
          defender.takeDamage(damage);

          // Check if the defender died from this hit
          if (defender.isDead()) {
            this.handleCharacterDeath(defender, attacker);
          }
        }
        // If willHit is false, no damage is dealt (attack was dodged/missed)
      }
    }

    if (hitEffect) {
      const currentHitFrame = hitEffect.getCurrentFrame();
      if (currentHitFrame < hitEffect.numFrames() - 1) {
        // Show white flash effect for first 5 frames
        if (this.state.whiteFlashFrame < 5) {
          fill(255);
          noStroke();
          rect(0, 0, width, height);
          this.state.whiteFlashFrame++;
        }
        else {
          // For critical hits, show a different effect
          if (isCrit) {
            if (!isEnemyAttacking) {
              image(hitEffect, -500, -150, width * 2, height * 2);  // Right side crit effect
            } 
            else {
              image(hitEffect, -350, -150, width * 2, height * 2);  // Left side crit effect
            }
          }
          else {
            // Normal hit effect at calculated position
            image(hitEffect, xPos, yPos, width, height);
          }
        }
      }
    }

    // If hit effect has played for its duration, mark it as complete
    if (now - this.state.hitEffectStartTime >= hitDelay + hitEffectDuration) {
      this.state.hitEffectPlayed = true;
      if (hitEffect) {
        hitEffect.pause();
      }
    }
  }

  // Display standing animations for both characters during non-action moments
  showStandingAnimations(attackerName, enemyName, positions, dimensions) {
    // Show attacker's standing animation
    image(attackingAnimationPaths[attackerName + "Standing"], 
      positions.attackerX, positions.attackerY, 
      dimensions.attackerWidth, dimensions.attackerHeight);
    
    // Show defender's standing animation
    image(attackingAnimationPaths[enemyName + "Standing"], 
      positions.enemyX, positions.enemyY, 
      dimensions.enemyWidth, dimensions.enemyHeight);
  }

  // Handle the main attack animation sequence for a character
  handleAttackAnimation(attackerName, attackerX, attackerY, width, height, isCrit, isSecondAttack = false, selectedCharacter, targetEnemy) {
    // Determine which attack animation to use (critical or normal)
    const attackType = isCrit ? "Critical" : "Attack";
    // Get the appropriate attack animation
    const attackAnim = attackingAnimationPaths[attackerName + attackType];
    // Get current frame and total frames of the animation
    const currentFrame = attackAnim.getCurrentFrame();
    const totalFrames = attackAnim.numFrames();  
    
    // Display the attack animation at the specified position
    image(attackAnim, attackerX, attackerY, width, height);

    // Handle hit effects timing based on current frame
    this.handleHitTiming(attackerName, isSecondAttack, currentFrame, isCrit, width, height, selectedCharacter, targetEnemy);
    
    // Return animation state for phase management
    return {
      currentFrame, // Current frame number
      totalFrames,  // Total number of frames
      isComplete: currentFrame === totalFrames - 1  // Whether animation has finished
    };
  }

  // Main method for managing the entire battle animation sequence
  handleBattleAnimation(selectedCharacter, targetEnemy) {
    // Initialize battle state if this is the first frame
    if (!this.state.isPlaying) {
      this.initializeBattleState(selectedCharacter, targetEnemy);
    }

    // Get current time and calculate duration of current phase
    const now = millis();
    const timeSinceStart = now - this.state.startTime;

    // Calculate positions for characters based on their type
    const positions = {
      // Adjust attacker X position based on character type
      attackerX: selectedCharacter.name.toLowerCase() === "bors" 
        ? width * 0.1  // Bors position
        : ["roy", "wolt", "lugh"].includes(selectedCharacter.name.toLowerCase()) 
          ? width * 0.045  // Roy, Wolt, and Lugh's position
          : width * 0.02,  // Default position
      
      attackerY: height * 0.01 - 50,  // Attacker Y position
      enemyX: width * 0.08,           // Enemy X position
      enemyY: height * 0.01 - 50      // Enemy Y position
    };

    // Set dimensions for character sprites
    const dimensions = {
      attackerWidth: width,           // Full width for attacker
      attackerHeight: height * 0.7,   // 70% of height for attacker
      enemyWidth: width,              // Full width for enemy
      enemyHeight: height * 0.7       // 70% of height for enemy
    };

    // Get normalized names for animation lookups
    const attackerName = selectedCharacter.name.toLowerCase();
    const enemyClass = targetEnemy.classType.toLowerCase();

    // Handle different phases of the battle animation
    if (this.state.currentPhase === "prepare") {
      // Initial preparation phase - show standing animations
      this.handlePreparePhase(attackerName, enemyClass, positions, dimensions, timeSinceStart, now);
    }
    else if (this.state.currentPhase === "playerAttack") {
      // Player's attack phase
      this.handleAttackPhase(attackerName, enemyClass, positions, dimensions, now, selectedCharacter, targetEnemy, false);
    }
    else if (this.state.currentPhase === "transitionToEnemy") {
      // Transition phase between player and enemy attacks
      this.handleTransitionToEnemyPhase(attackerName, enemyClass, positions, dimensions, timeSinceStart, selectedCharacter, targetEnemy, now);
    }
    else if (this.state.currentPhase === "transitionToPlayer") {
      // Transition phase between enemy and player attacks
      this.handleTransitionToPlayerPhase(attackerName, enemyClass, positions, dimensions, timeSinceStart, selectedCharacter, targetEnemy, now);
    }
    else if (this.state.currentPhase === "enemyAttack") {
      // Enemy's attack phase
      this.handleAttackPhase(enemyClass, attackerName, positions, dimensions, now, targetEnemy, selectedCharacter, true);
    }
    else if (this.state.currentPhase === "checkDoubles") {
      // Check if either character gets a second attack
      this.handleCheckDoublesPhase(attackerName, enemyClass, positions, dimensions, timeSinceStart, selectedCharacter, targetEnemy, now);
    }
    else if (this.state.currentPhase === "playerDouble") {
      // Player's second attack phase
      this.handleDoublePhase(attackerName, enemyClass, positions, dimensions, now, selectedCharacter, targetEnemy, false);
    }
    else if (this.state.currentPhase === "enemyDouble") {
      // Enemy's second attack phase
      this.handleDoublePhase(enemyClass, attackerName, positions, dimensions, now, targetEnemy, selectedCharacter, true);
    }
    else if (this.state.currentPhase === "conclude") {
      // Conclude the battle animation
      this.handleConcludePhase(attackerName, enemyClass, positions, dimensions, timeSinceStart, selectedCharacter);
    }
  }

  // Sets up the initial state for a battle sequence between two characters
  initializeBattleState(selectedCharacter, targetEnemy) {
    this.state = {
      // Core battle state
      isPlaying: true, // Indicates if battle animation is currently active
      currentPhase: "prepare",  // Starting phase of battle sequence
      startTime: millis(),  // Timestamp when battle begins
      lastFrame: -1,  // Tracks the last animation frame processed

      // Combat outcome calculations
      willPlayerCrit: random(100) < selectedCharacter.displayedCrit,  // Determines if player lands a critical hit
      willEnemyCrit: random(100) < targetEnemy.displayedCrit, // Determines if enemy lands a critical hit
      willPlayerHit: random(100) < selectedCharacter.displayedHit,  // Determines if player's attack connects
      willEnemyHit: random(100) < targetEnemy.displayedHit, // Determines if enemy's attack connects

      // Double attack checks (speed difference of 4 or more enables double attacks)
      hasPlayerDouble: selectedCharacter.speed - targetEnemy.speed >= 4,  // Can player attack twice
      hasEnemyDouble: targetEnemy.speed - selectedCharacter.speed >= 4, // Can enemy attack twice

      // Second attack outcomes (initialized as null, set later if doubles occur)
      willPlayerSecondCrit: null, // Critical hit check for player's second attack
      willEnemySecondCrit: null,  // Critical hit check for enemy's second attack
      willPlayerSecondHit: null,  // Hit check for player's second attack
      willEnemySecondHit: null, // Hit check for enemy's second attack

      // Animation state tracking
      playerDodgePlayed: false, // Has player's dodge animation been shown
      playerDodgePlayed: false, // Has player's dodge animation been shown
      enemyDodgePlayed: false,  // Has enemy's dodge animation been shown
      playerSecondDodgePlayed: false, // Has player's second dodge been shown
      enemySecondDodgePlayed: false,// Has enemy's second dodge been shown
      dodgeStartTime: 0,  // Timestamp when dodge animation begins
      missTextStartTime: 0, // Timestamp when "MISS" text appears
      critTextStartTime: 0, // Timestamp when "CRITICAL" text appears
      
      // Hit effect states
      hitEffectStartTime: 0,  // Timestamp when hit effect begins
      hitEffectPlayed: false, // Has the hit effect animation completed
      hitEffectStarted: false,  // Has the hit effect begun playing
      hitEffectFrame: -1, // Current frame of hit effect animation
      whiteFlashFrame: 0, // Frame counter for impact flash effect
      
      // Special effect states
      fireEffectStarted: false, // Has fire magic effect started (for Lugh)
      fireEffectPlayed: false, // Has fire magic effect completed
      
      // Track character to be removed after battle
      characterToRemove: null,

      // Add new flag for death handling
      willTransitionToConclude: false,

      // Track if critical voice line has been played
      critVoicePlayed: false,

      // Track if kill voice line has been played
      killVoicePlayed: false,

      // Track if death voice line has been played
      deathVoicePlayed: false,
    };
  }

  // Handles the initial preparation phase of the battle animation
  handlePreparePhase(attackerName, enemyClass, positions, dimensions, timeSinceStart, now) {
    // Display both characters in their standing positions
    this.showStandingAnimations(attackerName, enemyClass, positions, dimensions);
    
    // After 500ms, transition to the appropriate attack phase
    if (timeSinceStart > 500) {
      // Transition to enemyAttack if enemy initiated, otherwise playerAttack
      const nextPhase = isEnemyInitiated ? "enemyAttack" : "playerAttack";
      this.state.currentPhase = nextPhase;
      this.state.startTime = now;
      this.state.lastFrame = -1;
      
      // Determine attack type (critical or normal) and prepare animation
      const attackType = isEnemyInitiated ? this.state.willEnemyCrit ? "Critical" : "Attack" : this.state.willPlayerCrit ? "Critical" : "Attack";
            
      // For enemy-initiated battles, use the enemy class name for the animation
      const animationName = isEnemyInitiated ? enemyClass + attackType : attackerName + attackType;
            
      const nextAnim = attackingAnimationPaths[animationName];
      
      // Reset and start the attack animation if it exists
      if (nextAnim) {
        nextAnim.reset();
        nextAnim.play();
      }
    }
  }

  handleAttackPhase(attackerName, defenderName, positions, dimensions, now, attacker, defender, isEnemyAttacking) {
    // Get the appropriate hit and crit flags based on who is attacking
    const willHit = isEnemyAttacking ? this.state.willEnemyHit : this.state.willPlayerHit;
    const willCrit = isEnemyAttacking ? this.state.willEnemyCrit : this.state.willPlayerCrit;

    // If the attack will miss, show dodge animation for the defender
    if (!willHit) {
      this.handleDodgeAnimation(
        defenderName,
        isEnemyAttacking ? positions.attackerX : positions.enemyX,
        isEnemyAttacking ? positions.attackerY : positions.enemyY,
        isEnemyAttacking ? dimensions.attackerWidth : dimensions.enemyWidth,
        isEnemyAttacking ? dimensions.attackerHeight : dimensions.enemyHeight,
        now,
        attacker,
        defender
      );
    }
    // If the attack will hit, show defender standing and potentially critical text
    else {
      // Display defender in standing position
      image(
        attackingAnimationPaths[defenderName + "Standing"],
        isEnemyAttacking ? positions.attackerX : positions.enemyX,
        isEnemyAttacking ? positions.attackerY : positions.enemyY,
        isEnemyAttacking ? dimensions.attackerWidth : dimensions.enemyWidth,
        isEnemyAttacking ? dimensions.attackerHeight : dimensions.enemyHeight
      );

      // Show critical text if this will be a critical hit
      if (willCrit && UIImages.criticalText) {
        this.showCritText(isEnemyAttacking, now, attackerName, defenderName);
      }
    }

    // Handle the attack animation and get its state
    const animState = this.handleAttackAnimation(
      attackerName,
      isEnemyAttacking ? positions.enemyX : positions.attackerX,
      isEnemyAttacking ? positions.enemyY : positions.attackerY,
      isEnemyAttacking ? dimensions.enemyWidth : dimensions.attackerWidth,
      isEnemyAttacking ? dimensions.enemyHeight : dimensions.attackerHeight,
      willCrit,
      false,  // This is not a second attack
      attacker,
      defender
    );

    // If attack animation is complete, transition to next phase
    if (animState.isComplete) {
      // If a character died and we need to conclude
      if (this.state.willTransitionToConclude) {
        this.state.currentPhase = "conclude";
      } 
      else {
        const currentPhase = this.state.currentPhase;
        let nextPhase;

        if (isEnemyInitiated) {
          // Enemy initiated battle sequence:
          // enemyAttack -> transitionToPlayer -> playerAttack -> checkDoubles -> conclude
          if (this.state.currentPhase === "enemyAttack") {
            nextPhase = "transitionToPlayer";
          } 
          else if (this.state.currentPhase === "playerAttack") {
            nextPhase = "checkDoubles";
          }
        } 
        else {
          // Player initiated battle sequence:
          // playerAttack -> transitionToEnemy -> enemyAttack -> checkDoubles -> conclude
          if (this.state.currentPhase === "playerAttack") {
            nextPhase = "transitionToEnemy";
          } 
          else if (this.state.currentPhase === "enemyAttack") {
            nextPhase = "checkDoubles";
          }
        }

        if (nextPhase) {
          this.state.currentPhase = nextPhase;
        }
      }
      this.state.startTime = now;
      this.state.lastFrame = -1;
      this.state.missTextStartTime = 0;
      this.state.critTextStartTime = 0;
      this.state.dodgeStartTime = 0;
    }

    // Update the last frame for animation tracking
    this.state.lastFrame = animState.currentFrame;
  }

  // Handles the transition phase between enemy's attack and player's counter-attack
  handleTransitionToPlayerPhase(attackerName, enemyClass, positions, dimensions, timeSinceStart, now) {
    // Show both characters in their standing positions during transition
    this.showStandingAnimations(attackerName, enemyClass, positions, dimensions);
    
    // Wait for 100 ms before proceeding
    if (timeSinceStart > 100) {
      // Reset hit effect state variables for player attack
      this.state.hitEffectStartTime = 0;
      this.state.hitEffectPlayed = false;
      this.state.hitEffectStarted = false;
      
      // Prepare for player attack phase
      this.state.currentPhase = "playerAttack";
      this.state.startTime = now;
      this.state.lastFrame = -1;
      
      // Set up player attack animation based on critical hit status
      const playerAttackType = this.state.willPlayerCrit ? "Critical" : "Attack";
      const playerAnim = attackingAnimationPaths[attackerName + playerAttackType];
      if (playerAnim) {
        playerAnim.reset();
        playerAnim.play();
      }
    }
  }

  // Handles the transition phase between player's attack and enemy's counter-attack
  handleTransitionToEnemyPhase(attackerName, enemyClass, positions, dimensions, timeSinceStart, selectedCharacter, targetEnemy, now) {
    // Show both characters in their standing positions during transition
    this.showStandingAnimations(attackerName, enemyClass, positions, dimensions);
    
    // Wait for 100 ms before proceeding
    if (timeSinceStart > 100) {
      // Calculate the Manhattan distance between attacker and defender
      const distance = Math.abs(selectedCharacter.x - targetEnemy.x) + Math.abs(selectedCharacter.y - targetEnemy.y);
      
      // Check if enemy can counter-attack based on distance and class type
      // Melee units (non-Archer, non-Mage) can only counter at distance 2
      if (distance === 2 && targetEnemy.classType !== "Archer" && targetEnemy.classType !== "Mage") {
        // Skip enemy attack and check for double attacks
        this.state.currentPhase = "checkDoubles";
        this.state.startTime = now;
        this.state.lastFrame = -1;
      } 
      else {
        // Reset hit effect state variables for enemy attack
        this.state.hitEffectStartTime = 0;
        this.state.hitEffectPlayed = false;
        this.state.hitEffectStarted = false;
        
        // Prepare for enemy attack phase
        this.state.currentPhase = "enemyAttack";
        this.state.startTime = now;
        this.state.lastFrame = -1;
        
        // Set up enemy attack animation based on critical hit status
        const enemyAttackType = this.state.willEnemyCrit ? "Critical" : "Attack";
        const enemyAnim = attackingAnimationPaths[enemyClass + enemyAttackType];
        enemyAnim.reset();
        enemyAnim.play();
      }
    }
  }

  // Handles the phase that checks if either character gets a second attack based on speed difference
  handleCheckDoublesPhase(attackerName, enemyClass, positions, dimensions, timeSinceStart, selectedCharacter, targetEnemy, now) {
    // Show both characters in their standing positions
    this.showStandingAnimations(attackerName, enemyClass, positions, dimensions);
      
    // Reset all hit effect and animation state variables
    this.state.dodgeStartTime = 0;
    this.state.hitEffectStartTime = 0;
    this.state.hitEffectPlayed = false;
    this.state.hitEffectStarted = false;
    this.state.hitEffectFrame = -1;
    
    // Wait for 100ms before checking for double attacks
    if (timeSinceStart > 100) {
      // Calculate speed differences between player and enemy
      const playerSpeedDiff = selectedCharacter.speed - targetEnemy.speed;
      const enemySpeedDiff = targetEnemy.speed - selectedCharacter.speed;
      
      let nextPhase = "conclude";
      
      // If player is significantly faster (speed diff >= 4), they get a second attack
      if (playerSpeedDiff >= 4) {
        nextPhase = "playerDouble";
        // Calculate hit and crit chances for second attack
        this.state.willPlayerSecondHit = random(100) < selectedCharacter.displayedHit;
        this.state.willPlayerSecondCrit = random(100) < selectedCharacter.displayedCrit;
        
        // Prepare the appropriate attack animation
        const playerAttackType = this.state.willPlayerSecondCrit ? "Critical" : "Attack";
        const nextAnim = attackingAnimationPaths[attackerName + playerAttackType];
        if (nextAnim) {
          nextAnim.reset();
          nextAnim.play();
        }
      } 
      // If enemy is significantly faster, they get a second attack
      else if (enemySpeedDiff >= 4) {
        nextPhase = "enemyDouble";
        // Calculate hit and crit chances for second attack
        this.state.willEnemySecondHit = random(100) < targetEnemy.displayedHit;
        this.state.willEnemySecondCrit = random(100) < targetEnemy.displayedCrit;
        
        // Prepare the appropriate attack animation
        const enemyAttackType = this.state.willEnemySecondCrit ? "Critical" : "Attack";
        const nextAnim = attackingAnimationPaths[enemyClass + enemyAttackType];
        if (nextAnim) {
          nextAnim.reset();
          nextAnim.play();
        }
      }

      // Update phase
      this.state.currentPhase = nextPhase;
      // Update timing variables for the next phase
      this.state.startTime = now;
      this.state.lastFrame = -1;
    }
  }

  handleDoublePhase(attackerName, defenderName, positions, dimensions, now, attacker, defender, isEnemyDouble) {
    // Get the appropriate hit and crit flags based on who is doing the double attack
    const willHit = isEnemyDouble ? this.state.willEnemySecondHit : this.state.willPlayerSecondHit;
    const willCrit = isEnemyDouble ? this.state.willEnemySecondCrit : this.state.willPlayerSecondCrit;

    // If the second attack will miss, show dodge animation for the defender
    if (!willHit) {
      this.handleDodgeAnimation(
        defenderName, 
        isEnemyDouble ? positions.attackerX : positions.enemyX, 
        isEnemyDouble ? positions.attackerY : positions.enemyY, 
        isEnemyDouble ? dimensions.attackerWidth : dimensions.enemyWidth, 
        isEnemyDouble ? dimensions.attackerHeight : dimensions.enemyHeight, 
        now, 
        attacker, 
        defender, 
        true  // Indicates this is a second attack
      );
    } 
    // If the attack will hit, show defender standing and potentially critical text
    else {
      // Display defender in standing position
      image(
        attackingAnimationPaths[defenderName + "Standing"], 
        isEnemyDouble ? positions.attackerX : positions.enemyX, 
        isEnemyDouble ? positions.attackerY : positions.enemyY, 
        isEnemyDouble ? dimensions.attackerWidth : dimensions.enemyWidth, 
        isEnemyDouble ? dimensions.attackerHeight : dimensions.enemyHeight
      );
      
      // Show critical text if this will be a critical hit
      if (willCrit) {
        this.showCritText(isEnemyDouble, now, attackerName, defenderName);
      }
    }

    // Handle the attack animation and get its state
    const animState = this.handleAttackAnimation(
      attackerName,
      isEnemyDouble ? positions.enemyX : positions.attackerX,
      isEnemyDouble ? positions.enemyY : positions.attackerY,
      isEnemyDouble ? dimensions.enemyWidth : dimensions.attackerWidth,
      isEnemyDouble ? dimensions.enemyHeight : dimensions.attackerHeight,
      willCrit,
      true,  // This is a second attack
      attacker,
      defender
    );

    // If attack animation is complete, transition to conclude phase
    if (animState.isComplete) {
      this.state.currentPhase = "conclude";
      this.state.startTime = now;
      this.state.lastFrame = -1;
      this.state.missTextStartTime = 0;
      this.state.critTextStartTime = 0;
      this.state.dodgeStartTime = 0;
    }
    
    // Update the last frame for animation tracking
    this.state.lastFrame = animState.currentFrame;
  }

  // Show final battle animations - either standing or death animation
  showFinalBattleAnimations(attackerName, enemyName, positions, dimensions) {
    // Determine which character is dead (if any)
    const isAttackerDead = this.state.characterToRemove && this.state.characterToRemove.name.toLowerCase() === attackerName;
    const isDefenderDead = this.state.characterToRemove && this.state.characterToRemove.classType.toLowerCase() === enemyName;

    // Show attacker's animation (death or standing)
    const attackerAnim = isAttackerDead ? 
      attackingAnimationPaths[attackerName + "Death"] : 
      attackingAnimationPaths[attackerName + "Standing"];
    
    if (attackerAnim) {
      // If it's a death animation and hasn't been started yet, start it
      if (isAttackerDead && attackerAnim.getCurrentFrame() === 0) {
        attackerAnim.play();
        // Play death voice line when player character starts death animation
        if (!this.state.deathVoicePlayed) {
          const deathVoiceLine = sounds[attackerName.toLowerCase() + "Death"];
          if (deathVoiceLine) {
            deathVoiceLine.setVolume(2.0);
            deathVoiceLine.play();
          }
          this.state.deathVoicePlayed = true;
        }
      }
      image(attackerAnim, 
        positions.attackerX, positions.attackerY, 
        dimensions.attackerWidth, dimensions.attackerHeight);
    }

    // Show defender's animation (death or standing)
    const defenderAnim = isDefenderDead ? 
      attackingAnimationPaths[enemyName + "Death"] : 
      attackingAnimationPaths[enemyName + "Standing"];
    
    if (defenderAnim) {
      // If it's a death animation and hasn't been started yet, start it
      if (isDefenderDead && defenderAnim.getCurrentFrame() === 0) {
        defenderAnim.play();
        // Play kill voice line when enemy death animation starts
        if (this.state.characterToRemove && this.state.characterToRemove.isEnemy && !this.state.killVoicePlayed) {
          const attackerBaseName = attackerName.toLowerCase();
          const killVoiceLine = sounds[attackerBaseName + "Kill"];
          if (killVoiceLine) {
            killVoiceLine.setVolume(2.0);
            killVoiceLine.play();
          }
          this.state.killVoicePlayed = true;
        }
      }
      image(defenderAnim,
        positions.enemyX, positions.enemyY,
        dimensions.enemyWidth, dimensions.enemyHeight);
    }
  }

  // Handles the conclusion phase of the battle animation sequence
  handleConcludePhase(attackerName, enemyClass, positions, dimensions, timeSinceStart, selectedCharacter) {
    // Show final animations - either standing or death animation based on battle outcome
    this.showFinalBattleAnimations(attackerName, enemyClass, positions, dimensions);
    
    // Wait for 1.75 second before concluding the battle and resetting battle animation state
    if (timeSinceStart > 1750) {
      // If there's a character marked for removal, play death sound and remove them
      if (this.state.characterToRemove) {
        sounds.death.play();
        const index = characters.findIndex(char => char === this.state.characterToRemove);
        if (index !== -1) {
          characters.splice(index, 1);
        }
      }

      // Reset battle states
      this.state.isPlaying = false;
      this.state.hitEffectStartTime = 0;
      this.state.hitEffectPlayed = false;
      this.state.hitEffectStarted = false;
      this.state.hitEffectFrame = -1;
      this.state.lastFrame = -1;
      this.state.characterToRemove = null;
      
      // Reset player character state
      selectedCharacter.attackInterfaceConfirmed = false;
      selectedCharacter.action = null;
      selectedCharacter.isSelected = false;
      selectedCharacter.canMove = false;
      selectedCharacter.isGreyedOut = true;
      
      // Only grey out the enemy if it was an enemy-initiated battle
      if (isEnemyInitiated) {
        for (let character of characters) {
          if (character.isEnemy && character.x === locationCursor.x && character.y === locationCursor.y) {
            character.isGreyedOut = true;
            break;
          }
        }
      }
      
      // Reset enemy selection state
      enemySelectedForAttack = false;
      isEnemyInitiated = false;  // Reset the enemy-initiated flag
      canEnemyMove = true;  // Allow next enemy to move after battle concludes
      
      // Switch back to out-battle music by adjusting volumes
      sounds.inBattleMusic.amp(0);
      sounds.outBattleMusic.amp(0.3);
      
      // Reset character animation to standing
      animationManager(selectedCharacter, "standing");
    }
  }

  // Handles the death of a character
  handleCharacterDeath(defender, attacker) {
    // Mark the character for removal after battle concludes
    this.state.characterToRemove = defender;

    // Skip any remaining attacks by setting appropriate flags
    if (attacker.isEnemy) {
      // If enemy killed player, skip any remaining player attacks
      this.state.hasPlayerDouble = false;
    }
    else {
      // If player killed enemy, skip any remaining enemy attacks
      this.state.hasEnemyDouble = false;
    }
    // Force battle to conclude after current attack finishes
    this.state.willTransitionToConclude = true;
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
let actionMenu, actionMenuImages = {}; // Action menu object and images
let UIImages = {}, UIPaths; // UI images and paths
let portraitImages = {}, portraitPaths; // Portrait images and paths
let isPlayerTurn = true; // Track whose turn it is (enemy or player)
let showTurnImage = true; // Whether to show the turn image
let turnImageTimer = 0; // Timer for turn image display
let enemyPhaseDelayTimer = 0;  // Timer for enemy phase delay
let enemyPhaseStarted = false; // Flag to track if enemy phase has started
let uiManager; // UI Manager instance
let enemySelectedForAttack = false; // Track if an enemy has been selected for attack
let attackingAnimationPaths = {}; // Attacking animation paths
let battleManager; // Battle Manager instance
let isEnemyInitiated = false; // Flag to track if enemy initiated battle
let canEnemyMove = true;  // Controls whether enemies can start their movement
let isGameOver = false; // Flag to track if game is over
// Define directions once as a constant
const DIRECTIONS = [
  { x: 0, y: -1 }, // up
  { x: 0, y: 1 },  // down
  { x: 1, y: 0 },  // right
  { x: -1, y: 0 }  // left
];

// Preload all information and images
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

  // Preload action menu images from JSON
  actionMenuImages = loadJSON("Assets/ActionMenu/actionMenuPaths.json", setupActionMenuImages);

  // Preload UI images from JSON
  UIPaths = loadJSON("Assets/UI/UIImages.json", setupUIImages);

  // Preload portrait images from JSON
  portraitPaths = loadJSON("Assets/Portraits/portraits.json", setupPortraitImages);

  // Load attacking animations paths from JSON
  attackingAnimationPaths = loadJSON("Assets/AttackingAnimations/attackingAnimation.json", setupAttackingAnimations);
}

function setup() {
  // Calculate tile grid dimensions based on level layout
  tilesHigh = lines.length;
  tilesWide = lines[0].length;

  // Create a canvas that's 1000x750 pixels with a 4:3 ratio
  createCanvas(1000, 750);

  // Calculate tile sizes after canvas is created
  tilesWidth = width / tilesWide;
  tilesHeight = height / tilesHigh;

  // Start both music tracks looping one is in battle and the other is out of battle
  sounds.outBattleMusic.loop();
  sounds.outBattleMusic.amp(0.3);

  sounds.inBattleMusic.loop();
  sounds.inBattleMusic.amp(0); // Start muted

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

  // Initialize the UI manager
  uiManager = new UIManager();

  // Initialize battle manager
  battleManager = new BattleManager();

  // Initialize turn image display for first player turn
  showTurnImage = true;

  // Start the timer for how long the image has been displayed for
  turnImageTimer = millis();
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

// Initialize UIImages after the UI images JSON is loaded
function setupUIImages(data) {
  for (let key in data) {
    // Load the image for each UI element
    UIImages[key] = loadImage(data[key]);
  }
}

// Initialize portraitImages after the portrait paths JSON is loaded
function setupPortraitImages(data) {
  for (let key in data) {
    // Load each portrait image
    portraitImages[key] = loadImage(data[key]);
  }
}

// Initialize attackingAnimations after the JSON is loaded
function setupAttackingAnimations(data) {
  for (let key in data) {
    attackingAnimationPaths[key] = loadImage(data[key]);
  }
}

// Handles animation changes based on the character's state (e.g., walking, standing)
function animationManager(character, state) {
  if (!character) {
    return;
  }

  // Map states to file paths for different animations (e.g., walking, standing)
  const statePaths = {
    "standing": `Assets/CharacterMapSprites/StandingGifs/${character.classType.toLowerCase()}_standing.gif`,
    "selected": `Assets/CharacterMapSprites/SelectedGifs/${character.classType.toLowerCase()}_selected.gif`,
    "walkleft": `Assets/CharacterMapSprites/WalkingGifs/${character.classType.toLowerCase()}_walk_left.gif`,
    "walkright": `Assets/CharacterMapSprites/WalkingGifs/${character.classType.toLowerCase()}_walk_right.gif`,
    "walkup": `Assets/CharacterMapSprites/WalkingGifs/${character.classType.toLowerCase()}_walk_up.gif`,
    "walkdown": `Assets/CharacterMapSprites/WalkingGifs/${character.classType.toLowerCase()}_walk_down.gif`,
  };

  // If the state exists, load the corresponding animation
  if (statePaths[state]) {
    // Load the animation
    character.animation = loadImage(statePaths[state]);
    // Update the current state
    character.currentState = state;
  }
}

// Handle turn transitions
function handleTurnSystem() {
  // Don't process turns if game is over
  if (isGameOver) {
    return;
  }

  // Check for game over conditions first
  if (!isGameOver) {
    // Set flags to check if all players and enemies are dead
    let allPlayersAlive = true;
    let allEnemiesAlive = true;

    // Check if all players and enemies are alive
    for (let character of characters) {
      if (!character.isEnemy && !character.isDead()) {
        allPlayersAlive = false;
      }
      if (character.isEnemy && !character.isDead()) {
        allEnemiesAlive = false;
      }
    }

    // If all players and enemies are dead, set game over flag and load the appropriate image
    if (allPlayersAlive || allEnemiesAlive) {
      isGameOver = true;
      gameOverImage = loadImage(allPlayersAlive ? 'Assets/UI/winLoseImages/game_over.png' : 'Assets/UI/winLoseImages/game_win.png');
      return;
    }
  }

  if (isPlayerTurn) {
    enemyPhaseStarted = false; // Reset enemy phase flag
   
    // Check if all player characters have used their turn
    let allPlayersMoved = true;
    for (let character of characters) {
      if (!character.isEnemy && !character.isGreyedOut) {
        allPlayersMoved = false;
        break;
      }
    }

    // If all players have moved, switch to enemy turn
    if (allPlayersMoved) {
      // Reset ALL characters
      for (let character of characters) {
        character.isGreyedOut = false;
        character.canMove = true;
      }
      isPlayerTurn = false;
      showTurnImage = true;
      turnImageTimer = millis();
      sounds.enemyPhase.amp(2);
      sounds.enemyPhase.play();
    }
  }
  else {
    // Wait for turn image to finish
    if (showTurnImage) {
      enemyPhaseDelayTimer = millis(); // Set the delay timer when image disappears
      return;
    }

    // Add delay after turn image disappears
    if (!enemyPhaseStarted) {
      if (millis() - enemyPhaseDelayTimer < 500) { // 500ms = 0.5 seconds
        return;
      }
      enemyPhaseStarted = true;
    }

    // Check if any enemy is still moving or if a battle animation is playing
    let enemyMoving = characters.some(char => char.isEnemy && char.isMoving);
    let battlePlaying = battleManager && battleManager.state && battleManager.state.isPlaying;
    if (enemyMoving || battlePlaying || isEnemyInitiated || !canEnemyMove) {
      return;
    }

    // Find one unmoved enemy
    let foundEnemy = characters.find(char => char.isEnemy && char.canMove);

    // If we found an unmoved enemy, execute its move
    if (foundEnemy) {
      foundEnemy.executeAIMove();
    }
    // If no unmoved enemies are found and none are moving, switch back to player turn
    else if (!enemyMoving && canEnemyMove) {
      // Reset all characters for the new turn
      for (let character of characters) {
        character.canMove = true;
        character.isGreyedOut = false;
        character.action = null;
      }
      // Switch to player turn
      isPlayerTurn = true;
      showTurnImage = true;
      turnImageTimer = millis();
      sounds.playerPhase.amp(2);
      sounds.playerPhase.play();

      // Move cursor to Roy or first available player character
      let roy = characters.find(char => char.name === "Roy" && !char.isEnemy);
      if (roy) {
        locationCursor.x = roy.x;
        locationCursor.y = roy.y;
      } 
      else {
        // If Roy isn't found, find the first player character
        let firstPlayer = characters.find(char => !char.isEnemy);
        if (firstPlayer) {
          locationCursor.x = firstPlayer.x;
          locationCursor.y = firstPlayer.y;
        }
      }
    }
  }
}

// Allows user to hold down movement keys for continuous movement
function holdCursorMovement() {
  // Don't allow cursor movement if game is over, action menu is open, character is moving, during enemy turn, enemy is selected for attack, or item is selected
  if (isGameOver || actionMenu.isVisible || selectedCharacter?.isMoving || !isPlayerTurn || enemySelectedForAttack || selectedCharacter && selectedCharacter.action === "item") {
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

// Handles all inputs
function keyPressed() {
  // Only handle keyboard input during gameplay and when game is not over
  if (gameState !== GAME_STATES.GAMEPLAY || isGameOver) {
    return;
  }

  // If turn image is showing, don't handle any input
  if (showTurnImage) {
    return;
  }

  // Check if any enemy is moving or if a battle animation is playing
  let enemyMoving = characters.some(char => char.isEnemy && char.isMoving);
  if (enemyMoving) {
    return;
  }

  // If attack interface is confirmed, block all key inputs
  if (selectedCharacter?.attackInterfaceConfirmed) {
    return;
  }

  // Reset cursor image to default on key press
  cursorImageKey = "default";

  // Handle action menu navigation first if menu is visible
  if (actionMenu.isVisible) {
    sounds.cursorSelection.amp(0.7);
    if (keyCode === 87) {
      // If "w" is pressed move selection up and play sound
      actionMenu.moveSelection("up");
      sounds.cursorSelection.play();
    }
    else if (keyCode === 83) {
      // If "s" is pressed move selection down and play sound
      actionMenu.moveSelection("down");
      sounds.cursorSelection.play();
    }
    else if (keyCode === 74) {
      // If "j" is pressed select the highlighted option
      let selectedCharacter = Character.getSelectedCharacter();
      if (selectedCharacter) {
        const selectedOption = actionMenu.getSelectedOption();
       
        // If the option was "Wait"
        if (selectedOption === "Wait") {
          selectedCharacter.canMove = false;
          selectedCharacter.isGreyedOut = true;
          actionMenu.hide();
          Character.unselectCharacter(false);
          sounds.selectOption.play();
        }
        // If the option was "Attack"
        else if (selectedOption === "Attack") {
          // Only allow attack if there are enemies in range
          if (selectedCharacter.hasEnemiesInRange()) {
            // Set character's action to attack mode
            selectedCharacter.action = "attack";
            // Hide the action menu
            actionMenu.hide();
            // Keep character selected for attack target selection
            selectedCharacter.isSelected = true;
            // Calculate attackable tiles from current position
            selectedCharacter.calculateActionableTiles();
            // Play selection sound
            sounds.selectOption.play();
          }
          else {
            // Play error sound or some feedback that attack isn't possible
            sounds.unselectCharacter.play();
          }
        }
        // If the option was "Item"
        else if (selectedOption === "Item") {
          // Check if there are any items left
          if (uiManager.items.length > 0) {
            // Hide the action menu
            actionMenu.hide();
            // Set character's action to item
            selectedCharacter.action = "item";
            // Keep character selected
            selectedCharacter.isSelected = true;
            // Play selection sound
            sounds.selectOption.play();
          } 
          else {
            // Play error sound if no items left
            sounds.unselectCharacter.play();
          }
        }
      }
    }
    else if (keyCode === 75) {
      // If "k" is pressed cancel the action menu and move character back to their previous location
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

  // If menu is not visible, handle normal game controls when "k" is pressed
  if (keyCode === 74) {
    const selectedCharacter = Character.getSelectedCharacter();
   
    // If there is a selected character in attack mode
    if (selectedCharacter && selectedCharacter.action === "attack") {
      // If enemy is already selected, confirm attack interface
      if (enemySelectedForAttack && !selectedCharacter.attackInterfaceConfirmed) {
        selectedCharacter.attackInterfaceConfirmed = true;
        sounds.selectOption.play();
      }

      // Check if cursor is over an attackable tile
      const isAttackableTile = selectedCharacter.attackableTiles.some(
        tile => tile.x === locationCursor.x && tile.y === locationCursor.y
      );

      // Check if there's an enemy at the cursor position
      const targetEnemy = characters.find(
        char => char.isEnemy && char.x === locationCursor.x && char.y === locationCursor.y
      );

      // If the tile is attackable and there's an enemy there
      if (isAttackableTile && targetEnemy) {
        // Set the enemy selected flag
        enemySelectedForAttack = true;
        // End the character's turn
        selectedCharacter.canMove = false;
        sounds.selectOption.play();
      }
      return;
    }
    // If there is a selected character in item mode
    else if (selectedCharacter && selectedCharacter.action === "item") {
      if (!uiManager.itemConfirmationMode) {
        // Enter confirmation mode
        uiManager.itemConfirmationMode = true;
        sounds.selectOption.play();
      } 
      else {
        // Handle item use confirmation
        sounds.selectOption.play();
        // Play heal sound effect and voice line
        sounds.heal.play(); 
        const healVoiceLine = sounds[selectedCharacter.name.toLowerCase() + "Heal"];
        if (healVoiceLine) {
          healVoiceLine.setVolume(2.0);
          healVoiceLine.play();
        }
        // Heal character and remove item
        selectedCharacter.heal(15);
        uiManager.items.splice(uiManager.selectedItemIndex, 1);
        // End turn
        selectedCharacter.canMove = false;
        selectedCharacter.isGreyedOut = true;
        selectedCharacter.action = null;
        uiManager.itemConfirmationMode = false;
        Character.unselectCharacter(false);
      }
      return;
    }
    // If there is a selected character and it's not an enemy, move the character
    else if (selectedCharacter && !selectedCharacter.isEnemy) {
      Character.moveSelectedCharacter(locationCursor, tiles);
    }
    // If there is not a selected character, select character
    else if (!selectedCharacter) {
      Character.selectCharacter();
    }
  }
  // If "k" is pressed and there is a selected character that's not moving, unselect them
  else if (keyCode === 75 && selectedCharacter && !selectedCharacter.isMoving) {
    // Don't allow canceling during or right after battle animation
    if (battleManager.isPlaying || selectedCharacter.isGreyedOut) {
      return;
    }
    
    // If in item confirmation mode, exit back to item list
    if (selectedCharacter.action === "item" && uiManager.itemConfirmationMode) {
      uiManager.itemConfirmationMode = false;
      sounds.unselectCharacter.play();
      return;
    }
    
    // If in attack mode or item mode, cancel and return to original position
    if (selectedCharacter.action === "attack" || selectedCharacter.action === "item") {
      // Move character back to their original position
      selectedCharacter.x = selectedCharacter.previousX;
      selectedCharacter.y = selectedCharacter.previousY;

      // Reset properties
      selectedCharacter.action = null;
      selectedCharacter.isSelected = true;
      selectedCharacter.canMove = true;
      selectedCharacter.isGreyedOut = false;

      // Reset enemy selection flag and item confirmation
      enemySelectedForAttack = false;
      uiManager.itemConfirmationMode = false;
      
      // Recalculate movement range from original position
      selectedCharacter.calculateActionableTiles();
      sounds.unselectCharacter.play();
      animationManager(selectedCharacter, "selected");
    }
    // Otherwise unselect normally as long as character isn't greyed out
    else if (!selectedCharacter.isGreyedOut) {
      Character.unselectCharacter(true);
    }
  }
  // If "r" key is pressed - Skip to enemy turn
  else if (keyCode === 82 && isPlayerTurn) {
    // Deselect any selected character
    if (selectedCharacter) {
      Character.unselectCharacter(false);
    }
    // Switch to enemy turn
    isPlayerTurn = false;
    showTurnImage = true;
    turnImageTimer = millis();
    // Grey out all player characters
    for (let character of characters) {
      if (!character.isEnemy) {
        character.canMove = false;
        character.isGreyedOut = true;
      }
    }
  }
  // Handle W and S keys for item selection (only when not in confirmation mode)
  else if ((keyCode === 87 || keyCode === 83) && selectedCharacter?.action === "item" && !uiManager.itemConfirmationMode) {
    const direction = keyCode === 87 ? "up" : "down";
    uiManager.moveItemSelection(direction);
  }
}

// Helper function to handle player turn UI elements
function handlePlayerTurnUI() {
  locationCursor.renderCursor();

  // If no enemy is selected for attack, display tile location image and character info
  if (!enemySelectedForAttack) {
    // If item is selected, display item box
    if (selectedCharacter && selectedCharacter.action === "item") {
      uiManager.itemsInterface(); // Show inventory management interface
    } 
    else {
      uiManager.displayTileLocationImage(); // Show terrain info for cursor position

      // Check if cursor is over any character and display info
      for (let character of characters) {
        if (character.x === locationCursor.x && character.y === locationCursor.y) {
          uiManager.displayCharacterInfo(character);
          break;
        }
      }
    }
  }
}

// Manages combat-related UI elements and battle animations
function handleBattleUI() {
  // Find enemy character at cursor position
  const targetEnemy = characters.find(
    char => char.isEnemy && char.x === locationCursor.x && char.y === locationCursor.y
  );
  
  // Display battle info preview if we have a selected character, they are in attack mode and an enemy has been selected
  if (selectedCharacter && selectedCharacter.action === "attack" && enemySelectedForAttack) {
    if (selectedCharacter.attackInterfaceConfirmed) {
      // Battle has been confirmed - show full battle animation interface
      uiManager.drawBattleInterface(selectedCharacter, targetEnemy);
      // If both characters are valid, play the battle animation sequence
      if (selectedCharacter && targetEnemy) {
        battleManager.handleBattleAnimation(selectedCharacter, targetEnemy);
      }
    } 
    else if (selectedCharacter && targetEnemy) {
      // Battle not yet confirmed - show battle forecast
      selectedCharacter.attack(targetEnemy);
      targetEnemy.attack(selectedCharacter);
      uiManager.battleInfoPreview();
    }
  }
}

// Helper function to render map elements
function renderMapElements() {
  // Render base map layer (terrain tiles)
  Tile.displayAll(tiles);
  
  // Show movement and attack range indicators for selected unit
  Tile.displayActionableTiles();

  // If there is a selected character and it's not an enemy, draw movement preview
  if (selectedCharacter && !selectedCharacter.isEnemy) {
    selectedCharacter.drawMovementPreview();  // Highlight potential movement path
  }

  // Render all character sprites on top of the map
  for (let character of characters) {
    character.displayOnMap();
  }
}

// Main game loop for rendering everything on the screen
function draw() {
  // Exit early if not in gameplay state
  if (gameState !== GAME_STATES.GAMEPLAY) {
    return;
  }

  // Process cursor movement when turn transition is complete
  if (!showTurnImage) {
    holdCursorMovement();
  }

  // Render map elements
  renderMapElements();

  // Render turn image
  uiManager.displayTurnImage();

  // If turn image is not showing and it's the player's turn, handle player turn UI
  if (!showTurnImage && isPlayerTurn) {
    handlePlayerTurnUI();  // Process player input and show available actions
  }

  // Render action menu
  actionMenu.display();

  // Handle battle UI
  handleBattleUI();

  // Handle turn system
  handleTurnSystem();  // Process turn transitions and AI moves

  // Display game over screen if win conditions are met
  uiManager.displayGameOver(); // Check and display victory/defeat conditions
}