import http from 'k6/http';
import { check } from 'k6';

export default function () {
    const res = http.get('http://localhost:3000/produtos');

    check(res, {
        'status = 200': (r) => r.status === 200,
        'resposta contém produtos': (r) => r.body.includes('produto'),
        'quantidade produtos = 3': (r) => r.json('quantidade') === 3,
    });
}