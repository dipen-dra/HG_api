// Filename: backend/middlewares/errorHandler.js

const errorHandler = (err, req, res, next) => {
    // Determine the status code. If the error object has a statusCode, use it.
    // Otherwise, default to 500 (Internal Server Error).
    const statusCode = err.statusCode || 500;

    // Log the error for debugging purposes (on the server, not sent to client)
    // In production, you might use a more sophisticated logger like Winston.
    console.error(err.stack);

    res.status(statusCode).json({
        success: false,
        // Send a generic message for 500 errors to avoid leaking implementation details.
        // For other errors, use the error's message.
        message: statusCode === 500 ? 'An unexpected error occurred on the server.' : err.message,
        // In development, you might want to send the stack trace for easier debugging.
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

export default errorHandler;