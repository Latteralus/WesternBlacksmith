/**
 * Save System
 * 
 * Handles saving and loading game state to/from localStorage.
 * Manages auto-save functionality and save slots.
 */
export class SaveSystem {
    constructor(eventEmitter, systems) {
        this.eventEmitter = eventEmitter;
        this.systems = systems;
        
        // Save ID prefix for localStorage
        this.savePrefix = 'western_blacksmith_';
        
        // Auto-save interval (in seconds)
        this.autoSaveInterval = 60;
        
        // Auto-save timer
        this.autoSaveTimer = 0;
        
        // Whether auto-save is enabled
        this.autoSaveEnabled = true;
        
        // Current save slot
        this.currentSaveSlot = 'auto';
        
        // Register event listeners
        this.registerEventListeners();
    }
    
    /**
     * Register event listeners
     */
    registerEventListeners() {
        // Listen for manual save requests
        this.eventEmitter.on('save:save-game', (slotName) => {
            this.saveGame(slotName);
        });
        
        // Listen for load requests
        this.eventEmitter.on('save:load-game', (slotName) => {
            this.loadGame(slotName);
        });
        
        // Listen for delete save requests
        this.eventEmitter.on('save:delete-save', (slotName) => {
            this.deleteSave(slotName);
        });
    }
    
    /**
     * Update save system (called on each game tick)
     */
    update() {
        // Skip if auto-save is disabled
        if (!this.autoSaveEnabled) {
            return;
        }
        
        // Increment auto-save timer
        this.autoSaveTimer++;
        
        // Check for auto-save
        if (this.autoSaveTimer >= this.autoSaveInterval) {
            this.autoSaveTimer = 0;
            this.saveGame('auto');
        }
    }
    
    /**
     * Save game state to localStorage
     * @param {string} slotName - Save slot name (default: current slot)
     * @returns {boolean} - Whether save was successful
     */
    saveGame(slotName = this.currentSaveSlot) {
        try {
            // Set current save slot
            this.currentSaveSlot = slotName;
            
            // Collect state from all systems
            const gameState = this.collectGameState();
            
            // Add metadata
            gameState.meta = {
                saveDate: new Date().toISOString(),
                version: '1.0.0',
                slotName: slotName
            };
            
            // Convert to JSON
            const saveData = JSON.stringify(gameState);
            
            // Save to localStorage
            localStorage.setItem(this.getSaveKey(slotName), saveData);
            
            // Emit event
            this.eventEmitter.emit('save:saved', slotName);
            
            if (slotName !== 'auto') {
                this.eventEmitter.emit('notification:success', `Game saved to slot "${slotName}"`);
            }
            
            return true;
        } catch (error) {
            console.error("Error saving game:", error);
            this.eventEmitter.emit('notification:error', "Failed to save game.");
            return false;
        }
    }
    
    /**
     * Load game state from localStorage
     * @param {string} slotName - Save slot name (default: current slot)
     * @returns {boolean} - Whether load was successful
     */
    loadGame(slotName = this.currentSaveSlot) {
        try {
            // Get save data from localStorage
            const saveKey = this.getSaveKey(slotName);
            const saveData = localStorage.getItem(saveKey);
            
            if (!saveData) {
                // No save found
                if (slotName !== 'auto') {
                    this.eventEmitter.emit('notification:warning', `No save found in slot "${slotName}"`);
                }
                return false;
            }
            
            // Parse save data
            const gameState = JSON.parse(saveData);
            
            // Validate save data
            if (!gameState || !gameState.meta) {
                this.eventEmitter.emit('notification:error', "Invalid save data.");
                return false;
            }
            
            // Load state into all systems
            this.loadGameState(gameState);
            
            // Set current save slot
            this.currentSaveSlot = slotName;
            
            // Emit event
            this.eventEmitter.emit('save:loaded', slotName);
            
            if (slotName !== 'auto') {
                this.eventEmitter.emit('notification:success', `Game loaded from slot "${slotName}"`);
            }
            
            return true;
        } catch (error) {
            console.error("Error loading game:", error);
            this.eventEmitter.emit('notification:error', "Failed to load game.");
            return false;
        }
    }
    
    /**
     * Delete a saved game
     * @param {string} slotName - Save slot name
     * @returns {boolean} - Whether deletion was successful
     */
    deleteSave(slotName) {
        try {
            // Get save key
            const saveKey = this.getSaveKey(slotName);
            
            // Check if save exists
            if (!localStorage.getItem(saveKey)) {
                this.eventEmitter.emit('notification:warning', `No save found in slot "${slotName}"`);
                return false;
            }
            
            // Remove from localStorage
            localStorage.removeItem(saveKey);
            
            // Emit event
            this.eventEmitter.emit('save:deleted', slotName);
            this.eventEmitter.emit('notification:info', `Deleted save in slot "${slotName}"`);
            
            return true;
        } catch (error) {
            console.error("Error deleting save:", error);
            this.eventEmitter.emit('notification:error', "Failed to delete save.");
            return false;
        }
    }
    
    /**
     * Get all available save slots
     * @returns {Array} - Array of save slot metadata
     */
    getAvailableSaves() {
        const saves = [];
        
        // Check all localStorage keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            
            // Check if this is a save
            if (key.startsWith(this.savePrefix)) {
                try {
                    // Get save name from key
                    const slotName = key.substring(this.savePrefix.length);
                    
                    // Get save data
                    const saveData = JSON.parse(localStorage.getItem(key));
                    
                    // Add to list
                    saves.push({
                        slotName,
                        saveDate: new Date(saveData.meta.saveDate),
                        version: saveData.meta.version
                    });
                } catch (error) {
                    console.error(`Error parsing save ${key}:`, error);
                }
            }
        }
        
        // Sort by save date (newest first)
        saves.sort((a, b) => b.saveDate - a.saveDate);
        
        return saves;
    }
    
    /**
     * Collect game state from all systems
     * @returns {Object} - Complete game state
     */
    collectGameState() {
        const gameState = {};
        
        // Collect state from each system
        for (const [systemName, system] of Object.entries(this.systems)) {
            if (system && typeof system.serialize === 'function') {
                gameState[systemName] = system.serialize();
            }
        }
        
        return gameState;
    }
    
    /**
     * Load game state into all systems
     * @param {Object} gameState - Complete game state
     */
    loadGameState(gameState) {
        // Load state into each system
        for (const [systemName, system] of Object.entries(this.systems)) {
            if (system && typeof system.deserialize === 'function') {
                system.deserialize(gameState[systemName]);
            }
        }
    }
    
    /**
     * Get localStorage key for a save slot
     * @param {string} slotName - Save slot name
     * @returns {string} - localStorage key
     */
    getSaveKey(slotName) {
        return `${this.savePrefix}${slotName}`;
    }
    
    /**
     * Set auto-save interval
     * @param {number} interval - New interval in seconds
     */
    setAutoSaveInterval(interval) {
        this.autoSaveInterval = Math.max(30, interval);
        this.autoSaveTimer = 0;
    }
    
    /**
     * Enable or disable auto-save
     * @param {boolean} enabled - Whether auto-save should be enabled
     */
    setAutoSaveEnabled(enabled) {
        this.autoSaveEnabled = enabled;
        
        if (enabled) {
            this.eventEmitter.emit('notification:info', "Auto-save enabled");
        } else {
            this.eventEmitter.emit('notification:info', "Auto-save disabled");
        }
    }
    
    /**
     * Export save data as a JSON string
     * @param {string} slotName - Save slot name
     * @returns {string|null} - JSON string or null if save not found
     */
    exportSave(slotName) {
        try {
            // Get save data
            const saveData = localStorage.getItem(this.getSaveKey(slotName));
            
            if (!saveData) {
                return null;
            }
            
            return saveData;
        } catch (error) {
            console.error("Error exporting save:", error);
            return null;
        }
    }
    
    /**
     * Import save data from a JSON string
     * @param {string} jsonData - JSON save data
     * @param {string} slotName - Target save slot
     * @returns {boolean} - Whether import was successful
     */
    importSave(jsonData, slotName) {
        try {
            // Validate JSON data
            const gameState = JSON.parse(jsonData);
            
            if (!gameState || !gameState.meta) {
                this.eventEmitter.emit('notification:error', "Invalid save data format.");
                return false;
            }
            
            // Save to slot
            localStorage.setItem(this.getSaveKey(slotName), jsonData);
            
            // Emit event
            this.eventEmitter.emit('save:imported', slotName);
            this.eventEmitter.emit('notification:success', `Imported save to slot "${slotName}"`);
            
            return true;
        } catch (error) {
            console.error("Error importing save:", error);
            this.eventEmitter.emit('notification:error', "Failed to import save.");
            return false;
        }
    }
}