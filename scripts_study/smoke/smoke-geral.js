import http from 'k6/http';
import { check, group } from 'k6';
import { fazerLogin } from '../../utils/auth.js';

export const options = {
    vus: 1,
    duration: '20s',

    thresholds: {
        http_req_duration: ['p(95)<1'],
        http_req_failed: ['rate<0.01'],
        checks: ['rate>0.99'],
    }
};

export function setup() {
    const baseUrl = 'http://localhost:3000';
    const authToken = fazerLogin(baseUrl);
    return { baseUrl, authToken };
}

export default function (data) {


    group('Listagem de Usuários', () => {
        const res = http.get(`${data.baseUrl}/usuarios`)

        check(res, {
            'listagem de usuários bem sucedida': (r) => r.status === 200,
            'lista usuarios válida': (r) => Array.isArray(r.json('usuarios')),
        });
    });

    group('Listagem de Produtos', () => {
        const res = http.get(`${data.baseUrl}/produtos`)

        check(res, {
            'listagem de produtos bem sucedida': (r) => r.status === 200,
            'lista produtos válida': (r) => Array.isArray(r.json('produtos')),
        });
    });


    group('Listagem de Carrinhos', () => {
        const res = http.get(`${data.baseUrl}/carrinhos`)

        check(res, {
            'listagem de carrinhos bem sucedida': (r) => r.status === 200,
            'lista carrinhos válida': (r) => Array.isArray(r.json('carrinhos')),
        });
    });

};