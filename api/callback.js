const CLIENT_ID = '1394432547928412272';
const CLIENT_SECRET = 'syfHHQyg7CFeGUaDUtnz_nK7zu2pd9MA';
const REDIRECT_URI = 'https://bot-auth-nu.vercel.app/api/callback';
const SCOPES = 'identify email';

export default async function handler(req, res) {
  const code = req.query.code;

  if (!code) {
    res.status(400).send('Código OAuth não fornecido.');
    return;
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
      res.status(400).send(`<h1>Erro: ${tokenData.error_description}</h1>`);
      return;
    }

    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    // Monta HTML profissional e estilizado
    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Autenticação Bem Sucedida</title>
      <style>
        body {
          margin: 0;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
          color: white;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          height: 100vh;
          text-align: center;
          padding: 20px;
        }
        .container {
          background: rgba(0,0,0,0.4);
          border-radius: 15px;
          padding: 40px;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
          backdrop-filter: blur(8.5px);
          -webkit-backdrop-filter: blur(8.5px);
          border: 1px solid rgba(255, 255, 255, 0.18);
        }
        img.avatar {
          border-radius: 50%;
          width: 120px;
          height: 120px;
          margin-bottom: 20px;
          border: 3px solid white;
          box-shadow: 0 0 10px #fff;
        }
        h1 {
          margin-bottom: 10px;
          font-size: 28px;
          font-weight: 700;
        }
        p {
          font-size: 18px;
          margin: 5px 0 20px;
        }
        a.button {
          display: inline-block;
          background: #ff3c78;
          color: white;
          padding: 12px 30px;
          border-radius: 30px;
          text-decoration: none;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(255, 60, 120, 0.5);
          transition: background 0.3s ease;
        }
        a.button:hover {
          background: #e83267;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <img class="avatar" src="https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png" alt="Avatar de ${userData.username}" />
        <h1>Bem-vindo, ${userData.username}!</h1>
        <p>Seu login foi realizado com sucesso.</p>
        <p>Email: ${userData.email || 'Não disponível'}</p>
        <a href="/" class="button">Voltar ao site</a>
      </div>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).end(html);

  } catch (err) {
    console.error(err);
    res.status(500).send('<h1>Erro interno no servidor</h1>');
  }
}
