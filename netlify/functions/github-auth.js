import { createAppAuth } from "@octokit/auth-app";
import { createPrivateKey } from "crypto";

export default async () => {
  try {
    const raw = process.env.GITHUB_PRIVATE_KEY;

    const privateKey = raw
      .replace(/\\n/g, "\n")
      .replace(/\r/g, "")
      .trim();

    // Verifica que OpenSSL pueda leer el PEM
    createPrivateKey({
      key: privateKey,
      format: "pem",
    });

    const auth = createAppAuth({
      appId: Number(process.env.GITHUB_APP_ID),
      privateKey,
    });

    const app = await auth({ type: "app" });

    return new Response(
      JSON.stringify({
        ok: true,
        expires_at: app.expiresAt,
      }),
      { status: 200 }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: e.message,
        begin: process.env.GITHUB_PRIVATE_KEY?.split("\n")[0],
      }),
      { status: 500 }
    );
  }
};