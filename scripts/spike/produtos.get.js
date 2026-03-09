import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'https://serverest.dev';

export const options = {
  stages: [
    { duration: '10s', target: 10 },  // Aquecimento
    { duration: '5s',  target: 150 }, // SPIKE: Sobrecarga repentina
    { duration: '30s', target: 150 }, // Sustentação do pico
    { duration: '10s', target: 10 },  // Recuperação (Ramp-down rápido)
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],   // Menos de 5% de falhas de rede permitidas
    http_req_duration: ['p(95)<2000'], // 95% das requisições abaixo de 2s
  },
};

export default function () {
  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  // --- CENÁRIO 1: GET /produtos (Listagem) ---
  // Baseado na imagem image_223634.png
  let resGet = http.get(`${BASE_URL}/produtos`);
  check(resGet, {
    'GET - Status é 200': (r) => r.status === 200,
    'GET - Contém lista de produtos': (r) => r.json().hasOwnProperty('produtos'),
  });

  // --- CENÁRIO 2: POST /produtos (Cadastro) ---
  // Baseado na imagem image_223580.png
  const payload = JSON.stringify({
    nome: `Produto Spike ${Math.random() * 10000}`, // Nome dinâmico para evitar 400 fixo
    preco: 470,
    descricao: "Mouse",
    quantidade: 381
  });

  // 2.a - Tentativa sem Token (Cenário 401)
  let res401 = http.post(`${BASE_URL}/produtos`, payload, params);
  check(res401, {
    'POST - Status é 401 (Sem Token)': (r) => r.status === 401,
  });

  // 2.b - Tentativa com Token Admin (Cenário 201 ou 400)
  const authParams = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer SEU_TOKEN_ADMIN_AQUI'
    },
  };
  
  let resPost = http.post(`${BASE_URL}/produtos`, payload, authParams);
  check(resPost, {
    'POST - Status é 201 ou 400': (r) => r.status === 201 || r.status === 400,
  });

  // 2.c - Tentativa com Usuário Comum (Cenário 403)
  const nonAdminParams = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer SEU_TOKEN_COMUM_AQUI'
    },
  };
  
  let res403 = http.post(`${BASE_URL}/produtos`, payload, nonAdminParams);
  check(res403, {
    'POST - Status é 403 (Proibido para não-admin)': (r) => r.status === 403,
  });

  sleep(1);
}