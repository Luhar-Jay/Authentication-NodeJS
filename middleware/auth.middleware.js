import jwt from "jsonwebtoken";

export const isLoggedIn = async (req, res, next) => {
  try {
    console.log("cookies", req.cookies);
    let token = req.cookies?.token;
    console.log("Token found", token ? "YES" : "NO");

    if (!token) {
      console.log("No token");

      return res.status(401).json({
        message: "Authentication failed",
        success: false,
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_PASS_KEY);
    console.log("decoded data: ", decoded);

    req.user = decoded;

    next();
  } catch (error) {
    console.log("Auth middleware failur");
    return res.status(400).json({
      message: "Internal server error",
      success: false,
    });
  }
};
