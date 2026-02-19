import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '10s',
  thresholds: {
    http_req_duration: ['p(95)<500'], // Resposta em menos de 500ms
    http_req_failed: ['rate<0.01'],   // Falhas de rede menores que 1%
  },
};

const BASE_URL = 'https://serverest.dev';

export default function () {
  const headers = { 'Content-Type': 'application/json' };
  const randomId = Math.floor(Math.random() * 999999);
  const emailTeste = `qa_smoke_${randomId}@test.com`;
  const senhaTeste = 'teste123';

  // --- 1. POST /usuarios (Cenário: Cadastro com Sucesso) ---
  const payloadNovoUser = JSON.stringify({
    nome: "Fulano da Silva",
    email: emailTeste,
    password: senhaTeste,
    administrador: "true"
  });

  const resPostUser = http.post(`${BASE_URL}/usuarios`, payloadNovoUser, { headers });
  check(resPostUser, {
    'POST Usuário - Status 201': (r) => r.status === 201,
    'POST Usuário - Mensagem sucesso': (r) => r.json().message === "Cadastro realizado com sucesso",
    'POST Usuário - ID gerado': (r) => r.json()._id !== undefined,
  });

  // --- 2. POST /usuarios (Cenário: E-mail já cadastrado) ---
  const resPostUserErro = http.post(`${BASE_URL}/usuarios`, payloadNovoUser, { headers });
  check(resPostUserErro, {
    'POST Usuário Erro - Status 400': (r) => r.status === 400,
    'POST Usuário Erro - Mensagem erro': (r) => r.json().message === "Este email já está sendo usado",
  });

  // --- 3. GET /usuarios (Cenário: Listar Usuários) ---
  const resGetUsers = http.get(`${BASE_URL}/usuarios`);
  check(resGetUsers, {
    'GET Usuários - Status 200': (r) => r.status === 200,
    'GET Usuários - Lista não vazia': (r) => r.json().quantidade > 0,
    'GET Usuários - Estrutura de array': (r) => Array.isArray(r.json().usuarios),
  });

  // --- 4. POST /login (Cenário: Login realizado com sucesso) ---
  const payloadLogin = JSON.stringify({
    email: emailTeste,
    password: senhaTeste
  });

  const resLogin = http.post(`${BASE_URL}/login`, payloadLogin, { headers });
  check(resLogin, {
    'POST Login - Status 200': (r) => r.status === 200,
    'POST Login - Token presente': (r) => r.json().authorization !== undefined,
    'POST Login - Mensagem sucesso': (r) => r.json().message === "Login realizado com sucesso",
  });

  // --- 5. POST /login (Cenário: E-mail e/ou senha inválidos) ---
  const payloadLoginInvalido = JSON.stringify({
    email: "inexistente@erro.com",
    password: "000"
  });

  const resLoginErro = http.post(`${BASE_URL}/login`, payloadLoginInvalido, { headers });
  check(resLoginErro, {
    'POST Login Erro - Status 401': (r) => r.status === 401,
    'POST Login Erro - Mensagem erro': (r) => r.json().message === "Email e/ou senha inválidos",
  });

  sleep(1);
}
