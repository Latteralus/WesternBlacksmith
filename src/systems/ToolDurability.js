/**
 * Tool Durability System
 * 
 * Manages tool durability and wear. Tools are used during crafting and
 * eventually break after repeated use.
 */
export class ToolDurability {
    constructor(eventEmitter, inventorySystem) {
        this.eventEmitter = eventEmitter;
        this.inventory = inventorySystem;
        
        // Default tool usage cost for different crafting operations
        this.toolUsageCosts = {
            simple: 1,    // Simple items like nails
            medium: 2,    // Medium items like horseshoes
            complex: 3    // Complex items like rifles
        };
        
        // Tool requirements for different item types
        this.toolRequirements = {
            // Mapping from item category to required tools
            metal: ['hammer', 'tongs', 'anvil'],
            weapon: ['hammer', 'tongs', 'anvil', 'file'],
            wood: ['saw', 'hammer'],
            leather: ['needle', 'scissors']
        };
        
        // Register event listeners
        this.registerEventListeners();
    }
    
    /**
     * Register event listeners
     */
    registerEventListeners() {
        // Listen for crafting attempts to verify tool availability
        this.eventEmitter.on('crafting:validate-tools', (itemData, callback) => {
            const hasTools = this.checkToolsForItem(itemData);
            callback(hasTools);
        });
        
        // Listen for completed crafts to reduce tool durability
        this.eventEmitter.on('crafting:completed', (itemData) => {
            this.useToolsForItem(itemData);
        });
    }
    
    /**
     * Check if all required tools are available for crafting an item
     * @param {Object} itemData - Item data containing category and complexity
     * @returns {boolean} - Whether all required tools are available
     */
    checkToolsForItem(itemData) {
        const category = itemData.category || 'metal';
        const requiredTools = this.toolRequirements[category] || ['hammer'];
        
        // Check if all required tools are available
        for (const tool of requiredTools) {
            if (!this.inventory.hasTool(tool)) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Get list of required tools for an item
     * @param {Object} itemData - Item data containing category
     * @returns {string[]} - Array of required tool names
     */
    getRequiredToolsForItem(itemData) {
        const category = itemData.category || 'metal';
        return this.toolRequirements[category] || ['hammer'];
    }
    
    /**
     * Use tools for crafting an item, reducing their durability
     * @param {Object} itemData - Item data containing category and complexity
     */
    useToolsForItem(itemData) {
        const category = itemData.category || 'metal';
        const complexity = itemData.complexity || 'medium';
        const requiredTools = this.toolRequirements[category] || ['hammer'];
        
        // Calculate usage amount based on complexity
        const usageAmount = this.toolUsageCosts[complexity] || 1;
        
        // Reduce durability for each tool
        for (const tool of requiredTools) {
            if (this.inventory.hasTool(tool)) {
                const wasUsedSuccessfully = this.inventory.useTool(tool, usageAmount);
                
                if (!wasUsedSuccessfully) {
                    console.warn(`Failed to use tool: ${tool}`);
                }
            }
        }
    }
    
    /**
     * Get tool durability details
     * @returns {Object} - Object mapping tool names to their durability percentages
     */
    getToolDurabilityDetails() {
        const tools = this.inventory.getTools();
        const durabilityDetails = {};
        
        for (const [toolName, toolData] of Object.entries(tools)) {
            durabilityDetails[toolName] = {
                percentage: (toolData.uses / toolData.maxUses) * 100,
                current: toolData.uses,
                max: toolData.maxUses
            };
        }
        
        return durabilityDetails;
    }
    
    /**
     * Repair a tool, restoring some durability
     * @param {string} toolName - Name of the tool to repair
     * @param {number} repairAmount - Amount of uses to restore
     * @returns {boolean} - Whether the repair was successful
     */
    repairTool(toolName, repairAmount) {
        const tools = this.inventory.getTools();
        
        if (!tools[toolName]) {
            return false;
        }
        
        // Calculate new durability
        const currentDurability = tools[toolName].uses;
        const maxDurability = tools[toolName].maxUses;
        const newDurability = Math.min(currentDurability + repairAmount, maxDurability);
        
        // Update the tool
        tools[toolName].uses = newDurability;
        
        // Emit event
        this.eventEmitter.emit('tool:repaired', toolName, newDurability, maxDurability);
        
        return true;
    }
    
    /**
     * Get missing tools that the player needs to craft
     * @param {Object} itemData - Item data containing category
     * @returns {string[]} - Array of missing tool names
     */
    getMissingTools(itemData) {
        const category = itemData.category || 'metal';
        const requiredTools = this.toolRequirements[category] || ['hammer'];
        const missingTools = [];
        
        for (const tool of requiredTools) {
            if (!this.inventory.hasTool(tool)) {
                missingTools.push(tool);
            }
        }
        
        return missingTools;
    }
    
    /**
     * Save tool durability system state
     * @returns {Object} - Serialized tool system data
     */
    serialize() {
        return {
            toolUsageCosts: { ...this.toolUsageCosts },
            toolRequirements: { ...this.toolRequirements }
        };
    }
    
    /**
     * Load tool durability system state
     * @param {Object} data - Serialized tool system data
     */
    deserialize(data) {
        if (!data) return;
        
        if (data.toolUsageCosts) this.toolUsageCosts = { ...data.toolUsageCosts };
        if (data.toolRequirements) this.toolRequirements = { ...data.toolRequirements };
    }
}