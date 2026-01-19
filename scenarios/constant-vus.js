import http from 'k6/http';
import { sleep, check } from 'k6';

export const options = {
    scenarios: {
        carga_constante: {
            executor: 'constant-vus',
            vus: 5,
            duration: '15s',
            startTime: '0s',
        }
    },
};

export default function (data) {
    const res = http.get('http://localhost:3000/produtos');
    check(res, {
        'Status é 200': (r) => r.status === 200,
    });
}
