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

export const persistJob = async ({
  jobId,
  userId,
  sourceKey,
}: {
  jobId: string;
  userId: string;
  sourceKey: string;
}) => {
  const result = await collection.insertOne({
    jobId: jobId,
    trainingStatus: "started",
    inferenceStatus: "iddle",
    createdAt: new Date().getTime(),
    userId,
    sourceKey,
  });
  console.log(`Job : ${jobId}, persisted`);
};

export const updateJobstatus = async ({
  jobId,
  status,
  pipeline,
}: {
  jobId: string;
  status: string;
  pipeline: string;
}) => {
  const result = await collection.updateOne(
    { jobId: jobId },
    {
      $set: {
        [pipeline === "training" ? "trainingStatus" : "inferenceStatus"]:
          status,
        updatedAt: new Date().getTime(),
      },
    }
  );
  console.log(`Job : ${jobId}, ${pipeline} updated to ${status}`);
};
