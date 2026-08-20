/**
 * Reusable Express middleware for Zod validation
 * @param {import('zod').ZodSchema} schema 
 * @param {'body' | 'query' | 'params'} [source='body']
 */
export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const parsed = schema.parse(dataToValidate);
      req[source] = parsed;
      next();
    } catch (error) {
      if (error.errors) {
        const formattedErrors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: formattedErrors
        });
      }
      return res.status(400).json({
        success: false,
        message: error.message || 'Invalid input data'
      });
    }
  };
};
