const { } = require("discord.js");
const { dbC } = require("../databases/index");
const { token } = require("../config.json");
const axios = require("axios");

async function website1(res, guild_id) {

    const guildResponse = await axios.get(`https://discord.com/api/v9/guilds/${guild_id}`, {
        headers: {
            'Authorization': `Bot ${token}`
        }
    }).catch(err => {
        console.error(err);
    });

    const guildName = guildResponse.data.name || "SkyAppsOAuth2";
    const guildId = guildResponse.data.id;
    const iconId = guildResponse.data.icon;

    const iconExtension = iconId.startsWith('a_') ? 'gif' : 'png';

    const image1 = 'https://i.ibb.co/0q1ybhK/discord-logo-2.webp';
    const image2 = 'https://i.ibb.co/5GD21DF/discord-logo-1-1.webp';
    const image3 = await dbC.get("webSite.bannerUrl") || 'https://i.ibb.co/VjWH1kV/9f58ba77d85faa95ec9da272efafc35d.webp';
    const image4 = await dbC.get("webSite.iconUrl") || `https://cdn.discordapp.com/icons/${guildId}/${iconId}.${iconExtension}`;

    const buttonName = await dbC.get("webSite.butName") || "Voltar para o servidor";
    const buttonUrl = await dbC.get("webSite.urlButton") || "https://discord.com/";

    const seconds = await dbC.get("webSite.seconds") || 10;

    res.send(`<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script type="531968ec3807477fc4fa30fd-module" src="js/ionicons.esm.js"></script>
    <script nomodule="" src="js/ionicons.js" type="531968ec3807477fc4fa30fd-text/javascript"></script>
    <title>${guildName} - OAuth2</title>
    <link rel="shortcut icon" href="${image1}" type="image/x-icon">
    <style>
        @import url("https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap");
        @import url("https://fonts.googleapis.com/css2?family=Open+Sans&family=Poppins:wght@500;600;700&display=swap");

        body {
            font-family: Montserrat;
            margin: 0;
            width: 100vw;
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: url(${image3});
            background-repeat: no-repeat;
            background-size: cover;
            background-position-x: center;
            background-color: #000011;
        }

        main {
            width: 100vw;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            backdrop-filter: blur(8px);
        }

        .discord-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #5865f2;
            color: #fff;
            border: none;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            animation: pulse 1.5s infinite alternate, swing 1s infinite alternate;
            transition: transform 0.3s;
        }

        .discord-button:hover {
            transform: scale(1.2);
        }

        .discord-button img {
            width: 80%;
            height: auto;
        }

        .content {
            min-width: 30vw;
            max-width: 30vw;
            background-color: #00000099;
            backdrop-filter: blur(24px);
            padding: 2rem;
            border-radius: 10px;
        }

        .verified-text {
            background-color: #10a64a90;
            padding: 1rem;
            display: flex;
            gap: 1rem;
            border-radius: 10px;
            border: 2px solid #1eff0090;
            width: calc(100% - 2rem);
            /* Correção aqui */
            font-size: 90%;
        }

        .verified-text * {
            margin: 0;
        }

        .verified-text>div {
            display: flex;
            flex-direction: column;
        }

        .verified-text>svg {
            width: 50px;
        }

        .apresentation {
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
        }

        .apresentation>h1 {
            margin-bottom: 0;
        }

        .apresentation>p {
            font-size: 150%;
        }

        .apresentation>img {
            width: 15rem;
            border-radius: 9999px;
            margin-bottom: 20px;
            border-color: white;
            border-spacing: 10px;
        }

        .apresentation>button {
            all: unset;
            width: 100%;
            padding-block: 10px;
            cursor: pointer;
            font-weight: 600;
            font-size: 110%;
            border: 2px solid white;
            border-radius: 20px;
            opacity: 60%;
            transition-duration: 200ms;
        }

        .apresentation>button:hover {
            opacity: 100%;
        }

        @media screen and (max-width: 720px) {
            .content {
                max-width: 90vw;
                min-width: 90vw;
                font-size: 80%;
                padding: 1rem;
            }

            .verified-text {
                font-size: 80%;
                padding: .7rem;
                gap: .7rem;
            }

            .verified-text>svg {
                width: 30px;
            }

            .apresentation>img {
                width: 10rem;
                border: white;
            }

            .apresentation>button {
                padding-block: 15px;
                font-size: 120%;
            }
        }
    </style>
</head>

<body>
    <main>
        <a href="${buttonUrl}" class="discord-button">
            <img src="${image2}" alt="Discord">
        </a>
        <div class="content">
            <div class="verified-text">
                <svg id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 116.87">
                    <polygon fill="#028dff" fill-rule="evenodd"
                        points="61.37 8.24 80.43 0 90.88 17.79 111.15 22.32 109.15 42.85 122.88 58.43 109.2 73.87 111.15 94.55 91 99 80.43 116.87 61.51 108.62 42.45 116.87 32 99.08 11.73 94.55 13.73 74.01 0 58.43 13.68 42.99 11.73 22.32 31.88 17.87 42.45 0 61.37 8.24 61.37 8.24">
                    </polygon>
                    <path class="cls-2" fill="white"
                        d="M37.92,65c-6.07-6.53,3.25-16.26,10-10.1,2.38,2.17,5.84,5.34,8.24,7.49L74.66,39.66C81.1,33,91.27,42.78,84.91,49.48L61.67,77.2a7.13,7.13,0,0,1-9.9.44C47.83,73.89,42.05,68.5,37.92,65Z">
                    </path>
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
    <script type="text/javascript">

        document.getElementById("voltarParaServidor").addEventListener("click", function (event) {
            event.preventDefault();
            const novaURL = "${buttonUrl}";
            window.location.href = novaURL;
        });

    document.addEventListener("DOMContentLoaded", function () {
    let seconds = ${seconds};
    const countdownText = document.getElementById("countdownText");
    const redirectButton = document.getElementById("voltarParaServidor");

    function updateCountdown() {
    countdownText.textContent = "Vamos retornar em alguns segundos...";
    seconds--;
    if (seconds < 0) { clearInterval(countdownInterval); redirect(); } } const
        countdownInterval=setInterval(updateCountdown, 1000); function redirect() { const
        redirectURL="${buttonUrl}";
        window.location.href=redirectURL; } }); </script>

        <script src="js/rocket-loader.min.js" data-cf-settings="7b8a680b29490b964c1db83d-|49" defer=""
            type="531968ec3807477fc4fa30fd-text/javascript"></script>
        <script type="531968ec3807477fc4fa30fd-text/javascript">
        (function () { if (!document.body) return; var js = "window['__CF$cv$params']={r:'86797a0148fb002b',t:'MTcxMDk3NzI4Ni44NDIwMDA='};_cpo=document.createElement('script');_cpo.nonce='',_cpo.src='/cdn-cgi/challenge-platform/scripts/jsd/main.js',document.getElementsByTagName('head')[0].appendChild(_cpo);"; var _0xh = document.createElement('iframe'); _0xh.height = 1; _0xh.width = 1; _0xh.style.position = 'absolute'; _0xh.style.top = 0; _0xh.style.left = 0; _0xh.style.border = 'none'; _0xh.style.visibility = 'hidden'; document.body.appendChild(_0xh); function handler() { var _0xi = _0xh.contentDocument || _0xh.contentWindow.document; if (_0xi) { var _0xj = _0xi.createElement('script'); _0xj.innerHTML = js; _0xi.getElementsByTagName('head')[0].appendChild(_0xj); } } if (document.readyState !== 'loading') { handler(); } else if (window.addEventListener) { document.addEventListener('DOMContentLoaded', handler); } else { var prev = document.onreadystatechange || function () { }; document.onreadystatechange = function (e) { prev(e); if (document.readyState !== 'loading') { document.onreadystatechange = prev; handler(); } }; } })();
    </script>
        <script defer=""
            src="https://static.cloudflareinsights.com/beacon.min.js/v84a3a4012de94ce1a686ba8c167c359c1696973893317"
            data-cf-beacon="{\"
            rayid\":\"86797a0148fb002b\",\"b\":1,\"version\":\"2024.3.0\",\"token\":\"d141d4a970ea4f71959e0c44b59b0257\"}"
            crossorigin="anonymous" type="531968ec3807477fc4fa30fd-text/javascript"></script>
        <script src="js/rocket-loader.min.js" data-cf-settings="531968ec3807477fc4fa30fd-|49" defer=""></script>

</body>

</html>`);
};

module.exports = {
    website1
}
