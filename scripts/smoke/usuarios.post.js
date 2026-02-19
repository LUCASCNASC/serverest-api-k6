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

  // --- 1. CENÁRIOS DE USUÁRIOS ---
  
  // Cenário: Cadastro com Sucesso (201)
  const novoEmail = `smoke_${Date.now()}@teste.com`;
  const payloadNovoUsuario = JSON.stringify({
    "nome": "Fulano da Silva",
    "email": novoEmail,
    "password": "teste",
    "administrador": "true"
  });

  const resCadastro = http.post(`${BASE_URL}/usuarios`, payloadNovoUsuario, { headers });
  check(resCadastro, {
    'Cadastro: status é 201': (r) => r.status === 201,
    'Cadastro: mensagem de sucesso': (r) => r.json().message === "Cadastro realizado com sucesso",
  });

  // Cenário: E-mail já cadastrado (400)
  const resErroCadastro = http.post(`${BASE_URL}/usuarios`, payloadNovoUsuario, { headers });
  check(resErroCadastro, {
    'Cadastro Erro: status é 400': (r) => r.status === 400,
    'Cadastro Erro: mensagem de e-mail usado': (r) => r.json().message === "Este email já está sendo usado",
  });

  sleep(1);

  // --- 2. CENÁRIOS DE LOGIN ---

  // Cenário: Login realizado com sucesso (200)
  const payloadLoginSucesso = JSON.stringify({
    "email": novoEmail, // Usando o usuário que acabamos de criar
    "password": "teste"
  });

  const resLogin = http.post(`${BASE_URL}/login`, payloadLoginSucesso, { headers });
  check(resLogin, {
    'Login: status é 200': (r) => r.status === 200,
    'Login: possui token authorization': (r) => r.json().authorization !== undefined,
  });

  // Cenário: E-mail e/ou senha inválidos (401)
  const payloadLoginErro = JSON.stringify({
    "email": "invalido@teste.com",
    "password": "errada"
  });

  const resLoginErro = http.post(`${BASE_URL}/login`, payloadLoginErro, { headers });
  check(resLoginErro, {
    'Login Erro: status é 401': (r) => r.status === 401,
    'Login Erro: mensagem de erro': (r) => r.json().message === "Email e/ou senha inválidos",
  });

  sleep(1);
}
