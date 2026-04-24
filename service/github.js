import { Octokit } from "@octokit/rest";
import { config } from "../config/config.js";

const octokit = new Octokit({
  auth: config.githubToken
});

export async function getPRFiles(owner, repo, pull_number) {
  const files = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number
  });

  return files.data.map(file => ({
    filename: file.filename,
    patch: file.patch
  }));
}

export async function postPRComment(owner, repo, pull_number, comment) {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: pull_number,
    body: comment
  });
}