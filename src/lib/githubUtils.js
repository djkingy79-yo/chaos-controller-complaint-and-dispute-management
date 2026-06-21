/**
 * CHAOS CONTROLLER™ — GITHUB EXPORT UTILITIES
 * 
 * Sanitization helpers for GitHub repository metadata.
 */

/**
 * Sanitize repository description for GitHub API.
 * GitHub rejects control characters (ASCII 0x00-0x1F, 0x7F-0x9F).
 * 
 * @param {string} value - Raw description text
 * @returns {string} - GitHub-safe plain text description
 */
export function sanitizeGithubDescription(value) {
  return String(value || 'Chaos Controller complaint and dispute management app')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')  // Remove control characters
    .replace(/\s+/g, ' ')                              // Normalize whitespace
    .trim()
    .slice(0, 350);                                    // GitHub limit
}

/**
 * Log description for debugging before GitHub API calls.
 * @param {string} description - Sanitized description
 */
export function logGithubDescription(description) {
  console.log('GitHub repo description:', JSON.stringify(description));
}