import http from 'k6/http';
import { check, group } from 'k6';

const BASE_URL = 'http://localhost:3000';

export const options = {
    scenarios: {
        produtos: {
            executor: 'constant-vus',
            vus: 50,
            duration: '10m',
            exec: 'fluxoProdutos',
        },
        usuarios: {
            executor: 'constant-vus',
            vus: 5,
            duration: '10m',
            exec: 'fluxoUsuarios',
        },
    },

    thresholds: {
        http_req_failed: ['rate<0.01'],
        checks: ['rate>0.95'],

        'http_req_duration{group:::Fluxo de Produtos}': ['p(95)<100'],
        'http_req_duration{group:::Fluxo de Usuários}': ['p(95)<50'],
    }
};

export function fluxoProdutos() {
    group('Fluxo de Produtos', () => {
        const resListar = http.get(`${BASE_URL}/produtos`);
        check(resListar, {
            'Listar Produtos - status 200': (r) => r.status === 200,
            'Listar Produtos - array valido': (r) => Array.isArray(r.json('produtos')),
        });

        const produtos = resListar.json('produtos');

        const index = Math.floor(Math.random() * produtos.length);
        const id = produtos[index]._id;

        const resDetalhe = http.get(`${BASE_URL}/produtos/${id}`);
        check(resDetalhe, {
            'Detalhe Produto - status 200': (r) => r.status === 200,
            'Detalhe tem nome': (r) => r.json('nome') !== undefined,
        });
    });
}

export function fluxoUsuarios() {
    group('Fluxo de Usuários', () => {
        const payload = JSON.stringify({
            nome: `Usuario${__VU}-${Date.now()}`,
            email: `usuario${__VU}-${Date.now()}@teste.com`,
            password: 'senha123',
            administrador: 'true',
        });

        const resCriar = http.post(`${BASE_URL}/usuarios`, payload, { headers: { 'Content-Type': 'application/json' } });

        check(resCriar, {
            'Criar Usuário - status 201': (r) => r.status === 201,
        });
        const id = resCriar.json('_id');

        const resDetalhe = http.get(`${BASE_URL}/usuarios/${id}`);
        check(resDetalhe, {
            'Detalhe Usuário - status 200': (r) => r.status === 200,
        });
    });
}; 