// Western Blacksmith - Main Entry Point
import { InventorySystem } from './systems/InventorySystem.js';
import { CoalSystem } from './systems/CoalSystem.js';
import { CraftingSystem } from './systems/CraftingSystem.js';
import { StorefrontSystem } from './systems/StorefrontSystem.js';
import { ContractSystem } from './systems/ContractSystem.js';
import { BlueprintSystem } from './systems/BlueprintSystem.js';
import { WorkerSystem } from './systems/WorkerSystem.js';
import { EventSystem } from './systems/EventSystem.js';
import { ToolDurability } from './systems/ToolDurability.js';
import { TimeSystem } from './systems/TimeSystem.js';

import { UIManager } from './ui/UIManager.js';
import { ModalManager } from './ui/ModalManager.js';
import { Notifications } from './ui/Notifications.js';

import { EventEmitter } from './utils/EventEmitter.js';
import { SaveSystem } from './utils/SaveSystem.js';

// Import game data
import { items } from './data/items.js';
import { contracts } from './data/contracts.js';
import { events } from './data/events.js';

class Game {
    constructor() {
        // Initialize event system first to allow other systems to register listeners
        this.eventEmitter = new EventEmitter();
        
        // Initialize core systems
        this.inventory = new InventorySystem(this.eventEmitter);
        this.coal = new CoalSystem(this.eventEmitter, this.inventory);
        this.toolDurability = new ToolDurability(this.eventEmitter, this.inventory);
        this.crafting = new CraftingSystem(this.eventEmitter, this.inventory, this.coal, this.toolDurability, items);
        this.blueprints = new BlueprintSystem(this.eventEmitter, items);
        
        // Initialize economy systems
        this.storefront = new StorefrontSystem(this.eventEmitter, this.inventory);
        this.contracts = new ContractSystem(this.eventEmitter, this.inventory, contracts);
        this.workers = new WorkerSystem(this.eventEmitter, this.crafting, this.coal);
        
        // Initialize event and timing systems
        this.time = new TimeSystem(this.eventEmitter);
        this.events = new EventSystem(this.eventEmitter, events);
        
        // Initialize UI systems
        this.notifications = new Notifications(this.eventEmitter);
        this.modalManager = new ModalManager(this.eventEmitter);
        this.ui = new UIManager(
            this.eventEmitter, 
            this.inventory, 
            this.coal, 
            this.crafting, 
            this.blueprints, 
            this.storefront, 
            this.contracts, 
            this.workers,
            this.time
        );
        
        // Initialize save system
        this.saveSystem = new SaveSystem(
            this.eventEmitter,
            {
                inventory: this.inventory,
                coal: this.coal,
                blueprints: this.blueprints,
                contracts: this.contracts,
                workers: this.workers,
                time: this.time
            }
        );
        
        // Start the game
        this.init();
    }
    
    init() {
        console.log("Western Blacksmith game initializing...");
        
        // Load saved game if available
        this.saveSystem.loadGame();
        
        // Start the game time
        this.time.start();
        
        // Setup game tick
        this.setupGameLoop();
        
        // Setup UI
        this.ui.initialize();
        
        // Setup event listeners
        this.setupEventListeners();
        
        console.log("Game initialized successfully!");
        this.notifications.add("Welcome to your Blacksmith shop!");
    }
    
    setupGameLoop() {
        // Game tick runs every 1000ms (1 second)
        setInterval(() => {
            this.tick();
        }, 1000);
    }
    
    tick() {
        // Update all systems
        this.coal.update();
        this.crafting.update();
        this.storefront.update();
        this.contracts.update();
        this.workers.update();
        this.events.update();
        
        // Update UI
        this.ui.update();
    }
    
    setupEventListeners() {
        // Listen for global game events
        this.eventEmitter.on('coal:low', () => {
            this.notifications.add("Coal is running low! Consider refilling.");
        });
        
        this.eventEmitter.on('tool:broken', (toolName) => {
            this.notifications.add(`Your ${toolName} has broken! You'll need a replacement.`);
        });
        
        this.eventEmitter.on('item:crafted', (itemName) => {
            this.notifications.add(`Crafted 1 ${itemName}.`);
        });
        
        this.eventEmitter.on('item:sold', (itemName, price) => {
            this.notifications.add(`Sold 1 ${itemName} for $${price.toFixed(2)}.`);
        });
        
        this.eventEmitter.on('contract:available', (contract) => {
            this.notifications.add(`New contract available: ${contract.quantity}x ${contract.item}`);
            this.modalManager.showContractModal(contract);
        });
        
        this.eventEmitter.on('contract:completed', (contract) => {
            this.notifications.add(`Contract completed: ${contract.quantity}x ${contract.item} for $${contract.payout.toFixed(2)}`);
        });
        
        this.eventEmitter.on('event:triggered', (event) => {
            this.notifications.add(`EVENT: ${event.name} - ${event.description}`);
            this.modalManager.showEventModal(event);
        });
    }
}

// Initialize the game when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});