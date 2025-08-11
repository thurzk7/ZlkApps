import fetch from 'node-fetch';

const CLIENT_ID = '1394432547928412272';
const CLIENT_SECRET = 'syfHHQyg7CFeGUaDUtnz_nK7zu2pd9MA';
const REDIRECT_URI = 'https://seunome.vercel.app/api/callback'; // coloque aqui o URL do seu deploy Vercel
const SCOPES = 'identify email';

export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send('Código OAuth não fornecido.');
  }

  try {
    const params = new URLSearchParams();
    params.append('client_id', CLIENT_ID);
    params.append('client_secret', CLIENT_SECRET);
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', REDIRECT_URI);
    params.append('scope', SCOPES);

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      return res.status(400).json({ error: tokenData.error_description });
    }

    // Pega dados do usuário com access_token
    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    // Retorna as infos do usuário (pode personalizar)
    res.status(200).json({ user: userData });

  } catch (err) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
}
