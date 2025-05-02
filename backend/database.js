const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'mysql',
  user: 'root',
  password: 'root',
  database: 'load_balancer',
  waitForConnections: true,
  queueLimit: 0,
  connectionLimit: 100,
});

async function initDatabase() {
  let connected = false;
  let retries = 5;

  while (!connected && retries > 0) {
    try {
      const connection = await pool.getConnection();
      connection.release();

      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS posts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255),
          content TEXT
        )
      `;

      await pool.query(createTableQuery);
      console.log('Banco de dados inicializado com sucesso');
      connected = true;

    } catch (error) {
      retries--;

      if (retries === 0) {
        console.error('Máximo de tentativas excedido. A aplicação continuará, mas as operações de banco podem falhar.');
      } else {
        console.log('Aguardando 5 segundos antes da próxima tentativa...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }
}

initDatabase();

module.exports = pool;