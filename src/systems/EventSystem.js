/**
 * Event System
 * 
 * Manages random events that occur during gameplay.
 * Handles event triggers, activation, and expiry.
 */
export class EventSystem {
    constructor(eventEmitter, eventsData) {
        this.eventEmitter = eventEmitter;
        this.eventsData = eventsData;
        
        // Active events
        this.activeEvents = [];
        
        // Event check interval (in seconds)
        this.eventCheckInterval = 3600; // Check for events every in-game hour
        
        // Event check timer
        this.eventCheckTimer = 0;
        
        // Event chance percentage (5% per check)
        this.eventChance = 5;
        
        // Register event listeners
        this.registerEventListeners();
    }
    
    /**
     * Register event listeners
     */
    registerEventListeners() {
        // Listen for hour changes to potentially trigger events
        this.eventEmitter.on('time:hour-changed', (hour) => {
            // Increase chance of events during certain hours
            if (hour === 9 || hour === 14) {
                this.checkForEvent(this.eventChance * 1.5);
            }
        });
    }
    
    /**
     * Update event system (called on each game tick)
     */
    update() {
        // Increment event check timer
        this.eventCheckTimer++;
        
        // Check for event trigger
        if (this.eventCheckTimer >= this.eventCheckInterval) {
            this.eventCheckTimer = 0;
            this.checkForEvent();
        }
        
        // Check for expired events
        this.checkExpiredEvents();
    }
    
    /**
     * Check if a random event should trigger
     * @param {number} chanceOverride - Optional override for event chance
     */
    checkForEvent(chanceOverride) {
        const chance = chanceOverride || this.eventChance;
        
        // Roll for event trigger
        if (Math.random() * 100 <= chance) {
            this.triggerRandomEvent();
        }
    }
    
    /**
     * Trigger a random event
     */
    triggerRandomEvent() {
        // Get game state for event conditions
        const gameState = this.getGameState();
        
        // Generate a random event
        const event = this.eventsData.generate(gameState);
        
        if (!event) {
            console.warn("Failed to generate event");
            return;
        }
        
        // Prevent duplicate active events
        if (this.activeEvents.some(e => e.id === event.id)) {
            console.log(`Event ${event.id} already active, skipping`);
            return;
        }
        
        // Add to active events
        this.activeEvents.push(event);
        
        // Process event effects
        const appliedEffects = this.eventsData.processEffects(event, gameState);
        
        // Emit events
        this.eventEmitter.emit('event:triggered', { ...event, appliedEffects });
        this.eventEmitter.emit('notification:event', `EVENT: ${event.name} - ${event.description}`);
    }
    
    /**
     * Check for expired events
     */
    checkExpiredEvents() {
        const now = new Date();
        const expiredEvents = [];
        
        // Remove expired events
        this.activeEvents = this.activeEvents.filter(event => {
            if (event.expiryTime <= now) {
                expiredEvents.push(event);
                return false;
            }
            return true;
        });
        
        // Notify about expired events
        for (const event of expiredEvents) {
            this.eventEmitter.emit('event:expired', event);
            this.eventEmitter.emit('notification:info', `Event ended: ${event.name}`);
        }
    }
    
    /**
     * Manually trigger a specific event
     * @param {string} eventId - ID of the event to trigger
     * @returns {boolean} - Whether the event was triggered
     */
    triggerSpecificEvent(eventId) {
        // Find event definition
        const eventDef = this.eventsData.definitions.find(e => e.id === eventId);
        
        if (!eventDef) {
            console.warn(`Event ${eventId} not found`);
            return false;
        }
        
        // Check if already active
        if (this.activeEvents.some(e => e.id === eventId)) {
            console.warn(`Event ${eventId} already active`);
            return false;
        }
        
        // Get game state for event conditions
        const gameState = this.getGameState();
        
        // Check conditions if applicable
        if (eventDef.conditions && typeof eventDef.conditions === 'function') {
            if (!eventDef.conditions(gameState)) {
                console.warn(`Event ${eventId} conditions not met`);
                return false;
            }
        }
        
        // Create event instance
        const currentTime = new Date();
        const expiryTime = new Date(currentTime.getTime() + eventDef.duration * 60 * 1000);
        
        const event = {
            ...eventDef,
            instanceId: `${eventDef.id}_${Date.now()}`,
            startTime: currentTime,
            expiryTime: expiryTime,
            active: true
        };
        
        // Add to active events
        this.activeEvents.push(event);
        
        // Process event effects
        const appliedEffects = this.eventsData.processEffects(event, gameState);
        
        // Emit events
        this.eventEmitter.emit('event:triggered', { ...event, appliedEffects });
        this.eventEmitter.emit('notification:event', `EVENT: ${event.name} - ${event.description}`);
        
        return true;
    }
    
    /**
     * Get current game state for event conditions
     * @returns {Object} - Game state
     */
    getGameState() {
        // This is a placeholder - in the actual game, we'll collect
        // state from various systems through the event bus
        return {
            // These references would be filled in by the game class
            blueprints: {
                isUnlocked: (itemId) => {
                    // For now, just return true for testing
                    return true;
                }
            },
            storefront: null,
            materials: null,
            contracts: null,
            workers: null,
            tools: null
        };
    }
    
    /**
     * Get all active events
     * @returns {Array} - Array of active events
     */
    getActiveEvents() {
        return [...this.activeEvents];
    }
    
    /**
     * Get remaining time for an active event
     * @param {string} eventInstanceId - Instance ID of the event
     * @returns {Object|null} - Time remaining details or null if not found
     */
    getEventTimeRemaining(eventInstanceId) {
        const event = this.activeEvents.find(e => e.instanceId === eventInstanceId);
        
        if (!event) {
            return null;
        }
        
        const now = new Date();
        const expiryTime = new Date(event.expiryTime);
        const totalMs = expiryTime - now;
        
        if (totalMs <= 0) {
            return { minutes: 0, seconds: 0, percentage: 0 };
        }
        
        const minutes = Math.floor(totalMs / (1000 * 60));
        const seconds = Math.floor((totalMs % (1000 * 60)) / 1000);
        
        // Calculate percentage of time remaining
        const originalDurationMs = event.duration * 60 * 1000;
        const elapsedMs = originalDurationMs - totalMs;
        const percentage = 100 - ((elapsedMs / originalDurationMs) * 100);
        
        return { minutes, seconds, percentage };
    }
    
    /**
     * Set event chance percentage
     * @param {number} chance - New chance percentage
     */
    setEventChance(chance) {
        this.eventChance = Math.max(0, Math.min(100, chance));
    }
    
    /**
     * Set event check interval
     * @param {number} interval - New interval in seconds
     */
    setEventCheckInterval(interval) {
        this.eventCheckInterval = Math.max(60, interval);
        this.eventCheckTimer = 0;
    }
    
    /**
     * Save event system state
     * @returns {Object} - Serialized event system
     */
    serialize() {
        return {
            activeEvents: this.activeEvents,
            eventCheckTimer: this.eventCheckTimer,
            eventChance: this.eventChance,
            eventCheckInterval: this.eventCheckInterval
        };
    }
    
    /**
     * Load event system state
     * @param {Object} data - Serialized event data
     */
    deserialize(data) {
        if (!data) return;
        
        if (data.activeEvents) this.activeEvents = [...data.activeEvents];
        if (data.eventCheckTimer !== undefined) this.eventCheckTimer = data.eventCheckTimer;
        if (data.eventChance !== undefined) this.eventChance = data.eventChance;
        if (data.eventCheckInterval !== undefined) this.eventCheckInterval = data.eventCheckInterval;
        
        // Convert date strings back to Date objects
        for (const event of this.activeEvents) {
            if (event.startTime && typeof event.startTime === 'string') {
                event.startTime = new Date(event.startTime);
            }
            if (event.expiryTime && typeof event.expiryTime === 'string') {
                event.expiryTime = new Date(event.expiryTime);
            }
        }
    }
}