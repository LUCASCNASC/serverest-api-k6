import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'https://serverest.dev';

// 1. Configuração de Spike (Aumento abrupto e queda rápida)
export const options = {
  stages: [
    { duration: '10s', target: 50 },   // Aquecimento rápido
    { duration: '30s', target: 800 },  // Pico extremo (Spike)
    { duration: '10s', target: 50 },   // Recuperação pós-surto
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.15'],      // Aceita até 15% de erro no pico extremo
    http_req_duration: ['p(95)<3000'],   // 95% das reqs devem responder em até 3s no spike
  },
};

export default function () {
  const headers = { 'Content-Type': 'application/json' };
  const random = Math.floor(Math.random() * 1000000);
  const email = `spike_${random}@qa.com.br`;
  let userId, authToken, productId;

  // --- MÓDULO: USUÁRIOS (POST /usuarios) ---
  const userPayload = JSON.stringify({
    nome: "QA Senior Spike",
    email: email,
    password: "teste",
    administrador: "true"
  });

  // Cadastro Sucesso (201)
  let resUser = http.post(`${BASE_URL}/usuarios`, userPayload, { headers });
  check(resUser, { 'User POST 201': (r) => r.status === 201 });
  userId = resUser.json()._id;

  // --- MÓDULO: LOGIN (POST /login) ---
  const loginPayload = JSON.stringify({ email: email, password: "teste" });
  
  // Login Sucesso (200) - Token expira em 600s
  let resLogin = http.post(`${BASE_URL}/login`, loginPayload, { headers });
  check(resLogin, { 'Login POST 200': (r) => r.status === 200 });
  authToken = resLogin.json().authorization;

  const authHeaders = { ...headers, 'Authorization': authToken };

  // --- MÓDULO: PRODUTOS (POST /produtos) ---
  const prodPayload = JSON.stringify({
    nome: `Produto Spike ${random}`,
    preco: 100,
    descricao: "Hardware",
    quantidade: 1000
  });

  // Cadastro Produto (201)
  let resProd = http.post(`${BASE_URL}/produtos`, prodPayload, { headers: authHeaders });
  check(resProd, { 'Prod POST 201': (r) => r.status === 201 });
  productId = resProd.json()._id;

  // --- MÓDULO: CARRINHOS (POST /carrinhos) ---
  const cartPayload = JSON.stringify({
    produtos: [{ idProduto: productId, quantidade: 1 }]
  });

  // Create Cart (201)
  let resCart = http.post(`${BASE_URL}/carrinhos`, cartPayload, { headers: authHeaders });
  check(resCart, { 'Cart POST 201': (r) => r.status === 201 });

  // --- LIMPEZA E FINALIZAÇÃO (DELETE) ---
  // Concluir Compra para liberar estoque
  http.del(`${BASE_URL}/carrinhos/concluir-compra`, null, { headers: authHeaders });

  // Delete User

  if (userId) {
    http.del(`${BASE_URL}/usuarios/${userId}`);
  }

  sleep(1);
}
