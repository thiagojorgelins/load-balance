const express = require('express');
const app = express();
const PORT = 3000;
const cors = require('cors');
const postRoutes = require('./routes/postRoutes');
const requestLogger = require('./middleware/requestLogger');
const client = require('prom-client');
const register = new client.Registry();

const httpRequestCounter = new client.Counter({
  name: 'http_requests_total',
  help: 'Contador total de requisições HTTP',
  labelNames: ['method', 'route', 'serverId']
});

register.registerMetric(httpRequestCounter);
register.setDefaultLabels({ app: 'load_balancer_demo' });
client.collectDefaultMetrics({ register });

app.use((req, res, next) => {
  httpRequestCounter.inc({
    method: req.method,
    route: req.path,
    serverId: SERVER_ID
  });
  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

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