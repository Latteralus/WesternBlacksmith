/**
 * Crafting System
 * 
 * Manages all crafting operations, including material consumption,
 * tool usage, and craft queue management.
 */
export class CraftingSystem {
    constructor(eventEmitter, inventorySystem, coalSystem, toolDurability, itemsData) {
        this.eventEmitter = eventEmitter;
        this.inventory = inventorySystem;
        this.coal = coalSystem;
        this.toolDurability = toolDurability;
        this.itemsData = itemsData;
        
        // Queue of items being crafted
        this.craftingQueue = [];
        
        // Current active crafting job
        this.currentCraft = null;
        
        // Crafting speed multiplier (modified by tools, workers, etc.)
        this.speedMultiplier = 1.0;
        
        // Register event listeners
        this.registerEventListeners();
    }
    
    /**
     * Register event listeners
     */
    registerEventListeners() {
        // Listen for craft requests
        this.eventEmitter.on('crafting:start', (itemId, quantity = 1, workerId = null) => {
            this.startCrafting(itemId, quantity, workerId);
        });
        
        // Listen for coal level changes
        this.eventEmitter.on('coal:updated', (level) => {
            if (level <= 0 && this.currentCraft) {
                this.pauseCrafting("Not enough coal");
            }
        });
        
        // Listen for item blueprint unlocks to notify about new craftable items
        this.eventEmitter.on('blueprint:unlocked', (itemId) => {
            const item = this.itemsData.items[itemId];
            if (item) {
                this.eventEmitter.emit('notification:success', `New item unlocked for crafting: ${item.name}`);
            }
        });
    }
    
    /**
     * Update crafting progress (called on each game tick)
     */
    update() {
        // Skip if no active crafting job
        if (!this.currentCraft) {
            // Check if there's anything in the queue
            if (this.craftingQueue.length > 0) {
                this.currentCraft = this.craftingQueue.shift();
                this.eventEmitter.emit('crafting:started', this.currentCraft);
            } else {
                return;
            }
        }
        
        // Check if crafting is paused
        if (this.currentCraft.paused) {
            return;
        }
        
        // Update progress
        this.currentCraft.progress += (1 * this.speedMultiplier);
        
        // Check if there's still enough coal
        if (!this.coal.hasEnoughCoal()) {
            this.pauseCrafting("Not enough coal");
            return;
        }
        
        // Check if crafting is complete
        if (this.currentCraft.progress >= this.currentCraft.craftingTime) {
            this.completeCrafting();
        } else {
            // Emit progress update
            this.eventEmitter.emit('crafting:progress', {
                itemId: this.currentCraft.itemId,
                progress: this.currentCraft.progress,
                total: this.currentCraft.craftingTime,
                percentage: (this.currentCraft.progress / this.currentCraft.craftingTime) * 100
            });
        }
    }
    
    /**
     * Start a new crafting job
     * @param {string} itemId - ID of the item to craft
     * @param {number} quantity - Number of items to craft
     * @param {string|null} workerId - Optional ID of worker doing the crafting
     * @returns {boolean} - Whether crafting was started successfully
     */
    startCrafting(itemId, quantity = 1, workerId = null) {
        // Get item definition
        const itemData = this.itemsData.items[itemId];
        
        if (!itemData) {
            this.eventEmitter.emit('notification:error', `Unknown item: ${itemId}`);
            return false;
        }
        
        // Check if item is unlocked
        if (!itemData.unlocked) {
            this.eventEmitter.emit('notification:error', `You haven't unlocked the blueprint for ${itemData.name} yet.`);
            return false;
        }
        
        // Check for required tools
        const missingTools = this.toolDurability.getMissingTools(itemData);
        if (missingTools.length > 0) {
            this.eventEmitter.emit('notification:error', `Missing tools: ${missingTools.join(', ')}`);
            return false;
        }
        
        // Check for required materials
        if (!this.inventory.hasMaterials(itemData.requiredMaterials)) {
            this.eventEmitter.emit('notification:error', `Not enough materials to craft ${itemData.name}`);
            return false;
        }
        
        // Check for coal
        if (!this.coal.hasEnoughCoal()) {
            this.eventEmitter.emit('notification:error', `Not enough coal in the forge to craft ${itemData.name}`);
            return false;
        }
        
        // Calculate batch size if applicable
        const batchSize = itemData.batchSize || 1;
        const actualQuantity = batchSize * quantity;
        
        // Consume materials
        for (const [materialName, amount] of Object.entries(itemData.requiredMaterials)) {
            // Multiply amount by quantity
            const totalAmount = amount * quantity;
            if (!this.inventory.removeMaterial(materialName, totalAmount)) {
                // This shouldn't happen because we checked hasMaterials first
                console.error(`Failed to remove ${totalAmount} ${materialName}`);
                return false;
            }
        }
        
        // Consume initial coal
        const coalUsage = itemData.coalUsage || 5;
        this.coal.consumeCoal(coalUsage);
        
        // Create crafting job
        const craftingJob = {
            itemId,
            name: itemData.name,
            craftingTime: itemData.craftingTime,
            progress: 0,
            quantity: actualQuantity,
            workerId,
            paused: false,
            pauseReason: null,
            itemData: { ...itemData }
        };
        
        // Add to queue or set as current
        if (this.currentCraft) {
            this.craftingQueue.push(craftingJob);
            this.eventEmitter.emit('crafting:queued', craftingJob);
        } else {
            this.currentCraft = craftingJob;
            this.eventEmitter.emit('crafting:started', craftingJob);
        }
        
        return true;
    }
    
    /**
     * Complete current crafting job
     */
    completeCrafting() {
        if (!this.currentCraft) return;
        
        const { itemId, name, quantity, workerId } = this.currentCraft;
        const itemData = this.currentCraft.itemData;
        
        // Use tools for crafting
        this.toolDurability.useToolsForItem(itemData);
        
        // If this creates a tool, add it to inventory
        if (itemData.createsTool) {
            this.inventory.addOrReplaceTool(itemData.createsTool);
            this.eventEmitter.emit('notification:success', `Crafted a new ${name}`);
        } else {
            // Add crafted item to inventory
            this.inventory.addItem(itemId, quantity);
            
            // Get craftee name with quantity
            const itemDesc = quantity > 1 ? `${quantity}x ${name}` : name;
            
            // Emit events
            this.eventEmitter.emit('item:crafted', itemId, quantity, workerId);
            this.eventEmitter.emit('notification:success', `Crafted ${itemDesc}`);
            
            // Auto-add to storefront if configured
            if (this.autoAddToStorefront) {
                this.eventEmitter.emit('storefront:add', itemId, quantity);
            }
        }
        
        // Clear current craft
        this.currentCraft = null;
        
        // Check if there's something else in the queue
        if (this.craftingQueue.length > 0) {
            this.currentCraft = this.craftingQueue.shift();
            this.eventEmitter.emit('crafting:started', this.currentCraft);
        } else {
            this.eventEmitter.emit('crafting:queue-empty');
        }
    }
    
    /**
     * Pause the current crafting job
     * @param {string} reason - Reason for pausing
     */
    pauseCrafting(reason = "Unknown reason") {
        if (!this.currentCraft) return;
        
        this.currentCraft.paused = true;
        this.currentCraft.pauseReason = reason;
        
        this.eventEmitter.emit('crafting:paused', {
            itemId: this.currentCraft.itemId,
            reason: reason
        });
    }
    
    /**
     * Resume the current crafting job
     * @returns {boolean} - Whether resuming was successful
     */
    resumeCrafting() {
        if (!this.currentCraft || !this.currentCraft.paused) return false;
        
        // Check if resume conditions are met
        if (this.currentCraft.pauseReason === "Not enough coal" && !this.coal.hasEnoughCoal()) {
            this.eventEmitter.emit('notification:error', "Cannot resume crafting: Still not enough coal");
            return false;
        }
        
        this.currentCraft.paused = false;
        this.currentCraft.pauseReason = null;
        
        this.eventEmitter.emit('crafting:resumed', {
            itemId: this.currentCraft.itemId
        });
        
        return true;
    }
    
    /**
     * Cancel the current crafting job
     * @returns {boolean} - Whether cancel was successful
     */
    cancelCurrentCraft() {
        if (!this.currentCraft) return false;
        
        // Refund materials (partial refund based on progress)
        const refundRatio = 1 - (this.currentCraft.progress / this.currentCraft.craftingTime);
        if (refundRatio > 0.5) {  // Only refund if more than 50% of materials can be recovered
            for (const [materialName, amount] of Object.entries(this.currentCraft.itemData.requiredMaterials)) {
                const refundAmount = Math.floor(amount * refundRatio);
                if (refundAmount > 0) {
                    this.inventory.addMaterial(materialName, refundAmount);
                }
            }
        }
        
        const canceledItem = this.currentCraft.name;
        
        // Clear current craft
        this.currentCraft = null;
        
        // Move to the next item in queue
        if (this.craftingQueue.length > 0) {
            this.currentCraft = this.craftingQueue.shift();
            this.eventEmitter.emit('crafting:started', this.currentCraft);
        }
        
        this.eventEmitter.emit('notification:info', `Canceled crafting of ${canceledItem}`);
        this.eventEmitter.emit('crafting:canceled', canceledItem);
        
        return true;
    }
    
    /**
     * Cancel a specific job from the crafting queue
     * @param {number} index - Index of job in the queue
     * @returns {boolean} - Whether cancel was successful
     */
    cancelQueuedCraft(index) {
        if (index < 0 || index >= this.craftingQueue.length) return false;
        
        // Refund all materials (100%)
        const job = this.craftingQueue[index];
        for (const [materialName, amount] of Object.entries(job.itemData.requiredMaterials)) {
            this.inventory.addMaterial(materialName, amount);
        }
        
        const canceledItem = job.name;
        
        // Remove from queue
        this.craftingQueue.splice(index, 1);
        
        this.eventEmitter.emit('notification:info', `Removed ${canceledItem} from crafting queue`);
        this.eventEmitter.emit('crafting:queue-updated', this.craftingQueue);
        
        return true;
    }
    
    /**
     * Set crafting speed multiplier
     * @param {number} multiplier - Speed multiplier (default: 1.0)
     */
    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
    }
    
    /**
     * Get current crafting job
     * @returns {Object|null} - Current crafting job or null
     */
    getCurrentCraft() {
        return this.currentCraft;
    }
    
    /**
     * Get crafting queue
     * @returns {Array} - Array of queued crafting jobs
     */
    getCraftingQueue() {
        return [...this.craftingQueue];
    }
    
    /**
     * Check if crafting queue has space
     * @param {number} maxQueueSize - Maximum queue size (default: 5)
     * @returns {boolean} - Whether queue has space
     */
    hasQueueSpace(maxQueueSize = 5) {
        return this.craftingQueue.length < maxQueueSize;
    }
    
    /**
     * Toggle auto-adding crafted items to storefront
     * @param {boolean} enabled - Whether to enable auto-add
     */
    setAutoAddToStorefront(enabled) {
        this.autoAddToStorefront = enabled;
    }
    
    /**
     * Get all craftable items
     * @returns {Array} - Array of craftable item definitions
     */
    getCraftableItems() {
        const craftableItems = [];
        
        for (const [itemId, itemData] of Object.entries(this.itemsData.items)) {
            if (itemData.unlocked) {
                craftableItems.push({
                    id: itemId,
                    ...itemData
                });
            }
        }
        
        return craftableItems;
    }
    
    /**
     * Check if an item can be crafted
     * @param {string} itemId - ID of the item
     * @returns {Object} - Result object with canCraft and reason
     */
    canCraft(itemId) {
        const result = {
            canCraft: false,
            reason: null
        };
        
        // Get item definition
        const itemData = this.itemsData.items[itemId];
        
        if (!itemData) {
            result.reason = "Unknown item";
            return result;
        }
        
        // Check if item is unlocked
        if (!itemData.unlocked) {
            result.reason = "Blueprint not unlocked";
            return result;
        }
        
        // Check for required tools
        const missingTools = this.toolDurability.getMissingTools(itemData);
        if (missingTools.length > 0) {
            result.reason = `Missing tools: ${missingTools.join(', ')}`;
            return result;
        }
        
        // Check for required materials
        if (!this.inventory.hasMaterials(itemData.requiredMaterials)) {
            result.reason = "Not enough materials";
            return result;
        }
        
        // Check for coal
        if (!this.coal.hasEnoughCoal()) {
            result.reason = "Not enough coal";
            return result;
        }
        
        // All checks passed
        result.canCraft = true;
        return result;
    }
    
    /**
     * Save crafting system state
     * @returns {Object} - Serialized crafting system
     */
    serialize() {
        return {
            currentCraft: this.currentCraft,
            craftingQueue: this.craftingQueue,
            speedMultiplier: this.speedMultiplier,
            autoAddToStorefront: this.autoAddToStorefront
        };
    }
    
    /**
     * Load crafting system state
     * @param {Object} data - Serialized crafting data
     */
    deserialize(data) {
        if (!data) return;
        
        if (data.currentCraft) this.currentCraft = data.currentCraft;
        if (data.craftingQueue) this.craftingQueue = [...data.craftingQueue];
        if (data.speedMultiplier !== undefined) this.speedMultiplier = data.speedMultiplier;
        if (data.autoAddToStorefront !== undefined) this.autoAddToStorefront = data.autoAddToStorefront;
        
        // Emit events to update UI
        if (this.currentCraft) {
            this.eventEmitter.emit('crafting:started', this.currentCraft);
        }
        
        if (this.craftingQueue.length > 0) {
            this.eventEmitter.emit('crafting:queue-updated', this.craftingQueue);
        }
    }
}