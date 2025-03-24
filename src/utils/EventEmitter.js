/**
 * Event Emitter System
 * 
 * Provides a pub/sub pattern for game systems to communicate with each other
 * without tight coupling. Systems can subscribe to events and publish events 
 * for other systems to react to.
 */
export class EventEmitter {
    constructor() {
        // Map to store event listeners
        // eventName -> array of callback functions
        this.events = new Map();
    }
    
    /**
     * Subscribe to an event
     * @param {string} eventName - Name of the event to listen for
     * @param {Function} callback - Function to call when event is emitted
     * @returns {Function} - Unsubscribe function
     */
    on(eventName, callback) {
        // Get or create the array of listeners for this event
        if (!this.events.has(eventName)) {
            this.events.set(eventName, []);
        }
        
        const listeners = this.events.get(eventName);
        listeners.push(callback);
        
        // Return an unsubscribe function
        return () => {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        };
    }
    
    /**
     * Subscribe to an event but only trigger once
     * @param {string} eventName - Name of the event to listen for
     * @param {Function} callback - Function to call when event is emitted
     * @returns {Function} - Unsubscribe function
     */
    once(eventName, callback) {
        const unsubscribe = this.on(eventName, (...args) => {
            unsubscribe();
            callback(...args);
        });
        
        return unsubscribe;
    }
    
    /**
     * Publish an event
     * @param {string} eventName - Name of the event to emit
     * @param {...any} args - Arguments to pass to all listeners
     * @returns {boolean} - Whether the event had listeners
     */
    emit(eventName, ...args) {
        if (!this.events.has(eventName)) {
            return false;
        }
        
        const listeners = this.events.get(eventName);
        listeners.forEach(callback => {
            try {
                callback(...args);
            } catch (error) {
                console.error(`Error in event listener for ${eventName}:`, error);
            }
        });
        
        return listeners.length > 0;
    }
    
    /**
     * Remove a specific listener from an event
     * @param {string} eventName - Name of the event
     * @param {Function} callback - The callback to remove
     * @returns {boolean} - Whether the listener was removed
     */
    off(eventName, callback) {
        if (!this.events.has(eventName)) {
            return false;
        }
        
        const listeners = this.events.get(eventName);
        const index = listeners.indexOf(callback);
        
        if (index === -1) {
            return false;
        }
        
        listeners.splice(index, 1);
        return true;
    }
    
    /**
     * Remove all listeners for a specific event
     * @param {string} eventName - Name of the event to clear
     * @returns {boolean} - Whether the event had listeners
     */
    clearEvent(eventName) {
        if (!this.events.has(eventName)) {
            return false;
        }
        
        const hadListeners = this.events.get(eventName).length > 0;
        this.events.set(eventName, []);
        return hadListeners;
    }
    
    /**
     * Remove all event listeners
     */
    clearAll() {
        this.events.clear();
    }
    
    /**
     * Get the number of listeners for an event
     * @param {string} eventName - Name of the event
     * @returns {number} - Number of listeners
     */
    listenerCount(eventName) {
        if (!this.events.has(eventName)) {
            return 0;
        }
        
        return this.events.get(eventName).length;
    }
    
    /**
     * List all events that have registered listeners
     * @returns {string[]} - Array of event names
     */
    eventNames() {
        return Array.from(this.events.keys());
    }
}