const express = require('express');
const app = express();
const PORT = 3000;
const cors = require('cors');
const postRoutes = require('./routes/postRoutes');
const requestLogger = require('./middleware/requestLogger');

const SERVER_ID = process.env.SERVER_ID;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.use(requestLogger);

app.use((req, res, next) => {
  res.locals.serverId = SERVER_ID;
  next();
});

app.use('/', postRoutes);

app.listen(PORT, () => {
  console.log('\x1b[32m%s\x1b[0m', `✅ ${SERVER_ID} rodando na porta ${PORT}`);
});