/**
 * Game Events Definitions
 * 
 * Defines random events that can occur during gameplay.
 * These events create temporary effects like increased demand,
 * special contracts, or resource availability changes.
 */

// Event definition structure:
// - id: Unique identifier for the event
// - name: Display name of the event
// - description: Detailed explanation of the event
// - duration: How long the event lasts in minutes
// - effects: Array of effect objects that modify game state
// - weight: Relative chance of this event triggering (higher = more common)
// - conditions: Optional function to check if event can trigger

export const eventDefinitions = [
    // Demand-related events
    {
        id: "mine_collapse",
        name: "Mine Collapse!",
        description: "The local mine has suffered a collapse! Miners need new tools immediately.",
        duration: 10, // minutes
        effects: [
            {
                type: "demandIncrease", 
                item: "pickaxe",
                multiplier: 2.0
            },
            {
                type: "specialContract",
                contract: {
                    customer: "Rocky Mountain Mining Co.",
                    item: "pickaxe",
                    quantity: 8,
                    payoutMultiplier: 1.5,
                    description: "Emergency order: Replacement pickaxes needed for rescue efforts.",
                    durationMinutes: 8
                }
            }
        ],
        weight: 10
    },
    {
        id: "horse_race",
        name: "County Horse Race",
        description: "The annual county horse race is coming up! Local ranchers need horseshoes for their prized horses.",
        duration: 15,
        effects: [
            {
                type: "demandIncrease",
                item: "horseshoe",
                multiplier: 1.8
            },
            {
                type: "specialContract",
                contract: {
                    customer: "Big Sky Ranch",
                    item: "horseshoe",
                    quantity: 16,
                    payoutMultiplier: 1.3,
                    description: "Premium horseshoes needed for race horses.",
                    durationMinutes: 12
                }
            }
        ],
        weight: 8
    },
    {
        id: "railroad_expansion",
        name: "Railroad Expansion",
        description: "The railroad is expanding west! They need supplies to build new track.",
        duration: 20,
        effects: [
            {
                type: "demandIncrease",
                item: "nail",
                multiplier: 1.5
            },
            {
                type: "specialContract",
                contract: {
                    customer: "Western Pacific Railroad",
                    item: "nail",
                    quantity: 120,
                    payoutMultiplier: 1.4,
                    description: "Large order of rail spikes needed for new track.",
                    durationMinutes: 15
                }
            }
        ],
        weight: 7
    },
    {
        id: "bandit_activity",
        name: "Bandit Activity",
        description: "Bandits are active in the area! The sheriff needs weapons to arm deputies.",
        duration: 12,
        effects: [
            {
                type: "demandIncrease",
                item: "rifle",
                multiplier: 1.7
            },
            {
                type: "demandIncrease",
                item: "revolver",
                multiplier: 1.6
            },
            {
                type: "specialContract",
                contract: {
                    customer: "County Sheriff's Office",
                    item: "bullets",
                    quantity: 40,
                    payoutMultiplier: 1.6,
                    description: "The sheriff needs ammunition for a posse to track down bandits.",
                    durationMinutes: 10
                }
            }
        ],
        weight: 6,
        conditions: (gameState) => {
            // Only trigger if player has unlocked weapon crafting
            return gameState.blueprints.isUnlocked("rifle") || gameState.blueprints.isUnlocked("revolver");
        }
    },
    
    // Resource-related events
    {
        id: "iron_shipment",
        name: "Iron Shipment",
        description: "A large shipment of iron has arrived in town! Prices are lower than usual.",
        duration: 15,
        effects: [
            {
                type: "materialPriceModifier",
                material: "iron",
                multiplier: 0.7
            }
        ],
        weight: 12
    },
    {
        id: "coal_shortage",
        name: "Coal Shortage",
        description: "Coal supplies are running low in the region. Prices have increased.",
        duration: 18,
        effects: [
            {
                type: "materialPriceModifier",
                material: "coal",
                multiplier: 1.5
            }
        ],
        weight: 9
    },
    {
        id: "lumber_surplus",
        name: "Lumber Surplus",
        description: "Local lumberjacks have an excess of wood. Prices are temporarily reduced.",
        duration: 12,
        effects: [
            {
                type: "materialPriceModifier",
                material: "wood",
                multiplier: 0.6
            }
        ],
        weight: 10
    },
    
    // Special events
    {
        id: "mayors_ball",
        name: "Mayor's Annual Ball",
        description: "The mayor is hosting a grand ball for the town's elite. Decorative items are in high demand.",
        duration: 20,
        effects: [
            {
                type: "demandIncrease",
                item: "decorativeHorseshoe",
                multiplier: 2.0
            },
            {
                type: "demandIncrease",
                item: "silverCandelabra",
                multiplier: 2.5
            },
            {
                type: "specialContract",
                contract: {
                    customer: "Mayor's Office",
                    item: "belt_buckle",
                    quantity: 5,
                    payoutMultiplier: 1.8,
                    description: "The mayor wants custom belt buckles as gifts for honored guests.",
                    durationMinutes: 15
                }
            }
        ],
        weight: 5,
        conditions: (gameState) => {
            // Only trigger if player has unlocked at least one decorative item
            return gameState.blueprints.isUnlocked("decorativeHorseshoe") || 
                   gameState.blueprints.isUnlocked("belt_buckle") ||
                   gameState.blueprints.isUnlocked("silverCandelabra");
        }
    },
    {
        id: "gold_rush",
        name: "Gold Rush",
        description: "Gold has been discovered nearby! Mining tools are in incredibly high demand.",
        duration: 25,
        effects: [
            {
                type: "demandIncrease",
                item: "pickaxe",
                multiplier: 3.0
            },
            {
                type: "materialPriceModifier",
                material: "gold",
                multiplier: 0.8
            },
            {
                type: "specialContract",
                contract: {
                    customer: "Prospector's Association",
                    item: "pickaxe",
                    quantity: 12,
                    payoutMultiplier: 2.0,
                    description: "Prospectors need quality tools to stake their claims in the gold fields.",
                    durationMinutes: 20
                }
            }
        ],
        weight: 3
    },
    {
        id: "skilled_apprentice",
        name: "Skilled Apprentice",
        description: "A skilled apprentice is looking for work! They'll work for reduced wages.",
        duration: 30,
        effects: [
            {
                type: "workerDiscount",
                multiplier: 0.7,
                workerId: "apprentice"
            }
        ],
        weight: 6
    },
    {
        id: "tool_salesman",
        name: "Traveling Tool Salesman",
        description: "A traveling salesman has arrived selling quality tools at discounted prices.",
        duration: 10,
        effects: [
            {
                type: "toolPriceModifier",
                multiplier: 0.6
            }
        ],
        weight: 7
    },
    {
        id: "military_contract",
        name: "Military Contract",
        description: "The army is looking for supplies! This could be a lucrative opportunity.",
        duration: 15,
        effects: [
            {
                type: "specialContract",
                contract: {
                    customer: "U.S. Army",
                    item: "rifle",
                    quantity: 10,
                    payoutMultiplier: 2.0,
                    description: "The Army needs rifles for a new detachment being deployed to the territory.",
                    durationMinutes: 25
                }
            },
            {
                type: "specialContract",
                contract: {
                    customer: "U.S. Army",
                    item: "bullets",
                    quantity: 50,
                    payoutMultiplier: 1.8,
                    description: "The Army needs ammunition for training exercises.",
                    durationMinutes: 15
                }
            }
        ],
        weight: 4,
        conditions: (gameState) => {
            // Only trigger if player has unlocked weapon crafting
            return gameState.blueprints.isUnlocked("rifle");
        }
    }
];

/**
 * Generate a random event
 * @param {Object} gameState - Current game state for condition checking
 * @returns {Object|null} - A randomly selected event or null if none available
 */
export function generateRandomEvent(gameState = {}) {
    // Filter events based on conditions
    const availableEvents = eventDefinitions.filter(event => {
        if (event.conditions && typeof event.conditions === 'function') {
            return event.conditions(gameState);
        }
        return true;
    });
    
    if (availableEvents.length === 0) {
        return null;
    }
    
    // Calculate weights for weighted random selection
    const totalWeight = availableEvents.reduce((sum, event) => sum + event.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    
    // Select a random event
    let selectedEvent = availableEvents[0];
    for (const event of availableEvents) {
        randomWeight -= event.weight;
        if (randomWeight <= 0) {
            selectedEvent = event;
            break;
        }
    }
    
    // Create event instance with unique ID and expiry time
    const currentTime = new Date();
    const expiryTime = new Date(currentTime.getTime() + selectedEvent.duration * 60 * 1000);
    
    return {
        ...selectedEvent,
        instanceId: `${selectedEvent.id}_${Date.now()}`,
        startTime: currentTime,
        expiryTime: expiryTime,
        active: true
    };
}

/**
 * Process event effects to apply them to game state
 * @param {Object} event - The event to process
 * @param {Object} gameState - Game state object containing system references
 * @returns {Array} - Array of effect descriptions that were applied
 */
export function processEventEffects(event, gameState) {
    if (!event || !event.effects || !Array.isArray(event.effects)) {
        return [];
    }
    
    const appliedEffects = [];
    
    for (const effect of event.effects) {
        switch (effect.type) {
            case "demandIncrease":
                if (gameState.storefront) {
                    gameState.storefront.setDemandMultiplier(effect.item, effect.multiplier, event.expiryTime);
                    appliedEffects.push(`Increased demand for ${effect.item} (×${effect.multiplier})`);
                }
                break;
                
            case "materialPriceModifier":
                if (gameState.materials) {
                    gameState.materials.setPriceMultiplier(effect.material, effect.multiplier, event.expiryTime);
                    const changeType = effect.multiplier < 1 ? "decreased" : "increased";
                    appliedEffects.push(`${changeType.charAt(0).toUpperCase() + changeType.slice(1)} price for ${effect.material} (×${effect.multiplier})`);
                }
                break;
                
            case "specialContract":
                if (gameState.contracts && effect.contract) {
                    const contract = {
                        ...effect.contract,
                        id: `special_${effect.contract.item}_${Date.now()}`,
                        expiryTime: new Date(Date.now() + effect.contract.durationMinutes * 60 * 1000),
                        isSpecial: true
                    };
                    
                    gameState.contracts.addSpecialContract(contract);
                    appliedEffects.push(`New special contract from ${contract.customer}`);
                }
                break;
                
            case "workerDiscount":
                if (gameState.workers) {
                    gameState.workers.setHiringDiscount(effect.workerId, effect.multiplier, event.expiryTime);
                    appliedEffects.push(`Worker hiring discount (×${effect.multiplier})`);
                }
                break;
                
            case "toolPriceModifier":
                if (gameState.tools) {
                    gameState.tools.setPriceMultiplier(effect.multiplier, event.expiryTime);
                    appliedEffects.push(`Tool price discount (×${effect.multiplier})`);
                }
                break;
        }
    }
    
    return appliedEffects;
}

// Export the events API
export const events = {
    definitions: eventDefinitions,
    generate: generateRandomEvent,
    processEffects: processEventEffects
};