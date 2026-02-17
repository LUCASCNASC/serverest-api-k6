import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1, // Smoke Test utiliza apenas 1 usuário virtual
  duration: '10s',
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% das reqs devem responder em < 500ms
  },
};

const BASE_URL = 'https://serverest.dev';

export default function () {
  const headers = { 'Content-Type': 'application/json' };
  const randomSuffix = Math.floor(Math.random() * 10000);
  const userEmail = `qa_smoke_${randomSuffix}@tst.com.br`;
  const userPass = 'teste123';
  let userId, authToken, productId;

  // --- 1. MÓDULO: USUÁRIOS (POST /usuarios) ---
  const userPayload = JSON.stringify({
    nome: "Fulano da Silva",
    email: userEmail,
    password: userPass,
    administrador: "true"
  });

  // Cadastro Sucesso (201)
  let res = http.post(`${BASE_URL}/usuarios`, userPayload, { headers });
  check(res, { 'User POST - 201': (r) => r.status === 201 });
  userId = res.json()._id;

  // Erro: E-mail Duplicado (400)
  res = http.post(`${BASE_URL}/usuarios`, userPayload, { headers });
  check(res, { 'User POST - 400 (Email duplicado)': (r) => r.status === 400 });

  // --- 2. MÓDULO: LOGIN (POST /login) ---
  const loginPayload = JSON.stringify({ email: userEmail, password: userPass });

  // Login Sucesso (200)
  res = http.post(`${BASE_URL}/login`, loginPayload, { headers });
  check(res, {
    'Login POST - 200': (r) => r.status === 200,
    'Login POST - Token Presente': (r) => r.json().authorization !== undefined,
  });
  authToken = res.json().authorization;

  // Falha: Credenciais Inválidas (401)
  res = http.post(`${BASE_URL}/login`, JSON.stringify({ email: userEmail, password: 'err' }), { headers });
  check(res, { 'Login POST - 401': (r) => r.status === 401 });

  // --- 3. MÓDULO: PRODUTOS (POST /produtos) ---
  const prodPayload = JSON.stringify({
    nome: `Produto Smoke ${randomSuffix}`,
    preco: 470,
    descricao: "Mouse",
    quantidade: 100
  });

  // Cadastro Produto Sucesso (201)
  const authHeaders = { ...headers, 'Authorization': authToken };
  res = http.post(`${BASE_URL}/produtos`, prodPayload, { headers: authHeaders });
  check(res, { 'Prod POST - 201': (r) => r.status === 201 });
  productId = res.json()._id;

  // Falha: Token ausente (401)
  res = http.post(`${BASE_URL}/produtos`, prodPayload, { headers });
  check(res, { 'Prod POST - 401 (Sem Token)': (r) => r.status === 401 });

  // --- 4. MÓDULO: CARRINHOS (POST /carrinhos) ---
  const cartPayload = JSON.stringify({
    produtos: [{ idProduto: productId, quantidade: 1 }]
  });

  // Cadastro Carrinho Sucesso (201)
  res = http.post(`${BASE_URL}/carrinhos`, cartPayload, { headers: authHeaders });
  check(res, { 'Cart POST - 201': (r) => r.status === 201 });

  // Falha: Usuário já possui carrinho (400)
  res = http.post(`${BASE_URL}/carrinhos`, cartPayload, { headers: authHeaders });
  check(res, { 'Cart POST - 400 (Carrinho ja existe)': (r) => r.status === 400 });

  // --- 5. LIMPEZA E VALIDAÇÃO DE RESTRIÇÃO ---
  // Erro: Tentar excluir usuário com carrinho (400)
  res = http.del(`${BASE_URL}/usuarios/${userId}`);
  check(res, { 'User DELETE - 400 (Bloqueio por carrinho)': (r) => r.status === 400 });

  sleep(1);
}