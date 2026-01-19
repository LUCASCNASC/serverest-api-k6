import http from 'k6/http';

export const options = {
  scenarios: {
    aumento_gradual: {
      executor: 'ramping-vus',//Trabalhando com options3
      startVUs: 1, // começa com 1 usuário
      stages: [
        { duration: '10s', target: 5 },  // sobe para 5 VUs em 10s
        { duration: '10s', target: 10 }, // sobe para 10 VUs em 10s
        { duration: '10s', target: 0 },  // reduz até 0 VUs
      ],
    },
  },};

export default function () {
  http.get('http://localhost:3000/produtos');}