import mongoose from "mongoose";

const db = () => {
  mongoose
    .connect(process.env.MONGO_URL)
    .then(() => {
      console.log("Connected to db");
    })
    .catch((err) => {
      console.log("Failed connection");
    });
};

export default db;
