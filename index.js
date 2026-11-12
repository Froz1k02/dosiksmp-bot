const http = require('http');
const mineflayer = require('mineflayer');
const dns = require('dns');

// Поднимаем легкий веб-сервер для Render, чтобы облако не усыпляло бота
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('DosikSMP_AC uptime service is running.');
}).listen(process.env.PORT || 3000);

const SERVER_CONFIG = {
  host: 'dosiksmp.aternos.me',
  port: 34489,             // Порт Aternos (меняй, если он изменился при перезапуске сервера)
  username: 'DosikSMP_AC',
  version: '1.21.11'
};

// Функция проверки доступности хоста перед входом
function checkServerOnline(callback) {
  dns.lookup(SERVER_CONFIG.host, (err) => {
    if (err) {
      callback(false); // Хост недоступен
    } else {
      callback(true);  // Хост в сети
    }
  });
}

function createBot() {
  console.log('[DosikSMP_AC] Проверка статуса сервера Aternos...');

  checkServerOnline((isOnline) => {
    if (!isOnline) {
      console.log('[DosikSMP_AC] Сервер выключен. Повторная проверка через 30 секунд...');
      setTimeout(createBot, 30000); // Тихо ждем 30 секунд и проверяем снова
      return;
    }

    console.log('[DosikSMP_AC] Сервер доступен. Подключаюсь...');
    const bot = mineflayer.createBot(SERVER_CONFIG);

    let activeInterval = null;

    bot.on('spawn', () => {
      console.log('[DosikSMP_AC] Бот успешно зашел на сервер и держит онлайн!');

      // Каждую 1 минуту (60000 мс) бот делает активный «рывок» и движение
      if (!activeInterval) {
        activeInterval = setInterval(() => {
          // 1. Поворачиваем голову на случайный угол
          const yaw = Math.random() * Math.PI - (Math.PI / 2);
          const pitch = Math.random() * 0.4 - 0.2;
          bot.look(yaw, pitch, true, () => {
            
            // 2. Сразу после поворота делаем короткий шаг вперёд (рывок) на 1 секунду
            bot.setControlState('forward', true);
            setTimeout(() => {
              bot.setControlState('forward', false);
            }, 1000); // идет вперед 1 секунду

          });
        }, 60000); // Интервал: ровно 1 минута
      }
    });

    // Безопасное переподключение при разрыве связи
    bot.on('end', (reason) => {
      console.log('[DosikSMP_AC] Соединение разорвано. Причина:', reason);
      if (activeInterval) clearInterval(activeInterval);
      console.log('[DosikSMP_AC] Переподключение через 15 секунд...');
      setTimeout(createBot, 15000);
    });

    // Обработка ошибок сети, чтобы бот не «падал»
    bot.on('error', (err) => {
      console.log('[DosikSMP_AC] Ошибка соединения:', err.message);
    });
  });
}

createBot();