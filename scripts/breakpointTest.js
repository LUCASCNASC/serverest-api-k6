import http from 'k6/http';
import { check } from 'k6'; 

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '30s', target: 300 },   
    { duration: '30s', target: 600 },
    { duration: '30s', target: 900 },
    { duration: '30s', target: 1200 },
  ],
};
  
export default function () {
  const res = http.get('http://localhost:3000/usuarios');
  check(res, { 'status é 200': (r) => r.status === 200, });
}