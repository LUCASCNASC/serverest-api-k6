import { fazerLogin } from "../utils/auth.js";
import http from 'k6/http';
import { check } from 'k6';

export const options = {
    vus: 1,
    duration: '30s',
};

export function setup() {
    const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
    const authToken = fazerLogin(baseUrl);
    return { authToken, baseUrl };
}

export default function (data) {
    const protectedHeaders = {
        'Content-Type': 'application/json',
        'Authorization': data.authToken,
    };
    const res = http.get(`${data.baseUrl}/produtos`, { headers: protectedHeaders });
    check(res, {
        'acesso a produtos bem sucedido': (r) => r.status === 200,
    });
};