import https from "https";
import querystring from "querystring";

type SendMessageOptions = {
  apiKey: string;
  apiHost: string;
};

/**
 * Sends RCS messages to a recipient.
 * @param msgId The message ID.
 * @param to The recipient's phone number.
 * @param options API configuration options.
 * @returns A Promise that resolves with the API response.
 */
export const sendMessagesIntoMobileNumber = async (
  msgId: string,
  to: string,
  options: SendMessageOptions,
): Promise<any> => {
  if (!msgId || !to) {
    throw new Error("Message ID and recipient phone number are required.");
  }

  const requestOptions: https.RequestOptions = {
    method: "POST",
    hostname: options.apiHost,
    path: "/rcs/events",
    headers: {
      "x-rapidapi-key": options.apiKey,
      "x-rapidapi-host": options.apiHost,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  };

  const payload = querystring.stringify({
    msg_id: msgId,
    to,
  });

  return new Promise((resolve, reject) => {
    const req = https.request(requestOptions, (res) => {
      const chunks: any[] = [];

      res.on("data", (chunk) => {
        chunks.push(chunk);
      });

      res.on("end", () => {
        const body = Buffer.concat(chunks).toString();
        resolve(JSON.parse(body));
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
};
