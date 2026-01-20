import http from 'k6/http';
import { check } from 'k6';
import { Trend, Counter, Rate, Gauge } from 'k6/metrics';

//  Criando métricas customizadas
const tempoRequisicao = new Trend('tempo_requisicao'); // média, p90, p95...
const totalErros = new Counter('total_erros');          // soma total de erros
const taxaSucesso = new Rate('taxa_sucesso');           // % de respostas com sucesso
const ultimoTempo = new Gauge('ultimo_tempo');          // guarda o último tempo medido

export const options = {
    vus: 5,
    iterations: 10,
};

export default function () {
    const res = http.get('http://localhost:3000/produtos');

    //  Adiciona o tempo da requisição em milissegundos
    tempoRequisicao.add(res.timings.duration);
    ultimoTempo.add(res.timings.duration);

    //  Verifica se o status retornou 200
    const sucesso = check(res, { 'status é 200': (r) => r.status === 200 });

    //  Registra nas métricas
    taxaSucesso.add(sucesso);
    if (!sucesso) totalErros.add(1);
}