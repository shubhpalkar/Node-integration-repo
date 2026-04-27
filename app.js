import express from "express";
import axios from "axios";
import { Octokit } from "@octokit/rest";
import { config } from "./config/config.js";
import { getPRFiles, postPRComment } from "./service/github.js";
import { reviewCode } from "./service/agent.js";



const app = express();
app.use(express.json({ limit: "5mb" }));

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

app.get("/", async(req, res) => {
    return res.status(200).send("This is test data");
})


app.post("/webhook", async (req, res) => {
  console.time("process");

  const event = req.headers["x-github-event"];
  const payload = req.body;

  try {
    if (event !== "pull_request") {
      return res.send({ status: "ignored" });
    }

    const action = payload?.action;

    if (!["opened", "synchronize"].includes(action)) {
      return res.send({ status: "ignored action" });
    }

    const repoFullName = payload?.repository?.full_name;
    const prNumber = payload?.pull_request?.number;

    if (!repoFullName || !prNumber) {
      return res.status(400).send("Invalid payload");
    }

    const [owner, repo] = repoFullName.split("/");

    console.log(`Processing PR #${prNumber} (${action})`);

    // 🔹 Get PR files safely
    const files = await getPRFiles(owner, repo, prNumber);

    if (!files.length) {
      return res.send({ status: "no files" });
    }

    // 🔹 Build diff safely
    const fullDiff = files
      .filter(f => f.patch) // ignore binary / missing patches
      .map(f => `${f.filename}:\n${f.patch}`)
      .join("\n\n");

    if (!fullDiff) {
      return res.send({ status: "no diff available" });
    }

    // 🔹 LIMIT size (critical fix)
    const MAX_DIFF_LENGTH = 40000;
    const trimmedDiff = fullDiff.slice(0, MAX_DIFF_LENGTH);

    console.log("Diff size:", trimmedDiff.length);

    // 🔹 Call review API with timeout
    const review = await reviewCode(trimmedDiff);

    console.log("Review generated");

    // 🔹 Post comment
    //await postPRComment(owner, repo, prNumber, review);

    console.timeEnd("process");
    return res.send({ status: "review posted" });

  } catch (err) {
    console.error("Webhook error:", err.message);
    console.timeEnd("process");

    // Always respond to GitHub
    return res.status(200).send({ status: "error handled" });
  }
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});