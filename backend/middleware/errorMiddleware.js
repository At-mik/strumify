export const errorMiddleware = (error, req, res, next) => {
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal server error";

  if (res.headersSent) {
    return next(error);
  }

  return res.status(statusCode).json({
    message,
    ...(process.env.NODE_ENV === "development" ? { stack: error.stack } : {})
  });
};
