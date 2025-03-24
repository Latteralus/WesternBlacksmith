/**
 * Notifications System
 * 
 * Manages game notifications and the notification log.
 * Displays toast messages and maintains a log of recent notifications.
 */
export class Notifications {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        
        // DOM elements
        this.notificationsContainer = document.getElementById('notifications-container');
        
        // Maximum number of notifications to keep in log
        this.maxNotifications = 50;
        
        // Notification display duration (in ms)
        this.displayDuration = 5000;
        
        // Notification history
        this.notifications = [];
        
        // Register event listeners
        this.registerEventListeners();
        
        // Initialize the UI
        this.initializeUI();
    }
    
    /**
     * Register event listeners
     */
    registerEventListeners() {
        // Standard notification types
        this.eventEmitter.on('notification:info', (message) => {
            this.add(message, 'info');
        });
        
        this.eventEmitter.on('notification:success', (message) => {
            this.add(message, 'success');
        });
        
        this.eventEmitter.on('notification:warning', (message) => {
            this.add(message, 'warning');
        });
        
        this.eventEmitter.on('notification:error', (message) => {
            this.add(message, 'danger');
        });
        
        // Special notification for events
        this.eventEmitter.on('notification:event', (message) => {
            this.add(message, 'event');
        });
    }
    
    /**
     * Initialize the notifications UI
     */
    initializeUI() {
        // Make sure the container exists
        if (!this.notificationsContainer) {
            console.error("Notifications container not found");
            return;
        }
        
        // Clear existing notifications
        this.notificationsContainer.innerHTML = '';
    }
    
    /**
     * Add a new notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (info, success, warning, danger, event)
     */
    add(message, type = 'info') {
        // Create notification object
        const notification = {
            id: Date.now(),
            message,
            type,
            timestamp: new Date()
        };
        
        // Add to history
        this.notifications.unshift(notification);
        
        // Trim history if needed
        if (this.notifications.length > this.maxNotifications) {
            this.notifications.pop();
        }
        
        // Create notification element
        this.createNotificationElement(notification);
        
        // Emit event
        this.eventEmitter.emit('notifications:added', notification);
    }
    
    /**
     * Create a notification DOM element
     * @param {Object} notification - Notification object
     */
    createNotificationElement(notification) {
        // Make sure the container exists
        if (!this.notificationsContainer) {
            console.error("Notifications container not found");
            return;
        }
        
        // Create notification element
        const element = document.createElement('div');
        element.className = `notification ${notification.type}`;
        element.dataset.id = notification.id;
        
        // Format timestamp
        const time = notification.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Add content
        element.innerHTML = `
            <div class="notification-time">${time}</div>
            <div class="notification-message">${notification.message}</div>
        `;
        
        // Add to container
        this.notificationsContainer.insertBefore(element, this.notificationsContainer.firstChild);
        
        // Add fade-in animation
        element.style.opacity = '0';
        setTimeout(() => {
            element.style.opacity = '1';
        }, 10);
        
        // Set up auto-removal
        setTimeout(() => {
            // Add fade-out animation
            element.style.opacity = '0.7';
        }, this.displayDuration);
    }
    
    /**
     * Clear all notifications from the log
     */
    clearAll() {
        // Clear history
        this.notifications = [];
        
        // Clear UI
        if (this.notificationsContainer) {
            this.notificationsContainer.innerHTML = '';
        }
        
        // Emit event
        this.eventEmitter.emit('notifications:cleared');
    }
    
    /**
     * Get all notifications
     * @returns {Array} - Array of notification objects
     */
    getAll() {
        return [...this.notifications];
    }
    
    /**
     * Set maximum number of notifications to keep
     * @param {number} max - Maximum number of notifications
     */
    setMaxNotifications(max) {
        this.maxNotifications = Math.max(10, max);
        
        // Trim history if needed
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.maxNotifications);
        }
    }
    
    /**
     * Set notification display duration
     * @param {number} duration - Duration in milliseconds
     */
    setDisplayDuration(duration) {
        this.displayDuration = Math.max(1000, duration);
    }
    
    /**
     * Save notifications state
     * @returns {Object} - Serialized notifications
     */
    serialize() {
        return {
            notifications: this.notifications,
            maxNotifications: this.maxNotifications,
            displayDuration: this.displayDuration
        };
    }
    
    /**
     * Load notifications state
     * @param {Object} data - Serialized notification data
     */
    deserialize(data) {
        if (!data) return;
        
        // Set properties
        if (data.maxNotifications) this.maxNotifications = data.maxNotifications;
        if (data.displayDuration) this.displayDuration = data.displayDuration;
        
        // Load notifications
        if (data.notifications) {
            this.notifications = data.notifications.map(n => ({
                ...n,
                timestamp: new Date(n.timestamp)
            }));
            
            // Clear and rebuild UI
            if (this.notificationsContainer) {
                this.notificationsContainer.innerHTML = '';
                
                // Add each notification to UI (in reverse order)
                for (let i = this.notifications.length - 1; i >= 0; i--) {
                    this.createNotificationElement(this.notifications[i]);
                }
            }
        }
    }
}