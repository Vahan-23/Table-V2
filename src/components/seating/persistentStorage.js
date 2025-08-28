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
   * Save data to backend with debouncing, also save to localStorage as backup
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @returns {Promise<boolean>} Success status
   */
  async save(key, value) {
    // Save to localStorage immediately as backup
    this.saveToLocalStorage(key, value);

    // Debounce backend saves
    return new Promise((resolve) => {
      // Clear existing timer for this key
      if (this.debounceTimers.has(key)) {
        clearTimeout(this.debounceTimers.get(key));
      }

      // Set new debounced timer
      const timer = setTimeout(async () => {
        try {
          const response = await fetch(`${this.baseUrl}/api/named_value`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              name: key,
              value: value 
            })
          });

          const data = await response.json();
          
          if (data.success) {
            console.log(`✅ Successfully persisted ${key} to backend`);
            resolve(true);
          } else if (data.error === 'Authentication required') {
            console.warn(`User not authenticated - ${key} saved only to localStorage`);
            resolve(false);
          } else {
            console.error(`Failed to persist ${key} to backend:`, data.error);
            resolve(false);
          }
        } catch (error) {
          console.error(`Failed to persist ${key} to backend:`, error);
          resolve(false);
        }

        // Clean up timer reference
        this.debounceTimers.delete(key);
      }, this.debounceDelay);

      this.debounceTimers.set(key, timer);
    });
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
   * Clear all pending debounced saves
   */
  clearPendingSaves() {
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
  }

  /**
   * Get current configuration info
   * @returns {Object} Configuration details
   */
  getConfig() {
    return {
      baseUrl: this.baseUrl,
      debounceDelay: this.debounceDelay,
      pendingSaves: this.debounceTimers.size,
      usingRelativeUrls: !this.baseUrl
    };
  }
}

// Create singleton instance
const persistentStorage = new PersistentStorage();

export default persistentStorage;
