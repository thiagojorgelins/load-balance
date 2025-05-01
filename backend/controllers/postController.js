const db = require('../database');

exports.getAllPosts = async (req, res) => {
  try {
    console.log(`\x1b[33m[${res.locals.serverId}] Solicitação de todos os posts\x1b[0m`);

    const [rows] = await db.query('SELECT * FROM posts');

    console.log(`\x1b[32m[${res.locals.serverId}] Retornando ${rows.length} posts\x1b[0m`);

    res.json({
      serverId: res.locals.serverId,
      posts: rows
    });
  } catch (error) {
    console.error(`\x1b[31m[${res.locals.serverId}] Erro ao buscar posts:\x1b[0m`, error);
    res.status(500).json({
      serverId: res.locals.serverId,
      error: 'Erro ao buscar posts'
    });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { title, content } = req.body;

    console.log(`\x1b[33m[${res.locals.serverId}] Criando novo post: "${title}"\x1b[0m`);

    if (!title || !content) {
      return res.status(400).json({
        serverId: res.locals.serverId,
        error: 'Título e conteúdo são obrigatórios'
      });
    }

    const [result] = await db.query(
      'INSERT INTO posts (title, content) VALUES (?, ?)',
      [title, content]
    );

    console.log(`\x1b[32m[${res.locals.serverId}] Post criado com ID: ${result.insertId}\x1b[0m`);

    res.status(201).json({
      serverId: res.locals.serverId,
      post: {
        id: result.insertId,
        title,
        content
      }
    });
  } catch (error) {
    console.error(`\x1b[31m[${res.locals.serverId}] Erro ao criar post:\x1b[0m`, error);
    res.status(500).json({
      serverId: res.locals.serverId,
      error: 'Erro ao criar post'
    });
  }
};