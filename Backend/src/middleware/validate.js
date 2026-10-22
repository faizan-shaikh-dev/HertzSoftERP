// Zod Schema Validation Middleware for Express
export const validateBody = (schema) => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const issues = result.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message
      }));

      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: issues[0]?.message || 'Invalid request body payload',
          details: issues
        }
      });
    }

    // Replace req.body with sanitized & parsed data
    req.body = result.data;
    next();
  };
};

export default validateBody;
