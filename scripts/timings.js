import http from 'k6/http';

export const options = {
  vus: 1,
  iterations: 1,
  cloud: {
    projectID: 5717974,
    name: 'Test (19/11/2025-13:10:41)'
  }
};

export default function () {
  const res = http.get('https://serverest.dev/carrinhos');

  console.log(`
    Tempo total: ${res.timings.duration} ms
    Conexão: ${res.timings.connecting} ms
    Envio (request): ${res.timings.sending} ms
    Espera (servidor pensando): ${res.timings.waiting} ms
    Recebimento (response): ${res.timings.receiving} ms
  `);
};