import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import db from "./utils/db.js";

// import all routes
import userRoutes from "./routes/user.routes.js";
import cookieParser from "cookie-parser";

const app = express();
dotenv.config();
const port = process.env.PORT || 4000;
app.use(
  cors({
    origin: process.env.BASE_URL,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// connect to db.
db();

// user routes
app.use("/api/v1/users", userRoutes);
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
