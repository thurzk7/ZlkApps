const CLIENT_ID = '1401392984007901304';
const CLIENT_SECRET = 'nIjuYbxCNHYu42dWzJZwEVyjeDCjCuF3';
const REDIRECT_URI = 'https://zlk-apps.vercel.app/api/callback';

module.exports = async function handler(req, res) {
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
    // REMOVIDO: params.append('scope', SCOPES); -> Não deve enviar scope na troca de token

    const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      res.status(400).send(`<h1>Erro: ${tokenData.error_description || tokenData.error}</h1>`);
      return;
    }

    const userResponse = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const userData = await userResponse.json();

    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Login Bem Sucedido</title>
      <style>
        @keyframes backgroundPulse {
          0%, 100% { background-color: #000; }
          50% { background-color: #fff; }
        }
        body {
          margin: 0;
          height: 100vh;
          animation: backgroundPulse 10s infinite alternate ease-in-out;
          display: flex;
          justify-content: center;
          align-items: center;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          color: #222;
          transition: color 1s ease;
        }
        .container {
          background: rgba(0, 0, 0, 0.7);
          padding: 40px;
          border-radius: 20px;
          text-align: center;
          box-shadow: 0 0 30px rgba(255, 255, 255, 0.3);
          color: white;
          max-width: 360px;
          width: 90%;
        }
        img.avatar {
          width: 120px;
          height: 120px;
          border-radius: 50%;
          border: 4px solid white;
          margin-bottom: 25px;
          box-shadow: 0 0 15px white;
        }
        h1 {
          margin: 0 0 10px;
          font-size: 28px;
          font-weight: 700;
          color: white;
        }
        p {
          font-size: 18px;
          margin: 0 0 25px;
          color: #ccc;
        }
        a.button {
          background: #1db954;
          color: white;
          text-decoration: none;
          padding: 14px 35px;
          border-radius: 40px;
          font-weight: 600;
          box-shadow: 0 4px 20px rgba(29, 185, 84, 0.7);
          transition: background-color 0.3s ease;
          display: inline-block;
        }
        a.button:hover {
          background: #17a44a;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <img class="avatar" src="https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png" alt="Avatar de ${userData.username}" />
        <h1>Bem-vindo, ${userData.username}!</h1>
        <p>Seu login foi realizado com sucesso.</p>
        <a href="/" class="button">Voltar ao site</a>
      </div>
    </body>
    </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).end(html);
  } catch (err) {
    console.error('Erro no handler OAuth:', err);
    res.status(500).send('<h1>Erro interno no servidor</h1>');
  }
};

