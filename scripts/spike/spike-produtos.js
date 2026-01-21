import http from 'k6/http';
import { check } from 'k6';

export const options = {
    stages: [
        { duration: '10s', target: 10 },
        { duration: '10s', target: 500 },
        { duration: '1m', target: 500 },
        { duration: '10s', target: 0 },
    ],
};

export default function () {
    const res = http.get('http://localhost:3000/produtos');
    check(res, { 'status é 200': (r) => r.status === 200 });
}