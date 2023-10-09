import { QueueEvents, Job, Queue } from "bullmq";
import { persistJob, updateJobstatus, connectMongo } from "./services/database";

connectMongo().then(() => {
  const trainQueue = new Queue("train-model", {
    connection: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  });
  const modelTrainedEvents = new QueueEvents("train-model", {
    connection: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  });

  modelTrainedEvents.on("added", async (args) => {
    const { jobId } = args;
    const job = await Job.fromId(trainQueue, jobId);
    if (job && job.data) {
      const { userId, videoS3Key } = job.data;
      console.log(`Trained started for job ${jobId}`);
      await persistJob({
        jobId: job.parent?.id as string,
        userId,
        sourceKey: videoS3Key,
      });
    } else {
      console.error(`Job with ID ${jobId} not found.`);
    }
  });

  modelTrainedEvents.on("completed", async ({ jobId }) => {
    const job = await Job.fromId(trainQueue, jobId);
    if (job && job.data) {
      console.log(`Training completed for parent job ${job.parent?.id}`);
      await updateJobstatus({
        jobId: job.parent?.id as string,
        status: "completed",
        pipeline: "training",
      });
    }
  });

  modelTrainedEvents.on("failed", async ({ jobId }) => {
    const job = await Job.fromId(trainQueue, jobId);
    if (job && job.data) {
      console.log(`Training failed for parent job ${job.parent?.id}`);
      await updateJobstatus({
        jobId: job.parent?.id as string,
        status: "failed",
        pipeline: "training",
      });
    }
  });

  const modelInferedEvents = new QueueEvents("infer-model", {
    connection: {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT) || 6379,
    },
  });

  modelInferedEvents.on("added", async (args) => {
    // jobId received a progress event
    console.log(`Inferance started for job ${args.jobId}`);
    await updateJobstatus({
      jobId: args.jobId,
      status: "started",
      pipeline: "infering",
    });
  });

  modelInferedEvents.on("completed", async (args) => {
    // Called every time a job is completed in any worker.
    console.log(`Inference completed for job ${args.jobId}`);
    await updateJobstatus({
      jobId: args.jobId,
      status: "completed",
      pipeline: "infering",
    });
  });

  modelInferedEvents.on("failed", async (args) => {
    // jobId received a progress event
    console.log(`Inference failed for job ${args.jobId}`);
    await updateJobstatus({
      jobId: args.jobId,
      status: "failed",
      pipeline: "infering",
    });
  });
});
