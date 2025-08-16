
export default function validate(source, schema) {
  return (req, res, next) => {
    const input = source === "query" ? req.query : req[source];
    const { value, error } = schema.validate(input);

    if (error) {
      return res.status(400).json({
        message: "Validation failed",
        details: error.details.map(d => d.message),
      });
    }

    if (source === "query") {
      Object.assign(req.query, value);
      res.locals.validated = { ...(res.locals.validated || {}), query: value };
    } else {
      req[source] = value;
      res.locals.validated = { ...(res.locals.validated || {}), [source]: value };
    }

    next();
  };
}
