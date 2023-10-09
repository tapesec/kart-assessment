import { MongoClient } from "mongodb";

const mongoClient = new MongoClient(
  process.env.ME_CONFIG_MONGODB_URL as string
);

export const connectMongo = async () => {
  await mongoClient.connect();
  console.log("Connected to MongoDB");
};

const db = mongoClient.db("mydatabase");
const collection = db.collection("mljobs");

export const getJobsStatus = async (userId: string) => {
  return await collection.find({ userId }).toArray();
};
