import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1, 
  duration: '10s',
  thresholds: {
    http_req_duration: ['p(95)<500'], // Resposta rápida em 95% das requisições
  },
};

const BASE_URL = 'https://serverest.dev';

export default function () {
  const headers = { 'Content-Type': 'application/json' };
  const randomId = Math.floor(Math.random() * 10000);
  const userEmail = `smoke_${randomId}@qa.com.br`;
  let userId, authToken;

  // --- 1. USUÁRIOS: POST /usuarios (Cenários 201 e 400) ---
  const userPayload = JSON.stringify({
    nome: "Fulano da Silva",
    email: userEmail,
    password: "teste",
    administrador: "true"
  });

  // Cadastro Sucesso
  let res = http.post(`${BASE_URL}/usuarios`, userPayload, { headers });
  check(res, {
    'Cadastro: status é 201': (r) => r.status === 201,
    'Cadastro: possui _id': (r) => r.json()._id !== undefined,
  });
  userId = res.json()._id;

  // E-mail duplicado
  res = http.post(`${BASE_URL}/usuarios`, userPayload, { headers });
  check(res, {
    'Cadastro: 400 para e-mail repetido': (r) => r.status === 400,
    'Cadastro: msg de erro correta': (r) => r.json().message === "Este email já está sendo usado",
  });

  // --- 2. LOGIN: POST /login (Cenários 200 e 401) ---
  const loginPayload = JSON.stringify({ email: userEmail, password: "teste" });

  // Login Sucesso
  res = http.post(`${BASE_URL}/login`, loginPayload, { headers });
  check(res, {
    'Login: status é 200': (r) => r.status === 200,
    'Login: possui authorization': (r) => r.json().authorization !== undefined,
  });
  authToken = res.json().authorization;

  // Login Falha
  res = http.post(`${BASE_URL}/login`, JSON.stringify({ email: userEmail, password: "err" }), { headers });
  check(res, {
    'Login: status é 401 para senha incorreta': (r) => r.status === 401,
  });

  // --- 3. USUÁRIOS: GET/PUT/DELETE (Cenários 200 e 400) ---
  // Busca por ID
  res = http.get(`${BASE_URL}/usuarios/${userId}`);
  check(res, { 'Busca ID: status 200': (r) => r.status === 200 });

  // Edição
  res = http.put(`${BASE_URL}/usuarios/${userId}`, userPayload, { headers });
  check(res, { 'Edição: status 200': (r) => r.status === 200 });

  // --- 4. PRODUTOS: POST /produtos (Cenários 201, 401, 403) ---
  const productPayload = JSON.stringify({
    nome: `Produto Smoke ${randomId}`,
    preco: 100,
    descricao: "Mouse",
    quantidade: 10
  });

  // Cadastro Produto com Token
  res = http.post(`${BASE_URL}/produtos`, productPayload, { 
    headers: { 'Content-Type': 'application/json', 'Authorization': authToken } 
  });
  check(res, {
    'Produto: status 201': (r) => r.status === 201,
  });

  // Cadastro sem Token
  res = http.post(`${BASE_URL}/produtos`, productPayload, { headers });
  check(res, {
    'Produto: status 401 para token ausente': (r) => r.status === 401,
  });

  // --- 5. LIMPEZA: DELETE /usuarios ---
  // Exclusão Sucesso
  res = http.del(`${BASE_URL}/usuarios/${userId}`);
  check(res, {
    'Exclusão: status 200': (r) => r.status === 200,
  });

  sleep(1);
}
