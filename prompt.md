Prompt for AI Developer Agent
You're an experienced game developer helping me build a browser-based tycoon/management game called Western Blacksmith. The game is set in 1900s Western America and styled like a spreadsheet/tycoon sim, with simple menus, tables, and progress bars. The tech stack is vanilla HTML, CSS, and JavaScript. Please follow the modular structure described below and begin scaffolding out each system.

🎯 Game Overview
The player starts as a solo blacksmith running a small forge.

They can:

Buy materials (iron, wood, coal, etc.) from local sources (timed deliveries).

Craft tools (e.g., pickaxes, hatchets, bullets) using recipes and coal.

Place items into a storefront where customers can passively buy them.

Accept contracts from local companies (e.g., mining company) for bulk tool orders.

Unlock new recipes (via blueprints/molds).

Hire workers to automate production with light fatigue mechanics.

There is:

No quality system (items don’t vary in quality).

Tool durability (items used in crafting wear out over time).

Coal usage represented by a progress bar. At 20%, coal is refilled automatically by the player or a worker.

Uncommon events (e.g., mine collapse increases pickaxe demand).

No politics or rep system — all content is available from the start.

Game uses a time-based system for crafting, delivery, and customer flow.

All UI is click-driven, spreadsheet-style, not real-time 3D.

🗂️ Required Project Structure
Please generate the following folders and files:

css
Copy
Edit
/western-blacksmith
│
├── public/
│   └── index.html
│
├── src/
│   ├── main.js
│   ├── data/
│   │   ├── items.js
│   │   ├── contracts.js
│   │   └── events.js
│   ├── systems/
│   │   ├── InventorySystem.js
│   │   ├── CraftingSystem.js
│   │   ├── StorefrontSystem.js
│   │   ├── ContractSystem.js
│   │   ├── BlueprintSystem.js
│   │   ├── WorkerSystem.js
│   │   ├── CoalSystem.js
│   │   ├── EventSystem.js
│   │   ├── ToolDurability.js
│   │   └── TimeSystem.js
│   ├── ui/
│   │   ├── UIManager.js
│   │   ├── ModalManager.js
│   │   └── Notifications.js
│   └── utils/
│       ├── EventEmitter.js
│       └── SaveSystem.js
│
├── styles/
│   └── main.css
│
└── README.md
🧱 Development Rules
Focus on modular, clean code with systems importing each other. Maximum 500 lines of code per file.

Add useful comments and placeholder content where needed.

UI should be retro-western minimal, focusing on functionality and depth over style.

Use EventEmitter to coordinate between systems (e.g. when crafting completes or coal hits 20%).

Allow all content to be unlocked from the start (no rep gates).

Each crafted item should consume materials, coal, and wear down tools.

All timers should be real-time using setInterval or requestAnimationFrame.

✅ PHASE 1: CORE SCHEMATICS — Foundation Setup
🔧 1. Basic HTML + Entry Point
index.html

Create div containers for:

Materials Inventory

Crafting Queue

Forge Status (coal bar)

Storefront

Contracts

Employees

Notifications log

Add <script type="module" src="/src/main.js"></script>

main.js

Import systems

Instantiate major systems

Setup game loop or tick system (via setInterval)

Load initial data from items.js, contracts.js, etc.

🧱 PHASE 2: CORE SYSTEMS — Sim Logic
🛠️ 2. InventorySystem.js
Store structure:

js
Copy
Edit
{
  materials: { iron: 50, coal: 10, wood: 25, gunpowder: 5 },
  items: { pickaxe: 2, hatchet: 3 },
  tools: { hammer: { uses: 25, maxUses: 30 } }
}
Provide methods:

addMaterial(name, amount)

consumeMaterial(name, amount)

addCraftedItem(itemName)

getAvailableItems()

🔥 3. CoalSystem.js
Create a forgeHeat value that:

Depletes slowly over time

Refills automatically when it hits 20%

Workers or player can add coal (if available in inventory)

⚒️ 4. CraftingSystem.js
Use data from items.js to define recipes

Allow crafting via startCrafting(itemName)

Crafting:

Consumes materials

Takes time (timer)

Uses up a tool (via ToolDurability.js)

Checks if coal is sufficient (via CoalSystem.js)

🪓 5. ToolDurability.js
Each crafting job wears down a tool (e.g., hammer)

When a tool hits 0 uses:

Auto-remove it from the inventory

Player must craft or buy a replacement

🧰 6. BlueprintSystem.js
Initially, only basic blueprints are available

Players unlock more by purchasing molds

Blueprints live in items.js, unlocked via array like unlockedBlueprints

💰 PHASE 3: ECONOMY SYSTEMS
🛒 7. StorefrontSystem.js
Any crafted items placed into storefront

Every 30–60 seconds:

Simulate a chance for customer visits

Random chance to buy an available item

Log sales to console or notification area

📜 8. ContractSystem.js
Pull contracts from contracts.js every 3 minutes

Contracts include:

Requested item

Quantity

Expiry time

Payout

Fulfilled manually by the player

🧍‍♂️ 9. WorkerSystem.js
Workers can:

Auto-craft one item at a time

Refill coal if it hits 20%

Fatigue reduces their crafting speed

UI shows current task + fatigue level

⚡ PHASE 4: EVENT & TIMING SYSTEMS
⏱️ 10. TimeSystem.js
Global game clock (1 second = 1 minute in-game)

Tracks:

Crafting timers

Shipment arrivals

Event triggers

🌪️ 11. EventSystem.js
Rare events (~5% chance per in-game hour)

Examples:

“Mine Collapse” → temporary surge in pickaxe demand

“Railroad Boom” → new contract appears for 10 rifles

Use modal system or banner for announcements

🧠 PHASE 5: USER INTERFACE & UTILITIES
🧩 12. UIManager.js
Render:

Materials

Forge status

Crafting queue

Workers and fatigue

Storefront inventory

Notifications

🪟 13. ModalManager.js
Show popups:

Contract offers

Blueprint purchases

Event alerts

🗨️ 14. Notifications.js
Toast messages / logs:

“+1 Pickaxe sold for $12”

“Coal refilled by apprentice”

“Tool broke: Hammer worn out”

🧰 PHASE 6: UTILITIES
🧠 15. EventEmitter.js
on(eventName, callback)

emit(eventName, data)

Used for decoupling game systems

💾 16. SaveSystem.js
Save inventory, unlocked blueprints, workers, money

Auto-save every 60 seconds using localStorage

✨ Final Polishing
🎨 Styles (main.css)
Simple UI, styled like a ledger or western register

Progress bars for crafting, coal

Scrollable logs, contract panels, storefront

