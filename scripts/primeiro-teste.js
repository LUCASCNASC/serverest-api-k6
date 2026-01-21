import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
    vus: 5,
    iterations: 10000,
};

export function setup() {
    console.log('Iniciando Teste')
    return { baseUrl: 'http://localhost:3000' }
}

export default function (data) {
    const res = http.get(`${data.baseUrl}/produtos`);

    check(res, {
        'Status = 200': (r) => r.status === 200,
        'resposta contem produtos': (r) => r.body.includes('produtos'),
    });

}

export function teardown() {
    console.log('Finalizando Teste')
}
