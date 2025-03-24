/**
 * Modal Manager
 * 
 * Manages modal dialogs and popups in the game.
 * Handles displaying, hiding, and interaction with modals.
 */
export class ModalManager {
    constructor(eventEmitter) {
        this.eventEmitter = eventEmitter;
        
        // DOM elements
        this.modalContainer = document.getElementById('modal-container');
        this.modalContent = document.getElementById('modal-content');
        this.modalBody = document.getElementById('modal-body');
        this.modalClose = document.getElementById('modal-close');
        
        // Currently active modal
        this.activeModal = null;
        
        // Modal queue (for multiple modals)
        this.modalQueue = [];
        
        // Initialize the UI
        this.initializeUI();
        
        // Register event listeners
        this.registerEventListeners();
    }
    
    /**
     * Initialize the modal UI
     */
    initializeUI() {
        // Make sure the container exists
        if (!this.modalContainer || !this.modalContent || !this.modalBody || !this.modalClose) {
            console.error("Modal elements not found");
            return;
        }
        
        // Set up close button
        this.modalClose.addEventListener('click', () => {
            this.hideModal();
        });
        
        // Set up click outside to close
        this.modalContainer.addEventListener('click', (event) => {
            if (event.target === this.modalContainer) {
                this.hideModal();
            }
        });
        
        // Set up ESC key to close
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !this.modalContainer.classList.contains('hidden')) {
                this.hideModal();
            }
        });
    }
    
    /**
     * Register event listeners
     */
    registerEventListeners() {
        // Listen for modal show requests
        this.eventEmitter.on('modal:show', (modalData) => {
            this.showModal(modalData);
        });
        
        // Listen for modal hide requests
        this.eventEmitter.on('modal:hide', () => {
            this.hideModal();
        });
        
        // Listen for contract appearance
        this.eventEmitter.on('contract:available', (contract) => {
            this.showContractModal(contract);
        });
        
        // Listen for special contracts
        this.eventEmitter.on('contract:special-available', (contract) => {
            this.showContractModal(contract, true);
        });
        
        // Listen for events
        this.eventEmitter.on('event:triggered', (event) => {
            this.showEventModal(event);
        });
    }
    
    /**
     * Show a modal dialog
     * @param {Object} modalData - Modal data
     * @param {string} modalData.title - Modal title
     * @param {string} modalData.content - Modal content HTML
     * @param {Function} modalData.onConfirm - Confirm callback
     * @param {Function} modalData.onCancel - Cancel callback
     * @param {boolean} modalData.showConfirm - Whether to show confirm button
     * @param {boolean} modalData.showCancel - Whether to show cancel button
     * @param {string} modalData.confirmText - Text for confirm button
     * @param {string} modalData.cancelText - Text for cancel button
     * @param {boolean} modalData.closeOnConfirm - Whether to close modal on confirm
     */
    showModal(modalData) {
        // If a modal is already open, queue this one
        if (this.activeModal) {
            this.modalQueue.push(modalData);
            return;
        }
        
        // Set active modal
        this.activeModal = modalData;
        
        // Set modal title
        let modalTitle = 'Message';
        if (modalData.title) {
            modalTitle = modalData.title;
        }
        
        // Create modal content
        let contentHtml = '';
        
        // Add content
        if (modalData.content) {
            contentHtml += `<div class="modal-content">${modalData.content}</div>`;
        }
        
        // Add buttons if needed
        if (modalData.showConfirm || modalData.showCancel) {
            contentHtml += '<div class="modal-buttons">';
            
            if (modalData.showConfirm) {
                contentHtml += `<button id="modal-confirm" class="btn-primary">${modalData.confirmText || 'Confirm'}</button>`;
            }
            
            if (modalData.showCancel) {
                contentHtml += `<button id="modal-cancel" class="btn-secondary">${modalData.cancelText || 'Cancel'}</button>`;
            }
            
            contentHtml += '</div>';
        }
        
        // Apply content to modal
        this.modalBody.innerHTML = `
            <h2>${modalTitle}</h2>
            ${contentHtml}
        `;
        
        // Show the modal
        this.modalContainer.classList.remove('hidden');
        
        // Set up button listeners
        if (modalData.showConfirm) {
            const confirmButton = document.getElementById('modal-confirm');
            if (confirmButton) {
                confirmButton.addEventListener('click', () => {
                    if (modalData.onConfirm) {
                        modalData.onConfirm();
                    }
                    
                    if (modalData.closeOnConfirm !== false) {
                        this.hideModal();
                    }
                });
            }
        }
        
        if (modalData.showCancel) {
            const cancelButton = document.getElementById('modal-cancel');
            if (cancelButton) {
                cancelButton.addEventListener('click', () => {
                    if (modalData.onCancel) {
                        modalData.onCancel();
                    }
                    
                    this.hideModal();
                });
            }
        }
        
        // Emit event
        this.eventEmitter.emit('modal:shown', modalData);
    }
    
    /**
     * Hide the current modal
     */
    hideModal() {
        // Hide the modal
        this.modalContainer.classList.add('hidden');
        
        // Clear active modal
        this.activeModal = null;
        
        // Clear modal content
        this.modalBody.innerHTML = '';
        
        // Emit event
        this.eventEmitter.emit('modal:hidden');
        
        // Check if there's another modal in the queue
        if (this.modalQueue.length > 0) {
            // Show the next modal after a short delay
            setTimeout(() => {
                const nextModal = this.modalQueue.shift();
                this.showModal(nextModal);
            }, 300);
        }
    }
    
    /**
     * Show a confirmation modal
     * @param {string} message - Confirmation message
     * @param {Function} onConfirm - Confirm callback
     * @param {Function} onCancel - Cancel callback
     * @param {string} confirmText - Text for confirm button
     * @param {string} cancelText - Text for cancel button
     */
    showConfirmation(message, onConfirm, onCancel = null, confirmText = 'Confirm', cancelText = 'Cancel') {
        this.showModal({
            title: 'Confirmation',
            content: `<p>${message}</p>`,
            showConfirm: true,
            showCancel: true,
            confirmText,
            cancelText,
            onConfirm,
            onCancel
        });
    }
    
    /**
     * Show a contract modal
     * @param {Object} contract - Contract data
     * @param {boolean} isSpecial - Whether this is a special contract
     */
    showContractModal(contract, isSpecial = false) {
        // Format expiry time
        const expiryTime = new Date(contract.expiryTime);
        const expiryString = expiryTime.toLocaleString();
        
        // Create modal content
        const content = `
            <div class="contract-details ${isSpecial ? 'special-contract' : ''}">
                <div class="contract-header">
                    <h3>${contract.customer}</h3>
                    <span class="contract-expiry">Expires: ${expiryString}</span>
                </div>
                <p class="contract-description">${contract.description || 'No description available.'}</p>
                <div class="contract-requirements">
                    <h4>Requirements:</h4>
                    <ul>
                        <li><strong>${contract.quantity}x</strong> ${contract.itemName || contract.item}</li>
                    </ul>
                </div>
                <div class="contract-reward">
                    <h4>Reward:</h4>
                    <p>$${contract.payout.toFixed(2)}</p>
                </div>
            </div>
        `;
        
        // Show the modal
        this.showModal({
            title: isSpecial ? 'Special Contract Offer' : 'New Contract',
            content,
            showConfirm: true,
            showCancel: true,
            confirmText: 'Accept',
            cancelText: 'Reject',
            onConfirm: () => {
                // Accept the contract
                this.eventEmitter.emit('contract:accept', contract.id);
            },
            onCancel: () => {
                // Reject the contract
                this.eventEmitter.emit('contract:reject', contract.id);
            }
        });
    }
    
    /**
     * Show an event modal
     * @param {Object} event - Event data
     */
    showEventModal(event) {
        // Format effects list
        let effectsList = '';
        if (event.appliedEffects && event.appliedEffects.length > 0) {
            effectsList = `
                <h4>Effects:</h4>
                <ul>
                    ${event.appliedEffects.map(effect => `<li>${effect}</li>`).join('')}
                </ul>
            `;
        }
        
        // Create modal content
        const content = `
            <div class="event-details">
                <p class="event-description">${event.description}</p>
                ${effectsList}
                <p class="event-duration">This event will last for ${event.duration} minutes.</p>
            </div>
        `;
        
        // Show the modal
        this.showModal({
            title: `Event: ${event.name}`,
            content,
            showConfirm: true,
            showCancel: false,
            confirmText: 'Acknowledge',
            onConfirm: () => {
                // Just close the modal
            }
        });
    }
    
    /**
     * Show a blueprint purchase modal
     * @param {Object} blueprint - Blueprint data
     * @param {Function} onConfirm - Confirm callback
     */
    showBlueprintPurchaseModal(blueprint, onConfirm) {
        // Format materials list
        let materialsList = '';
        if (blueprint.requiredMaterials) {
            materialsList = `
                <h4>Required Materials:</h4>
                <ul>
                    ${Object.entries(blueprint.requiredMaterials).map(([material, amount]) => 
                        `<li>${material}: ${amount}</li>`).join('')}
                </ul>
            `;
        }
        
        // Create modal content
        const content = `
            <div class="blueprint-details">
                <h3>${blueprint.name}</h3>
                <p>${blueprint.description}</p>
                ${materialsList}
                <p>Category: ${blueprint.category}</p>
                <p>Complexity: ${blueprint.complexity}</p>
                <p>Price: $${blueprint.price.toFixed(2)}</p>
            </div>
        `;
        
        // Show the modal
        this.showModal({
            title: 'Purchase Blueprint',
            content,
            showConfirm: true,
            showCancel: true,
            confirmText: 'Purchase',
            cancelText: 'Cancel',
            onConfirm
        });
    }
    
    /**
     * Show a worker hiring modal
     * @param {Object} workerType - Worker type data
     * @param {Function} onConfirm - Confirm callback
     */
    showWorkerHireModal(workerType, onConfirm) {
        // Create modal content
        const content = `
            <div class="worker-details">
                <h3>${workerType.name}</h3>
                <p>${workerType.description}</p>
                <div class="worker-stats">
                    <p><strong>Daily Salary:</strong> $${workerType.salary.toFixed(2)}</p>
                    <p><strong>Crafting Speed:</strong> ${(workerType.speedMultiplier * 100).toFixed(0)}%</p>
                    <p><strong>Fatigue Rate:</strong> ${(workerType.fatigueRate * 100).toFixed(0)}%</p>
                </div>
                <div class="worker-cost">
                    <p>Hiring Cost: $${workerType.hireCost.toFixed(2)}</p>
                    ${workerType.hasDiscount ? '<p class="discount">Discount Applied!</p>' : ''}
                </div>
            </div>
        `;
        
        // Show the modal
        this.showModal({
            title: 'Hire Worker',
            content,
            showConfirm: true,
            showCancel: true,
            confirmText: 'Hire',
            cancelText: 'Cancel',
            onConfirm
        });
    }
    
    /**
     * Show a game settings modal
     * @param {Object} settings - Current game settings
     * @param {Function} onSave - Save callback
     */
    showSettingsModal(settings, onSave) {
        // Create modal content
        const content = `
            <div class="settings">
                <div class="setting-group">
                    <h3>Game Settings</h3>
                    <div class="setting">
                        <label for="setting-autosave">Auto-Save:</label>
                        <input type="checkbox" id="setting-autosave" ${settings.autoSave ? 'checked' : ''}>
                    </div>
                    <div class="setting">
                        <label for="setting-autosave-interval">Auto-Save Interval (seconds):</label>
                        <input type="number" id="setting-autosave-interval" value="${settings.autoSaveInterval}" min="30" max="300" step="30">
                    </div>
                </div>
                <div class="setting-group">
                    <h3>Display Settings</h3>
                    <div class="setting">
                        <label for="setting-notification-duration">Notification Duration (seconds):</label>
                        <input type="number" id="setting-notification-duration" value="${settings.notificationDuration / 1000}" min="1" max="10" step="1">
                    </div>
                    <div class="setting">
                        <label for="setting-max-notifications">Max Notifications:</label>
                        <input type="number" id="setting-max-notifications" value="${settings.maxNotifications}" min="10" max="100" step="5">
                    </div>
                </div>
                <div class="setting-group">
                    <h3>Game Speed</h3>
                    <div class="setting">
                        <label for="setting-time-multiplier">Time Multiplier:</label>
                        <select id="setting-time-multiplier">
                            <option value="30" ${settings.timeMultiplier === 30 ? 'selected' : ''}>0.5x (Slow)</option>
                            <option value="60" ${settings.timeMultiplier === 60 ? 'selected' : ''}>1x (Normal)</option>
                            <option value="120" ${settings.timeMultiplier === 120 ? 'selected' : ''}>2x (Fast)</option>
                            <option value="180" ${settings.timeMultiplier === 180 ? 'selected' : ''}>3x (Very Fast)</option>
                        </select>
                    </div>
                </div>
            </div>
        `;
        
        // Show the modal
        this.showModal({
            title: 'Game Settings',
            content,
            showConfirm: true,
            showCancel: true,
            confirmText: 'Save',
            cancelText: 'Cancel',
            onConfirm: () => {
                // Collect settings
                const newSettings = {
                    autoSave: document.getElementById('setting-autosave').checked,
                    autoSaveInterval: parseInt(document.getElementById('setting-autosave-interval').value),
                    notificationDuration: parseInt(document.getElementById('setting-notification-duration').value) * 1000,
                    maxNotifications: parseInt(document.getElementById('setting-max-notifications').value),
                    timeMultiplier: parseInt(document.getElementById('setting-time-multiplier').value)
                };
                
                // Call save callback
                onSave(newSettings);
            }
        });
    }
    
    /**
     * Show the game help modal
     */
    showHelpModal() {
        // Create modal content
        const content = `
            <div class="help-content">
                <div class="help-section">
                    <h3>Game Overview</h3>
                    <p>You are a blacksmith in the Old West. Craft items, manage your forge, fulfill contracts, and grow your business.</p>
                </div>
                
                <div class="help-section">
                    <h3>Materials</h3>
                    <p>Buy materials like iron, coal, and wood to craft items. Materials arrive after a delivery time.</p>
                </div>
                
                <div class="help-section">
                    <h3>Crafting</h3>
                    <p>Craft items using materials. Each item requires specific materials and takes time to create. Crafting uses coal from your forge.</p>
                </div>
                
                <div class="help-section">
                    <h3>Forge</h3>
                    <p>Your forge uses coal. Keep the coal level above 20% to continue crafting. When it gets low, refill it manually or let a worker handle it.</p>
                </div>
                
                <div class="help-section">
                    <h3>Tools</h3>
                    <p>Tools wear out with use. Keep replacements on hand or be ready to craft new ones.</p>
                </div>
                
                <div class="help-section">
                    <h3>Storefront</h3>
                    <p>Place crafted items in your storefront for customers to buy. Customers visit periodically.</p>
                </div>
                
                <div class="help-section">
                    <h3>Contracts</h3>
                    <p>Accept contracts to deliver specific items by a deadline. Contracts pay more than regular sales.</p>
                </div>
                
                <div class="help-section">
                    <h3>Workers</h3>
                    <p>Hire workers to automate crafting and coal management. Workers get tired and need to rest.</p>
                </div>
                
                <div class="help-section">
                    <h3>Blueprints</h3>
                    <p>Buy blueprints to unlock new items to craft.</p>
                </div>
                
                <div class="help-section">
                    <h3>Events</h3>
                    <p>Random events like mine collapses or railroad expansions can create opportunities for special sales.</p>
                </div>
            </div>
        `;
        
        // Show the modal
        this.showModal({
            title: 'Game Help',
            content,
            showConfirm: true,
            showCancel: false,
            confirmText: 'Close',
            onConfirm: () => {
                // Just close the modal
            }
        });
    }
    
    /**
     * Show a material purchase modal
     * @param {Array} availableMaterials - Available materials to purchase
     * @param {Function} onPurchase - Purchase callback
     */
    showMaterialPurchaseModal(availableMaterials, onPurchase) {
        // Create material selection form
        let materialsHtml = '';
        
        for (const material of availableMaterials) {
            materialsHtml += `
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
            `;
        }
        
        // Create modal content
        const content = `
            <div class="purchase-materials">
                <div class="materials-list">
                    ${materialsHtml}
                </div>
                <div class="purchase-total">
                    <span>Total:</span>
                    <span id="purchase-total-amount">$0.00</span>
                </div>
            </div>
        `;
        
        // Show the modal
        this.showModal({
            title: 'Purchase Materials',
            content,
            showConfirm: true,
            showCancel: true,
            confirmText: 'Purchase',
            cancelText: 'Cancel',
            onConfirm: () => {
                // Collect purchase data
                const purchase = {};
                let totalCost = 0;
                
                for (const material of availableMaterials) {
                    const quantity = parseInt(document.getElementById(`buy-${material.id}`).value);
                    if (quantity > 0) {
                        purchase[material.id] = quantity;
                        totalCost += quantity * material.price;
                    }
                }
                
                // Call purchase callback with data
                onPurchase(purchase, totalCost);
            }
        });
        
        // Set up change listeners for quantity inputs
        for (const material of availableMaterials) {
            const input = document.getElementById(`buy-${material.id}`);
            const totalSpan = input.parentElement.querySelector('.material-total');
            
            input.addEventListener('input', () => {
                const quantity = parseInt(input.value) || 0;
                const total = quantity * material.price;
                totalSpan.textContent = `$${total.toFixed(2)}`;
                
                // Update total
                let grandTotal = 0;
                for (const mat of availableMaterials) {
                    const qty = parseInt(document.getElementById(`buy-${mat.id}`).value) || 0;
                    grandTotal += qty * mat.price;
                }
                document.getElementById('purchase-total-amount').textContent = `$${grandTotal.toFixed(2)}`;
            });
        }
    }
    
    /**
     * Check if a modal is currently active
     * @returns {boolean} - Whether a modal is active
     */
    isModalActive() {
        return this.activeModal !== null;
    }
    
    /**
     * Get the number of modals in the queue
     * @returns {number} - Queue length
     */
    getQueueLength() {
        return this.modalQueue.length;
    }
    
    /**
     * Clear the modal queue
     */
    clearQueue() {
        this.modalQueue = [];
    }
}