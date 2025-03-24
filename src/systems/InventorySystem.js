/**
 * Inventory System
 * 
 * Manages all player-owned materials, crafted items, and tools.
 * Handles adding/removing items and checks for resource availability.
 */
export class InventorySystem {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        
        // Default starting inventory
        this.materials = {
            iron: 50,
            coal: 25,
            wood: 30,
            leather: 10,
            gunpowder: 5,
            copper: 20,
            silver: 5,
            gold: 1
        };
        
        // Crafted items inventory
        this.items = {
            pickaxe: 1,
            hatchet: 1,
            horseshoe: 2
        };
        
        // Tools with durability
        this.tools = {
            hammer: { uses: 25, maxUses: 30 },
            anvil: { uses: 50, maxUses: 50 },
            tongs: { uses: 40, maxUses: 40 }
        };
        
        // Money/currency
        this.money = 100.00;
        
        // Register event listeners
        this.registerEventListeners();
    }
    
    /**
     * Register event listeners
     */
    registerEventListeners() {
        // Listen for when materials are purchased
        this.eventEmitter.on('purchase:materials', (materials, cost) => {
            // Deduct money first
            if (!this.removeMoney(cost)) {
                this.eventEmitter.emit('notification:error', "Not enough money to purchase materials.");
                return;
            }
            
            // Add materials to inventory
            for (const [material, amount] of Object.entries(materials)) {
                this.addMaterial(material, amount);
            }
            
            this.eventEmitter.emit('inventory:updated');
            this.eventEmitter.emit('notification:success', `Purchased materials for $${cost.toFixed(2)}`);
        });
        
        // Listen for tool purchases
        this.eventEmitter.on('purchase:tool', (toolName, cost) => {
            if (!this.removeMoney(cost)) {
                this.eventEmitter.emit('notification:error', "Not enough money to purchase this tool.");
                return;
            }
            
            this.addOrReplaceTool(toolName);
            this.eventEmitter.emit('inventory:updated');
            this.eventEmitter.emit('notification:success', `Purchased new ${toolName} for $${cost.toFixed(2)}`);
        });
        
        // Listen for item sales
        this.eventEmitter.on('item:sell', (itemName, price) => {
            if (this.removeItem(itemName, 1)) {
                this.addMoney(price);
                this.eventEmitter.emit('inventory:updated');
            }
        });
    }
    
    /**
     * Add material to inventory
     * @param {string} name - Material name
     * @param {number} amount - Amount to add
     * @returns {boolean} - Success status
     */
    addMaterial(name, amount) {
        if (amount <= 0) {
            console.warn(`Cannot add ${amount} of ${name}`);
            return false;
        }
        
        // Initialize if doesn't exist
        if (!this.materials[name]) {
            this.materials[name] = 0;
        }
        
        this.materials[name] += amount;
        this.eventEmitter.emit('inventory:updated');
        return true;
    }
    
    /**
     * Remove material from inventory
     * @param {string} name - Material name
     * @param {number} amount - Amount to remove
     * @returns {boolean} - Success status
     */
    removeMaterial(name, amount) {
        if (!this.materials[name] || this.materials[name] < amount) {
            return false;
        }
        
        this.materials[name] -= amount;
        this.eventEmitter.emit('inventory:updated');
        return true;
    }
    
    /**
     * Check if materials are available without removing them
     * @param {Object} requiredMaterials - Object mapping material names to required amounts
     * @returns {boolean} - Whether all materials are available
     */
    hasMaterials(requiredMaterials) {
        for (const [name, amount] of Object.entries(requiredMaterials)) {
            if (!this.materials[name] || this.materials[name] < amount) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Consume multiple materials at once (for crafting)
     * @param {Object} requiredMaterials - Object mapping material names to required amounts
     * @returns {boolean} - Success status
     */
    consumeMaterials(requiredMaterials) {
        // Check if we have all the required materials first
        if (!this.hasMaterials(requiredMaterials)) {
            return false;
        }
        
        // Remove all materials
        for (const [name, amount] of Object.entries(requiredMaterials)) {
            this.materials[name] -= amount;
        }
        
        this.eventEmitter.emit('inventory:updated');
        return true;
    }
    
    /**
     * Add a crafted item to inventory
     * @param {string} itemName - Name of the item
     * @param {number} amount - Amount to add (default: 1)
     * @returns {boolean} - Success status
     */
    addItem(itemName, amount = 1) {
        if (amount <= 0) {
            return false;
        }
        
        // Initialize if doesn't exist
        if (!this.items[itemName]) {
            this.items[itemName] = 0;
        }
        
        this.items[itemName] += amount;
        this.eventEmitter.emit('inventory:updated');
        return true;
    }
    
    /**
     * Remove a crafted item from inventory
     * @param {string} itemName - Name of the item
     * @param {number} amount - Amount to remove (default: 1)
     * @returns {boolean} - Success status
     */
    removeItem(itemName, amount = 1) {
        if (!this.items[itemName] || this.items[itemName] < amount) {
            return false;
        }
        
        this.items[itemName] -= amount;
        
        // Clean up if zero
        if (this.items[itemName] === 0) {
            delete this.items[itemName];
        }
        
        this.eventEmitter.emit('inventory:updated');
        return true;
    }
    
    /**
     * Check if items are available without removing them
     * @param {Object} requiredItems - Object mapping item names to required amounts
     * @returns {boolean} - Whether all items are available
     */
    hasItems(requiredItems) {
        for (const [name, amount] of Object.entries(requiredItems)) {
            if (!this.items[name] || this.items[name] < amount) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Add a new tool or replace an existing one
     * @param {string} toolName - Name of the tool
     * @param {number} maxUses - Maximum durability (optional)
     * @returns {boolean} - Success status
     */
    addOrReplaceTool(toolName, maxUses = null) {
        // Get default max uses if not specified
        if (maxUses === null) {
            // Default durability values for tools
            const defaultDurability = {
                hammer: 30,
                anvil: 50,
                tongs: 40,
                chisel: 25,
                file: 35
            };
            
            maxUses = defaultDurability[toolName] || 30; // Default 30 if unknown tool
        }
        
        this.tools[toolName] = {
            uses: maxUses,
            maxUses: maxUses
        };
        
        this.eventEmitter.emit('inventory:updated');
        return true;
    }
    
    /**
     * Use a tool, reducing its durability
     * @param {string} toolName - Name of the tool
     * @param {number} usesAmount - Amount of durability to consume (default: 1)
     * @returns {boolean} - Whether the tool was used successfully
     */
    useTool(toolName, usesAmount = 1) {
        if (!this.tools[toolName]) {
            return false;
        }
        
        // Reduce durability
        this.tools[toolName].uses -= usesAmount;
        
        // Check if tool broke
        if (this.tools[toolName].uses <= 0) {
            delete this.tools[toolName];
            this.eventEmitter.emit('tool:broken', toolName);
        }
        
        this.eventEmitter.emit('inventory:updated');
        return true;
    }
    
    /**
     * Check if a tool is available without using it
     * @param {string} toolName - Name of the tool
     * @returns {boolean} - Whether the tool is available
     */
    hasTool(toolName) {
        return !!this.tools[toolName];
    }
    
    /**
     * Get tool durability as a percentage
     * @param {string} toolName - Name of the tool
     * @returns {number} - Durability percentage (0-100) or -1 if tool doesn't exist
     */
    getToolDurabilityPercentage(toolName) {
        if (!this.tools[toolName]) {
            return -1;
        }
        
        return (this.tools[toolName].uses / this.tools[toolName].maxUses) * 100;
    }
    
    /**
     * Add money to the player's balance
     * @param {number} amount - Amount to add
     * @returns {boolean} - Success status
     */
    addMoney(amount) {
        if (amount <= 0) {
            return false;
        }
        
        this.money += amount;
        this.eventEmitter.emit('money:updated', this.money);
        return true;
    }
    
    /**
     * Remove money from the player's balance
     * @param {number} amount - Amount to remove
     * @returns {boolean} - Success status
     */
    removeMoney(amount) {
        if (amount <= 0 || this.money < amount) {
            return false;
        }
        
        this.money -= amount;
        this.eventEmitter.emit('money:updated', this.money);
        return true;
    }
    
    /**
     * Get current money balance
     * @returns {number} - Current balance
     */
    getMoney() {
        return this.money;
    }
    
    /**
     * Get all available materials
     * @returns {Object} - Materials inventory
     */
    getMaterials() {
        return { ...this.materials };
    }
    
    /**
     * Get all crafted items
     * @returns {Object} - Items inventory
     */
    getItems() {
        return { ...this.items };
    }
    
    /**
     * Get all tools with durability
     * @returns {Object} - Tools inventory
     */
    getTools() {
        return { ...this.tools };
    }
    
    /**
     * Save inventory state
     * @returns {Object} - Serialized inventory for saving
     */
    serialize() {
        return {
            materials: { ...this.materials },
            items: { ...this.items },
            tools: { ...this.tools },
            money: this.money
        };
    }
    
    /**
     * Load inventory state
     * @param {Object} data - Serialized inventory data
     */
    deserialize(data) {
        if (!data) return;
        
        if (data.materials) this.materials = { ...data.materials };
        if (data.items) this.items = { ...data.items };
        if (data.tools) this.tools = { ...data.tools };
        if (data.money !== undefined) this.money = data.money;
        
        this.eventEmitter.emit('inventory:updated');
    }
}