import http from 'k6/http';
import { check, sleep } from 'k6';

// 1. Configuração de Spike (Sobe rápido, mantém o pico e desce rápido)
export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Aquecimento rápido
    { duration: '30s', target: 500 }, // Spike extremo (Pico de carga)
    { duration: '10s', target: 50 },  // Recuperação pós-spike
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'],      // Aceita no máximo 10% de erro no pico
    http_req_duration: ['p(95)<2000'],   // 95% das reqs devem responder em até 2s no surto
  },
};

const BASE_URL = 'https://serverest.dev';

export default function () {
  const headers = { 'Content-Type': 'application/json' };
  const random = Math.floor(Math.random() * 1000000);
  const email = `spike_${random}@qa.com.br`;
  let token, userId, productId;

  // --- CENÁRIO 1: CADASTRO DE USUÁRIO (POST /usuarios) ---
  const userPayload = JSON.stringify({
    nome: "Usuário Spike",
    email: email,
    password: "teste",
    administrador: "true"
  });

  let resUser = http.post(`${BASE_URL}/usuarios`, userPayload, { headers });
  check(resUser, { 'Usuário Cadastrado (201)': (r) => r.status === 201 }); //
  userId = resUser.json()._id;

  // --- CENÁRIO 2: LOGIN (POST /login) ---
  const loginPayload = JSON.stringify({ email: email, password: "teste" });
  let resLogin = http.post(`${BASE_URL}/login`, loginPayload, { headers });
  check(resLogin, { 'Login Realizado (200)': (r) => r.status === 200 }); //
  token = resLogin.json().authorization;

  const authHeaders = { ...headers, 'Authorization': token };

  // --- CENÁRIO 3: GESTÃO DE PRODUTOS (POST /produtos) ---
  const prodPayload = JSON.stringify({
    nome: `Produto Spike ${random}`,
    preco: 100,
    descricao: "Mouse Gamer",
    quantidade: 500
  });

  let resProd = http.post(`${BASE_URL}/produtos`, prodPayload, { headers: authHeaders });
  check(resProd, { 'Produto Cadastrado (201)': (r) => r.status === 201 }); //
  productId = resProd.json()._id;

  // --- CENÁRIO 4: CARRINHOS (POST /carrinhos) ---
  const cartPayload = JSON.stringify({
    produtos: [{ idProduto: productId, quantidade: 1 }]
  });

  let resCart = http.post(`${BASE_URL}/carrinhos`, cartPayload, { headers: authHeaders });
  check(resCart, { 'Carrinho Criado (201)': (r) => r.status === 201 }); //

  // --- CENÁRIO 5: FINALIZAÇÃO (DELETE /carrinhos/concluir-compra) ---
  // Essencial para liberar estoque e permitir deleção do usuário
  let resFinish = http.del(`${BASE_URL}/carrinhos/concluir-compra`, null, { headers: authHeaders });
  check(resFinish, { 'Compra Concluída (200)': (r) => r.status === 200 }); //

  // --- LIMPEZA: EXCLUSÃO DE USUÁRIO (DELETE /usuarios) ---
  if (userId) {
    http.del(`${BASE_URL}/usuarios/${userId}`); //
  }

  sleep(1);
}