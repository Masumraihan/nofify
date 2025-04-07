import { oauth2Client } from "./oauth2Client";

// Set the refresh token (must be obtained first)

// Get and set a new access token
export async function getAccessTokenFromGoogle({ code }: { code: string }) {
  const { tokens } = await oauth2Client.getToken(code);

  oauth2Client.setCredentials({
    refresh_token: tokens.refresh_token,
  });

  try {
    const { token } = await oauth2Client.getAccessToken();
    oauth2Client.setCredentials({ access_token: token });

    return token;
  } catch (error) {
    console.error("Error fetching access token:", error);
  }
}
