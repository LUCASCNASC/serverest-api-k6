import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1, // Smoke test utiliza carga mínima
  duration: '5s',
  thresholds: {
    http_req_duration: ['p(95)<500'], // Performance básica: 95% das reqs < 500ms
  },
};

const BASE_URL = 'https://serverest.dev';

export default function () {
  const headers = { 'Content-Type': 'application/json' };
  const randomId = Math.floor(Math.random() * 10000);
  const userEmail = `qa_smoke_${randomId}@tst.com.br`;
  let userId;

  // --- 1. POST /usuarios: Cadastro (Sucesso e Erro) ---
  const payloadUser = JSON.stringify({
    nome: "Fulano da Silva",
    email: userEmail,
    password: "teste",
    administrador: "true"
  });

  // [Cenário 201] Sucesso no cadastro
  let res = http.post(`${BASE_URL}/usuarios`, payloadUser, { headers });
  check(res, {
    'Cadastro: status é 201': (r) => r.status === 201,
    'Cadastro: possui _id': (r) => r.json()._id !== undefined,
  });
  userId = res.json()._id;

  // [Cenário 400] E-mail já cadastrado
  res = http.post(`${BASE_URL}/usuarios`, payloadUser, { headers });
  check(res, {
    'Cadastro: status é 400 para e-mail repetido': (r) => r.status === 400,
    'Cadastro: mensagem de erro de e-mail correta': (r) => r.json().message === "Este email já está sendo usado",
  });

  // --- 2. GET /usuarios: Listagem e Busca por ID ---
  // [Cenário 200] Listar usuários cadastrados
  res = http.get(`${BASE_URL}/usuarios`);
  check(res, {
    'Listagem: status é 200': (r) => r.status === 200,
    'Listagem: contém usuários': (r) => r.json().quantidade > 0,
  });

  // [Cenário 200] Buscar usuário por ID específico
  res = http.get(`${BASE_URL}/usuarios/${userId}`);
  check(res, {
    'Busca ID: status é 200': (r) => r.status === 200,
    'Busca ID: nome confere': (r) => r.json().nome === "Fulano da Silva",
  });

  // [Cenário 400] Usuário não encontrado
  res = http.get(`${BASE_URL}/usuarios/ID_INVALIDO`);
  check(res, {
    'Busca ID: status é 400 para ID inexistente': (r) => r.status === 400,
    'Busca ID: mensagem de não encontrado': (r) => r.json().message === "Usuário não encontrado",
  });

  // --- 3. PUT /usuarios: Edição de Registro ---
  // [Cenário 200] Alterado com sucesso
  const payloadEdit = JSON.stringify({
    nome: "Fulano Editado",
    email: userEmail,
    password: "nova_senha",
    administrador: "true"
  });
  res = http.put(`${BASE_URL}/usuarios/${userId}`, payloadEdit, { headers });
  check(res, {
    'Edição: status é 200': (r) => r.status === 200,
    'Edição: mensagem de alterado com sucesso': (r) => r.json().message === "Registro alterado com sucesso",
  });

  // --- 4. POST /login: Autenticação ---
  // [Cenário 200] Login realizado com sucesso
  const payloadLogin = JSON.stringify({ email: userEmail, password: "nova_senha" });
  res = http.post(`${BASE_URL}/login`, payloadLogin, { headers });
  check(res, {
    'Login: status é 200': (r) => r.status === 200,
    'Login: possui token authorization': (r) => r.json().authorization !== undefined,
  });

  // [Cenário 401] E-mail e/ou senha inválidos
  const payloadLoginInvalido = JSON.stringify({ email: userEmail, password: "senha_errada" });
  res = http.post(`${BASE_URL}/login`, payloadLoginInvalido, { headers });
  check(res, {
    'Login: status é 401 para senha incorreta': (r) => r.status === 401,
    'Login: mensagem de erro de credenciais': (r) => r.json().message === "Email e/ou senha inválidos",
  });

  // --- 5. DELETE /usuarios: Exclusão ---
  // [Cenário 200] Registro excluído com sucesso
  res = http.del(`${BASE_URL}/usuarios/${userId}`);
  check(res, {
    'Exclusão: status é 200': (r) => r.status === 200,
    'Exclusão: mensagem de sucesso ou nenhum registro': (r) => r.json().message.includes("excluído"),
  });

  sleep(1);
}