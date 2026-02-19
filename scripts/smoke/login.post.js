import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 1,
  duration: '10s',
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% das requisições abaixo de 500ms
    http_req_failed: ['rate<0.01'],   // Erros de rede/sistema menores que 1%
  },
};

const BASE_URL = 'https://serverest.dev';

export default function () {
  
  // --- CENÁRIO 1: Login com Sucesso (Status 200) ---
  // Nota: Certifique-se de que este usuário existe no ambiente
  const payloadSucesso = JSON.stringify({
    email: "fulano@qa.com",
    password: "teste"
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const resSucesso = http.post(`${BASE_URL}/login`, payloadSucesso, params);

  check(resSucesso, {
    'Sucesso - status é 200': (r) => r.status === 200,
    'Sucesso - possui token (authorization)': (r) => r.json().authorization !== undefined,
    'Sucesso - mensagem correta': (r) => r.json().message === "Login realizado com sucesso",
  });

  sleep(1);

  // --- CENÁRIO 2: Login com Falha (Status 401) ---
  const payloadFalha = JSON.stringify({
    email: "email_inexistente@teste.com",
    password: "senha_errada"
  });

  const resFalha = http.post(`${BASE_URL}/login`, payloadFalha, params);

  check(resFalha, {
    'Falha - status é 401': (r) => r.status === 401,
    'Falha - mensagem de erro correta': (r) => r.json().message === "Email e/ou senha inválidos",
  });

  sleep(1);
}
