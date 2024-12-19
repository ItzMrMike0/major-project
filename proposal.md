# Project Proposal: Fire Emblem 
A Fire Emblem clone which is a tactical RPG game featuring strategic, grid-based gameplay that allows players to move characters across a map, engage in turn-based combat, and make strategic decisions on both offense and defense. 

The game will include a variety of character classes with distinct abilities, a dynamic battle system where positioning, terrain, and stats play key roles, and a campaign that challenges the player's ability to adapt to different tactical situations. 

Players will control a group of heroes, each with unique skills and strengths, and face off against enemies with AI tactics. 

Winning will rely not only on combat prowess but also on strategic planning and managing resources.

## Needs to Have List
🔴 = Not done, 🟡 = Working on, 🟢 = Completed

### 1: Map Creation
- Grid-based map system. 🟢
- Load maps using external .txt files. 🟢
- Some tiles are impassable (e.g., walls, water). 🟢
- Certain tiles provide bonuses (e.g., increased defense or evasion). 🔴
- Highlight movement range and attack range tiles when character selected. 🟢

### 2: Turn-Based Actions
- Select individual characters to view stats or perform actions. 🟡
- Swap between player turn and enemy turn. 🟢
- Action options: 🟡
  - Move: Select a tile to move to. 🟢
  - Attack: Choose a target within attack range. 🔴
  - Items: Use or equip items during a turn. 🔴
- Undo move option (before confirming an action). 🟢
- Win condition (Completely defeat all enemy characters) 🔴

### 3: Characters
- Characters with unique stats, animations, and abilities. 🟡
- Core stats include HP, strength, skill, speed, luck, defense, resistance. 🟡
- Derived stats like critical rate or hit rate. 🔴
- Assign classes with unique traits (e.g., archers, mages, knights). 🟢
- Include movement, selection, and idle animations. 🟢

### 4: Battle System
- Transition to a new scene or overlay for battle sequences. 🔴
- Display calculated values such as damage dealt, hit percentage, and critical chance. 🔴
- Add animations for attacking, defending, and taking damage. 🔴
- Include death animations for defeated characters. 🔴 
- Highlight critical hits with unique animations and sound effects. 🔴
- Show distinct effects for missed attacks. 🔴

### 5: Enemy AI
- Implement enemy AI to make tactical decisions. 🟢
- AI actions: 🟡
  - Move toward player characters within range. 🟡
  - Attack player characters within range. 🔴

### 6: Sound Effects
- Add background music with smooth transitions. 🟡
- Include sound effects for movement, attacks, and menu interactions. 🟡

## Nice to Have List
- Options Menu which contains settings including (End Turn: Manually end the player's turn.) 🔴
- Difficulty levels (e.g., aggressive, defensive, balanced). 🔴
- Adaptive AI that evaluates tile advantages or target vulnerabilities. 🔴
- Different enemy types with varying priorities (e.g., targeting low-health units). 🔴
- Weather systems such as rain, fog, or snow. 🔴
- Impact of weather on visibility, stats, or movement range. 🔴
- Simple cutscenes with dialogue boxes for character interactions. 🔴
- Choices that affect gameplay or outcomes. 🔴
- Multiple maps or scenarios to increase replayability. 🔴
- Inventory management system for equipping, using, and organizing items. 🔴
- Save/load system with multiple slots. 🔴
- Implement voiceovers for character actions like attacks or item use. 🟡
- Level-up system with randomized or semi-randomized stat increases. 🔴