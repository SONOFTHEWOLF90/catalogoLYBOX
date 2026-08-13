import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";

const OWNER = "SONOFTHEWOLF90";
const REPO = "catalogoLYBOX";
const BRANCH = "main";

export default async (request) => {

  if (request.method !== "POST") {
    return new Response("Método no permitido", { status: 405 });
  }

  try {

    const { path, content, message } = await request.json();

    const privateKey = Buffer.from(
      process.env.GITHUB_PRIVATE_KEY_BASE64,
      "base64"
    ).toString("utf8");

    const auth = createAppAuth({
      appId: Number(process.env.GITHUB_APP_ID),
      privateKey
    });

    const installation = await auth({
      type: "installation",
      installationId: Number(process.env.GITHUB_INSTALLATION_ID)
    });

    const octokit = new Octokit({
      auth: installation.token
    });

    let sha = null;

    try {

      const actual = await octokit.request(
        "GET /repos/{owner}/{repo}/contents/{path}",
        {
          owner: OWNER,
          repo: REPO,
          path
        }
      );

      sha = actual.data.sha;

    } catch {}

    await octokit.request(
      "PUT /repos/{owner}/{repo}/contents/{path}",
      {
        owner: OWNER,
        repo: REPO,
        path,
        message,
        content,
        sha,
        branch: BRANCH
      }
    );

    return new Response(
      JSON.stringify({ ok: true }),
      {
        headers: {
          "content-type": "application/json"
        }
      }
    );

  } catch (error) {

    return new Response(
      JSON.stringify({
        ok: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          "content-type": "application/json"
        }
      }
    );

  }

};