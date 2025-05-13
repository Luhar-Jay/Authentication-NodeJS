import User from "../model/User.model.js";
import crypto from "crypto";
import nodemailer from "nodemailer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const registerUser = async (req, res) => {
  //steps
  // get data
  // validate
  // check if user already exist
  // create user in database
  // create a varification token
  // save token in database
  // send token as email to user
  // send success status to user

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({
      message: "Invalid email format",
    });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
    });

    if (!user) {
      return res.status(400).json({
        message: "User not registered",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    user.verificationToken = token;

    await user.save();

    // send email
    const transporter = nodemailer.createTransport({
      host: process.env.MAITRAP_HOST,
      port: process.env.MAITRAP_PORT,
      secure: false, // true for port 465, false for other ports
      auth: {
        user: process.env.MAITRAP_USERNAME,
        pass: process.env.MAITRAP_PASSWORD,
      },
    });

    const mailOption = {
      from: process.env.MAITRAP_SENDEREMAIL, // sender address
      to: user.email, // list of receivers
      subject: "Verify your email", // Subject line
      text: `Pleas click on the followig link:
      ${process.env.BASE_URL}/api/v1/users/verify/${token}`, // generate link to varify user
    };

    transporter.sendMail(mailOption);

    res.status(200).json({
      message: "User registered Successfully",
      success: true,
      mail: mailOption,
    });
  } catch (error) {
    return res.status(400).json({
      message: "User not registered",
      error,
      success: false,
    });
  }
};

const verifyUser = async (req, res) => {
  // get token from url
  // validate token
  // find user based on token
  // if not
  // set isVerified field to true
  // remove verification token
  // save
  // return response

  const { token } = req.params;
  if (!token) {
    res.status(400).json({
      message: "Invalid token",
    });
  }

  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({
        message: "Invalid token",
      });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    res.status(200).json({
      message: "User verified Successfully",
      success: true,
    });
  } catch (error) {
    return res.status(400).json({
      message: "User not verified",
      error,
      success: false,
    });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const isMatched = await bcrypt.compare(password, user.password);

    if (!isMatched) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_PASS_KEY,
      {
        expiresIn: "24h",
      }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: true,
      maxAge: 24 * 60 * 60 * 100,
    };
    res.cookie("token", token, cookieOptions);

    res.status(200).json({
      success: true,
      message: "Login Successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({
      message: "Login failed",
      error,
      success: false,
    });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(400).json({
      message: "Profile not found",
      error,
      success: false,
    });
  }
};
const logoutUser = async (req, res) => {
  try {
    const user = req.user; // `req.user` is set by the protect middleware

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        fullname: user.fullname,
      },
    });
  } catch (error) {
    res.status(400).json({
      message: "Logout failed",
      error,
      success: false,
    });
  }
};
const forgetPassword = async (req, res) => {
  // get email,
  // find user based on email
  // reset token + reset expiry => Date.now() + 10 * 60 *1000 => user.save()
  // send email => design url
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }
    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Set reset token and expiry on user model
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save({ validateBeforeSave: false });

    const transporter = nodemailer.createTransport({
      host: process.env.MAITRAP_HOST,
      port: process.env.MAITRAP_PORT,
      secure: false, // true for port 465, false for other ports
      auth: {
        user: process.env.MAITRAP_USERNAME,
        pass: process.env.MAITRAP_PASSWORD,
      },
    });

    const mailOption = {
      from: process.env.MAITRAP_SENDEREMAIL, // sender address
      to: user.email, // list of receivers
      subject: "Verify your email", // Subject line
      text: `Pleas click on the followig link:
      ${process.env.BASE_URL}/api/v1/users/resetpassword/${resetToken}`, // generate link to varify user
    };

    transporter.sendMail(mailOption);

    // const resetUrl = ` ${process.env.BASE_URL}/api/v1/users/resetpassword/${resetToken}`;

    return res.status(200).json({
      success: true,
      message: "Password reset link has been sent",
      mail: mailOption,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};
const resetPassword = async (req, res) => {
  // collect token from params
  // password from req.body

  const { token } = req.params;
  const { password } = req.body;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  try {
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expire reset password token",
      });
    }
    // set password in user
    user.password = password;

    // reset token, reset expiry => reset
    user.resetPasswordExpires = undefined;
    user.resetPasswordToken = undefined;

    // save()
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

export {
  registerUser,
  verifyUser,
  login,
  getProfile,
  logoutUser,
  forgetPassword,
  resetPassword,
};
