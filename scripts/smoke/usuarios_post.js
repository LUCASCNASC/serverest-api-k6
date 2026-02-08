import http from 'k6/http';
import { check, group } from 'k6';

export const options = {
  vus: 1,
  duration: '5s',
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
  }
};

export function setup() {
  const baseUrl = 'https://serverest.dev';

  // Criar usuário único
  const email = `qa_${Date.now()}@test.com`;

  const userPayload = {
    nome: "QA Smoke Test",
    email,
    password: "123456",
    administrador: "true"
  };

  const createUser = http.post(`${baseUrl}/usuarios`, userPayload);

  check(createUser, {
    'Usuário criado': (r) => r.status === 201,
  });

  return { baseUrl, email };
}

export default function (data) {
  group('Login', () => {
    const loginPayload = {
      email: data.email,
      password: "123456"
    };

    
    const res = http.post(`${data.baseUrl}/login`, loginPayload);

    check(res, {
      'Login bem sucedido': (r) => r.status === 200,
      'Token retornado': (r) => !!r.json('authorization'),
    });
  });
}
