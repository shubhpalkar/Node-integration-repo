import { Octokit } from "@octokit/rest";
import { config } from "../config/config.js";

const octokit = new Octokit({
  auth: config.githubToken
});

async function getPRFiles(owner, repo, pull_number) {
  try {
    const files = await octokit.paginate(
      octokit.pulls.listFiles,
      {
        owner,
        repo,
        pull_number,
        per_page: 100
      }
    );

    return files.map(file => ({
      filename: file.filename,
      patch: file.patch
    }));
  } catch (err) {
    console.error("GitHub API error:", err.message);
    return [];
  }
}

async function postPRComment(owner, repo, issue_number, body) {
  try {
    await octokit.issues.createComment({
      owner,
      repo,
      issue_number,
      body
    });
  } catch (err) {
    console.error("Failed to post comment:", err.message);
  }
}