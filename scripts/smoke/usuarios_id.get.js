import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1, 
  duration: '10s',
  thresholds: {
    http_req_duration: ['p(95)<500'], // Garantir latência baixa
  },
};

const BASE_URL = 'https://serverest.dev';

export default function () {
  const headers = { 'Content-Type': 'application/json' };
  const userEmail = `smoke_test_${Date.now()}@qa.com.br`;
  const userPassword = 'teste';
  let createdUserId;

  // 1. POST /usuarios - Cadastro com Sucesso
  const payloadUser = JSON.stringify({
    nome: "Fulano da Silva",
    email: userEmail,
    password: userPassword,
    administrador: "true"
  });

  let res = http.post(`${BASE_URL}/usuarios`, payloadUser, { headers });
  check(res, {
    'Cadastro: status é 201': (r) => r.status === 201,
    'Cadastro: possui _id': (r) => r.json()._id !== undefined,
  });
  createdUserId = res.json()._id;

  // 2. POST /usuarios - Erro: E-mail já cadastrado
  res = http.post(`${BASE_URL}/usuarios`, payloadUser, { headers });
  check(res, {
    'Cadastro Erro: status é 400': (r) => r.status === 400,
    'Cadastro Erro: mensagem correta': (r) => r.json().message === "Este email já está sendo usado",
  });

  // 3. GET /usuarios - Listar Usuários
  res = http.get(`${BASE_URL}/usuarios`);
  check(res, {
    'Listagem: status é 200': (r) => r.status === 200,
    'Listagem: quantidade presente': (r) => r.json().quantidade !== undefined,
  });

  // 4. GET /usuarios/{_id} - Buscar por ID
  res = http.get(`${BASE_URL}/usuarios/${createdUserId}`);
  check(res, {
    'Busca ID: status é 200': (r) => r.status === 200,
    'Busca ID: nome correto': (r) => r.json().nome === "Fulano da Silva",
  });

  // 5. GET /usuarios/{_id} - Erro: ID não encontrado
  res = http.get(`${BASE_URL}/usuarios/id_inexistente`);
  check(res, {
    'Busca ID Erro: status é 400': (r) => r.status === 400,
    'Busca ID Erro: mensagem correta': (r) => r.json().message === "Usuário não encontrado",
  });

  // 6. POST /login - Login com Sucesso
  const payloadLogin = JSON.stringify({
    email: userEmail,
    password: userPassword
  });

  res = http.post(`${BASE_URL}/login`, payloadLogin, { headers });
  check(res, {
    'Login: status é 200': (r) => r.status === 200,
    'Login: possui token authorization': (r) => r.json().authorization !== undefined,
  });

  // 7. POST /login - Erro: Credenciais inválidas
  const payloadLoginErro = JSON.stringify({
    email: "errado@qa.com",
    password: "000"
  });

  res = http.post(`${BASE_URL}/login`, payloadLoginErro, { headers });
  check(res, {
    'Login Erro: status é 401': (r) => r.status === 401,
    'Login Erro: mensagem de erro': (r) => r.json().message === "Email e/ou senha inválidos",
  });

  sleep(1);
}
