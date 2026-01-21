import http from 'k6/http';
import { check } from 'k6';
import { fazerLogin } from "../utils/auth.js";

export function setup() {
    const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
    const authToken = fazerLogin(baseUrl);
    return { authToken, baseUrl };
}

export default function (data) {
    const protectedHeaders = {
        'Content-Type': 'application/json',
        'Authorization': data.authToken,
    };

    const produto = http.post(`${data.baseUrl}/produtos`, JSON.stringify({
        nome: 'Produto Tes312312te',
        preco: 120,
        descricao: 'Produto criado via teste automatizado',
        quantidade: 10,
    }), { headers: protectedHeaders });
    check(produto, {
        'produto criado com sucesso': (r) => r.status === 201,
    });
    const idProduto = produto.json('_id');

    const resGet = http.get(`${data.baseUrl}/produtos/${idProduto}`, { headers: protectedHeaders });
    check(resGet, {
        'consulta produtos': (r) => r.status === 200,
    });

    const resPut = http.put(`${data.baseUrl}/produtos/${idProduto}`, JSON.stringify({
        nome: 'Produto Tes312312te',
        preco: 150,
        descricao: 'Produto criado via teste automatizado',
        quantidade: 10,
    }), { headers: protectedHeaders });
    check(resPut, {
        'produto atualizado': (r) => r.status === 200,
    });

    const resDelete = http.del(`${data.baseUrl}/produtos/${idProduto}`, null, { headers: protectedHeaders });
    check(resDelete, {
        'produto deletado': (r) => r.status === 200,
    });

}