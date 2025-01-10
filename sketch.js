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
// Other sounds acquired from Fire Emblem: Three Houses
// Formulas for combat and stats taken from https://www.fe3h.com/calculations

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
 
  // Check if a tile is blocked by an enemy (for pathfinding and display)
  static isTileBlockedByEnemy(x, y) {
    const selectedChar = Character.getSelectedCharacter();

    if (!selectedChar) {
      return true;
    }

    // Check each character
    for (let character of characters) {
      if (character.x === x && character.y === y) {
        // If it's an enemy, tile is blocked
        if (character.isEnemy !== selectedChar.isEnemy) {
          return true;
        }
      }
    }
    return false;
  }

  // Check if a tile is occupied by any character
  static isTileOccupied(x, y) {
    const selectedChar = Character.getSelectedCharacter();
    if (!selectedChar) {
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
          fill(0, 0, 255, 150);  
          noStroke();
          rect(drawX, drawY, tilesWidth, tilesHeight);
        }

        // Draw red squares to show character's attackable tiles
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
    this.hp = hp; // HP stat (Health points)
    this.strength = strength; // Strength stat (Attack for physical attacks)
    this.magic = magic; // Magic stat (Attack for magical attacks)
    this.dexterity = dexterity; // Dexterity stat (Affects hit chance, critical hit chance, and evasion)
    this.speed = speed; // Speed stat (Determine whether a unit can double attack)
    this.luck = luck; // Luck stat (Affects critical hit chance, avoiding critical hits, and hit chance)
    this.defense = defense; // Physical defense stat (Reduces damage from physical attacks)
    this.resistance = resistance; // Magical defense stat (Reduces damage from magical attacks)
    this.might = might; // Attack power (Base damage a weapon or spell)
    this.hit = hit; // Hit chance (Base accuracy of a weapon or spell)
    
    // Visual and gameplay properties
    this.isEnemy = isEnemy; // Is this character an enemy
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
    this.attackInterfaceConfirmed = false; // Whether the user has confirmed the attack interface

    // Movement and attack calculations
    this.animation = null; // Character visual sprite
    this.reachableTiles = []; // Character reachable movement tiles
    this.attackableTiles = []; // Characters attackable movement tiles
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
   
    // Only increase width for left/right walking animations for Lord and Cavalier
    else if ((this.currentState === "walkleft" || this.currentState === "walkright") &&
        (this.classType === "Lord" || this.classType === "Cavalier")) {
      drawWidth = 65;  // Larger width for walking animations
    }

    // If the character is selected and has the selected animation, increase the size slightly for visual effect
    if (this.isSelected && isSelectedAnimation) {
      // Smaller width increase for Fighter class
      if (this.classType === "Fighter") {
        drawWidth += 10;
      }
      else {
        drawWidth += 15;
      }
     
      // Scale enemy characters much higher when selected
      if (this.isEnemy) {
        drawHeight += 35;
      }
      else {
        drawHeight += 15;
      }
    }
   
    // Calculate the character's position on the map, centering it within the grid cell
    let drawX = this.x * tilesWidth + (tilesWidth - drawWidth) / 2;
    let drawY = this.y * tilesHeight + (tilesHeight - drawHeight) / 2;

    // Adjust Y-position for walking animations if enemy
    if (this.isEnemy && isWalkingAnimation) {
      drawY -= 4;
    }

    // Adjust Y-position if the character is selected and has isSelectedAnimation
    if (this.isSelected && isSelectedAnimation) {
      // Adjust Y position more for enemy characters since they're scaled much higher
      if (this.isEnemy) {
        drawY -= 20;
      }
      else {
        drawY -= 7;
      }
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
          console.log(`Showing range for enemy ${character.name}`);
          return;
        }
     
        // For non-enemy characters, proceed with normal selection if not greyed out
        if (!character.isGreyedOut) {
          // Play selection sound effect
          sounds.selectCharacter.amp(0.4);
          sounds.selectCharacter.play();
       
          // Update cursor to show selection state
          cursorImageKey = "selectedCursor";

          // Play character-specific voice line
          const voiceKey = `${character.name.toLowerCase()}SelectVoice`;
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
      "Fighter": 3,
      "Brigand": 3
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

  // Helper function to calculate attackable tiles from a position
  calculateAttackTiles() {
    // Get the attack range of the character
    const attackRange = this.getAttackRange(); 

    // Initialize a set to track visited tiles, starting with the current position
    const attackVisited = new Set([`${this.x},${this.y}`]); 

    // Initialize the queue for breadth-first search with the starting position and cost 0
    const attackQueue = [{ x: this.x, y: this.y, cost: 0 }]; 

    // Set to store coordinates of attackable tiles
    const attackableTiles = new Set(); 

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
        continue; // Continue to the next iteration of the loop
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
          continue; // Continue to the next iteration of the loop
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

  // Calculate reachable and attackable tiles using Dijkstra's algorithm
  calculateActionableTiles() {
    this.reachableTiles = []; // Initialize an empty array to store reachable tiles
    this.attackableTiles = []; // Initialize an empty array to store attackable tiles

    // If the character is in attack mode, only calculate attackable tiles from the current position
    if (this.action === "attack") {
      this.attackableTiles = this.calculateAttackTiles(); // Call the helper function to calculate attackable tiles
      return; // Exit the function early
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
        continue; // Continue to the next iteration of the loop
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
          continue; // Continue to the next iteration of the loop
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
      return { x, y }; // Return the coordinates as an object
    });
  }

  // Move the character to a new location gradually
  moveTo(newX, newY, isEnemy = false) {
    // Save the previous position
    this.previousX = this.x;
    this.previousY = this.y;

    // Check if character is actually moving to a new position
    const isActuallyMoving = newX !== this.x || newY !== this.y;

    // Get path based on character type
    const path = isEnemy ?
      this.findPath({ x: this.x, y: this.y }, { x: newX, y: newY }) :
      Character.findPath({ x: this.x, y: this.y }, { x: newX, y: newY }, tiles);

    if (!path) {
      console.log("No path found!");
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

        // Different end behavior for enemy vs player
        if (isEnemy) {
          this.isMoving = false;
          this.canMove = false;
          this.isGreyedOut = true;
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
        // Play walking sound effect depending on the character class
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
      }, 200); // Adjust timing as needed
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
        const tile = tiles[cursor.y][cursor.x];

        // Check if we can move to this tile
        if (!Tile.isTileOccupied(cursor.x, cursor.y)) {
          // Only store previous position if actually moving
          if (cursor.x !== selectedCharacter.x || cursor.y !== selectedCharacter.y) {
            selectedCharacter.previousX = selectedCharacter.x;
            selectedCharacter.previousY = selectedCharacter.y;
          }

          // Move the character to the new location
          selectedCharacter.moveTo(cursor.x, cursor.y);
          console.log(`${selectedCharacter.name} moved to (${cursor.x}, ${cursor.y})`);
        }
        else {
          console.log("Cannot move to this tile - occupied.");
        }
      }
      else {
        console.log("Tile not reachable.");
      }
    }
  }

  // Use A* algorithm to find a path to the selected tile
  static findPath(start, goal, tiles, isEnemy = false) {
    // First check if the start or goal positions are invalid
    if (!Tile.isWithinMapBounds(start.x, start.y) || !Tile.isWithinMapBounds(goal.x, goal.y)) {
      console.log("Start or goal position is out of bounds");
      return null;
    }

    // Check if start or goal is walkable
    if (!tiles[start.y][start.x].isWalkable()) {
      console.log("Start position is not walkable");
      return null;
    }

    // For enemy pathfinding, we allow moving towards player positions
    if (!tiles[goal.y][goal.x].isWalkable() && (!isEnemy || !this.isPositionBlockedByPlayer?.(goal.x, goal.y))) {
      console.log("Goal position is not walkable");
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
        return path;
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

        // Skip the neighbor if it is; out of bounds, not walkable, blocked by an enemy or has already been evaluted
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
                // Enemy characters add a movement penalty this allows for pathfinding around enemy characters
                costModifier = 5;
              }
            }
          }

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
            // Add the neighbor node to the open set
            openSet.push(neighborNode); 

            // Track the g-score for this node
            gScore.set(neighborKey, tentativeGScore);
          
            // Set the current node as the previous node for this neighbor
            cameFrom.set(neighborKey, current);
          }

          // If the tentative g-score is lower than the current g-score, update the neighbor's scores
          else if (tentativeGScore < gScore.get(neighborKey)) {
            neighborNode.g = tentativeGScore;
            neighborNode.f = tentativeGScore + Character.heuristic(neighbor, goal);
            gScore.set(neighborKey, tentativeGScore);
            cameFrom.set(neighborKey, current);
          }
        }
        // Regular pathfinding for non-enemy characters
        else {
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
          // If the tentative g-score is lower than the current g-score, update the neighbor's scores
          else if (tentativeGScore < gScore.get(neighborKey)) {
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
          // How many pixels to move the arrowhead forward
          const arrowOffset = 15;
          translate(endX + dx * arrowOffset, endY + dy * arrowOffset);
          rotate(atan2(dy, dx));

          // Draw the arrowhead
          fill(41, 214, 255, 200);  // Changed from (255, 255, 0, 200) to (41, 214, 255, 200)
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
      protection = opponent.defense;
      resistance = opponent.resistance;
    } 
    else {
      protection = this.defense;
      resistance = this.resistance;
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
    if (this.classType === "Mage") {
      hit = this.hit + (this.dexterity + this.luck)/2;
    } 
    else {
      hit = this.hit + this.dexterity;
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
    // If mage use different avoid formula
    else {
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
    const crit = this.dexterity + this.luck;

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

    // Critical Damage Formula
    const critDamage = this.displayedDamage * 3;
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

  // Use moveTo for use enemy-specific behavior
  moveTo(newX, newY) {
    super.moveTo(newX, newY, true);
  }

  // Execute AI movement
  executeAIMove() {
    // Check if enemy can move
    if (!this.canMove) {
      return;
    }

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
        console.log(`Moving to (${targetPos.x}, ${targetPos.y})`);
        this.previousX = this.x;
        this.previousY = this.y;
        this.moveTo(targetPos.x, targetPos.y);
      }

      else {
        // If we couldn't find any valid position, mark as moved
        console.log(`No valid position found for ${this.name}`);
      }
    }
    else {
      // If no path found, mark as moved
      console.log("No valid path found to player");
    }
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
  constructor(x = 5, y = 8) {
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
    text(selectedCharacter.hp, 90, yPosition + scaledHeight + 15);
    text(targetEnemy.hp, width/2 + 90, yPosition + scaledHeight + 15);

    // HP bar constants
    const barWidth = 300;
    const barHeight = 20;
    const cornerRadius = 10;

    // Draw player HP bar
    const playerBarX = 150;
    const playerBarY = yPosition + scaledHeight + 23;
    const playerHPRatio = selectedCharacter.hp / selectedCharacter.hp;

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
    const enemyHPRatio = targetEnemy.hp / targetEnemy.hp;

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
      text(character.hp + "/" + character.hp, hpFractionX, hpY);

      // Draw HP bar
      const barWidth = 220;
      const barHeight = 20;
      const barX = hpX - 30; 
      const barY = hpY + 35;
      const hpRatio = character.hp / character.hp;
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
// Define directions once as a constant
const DIRECTIONS = [
  { x: 0, y: -1 }, // up
  { x: 0, y: 1 },  // down
  { x: 1, y: 0 },  // right
  { x: -1, y: 0 }  // left
];

// Battle animation states for player and enemy
let battleAnimationState = {
  isPlaying: false, // Whether the animation is currently playing
  currentPhase: "prepare",  // Current phase of the battle animation sequence
  startTime: 0, // Timestamp when the current phase started
  lastFrame: -1, // Track last frame to detect animation loop completion
  willPlayerCrit: false,  // Whether the player's attack will be critical
  willEnemyCrit: false, // Whether the enemy's attack will be critical
  willPlayerHit: false, // Whether the playey's attack will hit
  willEnemyHit: false,  // Whether the enemy's attack will hit
  hasPlayerDouble: false, // Whether the player gets a second attack (speed >= 4)
  hasEnemyDouble: false,  // Whether the enemy gets a second attack (speed >= 4)
  willPlayerSecondCrit: null, // Whether the player's second attack will be critical
  willEnemySecondCrit: null, // Whether the enemy's second attack will be critical
  willPlayerSecondHit: null,  // Whether the player's second attack will hit
  willEnemySecondHit: null,  // Whether the enemy's second attack will hit
  playerDodgePlayed: false, // Whether the player's dodge animation has played
  enemyDodgePlayed: false, // Whether the enemy's dodge animation has played
  playerSecondDodgePlayed: false, // Whether the player's second dodge animation has played
  enemySecondDodgePlayed: false, // Whether the enemy's second dodge animation has played
  dodgeStartTime: 0,  // Add new timing tracker for dodge animations
  missTextStartTime: 0,  // When the miss text started showing
  critTextStartTime: 0  // When the crit text started showing
};

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

  // Turn off any smoothing for shapes and images in p5.js to match the sharp look
  noSmooth();

  // Calculate tile sizes after canvas is created
  tilesWidth = width / tilesWide;
  tilesHeight = height / tilesHigh;

  // Loop background music and set volume
  sounds.battleMusic.loop(true);
  sounds.battleMusic.amp(0.5);

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
    console.error("Animation manager called with an invalid character.");
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
  else {
    console.warn(`Unknown animation state: ${state}`);
  }
}

// Check if all non-enemy characters have used their turn
function checkAllPlayerCharactersUsed() {
  for (let character of characters) {
    if (!character.isEnemy && !character.isGreyedOut) {
      return false;
    }
  }
  return true;
}

// Check if all enemy characters have used their turn
function checkAllEnemyCharactersUsed() {
  for (let character of characters) {
    if (character.isEnemy && !character.isGreyedOut) {
      return false;
    }
  }
  return true;
}

// Handle turn transitions
function handleTurnSystem() {
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
      console.log("All players have moved, switching to enemy turn");
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

    // Check if any enemy is still moving
    let enemyMoving = characters.some(char => char.isEnemy && char.isMoving);
    if (enemyMoving) {
      return;
    }

    // Find one unmoved enemy
    let foundEnemy = characters.find(char => char.isEnemy && char.canMove);

    // If we found an unmoved enemy, execute its move
    if (foundEnemy) {
      foundEnemy.executeAIMove();
    }
    // If no unmoved enemies are found and none are moving, switch back to player turn
    else if (!enemyMoving) {
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
    }
  }
}

// Allows user to hold down movement keys for continuous movement
function holdCursorMovement() {
  // Don't move cursor if action menu is open, character is moving, during enemy turn, or enemy is selected for attack
  if (actionMenu.isVisible || selectedCharacter?.isMoving || !isPlayerTurn || enemySelectedForAttack) {
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
  // Only handle keyboard input during gameplay
  if (gameState !== GAME_STATES.GAMEPLAY) {
    return;
  }

  // If turn image is showing, don't handle any input
  if (showTurnImage) {
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
          // If the option was "Item"
          else if (selectedOption === "Item") {
            // Hide the action menu
            actionMenu.hide();
            // Set character's action to item
            selectedCharacter.action = "item";
            // Play selection sound
            sounds.selectionOption.play();
          }
          else {
            // Play error sound or some feedback that attack isn't possible
            sounds.unselectCharacter.play();
          }
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
    // If there is a selected character and it's not an enemy, move the character
    else if (selectedCharacter && !selectedCharacter.isEnemy) {
      Character.moveSelectedCharacter(locationCursor, tiles);
    }
    // If there is not a selected character, select character
    else if (!selectedCharacter) {
      Character.selectCharacter();
    }
  }
  // If k is pressed and there is a selected character that's not moving, unselect them
  else if (key === "k" && selectedCharacter && !selectedCharacter.isMoving) {
    // Don't allow canceling during or right after battle animation
    if (battleAnimationState.isPlaying || selectedCharacter.isGreyedOut) {
      return;
    }
    
    // If in attack mode, cancel attack and return to original position
    if (selectedCharacter.action === "attack") {
      // Move character back to their original position
      selectedCharacter.x = selectedCharacter.previousX;
      selectedCharacter.y = selectedCharacter.previousY;
      // Reset properties
      selectedCharacter.action = null;
      selectedCharacter.isSelected = true;
      selectedCharacter.canMove = true;
      selectedCharacter.isGreyedOut = false;
      // Reset enemy selection flag
      enemySelectedForAttack = false;
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
  // 'R' key - Skip to enemy turn
  else if (key === "r" && isPlayerTurn) {
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
}

// Check if cursor is over a character
function isCursorOverCharacter(character) {
  return locationCursor.x === character.x && locationCursor.y === character.y;
}

// Function to show miss text
function showMissText(isEnemyAttacking, now) {
  // If this is the first frame showing the text, record the start time
  if (battleAnimationState.missTextStartTime === 0) {
    battleAnimationState.missTextStartTime = now;
  }
  
  // Only show text if less than 400ms has passed
  if (now - battleAnimationState.missTextStartTime <= 400) {
    // If enemy is attacking, show miss text on the left, otherwise show it on the right
    const missX = isEnemyAttacking ? width * 0.3 : width * 0.57;
    const missY = height * 0.4;
    image(UIImages.missText, missX, missY);
  }
}

// Function to show critical hit text
function showCritText(isEnemyAttacking, now, attackerName, defenderName) {
  // Get the delay based on attacker and defender
  const key = `${attackerName.toLowerCase()}_${defenderName.toLowerCase()}`;
  const delayMap = {
    // Player attacking fighter
    'roy_fighter': 1850,
    'bors_fighter': 1425,
    'allen_fighter': 2250,
    'lance_fighter': 1350,
    'wolt_fighter': 2750,
    'lugh_fighter': 2100,
    
    // Fighter attacking players
    'fighter_roy': 900,
    'fighter_bors': 650,
    'fighter_allen': 775,
    'fighter_lance': 775,
    'fighter_wolt': 925,
    'fighter_lugh': 800
  };
  const critDelay = delayMap[key] || 0;

  // If this is the first frame showing the text, record the start time
  if (battleAnimationState.critTextStartTime === 0) {
    battleAnimationState.critTextStartTime = now;
  }
  
  // Only show text if we're past the delay and less than 400ms after that
  const timeSinceStart = now - battleAnimationState.critTextStartTime;
  if (timeSinceStart >= critDelay && timeSinceStart <= critDelay + 400) {
    // If enemy is attacking, show crit text on the left, otherwise show it on the right
    const critX = isEnemyAttacking ? width * 0.26 : width * 0.52;
    const critY = height * 0.4;
    // Scale down the image by 30%
    const critWidth = UIImages.criticalText.width * 0.7;
    const critHeight = UIImages.criticalText.height * 0.7;
    image(UIImages.criticalText, critX, critY, critWidth, critHeight);
  }
}

// Helper function to handle dodge animations
function handleDodgeAnimation(dodgerName, dodgerX, dodgerY, width, height, now, attacker, defender, isSecondDodge = false) {
  const dodgeAnim = attackingAnimationPaths[dodgerName + "Dodge"];
  if (dodgeAnim) {
    // Start tracking dodge timing if we haven't started yet
    if (battleAnimationState.dodgeStartTime === 0) {
      battleAnimationState.dodgeStartTime = now;
    }
    
    // Get the appropriate delay based on attacker, defender and if the attack is critical
    const isCrit = isSecondDodge ? 
      attacker.isEnemy ? battleAnimationState.willEnemySecondCrit : battleAnimationState.willPlayerSecondCrit :
      attacker.isEnemy ? battleAnimationState.willEnemyCrit : battleAnimationState.willPlayerCrit;
    
    // For both attacker and defender, use class type for enemies and name for players
    const attackerKey = attacker.isEnemy ? attacker.classType : attacker.name;
    const defenderKey = defender.isEnemy ? defender.classType : defender.name;
    
    const dodgeDelay = getDodgeDelay(attackerKey, defenderKey, isCrit);
    
    // Only start dodge animation after character-specific delay
    if (now - battleAnimationState.dodgeStartTime >= dodgeDelay) {
      const dodgeFlag = isSecondDodge ? 
        dodgerName.includes("enemy") ? "enemySecondDodgePlayed" : "playerSecondDodgePlayed" :
        dodgerName.includes("enemy") ? "enemyDodgePlayed" : "playerDodgePlayed";

      if (!battleAnimationState[dodgeFlag]) {
        dodgeAnim.reset();
        dodgeAnim.play();
        battleAnimationState[dodgeFlag] = true;
        battleAnimationState.missTextStartTime = 0; // Reset miss text timer when new dodge starts
      }
      image(dodgeAnim, dodgerX, dodgerY, width, height);

      // Display miss text based on who is attacking
      if (UIImages.missText) {
        showMissText(attacker.isEnemy, now);
      }

      if (dodgeAnim.getCurrentFrame() === dodgeAnim.numFrames() - 1) {
        dodgeAnim.pause();
      }
    } 
    else {
      // Show standing animation during the delay
      image(attackingAnimationPaths[dodgerName + "Standing"], dodgerX, dodgerY, width, height);
    }
  }
}

// Helper function to get dodge animation delay based on attacker, defender and crit
function getDodgeDelay(attackerName, defenderName, isCrit = false) {
  // Create a key for the combination of attacker and defender
  const key = `${attackerName.toLowerCase()}_${defenderName.toLowerCase()}`;
  
  // Add debug logging
  console.log('getDodgeDelay called with:', {
    attackerName,
    defenderName,
    isCrit,
    lookupKey: key
  });
  
  // Delay map for specific character combinations
  const delayMap = {
    // Roy's attacks
    'roy_fighter': isCrit ? 1850 : 700,
    'fighter_roy': isCrit ? 900 : 1000,

    // Bor's attacks
    'bors_fighter': isCrit ? 1425 : 1475,
    'fighter_bors': isCrit ? 650 : 825,

    // Allen's attacks
    'allen_fighter': isCrit ? 2250 : 800,
    'fighter_allen': isCrit ? 775 : 950,

    // Lance's attacks
    'lance_fighter': isCrit ? 1350 : 850,
    'fighter_lance': isCrit ? 775 : 1000,

    // Wolt's attacks
    'wolt_fighter': isCrit? 2750 : 1400,
    'fighter_wolt': isCrit ? 925 : 1000,

    // Lugh's attacks
    'lugh_fighter': isCrit? 2100 : 1450,
    'fighter_lugh': isCrit ? 800 : 900,  
  };

  const delay = delayMap[key];
  console.log('Found delay:', delay);
  return delay || 0;
}

// Helper function to handle attack animations
function handleAttackAnimation(attackerName, attackerX, attackerY, width, height, isCrit, isSecondAttack = false) {
  const attackType = isCrit ? "Critical" : "Attack";
  const attackAnim = attackingAnimationPaths[attackerName + attackType];
  const currentFrame = attackAnim.getCurrentFrame();
  const totalFrames = attackAnim.numFrames();
  
  // Draw the current frame
  image(attackAnim, attackerX, attackerY, width, height);
  
  // Return animation state for phase transitions
  return {
    currentFrame,
    totalFrames,
    isComplete: currentFrame < battleAnimationState.lastFrame && battleAnimationState.lastFrame !== -1
  };
}

// Helper function to show standing animations for both characters
function showStandingAnimations(attackerName, enemyName, positions, dimensions) {
  image(attackingAnimationPaths[attackerName + "Standing"], 
    positions.attackerX, positions.attackerY, 
    dimensions.attackerWidth, dimensions.attackerHeight);
  image(attackingAnimationPaths[enemyName + "Standing"], 
    positions.enemyX, positions.enemyY, 
    dimensions.enemyWidth, dimensions.enemyHeight);
}

// Handle battle animation sequence
function handleBattleAnimation(selectedCharacter, targetEnemy) {
  // Initialize battle animation sequence if not started
  if (!battleAnimationState.isPlaying) {
    battleAnimationState.isPlaying = true;
    battleAnimationState.startTime = millis();
    battleAnimationState.currentPhase = "prepare";
    
    // Reset all dodge animation flags
    battleAnimationState.playerDodgePlayed = false;
    battleAnimationState.enemyDodgePlayed = false;
    battleAnimationState.playerSecondDodgePlayed = false;
    battleAnimationState.enemySecondDodgePlayed = false;
    battleAnimationState.dodgeStartTime = 0;
    battleAnimationState.missTextStartTime = 0;
    battleAnimationState.critTextStartTime = 0;
    
    // Determine if player first hit will crit
    battleAnimationState.willPlayerCrit = random(100) < selectedCharacter.displayedCrit;
    // Determine if enemy first hit will crit
    battleAnimationState.willEnemyCrit = random(100) < targetEnemy.displayedCrit;

    // Determine if player first hit will actually hit
    battleAnimationState.willPlayerHit = random(100) < selectedCharacter.displayedHit;

    // Determine if enemy first hit will actually hit
    battleAnimationState.willEnemyHit = random(100) < targetEnemy.displayedHit;

    // Determine if characters can double attack
    battleAnimationState.hasPlayerDouble = selectedCharacter.speed - targetEnemy.speed >= 4;
    battleAnimationState.hasEnemyDouble = targetEnemy.speed - selectedCharacter.speed >= 4;
    
    // Initialize second hit crit chances as null - will be determined if needed
    battleAnimationState.willPlayerSecondCrit = null;
    battleAnimationState.willEnemySecondCrit = null;

    // Initialize second hit, hit chances as null - will be determined if needed
    battleAnimationState.willPlayerSecondHit = null;
    battleAnimationState.willEnemySecondHit = null;

    battleAnimationState.lastFrame = -1;
  }

  const now = millis();
  // Calculate the time since the animation started
  const timeSinceStart = now - battleAnimationState.startTime;

  // Position and size constants for battle animations
  const baseAttackerX = width * 0.02;
  // Adjust position if character is Bors
  const attackerX = selectedCharacter.name.toLowerCase() === "bors" ? baseAttackerX + width * 0.08 : baseAttackerX;
  const attackerY = height * 0.01 - 50;
  const enemyX = width * 0.08;
  const enemyY = height * 0.01 - 50;
  const attackerWidth = width;
  const attackerHeight = height * 0.7;
  const enemyWidth = width;
  const enemyHeight = height * 0.7;

  // Get character identifiers for animation paths
  const attackerName = selectedCharacter.name.toLowerCase();
  const enemyClass = targetEnemy.classType.toLowerCase();

  // Phase 1: Prepare - Show both units in standing position
  if (battleAnimationState.currentPhase === "prepare") {
    showStandingAnimations(attackerName, enemyClass, 
      {attackerX, enemyX, attackerY, enemyY}, 
      {attackerWidth, attackerHeight, enemyWidth, enemyHeight});
    
    // After 500ms, transition to player's attack
    if (timeSinceStart > 500) {
      battleAnimationState.currentPhase = "playerAttack";
      battleAnimationState.startTime = now;
      battleAnimationState.lastFrame = -1;
      
      // Preload player's attack animation
      const playerAttackType = battleAnimationState.willPlayerCrit ? "Critical" : "Attack";
      const nextAnim = attackingAnimationPaths[attackerName + playerAttackType];
      if (nextAnim) {
        nextAnim.reset();
        nextAnim.play();
      }
    }
  }
  
  // Phase 2: Player Attack - Show player's attack animation
  else if (battleAnimationState.currentPhase === "playerAttack") {
    // If player misses, show enemy dodge animation, otherwise show standing
    if (!battleAnimationState.willPlayerHit) {
      console.log(`${enemyClass} dodged ${attackerName}'s attack!`);
      handleDodgeAnimation(enemyClass, enemyX, enemyY, enemyWidth, enemyHeight, now, selectedCharacter, targetEnemy);
    } 
    else {
      image(attackingAnimationPaths[enemyClass + "Standing"], enemyX, enemyY, enemyWidth, enemyHeight);
      // Show critical text if this is a critical hit
      if (battleAnimationState.willPlayerCrit && UIImages.criticalText) {
        showCritText(false, now, attackerName, enemyClass);
      }
    }
    
    // Play player's attack animation
    const animState = handleAttackAnimation(attackerName, attackerX, attackerY, attackerWidth, attackerHeight, battleAnimationState.willPlayerCrit);
    
    // Detect animation completion
    if (animState.isComplete) {
      console.log(`Player attack animation completed. Last frame: ${battleAnimationState.lastFrame}, Current frame: ${animState.currentFrame}, Total frames: ${animState.totalFrames}`);
      
      battleAnimationState.currentPhase = "transitionToEnemy";
      battleAnimationState.startTime = now;
      battleAnimationState.lastFrame = -1;
      battleAnimationState.missTextStartTime = 0;  // Reset miss text timer
      battleAnimationState.critTextStartTime = 0;  // Reset crit text timer
      battleAnimationState.dodgeStartTime = 0; // Reset dodge start time for next phase
    }
    
    battleAnimationState.lastFrame = animState.currentFrame;
  }
  
  // Phase 3: Transition to Enemy - Brief pause between attacks
  else if (battleAnimationState.currentPhase === "transitionToEnemy") {
    // Show standing animations
    showStandingAnimations(attackerName, enemyClass, 
      {attackerX, enemyX, attackerY, enemyY}, 
      {attackerWidth, attackerHeight, enemyWidth, enemyHeight});
    
    // After 100ms, begin enemy's counter attack as long as within range
    if (timeSinceStart > 100) {
      // Calculate distance between attacker and target
      const distance = Math.abs(selectedCharacter.x - targetEnemy.x) + Math.abs(selectedCharacter.y - targetEnemy.y);
      
      // If distance is 2 and enemy is not a ranged unit (not Archer or Mage), skip to checkDoubles
      if (distance === 2 && targetEnemy.classType !== "Archer" && targetEnemy.classType !== "Mage") {
        battleAnimationState.currentPhase = "checkDoubles";
        battleAnimationState.startTime = now;
        battleAnimationState.lastFrame = -1;
      } 
      else {
        // Enemy can counterattack, proceed with enemy attack phase
        battleAnimationState.currentPhase = "enemyAttack";
        battleAnimationState.startTime = now;
        battleAnimationState.lastFrame = -1;
        
        // Reset and start enemy attack animation
        const enemyAttackType = battleAnimationState.willEnemyCrit ? "Critical" : "Attack";
        const enemyAnim = attackingAnimationPaths[enemyClass + enemyAttackType];
        enemyAnim.reset();
        enemyAnim.play();
      }
    }
  }
  
  // Phase 4: Enemy Attack - Show enemy's counterattack
  else if (battleAnimationState.currentPhase === "enemyAttack") {
    // If enemy misses, show player dodge animation, otherwise show standing
    if (!battleAnimationState.willEnemyHit) {
      console.log(`${attackerName} dodged ${enemyClass}'s attack!`);
      handleDodgeAnimation(attackerName, attackerX, attackerY, attackerWidth, attackerHeight, now, targetEnemy, selectedCharacter);
    } 
    else {
      image(attackingAnimationPaths[attackerName + "Standing"], attackerX, attackerY, attackerWidth, attackerHeight);
      // Show critical text if this is a critical hit
      if (battleAnimationState.willEnemyCrit && UIImages.criticalText) {
        showCritText(true, now, enemyClass, attackerName);
      }
    }
    
    // Play enemy's attack animation
    const animState = handleAttackAnimation(enemyClass, enemyX, enemyY, enemyWidth, enemyHeight, battleAnimationState.willEnemyCrit);

    // When animation reaches last frame, transition before it loops
    if (animState.currentFrame === animState.totalFrames - 1) {
      console.log(`Enemy attack animation completed. Current frame: ${animState.currentFrame}, Total frames: ${animState.totalFrames}`);
      
      battleAnimationState.currentPhase = "checkDoubles";
      battleAnimationState.startTime = now;
      battleAnimationState.lastFrame = -1;
      attackingAnimationPaths[enemyClass + (battleAnimationState.willEnemyCrit ? "Critical" : "Attack")].pause();
    }
    
    battleAnimationState.lastFrame = animState.currentFrame;
  }
  
  // Phase 5: Check for Double Attacks
  else if (battleAnimationState.currentPhase === "checkDoubles") {
    // Show standing animations
    showStandingAnimations(attackerName, enemyClass, 
      {attackerX, enemyX, attackerY, enemyY}, 
      {attackerWidth, attackerHeight, enemyWidth, enemyHeight});
      
      battleAnimationState.dodgeStartTime = 0; // Reset dodge start time for next phase

    
    // After 100ms, determine if there are double attacks
    if (timeSinceStart > 100) {
      // Check for double attacks based on speed
      const playerSpeedDiff = selectedCharacter.speed - targetEnemy.speed;
      const enemySpeedDiff = targetEnemy.speed - selectedCharacter.speed;
      
      if (playerSpeedDiff >= 4) {
        // Player is fast enough for a second attack
        battleAnimationState.currentPhase = "playerDouble";
        // Roll for hit and crit on second hit
        battleAnimationState.willPlayerSecondHit = random(100) < selectedCharacter.displayedHit;
        battleAnimationState.willPlayerSecondCrit = random(100) < selectedCharacter.displayedCrit;
        const playerAttackType = battleAnimationState.willPlayerSecondCrit ? "Critical" : "Attack";
        const nextAnim = attackingAnimationPaths[attackerName + playerAttackType];
        if (nextAnim) {
          nextAnim.reset();
          nextAnim.play();
        }
      } 
      else if (enemySpeedDiff >= 4) {
        // Enemy is fast enough for a second attack
        battleAnimationState.currentPhase = "enemyDouble";
        // Roll for hit and crit on second hit
        battleAnimationState.willEnemySecondHit = random(100) < targetEnemy.displayedHit;
        battleAnimationState.willEnemySecondCrit = random(100) < targetEnemy.displayedCrit;
        const enemyAttackType = battleAnimationState.willEnemySecondCrit ? "Critical" : "Attack";
        const nextAnim = attackingAnimationPaths[enemyClass + enemyAttackType];
        if (nextAnim) {
          nextAnim.reset();
          nextAnim.play();
        }
        battleAnimationState.missTextStartTime = 0;  // Reset miss text timer
        battleAnimationState.dodgeStartTime = 0; // Reset dodge start time for next phase
        battleAnimationState.critTextStartTime = 0; // Reset crit text timer
      } 
      else {
        // No double attacks, proceed to finish
        battleAnimationState.currentPhase = "conclude";
      }
      battleAnimationState.startTime = now;
      battleAnimationState.lastFrame = -1;
    }
  }
  
  // Phase 6a: Player Double Attack
  else if (battleAnimationState.currentPhase === "playerDouble") {
    // If player misses second hit, show enemy dodge animation, otherwise show standing
    if (!battleAnimationState.willPlayerSecondHit) {
      console.log(`${enemyClass} dodged ${attackerName}'s second attack!`);
      handleDodgeAnimation(enemyClass, enemyX, enemyY, enemyWidth, enemyHeight, now, selectedCharacter, targetEnemy, true);
    } 
    else {
      image(attackingAnimationPaths[enemyClass + "Standing"], enemyX, enemyY, enemyWidth, enemyHeight);
      // Show critical text if this is a critical hit
      if (battleAnimationState.willPlayerSecondCrit && UIImages.criticalText) {
        showCritText(false, now, attackerName, enemyClass);
      }
    }
    
    // Play player's second attack
    const animState = handleAttackAnimation(attackerName, attackerX, attackerY, attackerWidth, attackerHeight, battleAnimationState.willPlayerSecondCrit, true);

    // When animation completes, move to conclusion
    if (animState.isComplete) {
      console.log(`Player double attack animation completed. Last frame: ${battleAnimationState.lastFrame}, Current frame: ${animState.currentFrame}, Total frames: ${animState.totalFrames}`);
      
      battleAnimationState.currentPhase = "conclude";
      battleAnimationState.startTime = now;
      battleAnimationState.lastFrame = -1;
    }
    
    battleAnimationState.lastFrame = animState.currentFrame;
  }
  
  // Phase 6b: Enemy Double Attack
  else if (battleAnimationState.currentPhase === "enemyDouble") {
    // Show dodge animation for player if they dodge, otherwise show standing
    if (!battleAnimationState.willEnemySecondHit) {
      console.log(`${attackerName} dodged ${enemyClass}'s second attack!`);
      handleDodgeAnimation(attackerName, attackerX, attackerY, attackerWidth, attackerHeight, now, targetEnemy, selectedCharacter, true);
    } 
    else {
      image(attackingAnimationPaths[attackerName + "Standing"], attackerX, attackerY, attackerWidth, attackerHeight);
      // Show critical text if this is a critical hit
      if (battleAnimationState.willEnemySecondCrit && UIImages.criticalText) {
        showCritText(true, now, enemyClass, attackerName);
      }
    }
    
    // Play enemy's second attack
    const animState = handleAttackAnimation(enemyClass, enemyX, enemyY, enemyWidth, enemyHeight, battleAnimationState.willEnemySecondCrit, true);

    // When animation reaches last frame, transition before it loops
    if (animState.currentFrame === animState.totalFrames - 1) {
      console.log(`Enemy double attack animation completed. Current frame: ${animState.currentFrame}, Total frames: ${animState.totalFrames}`);
      
      battleAnimationState.currentPhase = "conclude";
      battleAnimationState.startTime = now;
      battleAnimationState.lastFrame = -1;
      attackingAnimationPaths[enemyClass + (battleAnimationState.willEnemySecondCrit ? "Critical" : "Attack")].pause();
    }
    
    battleAnimationState.lastFrame = animState.currentFrame;
  }
  
  // Phase 7: Conclude - Show final standing poses and reset up
  else if (battleAnimationState.currentPhase === "conclude") {
    // Show standing animations
    showStandingAnimations(attackerName, enemyClass, 
      {attackerX, enemyX, attackerY, enemyY}, 
      {attackerWidth, attackerHeight, enemyWidth, enemyHeight});
    
    if (timeSinceStart > 1000) {
      // Reset all battle states
      battleAnimationState.isPlaying = false;
      selectedCharacter.attackInterfaceConfirmed = false;
      selectedCharacter.action = null;
      selectedCharacter.isSelected = false;
      selectedCharacter.canMove = false;
      selectedCharacter.isGreyedOut = true;
      enemySelectedForAttack = false;
      
      // Restore music volume and character animation
      sounds.battleMusic.amp(0.5);
      animationManager(selectedCharacter, "standing");
    }
  }
}

// Draw battle interface with background and attack interface image
function drawBattleInterface(selectedCharacter, targetEnemy) {
  // Lower the music volume
  sounds.battleMusic.amp(0.3);

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

  // Draw DMG, HIT, and CRIT text for enemy side
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

// Main game loop for rendering everything on the screen
function draw() {
  // Only run if the game state is gameplay
  if (gameState === GAME_STATES.GAMEPLAY) {
    // Only handle game actions if turn image is not showing
    if (!showTurnImage) {
      // Handle cursor movement with WASD keys
      holdCursorMovement();
    }

    // Display all maptiles
    Tile.displayAll(tiles);

    // Highlight reachable tiles in blue and attackable tiles in red
    Tile.displayActionableTiles();

    // Draw movement preview for selected character only if it's not an enemy
    if (selectedCharacter && !selectedCharacter.isEnemy) {
      selectedCharacter.drawMovementPreview();
    }
   
    // Display all characters on the map
    for (let character of characters) {
      character.displayOnMap();
    }

    // Display turn phase image
    uiManager.displayTurnImage();

    // Only show cursor if turn image is not showing and is player turn
    if (!showTurnImage && isPlayerTurn) {
      locationCursor.renderCursor();

      // Only show tile and character info if no enemy is selected for attack
      if (!enemySelectedForAttack) {
        // Display tile location image 
        uiManager.displayTileLocationImage();

        // Check if cursor is over any character and display info
        for (let character of characters) {
          if (isCursorOverCharacter(character)) {
            uiManager.displayCharacterInfo(character);
            break;
          }
        }
      }
    }
   
    // Display the action menu
    actionMenu.display();

    // Find target enemy before calling battleInfoPreview or attack animation
    const targetEnemy = characters.find(
      char => char.isEnemy && char.x === locationCursor.x && char.y === locationCursor.y
    );
   
    // Display battle info preview if in attack mode and enemy is selected
    if (selectedCharacter && selectedCharacter.action === "attack" && enemySelectedForAttack) {
      if (selectedCharacter.attackInterfaceConfirmed) { 

        // Draw the battle interface
        drawBattleInterface(selectedCharacter, targetEnemy);

        // Only proceed if we have both characters
        if (selectedCharacter && targetEnemy) {
          handleBattleAnimation(selectedCharacter, targetEnemy);
        }
      } 
      else {
        // Show battle info preview
        if (selectedCharacter && targetEnemy) {
          selectedCharacter.attack(targetEnemy);
          targetEnemy.attack(selectedCharacter);
          uiManager.battleInfoPreview();
        }
      }
    }

    // Check and handle turn system
    handleTurnSystem();
  }
}