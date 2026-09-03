module.exports = async function (context, req) {
  const client_id = process.env.OAUTH_CLIENT_ID;
  const redirect_uri = `https://github.com/login/oauth/authorize?client_id=${client_id}&scope=repo,user`;
  context.res = { status: 302, headers: { Location: redirect_uri } };
};
