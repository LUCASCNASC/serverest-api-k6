import http from 'k6/http';
import { group, check } from 'k6';


export const options = {
    vus: 10,
    duration: '10s',
    thresholds: {
        'http_req_duration{modulo:catalogo}': ['p(95)<9'],
        'http_req_duration{modulo:admin}': ['p(95)<9'],
        'http_req_duration{acao:listar}': ['p(95)<9'],

        'http_req_duration{group:::01 - Listar produtos}': ['p(95)<8'],
    },
};

export default function () {

    group('01 - Listar produtos', () => {
        http.get('http://localhost:3000/produtos', {
            tags: {
                endpoint: 'produtos',
                acao: 'listar',
                modulo: 'catalogo'
            }
        });
    });

    group('02 - Detalhar produto', () => {
        http.get('http://localhost:3000/produtos/BeeJh5lz3k6kSIzA', {
            tags: {
                endpoint: 'produtos',
                acao: 'detalhar',
                modulo: 'catalogo'
            }
        });
    });

    group('03 - Listar usuários', () => {
        http.get('http://localhost:3000/usuarios', {
            tags: {
                endpoint: 'usuarios',
                acao: 'listar',
                modulo: 'admin'
            }
        });
    });

}