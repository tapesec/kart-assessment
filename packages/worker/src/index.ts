import { Worker } from "bullmq";
import { processMLpipeline } from "./services/mlPipeline";

new Worker(
  "train-model",
  async (job) => {
    console.log(`Processing training root job ${job.parent?.id} ...`);
    await processMLpipeline("training", 10000);
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  }
);

new Worker(
  "infer-model",
  async (job) => {
    console.log(`Processing inference root job ${job.id} ...`);
    await processMLpipeline("inference", 3000);
  },
  {
    connection: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  }
);

console.log("Worker started");
