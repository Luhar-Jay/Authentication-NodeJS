import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import db from "./utils/db.js";

// import all routes
import userRoutes from "./routes/user.routes.js";

const app = express();
dotenv.config();
const port = process.env.PORT || 4000;
app.use(
  cors({
    origin: process.env.BASE_URL,
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Contant-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});
app.get("/jay", (req, res) => {
  res.send("Jay");
});

// connect to db.
db();

// user routes
app.use("/api/v1/users", userRoutes);
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
