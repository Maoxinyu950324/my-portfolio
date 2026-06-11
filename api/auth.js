// Vercel Serverless Function - Decap CMS OAuth 认证
export default async function handler(req, res) {
  const { CLIENT_ID, CLIENT_SECRET } = process.env;
  
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const url = new URL(req.url, `https://${req.headers.host}`);
  
  // Step 1: 重定向到 GitHub 授权
  if (!url.searchParams.has('code')) {
    const redirectUri = `https://${req.headers.host}/api/auth`;
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${redirectUri}&scope=repo`;
    return res.redirect(githubAuthUrl);
  }

  // Step 2: 用 code 换取 access_token
  const code = url.searchParams.get('code');
  
  try {
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code,
      }),
    });

    const data = await tokenRes.json();
    
    if (data.access_token) {
      // 返回 HTML 页面，把 token 传给 Decap CMS
      res.setHeader('Content-Type', 'text/html');
      return res.status(200).send(`
        <html>
        <body>
        <script>
          (function() {
            var authResult = ${JSON.stringify(data)};
            if (authResult.access_token) {
              window.opener.postMessage(
                { type: 'authorization', data: { token: authResult.access_token, provider: 'github' } },
                '*'
              );
              window.close();
            }
          })();
        </script>
        </body>
        </html>
      `);
    }
    
    res.status(400).json({ error: 'Failed to get access token' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
