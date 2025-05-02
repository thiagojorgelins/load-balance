# Sistema de Blog com Load Balancer

## 1. Tecnologias Utilizadas

Este projeto implementa um sistema simples de blog com frontend e backend distribuído, utilizando as seguintes tecnologias:

### Frontend

- ![HTML5](https://img.shields.io/badge/-HTML5-E34F26?logo=html5&logoColor=white&style=flat) ![CSS3](https://img.shields.io/badge/-CSS3-1572B6?logo=css3&logoColor=white&style=flat) ![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?logo=javascript&logoColor=black&style=flat) (Interface de usuário)
- ![Nginx](https://img.shields.io/badge/-NGINX-009639?logo=nginx&logoColor=white&style=flat) (Servidor web)

### Backend

- ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white&style=flat) com ![Express](https://img.shields.io/badge/-Express-000000?logo=express&logoColor=white&style=flat)
- ![MySQL](https://img.shields.io/badge/-MySQL-4479A1?logo=mysql&logoColor=white&style=flat) (Banco de dados relacional)
- ![Docker](https://img.shields.io/badge/-Docker-2496ED?logo=docker&logoColor=white&style=flat) e ![Docker Compose](https://img.shields.io/badge/-Docker%20Compose-2496ED?logo=docker&logoColor=white&style=flat) (Conteinerização e orquestração)
- ![Redis](https://img.shields.io/badge/-Redis-DC382D?logo=redis&logoColor=white&style=flat) (Cache distribuído)
- ![Prometheus](https://img.shields.io/badge/-Prometheus-E6522C?logo=prometheus&logoColor=white&style=flat) e ![Grafana](https://img.shields.io/badge/-Grafana-F46800?logo=grafana&logoColor=white&style=flat) (Monitoramento)
- ![Nginx](https://img.shields.io/badge/-NGINX-009639?logo=nginx&logoColor=white&style=flat) (Load balancer)

## 2. Arquitetura da Solução

![Arquitetura da Solução](/arquitetura.png)

A arquitetura implementada segue um modelo de escalabilidade horizontal com os seguintes componentes:

1. **Cliente Web**: Acessa a aplicação através do navegador.

2. **Nginx (Load Balancer)**: Atua como ponto de entrada único, recebendo todas as requisições e distribuindo-as entre as instâncias de backend.

3. **Servidores Backend**: Três instâncias idênticas do serviço de API, cada uma com diferentes limites de recursos:

   - Server 1: 256MB de memória e no máximo 50% de uso de um CPU(peso 1 no balanceamento)
   - Server 2: 384MB de memória e no máximo 75% de uso de um CPU(peso 2 no balanceamento)
   - Server 3: 512MB de memória e no máximo 100% de uso de um CPU(peso 3 no balanceamento)

4. **Banco de Dados MySQL**: Compartilhado entre todas as instâncias, armazenando os dados da aplicação.

5. **Redis**: Implementado como cache distribuído para melhorar o desempenho e reduzir a carga no banco de dados.

6. **Prometheus e Grafana**: Sistema de monitoramento para coleta de métricas e visualização do desempenho dos servidores.

Cada instância do backend possui um identificador único (SERVER_ID) que é incluído nas respostas HTTP, permitindo visualizar qual servidor processou cada requisição.

## 3. Configuração do Load Balancing

O load balancing foi implementado utilizando o Nginx como reverse proxy, com a seguinte configuração:

```nginx
upstream backend_servers {
    server backend_server1:3000 weight=1;
    server backend_server2:3000 weight=2;
    server backend_server3:3000 weight=3;
}

server {
    listen 80;
    server_name localhost;

    location /api/ {
        proxy_pass http://backend_servers/;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;

        proxy_connect_timeout 10s;
        proxy_send_timeout 10s;
        proxy_read_timeout 20s;
    }
}
```

### Otimizações de Performance no Nginx

A configuração do Nginx inclui diversas otimizações:

- **Connection Pooling**: Mantém até 64 conexões persistentes com os servidores backend
- **Timeouts Configurados**: Define limites de tempo para conexão (10s), envio (10s) e leitura (20s)
- **Buffers Otimizados**: Configuração de buffers para melhorar a eficiência da transferência de dados
- **Worker Connections**: Suporte para até 65535 conexões simultâneas por worker
- **Event Processing**: Uso de `epoll` para processamento eficiente de eventos em sistemas Linux

### Algoritmo de Balanceamento

A implementação utiliza o algoritmo **weighted round-robin**, que funciona da seguinte forma:

1. Cada servidor no upstream recebe um peso proporcional à sua capacidade de processamento
2. As requisições são distribuídas sequencialmente entre os servidores
3. A frequência com que cada servidor recebe requisições é proporcional ao seu peso
4. O balanceador mantém contadores internos para garantir a distribuição conforme os pesos

### Distribuição Ponderada

- **Server 1 (256MB)**: Recebe 1/6 das requisições (16.7%)
- **Server 2 (384MB)**: Recebe 2/6 das requisições (33.3%)
- **Server 3 (512MB)**: Recebe 3/6 das requisições (50%)

### Headers HTTP e Proxy

O NGINX configura headers especiais para preservar informações do cliente original:

- X-Real-IP: Preserva o IP do cliente para logging e análise
- X-Forwarded-For: Mantém a cadeia de IPs para rastreabilidade em ambientes multi-proxy
- Host: Preserva o hostname original da requisição

### Identificação de Sessões

A solução implementa rastreabilidade de requisições por meio da injeção do identificador do servidor (SERVER_ID) em:

1. Headers de resposta HTTP
2. Corpo da resposta JSON
3. Logs de sistema com timestamp e métricas de performance

### Monitoramento em Tempo Real

O middleware de logging exibido no console à cada requisição:

```javascript
function requestLogger(req, res, next) {
  const start = Date.now();
  // Logging da requisição
  res.on("finish", () => {
    const duration = Date.now() - start;
    // Logging da resposta com métricas
    console.log(`Resposta: ${statusCode} em ${duration}ms`);
    console.log(
      `Memória utilizada: ${Math.round(
        process.memoryUsage().heapUsed / 1024 / 1024
      )}MB`
    );
  });
  next();
}
```

### Sistema de Caching com Redis

A implementação inclui um sistema de cache distribuído com Redis para:

- Reduzir a carga no banco de dados MySQL
- Melhorar o tempo de resposta para requisições frequentes
- Invalidação automática de cache em operações de escrita
- Cache segmentado por página para suportar paginação eficiente
- TTL (Time-To-Live) de 30 segundos para manter dados atualizados

### Métricas com Prometheus

Cada servidor backend expõe métricas via endpoint `/metrics` para coleta pelo Prometheus:

- Contagem de requisições por método HTTP
- Contagem de requisições por rota
- Identificação do servidor que processou cada requisição
- Tempo de resposta e uso de memória

## 4. Testes de Carga

O projeto inclui um script de teste de carga usando K6 para simular tráfego intenso:

```javascript
export const options = {
  stages: [
    { duration: "30s", target: 1000 },
    { duration: "30s", target: 3000 },
    { duration: "30s", target: 5000 },
  ],
};
```

O teste escalona gradualmente o número de usuários virtuais:

- 0 a 1.000 VUs em 30 segundos
- 1.000 a 3.000 VUs em 30 segundos
- 3.000 a 5.000 VUs em 30 segundos

### Resultados dos Testes

Os testes de carga mostraram:

- Taxa de sucesso de 96.66% sob carga extrema
- Tempo médio de resposta de 414.34ms
- Pico de 4.984 usuários virtuais simultâneos
- Total de 140.492 requisições processadas em 95 segundos
- Taxa de transferência de 4.2 MB/s

![Resultados Teste](/teste-carga.png)

## 5. Como Expandir a Escalabilidade no Futuro

A solução atual poderia ser expandida de várias formas:

1. **Auto-scaling**: Implementar um sistema que monitore a carga atual e crie/destrua instâncias de backend automaticamente, utilizando Docker Swarm ou Kubernetes.
2. **Health checks avançados**: Melhorar as verificações de saúde para detecção proativa de problemas e recuperação automática de falhas.
3. **Expansão do caching**: Implementar caching em múltiplos níveis, incluindo caching de fragmentos de página e objetos de domínio.
4. **CDN**: Implementar uma Content Delivery Network para conteúdos estáticos, melhorando o desempenho global.
5. **Geolocalização**: Distribuir servidores por região geográfica e direcionar usuários ao servidor mais próximo através de DNS inteligente.
6. **Replicação de banco de dados**: Implementar um sistema de primary-replica com múltiplas réplicas de leitura e sharding para escala horizontal.
7. **Filas de processamento**: Implementar sistemas de filas como RabbitMQ ou Kafka para processamento assíncrono de operações pesadas.

## 6. Como Executar o Projeto

### Pré-requisitos

- Docker e Docker Compose instalados

### Passos para execução

1. Clone o repositório
2. Navegue até a pasta raiz do projeto
3. Execute o comando:

```bash
docker-compose up -d
```

4. Acesse a aplicação em seu navegador:

```
http://localhost
```

5. Para acessar o dashboard de monitoramento:

```
http://localhost:3000 (Grafana)
http://localhost:9090 (Prometheus)
```

### Endpoints disponíveis

- **GET `/api/posts`**
  Retorna uma lista paginada de posts.
  Suporta o parâmetro de consulta `page` (opcional, padrão = 1).
  Exemplo:

  ```
  GET http://localhost/api/posts?page=2
  ```

- **POST `/api/posts`**
  Cria um novo post. Requer os campos `title` e `content` no corpo da requisição JSON.
  Exemplo:

  ```
  POST http://localhost/api/posts
  Content-Type: application/json

  {
    "title": "Meu primeiro post",
    "content": "Este é o conteúdo do post."
  }
  ```

### Executando testes de carga

Para executar os testes de carga, instale o K6 e execute:

[Instalar K6](https://grafana.com/docs/k6/latest/set-up/install-k6/)

```bash
k6 run k6-test.js
```
