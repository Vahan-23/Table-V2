/**
 * Persistent Storage utility for seating data
 * Handles backend persistence with localStorage fallback
 * 
 * Configuration:
 * - Set REACT_APP_API_BASE_URL environment variable to configure backend URL
 * - Examples:
 *   - REACT_APP_API_BASE_URL=http://localhost:3001
 *   - REACT_APP_API_BASE_URL=https://api.example.com
 *   - If not set, uses relative URLs (empty string)
 */

class PersistentStorage {
  constructor() {
    this.debounceTimers = new Map();
    this.debounceDelay = 500; // 500ms debounce
    
    // Request chaining for handling rapid successive calls
    this.requestQueues = new Map(); // key -> { isProcessing, pendingValue, pendingResolvers }
    
    // Get backend base URL from environment variable
    // Falls back to empty string (relative URLs) if not set
    this.baseUrl = process.env.REACT_APP_API_BASE_URL || '';
    
    // Remove trailing slash if present
    if (this.baseUrl.endsWith('/')) {
      this.baseUrl = this.baseUrl.slice(0, -1);
    }
    
    console.log(`PersistentStorage initialized with baseUrl: ${this.baseUrl || '(relative URLs)'}`);
  }

  /**
   * Load data from backend, fallback to localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if not found
   * @returns {Promise<*>} The stored value
   */
  async load(key, defaultValue = null) {
    try {
      // Try to load from backend first
      const response = await fetch(`${this.baseUrl}/api/named_value?name=${encodeURIComponent(key)}`);
      const data = await response.json();
      
      if (data.success && data.data) {
        return data.data.value;
      } else if (data.error === 'Authentication required') {
        console.warn(`User not authenticated - falling back to localStorage for ${key}`);
        return this.loadFromLocalStorage(key, defaultValue);
      } else {
        // Named value not found in backend, try localStorage
        return this.loadFromLocalStorage(key, defaultValue);
      }
    } catch (error) {
      console.error(`Failed to load ${key} from backend:`, error);
      // Fallback to localStorage
      return this.loadFromLocalStorage(key, defaultValue);
    }
  }

  /**
   * Save data to backend with request chaining for rapid successive calls
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {Promise<boolean>} Success status
   */
  async save(key, value) {
    // Save to localStorage immediately as backup
    this.saveToLocalStorage(key, value);

    return new Promise((resolve) => {
      // Get or create queue for this key
      if (!this.requestQueues.has(key)) {
        this.requestQueues.set(key, {
          isProcessing: false,
          pendingValue: null,
          pendingResolvers: []
        });
      }

      const queue = this.requestQueues.get(key);
      
      // Update the pending value (this ensures only the latest value is saved)
      queue.pendingValue = value;
      queue.pendingResolvers.push(resolve);

      // If not currently processing, start processing
      if (!queue.isProcessing) {
        this._processQueue(key);
      }
    });
  }

  /**
   * Process the request queue for a specific key
   * @private
   * @param {string} key - Storage key
   */
  async _processQueue(key) {
    const queue = this.requestQueues.get(key);
    if (!queue) return;

    queue.isProcessing = true;

    try {
      // Wait for debounce delay to collect any additional rapid calls
      await new Promise(resolve => setTimeout(resolve, this.debounceDelay));

      // Get the latest value and all pending resolvers
      const valueToSave = queue.pendingValue;
      const resolvers = [...queue.pendingResolvers];
      
      // Clear pending state
      queue.pendingValue = null;
      queue.pendingResolvers = [];

      // Make the actual backend request
      let success = false;
      try {
        const response = await fetch(`${this.baseUrl}/api/named_value`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            name: key,
            value: valueToSave 
          })
        });

        const data = await response.json();
        
        if (data.success) {
          console.log(`✅ Successfully persisted ${key} to backend (processed ${resolvers.length} queued requests)`);
          success = true;
        } else if (data.error === 'Authentication required') {
          console.warn(`User not authenticated - ${key} saved only to localStorage`);
          success = false;
        } else {
          console.error(`Failed to persist ${key} to backend:`, data.error);
          success = false;
        }
      } catch (error) {
        console.error(`Failed to persist ${key} to backend:`, error);
        success = false;
      }

      // Resolve all pending promises with the same result
      resolvers.forEach(resolve => resolve(success));

      // Check if more requests came in while we were processing
      if (queue.pendingResolvers.length > 0) {
        // More requests came in, process them
        this._processQueue(key);
      } else {
        // No more pending requests
        queue.isProcessing = false;
        
        // Clean up empty queue
        if (queue.pendingResolvers.length === 0 && queue.pendingValue === null) {
          this.requestQueues.delete(key);
        }
      }
    } catch (error) {
      console.error(`Error processing queue for ${key}:`, error);
      
      // Resolve all pending promises with failure
      const resolvers = [...queue.pendingResolvers];
      queue.pendingResolvers = [];
      resolvers.forEach(resolve => resolve(false));
      
      queue.isProcessing = false;
    }
  }

  /**
   * Load from localStorage
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if not found
   * @returns {*} The stored value
   */
  loadFromLocalStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        return JSON.parse(item);
      }
    } catch (error) {
      console.error(`Failed to parse localStorage item ${key}:`, error);
    }
    return defaultValue;
  }

  /**
   * Save to localStorage
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   */
  saveToLocalStorage(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error);
    }
  }

  /**
   * Remove item from both backend and localStorage
   * @param {string} key - Storage key
   * @returns {Promise<boolean>} Success status
   */
  async remove(key) {
    // Remove from localStorage immediately
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove ${key} from localStorage:`, error);
    }

    // Try to remove from backend
    try {
      const response = await fetch(`${this.baseUrl}/api/named_value?name=${encodeURIComponent(key)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Successfully removed ${key} from backend`);
        return true;
      } else {
        console.error(`Failed to remove ${key} from backend:`, data.error);
        return false;
      }
    } catch (error) {
      console.error(`Failed to remove ${key} from backend:`, error);
      return false;
    }
  }

  /**
   * Clear all pending debounced saves and request queues
   */
  clearPendingSaves() {
    // Clear old debounce timers (kept for compatibility)
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    
    // Clear request queues and resolve pending promises
    for (const [key, queue] of this.requestQueues.entries()) {
      // Resolve all pending promises with failure status
      queue.pendingResolvers.forEach(resolve => resolve(false));
      console.log(`Cleared pending requests for ${key}`);
    }
    this.requestQueues.clear();
  }

  /**
   * Get current configuration info
   * @returns {Object} Configuration details
   */
  getConfig() {
    const queueInfo = {};
    for (const [key, queue] of this.requestQueues.entries()) {
      queueInfo[key] = {
        isProcessing: queue.isProcessing,
        pendingRequests: queue.pendingResolvers.length,
        hasPendingValue: queue.pendingValue !== null
      };
    }

    return {
      baseUrl: this.baseUrl,
      debounceDelay: this.debounceDelay,
      pendingSaves: this.debounceTimers.size, // Legacy
      activeQueues: this.requestQueues.size,
      queueDetails: queueInfo,
      usingRelativeUrls: !this.baseUrl
    };
  }
}

// Create singleton instance
const persistentStorage = new PersistentStorage();

export default persistentStorage;
