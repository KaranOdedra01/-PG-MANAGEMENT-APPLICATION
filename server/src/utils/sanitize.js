import mongoose from 'mongoose';

/**
 * Safely escapes special regular expression characters from user search queries
 * and limits search string length to prevent ReDoS.
 * @param {string} str - Search string
 * @param {number} maxLen - Maximum length (default: 100)
 * @returns {string} - Escaped string safe for RegExp
 */
export const escapeRegex = (str, maxLen = 100) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().slice(0, maxLen).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Validates whether a given string is a valid MongoDB ObjectId.
 * @param {string} id
 * @returns {boolean}
 */
export const isValidObjectId = (id) => {
  if (!id || typeof id !== 'string') return false;
  return mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === id;
};

/**
 * Formats a safe error response for controllers.
 * In production, returns generic server error message without exposing database/stack details.
 * @param {object} res - Express response
 * @param {Error} error - Thrown error
 * @param {string} customMsg - Optional friendly message
 * @param {number} defaultStatus - Default HTTP status code (500)
 */
export const handleControllerError = (res, error, customMsg = '', defaultStatus = 500) => {
  const isProd = process.env.NODE_ENV === 'production';
  console.error('Controller Error:', error?.stack || error?.message || error);

  if (error?.name === 'CastError' && error?.kind === 'ObjectId') {
    return res.status(400).json({
      success: false,
      message: 'Invalid ID format'
    });
  }

  const message = isProd
    ? 'Internal server error. Please try again later.'
    : (error?.message || customMsg || 'Internal server error. Please try again later.');

  return res.status(defaultStatus).json({
    success: false,
    message
  });
};
