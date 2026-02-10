async function lerExcel(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
            resolve(rows);
        };
        reader.readAsArrayBuffer(file);
    });
}

function aplicarMascaraExibicao(conta) {
    if (!conta) return "";
    let s = conta.toString().replace(/\D/g, ''); 
    let m = "";
    if (s.length > 0) m += s[0];
    if (s.length > 1) m += "." + s[1];
    if (s.length > 2) m += "." + s[2];
    if (s.length > 3) m += "." + s[3];
    if (s.length > 4) m += "." + s[4];
    if (s.length > 5) m += "." + s.substring(5, 7);
    if (s.length > 7) m += "." + s.substring(7, 9);
    if (s.length > 9) m += "." + s.substring(9, 11);
    if (s.length > 11) m += "." + s.substring(11, 13);
    if (s.length > 13) m += "." + s.substring(13, 15);
    return m || s;
}

function mapearColunas(rows, nomesSaldos) {
    let indices = { numero: -1, saldo: -1, linhaInicio: 0 };
    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;
        const idxNum = row.findIndex(c => {
            const t = c?.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            return t === "numero";
        });
        const idxSaldo = row.findIndex(c => {
            const t = c?.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
            return nomesSaldos.some(n => t.includes(n));
        });
        if (idxNum !== -1 && idxSaldo !== -1) {
            indices.numero = idxNum; indices.saldo = idxSaldo; indices.linhaInicio = i + 1;
            return indices;
        }
    }
    return indices;
}

function limparValorContabil(valor) {
    if (valor === undefined || valor === null || valor === "") return 0;
    if (typeof valor === 'number') return valor;
    let str = valor.toString().trim();
    if (str.includes(',')) str = str.replace(/\./g, '').replace(',', '.');
    return parseFloat(str.replace(/[^\d.-]/g, '')) || 0;
}

async function processarArquivos() {
    const fDez = document.getElementById('fileDez').files[0];
    const fJan = document.getElementById('fileJan').files[0];
    if (!fDez || !fJan) return alert("Selecione os dois arquivos Excel!");

    const rowsDez = await lerExcel(fDez);
    const rowsJan = await lerExcel(fJan);

    const colDez = mapearColunas(rowsDez, ["atual"]);
    const colJan = mapearColunas(rowsJan, ["anterior"]);

    if (colDez.numero === -1 || colJan.numero === -1) return alert("Colunas 'Número' ou 'Saldo' não encontradas!");

    const mapaDez = {};
    const mapaJan = {};

    rowsDez.slice(colDez.linhaInicio).forEach(row => {
        const conta = row[colDez.numero]?.toString().trim();
        const valor = limparValorContabil(row[colDez.saldo]);
        if (conta) mapaDez[conta] = valor;
    });

    rowsJan.slice(colJan.linhaInicio).forEach(row => {
        const conta = row[colJan.numero]?.toString().trim();
        const valor = limparValorContabil(row[colJan.saldo]);
        if (conta) mapaJan[conta] = valor;
    });

    const todasContas = Array.from(new Set([...Object.keys(mapaDez), ...Object.keys(mapaJan)])).sort();
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = '';
    let divTotal = 0;

    for (let i = 0; i < todasContas.length; i++) {
        const contaAtual = todasContas[i];
        const contaProxima = todasContas[i + 1] || "";
        
        const sAtual = contaAtual.replace(/\D/g, '').replace(/0+$/, '');
        const sProxima = contaProxima.replace(/\D/g, '');

        // Lógica: se a próxima conta começa com a minha raiz, eu sou SINTÉTICA
        const tipoConta = (sProxima.startsWith(sAtual) && sAtual !== "") ? "SINTETICA" : "ANALITICA";

        const vDez = mapaDez[contaAtual] || 0;
        const vJan = mapaJan[contaAtual] || 0;
        const diff = Math.round((vJan - vDez) * 100) / 100;
        const situacao = Math.abs(diff) > 0.01 ? "DIVERGENTE" : "OK";

        if (vDez !== 0 || vJan !== 0) {
            const tr = document.createElement('tr');
            tr.setAttribute('data-status', situacao);
            tr.setAttribute('data-tipo', tipoConta);
            if (situacao === "DIVERGENTE") { tr.className = 'erro-linha'; divTotal++; }

            tr.innerHTML = `
                <td style="color: ${tipoConta === 'ANALITICA' ? '#3b82f6' : '#8e44ad'}">${tipoConta}</td>
                <td>${aplicarMascaraExibicao(contaAtual)}</td>
                <td style="text-align:right">R$ ${vDez.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
                <td style="text-align:right">R$ ${vJan.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
                <td style="text-align:right; font-weight:bold">R$ ${diff.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
                <td style="text-align:center">${situacao === "OK" ? "✅ OK" : "❌ DIVERGENTE"}</td>
            `;
            corpo.appendChild(tr);
        }
    }

    document.getElementById('resultadoArea').style.display = 'block';
    document.getElementById('statusBox').innerText = `Contas Analisadas: ${todasContas.length} | Divergências: ${divTotal}`;
    document.getElementById('statusBox').style.backgroundColor = divTotal > 0 ? "#ffeaa7" : "#d4edda";
}

function filtrarTabela(filtro) {
    const linhas = document.querySelectorAll('#corpoTabela tr');
    linhas.forEach(linha => {
        const s = linha.getAttribute('data-status');
        const t = linha.getAttribute('data-tipo');
        if (filtro === 'TODOS') linha.style.display = '';
        else if (filtro === 'OK' || filtro === 'DIVERGENTE') linha.style.display = (s === filtro) ? '' : 'none';
        else if (filtro === 'ANALITICA' || filtro === 'SINTETICA') linha.style.display = (t === filtro) ? '' : 'none';
    });
}