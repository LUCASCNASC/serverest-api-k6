import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    scenarios: {
        cenario1: {
            executor: 'constant-vus',
            vus: 5,
            duration: '15s',
            startTime: '0s',
        },
        cenario2: {
            executor: 'shared-iterations',
            vus: 3,
            iterations: 9,
            startTime: '0s',
        },
    },
};

export function setup() {
    console.log('Iniciando o teste...');
    return { baseUrl: 'http://localhost:3000' };
};

export default function (data) {
    http.get(`${data.baseUrl}/produtos`);
    sleep(1);
};

export function teardown() {
    console.log('Encerrando o teste.');
};