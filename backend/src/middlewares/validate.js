const { ZodError } = require('zod');

const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const data = source === 'body' ? req.body
        : source === 'params' ? req.params
        : source === 'query' ? req.query
        : req.body;

      const parsed = schema.parse(data);

      if (source === 'body') req.body = parsed;
      else if (source === 'params') req.params = parsed;
      else if (source === 'query') req.query = parsed;

      next();
    } catch (err) {
      if (err instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: err.errors.map(e => ({
            field: e.path.join('.'),
            message: e.message
          }))
        });
      }
      next(err);
    }
  };
};

module.exports = { validate };
