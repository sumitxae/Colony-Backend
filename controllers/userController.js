const userModel = require("../models/user");
const { catchAsyncError } = require("../middlewares/catchAsyncErrors");
const { sendToken } = require("../utils/sendToken");
const ErrorHandler = require("../utils/errorHandler");
const { sendEmail } = require("../utils/mailer");
const { handleBunnyUploads } = require("../utils/handleBunnyUploads");

const registerController = catchAsyncError(async (req, res, next) => {
  const uploadHanlder = await handleBunnyUploads(req.file);
  if (!uploadHanlder) {
    return next(new ErrorHandler("File Upload Failed", 500));
  }
  const newUser = (await userModel.create(req.body)).populate("colonies");
  newUser.pfp = uploadHanlder;
  sendToken(newUser, 201, res);
});

const loginController = catchAsyncError(async (req, res, next) => {
  const user = await userModel
    .findOne({ username: req.body.username })
    .select("+password").populate("colonies");
  if (!user) {
    return next(new ErrorHandler("User Not Found", 404));
  }
  const isPasswordMatch = await user.comparePassword(req.body.password);
  if (!isPasswordMatch) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }

  sendToken(user, 200, res);
});

const logoutController = catchAsyncError(async (req, res, next) => {
  res.clearCookie("token");
  res.json({ message: "logged out" });
});

const forgetPasswordController = catchAsyncError(async (req, res, next) => {
  const user = await userModel.findOne({ email: req.body.email });
  if (!user) {
    return next(new ErrorHandler("User Not Found", 404));
  }
  const url = `https://colony-zeta.vercel.app/resetpassword/${user._id}`;

  sendEmail(user.email, url, next, res);
  user.resetPasswordFlag = !user.resetPasswordFlag;
  await user.save();
});

const resetPasswordController = catchAsyncError(async (req, res, next) => {
  const user = await userModel.findById(req.params.id);
  if (!user) {
    return next(new ErrorHandler("User Not Found", 404));
  }

  if (user.resetPasswordFlag) {
    user.password = req.body.password;
    user.resetPasswordFlag = !user.resetPasswordFlag;
    await user.save();
    res.status(200).json({
      message: "Password Updated Successfully",
    });
  } else {
    return next(
      new ErrorHandler("Invalid Reset Password Link! Please Try Again", 401)
    );
  }
});

module.exports = {
  registerController,
  forgetPasswordController,
  loginController,
  logoutController,
  resetPasswordController,
};
