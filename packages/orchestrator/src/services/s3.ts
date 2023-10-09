import { S3 } from "@aws-sdk/client-s3";

export const s3 = new S3({
  endpoint: "http://localstack:4566",
  region: "us-east-1",
  forcePathStyle: true,
  credentials: {
    accessKeyId: "test",
    secretAccessKey: "test",
  },
});

export const ensureBucketExists = async () => {
  try {
    await s3.getBucketLocation({ Bucket: BUCKET_NAME });
    console.log(`Bucket ${BUCKET_NAME} exists.`);
  } catch (err) {
    if ((err as any).Code === "NoSuchBucket") {
      try {
        await s3.createBucket({ Bucket: BUCKET_NAME });
        console.log(`Bucket ${BUCKET_NAME} created.`);
      } catch (createErr) {
        console.error(`Error creating bucket: ${createErr}`);
      }
    } else {
      console.error(`Error checking bucket: ${err}`);
    }
  }
};

export const BUCKET_NAME = "video-of-myself";
