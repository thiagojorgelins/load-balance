function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, url, ip, headers } = req;
  const serverId = process.env.SERVER_ID

  console.log(`\n[${serverId}] ⬅️ Nova requisição recebida: ${method} ${url}`);
  console.log(`[${serverId}] 📝 Timestamp: ${new Date().toISOString()}`);
  console.log(`[${serverId}] 🖥️ IP do cliente: ${ip}`);
  console.log(`[${serverId}] 🔄 User-Agent: ${headers['user-agent']}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;

    let statusColor = '\x1b[32m';
    if (statusCode >= 400 && statusCode < 500) {
      statusColor = '\x1b[33m';
    } else if (statusCode >= 500) {
      statusColor = '\x1b[31m';
    }

    console.log(`[${serverId}] ➡️ Resposta: ${statusColor}${statusCode}\x1b[0m em ${duration}ms`);
    console.log(`[${serverId}] 📊 Memória utilizada: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
    console.log(`[${serverId}] ----------------------------------------`);
  });

  next();
}

module.exports = requestLogger;