import express from "express";
import crypto from "crypto";
import bodyParser from "body-parser";
import { config } from "./config.js";
import { getPRFiles, postPRComment } from "./github.js";
import { reviewCode } from "./agent.js";

const app = express();

// Need raw body for signature verification
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);

function verifySignature(req) {
  const signature = req.headers["x-hub-signature-256"];
  console.log("signature", signature)
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", config.webhookSecret);
  const digest =
    "sha256=" + hmac.update(req.rawBody).digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(digest)
  );
}

app.get("/", async(req, res) => {
    return res.status(200).send("This is test data");
})

app.post("/webhook", async (req, res) => {
  if (!verifySignature(req)) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.headers["x-github-event"];
  const payload = req.body;

  if (event === "pull_request") {
    const action = payload.action;

    if (action === "opened" || action === "synchronize") {
      const { full_name } = payload.repository;
      const [owner, repo] = full_name.split("/");
      const prNumber = payload.pull_request.number;

      console.log("full_name--", full_name)

      try {
        const files = await getPRFiles(owner, repo, prNumber);

        const fullDiff = files
          .filter(f => f.patch)
          .map(f => `${f.filename}:\n${f.patch}`)
          .join("\n\n");

          console.log("fullDiff", fullDiff)

        const review = await reviewCode(fullDiff);

        console.log("review", review)

        await postPRComment(owner, repo, prNumber, review);

        return res.send({ status: "review posted" });
      } catch (err) {
        console.error(err);
        return res.status(500).send("Error processing PR");
      }
    }
  }

  res.send({ status: "ignored" });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});