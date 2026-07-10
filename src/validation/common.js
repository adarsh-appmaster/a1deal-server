// Shared Joi fragments for frontend form validation.
// Kept in sync with server/src/utils/joiCommon.js. Messages here are written
// for end users (friendlier than the raw Joi defaults).
import Joi from 'joi';

export const name = Joi.string().trim().min(2).max(80).messages({
  'string.empty': 'Name is required.',
  'string.min': 'Name must be at least 2 characters.',
  'any.required': 'Name is required.',
});

export const email = Joi.string().trim().lowercase().email({ tlds: false }).max(120).messages({
  'string.empty': 'Email is required.',
  'string.email': 'Enter a valid email address.',
  'any.required': 'Email is required.',
});

export const phone = Joi.string().trim().pattern(/^[+]?[\d\s-]{10,15}$/).messages({
  'string.empty': 'Phone number is required.',
  'string.pattern.base': 'Enter a valid phone number.',
  'any.required': 'Phone number is required.',
});

export const password = Joi.string().min(6).max(128).messages({
  'string.empty': 'Password is required.',
  'string.min': 'Password must be at least 6 characters.',
  'any.required': 'Password is required.',
});

export const otp = Joi.string().trim().pattern(/^\d{6}$/).messages({
  'string.empty': 'Enter the 6-digit code.',
  'string.pattern.base': 'Enter the 6-digit code.',
  'any.required': 'Enter the 6-digit code.',
});

export const pincode = Joi.string().trim().pattern(/^\d{6}$/).messages({
  'string.pattern.base': 'Enter a valid 6-digit pincode.',
});

export const shortText = Joi.string().trim().max(200);
export const longText = Joi.string().trim().max(5000);
export const url = Joi.string().trim().uri().max(2000).messages({
  'string.uri': 'Enter a valid URL (including https://).',
});
export const nonNegative = Joi.number().min(0).messages({
  'number.base': 'Enter a valid number.',
  'number.min': 'Must be zero or more.',
});
export const objectId = Joi.string().hex().length(24);

export default Joi;
