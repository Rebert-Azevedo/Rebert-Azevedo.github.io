let filtrosAtivos = { STATUS: "TODOS", TIPO: "TODOS" };

async function lerExcel(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      resolve(
        XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
          header: 1,
          defval: "",
        }),
      );
    };
    reader.readAsArrayBuffer(file);
  });
}

function aplicarMascaraExibicao(conta) {
  let s = conta.replace(/\D/g, "");
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

function extrairInfoConta(original) {
  let str = original.toString().trim();
  
  // 1. Tenta separar por espaço (ex: "1.1.1.1.1 12345")
  let parts = str.split(/\s+(.+)/);
  if (parts.length > 1 && parts[1].trim()) {
    return { contabil: parts[0].replace(/\./g, ""), bancaria: parts[1].trim() };
  }

  // 2. Se não tem espaço, verifica se excede 15 dígitos (padrão PCASP)
  let raw = str.replace(/\./g, "");
  if (raw.length > 15) {
    return { contabil: raw.substring(0, 15), bancaria: raw.substring(15) };
  }

  return { contabil: raw, bancaria: "" };
}

function limparValorContabil(valor) {
  if (typeof valor === "number") return valor;
  if (!valor) return 0;
  let str = valor.toString().trim();
  if (str.includes(",")) str = str.replace(/\./g, "").replace(",", ".");
  return parseFloat(str.replace(/[^\d.-]/g, "")) || 0;
}

function getContaSignificativa(contaRaw) {
  // Máscara PCASP: 1, 1, 1, 1, 1, 2, 2, 2, 2, 2
  const niveis = [1, 2, 3, 4, 5, 7, 9, 11, 13, 15];
  let len = contaRaw.length;
  for (let i = niveis.length - 1; i >= 0; i--) {
    const fim = niveis[i];
    const inicio = i === 0 ? 0 : niveis[i - 1];
    if (fim > len) continue;
    const parte = contaRaw.substring(inicio, fim);
    if (parseInt(parte, 10) !== 0) {
      return contaRaw.substring(0, fim);
    }
  }
  return contaRaw.replace(/0+$/, "");
}

async function processarArquivos() {
  const fDez = document.getElementById("arquivoAnterior").files[0];
  const fJan = document.getElementById("arquivoAtual").files[0];

  // Função auxiliar para ler um valor de célula específica do Excel
  async function lerValorCelula(file, cell) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const cellValue = sheet[cell] ? sheet[cell].v : "";
        resolve(cellValue);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  // Ler os nomes das entidades das células C1 dos arquivos
  const nomecompetenciaAnterior = await lerValorCelula(fDez, "C1");
  const nomecompetenciaAtual = await lerValorCelula(fJan, "C1");

  // Atualizar os labels com os nomes das entidades
  document.getElementById("competenciaAnterior").innerText = nomecompetenciaAnterior;
  document.getElementById("competenciaAtual").innerText = nomecompetenciaAtual;



  if (!fDez || !fJan) return alert("Selecione os arquivos!");

  const rowsDez = await lerExcel(fDez);
  const rowsJan = await lerExcel(fJan);

  const hDez = rowsDez.find((r) =>
    r.some((c) => c && c.toString().includes("Número")),
  );
  const colNum = hDez.indexOf("Número");
  const colDesc = hDez.indexOf("Descrição");
  const colSDez = hDez.indexOf("Saldo Atual");

  const hJan = rowsJan.find((r) =>
    r.some((c) => c && c.toString().includes("Número")),
  );
  const colSJan = hJan.indexOf("Saldo Anterior");

  const mapaDez = {},
    mapaJan = {},
    mapaNomes = {};

  rowsDez.forEach((r) => {
    if (r[colNum]) {
      const conta = r[colNum].toString().trim();
      mapaDez[conta] = limparValorContabil(r[colSDez]);
      mapaNomes[conta] = r[colDesc] || "---";
    }
  });

  rowsJan.forEach((r) => {
    if (r[colNum])
      mapaJan[r[colNum].toString().trim()] = limparValorContabil(r[colSJan]);
  });

  const todasContasRaw = Array.from(
    new Set([...Object.keys(mapaDez), ...Object.keys(mapaJan)]),
  ).sort();
  const corpo = document.getElementById("corpoTabela");
  corpo.innerHTML = "";

  let tDez = 0,
    tJan = 0,
    divTotal = 0;
  const listaDivergentes = new Set();

  todasContasRaw.forEach((raw) => {
    const vDez = mapaDez[raw] || 0,
      vJan = mapaJan[raw] || 0;
    if (Math.abs(Math.round((vJan - vDez) * 100) / 100) > 0.01)
      listaDivergentes.add(raw);
  });

  todasContasRaw.forEach((rawAtual, i) => {
    const info = extrairInfoConta(rawAtual);
    const raizAtual = getContaSignificativa(info.contabil);
    const sProx = (todasContasRaw[i + 1] || "").toString().replace(/\D/g, "");
    
    const tipo =
      sProx.startsWith(raizAtual) && sProx.length > raizAtual.length
        ? "SINTETICA"
        : "ANALITICA";
    const ehGrupoPai = tipo === "SINTETICA";

    const vDez = mapaDez[rawAtual] || 0,
      vJan = mapaJan[rawAtual] || 0;
    const diff = Math.round((vJan - vDez) * 100) / 100;
    const sit = Math.abs(diff) > 0.01 ? "DIVERGENTE" : "OK";
    const temErroInterno = Array.from(listaDivergentes).some(
      (d) => d.startsWith(raizAtual) && d !== rawAtual,
    );

    if (vDez !== 0 || vJan !== 0) {
      if (tipo === "ANALITICA") {
        tDez += vDez;
        tJan += vJan;
      }

      const tr = document.createElement("tr");
      tr.setAttribute("data-status", sit);
      tr.setAttribute("data-tipo", tipo);
      tr.setAttribute("data-path", info.contabil);
      tr.setAttribute("data-root", raizAtual);

      if (raizAtual.length > 1) tr.classList.add("row-hidden");

      if (ehGrupoPai) {
        tr.className = "row-sintetica collapsed";
        if (temErroInterno) tr.classList.add("tem-erro-filho");
        tr.onclick = () => toggleGrupo(raizAtual, tr);
      } else if (tipo === "SINTETICA" && temErroInterno) {
        tr.classList.add("tem-erro-filho");
        tr.classList.add("row-sintetica");
      } else if (tipo === "ANALITICA") {
        tr.classList.add("row-analitica");
      }

      if (sit === "DIVERGENTE") {
        tr.classList.add("erro-linha");
        divTotal++;
      }

      const icone = ehGrupoPai
        ? '<span class="group-icon">▼</span>'
        : '<span style="margin-right:24px"></span>';

      tr.innerHTML = `
                <td>${icone} ${tipo}</td>
                <td>${aplicarMascaraExibicao(info.contabil)}</td>
                <td>${mapaNomes[rawAtual] || "---"}</td>
                <td>${info.bancaria || "---"}</td>
                <td style="text-align:right">R$ ${vDez.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                <td style="text-align:right">R$ ${vJan.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                <td style="text-align:right; font-weight:bold">R$ ${diff.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                <td style="text-align:center">${sit === "OK" ? "✅ OK" : "❌ DIVERGENTE"}</td>
            `;
      corpo.appendChild(tr);
    }
  });

  document.getElementById("peTabela").innerHTML =
    `<tr><td colspan="4" style="text-align:right">TOTAL ANALÍTICAS:</td><td style="text-align:right">R$ ${tDez.toLocaleString("pt-BR")}</td><td style="text-align:right">R$ ${tJan.toLocaleString("pt-BR")}</td><td></td><td></td></tr>`;
  document.getElementById("resultadoArea").style.display = "block";
  document.getElementById("statusBox").innerText =
    `Divergências Analíticas: ${divTotal}`;
}

function toggleGrupo(raizPai, elPai) {
  const rows = Array.from(document.querySelectorAll("#corpoTabela tr"));
  const isCollapsed = elPai.classList.contains("collapsed");

  let childrenVisible = false;
  const firstChild = rows.find((r) => {
    if (r === elPai) return false;
    const path = r.getAttribute("data-path");
    return path && path.startsWith(raizPai + ".");
  });

  if (firstChild) {
    childrenVisible =
      !firstChild.classList.contains("row-hidden") &&
      firstChild.style.display !== "none";
  }

  const recolher = !isCollapsed || childrenVisible;

  elPai.classList.toggle("collapsed", recolher);

  rows.forEach((linha) => {
    if (linha === elPai) return;
    const path = linha.getAttribute("data-path");
    if (path && path.startsWith(raizPai + "."))
      linha.classList.toggle("row-hidden", recolher);
  });
}

function recolherTudo() {
  const rows = document.querySelectorAll("#corpoTabela tr");
  rows.forEach((row) => {
    const raiz = row.getAttribute("data-root");
    if (!raiz) return;

    if (row.classList.contains("row-sintetica")) row.classList.add("collapsed");

    if (raiz.length === 1) {
      row.classList.remove("row-hidden");
    } else {
      row.classList.add("row-hidden");
    }
  });
}
function expandirTudo() {
  document.querySelectorAll(".row-sintetica").forEach((el) => {
    el.classList.remove("collapsed");
  });
  document.querySelectorAll("#corpoTabela tr").forEach((el) => {
    el.classList.remove("row-hidden");
  });
}

function setFiltro(cat, val) {
  filtrosAtivos[cat] = val;
  document.querySelectorAll(".filter-section button").forEach((b) => {
    const btnVal = b.id.replace("btn-", "");
    const btnCat =
      b.id.includes("SINTETICA") ||
      b.id.includes("ANALITICA") ||
      b.id.includes("TODOS_TIPO")
        ? "TIPO"
        : "STATUS";
    b.classList.toggle("active", filtrosAtivos[btnCat] === btnVal);
  });
  aplicarFiltros();
}

function aplicarFiltros() {
  const rows = document.querySelectorAll("#corpoTabela tr");

  rows.forEach((row) => {
    const sit = row.getAttribute("data-status");
    const tipo = row.getAttribute("data-tipo");

    const statusMatch =
      filtrosAtivos.STATUS === "TODOS" ||
      filtrosAtivos.STATUS === "TODOS_STATUS" ||
      filtrosAtivos.STATUS === sit;

    const tipoMatch =
      filtrosAtivos.TIPO === "TODOS" ||
      filtrosAtivos.TIPO === "TODOS_TIPO" ||
      filtrosAtivos.TIPO === tipo;

    if (statusMatch && tipoMatch) {
      row.style.display = "";
      row.classList.remove("row-hidden");
    } else {
      row.style.display = "none";
    }
  });
}
