/**
 * Worker System
 * 
 * Manages workers/employees who can automate tasks like crafting and coal refilling.
 * Handles hiring, firing, assigning tasks, and worker fatigue.
 */
export class WorkerSystem {
    constructor(eventEmitter, craftingSystem, coalSystem, inventorySystem) {
        this.eventEmitter = eventEmitter;
        this.crafting = craftingSystem;
        this.coal = coalSystem;
        this.inventory = inventorySystem;
        
        // Hired workers
        this.workers = {};
        
        // Available worker types
        this.workerTypes = {
            apprentice: {
                name: "Apprentice",
                description: "A young worker learning the blacksmith trade.",
                baseSalary: 5.00, // per in-game day
                crafting: {
                    speedMultiplier: 0.8,
                    fatigueRate: 1.2
                },
                fatigue: {
                    recoveryRate: 1.0,
                    maxFatigue: 100
                },
                hireCost: 20.00
            },
            journeyman: {
                name: "Journeyman",
                description: "An experienced blacksmith with good skills.",
                baseSalary: 8.00,
                crafting: {
                    speedMultiplier: 1.0,
                    fatigueRate: 1.0
                },
                fatigue: {
                    recoveryRate: 1.2,
                    maxFatigue: 120
                },
                hireCost: 50.00
            },
            master: {
                name: "Master Blacksmith",
                description: "A highly skilled blacksmith with years of experience.",
                baseSalary: 15.00,
                crafting: {
                    speedMultiplier: 1.3,
                    fatigueRate: 0.8
                },
                fatigue: {
                    recoveryRate: 1.5,
                    maxFatigue: 150
                },
                hireCost: 100.00
            }
        };
        
        // Hiring discounts (workerId -> {multiplier, expiryTime})
        this.hiringDiscounts = {};
        
        // Day counter for salary payments
        this.dayCounter = 0;
        
        // Register event listeners
        this.registerEventListeners();
    }
    
    /**
     * Register event listeners
     */
    registerEventListeners() {
        // Listen for hire worker requests
        this.eventEmitter.on('worker:hire', (workerTypeId) => {
            this.hireWorker(workerTypeId);
        });
        
        // Listen for fire worker requests
        this.eventEmitter.on('worker:fire', (workerId) => {
            this.fireWorker(workerId);
        });
        
        // Listen for task assignment requests
        this.eventEmitter.on('worker:assign-task', (workerId, task) => {
            this.assignTask(workerId, task);
        });
        
        // Listen for rest requests
        this.eventEmitter.on('worker:rest', (workerId) => {
            this.setWorkerResting(workerId, true);
        });
        
        // Listen for return-to-work requests
        this.eventEmitter.on('worker:work', (workerId) => {
            this.setWorkerResting(workerId, false);
        });
        
        // Listen for time system day changes
        this.eventEmitter.on('time:new-day', () => {
            this.processDailyWages();
        });
    }
    
    /**
     * Update worker system (called on each game tick)
     */
    update() {
        // Update each worker
        for (const [workerId, worker] of Object.entries(this.workers)) {
            this.updateWorker(workerId, worker);
        }
        
        // Check for expired hiring discounts
        this.updateHiringDiscounts();
    }
    
    /**
     * Update a specific worker
     * @param {string} workerId - ID of the worker
     * @param {Object} worker - Worker data
     */
    updateWorker(workerId, worker) {
        // Skip if worker is resting
        if (worker.resting) {
            // Recover fatigue during rest
            this.recoverFatigue(workerId, worker);
            return;
        }
        
        // Check if worker is too fatigued to work
        if (worker.fatigue >= worker.workerType.fatigue.maxFatigue) {
            // Automatically rest when fatigue is at max
            this.setWorkerResting(workerId, true);
            this.eventEmitter.emit('notification:warning', 
                `${worker.name} is too fatigued to work and needs to rest.`);
            return;
        }
        
        // Check if worker has an assigned task
        if (!worker.currentTask) {
            return;
        }
        
        // Handle different task types
        switch (worker.currentTask.type) {
            case 'crafting':
                this.handleCraftingTask(workerId, worker);
                break;
                
            case 'coal':
                this.handleCoalTask(workerId, worker);
                break;
        }
        
        // Increase fatigue based on work type
        this.increaseFatigue(workerId, worker);
    }
    
    /**
     * Handle crafting task for a worker
     * @param {string} workerId - ID of the worker
     * @param {Object} worker - Worker data
     */
    handleCraftingTask(workerId, worker) {
        const task = worker.currentTask;
        
        // If no active crafting job, start one
        if (!this.crafting.getCurrentCraft() && 
            this.crafting.getCraftingQueue().length === 0) {
            
            // Check if we can craft the item
            const canCraft = this.crafting.canCraft(task.itemId);
            
            if (canCraft.canCraft) {
                // Start crafting with worker speed boost
                const originalSpeedMultiplier = this.crafting.speedMultiplier;
                this.crafting.setSpeedMultiplier(worker.workerType.crafting.speedMultiplier);
                
                // Start crafting
                this.eventEmitter.emit('crafting:start', task.itemId, 1, workerId);
                
                // Reset speed multiplier to original value
                this.crafting.setSpeedMultiplier(originalSpeedMultiplier);
            } else {
                // Can't craft for some reason
                this.eventEmitter.emit('notification:warning', 
                    `${worker.name} can't craft ${task.itemId}: ${canCraft.reason}`);
                
                // Set task to idle
                worker.currentTask = null;
                worker.status = 'idle';
            }
        }
    }
    
    /**
     * Handle coal monitoring task for a worker
     * @param {string} workerId - ID of the worker
     * @param {Object} worker - Worker data
     */
    handleCoalTask(workerId, worker) {
        // Check coal level
        if (this.coal.getLevel() <= 20) {
            // Try to refill coal
            this.eventEmitter.emit('worker:refill-coal', worker.name);
        }
    }
    
    /**
     * Hire a new worker
     * @param {string} workerTypeId - Type of worker to hire
     * @returns {boolean} - Whether hiring was successful
     */
    hireWorker(workerTypeId) {
        // Check if worker type exists
        if (!this.workerTypes[workerTypeId]) {
            this.eventEmitter.emit('notification:error', `Unknown worker type: ${workerTypeId}`);
            return false;
        }
        
        const workerType = this.workerTypes[workerTypeId];
        
        // Calculate hire cost with discounts
        let hireCost = workerType.hireCost;
        const discount = this.getHiringDiscount(workerTypeId);
        
        if (discount) {
            hireCost *= discount;
        }
        
        // Check if player has enough money
        if (this.inventory.getMoney() < hireCost) {
            this.eventEmitter.emit('notification:error', 
                `Not enough money to hire a ${workerType.name}. Cost: $${hireCost.toFixed(2)}`);
            return false;
        }
        
        // Generate a unique worker ID
        const workerId = `${workerTypeId}_${Date.now()}`;
        
        // Generate a random name
        const firstName = this.getRandomFirstName();
        const lastName = this.getRandomLastName();
        const name = `${firstName} ${lastName}`;
        
        // Create worker object
        const worker = {
            id: workerId,
            name,
            type: workerTypeId,
            workerType,
            fatigue: 0,
            salary: workerType.baseSalary,
            currentTask: null,
            status: 'idle',
            resting: false,
            hireDate: new Date()
        };
        
        // Add worker to roster
        this.workers[workerId] = worker;
        
        // Deduct money for hiring
        this.inventory.removeMoney(hireCost);
        
        // Emit events
        this.eventEmitter.emit('worker:hired', worker);
        this.eventEmitter.emit('notification:success', 
            `Hired ${name} as a ${workerType.name} for $${hireCost.toFixed(2)}`);
        
        return true;
    }
    
    /**
     * Fire a worker
     * @param {string} workerId - ID of the worker to fire
     * @returns {boolean} - Whether firing was successful
     */
    fireWorker(workerId) {
        // Check if worker exists
        if (!this.workers[workerId]) {
            this.eventEmitter.emit('notification:error', "Worker not found.");
            return false;
        }
        
        const worker = this.workers[workerId];
        
        // Remove worker
        delete this.workers[workerId];
        
        // Emit events
        this.eventEmitter.emit('worker:fired', worker);
        this.eventEmitter.emit('notification:info', `Fired ${worker.name}.`);
        
        return true;
    }
    
    /**
     * Assign a task to a worker
     * @param {string} workerId - ID of the worker
     * @param {Object} task - Task details
     * @returns {boolean} - Whether assignment was successful
     */
    assignTask(workerId, task) {
        // Check if worker exists
        if (!this.workers[workerId]) {
            this.eventEmitter.emit('notification:error', "Worker not found.");
            return false;
        }
        
        const worker = this.workers[workerId];
        
        // Check if worker is resting
        if (worker.resting) {
            this.eventEmitter.emit('notification:error', `${worker.name} is resting and cannot be assigned tasks.`);
            return false;
        }
        
        // Check if worker is too fatigued
        if (worker.fatigue >= worker.workerType.fatigue.maxFatigue) {
            this.eventEmitter.emit('notification:error', `${worker.name} is too fatigued to work.`);
            return false;
        }
        
        // Validate task based on type
        if (task.type === 'crafting') {
            // Validate that item exists
            if (!task.itemId) {
                this.eventEmitter.emit('notification:error', "No item specified for crafting task.");
                return false;
            }
        } else if (task.type === 'coal') {
            // No additional validation for coal monitoring
        } else {
            this.eventEmitter.emit('notification:error', `Unknown task type: ${task.type}`);
            return false;
        }
        
        // Assign task
        worker.currentTask = task;
        
        // Update status
        switch (task.type) {
            case 'crafting':
                worker.status = `Crafting ${task.itemId}`;
                break;
                
            case 'coal':
                worker.status = 'Monitoring coal';
                break;
        }
        
        // Emit events
        this.eventEmitter.emit('worker:task-assigned', { workerId, task });
        this.eventEmitter.emit('notification:info', 
            `Assigned ${worker.name} to ${task.type} duty.`);
        
        return true;
    }
    
    /**
     * Set a worker to resting state
     * @param {string} workerId - ID of the worker
     * @param {boolean} resting - Whether worker should be resting
     * @returns {boolean} - Whether state change was successful
     */
    setWorkerResting(workerId, resting) {
        // Check if worker exists
        if (!this.workers[workerId]) {
            return false;
        }
        
        const worker = this.workers[workerId];
        
        // Update resting state
        worker.resting = resting;
        
        // Update status
        if (resting) {
            worker.status = 'Resting';
            
            // Clear current task
            worker.currentTask = null;
        } else {
            worker.status = 'Idle';
        }
        
        // Emit events
        if (resting) {
            this.eventEmitter.emit('worker:resting', workerId);
        } else {
            this.eventEmitter.emit('worker:working', workerId);
        }
        
        return true;
    }
    
    /**
     * Increase worker fatigue based on work
     * @param {string} workerId - ID of the worker
     * @param {Object} worker - Worker data
     */
    increaseFatigue(workerId, worker) {
        // Base fatigue increase per tick
        let fatigueIncrease = 0.1;
        
        // Adjust based on task type
        if (worker.currentTask) {
            if (worker.currentTask.type === 'crafting') {
                fatigueIncrease = 0.2 * worker.workerType.crafting.fatigueRate;
            } else if (worker.currentTask.type === 'coal') {
                fatigueIncrease = 0.05;
            }
        }
        
        // Increase fatigue
        worker.fatigue += fatigueIncrease;
        
        // Cap at max fatigue
        if (worker.fatigue > worker.workerType.fatigue.maxFatigue) {
            worker.fatigue = worker.workerType.fatigue.maxFatigue;
        }
        
        // Emit event if high fatigue
        if (worker.fatigue >= worker.workerType.fatigue.maxFatigue * 0.8 && 
            !worker.highFatigueWarning) {
            worker.highFatigueWarning = true;
            this.eventEmitter.emit('notification:warning', 
                `${worker.name} is getting very tired (${Math.floor(worker.fatigue)}% fatigue).`);
        }
    }
    
    /**
     * Recover worker fatigue during rest
     * @param {string} workerId - ID of the worker
     * @param {Object} worker - Worker data
     */
    recoverFatigue(workerId, worker) {
        // Base recovery rate
        const recoveryRate = 0.2 * worker.workerType.fatigue.recoveryRate;
        
        // Decrease fatigue
        worker.fatigue -= recoveryRate;
        
        // Cap at minimum fatigue
        if (worker.fatigue < 0) {
            worker.fatigue = 0;
        }
        
        // Reset high fatigue warning if fatigue is low enough
        if (worker.fatigue < worker.workerType.fatigue.maxFatigue * 0.5) {
            worker.highFatigueWarning = false;
        }
        
        // Notify when worker is fully rested
        if (worker.fatigue === 0 && worker.wasResting) {
            worker.wasResting = false;
            this.eventEmitter.emit('notification:info', 
                `${worker.name} is fully rested and ready to work.`);
        }
        
        // Set flag to track if worker was resting
        if (worker.fatigue > 0) {
            worker.wasResting = true;
        }
    }
    
    /**
     * Process daily wages for all workers
     */
    processDailyWages() {
        let totalWages = 0;
        
        for (const worker of Object.values(this.workers)) {
            totalWages += worker.salary;
        }
        
        // Skip if no workers
        if (totalWages === 0) {
            return;
        }
        
        // Pay wages
        if (this.inventory.removeMoney(totalWages)) {
            this.eventEmitter.emit('notification:info', 
                `Paid $${totalWages.toFixed(2)} in wages to ${Object.keys(this.workers).length} worker(s).`);
        } else {
            // Not enough money to pay wages!
            this.eventEmitter.emit('notification:error', 
                `Not enough money to pay worker wages! ($${totalWages.toFixed(2)} needed)`);
            
            // Workers might quit or performance might decrease in future versions
        }
    }
    
    /**
     * Set hiring discount for a worker type
     * @param {string} workerTypeId - Type of worker or 'all' for all types
     * @param {number} multiplier - Discount multiplier (0.7 = 30% off)
     * @param {Date} expiryTime - When the discount expires
     */
    setHiringDiscount(workerTypeId, multiplier, expiryTime) {
        this.hiringDiscounts[workerTypeId] = {
            multiplier,
            expiryTime
        };
        
        const discountPercent = Math.round((1 - multiplier) * 100);
        this.eventEmitter.emit('notification:info', 
            `Worker hiring discount: ${discountPercent}% off ${workerTypeId === 'all' ? 'all workers' : this.workerTypes[workerTypeId]?.name}`);
    }
    
    /**
     * Get current hiring discount for a worker type
     * @param {string} workerTypeId - Type of worker
     * @returns {number|null} - Current discount multiplier or null
     */
    getHiringDiscount(workerTypeId) {
        // Check for specific worker type discount
        if (this.hiringDiscounts[workerTypeId] && 
            this.hiringDiscounts[workerTypeId].expiryTime > new Date()) {
            return this.hiringDiscounts[workerTypeId].multiplier;
        }
        
        // Check for general discount
        if (this.hiringDiscounts['all'] && 
            this.hiringDiscounts['all'].expiryTime > new Date()) {
            return this.hiringDiscounts['all'].multiplier;
        }
        
        return null;
    }
    
    /**
     * Update hiring discounts and remove expired ones
     */
    updateHiringDiscounts() {
        const now = new Date();
        
        for (const [workerTypeId, data] of Object.entries(this.hiringDiscounts)) {
            if (data.expiryTime <= now) {
                // Discount expired
                delete this.hiringDiscounts[workerTypeId];
                
                const typeDesc = workerTypeId === 'all' ? 'all workers' : this.workerTypes[workerTypeId]?.name;
                this.eventEmitter.emit('notification:info', 
                    `Hiring discount for ${typeDesc} has expired.`);
            }
        }
    }
    
    /**
     * Get all available worker types for hiring
     * @returns {Array} - Array of worker type data
     */
    getAvailableWorkerTypes() {
        const workerTypes = [];
        
        for (const [typeId, typeData] of Object.entries(this.workerTypes)) {
            // Calculate cost with any discounts
            let hireCost = typeData.hireCost;
            const discount = this.getHiringDiscount(typeId);
            
            if (discount) {
                hireCost *= discount;
            }
            
            workerTypes.push({
                id: typeId,
                name: typeData.name,
                description: typeData.description,
                salary: typeData.baseSalary,
                hireCost: hireCost,
                speedMultiplier: typeData.crafting.speedMultiplier,
                fatigueRate: typeData.crafting.fatigueRate,
                hasDiscount: discount !== null
            });
        }
        
        return workerTypes;
    }
    
    /**
     * Get all currently hired workers
     * @returns {Array} - Array of worker data
     */
    getHiredWorkers() {
        return Object.values(this.workers).map(worker => ({
            id: worker.id,
            name: worker.name,
            type: worker.type,
            typeName: worker.workerType.name,
            fatigue: worker.fatigue,
            fatigueMax: worker.workerType.fatigue.maxFatigue,
            salary: worker.salary,
            status: worker.status,
            resting: worker.resting,
            task: worker.currentTask ? {
                type: worker.currentTask.type,
                details: worker.currentTask.type === 'crafting' ? worker.currentTask.itemId : ''
            } : null
        }));
    }
    
    /**
     * Get random first name for worker generation
     * @returns {string} - Random first name
     */
    getRandomFirstName() {
        const firstNames = [
            "John", "William", "James", "George", "Charles", "Thomas", "Henry", "Robert",
            "Joseph", "Edward", "Frank", "Walter", "Harry", "Samuel", "Arthur", "Albert",
            "Daniel", "Joshua", "Michael", "Jonathan", "Benjamin", "Elijah", "Isaac", "Caleb",
            "Matthew", "Andrew", "David", "Frederick", "Oliver", "Jacob", "Theodore", "Richard"
        ];
        
        return firstNames[Math.floor(Math.random() * firstNames.length)];
    }
    
    /**
     * Get random last name for worker generation
     * @returns {string} - Random last name
     */
    getRandomLastName() {
        const lastNames = [
            "Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Wilson",
            "Taylor", "Clark", "Hall", "Allen", "Young", "Wright", "Hill", "Scott",
            "Adams", "Baker", "Cooper", "Ford", "Gray", "Harris", "King", "Lewis",
            "Morgan", "Parker", "Turner", "Walker", "Wood", "Thompson", "White", "Jenkins",
            "Coleman", "Brooks", "Powell", "Sullivan", "Murphy", "Barnes", "Bell", "Fisher"
        ];
        
        return lastNames[Math.floor(Math.random() * lastNames.length)];
    }
    
    /**
     * Save worker system state
     * @returns {Object} - Serialized worker system
     */
    serialize() {
        return {
            workers: this.workers,
            hiringDiscounts: this.hiringDiscounts,
            dayCounter: this.dayCounter
        };
    }
    
    /**
     * Load worker system state
     * @param {Object} data - Serialized worker data
     */
    deserialize(data) {
        if (!data) return;
        
        if (data.workers) this.workers = { ...data.workers };
        if (data.hiringDiscounts) this.hiringDiscounts = { ...data.hiringDiscounts };
        if (data.dayCounter !== undefined) this.dayCounter = data.dayCounter;
        
        // Convert date strings back to Date objects
        for (const discount of Object.values(this.hiringDiscounts)) {
            if (discount.expiryTime && typeof discount.expiryTime === 'string') {
                discount.expiryTime = new Date(discount.expiryTime);
            }
        }
        
        for (const worker of Object.values(this.workers)) {
            if (worker.hireDate && typeof worker.hireDate === 'string') {
                worker.hireDate = new Date(worker.hireDate);
            }
        }
    }
}