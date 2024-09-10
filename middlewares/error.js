exports.generatedError = (err, req, res, next) => {
  console.log("message: ", err);
  const statsuCode = err.statusCode || 500;

  if (err.name === "MongoServerError" && err.message.includes("E11000")) {
    const field = Object.keys(err.keyPattern)[0];
    const value = Object.values(err.keyValue)[0];
    return res.status(400).send({
      message: `${field.charAt(0).toUpperCase() + field.slice(1)} '${value}' already exists. Please use a different value.`,
      error: err,
    });
  }

  if (err.name === "TokenExpiredError") {
    return res.status(400).send({
      message: "Session has been expired. Please login again!",
    });
  }

  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map((val) => val.message);
    return res.status(400).send({
      message: errors.join(", "),
      error: err,
    });
  }

  res.status(statsuCode).send({
    message: err.message,
    name: err.name,
    stack: err.stack,
  });
};
