import http from 'k6/http';
import { check } from 'k6';

export function fazerLogin(baseUrl) {
    const loginPayload = JSON.stringify({
        "email": "fulano@qa.com",
        "password": "teste",
    });

    const loginHeaders = { 'Content-Type': 'application/json' };
    const loginRes = http.post(`${baseUrl}/login`, loginPayload, { headers: loginHeaders });
    check(loginRes, {
        'login bem sucedido': (r) => r.status === 200,
    });

    const authToken = loginRes.json('authorization');
    console.log(`Token de autenticação: ${authToken}`);
    return authToken;
}