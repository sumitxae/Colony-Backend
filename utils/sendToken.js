exports.sendToken = (user, statusCode, res) => {
  const token = user.getjwtToken();
  user.password = undefined;
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_TIME * 1000 // 24 hours
    ),
  };
  
  res.status(statusCode).cookie("token", token, options).json({
    success: true,
    user: user,
    token,
  });
};
