import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = 'https://serverest.dev';

export const options = {
  stages: [
    { duration: '10s', target: 20 },  // Ramp-up rápido para carga normal
    { duration: '1m', target: 20 },   // Sustenta carga estável
    { duration: '10s', target: 200 }, // SPIKE: Sobe repentinamente para 200 usuários
    { duration: '30s', target: 200 }, // Sustenta o pico
    { duration: '10s', target: 20 },  // Recovery: Desce rápido para carga normal
    { duration: '30s', target: 20 },  // Estabiliza após o choque
    { duration: '10s', target: 0 },   // Ramp-down final
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],   // Falha se mais de 5% das requisições derem erro de rede
    http_req_duration: ['p(95)<2000'], // 95% das requisições devem responder em menos de 2s
  },
};

export default function () {
  const url = `${BASE_URL}/produtos`;
  
  // Payload dinâmico para evitar colisão de nome (Cenário 201 vs 400)
  const payload = JSON.stringify({
    nome: `Produto Spike ${Math.random() * 10000}`,
    preco: 470,
    descricao: "Mouse",
    quantidade: 381
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer SEU_TOKEN_AQUI' // Necessário para evitar 401
    },
  };

  // 1. Cenário Sucesso (201) e Conflito (400)
  let res = http.post(url, payload, params);
  
  check(res, {
    'status é 201 ou 400': (r) => r.status === 201 || r.status === 400,
    'mensagem de sucesso ou nome já utilizado': (r) => 
      r.json().message === 'Cadastro realizado com sucesso' || 
      r.json().message === 'Já existe produto com esse nome',
  });

  // 2. Cenário Não Autorizado (401) - Simulado enviando sem token
  let res401 = http.post(url, payload, { headers: { 'Content-Type': 'application/json' } });
  check(res401, {
    'status é 401 (Token ausente)': (r) => r.status === 401,
  });

  // 3. Cenário Proibido (403) - Simulado com token de usuário comum (não admin)
  // Nota: Requer um token gerado com administrador = false
  const paramsNonAdmin = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer TOKEN_NON_ADMIN' 
    },
  };
  let res403 = http.post(url, payload, paramsNonAdmin);
  check(res403, {
    'status é 403 (Rota exclusiva admin)': (r) => r.status === 403,
  });

  sleep(1);
}