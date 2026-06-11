import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request, redirect }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  
  if (!code) {
    return new Response('Missing code', { status: 400 });
  }

  const clientId = import.meta.env.OAUTH_GITHUB_CLIENT_ID;
  const clientSecret = import.meta.env.OAUTH_GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return new Response('OAuth not configured', { status: 500 });
  }

  // Exchange code for access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const data = await tokenResponse.json();
  
  if (data.error) {
    return new Response(`OAuth error: ${data.error}`, { status: 400 });
  }

  // Redirect back to admin with token
  return redirect(`/admin/index.html#access_token=${data.access_token}`);
};
