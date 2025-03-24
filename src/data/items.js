/**
 * Item Definitions and Recipes
 * 
 * Defines all craftable items, materials, and their properties.
 * Also includes recipes, crafting times, and tool requirements.
 */

// Material definitions
export const materials = {
    iron: {
        name: "Iron",
        description: "Basic metal for crafting tools and weapons",
        basePrice: 2.50, 
        unit: "pound"
    },
    coal: {
        name: "Coal",
        description: "Fuel for the forge",
        basePrice: 1.00,
        unit: "pound"
    },
    wood: {
        name: "Wood",
        description: "Used for handles and structural components",
        basePrice: 1.50,
        unit: "board"
    },
    leather: {
        name: "Leather",
        description: "Used for handles and decorative elements",
        basePrice: 3.00,
        unit: "piece"
    },
    gunpowder: {
        name: "Gunpowder",
        description: "Used in ammunition crafting",
        basePrice: 5.00,
        unit: "ounce"
    },
    copper: {
        name: "Copper",
        description: "Soft metal used for decorative elements and wire",
        basePrice: 3.00,
        unit: "pound"
    },
    silver: {
        name: "Silver",
        description: "Precious metal for decorative items",
        basePrice: 12.00,
        unit: "ounce"
    },
    gold: {
        name: "Gold",
        description: "Valuable precious metal for luxury items",
        basePrice: 25.00,
        unit: "ounce"
    }
};

// Tool definitions
export const tools = {
    hammer: {
        name: "Hammer",
        description: "Basic shaping tool for metalwork",
        durability: 30,
        basePrice: 10.00,
        category: "tool"
    },
    anvil: {
        name: "Anvil",
        description: "Heavy metal block for shaping metal",
        durability: 50,
        basePrice: 35.00,
        category: "tool"
    },
    tongs: {
        name: "Tongs",
        description: "For holding hot metal while working",
        durability: 40,
        basePrice: 15.00,
        category: "tool"
    },
    saw: {
        name: "Saw",
        description: "For cutting wood",
        durability: 35,
        basePrice: 12.00,
        category: "tool"
    },
    file: {
        name: "File",
        description: "For smoothing and final shaping",
        durability: 25,
        basePrice: 8.00,
        category: "tool"
    },
    chisel: {
        name: "Chisel",
        description: "For detailed metal work",
        durability: 20,
        basePrice: 7.50,
        category: "tool"
    },
    needle: {
        name: "Needle",
        description: "For working with leather",
        durability: 15,
        basePrice: 5.00,
        category: "tool"
    },
    scissors: {
        name: "Scissors",
        description: "For cutting leather and cloth",
        durability: 30,
        basePrice: 9.00,
        category: "tool"
    }
};

// Craftable item definitions and recipes
export const items = {
    // Basic items (initially available)
    horseshoe: {
        name: "Horseshoe",
        description: "Standard horseshoe for horses",
        category: "metal",
        complexity: "simple",
        craftingTime: 30, // seconds
        basePrice: 5.00,
        requiredMaterials: {
            iron: 2,
            coal: 1
        },
        requiredTools: ["hammer", "tongs", "anvil"],
        coalUsage: 5,
        unlocked: true
    },
    nail: {
        name: "Nail",
        description: "Basic iron nail",
        category: "metal",
        complexity: "simple",
        craftingTime: 10,
        basePrice: 0.25,
        requiredMaterials: {
            iron: 0.2
        },
        requiredTools: ["hammer", "anvil"],
        coalUsage: 2,
        batchSize: 10, // Craft 10 at a time
        unlocked: true
    },
    hinge: {
        name: "Hinge",
        description: "Metal hinge for doors and cabinets",
        category: "metal",
        complexity: "simple",
        craftingTime: 25,
        basePrice: 2.00,
        requiredMaterials: {
            iron: 1
        },
        requiredTools: ["hammer", "tongs", "anvil"],
        coalUsage: 3,
        unlocked: true
    },
    pickaxe: {
        name: "Pickaxe",
        description: "Tool for mining operations",
        category: "metal",
        complexity: "medium",
        craftingTime: 60,
        basePrice: 15.00,
        requiredMaterials: {
            iron: 4,
            wood: 1
        },
        requiredTools: ["hammer", "tongs", "anvil", "saw"],
        coalUsage: 8,
        unlocked: true
    },
    hatchet: {
        name: "Hatchet",
        description: "Small axe for chopping wood",
        category: "metal",
        complexity: "medium",
        craftingTime: 45,
        basePrice: 12.00,
        requiredMaterials: {
            iron: 3,
            wood: 1
        },
        requiredTools: ["hammer", "tongs", "anvil", "saw"],
        coalUsage: 7,
        unlocked: true
    },
    
    // Medium complexity items
    knife: {
        name: "Knife",
        description: "General purpose knife",
        category: "metal",
        complexity: "medium",
        craftingTime: 40,
        basePrice: 8.00,
        requiredMaterials: {
            iron: 1.5,
            wood: 0.5,
            leather: 0.5
        },
        requiredTools: ["hammer", "tongs", "anvil", "file"],
        coalUsage: 5,
        unlocked: true
    },
    pot: {
        name: "Iron Pot",
        description: "Cooking pot for the home",
        category: "metal",
        complexity: "medium",
        craftingTime: 50,
        basePrice: 10.00,
        requiredMaterials: {
            iron: 5
        },
        requiredTools: ["hammer", "tongs", "anvil"],
        coalUsage: 10,
        unlocked: true
    },
    
    // Advanced items (unlockable)
    rifle: {
        name: "Rifle",
        description: "Long-range firearm",
        category: "weapon",
        complexity: "complex",
        craftingTime: 120,
        basePrice: 45.00,
        requiredMaterials: {
            iron: 8,
            wood: 2
        },
        requiredTools: ["hammer", "tongs", "anvil", "file", "saw", "chisel"],
        coalUsage: 15,
        unlocked: false,
        blueprintPrice: 50.00
    },
    revolver: {
        name: "Revolver",
        description: "Six-shooter sidearm",
        category: "weapon",
        complexity: "complex",
        craftingTime: 100,
        basePrice: 35.00,
        requiredMaterials: {
            iron: 5,
            wood: 1
        },
        requiredTools: ["hammer", "tongs", "anvil", "file", "chisel"],
        coalUsage: 12,
        unlocked: false,
        blueprintPrice: 40.00
    },
    bullets: {
        name: "Bullets",
        description: "Ammunition for firearms",
        category: "weapon",
        complexity: "medium",
        craftingTime: 30,
        basePrice: 0.50,
        requiredMaterials: {
            iron: 0.5,
            gunpowder: 0.5
        },
        requiredTools: ["tongs", "hammer"],
        coalUsage: 2,
        batchSize: 10,
        unlocked: false,
        blueprintPrice: 25.00
    },
    
    // Decorative items (unlockable)
    decorativeHorseshoe: {
        name: "Decorative Horseshoe",
        description: "Ornate horseshoe for good luck",
        category: "metal",
        complexity: "medium",
        craftingTime: 45,
        basePrice: 12.00,
        requiredMaterials: {
            iron: 2,
            copper: 0.5
        },
        requiredTools: ["hammer", "tongs", "anvil", "chisel", "file"],
        coalUsage: 6,
        unlocked: false,
        blueprintPrice: 15.00
    },
    belt_buckle: {
        name: "Belt Buckle",
        description: "Decorative belt buckle",
        category: "metal",
        complexity: "medium",
        craftingTime: 35,
        basePrice: 8.00,
        requiredMaterials: {
            iron: 1,
            copper: 0.5
        },
        requiredTools: ["hammer", "tongs", "anvil", "chisel", "file"],
        coalUsage: 4,
        unlocked: false,
        blueprintPrice: 10.00
    },
    silverCandelabra: {
        name: "Silver Candelabra",
        description: "Elegant silver candle holder",
        category: "metal",
        complexity: "complex",
        craftingTime: 90,
        basePrice: 65.00,
        requiredMaterials: {
            silver: 3,
            iron: 1
        },
        requiredTools: ["hammer", "tongs", "anvil", "chisel", "file"],
        coalUsage: 10,
        unlocked: false,
        blueprintPrice: 35.00
    },
    
    // Tools to craft
    new_hammer: {
        name: "Hammer",
        description: "Crafted replacement hammer",
        category: "tool",
        complexity: "simple",
        craftingTime: 40,
        basePrice: 10.00,
        requiredMaterials: {
            iron: 2,
            wood: 1
        },
        requiredTools: ["tongs", "anvil"],
        coalUsage: 5,
        createsTool: "hammer",
        unlocked: true
    },
    new_tongs: {
        name: "Tongs",
        description: "Crafted replacement tongs",
        category: "tool",
        complexity: "simple",
        craftingTime: 30,
        basePrice: 15.00,
        requiredMaterials: {
            iron: 3
        },
        requiredTools: ["hammer", "anvil"],
        coalUsage: 6,
        createsTool: "tongs",
        unlocked: true
    },
    new_file: {
        name: "File",
        description: "Crafted replacement file",
        category: "tool",
        complexity: "medium",
        craftingTime: 35,
        basePrice: 8.00,
        requiredMaterials: {
            iron: 1.5
        },
        requiredTools: ["hammer", "tongs", "anvil"],
        coalUsage: 4,
        createsTool: "file",
        unlocked: true
    },
    new_chisel: {
        name: "Chisel",
        description: "Crafted replacement chisel",
        category: "tool",
        complexity: "medium",
        craftingTime: 30,
        basePrice: 7.50,
        requiredMaterials: {
            iron: 1,
            wood: 0.5
        },
        requiredTools: ["hammer", "tongs", "anvil", "file"],
        coalUsage: 3,
        createsTool: "chisel",
        unlocked: true
    }
};

// Convenience method to get all item definitions
export function getAllItems() {
    return {
        materials,
        tools,
        craftableItems: items
    };
}

// Convenience method to get all unlocked items
export function getUnlockedItems() {
    const unlocked = {};
    
    for (const [id, item] of Object.entries(items)) {
        if (item.unlocked) {
            unlocked[id] = item;
        }
    }
    
    return unlocked;
}

// Get an item by its ID
export function getItemById(itemId) {
    if (items[itemId]) {
        return { ...items[itemId], id: itemId };
    }
    
    if (materials[itemId]) {
        return { ...materials[itemId], id: itemId };
    }
    
    if (tools[itemId]) {
        return { ...tools[itemId], id: itemId };
    }
    
    return null;
}