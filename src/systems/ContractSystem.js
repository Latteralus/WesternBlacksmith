/**
 * Contract System
 * 
 * Manages contracts for bulk orders from various customers.
 * Handles contract generation, fulfillment, and expiry.
 */
export class ContractSystem {
    constructor(eventEmitter, inventorySystem, contractsData, itemsData) {
        this.eventEmitter = eventEmitter;
        this.inventory = inventorySystem;
        this.contractsData = contractsData;
        this.itemsData = itemsData;
        
        // Active contracts
        this.activeContracts = [];
        
        // Special contracts (from events)
        this.specialContracts = [];
        
        // Timer for contract generation
        this.contractTimer = 0;
        
        // Time between contract generation attempts (in seconds)
        this.contractInterval = 180; // 3 minutes
        
        // Maximum number of active standard contracts
        this.maxContracts = 3;
        
        // Register event listeners
        this.registerEventListeners();
    }
    
    /**
     * Register event listeners
     */
    registerEventListeners() {
        // Listen for contract fulfillment requests
        this.eventEmitter.on('contract:fulfill', (contractId) => {
            this.fulfillContract(contractId);
        });
        
        // Listen for contract rejection requests
        this.eventEmitter.on('contract:reject', (contractId) => {
            this.rejectContract(contractId);
        });
        
        // Listen for blueprint unlocks to update available contracts
        this.eventEmitter.on('blueprint:unlocked', (itemId) => {
            // Check if this item could trigger special contracts
            this.checkForSpecialContracts(itemId);
        });
    }
    
    /**
     * Update contract system (called on each game tick)
     */
    update() {
        // Update contract timer
        this.contractTimer++;
        
        // Check for contract generation
        if (this.contractTimer >= this.contractInterval) {
            this.contractTimer = 0;
            this.generateContract();
        }
        
        // Check for expired contracts
        this.checkExpiredContracts();
    }
    
    /**
     * Generate a new contract
     */
    generateContract() {
        // Skip if at max contracts
        if (this.activeContracts.length >= this.maxContracts) {
            return;
        }
        
        // Get list of unlocked items for contracts
        const availableItems = this.getAvailableItemsForContracts();
        
        // Generate a random contract
        const contract = this.contractsData.generate({
            availableItems,
            timeMultiplier: 1
        });
        
        if (!contract) {
            console.warn("Failed to generate contract");
            return;
        }
        
        // Get item data
        const itemData = this.itemsData.items[contract.item];
        
        if (!itemData) {
            console.warn(`Contract references unknown item: ${contract.item}`);
            return;
        }
        
        // Calculate payout
        const payout = this.contractsData.calculatePayout(contract, itemData);
        
        // Add contract data
        contract.payout = payout;
        contract.itemName = itemData.name;
        contract.timeCreated = new Date();
        
        // Add to active contracts
        this.activeContracts.push(contract);
        
        // Emit events
        this.eventEmitter.emit('contract:available', contract);
    }
    
    /**
     * Fulfill a contract
     * @param {string} contractId - ID of the contract to fulfill
     * @returns {boolean} - Whether the contract was fulfilled
     */
    fulfillContract(contractId) {
        // Find contract
        const contractIndex = this.activeContracts.findIndex(c => c.id === contractId);
        const specialIndex = this.specialContracts.findIndex(c => c.id === contractId);
        
        let contract;
        let isSpecial = false;
        
        if (contractIndex !== -1) {
            contract = this.activeContracts[contractIndex];
        } else if (specialIndex !== -1) {
            contract = this.specialContracts[specialIndex];
            isSpecial = true;
        } else {
            this.eventEmitter.emit('notification:error', "Contract not found.");
            return false;
        }
        
        // Check if player has enough items to fulfill
        if (!this.inventory.hasItems({ [contract.item]: contract.quantity })) {
            this.eventEmitter.emit('notification:error', `Not enough ${contract.itemName} to fulfill this contract.`);
            return false;
        }
        
        // Remove items from inventory
        if (!this.inventory.removeItem(contract.item, contract.quantity)) {
            this.eventEmitter.emit('notification:error', "Failed to remove items from inventory.");
            return false;
        }
        
        // Remove contract from active contracts
        if (isSpecial) {
            this.specialContracts.splice(specialIndex, 1);
        } else {
            this.activeContracts.splice(contractIndex, 1);
        }
        
        // Add money to inventory
        this.inventory.addMoney(contract.payout);
        
        // Emit events
        this.eventEmitter.emit('contract:completed', contract);
        this.eventEmitter.emit('notification:success', 
            `Contract completed: ${contract.quantity}x ${contract.itemName} for $${contract.payout.toFixed(2)}`);
        
        return true;
    }
    
    /**
     * Reject a contract
     * @param {string} contractId - ID of the contract to reject
     * @returns {boolean} - Whether the contract was rejected
     */
    rejectContract(contractId) {
        // Find contract
        const contractIndex = this.activeContracts.findIndex(c => c.id === contractId);
        const specialIndex = this.specialContracts.findIndex(c => c.id === contractId);
        
        let contract;
        let isSpecial = false;
        
        if (contractIndex !== -1) {
            contract = this.activeContracts[contractIndex];
        } else if (specialIndex !== -1) {
            contract = this.specialContracts[specialIndex];
            isSpecial = true;
        } else {
            this.eventEmitter.emit('notification:error', "Contract not found.");
            return false;
        }
        
        // Remove contract
        if (isSpecial) {
            this.specialContracts.splice(specialIndex, 1);
        } else {
            this.activeContracts.splice(contractIndex, 1);
        }
        
        // Emit events
        this.eventEmitter.emit('contract:rejected', contract);
        this.eventEmitter.emit('notification:info', `Rejected contract from ${contract.customer}.`);
        
        return true;
    }
    
    /**
     * Check for expired contracts
     */
    checkExpiredContracts() {
        const now = new Date();
        const expiredContracts = [];
        
        // Check standard contracts
        this.activeContracts = this.activeContracts.filter(contract => {
            if (contract.expiryTime <= now) {
                expiredContracts.push(contract);
                return false;
            }
            return true;
        });
        
        // Check special contracts
        this.specialContracts = this.specialContracts.filter(contract => {
            if (contract.expiryTime <= now) {
                expiredContracts.push(contract);
                return false;
            }
            return true;
        });
        
        // Notify about expired contracts
        for (const contract of expiredContracts) {
            this.eventEmitter.emit('contract:expired', contract);
            this.eventEmitter.emit('notification:warning', 
                `Contract expired: ${contract.customer}'s order for ${contract.quantity}x ${contract.itemName}`);
        }
    }
    
    /**
     * Add a special contract (from events)
     * @param {Object} contract - Contract data
     */
    addSpecialContract(contract) {
        // Get item data
        const itemData = this.itemsData.items[contract.item];
        
        if (!itemData) {
            console.warn(`Special contract references unknown item: ${contract.item}`);
            return;
        }
        
        // Calculate payout if not already set
        if (!contract.payout) {
            contract.payout = this.contractsData.calculatePayout(contract, itemData);
        }
        
        // Add additional data
        contract.itemName = itemData.name;
        contract.timeCreated = new Date();
        
        // Add to special contracts
        this.specialContracts.push(contract);
        
        // Emit events
        this.eventEmitter.emit('contract:special-available', contract);
        this.eventEmitter.emit('notification:info', 
            `Special contract available: ${contract.customer} wants ${contract.quantity}x ${contract.itemName}`);
    }
    
    /**
     * Check for special contracts based on newly unlocked item
     * @param {string} itemId - ID of newly unlocked item
     */
    checkForSpecialContracts(itemId) {
        // This could be expanded to generate special introductory contracts
        // when certain items are unlocked
        const specialItems = {
            'rifle': {
                customer: "County Sheriff's Office",
                description: "The sheriff wants to test your craftsmanship with a first order.",
                quantity: 2,
                payoutMultiplier: 1.5,
                durationMinutes: 30
            },
            'revolver': {
                customer: "Silver Dollar Saloon",
                description: "The saloon owner needs protection for his establishment.",
                quantity: 1,
                payoutMultiplier: 1.4,
                durationMinutes: 20
            },
            'decorativeHorseshoe': {
                customer: "Wilson Ranch",
                description: "The Wilson family wants decorative horseshoes for their new barn.",
                quantity: 3,
                payoutMultiplier: 1.3,
                durationMinutes: 25
            }
        };
        
        // Check if this item has a special introductory contract
        if (specialItems[itemId]) {
            const specialContract = {
                id: `intro_${itemId}_${Date.now()}`,
                item: itemId,
                customer: specialItems[itemId].customer,
                description: specialItems[itemId].description,
                quantity: specialItems[itemId].quantity,
                payoutMultiplier: specialItems[itemId].payoutMultiplier,
                expiryTime: new Date(Date.now() + specialItems[itemId].durationMinutes * 60 * 1000),
                isSpecial: true
            };
            
            this.addSpecialContract(specialContract);
        }
    }
    
    /**
     * Get available items for contracts
     * @returns {string[]} - Array of item IDs available for contracts
     */
    getAvailableItemsForContracts() {
        const availableItems = [];
        
        // Get all unlocked items
        for (const [itemId, itemData] of Object.entries(this.itemsData.items)) {
            if (itemData.unlocked && !itemData.createsTool) {
                availableItems.push(itemId);
            }
        }
        
        return availableItems;
    }
    
    /**
     * Get all active contracts
     * @returns {Object} - Standard and special contracts
     */
    getContracts() {
        return {
            standard: [...this.activeContracts],
            special: [...this.specialContracts]
        };
    }
    
    /**
     * Calculate time remaining for a contract
     * @param {Object} contract - Contract object
     * @returns {Object} - Time remaining details
     */
    getContractTimeRemaining(contract) {
        if (!contract || !contract.expiryTime) {
            return { minutes: 0, seconds: 0, percentage: 0 };
        }
        
        const now = new Date();
        const expiryTime = new Date(contract.expiryTime);
        const totalMs = expiryTime - now;
        
        if (totalMs <= 0) {
            return { minutes: 0, seconds: 0, percentage: 0 };
        }
        
        const minutes = Math.floor(totalMs / (1000 * 60));
        const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);
        
        // Calculate percentage if we know duration
        let percentage = 0;
        if (contract.durationMinutes) {
            const totalDurationMs = contract.durationMinutes * 60 * 1000;
            percentage = (totalMs / totalDurationMs) * 100;
        }
        
        return { minutes, seconds, percentage };
    }
    
    /**
     * Save contract system state
     * @returns {Object} - Serialized contract system
     */
    serialize() {
        return {
            activeContracts: this.activeContracts,
            specialContracts: this.specialContracts,
            contractTimer: this.contractTimer
        };
    }
    
    /**
     * Load contract system state
     * @param {Object} data - Serialized contract data
     */
    deserialize(data) {
        if (!data) return;
        
        if (data.activeContracts) this.activeContracts = [...data.activeContracts];
        if (data.specialContracts) this.specialContracts = [...data.specialContracts];
        if (data.contractTimer !== undefined) this.contractTimer = data.contractTimer;
        
        // Convert date strings back to Date objects
        for (const contract of this.activeContracts) {
            if (contract.expiryTime && typeof contract.expiryTime === 'string') {
                contract.expiryTime = new Date(contract.expiryTime);
            }
            if (contract.timeCreated && typeof contract.timeCreated === 'string') {
                contract.timeCreated = new Date(contract.timeCreated);
            }
        }
        
        for (const contract of this.specialContracts) {
            if (contract.expiryTime && typeof contract.expiryTime === 'string') {
                contract.expiryTime = new Date(contract.expiryTime);
            }
            if (contract.timeCreated && typeof contract.timeCreated === 'string') {
                contract.timeCreated = new Date(contract.timeCreated);
            }
        }
    }
}