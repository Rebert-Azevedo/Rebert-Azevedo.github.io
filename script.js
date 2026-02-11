let filtrosAtivos = { STATUS: 'TODOS', TIPO: 'TODOS' };

async function lerExcel(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            resolve(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: "" }));
        };
        reader.readAsArrayBuffer(file);
    });
}

function extrairInfoConta(original) {
    let str = original.toString().trim();
    let match = str.match(/^(\d{11,15})(.*)$/);
    
    if (match) {
        return {
            contabil: match[1],
            bancaria: match[2] ? match[2].replace(/^\.+/, '') : "" 
        };
    }
    return { contabil: str, bancaria: "" };
}

function aplicarMascaraExibicao(conta) {
    let s = conta.replace(/\D/g, ''); 
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
        const idxNum = row.findIndex(c => c?.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === "numero");
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
    if (!fDez || !fJan) return alert("Selecione os arquivos!");

    const rowsDez = await lerExcel(fDez);
    const rowsJan = await lerExcel(fJan);
    const colDez = mapearColunas(rowsDez, ["atual"]);
    const colJan = mapearColunas(rowsJan, ["anterior"]);

    const mapaDez = {}, mapaJan = {};

    rowsDez.slice(colDez.linhaInicio).forEach(row => {
        const raw = row[colDez.numero]?.toString().trim();
        const valor = limparValorContabil(row[colDez.saldo]);
        if (raw) mapaDez[raw] = valor;
    });

    rowsJan.slice(colJan.linhaInicio).forEach(row => {
        const raw = row[colJan.numero]?.toString().trim();
        const valor = limparValorContabil(row[colJan.saldo]);
        if (raw) mapaJan[raw] = valor;
    });

    const todasContasRaw = Array.from(new Set([...Object.keys(mapaDez), ...Object.keys(mapaJan)])).sort();
    const corpo = document.getElementById('corpoTabela');
    corpo.innerHTML = '';
    
    let tDez = 0, tJan = 0, tDiff = 0, divTotal = 0;

    for (let i = 0; i < todasContasRaw.length; i++) {
        const rawAtual = todasContasRaw[i];
        const rawProx = todasContasRaw[i + 1] || "";
        
        const info = extrairInfoConta(rawAtual);
        const sAtual = info.contabil.replace(/0+$/, '');
        const sProx = extrairInfoConta(rawProx).contabil;
        
        const tipo = (sProx.startsWith(sAtual) && sAtual !== "") ? "SINTETICA" : "ANALITICA";
        const vDez = mapaDez[rawAtual] || 0;
        const vJan = mapaJan[rawAtual] || 0;
        const diff = Math.round((vJan - vDez) * 100) / 100;
        const sit = Math.abs(diff) > 0.01 ? "DIVERGENTE" : "OK";

        if (vDez !== 0 || vJan !== 0) {
            if (tipo === "ANALITICA") { tDez += vDez; tJan += vJan; tDiff += diff; }

            const tr = document.createElement('tr');
            tr.setAttribute('data-status', sit);
            tr.setAttribute('data-tipo', tipo);
            if (sit === "DIVERGENTE") { tr.className = 'erro-linha'; divTotal++; }

            tr.innerHTML = `
                <td style="color: ${tipo === 'ANALITICA' ? '#3b82f6' : '#8e44ad'}">${tipo}</td>
                <td>${aplicarMascaraExibicao(info.contabil)}</td>
                <td>${info.bancaria || "---"}</td>
                <td style="text-align:right">R$ ${vDez.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
                <td style="text-align:right">R$ ${vJan.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
                <td style="text-align:right; font-weight:bold">R$ ${diff.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
                <td style="text-align:center">${sit === "OK" ? "✅ OK" : "❌ DIVERGENTE"}</td>
            `;
            corpo.appendChild(tr);
        }
    }

    document.getElementById('peTabela').innerHTML = `
        <tr>
            <td colspan="3" style="text-align:right">TOTAIS (ANALÍTICAS):</td>
            <td style="text-align:right">R$ ${tDez.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
            <td style="text-align:right">R$ ${tJan.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
            <td style="text-align:right">R$ ${tDiff.toLocaleString('pt-BR', {minimumFractionDigits:2})}</td>
            <td></td>
        </tr>`;

    document.getElementById('resultadoArea').style.display = 'block';
    document.getElementById('statusBox').innerText = `Contas: ${todasContasRaw.length} | Divergências: ${divTotal}`;
    document.getElementById('statusBox').style.backgroundColor = divTotal > 0 ? "#ffeaa7" : "#d4edda";
    aplicarFiltrosCruzados();
}

function setFiltro(cat, val) {
    filtrosAtivos[cat] = val;
    const botoes = cat === 'TIPO' ? ['T-TODOS', 'ANALITICA', 'SINTETICA'] : ['TODOS', 'DIVERGENTE', 'OK'];
    botoes.forEach(b => document.getElementById('btn-' + b).classList.remove('active'));
    document.getElementById((val === 'TODOS' && cat === 'TIPO' ? 'btn-T-TODOS' : 'btn-' + val)).classList.add('active');
    aplicarFiltrosCruzados();
}

function aplicarFiltrosCruzados() {
    const linhas = document.querySelectorAll('#corpoTabela tr');
    linhas.forEach(linha => {
        const s = linha.getAttribute('data-status'), t = linha.getAttribute('data-tipo');
        linha.style.display = ((filtrosAtivos.STATUS === 'TODOS' || s === filtrosAtivos.STATUS) && 
                              (filtrosAtivos.TIPO === 'TODOS' || t === filtrosAtivos.TIPO)) ? '' : 'none';
    });
}