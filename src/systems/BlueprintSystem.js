/**
 * Blueprint System
 * 
 * Manages blueprints and recipes that the player can unlock.
 * Handles purchasing new blueprints and tracking unlocked items.
 */
export class BlueprintSystem {
    constructor(eventEmitter, itemsData) {
        this.eventEmitter = eventEmitter;
        this.itemsData = itemsData;
        
        // Set of unlocked blueprint IDs
        this.unlockedBlueprints = new Set();
        
        // Initially unlock all items marked as unlocked
        for (const [itemId, itemData] of Object.entries(this.itemsData.items)) {
            if (itemData.unlocked) {
                this.unlockedBlueprints.add(itemId);
            }
        }
        
        // Register event listeners
        this.registerEventListeners();
    }
    
    /**
     * Register event listeners
     */
    registerEventListeners() {
        // Listen for blueprint purchase requests
        this.eventEmitter.on('blueprint:purchase', (itemId) => {
            this.purchaseBlueprint(itemId);
        });
    }
    
    /**
     * Check if a blueprint is unlocked
     * @param {string} itemId - ID of the item/blueprint
     * @returns {boolean} - Whether the blueprint is unlocked
     */
    isUnlocked(itemId) {
        return this.unlockedBlueprints.has(itemId);
    }
    
    /**
     * Unlock a blueprint
     * @param {string} itemId - ID of the item/blueprint to unlock
     * @returns {boolean} - Whether the unlock was successful
     */
    unlockBlueprint(itemId) {
        // Check if already unlocked
        if (this.unlockedBlueprints.has(itemId)) {
            return false;
        }
        
        // Check if item exists
        if (!this.itemsData.items[itemId]) {
            console.error(`Attempted to unlock non-existent item: ${itemId}`);
            return false;
        }
        
        // Unlock the blueprint
        this.unlockedBlueprints.add(itemId);
        
        // Update the item data
        this.itemsData.items[itemId].unlocked = true;
        
        // Emit event
        this.eventEmitter.emit('blueprint:unlocked', itemId, this.itemsData.items[itemId]);
        
        return true;
    }
    
    /**
     * Purchase a blueprint using player money
     * @param {string} itemId - ID of the item/blueprint to purchase
     * @returns {boolean} - Whether the purchase was successful
     */
    purchaseBlueprint(itemId) {
        // Check if already unlocked
        if (this.unlockedBlueprints.has(itemId)) {
            this.eventEmitter.emit('notification:error', "You already own this blueprint.");
            return false;
        }
        
        // Get item data
        const itemData = this.itemsData.items[itemId];
        
        if (!itemData) {
            this.eventEmitter.emit('notification:error', "Invalid blueprint.");
            return false;
        }
        
        // Check if blueprint is purchasable
        if (!itemData.blueprintPrice) {
            this.eventEmitter.emit('notification:error', "This blueprint is not available for purchase.");
            return false;
        }
        
        // Request money from inventory system
        this.eventEmitter.emit('inventory:purchase-blueprint', {
            itemId,
            price: itemData.blueprintPrice,
            callback: (success) => {
                if (success) {
                    // Unlock the blueprint
                    this.unlockBlueprint(itemId);
                    
                    // Show notification
                    this.eventEmitter.emit('notification:success', `Purchased blueprint for ${itemData.name}.`);
                    
                    // Show modal with new blueprint details
                    this.eventEmitter.emit('modal:show', {
                        title: `New Blueprint: ${itemData.name}`,
                        content: `
                            <div class="blueprint-details">
                                <h3>${itemData.name}</h3>
                                <p>${itemData.description}</p>
                                <h4>Materials Required:</h4>
                                <ul>
                                    ${Object.entries(itemData.requiredMaterials).map(([material, amount]) => 
                                        `<li>${material}: ${amount}</li>`).join('')}
                                </ul>
                                <p>Crafting Time: ${itemData.craftingTime} seconds</p>
                                <p>Base Price: $${itemData.basePrice.toFixed(2)}</p>
                            </div>
                        `
                    });
                }
            }
        });
        
        return true;
    }
    
    /**
     * Get all available blueprints for purchase
     * @returns {Array} - Array of available blueprint data
     */
    getAvailableBlueprints() {
        const availableBlueprints = [];
        
        for (const [itemId, itemData] of Object.entries(this.itemsData.items)) {
            // Skip if already unlocked
            if (this.unlockedBlueprints.has(itemId)) {
                continue;
            }
            
            // Skip if no blueprint price (not purchasable)
            if (!itemData.blueprintPrice) {
                continue;
            }
            
            availableBlueprints.push({
                id: itemId,
                name: itemData.name,
                description: itemData.description,
                price: itemData.blueprintPrice,
                category: itemData.category,
                complexity: itemData.complexity
            });
        }
        
        return availableBlueprints;
    }
    
    /**
     * Get all unlocked blueprints
     * @returns {Array} - Array of unlocked blueprint data
     */
    getUnlockedBlueprints() {
        const unlocked = [];
        
        for (const itemId of this.unlockedBlueprints) {
            const itemData = this.itemsData.items[itemId];
            
            if (itemData) {
                unlocked.push({
                    id: itemId,
                    name: itemData.name,
                    description: itemData.description,
                    category: itemData.category,
                    complexity: itemData.complexity
                });
            }
        }
        
        return unlocked;
    }
    
    /**
     * Get blueprint details
     * @param {string} itemId - ID of the item/blueprint
     * @returns {Object|null} - Blueprint details or null if not found
     */
    getBlueprintDetails(itemId) {
        const itemData = this.itemsData.items[itemId];
        
        if (!itemData) {
            return null;
        }
        
        return {
            id: itemId,
            name: itemData.name,
            description: itemData.description,
            requiredMaterials: itemData.requiredMaterials,
            requiredTools: itemData.requiredTools,
            craftingTime: itemData.craftingTime,
            coalUsage: itemData.coalUsage,
            basePrice: itemData.basePrice,
            category: itemData.category,
            complexity: itemData.complexity,
            unlocked: this.unlockedBlueprints.has(itemId)
        };
    }
    
    /**
     * Save blueprint system state
     * @returns {Object} - Serialized blueprint system
     */
    serialize() {
        return {
            unlockedBlueprints: Array.from(this.unlockedBlueprints)
        };
    }
    
    /**
     * Load blueprint system state
     * @param {Object} data - Serialized blueprint data
     */
    deserialize(data) {
        if (!data) return;
        
        if (data.unlockedBlueprints) {
            this.unlockedBlueprints = new Set(data.unlockedBlueprints);
            
            // Update the item data to match
            for (const [itemId, itemData] of Object.entries(this.itemsData.items)) {
                itemData.unlocked = this.unlockedBlueprints.has(itemId);
            }
        }
    }
}