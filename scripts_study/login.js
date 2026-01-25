import http from 'k6/http';
import { check } from 'k6';

export function setup() {
    const loginPayload = JSON.stringify({
        "email": "fulano@qa.com",
        "password": "teste",
    });

    const loginHeaders = { 'Content-Type': 'application/json' };
    const loginRes = http.post('http://localhost:3000/login', loginPayload, { headers: loginHeaders });
    check(loginRes, {
        'login bem sucedido': (r) => r.status === 200,
    });

    const authToken = loginRes.json('authorization');
    console.log(`Token de autenticação: ${authToken}`);
    return { authToken };
}

export default function (data) {
    const protectedHeaders = {
        'Content-Type': 'application/json',
        'Authorization': data.authToken,
    };
    const res = http.get('http://localhost:3000/produtos', { headers: protectedHeaders });
};