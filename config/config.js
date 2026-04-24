import dotenv from "dotenv";

dotenv.config();

export const config = {
  githubToken: process.env.GITHUB_TOKEN,
  webhookSecret: process.env.WEBHOOK_SECRET,
  agentApiUrl: process.env.AGENT_API_URL,
  agentApiKey: process.env.AGENT_API_KEY,
  port: process.env.PORT || 9000
};