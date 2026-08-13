export default async () => {
  return new Response(
    JSON.stringify({
      APP_ID: !!process.env.GITHUB_APP_ID,
      CLIENT_ID: !!process.env.GITHUB_CLIENT_ID,
      INSTALLATION_ID: !!process.env.GITHUB_INSTALLATION_ID,
      PRIVATE_KEY_BASE64: !!process.env.GITHUB_PRIVATE_KEY_BASE64
    }),
    {
      headers: {
        "content-type": "application/json"
      }
    }
  );
};