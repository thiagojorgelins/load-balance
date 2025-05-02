const db = require('../database');
const redisClient = require('../redisClient');

exports.getAllPosts = async (req, res) => {
  try {
    const limit = 50;
    const page = parseInt(req.query.page, 10) || 1;

    if (page < 1) {
      return res.status(400).json({
        serverId: res.locals.serverId,
        error: 'Parâmetro "page" deve ser maior que 0'
      });
    }

    const offset = (page - 1) * limit;
    const cacheKey = `posts:page:${page}`;

    let totalPosts = await redisClient.get('posts:count');
    totalPosts = parseInt(totalPosts, 10);

    if (isNaN(totalPosts)) {
      const [[{ count }]] = await db.query('SELECT COUNT(*) AS count FROM posts');
      totalPosts = count;
      await redisClient.set('posts:count', totalPosts);
    }

    const totalPages = Math.ceil(totalPosts / limit);

    if (page === 1) {
      const cachedPosts = await redisClient.get(cacheKey);
      if (cachedPosts) {
        return res.json({
          serverId: res.locals.serverId,
          posts: JSON.parse(cachedPosts),
          page,
          limit,
          totalPosts,
          totalPages,
          cache: true
        });
      }
    }

    const [rows] = await db.query(
      'SELECT * FROM posts ORDER BY id DESC LIMIT ? OFFSET ?',
      [limit, offset]
    );

    if (page === 1) {
      await redisClient.set(cacheKey, JSON.stringify(rows), { EX: 30 });
    }

    res.json({
      serverId: res.locals.serverId,
      posts: rows,
      page,
      limit,
      totalPosts,
      totalPages,
      cache: false
    });

  } catch (error) {
    console.error('Erro ao buscar posts:', error);
    res.status(500).json({
      serverId: res.locals.serverId,
      error: 'Erro ao buscar posts'
    });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { title, content } = req.body;

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

    await redisClient.del('posts:page:1');
    await redisClient.incr('posts:count');

    res.status(201).json({
      serverId: res.locals.serverId,
      post: {
        id: result.insertId,
        title,
        content
      }
    });

  } catch (error) {
    console.error('Erro ao criar post:', error);
    res.status(500).json({
      serverId: res.locals.serverId,
      error: 'Erro ao criar post'
    });
  }
};