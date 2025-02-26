import { DeleteObjectCommand, DeleteObjectsCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { StatusCodes } from "http-status-codes";
import config from "../config";
import AppError from "../errors/AppError";
import { getS3Client } from "./aws";

//upload a single file
export const uploadToS3 = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  { file, fileName }: { file: any; fileName: string },
): Promise<string | null> => {
  console.log({ file, fileName });

  const command = new PutObjectCommand({
    Bucket: config.aws.bucket,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  });

  try {
    const s3Client = await getS3Client();
    const key = await s3Client.send(command);

    if (!key) {
      throw new AppError(StatusCodes.BAD_REQUEST, "File Upload failed");
    }

    const url = `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${fileName}`;
    console.log(url);
    return url;
  } catch (error) {
    console.log(error);
    throw new AppError(StatusCodes.BAD_REQUEST, "File Upload failed");
  }
};

// delete file from s3 bucket
export const deleteFromS3 = async (key: string) => {
  const s3Client = await getS3Client();
  try {
    const command = new DeleteObjectCommand({
      Bucket: config.aws.bucket,
      Key: key,
    });
    await s3Client.send(command);
  } catch (error) {
    console.log("🚀 ~ deleteFromS3 ~ error:", error);
    throw new Error("s3 file delete failed");
  }
};

// upload multiple files

export const uploadManyToS3 = async (
  files: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    file: any;
    path: string;
    key?: string;
    extension?: string;
  }[],
): Promise<{ url: string; key: string }[]> => {
  const s3Client = await getS3Client();

  try {
    const uploadPromises = files.map(async ({ file, path, key, extension = "png" }) => {
      const newFileName = key ? key : `${Math.floor(100000 + Math.random() * 900000)}${Date.now()}`;

      const fileKey = `${path}/${newFileName}.${extension}`;
      const command = new PutObjectCommand({
        Bucket: config.aws.bucket as string,
        Key: fileKey,
        Body: file?.buffer,
      });

      await s3Client.send(command);

      const url = `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${fileKey}`;
      return { url, key: newFileName };
    });

    const uploadedUrls = await Promise.all(uploadPromises);
    return uploadedUrls;
  } catch (error) {
    console.log(error);
    throw new Error("File Upload failed");
  }
};

export const deleteManyFromS3 = async (keys: string[]) => {
  const s3Client = await getS3Client();
  try {
    const deleteParams = {
      Bucket: config.aws.bucket,
      Delete: {
        Objects: keys.map((key) => ({ Key: key })),
        Quiet: false,
      },
    };

    const command = new DeleteObjectsCommand(deleteParams);

    const response = await s3Client.send(command);

    return response;
  } catch (error) {
    console.error("Error deleting S3 files:", error);
    throw new AppError(StatusCodes.BAD_REQUEST, "S3 file delete failed");
  }
};

// upload with progress
export const uploadWithProgress = async (
  { file, fileName }: { file: Express.Multer.File; fileName: string },
  onProgress: (progress: number) => void, // Callback for reporting progress
): Promise<string> => {
  const s3Client = await getS3Client();
  try {
    const totalBytes = file.size;

    // Set up the upload object
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: config.aws.bucket,
        Key: fileName,
        Body: file.buffer, // Multer stores file.buffer for memory storage
        ContentType: file.mimetype,
      },
    });

    // Attach progress listener
    upload.on("httpUploadProgress", (progress) => {
      if (progress.total && progress.loaded) {
        const percentage = Math.round((progress?.loaded / progress.total) * 100);
        onProgress(percentage); // Invoke progress callback
      }
    });

    // Perform the upload
    await upload.done();

    // Return the URL of the uploaded file
    const fileUrl = `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com/${fileName}`;
    return fileUrl;
  } catch (error) {
    console.error("Error uploading file to S3:", error);
    throw new AppError(StatusCodes.BAD_REQUEST, "File upload failed");
  }
};
