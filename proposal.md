# Project Proposal: Tactical Turn-Based RPG Game
A Fire Emblem-style game, featuring strategic grid-based gameplay, turn-based mechanics, and RPG elements.

## Needs to Have List

### 1: Map Creation
- Grid-based map system.
- Load maps using external .txt files.
- Some tiles are impassable (e.g., walls, water).
- Certain tiles provide bonuses (e.g., increased defense or evasion).
- Highlight movement range and attack range tiles dynamically.

### 2: Turn-Based Actions
- Swap between player turn and enemy turn.
- Action options:
  - Move: Select a tile to move to.
  - Attack: Choose a target within attack range.
  - Items: Use or equip items during a turn.
  - End Turn: Manually end the player's turn.
- Undo move option (before confirming an action).

### 3: Characters
- Characters with unique stats, animations, and abilities.
- Select individual characters to view stats or perform actions.
- Core stats include HP, attack, defense, speed, and evasion.
- Derived stats like critical rate or hit rate.
- Level-up system with randomized or semi-randomized stat increases.
- Assign classes with unique traits (e.g., archers, mages, knights).
- Include movement, selection, and idle animations.

### 4: Battle System
- Transition to a new scene or overlay for battle sequences.
- Display calculated values such as damage dealt, hit percentage, and critical chance.
- Add animations for attacking, defending, and taking damage.
- Include death animations for defeated characters.
- Highlight critical hits with unique animations and sound effects.
- Show distinct effects for missed attacks.

### 5: Enemy AI
- Implement enemy AI to make tactical decisions.
- AI actions:
  - Move toward player characters within range.
  - Attack player characters within range.

### 6: Sound Effects
- Add background music with smooth transitions (e.g., calm and battle phases).
- Include sound effects for movement, attacks, and menu interactions.
- Implement voiceovers for character actions like attacks or item use.

## Nice to Have List

### 1: Enhanced AI
- Difficulty levels (e.g., aggressive, defensive, balanced).
- Adaptive AI that evaluates tile advantages or target vulnerabilities.
- Different enemy types with varying priorities (e.g., targeting low-health units).

### 2: Environmental Effects
- Weather systems such as rain, fog, or snow.
- Impact of weather on visibility, stats, or movement range.

### 3: Story and Dialogue
- Simple cutscenes with dialogue boxes for character interactions.
- Choices that affect gameplay or outcomes.

### 4: Gameplay Expansion
- Multiple maps or scenarios to increase replayability.
- Inventory management system for equipping, using, and organizing items.
- Save/load system with multiple slots.

### 5: Visual and Presentation Upgrades
- Dynamic camera zoom and pan effects during movement and combat.
- Allow players to customize character appearances, names, or stats.