const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/errorHandler");
const { catchAsyncError } = require("./catchAsyncErrors");

exports.isAuthenticated = catchAsyncError(async (req, res, next) => {
  let token  = req.cookies.token || req.headers.authorization.split(' ')[1];

  if (!token) {
    return next(new ErrorHandler("Login first to access this resource", 401));
  }
  const { id } = jwt.verify(token, process.env.JWT_SECRET);
  req.id = id;
  next(); 
});
