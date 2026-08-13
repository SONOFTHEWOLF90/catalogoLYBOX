const { createAppAuth } = require("@octokit/auth-app");

exports.handler = async () => {

  try{

    const auth = createAppAuth({
      appId: process.env.GITHUB_APP_ID,
      privateKey: process.env.GITHUB_PRIVATE_KEY
    });

    const appAuthentication = await auth({ type:"app" });

    return{
      statusCode:200,
      body:JSON.stringify({
        ok:true,
        expires_at:appAuthentication.expiresAt
      })
    };

  }catch(error){

    return{
      statusCode:500,
      body:JSON.stringify({
        ok:false,
        error:error.message
      })
    };

  }

};