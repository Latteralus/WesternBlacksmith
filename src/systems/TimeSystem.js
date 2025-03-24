/**
 * Time System
 * 
 * Manages the flow of time in the game.
 * Tracks days, hours, and minutes, and emits events for time-based systems.
 */
export class TimeSystem {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        
        // Game time (1 real second = 1 game minute by default)
        this.timeMultiplier = 60; // 60x speed - 1 real second = 1 game minute
        
        // Current game time
        this.time = {
            day: 1,
            hour: 8, // Start at 8:00 AM
            minute: 0,
            totalMinutes: 0 // Total game minutes elapsed
        };
        
        // Is the time system running?
        this.isRunning = false;
        
        // Interval ID for the time ticker
        this.tickerInterval = null;
        
        // Start and end hours for the work day
        this.workHours = {
            start: 8, // 8:00 AM
            end: 18   // 6:00 PM
        };
    }
    
    /**
     * Start the time system
     */
    start() {
        if (this.isRunning) {
            return;
        }
        
        this.isRunning = true;
        
        // Start time ticker (updates every second)
        this.tickerInterval = setInterval(() => {
            this.tick();
        }, 1000);
        
        this.eventEmitter.emit('time:started');
    }
    
    /**
     * Stop the time system
     */
    stop() {
        if (!this.isRunning) {
            return;
        }
        
        this.isRunning = false;
        
        // Clear interval
        if (this.tickerInterval) {
            clearInterval(this.tickerInterval);
            this.tickerInterval = null;
        }
        
        this.eventEmitter.emit('time:stopped');
    }
    
    /**
     * Pause/unpause the time system
     * @param {boolean} paused - Whether to pause or unpause
     */
    setPaused(paused) {
        if (paused && this.isRunning) {
            this.stop();
            this.eventEmitter.emit('time:paused');
        } else if (!paused && !this.isRunning) {
            this.start();
            this.eventEmitter.emit('time:resumed');
        }
    }
    
    /**
     * Update time (called every second)
     */
    tick() {
        // Increment game time
        this.incrementTime(1);
        
        // Emit time tick event
        this.eventEmitter.emit('time:tick', this.getTime());
    }
    
    /**
     * Increment game time by specified minutes
     * @param {number} realSeconds - Real seconds elapsed
     */
    incrementTime(realSeconds) {
        // Convert real seconds to game minutes based on time multiplier
        const gameMinutes = realSeconds * this.timeMultiplier;
        
        // Add to total minutes
        this.time.totalMinutes += gameMinutes;
        
        // Update minute
        this.time.minute += gameMinutes;
        
        // Handle minute overflow
        while (this.time.minute >= 60) {
            this.time.minute -= 60;
            this.time.hour++;
            
            // Emit hourly event
            this.eventEmitter.emit('time:hour-changed', this.time.hour);
            
            // Handle hour overflow
            if (this.time.hour >= 24) {
                this.time.hour = 0;
                this.time.day++;
                
                // Emit daily event
                this.eventEmitter.emit('time:new-day', this.time.day);
            }
            
            // Check for work hours events
            if (this.time.hour === this.workHours.start) {
                this.eventEmitter.emit('time:workday-start');
            } else if (this.time.hour === this.workHours.end) {
                this.eventEmitter.emit('time:workday-end');
            }
        }
    }
    
    /**
     * Get current game time
     * @returns {Object} - Current time object
     */
    getTime() {
        return { ...this.time };
    }
    
    /**
     * Get formatted time string (HH:MM)
     * @returns {string} - Formatted time string
     */
    getFormattedTime() {
        const hour = this.time.hour.toString().padStart(2, '0');
        const minute = this.time.minute.toString().padStart(2, '0');
        return `${hour}:${minute}`;
    }
    
    /**
     * Get formatted date and time string
     * @returns {string} - Formatted date and time string
     */
    getFormattedDateTime() {
        const ampm = this.time.hour >= 12 ? 'PM' : 'AM';
        const hour12 = this.time.hour % 12 || 12; // Convert to 12-hour format
        const minute = this.time.minute.toString().padStart(2, '0');
        return `Day ${this.time.day}, ${hour12}:${minute} ${ampm}`;
    }
    
    /**
     * Check if current time is during work hours
     * @returns {boolean} - Whether it's currently work hours
     */
    isDuringWorkHours() {
        return this.time.hour >= this.workHours.start && this.time.hour < this.workHours.end;
    }
    
    /**
     * Set time multiplier
     * @param {number} multiplier - New time multiplier
     */
    setTimeMultiplier(multiplier) {
        if (multiplier <= 0) {
            console.warn("Time multiplier must be positive");
            return;
        }
        
        this.timeMultiplier = multiplier;
        this.eventEmitter.emit('time:multiplier-changed', multiplier);
    }
    
    /**
     * Calculate time until a specific hour
     * @param {number} targetHour - Target hour (0-23)
     * @returns {Object} - Hours and minutes until target
     */
    getTimeUntil(targetHour) {
        let hoursUntil = 0;
        let minutesUntil = 0;
        
        if (targetHour === this.time.hour) {
            // Same hour, just need minutes until next hour
            minutesUntil = 60 - this.time.minute;
            if (minutesUntil === 60) {
                minutesUntil = 0;
            }
        } else if (targetHour > this.time.hour) {
            // Target is later today
            hoursUntil = targetHour - this.time.hour - 1;
            minutesUntil = 60 - this.time.minute;
            if (minutesUntil === 60) {
                minutesUntil = 0;
                hoursUntil++;
            }
        } else {
            // Target is tomorrow
            hoursUntil = (24 - this.time.hour) + targetHour - 1;
            minutesUntil = 60 - this.time.minute;
            if (minutesUntil === 60) {
                minutesUntil = 0;
                hoursUntil++;
            }
        }
        
        return { hours: hoursUntil, minutes: minutesUntil };
    }
    
    /**
     * Calculate total minutes until a target time
     * @param {number} targetHour - Target hour (0-23)
     * @param {number} targetMinute - Target minute (0-59)
     * @returns {number} - Total minutes until target time
     */
    getMinutesUntil(targetHour, targetMinute = 0) {
        let totalMinutes = 0;
        
        if (targetHour === this.time.hour && targetMinute > this.time.minute) {
            // Same hour, just need minutes
            totalMinutes = targetMinute - this.time.minute;
        } else if (targetHour === this.time.hour && targetMinute <= this.time.minute) {
            // Target is tomorrow, same time
            totalMinutes = (24 * 60) - (this.time.minute - targetMinute);
        } else if (targetHour > this.time.hour) {
            // Target is later today
            totalMinutes = ((targetHour - this.time.hour) * 60) + (targetMinute - this.time.minute);
        } else {
            // Target is tomorrow
            totalMinutes = ((24 - this.time.hour + targetHour) * 60) + (targetMinute - this.time.minute);
        }
        
        return totalMinutes;
    }
    
    /**
     * Skip time forward by a specific amount
     * @param {number} hours - Hours to skip
     * @param {number} minutes - Minutes to skip
     */
    skipTime(hours = 0, minutes = 0) {
        const totalMinutes = (hours * 60) + minutes;
        this.incrementTime(totalMinutes / this.timeMultiplier);
        
        this.eventEmitter.emit('time:skipped', { hours, minutes });
    }
    
    /**
     * Save time system state
     * @returns {Object} - Serialized time system
     */
    serialize() {
        return {
            time: { ...this.time },
            timeMultiplier: this.timeMultiplier,
            isRunning: this.isRunning,
            workHours: { ...this.workHours }
        };
    }
    
    /**
     * Load time system state
     * @param {Object} data - Serialized time data
     */
    deserialize(data) {
        if (!data) return;
        
        if (data.time) this.time = { ...data.time };
        if (data.timeMultiplier !== undefined) this.timeMultiplier = data.timeMultiplier;
        if (data.workHours) this.workHours = { ...data.workHours };
        
        // Update UI
        this.eventEmitter.emit('time:updated', this.getTime());
        
        // Restart time system if it was running
        if (data.isRunning) {
            this.start();
        }
    }
}