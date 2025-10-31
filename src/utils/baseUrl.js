/**
 * Base URL utilities for handling public URL configuration
 * Similar to Vite's base configuration
 */

/**
 * Get the base URL for the application
 * Combines window.location.origin with PUBLIC_URL
 * @returns {string} The complete base URL
 */
export const getBaseUrl = () => {
  const origin = window.location.origin;
  const publicUrl = process.env.PUBLIC_URL || '';
  return origin + publicUrl;
};

/**
 * Create a full URL by combining base URL with a path
 * @param {string} path - The path to append (should start with /)
 * @returns {string} The complete URL
 */
export const createUrl = (path) => {
  const baseUrl = getBaseUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return baseUrl + normalizedPath;
};

/**
 * Get URL for assets in the public folder
 * @param {string} assetPath - Path to asset (e.g., '/images/logo.png')
 * @returns {string} The complete asset URL
 */
export const getAssetUrl = (assetPath) => {
  return createUrl(assetPath);
};

/**
 * Get API endpoint URL
 * @param {string} endpoint - API endpoint path (e.g., '/api/users')
 * @returns {string} The complete API URL
 */
export const getApiUrl = (endpoint) => {
  return createUrl(endpoint);
};

/**
 * Legacy compatibility - use getBaseUrl() instead
 * @deprecated Use getBaseUrl() instead
 */
export const getOriginWithPublicUrl = () => {
  console.warn('getOriginWithPublicUrl is deprecated, use getBaseUrl() instead');
  return getBaseUrl();
};
