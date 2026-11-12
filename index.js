const http = require('http');
const mineflayer = require('mineflayer');

// Поднимаем легкий веб-сервер для Render, чтобы хост не засыпал
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('DosikSMP_AC uptime service is running.');
}).listen(process.env.PORT || 3000);

const SERVER_CONFIG = {
  host: 'dosiksmp.aternos.me',
  port: 34489,
  username: 'DosikSMP_AC',
  version: '1.21.11',
  skipValidation: true
};

function createBot() {
  console.log('[DosikSMP_AC] Пытаюсь подключиться к серверу...');

  let bot;
  try {
    bot = mineflayer.createBot(SERVER_CONFIG);
  } catch (e) {
    console.log('[DosikSMP_AC] Ошибка инициализации бота:', e.message);
    console.log('[DosikSMP_AC] Следующая попытка через 10 секунд...');
    setTimeout(createBot, 10000);
    return;
  }

  let activeInterval = null;
  let isConnected = false;

  // Защитный таймер: если за 15 секунд бот не смог заспавниться (завис на подключении),
  // мы принудительно гасим сессию и пробуем снова, чтобы он не висел вечно.
  const connectionTimeout = setTimeout(() => {
    if (!isConnected) {
      console.log('[DosikSMP_AC] Соединение зависло (таймаут). Перезапускаю подключение...');
      try { bot.quit(); } catch (err) {}
    }
  }, 15000);

  bot.on('spawn', () => {
    isConnected = true;
    clearTimeout(connectionTimeout);
    console.log('[DosikSMP_AC] УСПЕХ! Бот на сервере и удерживает онлайн.');

    // Активные микродвижения каждые 60 секунд (1 минута)
    if (!activeInterval) {
      activeInterval = setInterval(() => {
        try {
          const yaw = Math.random() * Math.PI - (Math.PI / 2);
          const pitch = Math.random() * 0.4 - 0.2;
          bot.look(yaw, pitch, true, () => {
            bot.setControlState('forward', true);
            setTimeout(() => {
              if (bot && bot.entity) {
                bot.setControlState('forward', false);
              }
            }, 1000);
          });
        } catch (err) {
          console.log('[DosikSMP_AC] Ошибка во время движения:', err.message);
        }
      }, 60000);
    }
  });

  bot.on('kicked', (reason) => {
    console.log('[DosikSMP_AC] Бот кикнут с сервера. Причина:', reason);
  });

  bot.on('end', (reason) => {
    clearTimeout(connectionTimeout);
    console.log('[DosikSMP_AC] Связь потеряна / Сервер закрыт. Причина:', reason);
    if (activeInterval) clearInterval(activeInterval);
    
    console.log('[DosikSMP_AC] Автопереподключение через 10 секунд...');
    setTimeout(createBot, 10000);
  });

  bot.on('error', (err) => {
    console.log('[DosikSMP_AC] Ошибка сети:', err.code || err.message);
  });
}

// Запускаем процесс
createBot();