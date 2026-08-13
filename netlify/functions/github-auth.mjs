import { createAppAuth } from "@octokit/auth-app";
import { createPrivateKey } from "node:crypto";

export default async () => {
  try {
    const privateKey = process.env.GITHUB_PRIVATE_KEY
      .replace(/\\n/g, "\n")
      .replace(/\r/g, "")
      .trim();

    createPrivateKey({
      key: privateKey,
      format: "pem"
    });

    const auth = createAppAuth({
      appId: Number(process.env.GITHUB_APP_ID),
      privateKey
    });

    const app = await auth({ type: "app" });

    return new Response(
      JSON.stringify({
        ok: true,
        expires_at: app.expiresAt
      }),
      {
        status: 200,
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