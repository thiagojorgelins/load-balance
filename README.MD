# Sistema de Blog com Load Balancer

## 1. Tecnologias Utilizadas

Este projeto implementa um sistema simples de blog com frontend e backend distribuído, utilizando as seguintes tecnologias:

### Frontend
- ![HTML5](https://img.shields.io/badge/-HTML5-E34F26?logo=html5&logoColor=white&style=flat) ![CSS3](https://img.shields.io/badge/-CSS3-1572B6?logo=css3&logoColor=white&style=flat) ![JavaScript](https://img.shields.io/badge/-JavaScript-F7DF1E?logo=javascript&logoColor=black&style=flat) (Interface de usuário)
- ![Nginx](https://img.shields.io/badge/-NGINX-009639?logo=nginx&logoColor=white&style=flat) (Servidor web e load balancer)

### Backend
- ![Node.js](https://img.shields.io/badge/-Node.js-339933?logo=node.js&logoColor=white&style=flat) com ![Express](https://img.shields.io/badge/-Express-000000?logo=express&logoColor=white&style=flat)
- ![MySQL](https://img.shields.io/badge/-MySQL-4479A1?logo=mysql&logoColor=white&style=flat) (Banco de dados relacional)
- ![Docker](https://img.shields.io/badge/-Docker-2496ED?logo=docker&logoColor=white&style=flat) e ![Docker Compose](https://img.shields.io/badge/-Docker%20Compose-2496ED?logo=docker&logoColor=white&style=flat) (Conteinerização e orquestração)

## 2. Arquitetura da Solução

![Arquitetura da Solução](/arquitetura.png)

A arquitetura implementada segue um modelo de escalabilidade horizontal com os seguintes componentes:

1. **Cliente Web**: Acessa a aplicação através do navegador.

2. **Nginx (Load Balancer)**: Atua como ponto de entrada único, recebendo todas as requisições e distribuindo-as entre as instâncias de backend.

3. **Servidores Backend**: Três instâncias idênticas do serviço de API, cada uma com diferentes limites de recursos:
   - Server 1: 256MB de memória (peso 1 no balanceamento)
   - Server 2: 384MB de memória (peso 2 no balanceamento)
   - Server 3: 512MB de memória (peso 3 no balanceamento)

4. **Banco de Dados MySQL**: Compartilhado entre todas as instâncias, armazenando os dados da aplicação.

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
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

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
- `X-Real-IP`: Preserva o IP do cliente para logging e análise
- `X-Forwarded-For`: Mantém a cadeia de IPs para rastreabilidade em ambientes multi-proxy
- `Host`: Preserva o hostname original da requisição

### Identificação de Sessões
A solução implementa rastreabilidade de requisições por meio da injeção do identificador do servidor (`SERVER_ID`) em:
1. Headers de resposta HTTP
2. Corpo da resposta JSON
3. Logs de sistema com timestamp e métricas de performance

### Monitoramento em Tempo Real
O middleware de logging instrumenta cada requisição com métricas de performance:

```javascript
function requestLogger(req, res, next) {
  const start = Date.now();
  // Logging da requisição
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Logging da resposta com métricas
    console.log(`Resposta: ${statusCode} em ${duration}ms`);
    console.log(`Memória utilizada: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`);
  });
  next();
}
```

## 4. Como Expandir a Escalabilidade no Futuro

A solução atual poderia ser expandida de várias formas:

1. **Auto-scaling**: Implementar um sistema que monitore a carga atual e crie/destrua instâncias conforme necessário.
2. **Health checks**: Adicionar verificações de saúde para remover automaticamente servidores problemáticos do pool.
3. **Caching distribuído**: Adicionar um sistema como Redis para cache compartilhado entre instâncias.
4. **CDN**: Implementar uma Content Delivery Network para conteúdos estáticos.
5. **Geolocalização**: Distribuir servidores por região e direcionar usuários ao servidor mais próximo.
6. **Replicação de banco de dados**: Implementar leitura/escrita separadas com múltiplas réplicas de leitura.

## 5. Como Executar o Projeto

### Pré-requisitos
- Docker e Docker Compose instalados

### Passos para execução
1. Clone o repositório
2. Navegue até a pasta raiz do projeto
3. Execute o comando:
   ```
   docker-compose up --build
   ```
4. Acesse a aplicação em seu navegador:
   ```
   http://localhost
   ```

### Endpoints disponíveis
- **GET /api/posts**: Retorna todos os posts
- **POST /api/posts**: Cria um novo post
