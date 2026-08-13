import { createAppAuth } from "@octokit/auth-app";

export default async () => {
  try {
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

    return new Response(
      JSON.stringify({
        ok: true,
        token: installation.token
      }),
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
