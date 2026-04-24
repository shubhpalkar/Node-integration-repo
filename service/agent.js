import axios from "axios";
import { config } from "../config/config.js";

export async function reviewCode(diffText) {
  try {
   /* const response = await axios.post(
      config.agentApiUrl,
      { code: diffText },
      {
        headers: {
          Authorization: `Bearer ${config.agentApiKey}`,
          "Content-Type": "application/json"
        }
      }
    );*/

      const response = await axios.post(
    "https://httpbin.org/post",
    { code: diffText }
  );

  console.log("response", response)


    return response.data.review || "No feedback provided.";
  } catch (error) {
    return `Agent API Error: ${error.message}`;
  }
}