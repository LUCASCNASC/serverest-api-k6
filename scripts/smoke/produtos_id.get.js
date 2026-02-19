import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '10s',
  thresholds: {
    http_req_duration: ['p(95)<500'], // Garantir que 95% das requisições respondam em menos de 500ms
  },
};

const BASE_URL = 'https://serverest.dev';

export default function () {
  const headers = { 'Content-Type': 'application/json' };
  const randomId = Math.floor(Math.random() * 10000);
  const userEmail = `smoke_test_${randomId}@qa.com.br`;
  const userPassword = 'teste';
  let userId, authToken;

  // --- 1. MÓDULO DE USUÁRIOS ---
  const userPayload = JSON.stringify({
    nome: "Fulano da Silva",
    email: userEmail,
    password: userPassword,
    administrador: "true"
  });

  // Cadastro Sucesso (201)
  let res = http.post(`${BASE_URL}/usuarios`, userPayload, { headers });
  check(res, {
    'User POST 201 - Sucesso': (r) => r.status === 201,
    'User POST - ID Presente': (r) => r.json()._id !== undefined,
  });
  userId = res.json()._id;

  // Cadastro Erro: E-mail Duplicado (400)
  res = http.post(`${BASE_URL}/usuarios`, userPayload, { headers });
  check(res, {
    'User POST 400 - E-mail já usado': (r) => r.status === 400,
  });

  // Busca por ID (200) e ID Inexistente (400)
  res = http.get(`${BASE_URL}/usuarios/${userId}`);
  check(res, { 'User GET ID 200 - Encontrado': (r) => r.status === 200 });

  res = http.get(`${BASE_URL}/usuarios/id_invalido`);
  check(res, { 'User GET ID 400 - Não encontrado': (r) => r.status === 400 });

  // --- 2. MÓDULO DE LOGIN ---
  const loginPayload = JSON.stringify({ email: userEmail, password: userPassword });

  // Login Sucesso (200)
  res = http.post(`${BASE_URL}/login`, loginPayload, { headers });
  check(res, {
    'Login POST 200 - Sucesso': (r) => r.status === 200,
    'Login POST - Token Presente': (r) => r.json().authorization !== undefined,
  });
  authToken = res.json().authorization;

  // Login Erro: Credenciais Inválidas (401)
  res = http.post(`${BASE_URL}/login`, JSON.stringify({ email: userEmail, password: 'err' }), { headers });
  check(res, { 'Login POST 401 - Invalido': (r) => r.status === 401 });

  // --- 3. MÓDULO DE PRODUTOS ---
  const prodPayload = JSON.stringify({
    nome: `Produto Smoke ${randomId}`,
    preco: 470,
    descricao: "Mouse",
    quantidade: 100
  });

  // Cadastro Produto Sucesso (201)
  res = http.post(`${BASE_URL}/produtos`, prodPayload, { 
    headers: { ...headers, 'Authorization': authToken } 
  });
  check(res, { 'Prod POST 201 - Sucesso': (r) => r.status === 201 });

  // Erro: Token Ausente/Inválido (401)
  res = http.post(`${BASE_URL}/produtos`, prodPayload, { headers });
  check(res, { 'Prod POST 401 - Token Ausente': (r) => r.status === 401 });

  // Listagem Geral (200)
  res = http.get(`${BASE_URL}/produtos`);
  check(res, { 'Prod GET 200 - Listagem': (r) => r.status === 200 });

  // --- 4. FINALIZAÇÃO E LIMPEZA ---
  // Exclusão (200)
  res = http.del(`${BASE_URL}/usuarios/${userId}`);
  check(res, { 'User DELETE 200 - Excluido': (r) => r.status === 200 });

  sleep(1);
}
