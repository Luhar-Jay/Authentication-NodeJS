import express from "express";
import {
  forgetPassword,
  getProfile,
  login,
  logoutUser,
  registerUser,
  resetPassword,
  verifyUser,
} from "../controller/user.controller.js";
import { isLoggedIn } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.get("/verify/:token", verifyUser);
router.post("/login", login);
router.get("/profile", isLoggedIn, getProfile);
router.get("/logout", isLoggedIn, logoutUser);
router.get("/forgetpassword", isLoggedIn, forgetPassword);
router.post("/resetpassword/:token", isLoggedIn, resetPassword);

export default router;
