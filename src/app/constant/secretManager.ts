import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
import config from "../config";

export const getSecret = async (secretName: string): Promise<string | null> => {
  const client = new SecretsManagerClient({
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId as string,
      secretAccessKey: config.aws.secretAccessKey as string,
    },
  });

  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);

    if (response.SecretString) {
      console.log("Secret retrieved successfully:", response.SecretString);
      return response.SecretString;
    }

    console.error("Secret not found as a string!");
    return null;
  } catch (error: any) {
    if (error.__type === "ResourceNotFoundException") {
      console.error("Secret not found. Verify the secret name and region:", error);
    } else {
      console.error("Error retrieving secret:", error);
    }
    throw new Error("Failed to retrieve secret from AWS Secrets Manager");
  }
};
