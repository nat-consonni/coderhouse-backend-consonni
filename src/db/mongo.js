import mongoose from "mongoose";

export async function connectMongo(uri) {
  const URL = uri || process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/coderhouse";
  await mongoose.connect(URL, { dbName: process.env.MONGO_DB || "coderhouse" });
  console.log("✅ Conectado a MongoDB:", URL);
}
