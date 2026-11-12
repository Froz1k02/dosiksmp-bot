const http = require('http');
const mineflayer = require('mineflayer');

// Поднимаем легкий веб-сервер, чтобы бесплатный хостинг не усыплял бота
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Досик SMP AC успешно работает!');
}).listen(process.env.PORT || 3000);

function createBot() {
  const bot = mineflayer.createBot({
    host: 'dosiksmp.aternos.me',
    port: 34489,             // Актуальный порт сервера Aternos
    username: 'DosikSMP_AC', // Ник бота на сервере
    version: '1.21.11'       // Версия твоего сервера Purpur
  });

  bot.on('spawn', () => {
    console.log('[Досик SMP AC] Бот успешно зашел на сервер и держит онлайн!');
  });

  // Защита от кика за AFK (каждые 3 минуты слегка поворачивает голову)
  const antiAfk = setInterval(() => {
    const yaw = Math.random() * Math.PI - (Math.PI / 2);
    const pitch = Math.random() * Math.PI - (Math.PI / 2);
    bot.look(yaw, pitch, false);
  }, 180000);

  // Логирование и автопереподключение, если сервер перезагружается
  bot.on('end', (reason) => {
    console.log('[Досик SMP AC] Бот отключился. Причина:', reason);
    clearInterval(antiAfk);
    setTimeout(createBot, 10000); // Попытка входа через 10 секунд
  });

  bot.on('error', (err) => {
    console.log('[Досик SMP AC] Ошибка:', err.message);
  });
}

createBot();