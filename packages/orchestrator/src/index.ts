import express from "express";
import { FlowProducer } from "bullmq";
import { BUCKET_NAME, s3, ensureBucketExists } from "./services/s3";
import { getJobsStatus, connectMongo } from "./services/database";
import multer from "multer";
import path from "path";

const app = express();
const port = 80;

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const flowProducer = new FlowProducer({
  connection: {
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT) || 6379,
  },
});

app.get("/index.html", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});

app.post("/tmycc", upload.single("video"), async (req, res) => {
  try {
    const videoBuffer = req.file?.buffer;
    if (!videoBuffer) {
      return res.status(400).send("No video uploaded.");
    }

    const s3Params = {
      Bucket: BUCKET_NAME,
      Key: `${Date.now()}.mp4`,
      Body: videoBuffer,
    };
    await s3.putObject(s3Params);

    console.log("queuing ...");
    const chain = await flowProducer.add({
      name: "infer",
      data: {
        videoS3Key: s3Params.Key,
        userId: req.body.userId,
      },
      queueName: "infer-model",
      children: [
        {
          name: "train",
          data: {
            videoS3Key: s3Params.Key,
            userId: req.body.userId,
          },
          queueName: "train-model",
        },
      ],
    });

    res.status(202).json({
      jobId: chain.job.parentKey,
      statusLocation: `/tmycc-status/${req.body.userId}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error.");
  }
});

app.get("/tmycc-status/:userId", async (req, res, next) => {
  const jobs = await getJobsStatus(req.params.userId);
  return res.json(jobs);
});

app.listen(port, async () => {
  console.log(`Orchestrator listening at http://localhost:${port}`);
  await connectMongo();
  setTimeout(ensureBucketExists, 2000);
});
