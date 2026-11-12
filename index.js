
const http = require('http');
const mineflayer = require('mineflayer');

// HTTP-сервер для UptimeRobot и Render
const PORT = process.env.PORT || 3000;

http.createServer((req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8'
    });
    res.end('DosikSMP_AC uptime service is running.');
}).listen(PORT, '0.0.0.0', () => {
    console.log('[WEB] Uptime service запущен!');
});

// Настройки Minecraft-сервера Aternos
const SERVER_CONFIG = {
    host: 'dosiksmp.aternos.me',
    port: 34489,
    username: 'DosikSMP_AC',
    version: false
};

let reconnecting = false;
let currentBot = null;
let reconnectTimer = null;

function reconnect() {
    if (reconnecting) return;

    reconnecting = true;

    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
    }

    console.log('[RECONNECT] Повтор через 15 секунд...');

    reconnectTimer = setTimeout(() => {
        reconnecting = false;
        createBot();
    }, 15000);
}

function createBot() {
    if (currentBot) {
        try {
            currentBot.removeAllListeners();
            currentBot.quit();
        } catch (err) {}
        currentBot = null;
    }

    console.log('[DosikSMP_AC] Подключение к Aternos...');

    let bot;

    try {
        bot = mineflayer.createBot(SERVER_CONFIG);
        currentBot = bot;
    } catch (err) {
        console.log('[INIT ERROR]', err.message);
        reconnect();
        return;
    }

    let spawned = false;
    let timeout = null;

    timeout = setTimeout(() => {
        if (!spawned) {
            console.log('[TIMEOUT] Нет Spawn за 60 секунд.');

            try {
                bot.quit();
            } catch (err) {}

            reconnect();
        }
    }, 60000);

    bot.on('connect', () => {
        console.log('[NETWORK] TCP-подключение установлено.');
    });

    bot.on('login', () => {
        console.log('[LOGIN] Авторизация началась.');
    });

    bot.on('spawn', () => {
        spawned = true;
        clearTimeout(timeout);

        console.log('[SPAWN] Бот успешно вошёл на сервер!');

        // Периодический поворот головы
        setInterval(() => {
            if (!bot.entity || currentBot !== bot) return;

            const yaw = Math.random() * Math.PI * 2;
            const pitch = Math.random() * 0.2 - 0.1;

            bot.look(yaw, pitch, true).catch(err => {
                console.log('[LOOK ERROR]', err.message);
            });
        }, 60000);
    });

    bot.on('kicked', (reason) => {
        console.log('[KICKED]', reason);
    });

    bot.on('error', (err) => {
        console.log('[ERROR]', err.code || err.message);
    });

    bot.on('end', (reason) => {
        clearTimeout(timeout);

        console.log('[END] Соединение закрыто:', reason);

        if (currentBot === bot) {
            currentBot = null;
        }

        reconnect();
    });
}

createBot();
