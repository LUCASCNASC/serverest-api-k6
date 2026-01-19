import http from 'k6/http';
export const options = {
  scenarios: {
    taxa_constante: {
      executor: 'constant-arrival-rate',
      rate: 20,             // 20 requisições por segundo
      timeUnit: '1s',       // a cada segundo
      duration: '15s',      // durante 15 segundos
      preAllocatedVUs: 5,   // VUs pré-alocados
    },
  },};
export default function () {
  http.get('http://localhost:3000/produtos');   
}