import http from 'k6/http';
import { sleep } from 'k6';

export const options = {
    scenarios: {
        cenario1: {
            executor: 'constant-vus', //mantém um número constante de VUs
            vus: 5,
            duration: '15s',
            startTime: '0s',
        },
        cenario2: {
            executor: 'shared-iterations', //compartilha um número fixo de iterações entre VUs
            vus: 3,
            iterations: 9,
            startTime: '0s',
        },
        cenario3: {
            executor: 'ramping-vus', //aumenta ou diminui o número de VUs durante o teste
            vus: 3,
            duration: '15s',
            startTime: '0s',
        },
        cenario4: {
            executor: 'constant-arrival-rate', //mantém uma taxa constante de requisições por segundo
            rate: 5,
            vus: 3,
            duration: '15s',
            startTime: '0s',
        },
        cenario5: {
            executor: 'ramping-arrival-rate', //aumenta ou diminui a taxa de requisições por segundo durante o teste
            startRate: 2,
            timeUnit: '1s',
            rate: 5,
            vus: 3,
            duration: '15s',
            startTime: '0s',
        },
    },
};

export function setup() {
    console.log('Iniciando o teste...');
    return { baseUrl: 'http://localhost:3000' };
}

export default function (data) {
    http.get(`${data.baseUrl}/produtos`);
    sleep(1);
}

export function teardown() {
    console.log('Encerrando o teste.');
}