function errorHandler(err, req, res, next) {
  req.log.error({ err }, 'Unhandled error');

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;
