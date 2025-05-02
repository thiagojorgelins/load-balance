import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 1000 },
    { duration: '30s', target: 3000 },
    { duration: '30s', target: 5000 },
  ],
};

export default function () {
  const randomPage = Math.floor(Math.random() * 10) + 1;
  const baseUrl = `http://localhost/api/posts?page=${randomPage}`;

  if (Math.random() < 0.5) {
    const res = http.get(baseUrl);
    check(res, {
      'GET status 200': (r) => r.status === 200,
    });
  } else {
    const payload = JSON.stringify({
      title: 'Título aleatório ' + Math.floor(Math.random() * 10000),
      content: 'Conteúdo gerado automaticamente pelo K6.',
    });

    const params = {
      headers: { 'Content-Type': 'application/json' },
    };

    const res = http.post('http://localhost/api/posts', payload, params);
    check(res, {
      'POST status 201': (r) => r.status === 201,
    });
  }

  sleep(1);
}