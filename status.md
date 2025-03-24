# Western Blacksmith - Project Status

## Overview

Western Blacksmith is a browser-based tycoon/management game set in 1900s Western America. The game is built using vanilla HTML, CSS, and JavaScript, with a modular architecture that separates game systems into distinct components.

## Current File Structure

```
/western-blacksmith
│
├── public/
│   └── index.html               ✅ Complete
│
├── src/
│   ├── main.js                  ✅ Complete
│   ├── data/
│   │   ├── items.js             ✅ Complete
│   │   ├── contracts.js         ✅ Complete
│   │   └── events.js            ✅ Complete
│   ├── systems/
│   │   ├── InventorySystem.js   ✅ Complete
│   │   ├── CraftingSystem.js    ✅ Complete
│   │   ├── StorefrontSystem.js  ✅ Complete
│   │   ├── ContractSystem.js    ✅ Complete
│   │   ├── BlueprintSystem.js   ✅ Complete
│   │   ├── WorkerSystem.js      ✅ Complete
│   │   ├── CoalSystem.js        ✅ Complete
│   │   ├── EventSystem.js       ✅ Complete
│   │   ├── ToolDurability.js    ✅ Complete
│   │   └── TimeSystem.js        ✅ Complete
│   ├── ui/
│   │   ├── UIManager.js         ✅ Complete
│   │   ├── ModalManager.js      ✅ Complete
│   │   └── Notifications.js     ✅ Complete
│   └── utils/
│       ├── EventEmitter.js      ✅ Complete
│       └── SaveSystem.js        ✅ Complete
│
├── styles/
│   └── main.css                 ✅ Complete
│
└── README.md                    ✅ Complete
```

## Completed Components

### Core HTML Structure
The `index.html` file contains the basic structure for the game UI, including sections for:
- Materials inventory
- Forge status (coal bar)
- Tools
- Crafting interface
- Storefront
- Contracts
- Employees
- Blueprints
- Notifications log

### Core Game Systems

#### EventEmitter
A central event bus that allows game systems to communicate with each other without tight coupling.

#### InventorySystem
Manages all player-owned materials, crafted items, tools, and money. Handles adding, removing, and checking availability of resources.

#### CoalSystem
Manages the forge's heat level, which depletes over time and needs to be refilled with coal from the inventory.

#### ToolDurability
Tracks wear and tear on tools, which degrade with use during crafting and eventually break.

#### CraftingSystem
Handles creating items, consuming materials, using tools, and managing the crafting queue.

#### BlueprintSystem
Manages recipe unlocks, allowing players to purchase new item blueprints.

#### StorefrontSystem
Handles displaying crafted items for sale and simulates customer visits and purchases.

#### ContractSystem
Manages contracts for bulk orders with time constraints, offering higher payouts than regular sales.

#### WorkerSystem
Handles hiring, firing, and management of workers who can automate tasks with a fatigue mechanic.

#### EventSystem
Manages random events that temporarily affect the game world, creating special opportunities.

#### TimeSystem
Controls the flow of time in the game, tracking days, hours, and minutes, and triggering time-based events.

### UI Components

#### UIManager
Handles rendering the game interface and updating the display based on game state changes.

#### ModalManager
Manages modal dialogs for interactions like contract offers, blueprint purchases, and event announcements.

#### Notifications
Displays toast messages and maintains a log of game notifications.

### Utility Components

#### SaveSystem
Handles saving and loading game state to and from localStorage, with auto-save functionality.

### Data Files

#### items.js
Defines all craftable items, materials, and their properties including recipes, crafting times, and tool requirements.

#### contracts.js
Defines all possible contracts that can appear in the game and functions for generating and calculating payouts.

#### events.js
Defines random events that can occur during gameplay, along with their durations and effects.

### Styling

#### main.css
Contains all the CSS styling for the game, with a retro-western theme that focuses on functionality.

## Game Features Implemented

1. **Resource Management**
   - Purchase and track materials like iron, coal, wood, leather
   - Money management system

2. **Crafting System**
   - Recipe-based crafting with material consumption
   - Time-based crafting queue
   - Tool durability mechanics

3. **Coal System**
   - Depleting coal level for the forge
   - Automatic coal refill at threshold
   - Coal consumption during crafting

4. **Storefront**
   - Place crafted items for sale
   - Customer visit simulation
   - Variable item demand

5. **Contract System**
   - Generated contracts with time limits
   - Higher payouts for fulfillment
   - Special event contracts

6. **Worker System**
   - Hiring different worker types
   - Assigning tasks to workers
   - Fatigue mechanic
   - Worker salary expenses

7. **Blueprint System**
   - Unlockable new item recipes
   - Blueprint purchasing interface

8. **Event System**
   - Random events affecting game economy
   - Temporary effects on demand and prices
   - Special contract opportunities

9. **Time System**
   - Game clock with day/night cycle
   - Time-based event triggers
   - Contract deadline tracking

10. **Save System**
    - Game state persistence via localStorage
    - Auto-save functionality
    - Multiple save slots

## Next Steps

1. **Testing and Balancing**
   - Test all game systems together
   - Balance economic values
   - Ensure proper difficulty progression

2. **Code Optimization**
   - Improve performance
   - Optimize event handling

3. **Enhanced Visual Feedback**
   - Add more visual feedback for player actions
   - Improve UI transitions

4. **Content Expansion**
   - Add more recipes, events, and contracts
   - Implement seasonal events

5. **Deployment**
   - Host on GitHub Pages or similar platform
   - Add analytics

## Technical Notes

- The game uses a modular architecture with loose coupling between systems
- All systems communicate through the central EventEmitter
- ES6 modules are used for code organization
- Game state is persisted using localStorage
- No external libraries or frameworks are used