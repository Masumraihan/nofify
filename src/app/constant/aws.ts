import { S3Client } from "@aws-sdk/client-s3";
import config from "../config";
import { getSecret } from "./secretManager";

const secret = getSecret("nof_app")
  .then((res) => res)
  .catch((err) => err);
export const s3Client = new S3Client({
  region: `${config.aws.region}`,
  //connectionTimeout: 30000, // 30 seconds
  //socketTimeout: 30000,
  //apiVersion: "2012-10-17",
  credentials: {
    accessKeyId: `${config.aws.accessKeyId}`,
    secretAccessKey: `${config.aws.secretAccessKey}`,
  },
});
