module.exports = async function (context, req) {
  const code = req.query.code;
  const client_id = process.env.OAUTH_CLIENT_ID;
  const client_secret = process.env.OAUTH_CLIENT_SECRET;

  try {
    const response = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ client_id, client_secret, code }),
    });
    const data = await response.json();

    const html = `
    <!DOCTYPE html>
    <html>
    <body>
      <script>
        window.opener.postMessage('authorization:github:success:{"token":"${data.access_token}","provider":"github"}', '*');
        window.close();
      </script>
    </body>
    </html>`;

    context.res = { headers: { "Content-Type": "text/html" }, body: html };
  } catch (error) {
    context.res = { status: 500, body: "Falha na autenticacao" };
  }
};
