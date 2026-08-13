const OWNER = "SONOFTHEWOLF90";
const REPO = "catalogoLYBOX";
const BRANCH = "main";

exports.handler = async (event) => {

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Método no permitido"
    };
  }

  try {

    const { createAppAuth } = await import("@octokit/auth-app");
    const { Octokit } = await import("@octokit/core");

    const { path, content, message } = JSON.parse(event.body);

    const auth = createAppAuth({
        appId: Number(process.env.GITHUB_APP_ID),
        privateKey: process.env.GITHUB_PRIVATE_KEY
         .replace(/\\n/g, "\n")
         .replace(/\r/g, "")
            .trim()
    });

    const installationAuthentication = await auth({
      type: "installation"
    });

    const octokit = new Octokit({
      auth: installationAuthentication.token
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

    } catch (e) {
      // El archivo no existe todavía
    }

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

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true })
    };

  } catch (error) {

    return {
      statusCode: 500,
      body: JSON.stringify({
        ok: false,
        error: error.message
      })
    };

  }

};