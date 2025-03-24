/**
 * UI Manager
 * 
 * Manages all UI updates and interactions with the game systems.
 * Handles rendering game state to the UI elements.
 */
export class UIManager {
    constructor(
        eventEmitter,
        inventorySystem,
        coalSystem,
        craftingSystem,
        blueprintSystem,
        storefrontSystem,
        contractSystem,
        workerSystem,
        timeSystem
    ) {
        this.eventEmitter = eventEmitter;
        this.inventory = inventorySystem;
        this.coal = coalSystem;
        this.crafting = craftingSystem;
        this.blueprints = blueprintSystem;
        this.storefront = storefrontSystem;
        this.contracts = contractSystem;
        this.workers = workerSystem;
        this.time = timeSystem;
        
        // DOM element references
        this.elements = {
            // Header elements
            gameTime: document.getElementById('game-time'),
            money: document.getElementById('money'),
            
            // Materials inventory
            materialsTable: document.getElementById('materials-table').querySelector('tbody'),
            buyMaterialsBtn: document.getElementById('buy-materials-btn'),
            
            // Coal/forge status
            coalBar: document.getElementById('coal-bar'),
            coalPercentage: document.getElementById('coal-percentage'),
            refillCoalBtn: document.getElementById('refill-coal-btn'),
            
            // Tools section
            toolsTable: document.getElementById('tools-table').querySelector('tbody'),
            
            // Crafting section
            recipeSelect: document.getElementById('recipe-select'),
            craftBtn: document.getElementById('craft-btn'),
            craftingJob: document.getElementById('crafting-job'),
            craftingBar: document.getElementById('crafting-bar'),
            
            // Storefront section
            storefrontTable: document.getElementById('storefront-table').querySelector('tbody'),
            
            // Contracts section
            availableContracts: document.getElementById('available-contracts'),
            
            // Employees section
            employeesTable: document.getElementById('employees-table').querySelector('tbody'),
            hireEmployeeBtn: document.getElementById('hire-employee-btn'),
            
            // Blueprints section
            availableBlueprints: document.getElementById('available-blueprints'),
            buyBlueprintBtn: document.getElementById('buy-blueprint-btn')
        };
        
        // Register event listeners
        this.registerEventListeners();
    }
    
    /**
     * Initialize the UI
     */
    initialize() {
        // Initial UI render
        this.updateMoneyDisplay();
        this.updateMaterialsUI();
        this.updateCoalUI();
        this.updateToolsUI();
        this.updateCraftingUI();
        this.updateStorefrontUI();
        this.updateContractsUI();
        this.updateWorkersUI();
        this.updateBlueprintsUI();
        
        // Set up button listeners
        this.setupButtonListeners();
    }
    
    /**
     * Register event listeners
     */
    registerEventListeners() {
        // Inventory events
        this.eventEmitter.on('inventory:updated', () => {
            this.updateMoneyDisplay();
            this.updateMaterialsUI();
            this.updateToolsUI();
        });
        
        this.eventEmitter.on('money:updated', (amount) => {
            this.updateMoneyDisplay();
        });
        
        // Coal events
        this.eventEmitter.on('coal:updated', (level) => {
            this.updateCoalUI();
        });
        
        // Crafting events
        this.eventEmitter.on('crafting:started', (job) => {
            this.updateCraftingUI();
        });
        
        this.eventEmitter.on('crafting:progress', (progress) => {
            this.updateCraftingProgress(progress);
        });
        
        this.eventEmitter.on('crafting:completed', () => {
            this.updateCraftingUI();
        });
        
        this.eventEmitter.on('crafting:paused', () => {
            this.updateCraftingUI();
        });
        
        this.eventEmitter.on('crafting:resumed', () => {
            this.updateCraftingUI();
        });
        
        this.eventEmitter.on('crafting:canceled', () => {
            this.updateCraftingUI();
        });
        
        this.eventEmitter.on('crafting:queue-updated', () => {
            this.updateCraftingUI();
        });
        
        // Blueprint events
        this.eventEmitter.on('blueprint:unlocked', () => {
            this.updateBlueprintsUI();
            this.updateCraftingUI(); // Update recipe options
        });
        
        // Storefront events
        this.eventEmitter.on('storefront:updated', () => {
            this.updateStorefrontUI();
        });
        
        // Contract events
        this.eventEmitter.on('contract:available', () => {
            this.updateContractsUI();
        });
        
        this.eventEmitter.on('contract:special-available', () => {
            this.updateContractsUI();
        });
        
        this.eventEmitter.on('contract:completed', () => {
            this.updateContractsUI();
        });
        
        this.eventEmitter.on('contract:expired', () => {
            this.updateContractsUI();
        });
        
        // Worker events
        this.eventEmitter.on('worker:hired', () => {
            this.updateWorkersUI();
        });
        
        this.eventEmitter.on('worker:fired', () => {
            this.updateWorkersUI();
        });
        
        this.eventEmitter.on('worker:task-assigned', () => {
            this.updateWorkersUI();
        });
        
        this.eventEmitter.on('worker:resting', () => {
            this.updateWorkersUI();
        });
        
        this.eventEmitter.on('worker:working', () => {
            this.updateWorkersUI();
        });
        
        // Time events
        this.eventEmitter.on('time:tick', () => {
            this.updateTimeDisplay();
        });
    }
    
    /**
     * Set up button listeners
     */
    setupButtonListeners() {
        // Buy materials button
        if (this.elements.buyMaterialsBtn) {
            this.elements.buyMaterialsBtn.addEventListener('click', () => {
                this.showMaterialPurchaseModal();
            });
        }
        
        // Refill coal button
        if (this.elements.refillCoalBtn) {
            this.elements.refillCoalBtn.addEventListener('click', () => {
                this.eventEmitter.emit('coal:refill');
            });
        }
        
        // Craft button
        if (this.elements.craftBtn) {
            this.elements.craftBtn.addEventListener('click', () => {
                const selectedRecipe = this.elements.recipeSelect.value;
                if (selectedRecipe) {
                    this.eventEmitter.emit('crafting:start', selectedRecipe);
                }
            });
        }
        
        // Hire employee button
        if (this.elements.hireEmployeeBtn) {
            this.elements.hireEmployeeBtn.addEventListener('click', () => {
                this.showHireEmployeeModal();
            });
        }
        
        // Buy blueprint button
        if (this.elements.buyBlueprintBtn) {
            this.elements.buyBlueprintBtn.addEventListener('click', () => {
                this.showBuyBlueprintModal();
            });
        }
    }
    
    /**
     * Update the UI (called on each game tick)
     */
    update() {
        this.updateTimeDisplay();
        
        // Update time-sensitive UI elements
        this.updateContractsUI(); // Update contract timers
        this.updateWorkersUI();   // Update worker fatigue displays
    }
    
    /**
     * Update the money display
     */
    updateMoneyDisplay() {
        if (this.elements.money) {
            this.elements.money.textContent = `Cash: $${this.inventory.getMoney().toFixed(2)}`;
        }
    }
    
    /**
     * Update the materials inventory UI
     */
    updateMaterialsUI() {
        if (!this.elements.materialsTable) return;
        
        const materials = this.inventory.getMaterials();
        
        // Clear the table
        this.elements.materialsTable.innerHTML = '';
        
        // Add rows for each material
        for (const [materialId, amount] of Object.entries(materials)) {
            // Skip if zero amount
            if (amount <= 0) continue;
            
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${materialId}</td>
                <td>${amount}</td>
                <td>
                    <button class="small-btn" data-action="use-material" data-material="${materialId}">Use</button>
                </td>
            `;
            
            this.elements.materialsTable.appendChild(row);
        }
        
        // Add event listeners for the use buttons
        const useButtons = this.elements.materialsTable.querySelectorAll('[data-action="use-material"]');
        useButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const materialId = e.target.dataset.material;
                // Implement any "use material" actions here if needed
                console.log(`Using material: ${materialId}`);
            });
        });
    }
    
    /**
     * Update the coal/forge UI
     */
    updateCoalUI() {
        if (!this.elements.coalBar || !this.elements.coalPercentage) return;
        
        const coalLevel = this.coal.getLevel();
        
        // Update progress bar
        this.elements.coalBar.style.width = `${coalLevel}%`;
        
        // Update percentage text
        this.elements.coalPercentage.textContent = `${Math.floor(coalLevel)}%`;
        
        // Update color based on level
        if (coalLevel <= 20) {
            this.elements.coalBar.style.backgroundColor = '#ff4c4c'; // Red
        } else if (coalLevel <= 50) {
            this.elements.coalBar.style.backgroundColor = '#ff9c3c'; // Orange
        } else {
            this.elements.coalBar.style.backgroundColor = '#333';    // Default dark
        }
        
        // Update refill button state
        if (this.elements.refillCoalBtn) {
            this.elements.refillCoalBtn.disabled = coalLevel >= 100 || this.inventory.materials.coal <= 0;
        }
    }
    
    /**
     * Update the tools UI
     */
    updateToolsUI() {
        if (!this.elements.toolsTable) return;
        
        const tools = this.inventory.getTools();
        
        // Clear the table
        this.elements.toolsTable.innerHTML = '';
        
        // Add rows for each tool
        for (const [toolId, toolData] of Object.entries(tools)) {
            const row = document.createElement('tr');
            
            // Calculate durability percentage
            const durabilityPercent = (toolData.uses / toolData.maxUses) * 100;
            
            row.innerHTML = `
                <td>${toolId}</td>
                <td>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${durabilityPercent}%; background-color: ${this.getDurabilityColor(durabilityPercent)}"></div>
                    </div>
                    <span>${Math.floor(durabilityPercent)}%</span>
                </td>
                <td>
                    <button class="small-btn" data-action="repair-tool" data-tool="${toolId}" ${durabilityPercent >= 100 ? 'disabled' : ''}>Repair</button>
                </td>
            `;
            
            this.elements.toolsTable.appendChild(row);
        }
        
        // Add event listeners for the repair buttons
        const repairButtons = this.elements.toolsTable.querySelectorAll('[data-action="repair-tool"]');
        repairButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const toolId = e.target.dataset.tool;
                // Implement repair action if needed
                console.log(`Repairing tool: ${toolId}`);
            });
        });
    }
    
    /**
     * Update the crafting UI
     */
    updateCraftingUI() {
        // Update recipe select
        if (this.elements.recipeSelect) {
            // Get current selection
            const currentSelection = this.elements.recipeSelect.value;
            
            // Clear options
            this.elements.recipeSelect.innerHTML = '';
            
            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '-- Select item to craft --';
            this.elements.recipeSelect.appendChild(defaultOption);
            
            // Get craftable items
            const craftableItems = this.crafting.getCraftableItems();
            
            // Add options for each craftable item
            for (const item of craftableItems) {
                const option = document.createElement('option');
                option.value = item.id;
                option.textContent = item.name;
                
                // Check if can craft
                const canCraft = this.crafting.canCraft(item.id);
                if (!canCraft.canCraft) {
                    option.disabled = true;
                    option.textContent += ` (${canCraft.reason})`;
                }
                
                this.elements.recipeSelect.appendChild(option);
            }
            
            // Restore selection if possible
            if (currentSelection && Array.from(this.elements.recipeSelect.options).some(option => option.value === currentSelection)) {
                this.elements.recipeSelect.value = currentSelection;
            }
        }
        
        // Update craft button state
        if (this.elements.craftBtn) {
            const selectedRecipe = this.elements.recipeSelect.value;
            const canCraft = selectedRecipe ? this.crafting.canCraft(selectedRecipe).canCraft : false;
            this.elements.craftBtn.disabled = !canCraft;
        }
        
        // Update current craft job
        this.updateCurrentCraftJob();
    }
    
    /**
     * Update the current craft job display
     */
    updateCurrentCraftJob() {
        if (!this.elements.craftingJob || !this.elements.craftingBar) return;
        
        const currentCraft = this.crafting.getCurrentCraft();
        
        if (!currentCraft) {
            this.elements.craftingJob.textContent = 'No active crafting job';
            this.elements.craftingBar.style.width = '0%';
            return;
        }
        
        // Get item name and progress
        const itemName = currentCraft.name;
        const progress = (currentCraft.progress / currentCraft.craftingTime) * 100;
        
        // Update job text
        if (currentCraft.paused) {
            this.elements.craftingJob.innerHTML = `
                <div>Crafting ${itemName} - PAUSED</div>
                <div class="pause-reason">${currentCraft.pauseReason || 'Unknown reason'}</div>
                <button id="resume-craft" class="small-btn">Resume</button>
                <button id="cancel-craft" class="small-btn">Cancel</button>
            `;
            
            // Add event listeners
            const resumeBtn = document.getElementById('resume-craft');
            const cancelBtn = document.getElementById('cancel-craft');
            
            if (resumeBtn) {
                resumeBtn.addEventListener('click', () => {
                    this.crafting.resumeCrafting();
                });
            }
            
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.crafting.cancelCurrentCraft();
                });
            }
        } else {
            this.elements.craftingJob.innerHTML = `
                <div>Crafting ${itemName}</div>
                <div>${Math.floor(currentCraft.progress)}/${currentCraft.craftingTime} seconds</div>
                <button id="cancel-craft" class="small-btn">Cancel</button>
            `;
            
            // Add event listener
            const cancelBtn = document.getElementById('cancel-craft');
            if (cancelBtn) {
                cancelBtn.addEventListener('click', () => {
                    this.crafting.cancelCurrentCraft();
                });
            }
        }
        
        // Update progress bar
        this.elements.craftingBar.style.width = `${progress}%`;
    }
    
    /**
     * Update the crafting progress display
     */
    updateCraftingProgress(progress) {
        if (!this.elements.craftingBar) return;
        
        const percentage = progress.percentage;
        this.elements.craftingBar.style.width = `${percentage}%`;
        
        // Update current job text if needed
        const currentCraft = this.crafting.getCurrentCraft();
        if (currentCraft && !currentCraft.paused && this.elements.craftingJob) {
            const progressText = this.elements.craftingJob.querySelector('div:nth-child(2)');
            if (progressText) {
                progressText.textContent = `${Math.floor(currentCraft.progress)}/${currentCraft.craftingTime} seconds`;
            }
        }
    }
    
    /**
     * Update the storefront UI
     */
    updateStorefrontUI() {
        if (!this.elements.storefrontTable) return;
        
        const storefrontItems = this.storefront.getStorefrontItems();
        
        // Clear the table
        this.elements.storefrontTable.innerHTML = '';
        
        // Add rows for each item
        for (const [itemId, itemData] of Object.entries(storefrontItems)) {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${itemData.name}</td>
                <td>$${itemData.currentPrice.toFixed(2)}</td>
                <td>${itemData.quantity}</td>
                <td>
                    <button class="small-btn" data-action="remove-from-storefront" data-item="${itemId}">Remove</button>
                    <button class="small-btn" data-action="sell-item" data-item="${itemId}">Sell</button>
                </td>
            `;
            
            this.elements.storefrontTable.appendChild(row);
        }
        
        // Add empty state if no items
        if (Object.keys(storefrontItems).length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="4" class="text-center">No items in storefront</td>
            `;
            this.elements.storefrontTable.appendChild(emptyRow);
        }
        
        // Add event listeners for buttons
        const removeButtons = this.elements.storefrontTable.querySelectorAll('[data-action="remove-from-storefront"]');
        removeButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.target.dataset.item;
                this.eventEmitter.emit('storefront:remove', itemId, 1);
            });
        });
        
        const sellButtons = this.elements.storefrontTable.querySelectorAll('[data-action="sell-item"]');
        sellButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const itemId = e.target.dataset.item;
                this.eventEmitter.emit('storefront:sell', itemId, 1);
            });
        });
    }
    
    /**
     * Update the contracts UI
     */
    updateContractsUI() {
        if (!this.elements.availableContracts) return;
        
        const contracts = this.contracts.getContracts();
        const allContracts = [...contracts.standard, ...contracts.special];
        
        // Clear the container
        this.elements.availableContracts.innerHTML = '';
        
        // Add cards for each contract
        for (const contract of allContracts) {
            // Calculate time remaining
            const timeRemaining = this.contracts.getContractTimeRemaining(contract);
            
            // Create card element
            const card = document.createElement('div');
            card.className = `card contract-card ${contract.isSpecial ? 'special-contract' : ''}`;
            card.dataset.contractId = contract.id;
            
            card.innerHTML = `
                <div class="card-title">${contract.customer}</div>
                <div class="card-description">${contract.description || 'No description'}</div>
                <div class="contract-details">
                    <div>Item: ${contract.itemName || contract.item}</div>
                    <div>Quantity: ${contract.quantity}</div>
                    <div>Payout: $${contract.payout.toFixed(2)}</div>
                    <div>Time Remaining: ${timeRemaining.minutes}m ${timeRemaining.seconds}s</div>
                </div>
                <div class="progress-container">
                    <div class="progress-bar" style="width: ${timeRemaining.percentage}%; background-color: ${this.getTimeRemainingColor(timeRemaining.percentage)}"></div>
                </div>
                <div class="card-actions">
                    <button class="btn-primary" data-action="fulfill-contract" data-contract="${contract.id}">Fulfill</button>
                    <button class="btn-secondary" data-action="reject-contract" data-contract="${contract.id}">Reject</button>
                </div>
            `;
            
            this.elements.availableContracts.appendChild(card);
        }
        
        // Add empty state if no contracts
        if (allContracts.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No contracts available';
            this.elements.availableContracts.appendChild(emptyState);
        }
        
        // Add event listeners for buttons
        const fulfillButtons = this.elements.availableContracts.querySelectorAll('[data-action="fulfill-contract"]');
        fulfillButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const contractId = e.target.dataset.contract;
                this.eventEmitter.emit('contract:fulfill', contractId);
            });
        });
        
        const rejectButtons = this.elements.availableContracts.querySelectorAll('[data-action="reject-contract"]');
        rejectButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const contractId = e.target.dataset.contract;
                this.eventEmitter.emit('contract:reject', contractId);
            });
        });
    }
    
    /**
     * Update the workers UI
     */
    updateWorkersUI() {
        if (!this.elements.employeesTable) return;
        
        const workers = this.workers.getHiredWorkers();
        
        // Clear the table
        this.elements.employeesTable.innerHTML = '';
        
        // Add rows for each worker
        for (const worker of workers) {
            const row = document.createElement('tr');
            
            // Calculate fatigue percentage
            const fatiguePercent = (worker.fatigue / worker.fatigueMax) * 100;
            
            row.innerHTML = `
                <td>${worker.name}</td>
                <td>${worker.typeName}</td>
                <td>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${fatiguePercent}%; background-color: ${this.getFatigueColor(fatiguePercent)}"></div>
                    </div>
                    <span>${Math.floor(fatiguePercent)}%</span>
                </td>
                <td>${worker.status}</td>
                <td>
                    ${worker.resting ?
                        `<button class="small-btn" data-action="work" data-worker="${worker.id}">Work</button>` :
                        `<button class="small-btn" data-action="rest" data-worker="${worker.id}">Rest</button>`
                    }
                    <button class="small-btn" data-action="assign-task" data-worker="${worker.id}">Assign</button>
                    <button class="small-btn danger" data-action="fire" data-worker="${worker.id}">Fire</button>
                </td>
            `;
            
            this.elements.employeesTable.appendChild(row);
        }
        
        // Add empty state if no workers
        if (workers.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="5" class="text-center">No employees hired</td>
            `;
            this.elements.employeesTable.appendChild(emptyRow);
        }
        
        // Add event listeners for buttons
        const workButtons = this.elements.employeesTable.querySelectorAll('[data-action="work"]');
        workButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const workerId = e.target.dataset.worker;
                this.eventEmitter.emit('worker:work', workerId);
            });
        });
        
        const restButtons = this.elements.employeesTable.querySelectorAll('[data-action="rest"]');
        restButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const workerId = e.target.dataset.worker;
                this.eventEmitter.emit('worker:rest', workerId);
            });
        });
        
        const assignButtons = this.elements.employeesTable.querySelectorAll('[data-action="assign-task"]');
        assignButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const workerId = e.target.dataset.worker;
                this.showAssignTaskModal(workerId);
            });
        });
        
        const fireButtons = this.elements.employeesTable.querySelectorAll('[data-action="fire"]');
        fireButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const workerId = e.target.dataset.worker;
                this.showFireWorkerConfirmation(workerId);
            });
        });
    }
    
    /**
     * Update the blueprints UI
     */
    updateBlueprintsUI() {
        if (!this.elements.availableBlueprints) return;
        
        // Clear the container
        this.elements.availableBlueprints.innerHTML = '';
        
        // Get unlocked blueprints
        const unlockedBlueprints = this.blueprints.getUnlockedBlueprints();
        
        // Create groups by category
        const categories = {};
        
        for (const blueprint of unlockedBlueprints) {
            const category = blueprint.category || 'Other';
            
            if (!categories[category]) {
                categories[category] = [];
            }
            
            categories[category].push(blueprint);
        }
        
        // Create section for each category
        for (const [category, blueprints] of Object.entries(categories)) {
            const section = document.createElement('div');
            section.className = 'blueprint-category';
            
            section.innerHTML = `
                <h3>${this.capitalizeFirstLetter(category)}</h3>
                <div class="blueprint-grid"></div>
            `;
            
            const grid = section.querySelector('.blueprint-grid');
            
            // Add blueprint cards
            for (const blueprint of blueprints) {
                const card = document.createElement('div');
                card.className = 'blueprint-card';
                
                card.innerHTML = `
                    <div class="blueprint-title">${blueprint.name}</div>
                    <div class="blueprint-description">${blueprint.description}</div>
                    <div class="blueprint-complexity">${blueprint.complexity}</div>
                `;
                
                grid.appendChild(card);
            }
            
            this.elements.availableBlueprints.appendChild(section);
        }
        
        // Add empty state if no blueprints
        if (unlockedBlueprints.length === 0) {
            const emptyState = document.createElement('div');
            emptyState.className = 'empty-state';
            emptyState.textContent = 'No blueprints unlocked';
            this.elements.availableBlueprints.appendChild(emptyState);
        }
    }
    
    /**
     * Update the time display
     */
    updateTimeDisplay() {
        if (this.elements.gameTime) {
            this.elements.gameTime.textContent = this.time.getFormattedDateTime();
        }
    }
    
    /**
     * Show material purchase modal
     */
    showMaterialPurchaseModal() {
        // Get materials data
        const materialsList = [];
        
        // This would typically come from a data file
        // but for now we'll use some hardcoded values
        const materialTypes = [
            { id: 'iron', name: 'Iron', price: 2.50, unit: 'pound' },
            { id: 'coal', name: 'Coal', price: 1.00, unit: 'pound' },
            { id: 'wood', name: 'Wood', price: 1.50, unit: 'board' },
            { id: 'leather', name: 'Leather', price: 3.00, unit: 'piece' },
            { id: 'gunpowder', name: 'Gunpowder', price: 5.00, unit: 'ounce' },
            { id: 'copper', name: 'Copper', price: 3.00, unit: 'pound' }
        ];
        
        // Create purchase callback
        const onPurchase = (materials, totalCost) => {
            // Check if any materials selected
            if (Object.keys(materials).length === 0) {
                this.eventEmitter.emit('notification:warning', 'No materials selected');
                return;
            }
            
            // Check if can afford
            if (this.inventory.getMoney() < totalCost) {
                this.eventEmitter.emit('notification:error', 'Not enough money');
                return;
            }
            
            // Purchase materials
            this.eventEmitter.emit('purchase:materials', materials, totalCost);
        };
        
        // Show modal
        this.eventEmitter.emit('modal:show', {
            title: 'Purchase Materials',
            content: `
                <div class="purchase-materials">
                    <div class="materials-list">
                        ${materialTypes.map(material => `
                            <div class="material-item">
                                <div class="material-info">
                                    <span class="material-name">${material.name}</span>
                                    <span class="material-price">$${material.price.toFixed(2)} per ${material.unit}</span>
                                </div>
                                <div class="material-controls">
                                    <input type="number" id="buy-${material.id}" min="0" max="100" value="0" class="material-quantity">
                                    <span class="material-total">$0.00</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="purchase-total">
                        <span>Total:</span>
                        <span id="purchase-total-amount">$0.00</span>
                    </div>
                </div>
            `,
            showConfirm: true,
            showCancel: true,
            confirmText: 'Purchase',
            cancelText: 'Cancel',
            onConfirm: () => {
                // Collect purchase data
                const purchase = {};
                let totalCost = 0;
                
                for (const material of materialTypes) {
                    const quantity = parseInt(document.getElementById(`buy-${material.id}`).value) || 0;
                    if (quantity > 0) {
                        purchase[material.id] = quantity;
                        totalCost += quantity * material.price;
                    }
                }
                
                // Call purchase callback with data
                onPurchase(purchase, totalCost);
            }
        });
        
        // Set up change listeners for quantity inputs after modal is shown
        setTimeout(() => {
            for (const material of materialTypes) {
                const input = document.getElementById(`buy-${material.id}`);
                if (!input) continue;
                
                const totalSpan = input.parentElement.querySelector('.material-total');
                
                input.addEventListener('input', () => {
                    const quantity = parseInt(input.value) || 0;
                    const total = quantity * material.price;
                    totalSpan.textContent = `${total.toFixed(2)}`;
                    
                    // Update grand total
                    let grandTotal = 0;
                    for (const mat of materialTypes) {
                        const qty = parseInt(document.getElementById(`buy-${mat.id}`)?.value) || 0;
                        grandTotal += qty * mat.price;
                    }
                    
                    const totalAmountElement = document.getElementById('purchase-total-amount');
                    if (totalAmountElement) {
                        totalAmountElement.textContent = `${grandTotal.toFixed(2)}`;
                    }
                });
            }
        }, 100);
    }
    
    /**
     * Show hire employee modal
     */
    showHireEmployeeModal() {
        // Get available worker types
        const workerTypes = this.workers.getAvailableWorkerTypes();
        
        // Create modal content
        let content = '<div class="worker-types">';
        
        for (const workerType of workerTypes) {
            content += `
                <div class="worker-type-card" data-worker-type="${workerType.id}">
                    <h3>${workerType.name}</h3>
                    <p>${workerType.description}</p>
                    <div class="worker-stats">
                        <div>Daily Salary: ${workerType.salary.toFixed(2)}</div>
                        <div>Crafting Speed: ${(workerType.speedMultiplier * 100).toFixed(0)}%</div>
                        <div>Fatigue Rate: ${(workerType.fatigueRate * 100).toFixed(0)}%</div>
                    </div>
                    <div class="worker-cost">
                        <div>Hiring Cost: ${workerType.hireCost.toFixed(2)}</div>
                        ${workerType.hasDiscount ? '<div class="discount">Discount Applied!</div>' : ''}
                    </div>
                    <button class="hire-btn" data-hire-type="${workerType.id}" ${this.inventory.getMoney() < workerType.hireCost ? 'disabled' : ''}>
                        Hire
                    </button>
                </div>
            `;
        }
        
        content += '</div>';
        
        // Show modal
        this.eventEmitter.emit('modal:show', {
            title: 'Hire Employee',
            content: content,
            showConfirm: false,
            showCancel: true,
            cancelText: 'Close'
        });
        
        // Add event listeners for hire buttons after modal is shown
        setTimeout(() => {
            const hireButtons = document.querySelectorAll('.hire-btn');
            hireButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const workerTypeId = e.target.dataset.hireType;
                    this.eventEmitter.emit('worker:hire', workerTypeId);
                    this.eventEmitter.emit('modal:hide');
                });
            });
        }, 100);
    }
    
    /**
     * Show assign task modal
     * @param {string} workerId - ID of the worker
     */
    showAssignTaskModal(workerId) {
        // Get worker data
        const workers = this.workers.getHiredWorkers();
        const worker = workers.find(w => w.id === workerId);
        
        if (!worker) return;
        
        // Get available tasks
        const craftableItems = this.crafting.getCraftableItems();
        
        // Create modal content
        let content = `
            <div class="assign-task">
                <h3>Assign Task to ${worker.name}</h3>
                
                <div class="task-group">
                    <h4>Crafting</h4>
                    <select id="craft-item-select">
                        <option value="">-- Select item to craft --</option>
                        ${craftableItems.map(item => `
                            <option value="${item.id}">${item.name}</option>
                        `).join('')}
                    </select>
                    <button id="assign-crafting" class="btn-primary">Assign Crafting</button>
                </div>
                
                <div class="task-group">
                    <h4>Maintenance</h4>
                    <button id="assign-coal" class="btn-primary">Assign Coal Monitoring</button>
                </div>
                
                <div class="task-group">
                    <h4>Rest</h4>
                    <button id="assign-rest" class="btn-primary">Rest Worker</button>
                </div>
            </div>
        `;
        
        // Show modal
        this.eventEmitter.emit('modal:show', {
            title: 'Assign Task',
            content: content,
            showConfirm: false,
            showCancel: true,
            cancelText: 'Close'
        });
        
        // Add event listeners after modal is shown
        setTimeout(() => {
            // Crafting task
            const assignCraftingBtn = document.getElementById('assign-crafting');
            if (assignCraftingBtn) {
                assignCraftingBtn.addEventListener('click', () => {
                    const itemId = document.getElementById('craft-item-select').value;
                    if (!itemId) {
                        this.eventEmitter.emit('notification:warning', 'No item selected');
                        return;
                    }
                    
                    this.eventEmitter.emit('worker:assign-task', workerId, {
                        type: 'crafting',
                        itemId: itemId
                    });
                    
                    this.eventEmitter.emit('modal:hide');
                });
            }
            
            // Coal task
            const assignCoalBtn = document.getElementById('assign-coal');
            if (assignCoalBtn) {
                assignCoalBtn.addEventListener('click', () => {
                    this.eventEmitter.emit('worker:assign-task', workerId, {
                        type: 'coal'
                    });
                    
                    this.eventEmitter.emit('modal:hide');
                });
            }
            
            // Rest
            const assignRestBtn = document.getElementById('assign-rest');
            if (assignRestBtn) {
                assignRestBtn.addEventListener('click', () => {
                    this.eventEmitter.emit('worker:rest', workerId);
                    this.eventEmitter.emit('modal:hide');
                });
            }
        }, 100);
    }
    
    /**
     * Show fire worker confirmation
     * @param {string} workerId - ID of the worker
     */
    showFireWorkerConfirmation(workerId) {
        // Get worker data
        const workers = this.workers.getHiredWorkers();
        const worker = workers.find(w => w.id === workerId);
        
        if (!worker) return;
        
        // Show confirmation
        this.eventEmitter.emit('modal:show', {
            title: 'Confirm Firing',
            content: `
                <p>Are you sure you want to fire ${worker.name}?</p>
                <p>They will leave immediately and you will need to pay a new hiring fee if you want them back.</p>
            `,
            showConfirm: true,
            showCancel: true,
            confirmText: 'Fire',
            cancelText: 'Cancel',
            onConfirm: () => {
                this.eventEmitter.emit('worker:fire', workerId);
            }
        });
    }
    
    /**
     * Show buy blueprint modal
     */
    showBuyBlueprintModal() {
        // Get available blueprints
        const availableBlueprints = this.blueprints.getAvailableBlueprints();
        
        // Create modal content
        let content = '<div class="blueprint-list">';
        
        if (availableBlueprints.length === 0) {
            content += '<p>No blueprints available for purchase.</p>';
        } else {
            for (const blueprint of availableBlueprints) {
                const canAfford = this.inventory.getMoney() >= blueprint.price;
                
                content += `
                    <div class="blueprint-card ${canAfford ? '' : 'cannot-afford'}" data-blueprint-id="${blueprint.id}">
                        <h3>${blueprint.name}</h3>
                        <p>${blueprint.description}</p>
                        <div class="blueprint-details">
                            <div>Category: ${blueprint.category}</div>
                            <div>Complexity: ${blueprint.complexity}</div>
                            <div class="blueprint-price">Price: ${blueprint.price.toFixed(2)}</div>
                        </div>
                        <button class="buy-blueprint-btn" data-blueprint-id="${blueprint.id}" ${canAfford ? '' : 'disabled'}>
                            ${canAfford ? 'Purchase' : 'Cannot Afford'}
                        </button>
                    </div>
                `;
            }
        }
        
        content += '</div>';
        
        // Show modal
        this.eventEmitter.emit('modal:show', {
            title: 'Purchase Blueprints',
            content: content,
            showConfirm: false,
            showCancel: true,
            cancelText: 'Close'
        });
        
        // Add event listeners for purchase buttons after modal is shown
        setTimeout(() => {
            const purchaseButtons = document.querySelectorAll('.buy-blueprint-btn');
            purchaseButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    const blueprintId = e.target.dataset.blueprintId;
                    this.eventEmitter.emit('blueprint:purchase', blueprintId);
                    
                    // Don't hide modal, as we want to see the updated blueprint list
                    // and possibly purchase more
                    
                    // But do update the button state
                    e.target.disabled = true;
                    e.target.textContent = 'Purchased';
                });
            });
        }, 100);
    }
    
    /**
     * Get color for durability percentage
     * @param {number} percentage - Durability percentage
     * @returns {string} - CSS color value
     */
    getDurabilityColor(percentage) {
        if (percentage <= 25) {
            return '#ff4c4c'; // Red
        } else if (percentage <= 50) {
            return '#ff9c3c'; // Orange
        } else if (percentage <= 75) {
            return '#ffeb3c'; // Yellow
        } else {
            return '#4caf50'; // Green
        }
    }
    
    /**
     * Get color for fatigue percentage
     * @param {number} percentage - Fatigue percentage
     * @returns {string} - CSS color value
     */
    getFatigueColor(percentage) {
        if (percentage >= 75) {
            return '#ff4c4c'; // Red
        } else if (percentage >= 50) {
            return '#ff9c3c'; // Orange
        } else if (percentage >= 25) {
            return '#ffeb3c'; // Yellow
        } else {
            return '#4caf50'; // Green
        }
    }
    
    /**
     * Get color for time remaining percentage
     * @param {number} percentage - Time remaining percentage
     * @returns {string} - CSS color value
     */
    getTimeRemainingColor(percentage) {
        if (percentage <= 25) {
            return '#ff4c4c'; // Red
        } else if (percentage <= 50) {
            return '#ff9c3c'; // Orange
        } else {
            return '#4caf50'; // Green
        }
    }
    
    /**
     * Capitalize first letter of a string
     * @param {string} string - String to capitalize
     * @returns {string} - Capitalized string
     */
    capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }
}