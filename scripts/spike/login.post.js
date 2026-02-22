import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuração de Spike: Sobe rápido, mantém o pico e desce rápido
export const options = {
  stages: [
    { duration: '10s', target: 50 },  // Aquecimento rápido
    { duration: '30s', target: 500 }, // Pico extremo (Spike)
    { duration: '10s', target: 50 },  // Recuperação rápida
    { duration: '5s', target: 0 },
  ],
  thresholds: {
    http_req_failed: ['rate<0.10'], // Aceita até 10% de falha durante o pico extremo
    http_req_duration: ['p(95)<2000'], // 95% das reqs devem responder em até 2s no surto
  },
};

const BASE_URL = 'https://serverest.dev';

export default function () {
  const headers = { 'Content-Type': 'application/json' };
  const random = Math.floor(Math.random() * 1000000);
  const email = `spike_user_${random}@qa.com.br`;
  
  // --- CENÁRIO 1: USUÁRIOS (POST, GET, PUT) ---
  const userPayload = JSON.stringify({
    nome: "Usuário Spike",
    email: email,
    password: "teste",
    administrador: "true"
  });

  // Cadastro (201)
  let res = http.post(`${BASE_URL}/usuarios`, userPayload, { headers });
  check(res, { 'Cadastro Sucesso': (r) => r.status === 201 });
  let userId = res.json()._id;

  // Listagem Geral (200)
  http.get(`${BASE_URL}/usuarios`);

  // --- CENÁRIO 2: LOGIN ---
  const loginPayload = JSON.stringify({ email: email, password: "teste" });
  res = http.post(`${BASE_URL}/login`, loginPayload, { headers });
  check(res, { 'Login Sucesso': (r) => r.status === 200 }); //
  let token = res.json().authorization;

  // --- CENÁRIO 3: PRODUTOS ---
  const prodPayload = JSON.stringify({
    nome: `Produto Spike ${random}`,
    preco: 100,
    descricao: "Teclado",
    quantidade: 50
  });

  const authHeaders = { ...headers, 'Authorization': token };
  
  // Cadastro Produto (201)
  res = http.post(`${BASE_URL}/produtos`, prodPayload, { headers: authHeaders });
  let productId = res.json()._id;

  // --- CENÁRIO 4: CARRINHOS ---
  const cartPayload = JSON.stringify({
    produtos: [{ idProduto: productId, quantidade: 1 }]
  });

  // Criar Carrinho (201)
  res = http.post(`${BASE_URL}/carrinhos`, cartPayload, { headers: authHeaders });
  check(res, { 'Carrinho Criado': (r) => r.status === 201 });

  // --- CENÁRIO 5: FINALIZAÇÃO/LIMPEZA ---
  // Concluir Compra (200)
  http.del(`${BASE_URL}/carrinhos/concluir-compra`, null, { headers: authHeaders });

  // Excluir Usuário (200)
  if (userId) {
    http.del(`${BASE_URL}/usuarios/${userId}`);
  }

  sleep(1);
}