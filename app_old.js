import express from "express";
import crypto from "crypto";
import bodyParser from "body-parser";
import { config } from "./config/config.js";
import { getPRFiles, postPRComment } from "./service/github.js";
import { reviewCode } from "./service/agent.js";

const app = express();

// Need raw body for signature verification
app.use(
  bodyParser.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    }
  })
);


app.get("/", async (req, res) => {
  return res.status(200).send("This is test data");
})

app.post("/webhook", async (req, res) => {
  console.time("process");

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

        //console.log("fullDiff", fullDiff)

        if (!fullDiff) {
          return res.send({ status: "no diff to review" });
        }


        //Calling Agent Process
        console.time("agent-call");
        const review = await reviewCode(fullDiff);
        console.timeEnd("agent-call");


        console.log("review", review)

        /* console.time("postPRComment")
         await postPRComment(owner, repo, prNumber, review);
         console.timeEnd("postPRComment")*/

        return res.send({ status: "review posted" });
      } catch (err) {
        console.error(err);
        return res.status(500).send("Error processing PR");
      }
    }
  }
  console.timeEnd("process");
  res.send({ status: "ignored" });
});

app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
});