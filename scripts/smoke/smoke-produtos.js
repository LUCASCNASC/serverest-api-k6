import http from 'k6/http';
import { check } from 'k6';

export const options = { vus: 1, duration: '5s' };

export default function () {
    const res = http.get('http://localhost:3000/produtos');
    check(res, {
        'status é 200': (r) => r.status === 200,
    });
}