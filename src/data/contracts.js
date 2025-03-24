/**
 * Contract Definitions
 * 
 * Defines all possible contracts that can appear in the game.
 * Contracts are bulk orders for specific items with time constraints.
 */

// Contract definition structure:
// - id: Unique identifier for the contract
// - customer: Name of the customer/company ordering the items
// - item: Item ID corresponding to items.js
// - minQuantity/maxQuantity: Range for how many items to order
// - minDuration/maxDuration: Range for contract duration in minutes
// - basePayoutMultiplier: Multiplier on item basePrice for contract payout
// - description: Flavor text for the contract
// - weight: Relative chance of this contract appearing (higher = more common)

export const contractDefinitions = [
    // Mining Company Contracts
    {
        id: "mining_pickaxes",
        customer: "Rocky Mountain Mining Co.",
        item: "pickaxe",
        minQuantity: 3,
        maxQuantity: 8,
        minDuration: 10,
        maxDuration: 20,
        basePayoutMultiplier: 1.2,
        description: "The local mining company needs new pickaxes for their expanding workforce.",
        weight: 10
    },
    {
        id: "mining_shovels",
        customer: "Rocky Mountain Mining Co.",
        item: "shovel",
        minQuantity: 2,
        maxQuantity: 6,
        minDuration: 8,
        maxDuration: 15,
        basePayoutMultiplier: 1.2,
        description: "The miners need replacement shovels after a cave-in damaged their equipment.",
        weight: 8
    },
    
    // Ranch Contracts
    {
        id: "ranch_horseshoes",
        customer: "Big Sky Ranch",
        item: "horseshoe",
        minQuantity: 10,
        maxQuantity: 24,
        minDuration: 8,
        maxDuration: 15,
        basePayoutMultiplier: 1.15,
        description: "The local ranch needs a large order of horseshoes for their horses.",
        weight: 12
    },
    {
        id: "ranch_decorative_horseshoes",
        customer: "Big Sky Ranch",
        item: "decorativeHorseshoe",
        minQuantity: 3,
        maxQuantity: 8,
        minDuration: 12,
        maxDuration: 20,
        basePayoutMultiplier: 1.25,
        description: "The ranch owner wants some decorative horseshoes as gifts for important guests.",
        weight: 5
    },
    
    // General Store Contracts
    {
        id: "store_nails",
        customer: "Thompson's General Store",
        item: "nail",
        minQuantity: 40,
        maxQuantity: 100,
        minDuration: 5,
        maxDuration: 10,
        basePayoutMultiplier: 1.1,
        description: "The general store needs to restock their supply of nails.",
        weight: 15
    },
    {
        id: "store_hinges",
        customer: "Thompson's General Store",
        item: "hinge",
        minQuantity: 5,
        maxQuantity: 15,
        minDuration: 8,
        maxDuration: 15,
        basePayoutMultiplier: 1.1,
        description: "The general store has several customers needing hinges for doors and cabinets.",
        weight: 10
    },
    {
        id: "store_pots",
        customer: "Thompson's General Store",
        item: "pot",
        minQuantity: 3,
        maxQuantity: 8,
        minDuration: 10,
        maxDuration: 20,
        basePayoutMultiplier: 1.2,
        description: "The general store needs cooking pots to sell to new homesteaders.",
        weight: 8
    },
    
    // Sheriff's Office Contracts
    {
        id: "sheriff_rifles",
        customer: "County Sheriff's Office",
        item: "rifle",
        minQuantity: 2,
        maxQuantity: 5,
        minDuration: 15,
        maxDuration: 25,
        basePayoutMultiplier: 1.3,
        description: "The sheriff's office needs new rifles for their deputies.",
        weight: 4
    },
    {
        id: "sheriff_revolvers",
        customer: "County Sheriff's Office",
        item: "revolver",
        minQuantity: 1,
        maxQuantity: 3,
        minDuration: 12,
        maxDuration: 20,
        basePayoutMultiplier: 1.3,
        description: "The sheriff needs new revolvers for the deputy patrol.",
        weight: 3
    },
    {
        id: "sheriff_bullets",
        customer: "County Sheriff's Office",
        item: "bullets",
        minQuantity: 10,
        maxQuantity: 30,
        minDuration: 8,
        maxDuration: 15,
        basePayoutMultiplier: 1.25,
        description: "The sheriff's office needs ammunition for their firearms.",
        weight: 6
    },
    
    // Railroad Contracts
    {
        id: "railroad_tools",
        customer: "Western Pacific Railroad",
        item: "pickaxe",
        minQuantity: 5,
        maxQuantity: 10,
        minDuration: 12,
        maxDuration: 20,
        basePayoutMultiplier: 1.25,
        description: "The railroad needs tools for laying new track through the mountains.",
        weight: 6
    },
    {
        id: "railroad_spikes",
        customer: "Western Pacific Railroad",
        item: "nail",
        minQuantity: 100,
        maxQuantity: 200,
        minDuration: 10,
        maxDuration: 18,
        basePayoutMultiplier: 1.2,
        description: "The railroad needs spikes for securing rails to the ties.",
        weight: 7
    },
    
    // Upscale/Luxury Contracts
    {
        id: "mayor_buckles",
        customer: "Mayor's Office",
        item: "belt_buckle",
        minQuantity: 3,
        maxQuantity: 6,
        minDuration: 12,
        maxDuration: 20,
        basePayoutMultiplier: 1.4,
        description: "The mayor wants custom belt buckles as gifts for visiting dignitaries.",
        weight: 3
    },
    {
        id: "mansion_candelabra",
        customer: "Morgan Estate",
        item: "silverCandelabra",
        minQuantity: 2,
        maxQuantity: 4,
        minDuration: 15,
        maxDuration: 25,
        basePayoutMultiplier: 1.5,
        description: "The wealthy Morgan family wants silver candelabras for their dining room.",
        weight: 2
    }
];

/**
 * Generate a random contract from the definitions
 * @param {Object} options - Configuration options
 * @param {string[]} options.availableItems - Array of unlocked item IDs
 * @param {number} options.timeMultiplier - Multiplier for contract duration (default: 1)
 * @returns {Object} - A randomly generated contract
 */
export function generateRandomContract(options = {}) {
    const { availableItems = [], timeMultiplier = 1 } = options;
    
    // Filter contracts to only include available items
    let availableContracts = contractDefinitions;
    
    if (availableItems.length > 0) {
        availableContracts = contractDefinitions.filter(contract => 
            availableItems.includes(contract.item)
        );
    }
    
    if (availableContracts.length === 0) {
        // Fallback to basic contracts if no available items match
        availableContracts = contractDefinitions.filter(contract => 
            ["nail", "horseshoe", "hinge"].includes(contract.item)
        );
    }
    
    // Calculate weights for weighted random selection
    const totalWeight = availableContracts.reduce((sum, contract) => sum + contract.weight, 0);
    let randomWeight = Math.random() * totalWeight;
    
    // Select a random contract
    let selectedContract = availableContracts[0];
    for (const contract of availableContracts) {
        randomWeight -= contract.weight;
        if (randomWeight <= 0) {
            selectedContract = contract;
            break;
        }
    }
    
    // Generate random values within ranges
    const quantity = Math.floor(Math.random() * (selectedContract.maxQuantity - selectedContract.minQuantity + 1)) + selectedContract.minQuantity;
    const durationMinutes = Math.floor(Math.random() * (selectedContract.maxDuration - selectedContract.minDuration + 1)) + selectedContract.minDuration;
    
    // Apply time multiplier
    const adjustedDurationMinutes = Math.round(durationMinutes * timeMultiplier);
    
    // Create expiry time (current time + duration)
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + adjustedDurationMinutes);
    
    // Generate a unique identifier
    const contractId = `${selectedContract.id}_${Date.now()}`;
    
    return {
        id: contractId,
        customer: selectedContract.customer,
        item: selectedContract.item,
        quantity: quantity,
        description: selectedContract.description,
        expiryTime: expiryTime,
        durationMinutes: adjustedDurationMinutes,
        payoutMultiplier: selectedContract.basePayoutMultiplier,
        baseDefinition: selectedContract.id
    };
}

/**
 * Calculate payout for a contract
 * @param {Object} contract - Contract object
 * @param {Object} itemData - Item data from items.js
 * @returns {number} - Contract payout amount
 */
export function calculateContractPayout(contract, itemData) {
    if (!itemData || !contract) {
        return 0;
    }
    
    const baseItemPrice = itemData.basePrice || 0;
    const quantity = contract.quantity || 0;
    const multiplier = contract.payoutMultiplier || 1;
    
    return baseItemPrice * quantity * multiplier;
}

// Export the contract generation functions
export const contracts = {
    definitions: contractDefinitions,
    generate: generateRandomContract,
    calculatePayout: calculateContractPayout
};