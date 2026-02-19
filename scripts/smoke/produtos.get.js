import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1, // Carga mínima para Smoke Test
  duration: '10s',
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% das requisições devem responder em < 500ms
  },
};

const BASE_URL = 'https://serverest.dev';

export default function () {
  const headers = { 'Content-Type': 'application/json' };
  const randomId = Math.floor(Math.random() * 10000);
  const userEmail = `qa_smoke_${randomId}@test.com.br`;
  let userId, authToken;

  // --- 1. CENÁRIOS DE USUÁRIOS ---
  const userPayload = JSON.stringify({
    nome: "Fulano da Silva",
    email: userEmail,
    password: "teste",
    administrador: "true"
  });

  // Cadastro Sucesso (201)
  let res = http.post(`${BASE_URL}/usuarios`, userPayload, { headers });
  check(res, {
    'User POST - 201': (r) => r.status === 201,
    'User POST - ID Presente': (r) => r.json()._id !== undefined,
  });
  userId = res.json()._id;

  // Cadastro E-mail Duplicado (400)
  res = http.post(`${BASE_URL}/usuarios`, userPayload, { headers });
  check(res, {
    'User POST - 400': (r) => r.status === 400,
    'User POST - Msg Erro E-mail': (r) => r.json().message === "Este email já está sendo usado",
  });

  // Listagem Geral (200)
  res = http.get(`${BASE_URL}/usuarios`);
  check(res, { 'User GET All - 200': (r) => r.status === 200 });

  // --- 2. CENÁRIOS DE LOGIN ---
  const loginPayload = JSON.stringify({ email: userEmail, password: "teste" });

  // Login Sucesso (200)
  res = http.post(`${BASE_URL}/login`, loginPayload, { headers });
  check(res, {
    'Login POST - 200': (r) => r.status === 200,
    'Login POST - Token Presente': (r) => r.json().authorization !== undefined,
  });
  authToken = res.json().authorization;

  // Login Falha (401)
  res = http.post(`${BASE_URL}/login`, JSON.stringify({ email: userEmail, password: "err" }), { headers });
  check(res, { 'Login POST - 401': (r) => r.status === 401 });

  // --- 3. CENÁRIOS DE PRODUTOS ---
  const prodPayload = JSON.stringify({
    nome: `Produto Smoke ${randomId}`,
    preco: 470,
    descricao: "Mouse",
    quantidade: 381
  });

  // Cadastro Produto Sucesso (201)
  res = http.post(`${BASE_URL}/produtos`, prodPayload, { 
    headers: { ...headers, 'Authorization': authToken } 
  });
  check(res, { 'Prod POST - 201': (r) => r.status === 201 });

  // Cadastro Produto sem Token (401)
  res = http.post(`${BASE_URL}/produtos`, prodPayload, { headers });
  check(res, { 'Prod POST - 401 (Sem Token)': (r) => r.status === 401 });

  // Listagem de Produtos (200)
  res = http.get(`${BASE_URL}/produtos`);
  check(res, { 'Prod GET All - 200': (r) => r.status === 200 });

  // --- 4. EDIÇÃO E LIMPEZA ---
  // Edição de Usuário (200)
  res = http.put(`${BASE_URL}/usuarios/${userId}`, userPayload, { headers });
  check(res, { 'User PUT - 200': (r) => r.status === 200 });

  // Exclusão de Usuário (200)
  res = http.del(`${BASE_URL}/usuarios/${userId}`);
  check(res, { 'User DELETE - 200': (r) => r.status === 200 });

  sleep(1);
}
