
const http = require('http');
const mineflayer = require('mineflayer');

const PORT = process.env.PORT || 3000;

const CONFIG = {
  host: 'dosiksmp.aternos.me',
  port: 34489,
  username: 'DosikSMP',
  version: false
};

let bot = null;
let connected = false;
let reconnectTimer = null;
let connectionTimer = null;
let movementTimer = null;
let reconnecting = false;

// Render Web Server
http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8'
  });

  res.end(JSON.stringify({
    service: 'DosikSMP_AC',
    status: 'online',
    minecraft: connected ? 'connected' : 'disconnected'
  }));
}).listen(PORT, '0.0.0.0', () => {
  console.log('[WEB] Uptime service запущен!');
});

// Подключение бота
function createBot() {
  if (reconnecting) return;

  reconnecting = true;
  connected = false;

  console.log('[DosikSMP_AC] Подключение к Aternos...');

  try {
    bot = mineflayer.createBot(CONFIG);
  } catch (err) {
    console.log('[ERROR]', err.message);
    reconnect();
    return;
  }

  bot.on('connect', () => {
    console.log('[NETWORK] TCP подключение установлено!');
  });

  bot.on('login', () => {
    console.log('[LOGIN] Авторизация Minecraft пройдена!');
  });

  bot.on('spawn', () => {
    connected = true;
    reconnecting = false;

    clearTimeout(connectionTimer);

    console.log('[SUCCESS] Бот появился в мире!');

    startMovement();
  });

  connectionTimer = setTimeout(() => {
    if (!connected && bot) {
      console.log('[TIMEOUT] Нет Spawn за 60 секунд.');
      try {
        bot.quit();
      } catch (err) {
        reconnect();
      }
    }
  }, 60000);

  bot.on('kicked', (reason) => {
    console.log('[KICKED]', reason);
  });

  bot.on('error', (err) => {
    console.log('[NETWORK ERROR]', err.code || err.message);
  });

  bot.on('end', (reason) => {
    console.log('[DISCONNECTED]', reason || 'Соединение закрыто');

    connected = false;
    reconnecting = false;

    clearTimeout(connectionTimer);
    stopMovement();

    reconnect();
  });
}

// Автопереподключение
function reconnect() {
  if (reconnectTimer) return;

  connected = false;
  reconnecting = false;

  stopMovement();

  console.log('[RECONNECT] Повтор через 15 секунд...');

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    createBot();
  }, 15000);
}

// Повороты головы
function startMovement() {
  stopMovement();

  movementTimer = setInterval(() => {
    if (!bot || !connected || !bot.entity) return;

    try {
      const yaw = Math.random() * Math.PI * 2;
      const pitch = (Math.random() - 0.5) * 0.3;

      bot.look(yaw, pitch, true);

      console.log('[MOVEMENT] Поворот выполнен.');
    } catch (err) {
      console.log('[MOVEMENT ERROR]', err.message);
    }
  }, 30000);
}

// Остановка движений
function stopMovement() {
  if (movementTimer) {
    clearInterval(movementTimer);
    movementTimer = null;
  }
}

// Запуск
createBot();
