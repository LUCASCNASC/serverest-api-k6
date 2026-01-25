import http from 'k6/http';
import { check } from 'k6';

export const options = {
    thresholds: {
        'http_req_duration{expected_response:true}': ['p(95)<6'],
        'http_req_duration{expected_response:false}': ['p(95)<10'],
    },
};

export default function () {
    const res = http.get('http://localhost:3000/usuarios/0uxuPY0cbmQhpEz1');

    check(res, {
        'status 200 ou 404': (r) => [200, 404].includes(r.status),
    });
};