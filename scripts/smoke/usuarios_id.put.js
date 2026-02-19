import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1, 
  duration: '5s',
  thresholds: {
    http_req_duration: ['p(95)<500'], 
  },
};

const BASE_URL = 'https://serverest.dev';

export default function () {
  const headers = { 'Content-Type': 'application/json' };
  const randomSuffix = Math.floor(Math.random() * 10000);
  const userEmail = `qa_smoke_${randomSuffix}@test.com.br`;
  let userId;

  // --- 1. POST /usuarios (Cenários: Sucesso e E-mail Duplicado) ---
  const payloadUser = JSON.stringify({
    nome: "Fulano da Silva",
    email: userEmail,
    password: "teste",
    administrador: "true"
  });

  // Cadastro Sucesso (201)
  let res = http.post(`${BASE_URL}/usuarios`, payloadUser, { headers });
  check(res, {
    'POST Usuário - 201': (r) => r.status === 201,
    'POST Usuário - Msg Sucesso': (r) => r.json().message === "Cadastro realizado com sucesso",
  });
  userId = res.json()._id;

  // E-mail já cadastrado (400)
  res = http.post(`${BASE_URL}/usuarios`, payloadUser, { headers });
  check(res, {
    'POST Usuário - 400 (E-mail duplicado)': (r) => r.status === 400,
    'POST Usuário - Msg Erro': (r) => r.json().message === "Este email já está sendo usado",
  });

  // --- 2. GET /usuarios (Cenário: Listagem e Busca por ID) ---
  // Listar todos (200)
  res = http.get(`${BASE_URL}/usuarios`);
  check(res, {
    'GET Usuários - 200': (r) => r.status === 200,
    'GET Usuários - Lista populada': (r) => r.json().usuarios.length > 0,
  });

  // Buscar por ID (200)
  res = http.get(`${BASE_URL}/usuarios/${userId}`);
  check(res, {
    'GET ID - 200': (r) => r.status === 200,
    'GET ID - Nome correto': (r) => r.json().nome === "Fulano da Silva",
  });

  // ID inexistente (400)
  res = http.get(`${BASE_URL}/usuarios/id_invalido`);
  check(res, {
    'GET ID - 400 (Não encontrado)': (r) => r.status === 400,
    'GET ID - Msg Erro': (r) => r.json().message === "Usuário não encontrado",
  });

  // --- 3. PUT /usuarios/{_id} (Cenário: Edição) ---
  const payloadEdit = JSON.stringify({
    nome: "Fulano Editado",
    email: userEmail,
    password: "nova_senha",
    administrador: "true"
  });
  res = http.put(`${BASE_URL}/usuarios/${userId}`, payloadEdit, { headers });
  check(res, {
    'PUT Usuário - 200': (r) => r.status === 200,
    'PUT Usuário - Msg Sucesso': (r) => r.json().message === "Registro alterado com sucesso",
  });

  // --- 4. POST /login (Cenários: Sucesso e Falha) ---
  // Login Sucesso (200)
  const payloadLogin = JSON.stringify({ email: userEmail, password: "nova_senha" });
  res = http.post(`${BASE_URL}/login`, payloadLogin, { headers });
  check(res, {
    'POST Login - 200': (r) => r.status === 200,
    'POST Login - Token presente': (r) => r.json().authorization !== undefined,
  });

  // Login Falha (401)
  const payloadLoginErr = JSON.stringify({ email: userEmail, password: "senha_errada" });
  res = http.post(`${BASE_URL}/login`, payloadLoginErr, { headers });
  check(res, {
    'POST Login - 401': (r) => r.status === 401,
    'POST Login - Msg Erro': (r) => r.json().message === "Email e/ou senha inválidos",
  });

  sleep(1);
}
