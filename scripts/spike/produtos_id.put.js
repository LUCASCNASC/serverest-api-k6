import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 10 },  // Baseline: carga estável inicial
    { duration: '5s',  target: 200 }, // SPIKE: salto repentino para 200 VUs
    { duration: '30s', target: 200 }, // Sustentação do pico de tráfego
    { duration: '10s', target: 10 },  // Recuperação: descida rápida
    { duration: '10s', target: 0 },   // Encerramento
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],   // Tolerância máxima de 5% de falhas
    http_req_duration: ['p(95)<2000'], // 95% das requisições devem responder em < 2s
  },
};

const BASE_URL = 'https://serverest.dev';

export default function () {
  const headers = { 'Content-Type': 'application/json' };
  
  // 1. CENÁRIO: Listagem Geral (GET /produtos)
  let resList = http.get(`${BASE_URL}/produtos`);
  check(resList, {
    'GET List - Status 200': (r) => r.status === 200,
  });

  // 2. CENÁRIO: Busca por ID (GET /produtos/{id})
  let resById = http.get(`${BASE_URL}/produtos/Beejh5lz3k6kSlzA`);
  check(resById, {
    'GET ID - Status 200 ou 400': (r) => r.status === 200 || r.status === 400,
  });

  // 3. CENÁRIO: Cadastro (POST /produtos) - Requer Token de Admin
  const payloadPost = JSON.stringify({
    nome: `Prod Spike ${Math.random() * 10000}`,
    preco: 470,
    descricao: "Teste de Carga",
    quantidade: 100
  });

  // Simulação de tentativa sem token (Status 401)
  let res401 = http.post(`${BASE_URL}/produtos`, payloadPost, { headers });
  check(res401, {
    'POST - Status 401 esperado (sem token)': (r) => r.status === 401,
  });

  // Simulação com Headers de Autorização (Necessário substituir pelo token real)
  const authHeaders = {
    headers: {
      ...headers,
      'Authorization': 'Bearer SEU_TOKEN_ADMIN_AQUI'
    }
  };

  let resPost = http.post(`${BASE_URL}/produtos`, payloadPost, authHeaders);
  check(resPost, {
    'POST - Status 201 ou 400 (nome já utilizado)': (r) => r.status === 201 || r.status === 400,
  });

  // 4. CENÁRIO: Edição (PUT /produtos/{id})
  const payloadPut = JSON.stringify({
    nome: "Produto Alterado Spike",
    preco: 500,
    descricao: "Edição sob carga",
    quantidade: 50
  });

  let resPut = http.put(`${BASE_URL}/produtos/K6leHdfiCeOj8BJ`, payloadPut, authHeaders);
  check(resPut, {
    'PUT - Status 200 ou 201': (r) => r.status === 200 || r.status === 201,
  });

  sleep(1);
}