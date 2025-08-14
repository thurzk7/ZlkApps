const { getConfig } = require("../databases/index");
const token = process.env.DISCORD_BOT_TOKEN;
const axios = require("axios");

async function website1(res, guild_id) {
    // Pega informações do servidor
    const guildResponse = await axios.get(`https://discord.com/api/v9/guilds/${guild_id}`, {
        headers: { Authorization: `Bot ${token}` }
    }).catch(() => null);

    const guildName = guildResponse?.data?.name || "SkyAppsOAuth2";
    const guildId = guildResponse?.data?.id;
    const iconId = guildResponse?.data?.icon;
    const iconExtension = iconId?.startsWith("a_") ? "gif" : "png";

    // Pega configurações do site do banco de dados
    const image3 = await getConfig("webSite.bannerUrl", "https://i.ibb.co/VjWH1kV/9f58ba77d85faa95ec9da272efafc35d.webp");
    const image4 = await getConfig("webSite.iconUrl", `https://cdn.discordapp.com/icons/${guildId}/${iconId}.${iconExtension}`);
    const buttonName = await getConfig("webSite.butName", "Voltar para o servidor");
    const buttonUrl = await getConfig("webSite.urlButton", "https://discord.com/");
    const seconds = await getConfig("webSite.seconds", 10);

    // Variáveis para HTML
    const image1 = image4; // favicon
    const image2 = image4; // botão Discord

    // HTML da página
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${guildName} - OAuth2</title>
    <link rel="shortcut icon" href="${image1}" type="image/x-icon">
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Montserrat&display=swap");
        body { font-family: Montserrat; margin:0; width:100vw; height:100vh; display:flex; align-items:center; justify-content:center; background:url(${image3}) no-repeat center; background-size:cover; background-color:#000011; }
        main { width:100vw; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; color:white; backdrop-filter:blur(8px); }
        .discord-button { position:fixed; bottom:20px; right:20px; background-color:#5865f2; color:#fff; border:none; border-radius:50%; width:50px; height:50px; cursor:pointer; display:flex; justify-content:center; align-items:center; animation:pulse 1.5s infinite alternate, swing 1s infinite alternate; transition: transform 0.3s; }
        .discord-button:hover { transform: scale(1.2); }
        .discord-button img { width: 80%; height:auto; }
        .content { min-width:30vw; max-width:30vw; background-color:#00000099; backdrop-filter:blur(24px); padding:2rem; border-radius:10px; }
        .verified-text { background-color:#10a64a90; padding:1rem; display:flex; gap:1rem; border-radius:10px; border:2px solid #1eff0090; width:calc(100%-2rem); font-size:90%; }
        .verified-text * { margin:0; }
        .verified-text>div { display:flex; flex-direction:column; }
        .verified-text>svg { width:50px; }
        .apresentation { text-align:center; display:flex; flex-direction:column; align-items:center; }
        .apresentation>h1 { margin-bottom:0; }
        .apresentation>p { font-size:150%; }
        .apresentation>img { width:15rem; border-radius:9999px; margin-bottom:20px; border-color:white; border-spacing:10px; }
        .apresentation>button { all: unset; width:100%; padding-block:10px; cursor:pointer; font-weight:600; font-size:110%; border:2px solid white; border-radius:20px; opacity:60%; transition-duration:200ms; }
        .apresentation>button:hover { opacity:100%; }
        @media screen and (max-width:720px) { .content { max-width:90vw; min-width:90vw; font-size:80%; padding:1rem; } .verified-text { font-size:80%; padding:.7rem; gap:.7rem; } .verified-text>svg { width:30px; } .apresentation>img { width:10rem; border:white; } .apresentation>button { padding-block:15px; font-size:120%; } }
    </style>
</head>
<body>
    <main>
        <a href="${buttonUrl}" class="discord-button">
            <img src="${image2}" alt="Discord">
        </a>
        <div class="content">
            <div class="verified-text">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 116.87">
                    <polygon fill="#028dff" fill-rule="evenodd" points="61.37 8.24 80.43 0 90.88 17.79 111.15 22.32 109.15 42.85 122.88 58.43 109.2 73.87 111.15 94.55 91 99 80.43 116.87 61.51 108.62 42.45 116.87 32 99.08 11.73 94.55 13.73 74.01 0 58.43 13.68 42.99 11.73 22.32 31.88 17.87 42.45 0 61.37 8.24"></polygon>
                    <path fill="white" d="M37.92,65c-6.07-6.53,3.25-16.26,10-10.1,2.38,2.17,5.84,5.34,8.24,7.49L74.66,39.66C81.1,33,91.27,42.78,84.91,49.48L61.67,77.2a7.13,7.13,0,0,1-9.9.44C47.83,73.89,42.05,68.5,37.92,65Z"></path>
                </svg>
                <div>
                    <h1>Sucesso</h1>
                    <p>Você foi <b>verificado com êxito</b> em ${guildName}!</p>
                </div>
            </div>
            <div class="apresentation">
                <h1>${guildName}</h1>
                <p>Obrigado por se verificar!</p>
                <img src="${image4}">
                <button id="voltarParaServidor">${buttonName}</button>
                <p id="countdownText">Vamos retornar em alguns segundos...</p>
            </div>
        </div>
    </main>
    <script>
        document.getElementById("voltarParaServidor").addEventListener("click", function(event) {
            event.preventDefault();
            window.location.href = "${buttonUrl}";
        });

        document.addEventListener("DOMContentLoaded", function() {
            let seconds = ${seconds};
            const countdownText = document.getElementById("countdownText");

            const countdownInterval = setInterval(() => {
                countdownText.textContent = "Vamos retornar em " + seconds + " segundos...";
                seconds--;
                if (seconds < 0) {
                    clearInterval(countdownInterval);
                    window.location.href = "${buttonUrl}";
                }
            }, 1000);
        });
    </script>
</body>
</html>`);
}

module.exports = { website1 };
