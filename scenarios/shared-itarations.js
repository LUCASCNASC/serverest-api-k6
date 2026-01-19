import http from 'k6/http'
export const options = {
  scenarios: {
    iteracoes_compartilhadas: {
      executor: 'shared-iterations',
      vus: 4,          // 4 usuários virtuais
      iterations: 12,  // 12 iterações no total
    },
  },}; // Trabalhando com options4

  export default function () {
  http.get('http://localhost:3000/produtos');
  }