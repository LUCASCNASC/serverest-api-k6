import { fazerLogin } from "../utils/auth.js";
import http from 'k6/http';
import { check } from 'k6';

const produtos = JSON.parse(open('../stores/produtos.json'));

export const options = {
    vus: 1,
    iterations: produtos.length,
};

export function setup() {
    const baseUrl = 'http://localhost:3000';
    const authToken = fazerLogin(baseUrl);
    return { baseUrl, authToken };
}

export default function (data) {

    const produto = produtos[__ITER];

    const protectHeaders = {
        'Content-Type': 'application/json',
        'authorization': data.authToken,
    };

    console.log(`Cadastrando produto: ${JSON.stringify(produto)}`);

    const res = http.post(`${data.baseUrl}/produtos`, JSON.stringify(produto), { headers: protectHeaders });
    console.log(`Resposta do servidor: ${res.status} - ${res.body}`);
    check(res, {
        'produto cadastrado com sucesso': (r) => r.status === 201,
    });

}