/**
 * Coal System
 * 
 * Manages the forge's heat level by tracking coal usage.
 * Coal depletes over time and needs to be refilled when it gets low.
 */
export class CoalSystem {
    constructor(eventEmitter, inventorySystem) {
        this.eventEmitter = eventEmitter;
        this.inventory = inventorySystem;
        
        // Coal level as a percentage (0-100)
        this.level = 100;
        
        // Rate at which coal depletes (percentage points per second)
        this.depletionRate = 0.5;
        
        // Threshold at which to warn about low coal
        this.lowThreshold = 20;
        
        // Amount of coal to consume per refill
        this.coalPerRefill = 5;
        
        // Flag to track if we've sent a low coal warning
        this.hasWarnedAboutLowCoal = false;
        
        // Register event listeners
        this.registerEventListeners();
    }
    
    /**
     * Register event listeners
     */
    registerEventListeners() {
        // Listen for refill coal request
        this.eventEmitter.on('coal:refill', () => {
            this.refill();
        });
        
        // Listen for automatic refills from workers
        this.eventEmitter.on('worker:refill-coal', (workerName) => {
            const success = this.refill();
            if (success) {
                this.eventEmitter.emit('notification:info', `${workerName} has refilled the forge with coal.`);
            }
        });
    }
    
    /**
     * Update coal level (called on each game tick)
     */
    update() {
        // Only deplete coal if level is greater than 0
        if (this.level > 0) {
            // Reduce the coal level
            this.level -= this.depletionRate;
            
            // Clamp to 0
            if (this.level < 0) {
                this.level = 0;
            }
            
            // Check if we should warn about low coal
            if (this.level <= this.lowThreshold && !this.hasWarnedAboutLowCoal) {
                this.eventEmitter.emit('coal:low', this.level);
                this.hasWarnedAboutLowCoal = true;
            }
            
            // Auto-refill at 20% (if we have coal)
            if (this.level <= this.lowThreshold && this.inventory.materials.coal >= this.coalPerRefill) {
                this.refill();
            }
            
            // Emit coal level updated event
            this.eventEmitter.emit('coal:updated', this.level);
        }
    }
    
    /**
     * Refill the coal in the forge
     * @returns {boolean} - Whether the refill was successful
     */
    refill() {
        // Check if we have enough coal
        if (this.inventory.materials.coal < this.coalPerRefill) {
            this.eventEmitter.emit('notification:error', "Not enough coal available to refill the forge.");
            return false;
        }
        
        // Check if we're already at max
        if (this.level >= 100) {
            this.eventEmitter.emit('notification:info', "The forge is already full of coal.");
            return false;
        }
        
        // Consume coal from inventory
        if (!this.inventory.removeMaterial('coal', this.coalPerRefill)) {
            return false;
        }
        
        // Reset the coal level to 100%
        this.level = 100;
        
        // Reset warning flag
        this.hasWarnedAboutLowCoal = false;
        
        // Emit events
        this.eventEmitter.emit('coal:refilled', this.level);
        this.eventEmitter.emit('coal:updated', this.level);
        
        return true;
    }
    
    /**
     * Check if there's enough coal for a crafting operation
     * @param {number} requiredLevel - Minimum level required (default: 20)
     * @returns {boolean} - Whether there's enough coal
     */
    hasEnoughCoal(requiredLevel = 20) {
        return this.level >= requiredLevel;
    }
    
    /**
     * Consume coal for a crafting operation
     * @param {number} amount - Amount to consume (default: 10)
     * @returns {boolean} - Whether coal was consumed successfully
     */
    consumeCoal(amount = 10) {
        if (this.level < amount) {
            return false;
        }
        
        this.level -= amount;
        
        // Clamp to 0
        if (this.level < 0) {
            this.level = 0;
        }
        
        // Check if we should warn about low coal
        if (this.level <= this.lowThreshold && !this.hasWarnedAboutLowCoal) {
            this.eventEmitter.emit('coal:low', this.level);
            this.hasWarnedAboutLowCoal = true;
        }
        
        // Emit events
        this.eventEmitter.emit('coal:consumed', amount);
        this.eventEmitter.emit('coal:updated', this.level);
        
        return true;
    }
    
    /**
     * Get current coal level
     * @returns {number} - Current coal level (0-100)
     */
    getLevel() {
        return this.level;
    }
    
    /**
     * Save coal system state
     * @returns {Object} - Serialized coal system state
     */
    serialize() {
        return {
            level: this.level,
            hasWarnedAboutLowCoal: this.hasWarnedAboutLowCoal
        };
    }
    
    /**
     * Load coal system state
     * @param {Object} data - Serialized coal system data
     */
    deserialize(data) {
        if (!data) return;
        
        if (data.level !== undefined) this.level = data.level;
        if (data.hasWarnedAboutLowCoal !== undefined) this.hasWarnedAboutLowCoal = data.hasWarnedAboutLowCoal;
        
        this.eventEmitter.emit('coal:updated', this.level);
    }
}