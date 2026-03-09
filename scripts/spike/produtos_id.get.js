import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'https://serverest.dev';

export const options = {
  stages: [
    { duration: '10s', target: 20 },  // Baseline: carga normal
    { duration: '5s',  target: 200 }, // SPIKE: sobe para 200 usuários em 5 segundos
    { duration: '30s', target: 200 }, // Sustenta o pico
    { duration: '10s', target: 20 },  // Recuperação: desce para carga normal
    { duration: '10s', target: 0 },   // Encerramento
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],   // Falha se mais de 5% das requisições derem erro de rede
    http_req_duration: ['p(95)<2000'], // 95% das requisições devem responder em menos de 2s
  },
};

export default function () {
  // --- CENÁRIOS DE GET ---
  
  // 1. Listar Produtos (image_223634.png)
  let resList = http.get(`${BASE_URL}/produtos`);
  check(resList, {
    'GET /produtos - Status 200': (r) => r.status === 200,
  });

  // 2. Buscar Produto por ID (image_223922.png)
  let resById = http.get(`${BASE_URL}/produtos/Beejh5lz3k6kSlzA`);
  check(resById, {
    'GET /produtos/{id} - Status 200 ou 400': (r) => r.status === 200 || r.status === 400,
  });

  // --- CENÁRIOS DE POST /produtos (image_223580.png) ---

  const payload = JSON.stringify({
    nome: `Produto Spike ${Math.random() * 10000}`, // Nome randômico para tentar status 201
    preco: 470,
    descricao: "Mouse",
    quantidade: 381
  });

  // A. Cenário 401: Token ausente/inválido
  let res401 = http.post(`${BASE_URL}/produtos`, payload, {
    headers: { 'Content-Type': 'application/json' },
  });
  check(res401, {
    'POST /produtos - Status 401': (r) => r.status === 401,
  });

  // B. Cenários 201, 400 e 403 (Requerem Tokens específicos)
  // Nota: Substitua pelos tokens reais gerados no seu ambiente
  const adminHeaders = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer SEU_TOKEN_ADMIN'
    },
  };

  const commonUserHeaders = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer SEU_TOKEN_USUARIO_COMUM'
    },
  };

  // Simular tentativa de Admin (Sucesso 201 ou Conflito de Nome 400)
  let resAdmin = http.post(`${BASE_URL}/produtos`, payload, adminHeaders);
  check(resAdmin, {
    'POST /produtos - Status 201 ou 400': (r) => r.status === 201 || r.status === 400,
  });

  // Simular tentativa de Usuário Comum (Proibido 403)
  let res403 = http.post(`${BASE_URL}/produtos`, payload, commonUserHeaders);
  check(res403, {
    'POST /produtos - Status 403': (r) => r.status === 403,
  });

  sleep(1);
}