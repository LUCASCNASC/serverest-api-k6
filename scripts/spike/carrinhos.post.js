import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'https://serverest.dev';

// 1. Configuração do Spike (Pico repentino)
export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Aquecimento rápido
    { duration: '30s', target: 500 }, // Pico extremo (Spike)
    { duration: '10s', target: 50 },  // Recuperação rápida
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],    // Aceita até 10% de erro no pico extremo
    http_req_duration: ['p(95)<2000'], // 95% das reqs devem responder em até 2s no surto
  },
};

export default function () {
  const headers = { 'Content-Type': 'application/json' };
  const random = Math.floor(Math.random() * 1000000);
  const email = `spike_${random}@qa.com.br`;
  let token, userId, productId;

  // --- CENÁRIO 1: USUÁRIOS (POST /usuarios) ---
  const userPayload = JSON.stringify({
    nome: "QA Spike Test",
    email: email,
    password: "teste",
    administrador: "true"
  });

  // Cadastro Sucesso (201)
  let resUser = http.post(`${BASE_URL}/usuarios`, userPayload, { headers });
  check(resUser, { 'User POST 201': (r) => r.status === 201 });
  userId = resUser.json()._id;

  // Erro: E-mail duplicado (400)
  let resUserErr = http.post(`${BASE_URL}/usuarios`, userPayload, { headers });
  check(resUserErr, { 'User POST 400': (r) => r.status === 400 });

  // --- CENÁRIO 2: LOGIN (POST /login) ---
  const loginPayload = JSON.stringify({ email: email, password: "teste" });
  
  // Login Sucesso (200)
  let resLogin = http.post(`${BASE_URL}/login`, loginPayload, { headers });
  check(resLogin, { 'Login POST 200': (r) => r.status === 200 });
  token = resLogin.json().authorization;

  // Login Erro (401)
  let resLoginErr = http.post(`${BASE_URL}/login`, JSON.stringify({ email: email, password: "err" }), { headers });
  check(resLoginErr, { 'Login POST 401': (r) => r.status === 401 });

  const authHeaders = { ...headers, 'Authorization': token };

  // --- CENÁRIO 3: PRODUTOS (POST /produtos) ---
  const prodPayload = JSON.stringify({
    nome: `Produto Spike ${random}`,
    preco: 100,
    descricao: "Teclado Mecânico",
    quantidade: 1000
  });

  // Cadastro Produto (201)
  let resProd = http.post(`${BASE_URL}/produtos`, prodPayload, { headers: authHeaders });
  check(resProd, { 'Prod POST 201': (r) => r.status === 201 });
  productId = resProd.json()._id;

  // Erro: Token ausente/inválido (401)
  let resProdErr = http.post(`${BASE_URL}/produtos`, prodPayload, { headers });
  check(resProdErr, { 'Prod POST 401': (r) => r.status === 401 });

  // --- CENÁRIO 4: CARRINHOS (POST /carrinhos) ---
  const cartPayload = JSON.stringify({
    produtos: [{ idProduto: productId, quantidade: 1 }]
  });

  // Create Cart (201)
  let resCart = http.post(`${BASE_URL}/carrinhos`, cartPayload, { headers: authHeaders });
  check(resCart, { 'Cart POST 201': (r) => r.status === 201 });

  // --- CENÁRIO 5: LIMPEZA E FINALIZAÇÃO ---
  // Concluir Compra (200)
  http.del(`${BASE_URL}/carrinhos/concluir-compra`, null, { headers: authHeaders });

  // Delete User
 (200)
  if (userId) {
    http.del(`${BASE_URL}/usuarios/${userId}`);
  }

  sleep(1);
}
