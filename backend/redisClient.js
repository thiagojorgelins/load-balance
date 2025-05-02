const redis = require('redis');

const client = redis.createClient({
  url: 'redis://redis:6379'
});

client.on('error', (err) => {
  console.error('Erro no Redis:', err);
});

client.connect();

module.exports = client;
