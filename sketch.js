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

  // Display tile location image based on cursor position
  static displayTileLocationImage() {
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

      // 20 pixels from top or bottom
      const yPosition = isAboveMiddle ? height - imageHeight - 20 : 20; 
      
      // Draw the image
      image(UIImages[imageKey], 0, yPosition, imageWidth, imageHeight);
      
      // Disable smoothing again for game elements
      noSmooth();
    }
  }
}  

// Character Class: Represents a character on the map, including their properties, state, and actions
class Character {
  constructor(name, classType, x, y, level, hp, strength, skill, speed, luck, defense, resistance, isEnemy, width = 50, height = 50) {
    // Basic properties
    this.name = name; // Name of character
    this.classType = classType; // Character class (Lord, Knight, etc)
    this.x = x; // X position on the tile grid
    this.y = y; // Y position on the tile grid
    this.level = level; // Character's level
    this.hp = hp; // HP stat
    this.strength = strength; // Strength stat
    this.skill = skill; // Skill stat
    this.speed = speed; // Speed stat
    this.luck = luck; // Luck stat
    this.defense = defense; // Physical defense stat
    this.resistance = resistance; // Magical defense stat
    this.isEnemy = isEnemy; // Is this character an enemy

    // Visual and gameplay properties
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
        data.strength, data.skill, data.speed, data.luck, data.defense,
        data.resistance, data.isEnemy, data.width, data.height
      );
    }
    else {
      character = new Character(
        data.name, data.classType, data.x, data.y, data.level, data.hp,
        data.strength, data.skill, data.speed, data.luck, data.defense,
        data.resistance, data.isEnemy, data.width, data.height
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

  // Calculate reachable and attackable tiles using Dijkstra's algorithm
  calculateActionableTiles() {
    // Arrays to store reachable tiles (within movement range) and attackable tiles
    this.reachableTiles = [];
    this.attackableTiles = [];

    // Retrieve the character's movement and attack ranges
    const movementRange = this.getMovementRange();
    const attackRange = this.getAttackRange();

    // Initialize a set to track visited tiles and a queue for Dijkstra's algorithm, starting with the character's position
    const visited = new Set([`${this.x},${this.y}`]);
    const movementQueue = [{ x: this.x, y: this.y, cost: 0 }];

    // Calculate all tiles within movement range
    while (movementQueue.length > 0) {
      // Sort queue by movement cost to process the lowest cost tile first
      movementQueue.sort((a, b) => a.cost - b.cost);
      const current = movementQueue.shift(); // Dequeue the current tile
      const { x, y, cost } = current;

      // Add the tile to reachable tiles if within movement range and not blocked by an enemy
      if (cost <= movementRange && !Tile.isTileBlockedByEnemy(x, y)) {
        this.reachableTiles.push({ x, y });
      }

      // Stop processing this path if the movement range is exceeded
      if (cost >= movementRange) {
        continue;
      }

      // Define the four possible movement directions (up, down, left, right)
      const directions = [
        { x: x, y: y - 1 }, // up
        { x: x, y: y + 1 }, // down
        { x: x + 1, y: y }, // right
        { x: x - 1, y: y }  // left
      ];

      for (const dir of directions) {
        const nextX = dir.x;
        const nextY = dir.y;
        const nextKey = `${nextX},${nextY}`; // Unique key for the next position

        // Skip if the tile is out of bounds, already visited, not walkable, or blocked by an enemy
        if (!Tile.isWithinMapBounds(nextX, nextY) ||
            visited.has(nextKey) ||
            !tiles[nextY][nextX].isWalkable() ||
            Tile.isTileBlockedByEnemy(nextX, nextY)) {
          continue;
        }

        // Queue the adjacent tile with updated movement cost and mark it as visited
        movementQueue.push({ x: nextX, y: nextY, cost: cost + 1 });
        visited.add(nextKey);
      }
    }

    // Calculate all tiles within attack range from every reachable tile
    const attackVisited = new Set(); // Track visited tiles for attack range calculation

    for (const pos of this.reachableTiles) {
      // Initialize a queue for attack range exploration starting from the reachable position
      const attackQueue = [{ x: pos.x, y: pos.y, cost: 0 }];
      attackVisited.clear(); // Reset visited tiles for this reachable position
      attackVisited.add(`${pos.x},${pos.y}`); // Mark the initial position as visited

      while (attackQueue.length > 0) {
        const current = attackQueue.shift(); // Dequeue the current tile
        const { x, y, cost } = current;

        // Add the tile to attackable tiles if within attack range and not already in reachable tiles
        if (cost > 0 && cost <= attackRange &&
            tiles[y][x].isWalkable() &&
            !this.reachableTiles.some(tile => tile.x === x && tile.y === y)) {
          this.attackableTiles.push({ x, y });
        }

        // Stop processing this path if the attack range is exceeded
        if (cost >= attackRange) {
          continue;
        }

        // Define the four possible attack directions (up, down, left, right)
        const directions = [
          { x: x, y: y - 1 }, // up
          { x: x, y: y + 1 }, // down
          { x: x + 1, y: y }, // right
          { x: x - 1, y: y }  // left
        ];

        for (const dir of directions) {
          const nextX = dir.x;
          const nextY = dir.y;
          const nextKey = `${nextX},${nextY}`; // Unique key for the next position

          // Skip if the tile is out of bounds, already visited, or not walkable
          if (!Tile.isWithinMapBounds(nextX, nextY) ||
              attackVisited.has(nextKey) ||
              !tiles[nextY][nextX].isWalkable()) {
            continue;
          }

          // Queue the adjacent tile for attack range exploration and mark it as visited
          attackQueue.push({ x: nextX, y: nextY, cost: cost + 1 });
          attackVisited.add(nextKey);
        }
      }
    }

    // Remove duplicate entries from attackable tiles as reachable tiles takes precedence
    this.attackableTiles = Array.from(new Set(this.attackableTiles.map(tile => `${tile.x},${tile.y}`)))
      .map(key => {
        const [x, y] = key.split(',').map(Number); // Convert string keys back to tile coordinates
        return { x, y };
      });
  }

  // Move the character to a new location gradually
  moveTo(newX, newY, isEnemy = false) {
    // Save the previous position
    this.previousX = this.x;
    this.previousY = this.y;

    // Check if character is actually moving to a new position
    const isActuallyMoving = (newX !== this.x || newY !== this.y);

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
      const neighbors = [
        { x: current.x, y: current.y - 1 }, // up
        { x: current.x, y: current.y + 1 }, // down
        { x: current.x + 1, y: current.y }, // right
        { x: current.x - 1, y: current.y }  // left
      ];

      for (const neighbor of neighbors) {
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

  // Attack logic for the character
  attack() {
    // Logic for attacking
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
        stroke(255, 255, 0, 200);
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
          fill(255, 255, 0, 200);
          noStroke();
          const arrowSize = 30;
          triangle(0, 0, -arrowSize, -arrowSize/2, -arrowSize, arrowSize/2);
          pop();
        }
      }
    }
  }
}

// EnemyCharacter Class: Extends Character with enemy-specific behavior
class EnemyCharacter extends Character {
  constructor(name, classType, x, y, level, hp, strength, skill, speed, luck, defense, resistance, isEnemy, width = 50, height = 50) {
    super(name, classType, x, y, level, hp, strength, skill, speed, luck, defense, resistance, isEnemy, width, height);
  }

  // Check if a player has adjacent enemies
  hasAdjacentEnemies(player) {
    const adjacentPositions = [
      { x: player.x, y: player.y - 1 }, // up
      { x: player.x, y: player.y + 1 }, // down
      { x: player.x + 1, y: player.y }, // right
      { x: player.x - 1, y: player.y }  // left
    ];

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
  constructor(x = 2, y = 12) {
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

// Display turn phase image in the center of screen
function displayTurnImage() {
  // Enable smoothing for UI elements
  smooth();

  // Image dimensions
  let imgWidth = 600;  
  let imgHeight = 125;

  // Show image in the middle of the screen after 2 seconds
  if (showTurnImage) {
    if (millis() - turnImageTimer < 2000) {
      if (isPlayerTurn) {
        // Player turn
        image(UIImages["playerTurn"], width/2 - imgWidth/2, height/2 - imgHeight/2, imgWidth, imgHeight);
      }
      else {
        // Enemy turn
        image(UIImages["enemyTurn"], width/2 - imgWidth/2, height/2 - imgHeight/2, imgWidth, imgHeight);
      }
    }
    else {
      showTurnImage = false;
    }
  }

  // Disable smoothing again for game elements
  noSmooth();
}

// Allows user to hold down movement keys for continuous movement
function holdCursorMovement() {
  // Don't move cursor if action menu is open, character is moving, or during enemy turn
  if (actionMenu.isVisible || selectedCharacter?.isMoving || !isPlayerTurn) {
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
          selectedCharacter.action = "wait";
          actionMenu.hide();
          Character.unselectCharacter(false);
          sounds.selectOption.play();
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
   
    // If there is a selected character and it's not an enemy, move the character
    if (selectedCharacter && !selectedCharacter.isEnemy) {
      Character.moveSelectedCharacter(locationCursor, tiles);
    }
    // If there is not a selected character, select character
    else if (!selectedCharacter) {
      Character.selectCharacter();
    }
  }
  // If k is pressed and there is a selected character that's not moving, unselect them
  else if (key === "k" && selectedCharacter && !selectedCharacter.isMoving) {
    Character.unselectCharacter(true);
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

// Display character info when hovering
function displayCharacterInfo(character) {
  // Enable smoothing for UI elements
  smooth();
  
  // Set up rectangle properties
  const rectWidth = 400; 
  const rectHeight = 120;
  const rectX = width - rectWidth - 20; // 20 pixels from right edge
  const rectY = 20; // 20 pixels from top
  
  // Draw outer border (white)
  stroke(243, 255, 255);
  strokeWeight(2);
  noFill();
  rect(rectX, rectY, rectWidth, rectHeight);
  
  // Draw inner border (blue-grey)
  stroke(127, 148, 209);
  strokeWeight(1);
  rect(rectX + 2, rectY + 2, rectWidth - 4, rectHeight - 4);
  
  // Draw main rectangle (light blue)
  fill(193, 214, 255, 180);
  noStroke();
  rect(rectX + 3, rectY + 3, rectWidth - 6, rectHeight - 6);

  // Draw portrait of character
  let portraitKey;
  if (character.isEnemy) {
    // For enemies, use their class type
    portraitKey = character.classType.toLowerCase() + "Portrait";
  } 
  else {
    // For player characters, use their name
    portraitKey = character.name.toLowerCase() + "Portrait";
  }

  if (portraitImages[portraitKey]) {
    const portraitHeight = rectHeight - 12;
    const portraitWidth = portraitHeight * 1.2;
    
    // Set up variables for portrait position and size
    let finalWidth = portraitWidth;
    let finalHeight = portraitHeight;
    let xOffset = 6;
    let yOffset = 3;

    // Scale down fighter portrait by 15% 
    if (portraitKey === "fighterPortrait") {
      finalWidth *= 0.9;  // 85% of original size
      finalHeight *= 0.9;
      xOffset = 15;  // Move more to the right
      yOffset = 13;  // Move more down (increased from 10 to 15)
    }
    
    // Display the portrait
    image(portraitImages[portraitKey], rectX + xOffset, rectY + yOffset, finalWidth, finalHeight);
  }
  
  // Disable smoothing again for game elements
  noSmooth();
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
    displayTurnImage();

    // Only show cursor if turn image is not showing and is player turn
    if (!showTurnImage && isPlayerTurn) {
      locationCursor.renderCursor();

      // Display tile location image 
      Tile.displayTileLocationImage();

      // Check if cursor is over any character and display info
      for (let character of characters) {
        if (isCursorOverCharacter(character)) {
          displayCharacterInfo(character);
          break;
        }
      }
    }
   
    // Display the action menu
    actionMenu.display();
   
    // Check and handle turn system
    handleTurnSystem();
  }
}