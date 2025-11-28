/**
 * Retry utility with exponential backoff
 * For handling transient failures in AI and external services
 */

const logger = require('./logger');

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * 
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts (default: 3)
 * @param {number} options.initialDelay - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @param {number} options.backoffMultiplier - Multiplier for exponential backoff (default: 2)
 * @param {Function} options.shouldRetry - Function to determine if error should be retried
 * @returns {Promise} Result of the function or throws error
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
    context = 'operation'
  } = options;

  let lastError;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      logger.debug(`Attempt ${attempt + 1}/${maxRetries + 1} for ${context}`);
      const result = await fn();
      
      if (attempt > 0) {
        logger.info(`${context} succeeded after ${attempt} retries`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if we should retry this error
      if (!shouldRetry(error)) {
        logger.warn(`${context} failed with non-retryable error`, {
          error: error.message,
          attempt: attempt + 1
        });
        throw error;
      }
      
      // If this was the last attempt, throw
      if (attempt === maxRetries) {
        logger.error(`${context} failed after ${maxRetries + 1} attempts`, {
          error: error.message,
          totalAttempts: maxRetries + 1
        });
        throw error;
      }
      
      // Calculate next delay with exponential backoff
      const nextDelay = Math.min(delay, maxDelay);
      logger.warn(`${context} failed, retrying in ${nextDelay}ms`, {
        error: error.message,
        attempt: attempt + 1,
        nextRetryIn: nextDelay
      });
      
      await sleep(nextDelay);
      delay *= backoffMultiplier;
    }
  }

  throw lastError;
}

/**
 * Determine if an error is retryable (network/timeout errors)
 */
function isRetryableError(error) {
  const retryableMessages = [
    'timeout',
    'ETIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'ENOTFOUND',
    'rate limit',
    'too many requests',
    '429',
    '500',
    '502',
    '503',
    '504'
  ];

  const errorString = (error.message || error.toString()).toLowerCase();
  return retryableMessages.some(msg => errorString.includes(msg));
}

/**
 * Retry specifically for AI operations
 */
async function retryAIOperation(fn, context = 'AI operation') {
  return retryWithBackoff(fn, {
    maxRetries: 3,
    initialDelay: 2000,
    maxDelay: 15000,
    backoffMultiplier: 2,
    shouldRetry: isRetryableError,
    context
  });
}

/**
 * Retry for external API calls
 */
async function retryAPICall(fn, context = 'API call') {
  return retryWithBackoff(fn, {
    maxRetries: 2,
    initialDelay: 1000,
    maxDelay: 5000,
    backoffMultiplier: 2,
    shouldRetry: isRetryableError,
    context
  });
}

module.exports = {
  retryWithBackoff,
  retryAIOperation,
  retryAPICall,
  isRetryableError
};
