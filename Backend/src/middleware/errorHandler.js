// Global Error Handler Middleware
export const errorHandler = (err, req, res, next) => {
  console.error('❌ Error:', err);

  const statusCode = err.statusCode || 500;
  const errorCode = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Something went wrong on the server';

  res.status(statusCode).json({
    error: {
      code: errorCode,
      message: message,
      details: err.details || []
    }
  });
};
