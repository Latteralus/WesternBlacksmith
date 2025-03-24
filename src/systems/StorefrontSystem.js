/**
 * Storefront System
 * 
 * Manages the player's storefront where crafted items are sold.
 * Handles customer visits, item demand, and sales.
 */
export class StorefrontSystem {
    constructor(eventEmitter, inventorySystem, itemsData) {
        this.eventEmitter = eventEmitter;
        this.inventory = inventorySystem;
        this.itemsData = itemsData;
        
        // Items for sale in the storefront
        this.storefrontItems = {};
        
        // Base chance of a customer visiting per tick (percentage)
        this.baseCustomerChance = 10;
        
        // Time between customer visit checks (in seconds)
        this.customerCheckInterval = 30;
        
        // Timer for customer visits
        this.customerTimer = 0;
        
        // Demand multipliers for items (itemId -> {multiplier, expiryTime})
        this.demandMultipliers = {};
        
        // Price modifiers for the storefront
        this.priceModifiers = {
            global: 1.0,
            byCategory: {},
            byItem: {}
        };
        
        // Register event listeners
        this.registerEventListeners();
    }
    
    /**
     * Register event listeners
     */
    registerEventListeners() {
        // Listen for add to storefront requests
        this.eventEmitter.on('storefront:add', (itemId, quantity = 1) => {
            this.addItemToStorefront(itemId, quantity);
        });
        
        // Listen for remove from storefront requests
        this.eventEmitter.on('storefront:remove', (itemId, quantity = 1) => {
            this.removeItemFromStorefront(itemId, quantity);
        });
        
        // Listen for sell item requests (manual sales)
        this.eventEmitter.on('storefront:sell', (itemId, quantity = 1) => {
            this.sellItem(itemId, quantity);
        });
        
        // Listen for price modifier changes
        this.eventEmitter.on('storefront:set-price-modifier', (type, value, target) => {
            this.setPriceModifier(type, value, target);
        });
    }
    
    /**
     * Update storefront (called on each game tick)
     */
    update() {
        // Update customer timer
        this.customerTimer++;
        
        // Check for expired demand multipliers
        this.updateDemandMultipliers();
        
        // Check for customer visits
        if (this.customerTimer >= this.customerCheckInterval) {
            this.customerTimer = 0;
            this.checkForCustomers();
        }
    }
    
    /**
     * Add an item to the storefront
     * @param {string} itemId - ID of the item
     * @param {number} quantity - Quantity to add
     * @returns {boolean} - Whether the item was added
     */
    addItemToStorefront(itemId, quantity = 1) {
        // Try to remove from inventory first
        if (!this.inventory.removeItem(itemId, quantity)) {
            this.eventEmitter.emit('notification:error', `Not enough ${itemId} in inventory.`);
            return false;
        }
        
        // Initialize if doesn't exist
        if (!this.storefrontItems[itemId]) {
            this.storefrontItems[itemId] = {
                quantity: 0,
                price: this.getItemBasePrice(itemId),
                lastSold: null
            };
        }
        
        // Add to storefront
        this.storefrontItems[itemId].quantity += quantity;
        
        // Emit event
        this.eventEmitter.emit('storefront:updated', this.storefrontItems);
        this.eventEmitter.emit('notification:info', `Added ${quantity}x ${itemId} to storefront.`);
        
        return true;
    }
    
    /**
     * Remove an item from the storefront
     * @param {string} itemId - ID of the item
     * @param {number} quantity - Quantity to remove
     * @returns {boolean} - Whether the item was removed
     */
    removeItemFromStorefront(itemId, quantity = 1) {
        // Check if item exists in storefront
        if (!this.storefrontItems[itemId] || this.storefrontItems[itemId].quantity < quantity) {
            this.eventEmitter.emit('notification:error', `Not enough ${itemId} in storefront.`);
            return false;
        }
        
        // Remove from storefront
        this.storefrontItems[itemId].quantity -= quantity;
        
        // Add back to inventory
        this.inventory.addItem(itemId, quantity);
        
        // Clean up if zero
        if (this.storefrontItems[itemId].quantity === 0) {
            delete this.storefrontItems[itemId];
        }
        
        // Emit event
        this.eventEmitter.emit('storefront:updated', this.storefrontItems);
        this.eventEmitter.emit('notification:info', `Removed ${quantity}x ${itemId} from storefront.`);
        
        return true;
    }
    
    /**
     * Sell an item (player-initiated sale)
     * @param {string} itemId - ID of the item
     * @param {number} quantity - Quantity to sell
     * @returns {boolean} - Whether the sale was successful
     */
    sellItem(itemId, quantity = 1) {
        // Check if item exists in storefront
        if (!this.storefrontItems[itemId] || this.storefrontItems[itemId].quantity < quantity) {
            this.eventEmitter.emit('notification:error', `Not enough ${itemId} in storefront.`);
            return false;
        }
        
        // Calculate sale price
        const price = this.getItemPrice(itemId) * quantity;
        
        // Remove from storefront
        this.storefrontItems[itemId].quantity -= quantity;
        
        // Update last sold time
        this.storefrontItems[itemId].lastSold = new Date();
        
        // Clean up if zero
        if (this.storefrontItems[itemId].quantity === 0) {
            delete this.storefrontItems[itemId];
        }
        
        // Add money to inventory
        this.inventory.addMoney(price);
        
        // Emit events
        this.eventEmitter.emit('storefront:updated', this.storefrontItems);
        this.eventEmitter.emit('item:sold', itemId, price, quantity);
        this.eventEmitter.emit('notification:success', `Sold ${quantity}x ${itemId} for $${price.toFixed(2)}.`);
        
        return true;
    }
    
    /**
     * Check for customers who might buy items
     */
    checkForCustomers() {
        // Skip if no items in storefront
        if (Object.keys(this.storefrontItems).length === 0) {
            return;
        }
        
        // Calculate customer chance
        const customerChance = this.baseCustomerChance / 100; // Convert to decimal
        
        // Roll for customer visit
        if (Math.random() < customerChance) {
            this.handleCustomerVisit();
        }
    }
    
    /**
     * Handle a customer visit and potential purchases
     */
    handleCustomerVisit() {
        // Select a random item from the storefront
        const availableItems = Object.keys(this.storefrontItems)
            .filter(itemId => this.storefrontItems[itemId].quantity > 0);
        
        if (availableItems.length === 0) {
            return;
        }
        
        // Get a weighted random item based on demand
        const itemId = this.getWeightedRandomItem(availableItems);
        
        if (!itemId) {
            return;
        }
        
        // Calculate purchase chance based on demand
        const demandMultiplier = this.getDemandMultiplier(itemId);
        const purchaseChance = 0.6 * demandMultiplier; // 60% base chance modified by demand
        
        // Roll for purchase
        if (Math.random() < purchaseChance) {
            // Determine quantity to buy (usually 1, but can be more for high demand)
            const maxQty = Math.min(
                this.storefrontItems[itemId].quantity,
                Math.floor(Math.random() * 3 * demandMultiplier) + 1
            );
            
            const quantity = Math.max(1, maxQty);
            
            // Calculate price
            const price = this.getItemPrice(itemId) * quantity;
            
            // Remove from storefront
            this.storefrontItems[itemId].quantity -= quantity;
            
            // Update last sold time
            this.storefrontItems[itemId].lastSold = new Date();
            
            // Clean up if zero
            if (this.storefrontItems[itemId].quantity === 0) {
                delete this.storefrontItems[itemId];
            }
            
            // Add money to inventory
            this.inventory.addMoney(price);
            
            // Get item name
            const itemData = this.itemsData.items[itemId];
            const itemName = itemData ? itemData.name : itemId;
            
            // Emit events
            this.eventEmitter.emit('storefront:updated', this.storefrontItems);
            this.eventEmitter.emit('item:sold', itemId, price, quantity);
            this.eventEmitter.emit('notification:success', `Customer bought ${quantity}x ${itemName} for $${price.toFixed(2)}.`);
        }
    }
    
    /**
     * Get a weighted random item based on demand
     * @param {string[]} availableItems - Array of available item IDs
     * @returns {string|null} - Selected item ID or null
     */
    getWeightedRandomItem(availableItems) {
        if (availableItems.length === 0) {
            return null;
        }
        
        // Calculate weights based on demand
        const weights = availableItems.map(itemId => this.getDemandMultiplier(itemId));
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        
        // If total weight is 0, return a random item
        if (totalWeight === 0) {
            return availableItems[Math.floor(Math.random() * availableItems.length)];
        }
        
        // Select weighted random item
        let random = Math.random() * totalWeight;
        for (let i = 0; i < availableItems.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return availableItems[i];
            }
        }
        
        // Fallback to first item
        return availableItems[0];
    }
    
    /**
     * Set demand multiplier for an item
     * @param {string} itemId - ID of the item
     * @param {number} multiplier - Demand multiplier
     * @param {Date} expiryTime - When the multiplier expires
     */
    setDemandMultiplier(itemId, multiplier, expiryTime) {
        this.demandMultipliers[itemId] = {
            multiplier,
            expiryTime
        };
        
        this.eventEmitter.emit('notification:info', `Demand for ${itemId} has changed (×${multiplier}).`);
    }
    
    /**
     * Get current demand multiplier for an item
     * @param {string} itemId - ID of the item
     * @returns {number} - Current demand multiplier
     */
    getDemandMultiplier(itemId) {
        if (this.demandMultipliers[itemId] && 
            this.demandMultipliers[itemId].expiryTime > new Date()) {
            return this.demandMultipliers[itemId].multiplier;
        }
        
        return 1.0; // Default multiplier
    }
    
    /**
     * Update demand multipliers and remove expired ones
     */
    updateDemandMultipliers() {
        const now = new Date();
        
        for (const [itemId, data] of Object.entries(this.demandMultipliers)) {
            if (data.expiryTime <= now) {
                // Multiplier expired
                delete this.demandMultipliers[itemId];
                this.eventEmitter.emit('notification:info', `Demand for ${itemId} has returned to normal.`);
            }
        }
    }
    
    /**
     * Set price modifier
     * @param {string} type - Type of modifier (global, category, item)
     * @param {number} value - Modifier value
     * @param {string} target - Target (category name or item ID, required for type=category/item)
     */
    setPriceModifier(type, value, target) {
        switch (type) {
            case 'global':
                this.priceModifiers.global = value;
                break;
                
            case 'category':
                if (!target) return;
                this.priceModifiers.byCategory[target] = value;
                break;
                
            case 'item':
                if (!target) return;
                this.priceModifiers.byItem[target] = value;
                break;
        }
        
        this.eventEmitter.emit('storefront:updated', this.storefrontItems);
    }
    
    /**
     * Get base price of an item from items data
     * @param {string} itemId - ID of the item
     * @returns {number} - Base price
     */
    getItemBasePrice(itemId) {
        const itemData = this.itemsData.items[itemId];
        return itemData ? itemData.basePrice : 0;
    }
    
    /**
     * Get current price of an item with all modifiers applied
     * @param {string} itemId - ID of the item
     * @returns {number} - Current price
     */
    getItemPrice(itemId) {
        // Get base price
        let price = this.getItemBasePrice(itemId);
        
        // Apply global modifier
        price *= this.priceModifiers.global;
        
        // Apply category modifier if exists
        const itemData = this.itemsData.items[itemId];
        if (itemData && itemData.category && this.priceModifiers.byCategory[itemData.category]) {
            price *= this.priceModifiers.byCategory[itemData.category];
        }
        
        // Apply item-specific modifier if exists
        if (this.priceModifiers.byItem[itemId]) {
            price *= this.priceModifiers.byItem[itemId];
        }
        
        // Apply storefront specific pricing if set
        if (this.storefrontItems[itemId] && this.storefrontItems[itemId].price) {
            price = this.storefrontItems[itemId].price;
        }
        
        return price;
    }
    
    /**
     * Set custom price for an item in the storefront
     * @param {string} itemId - ID of the item
     * @param {number} price - New price
     * @returns {boolean} - Whether the price was set
     */
    setItemPrice(itemId, price) {
        if (!this.storefrontItems[itemId]) {
            return false;
        }
        
        this.storefrontItems[itemId].price = price;
        this.eventEmitter.emit('storefront:updated', this.storefrontItems);
        
        return true;
    }
    
    /**
     * Get all items in the storefront
     * @returns {Object} - Storefront items with details
     */
    getStorefrontItems() {
        const result = {};
        
        for (const [itemId, data] of Object.entries(this.storefrontItems)) {
            const itemData = this.itemsData.items[itemId];
            
            result[itemId] = {
                ...data,
                name: itemData ? itemData.name : itemId,
                description: itemData ? itemData.description : '',
                category: itemData ? itemData.category : '',
                currentPrice: this.getItemPrice(itemId),
                basePrice: this.getItemBasePrice(itemId),
                demand: this.getDemandMultiplier(itemId)
            };
        }
        
        return result;
    }
    
    /**
     * Save storefront system state
     * @returns {Object} - Serialized storefront system
     */
    serialize() {
        return {
            storefrontItems: this.storefrontItems,
            demandMultipliers: this.demandMultipliers,
            priceModifiers: this.priceModifiers,
            customerTimer: this.customerTimer
        };
    }
    
    /**
     * Load storefront system state
     * @param {Object} data - Serialized storefront data
     */
    deserialize(data) {
        if (!data) return;
        
        if (data.storefrontItems) this.storefrontItems = { ...data.storefrontItems };
        if (data.demandMultipliers) this.demandMultipliers = { ...data.demandMultipliers };
        if (data.priceModifiers) this.priceModifiers = { ...data.priceModifiers };
        if (data.customerTimer !== undefined) this.customerTimer = data.customerTimer;
        
        this.eventEmitter.emit('storefront:updated', this.storefrontItems);
    }
}