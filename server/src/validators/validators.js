/**
 * Server-side input validators for common fields.
 */
import { body, validationResult } from 'express-validator';

/**
 * Middleware to check validation results and return 400 on errors.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors
        .array()
        .map((e) => e.msg)
        .join(', '),
      errors: errors.array(),
    });
  }
  next();
};

/**
 * Safe path normalization — prevents directory traversal.
 * Strips leading slashes/dots to keep paths relative.
 */
export const sanitizePath = (p) => {
  if (!p || typeof p !== 'string') return '';
  return p
    .replace(/\.\./g, '') // Remove traversal
    .replace(/^[\\/]+/, '') // Remove leading slashes
    .replace(/[<>:"|?*]/g, '') // Remove illegal chars
    .trim();
};

/**
 * Validate a path field is safe.
 */
export const pathValidator = (field) =>
  body(field)
    .optional()
    .customSanitizer((v) => sanitizePath(v))
    .isString()
    .withMessage(`${field} must be a string`);
