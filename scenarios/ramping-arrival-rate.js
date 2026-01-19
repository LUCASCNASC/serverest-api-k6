import http from 'k6/http';

export const options = {
  scenarios: {
    taxa_variavel: {
      executor: 'ramping-arrival-rate',
      startRate: 5,          // começa com 5 requisições por segundo
      timeUnit: '1s',        // intervalo base de medição
      preAllocatedVUs: 10,   // VUs pré-criados
      stages: [
        { duration: '10s', target: 10 }, // sobe até 10 req/s
        { duration: '10s', target: 20 }, // sobe até 20 req/s
        { duration: '10s', target: 0 },  // reduz até parar
      ], //Trabalhando com options6
    },
  },};

export default function () {
  http.get('http://localhost:3000/produtos');




}