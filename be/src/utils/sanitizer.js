
/**
 * Validate that a value is a primitive string
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @throws {Error} If value is not a valid string
 */
export const validateString = (value, fieldName = 'field') => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== 'string') {
    throw new Error(`${fieldName} must be a string`);
  }

  return value;
};

/**
 * Validate that a value is a primitive string (required)
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @throws {Error} If value is not a valid string or is empty
 */
export const validateRequiredString = (value, fieldName = 'field') => {
  const validated = validateString(value, fieldName);
  
  if (!validated) {
    throw new Error(`${fieldName} is required`);
  }

  return validated;
};

/**
 * Validate that a value is a primitive number (not an object with operators)
 * @param {*} value - Value to validate
 * @param {string} fieldName - Field name for error message
 * @throws {Error} If value is not a valid number
 */
export const validateNumber = (value, fieldName = 'field') => {
  if (value === null || value === undefined) {
    return null;
  }

  // Check if it's a primitive number, not an object
  if (typeof value !== 'number') {
    throw new Error(`${fieldName} must be a number`);
  }

  if (isNaN(value)) {
    throw new Error(`${fieldName} is not a valid number`);
  }

  return value;
};

/**
 * Validate coordinates (latitude and longitude)
 * @param {*} lat - Latitude value
 * @param {*} lng - Longitude value
 * @throws {Error} If coordinates are invalid
 */
export const validateCoordinates = (lat, lng) => {
  const latitude = validateNumber(lat, 'latitude');
  const longitude = validateNumber(lng, 'longitude');

  if (latitude < -90 || latitude > 90) {
    throw new Error('Latitude must be between -90 and 90');
  }

  if (longitude < -180 || longitude > 180) {
    throw new Error('Longitude must be between -180 and 180');
  }

  return { latitude, longitude };
};

/**
 * Validate pagination parameters
 * @param {*} page - Page number
 * @param {*} limit - Items per page
 * @throws {Error} If parameters are invalid
 */
export const validatePagination = (page, limit, maxLimit = 100) => {
  let validPage = Number(page) || 1;
  let validLimit = Number(limit) || 10;

  if (!Number.isInteger(validPage) || validPage < 1) {
    throw new Error('Page must be a positive integer');
  }

  if (!Number.isInteger(validLimit) || validLimit < 1) {
    throw new Error('Limit must be a positive integer');
  }

  if (validLimit > maxLimit) {
    validLimit = maxLimit;
  }

  return { page: validPage, limit: validLimit };
};

/**
 * Validate phone number format
 * @param {*} phone - Phone number to validate
 * @throws {Error} If phone format is invalid
 */
export const validatePhone = (phone) => {
  const validated = validateRequiredString(phone, 'phone');
  
  // Check if it matches the expected format (9-11 digits)
  if (!/^\d{9,11}$/.test(validated)) {
    throw new Error('Phone must be 9-11 digits');
  }

  return validated;
};

/**
 * Validate email format
 * @param {*} email - Email to validate
 * @throws {Error} If email format is invalid
 */
export const validateEmail = (email) => {
  const validated = validateRequiredString(email, 'email');
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(validated)) {
    throw new Error('Invalid email format');
  }

  return validated;
};

/**
 * Validate ObjectId format
 * @param {*} id - ID to validate (should be valid MongoDB ObjectId)
 * @param {string} fieldName - Field name for error message
 * @throws {Error} If ID format is invalid
 */
export const validateObjectId = (id, fieldName = 'id') => {
  const validated = validateRequiredString(id, fieldName);
  
  // Check if it matches MongoDB ObjectId format (24 hex characters)
  if (!/^[0-9a-f]{24}$/i.test(validated)) {
    throw new Error(`${fieldName} must be a valid ObjectId`);
  }

  return validated;
};

/**
 * Sanitize search input
 * @param {*} value - Value to sanitize
 * @param {number} maxLength - Maximum length allowed
 * @throws {Error} If value is invalid
 */
export const sanitizeSearchInput = (value, maxLength = 100) => {
  let validated = validateString(value, 'search');
  
  if (!validated) {
    return '';
  }

  validated = validated.trim();

  if (validated.length > maxLength) {
    throw new Error(`Search input must not exceed ${maxLength} characters`);
  }

  return validated;
};