import { S3Client } from "@aws-sdk/client-s3";
import { getSecret } from "./secretManager";
import config from "../config";

let s3ClientInstance: S3Client | null = null;

async function getS3Client(): Promise<S3Client> {
  if (!s3ClientInstance) {
    try {
      const secret = await getSecret("nof_app");
      const data = JSON.parse(secret as string);
      s3ClientInstance = new S3Client({
        region: config.aws.region,
        credentials: {
          accessKeyId: config.aws.accessKeyId as string,
          secretAccessKey: config.aws.secretAccessKey as string,
        },
      });
      //s3ClientInstance = new S3Client({
      //  region: data.region,
      //  credentials: {
      //    accessKeyId: data.accessKeyId,
      //    secretAccessKey: data.secretKey,
      //  },
      //});
    } catch (error) {
      console.error("Error initializing S3 client:", error);
      throw error;
    }
  }
  return s3ClientInstance;
}

export { getS3Client };
