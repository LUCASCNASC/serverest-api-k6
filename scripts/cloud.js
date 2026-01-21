import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    stages: [
        { duration: '10s', target: 10 },
        { duration: '10s', target: 10 },
        { duration: '10s', target: 0 }
    ],
    thresholds: {
        http_req_duration: ['p(95)<200'],
        http_req_failed: ['rate<0.05']
    },
    cloud: {
        projectID: 5718144,
        name: 'Execução Exemplo curso'
    }
};

export default function () {
    const res = http.get('https://serverest.dev/carrinhos');
    check(res, {
        'status é 200': r => r.status === 200
    });

    sleep(1);
}