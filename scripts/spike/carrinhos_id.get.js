import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. Configuração de Spike (Sobe rápido, mantém o pico e desce rápido)
export const options = {
  stages: [
    { duration: '10s', target: 50 },   // Aquecimento rápido
    { duration: '30s', target: 800 },  // Pico extremo (Spike)
    { duration: '10s', target: 50 },   // Recuperação pós-surto
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.15'],      // Aceita até 15% de falha no pico extremo
    http_req_duration: ['p(95)<3000'],   // 95% das reqs devem responder em até 3s no spike
  },
};

const BASE_URL = 'https://serverest.dev';

export default function () {
  const headers = { 'Content-Type': 'application/json' };
  const randomSuffix = Math.floor(Math.random() * 1000000);
  const userEmail = `spike_${randomSuffix}@qa.com.br`;
  const userPass = 'teste123';
  let userId, authToken, productId;

  // --- MÓDULO: USUÁRIOS (POST /usuarios) ---
  const userPayload = JSON.stringify({
    nome: "QA Spike User",
    email: userEmail,
    password: userPass,
    administrador: "true"
  });

  // Cadastro Sucesso (201)
  let res = http.post(`${BASE_URL}/usuarios`, userPayload, { headers });
  check(res, { 'User POST 201': (r) => r.status === 201 });
  userId = res.json()._id;

  // --- MÓDULO: LOGIN (POST /login) ---
  const loginPayload = JSON.stringify({ email: userEmail, password: userPass });
  
  // Login Sucesso (200) - Token expira em 600s
  res = http.post(`${BASE_URL}/login`, loginPayload, { headers });
  check(res, { 'Login POST 200': (r) => r.status === 200 });
  authToken = res.json().authorization;

  const authHeaders = { ...headers, 'Authorization': authToken };

  // --- MÓDULO: PRODUTOS (POST /produtos) ---
  const prodPayload = JSON.stringify({
    nome: `Produto Spike ${randomSuffix}`,
    preco: 100,
    descricao: "Hardware",
    quantidade: 1000
  });

  // Cadastro Produto (201)
  res = http.post(`${BASE_URL}/produtos`, prodPayload, { headers: authHeaders });
  check(res, { 'Prod POST 201': (r) => r.status === 201 });
  productId = res.json()._id;

  // --- MÓDULO: CARRINHOS (POST /carrinhos) ---
  const cartPayload = JSON.stringify({
    produtos: [{ idProduto: productId, quantidade: 1 }]
  });

  // Criar Carrinho (201)
  res = http.post(`${BASE_URL}/carrinhos`, cartPayload, { headers: authHeaders });
  check(res, { 'Cart POST 201': (r) => r.status === 201 });

  // --- LIMPEZA E FINALIZAÇÃO (DELETE) ---
  // Concluir Compra para liberar estoque
  http.del(`${BASE_URL}/carrinhos/concluir-compra`, null, { headers: authHeaders });

  // Excluir Usuário
  if (userId) {
    http.del(`${BASE_URL}/usuarios/${userId}`);
  }

  sleep(1);
}