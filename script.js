// === CONFIGURAÇÃO DO SISTEMA CEDESP ===
// IMPORTANTE: Substitua esta URL pela URL do seu Web App do Google Apps Script
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzNq3Hz1Pvlx3Ty4YGJvj0UM4jQNe2adOEQWyomzpTnBHooEzgHa1TGMWfcd8mpzTDe/exec";

// Detecta ambiente (local vs produção)
const IS_LOCAL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";
const API_URL = IS_LOCAL ? WEB_APP_URL : "/api/appsscript";

// === VARIÁVEIS GLOBAIS ===
let allStudentsRawData = [];
let currentFilteredStudents = [];
let selectedStudentId = null;

// === INICIALIZAÇÃO ===
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Sistema CEDESP Universal carregado");
  console.log("🔗 Usando API:", API_URL);

  inicializarToggleTheme();
  initializeEventListeners();
  initializeViewToggle();
  carregarTodosAlunos();
});

// === CONFIGURAÇÃO DE EVENTOS ===
function initializeEventListeners() {
  // Busca principal
  const searchButton = document.getElementById("searchButton");
  const clearSearchButton = document.getElementById("clearSearchButton");
  const showAllButton = document.getElementById("showAllButton");
  const searchInput = document.getElementById("searchInput");

  if (searchButton) searchButton.addEventListener("click", buscarAlunos);
  if (clearSearchButton)
    clearSearchButton.addEventListener("click", limparFiltros);
  if (showAllButton)
    showAllButton.addEventListener("click", carregarTodosAlunos);
  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") buscarAlunos();
    });
  }

  // Filtros
  const periodoFilter = document.getElementById("periodoFilter");
  const cursoFilter = document.getElementById("cursoFilter");

  if (periodoFilter) periodoFilter.addEventListener("change", aplicarFiltros);
  if (cursoFilter) cursoFilter.addEventListener("change", aplicarFiltros);

  // Painel de detalhes
  const closeDetailPanelButton = document.getElementById("closeDetailPanel");
  const updateNotesButton = document.getElementById("updateNotesButton");
  const markPresentButton = document.getElementById("markPresentButton");
  const markAbsentButton = document.getElementById("markAbsentButton");

  if (closeDetailPanelButton)
    closeDetailPanelButton.addEventListener("click", fecharPainelDetalhes);
  if (updateNotesButton)
    updateNotesButton.addEventListener("click", atualizarNotas);
  if (markPresentButton)
    markPresentButton.addEventListener("click", () =>
      registrarPresencaFalta("P")
    );
  if (markAbsentButton)
    markAbsentButton.addEventListener("click", () =>
      registrarPresencaFalta("A")
    );

  // Modal de registro
  const registerButton = document.getElementById("registerButton");
  const closeRegistrationModalButton = document.getElementById(
    "closeRegistrationModalButton"
  );
  const submitPresencaButton = document.getElementById("submitPresenca");

  if (registerButton)
    registerButton.addEventListener("click", abrirModalRegistro);
  if (closeRegistrationModalButton)
    closeRegistrationModalButton.addEventListener("click", fecharModalRegistro);
  if (submitPresencaButton)
    submitPresencaButton.addEventListener("click", submeterPresenca);
}

// === TEMA CLARO/ESCURO ===
function inicializarToggleTheme() {
  const toggleButton = document.querySelector(".theme-toggle");
  if (!toggleButton) return;

  const body = document.body;

  // Carrega tema salvo ou usa claro como padrão
  const temaSalvo = localStorage.getItem("theme") || "light";
  body.setAttribute("data-theme", temaSalvo);
  atualizarIconeTheme(temaSalvo);

  // Event listener para toggle
  toggleButton.addEventListener("click", function () {
    const temaAtual = body.getAttribute("data-theme");
    const novoTema = temaAtual === "light" ? "dark" : "light";

    body.setAttribute("data-theme", novoTema);
    localStorage.setItem("theme", novoTema);
    atualizarIconeTheme(novoTema);

    console.log(`🎨 Tema alterado para: ${novoTema}`);
  });
}

function atualizarIconeTheme(tema) {
  const sunIcon = document.querySelector(".theme-toggle .sun-icon");
  const moonIcon = document.querySelector(".theme-toggle .moon-icon");

  if (sunIcon && moonIcon) {
    if (tema === "light") {
      sunIcon.style.display = "none";
      moonIcon.style.display = "block";
    } else {
      sunIcon.style.display = "block";
      moonIcon.style.display = "none";
    }
  }
}

// === TOGGLE VISUALIZAÇÃO CARDS/TABELA ===
let currentView = "cards"; // cards ou table

function initializeViewToggle() {
  const cardViewBtn = document.getElementById("cardViewBtn");
  const tableViewBtn = document.getElementById("tableViewBtn");

  if (cardViewBtn && tableViewBtn) {
    cardViewBtn.addEventListener("click", () => switchView("cards"));
    tableViewBtn.addEventListener("click", () => switchView("table"));
  }

  // Carrega visualização salva ou usa cards como padrão
  const savedView = localStorage.getItem("viewMode") || "cards";
  switchView(savedView);
}

function switchView(view) {
  currentView = view;
  localStorage.setItem("viewMode", view);

  const cardViewBtn = document.getElementById("cardViewBtn");
  const tableViewBtn = document.getElementById("tableViewBtn");
  const cardsContainer = document.getElementById("cardsContainer");
  const tableContainer = document.getElementById("tableContainer");

  // Atualiza botões
  if (cardViewBtn && tableViewBtn) {
    cardViewBtn.classList.toggle("active", view === "cards");
    tableViewBtn.classList.toggle("active", view === "table");
  }

  // Mostra/esconde containers
  if (cardsContainer && tableContainer) {
    if (view === "cards") {
      cardsContainer.classList.remove("hidden");
      tableContainer.classList.add("hidden");
    } else {
      cardsContainer.classList.add("hidden");
      tableContainer.classList.remove("hidden");
    }
  }

  // Re-exibe os resultados na nova visualização
  if (currentFilteredStudents.length > 0) {
    exibirResultados(currentFilteredStudents);
  }

  console.log(`👁️ Visualização alterada para: ${view}`);
}

// === FUNÇÕES DE API ===
async function carregarTodosAlunos() {
  try {
    mostrarLoading(true);
    atualizarTextoLoading("Carregando alunos...", "Conectando com o servidor");
    mostrarProgressIndicator(true, 20);

    console.log("📡 Carregando todos os alunos...");

    // Teste de conectividade
    const testeResponse = await fetch(`${API_URL}?teste=1`);
    if (!testeResponse.ok) {
      throw new Error(`Erro de conectividade: ${testeResponse.status}`);
    }

    const testeData = await testeResponse.json();
    console.log("✅ Conectividade OK:", testeData);

    mostrarProgressIndicator(true, 50);
    atualizarTextoLoading("Carregando alunos...", "Processando dados");

    // Carrega dados
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    mostrarProgressIndicator(true, 80);

    if (data.error) {
      throw new Error(data.error);
    }

    allStudentsRawData = data.saida || [];
    currentFilteredStudents = [...allStudentsRawData];

    console.log(`📊 ${allStudentsRawData.length} alunos carregados`);

    mostrarProgressIndicator(true, 100);
    atualizarTextoLoading("Finalizando...", "Exibindo resultados");

    exibirResultados(currentFilteredStudents);
    preencherFiltros();

    // Mostra toast de sucesso
    mostrarToast(
      `${allStudentsRawData.length} alunos carregados com sucesso`,
      "success",
      "Dados carregados"
    );
  } catch (error) {
    console.error("❌ Erro ao carregar dados:", error);
    mostrarErro(`Erro ao carregar dados: ${error.message}`, "Falha na Conexão");
    mostrarMensagemSemResultados();
  } finally {
    mostrarLoading(false);
    mostrarProgressIndicator(false);
  }
}

async function buscarAlunos() {
  const searchInput = document.getElementById("searchInput");
  const periodoFilter = document.getElementById("periodoFilter");
  const cursoFilter = document.getElementById("cursoFilter");
  const searchButton = document.getElementById("searchButton");

  const nomeAluno = searchInput ? searchInput.value.trim() : "";
  const periodo = periodoFilter ? periodoFilter.value : "";
  const curso = cursoFilter ? cursoFilter.value : "";

  try {
    mostrarLoadingButton(searchButton, true);
    atualizarTextoLoading("Buscando alunos...", "Aplicando filtros");

    console.log("🔍 Buscando alunos:", { nomeAluno, periodo, curso });

    let url = API_URL;
    const params = new URLSearchParams();

    if (nomeAluno) params.append("nomeAluno", nomeAluno);
    if (curso) params.append("curso", curso);
    if (periodo) params.append("periodo", periodo);

    if (params.toString()) {
      url += "?" + params.toString();
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    const resultados = data.saida || [];
    currentFilteredStudents = resultados;

    console.log(`📊 ${resultados.length} alunos encontrados`);

    exibirResultados(resultados);

    // Mostra toast com resultado da busca
    if (resultados.length === 0) {
      mostrarToast(
        "Nenhum aluno encontrado com os filtros aplicados",
        "warning",
        "Busca vazia"
      );
    } else {
      mostrarToast(
        `${resultados.length} aluno(s) encontrado(s)`,
        "success",
        "Busca concluída"
      );
    }
  } catch (error) {
    console.error("❌ Erro na busca:", error);
    mostrarErro(`Erro na busca: ${error.message}`, "Falha na Busca");
    mostrarMensagemSemResultados();
  } finally {
    mostrarLoadingButton(searchButton, false);
  }
}

async function registrarPresencaFalta(status) {
  if (!selectedStudentId) {
    mostrarErro("Nenhum aluno selecionado", "Seleção Obrigatória");
    return;
  }

  const button =
    status === "P"
      ? document.getElementById("markPresentButton")
      : document.getElementById("markAbsentButton");

  try {
    mostrarLoadingButton(button, true);
    atualizarTextoLoading("Registrando presença...", "Salvando dados");

    const dataHoje = new Date().toISOString().split("T")[0];

    console.log("📝 Registrando presença/falta:", {
      selectedStudentId,
      status,
      dataHoje,
    });

    // Usando GET para evitar problemas de CORS
    const params = new URLSearchParams({
      action: "registrarPresenca",
      alunoId: selectedStudentId,
      data: dataHoje,
      status: status, // 'P' para presença, 'A' para ausência
    });

    const response = await fetch(`${API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const resultado = await response.json();

    if (!resultado.success) {
      throw new Error(resultado.error || "Erro desconhecido");
    }

    const acao = status === "P" ? "Presença" : "Falta";
    mostrarSucesso(`${acao} registrada com sucesso!`, "Registro Salvo");

    // Atualiza os dados
    await carregarTodosAlunos();

    // Atualiza o painel de detalhes se estiver aberto
    if (selectedStudentId) {
      const alunoAtualizado = allStudentsRawData.find(
        (a) => a.ID_Unico === selectedStudentId
      );
      if (alunoAtualizado) {
        atualizarPainelDetalhes(alunoAtualizado);
      }
    }
  } catch (error) {
    console.error("❌ Erro ao registrar presença/falta:", error);
    mostrarErro(`Erro ao registrar: ${error.message}`, "Falha no Registro");
  } finally {
    mostrarLoadingButton(button, false);
  }
}

async function atualizarNotas() {
  if (!selectedStudentId) {
    mostrarErro("Nenhum aluno selecionado", "Seleção Obrigatória");
    return;
  }

  const nota1Input = document.getElementById("detailNota1");
  const nota2Input = document.getElementById("detailNota2");
  const nota3Input = document.getElementById("detailNota3");
  const updateButton = document.getElementById("updateNotesButton");

  const nota1 = nota1Input ? nota1Input.value : "";
  const nota2 = nota2Input ? nota2Input.value : "";
  const nota3 = nota3Input ? nota3Input.value : "";

  try {
    mostrarLoadingButton(updateButton, true);
    atualizarTextoLoading(
      "Atualizando notas...",
      "Calculando média e situação"
    );

    console.log("📝 Atualizando notas:", {
      selectedStudentId,
      nota1,
      nota2,
      nota3,
    });

    // Usando GET para evitar problemas de CORS
    const params = new URLSearchParams({
      action: "atualizarNotas",
      alunoId: selectedStudentId,
      nota1: nota1 || "",
      nota2: nota2 || "",
      nota3: nota3 || "",
    });

    const response = await fetch(`${API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const resultado = await response.json();

    if (!resultado.success) {
      throw new Error(resultado.error || "Erro desconhecido");
    }

    mostrarSucesso("Notas atualizadas com sucesso!", "Notas Salvas");

    // Atualiza os dados
    await carregarTodosAlunos();
  } catch (error) {
    console.error("❌ Erro ao atualizar notas:", error);
    mostrarErro(`Erro ao atualizar: ${error.message}`, "Falha na Atualização");
  } finally {
    mostrarLoadingButton(updateButton, false);
  }
}

// === FUNÇÕES DE INTERFACE ===
function exibirResultados(alunos) {
  const resultTableBody = document.getElementById("resultTableBody");
  const studentsGrid = document.getElementById("studentsGrid");
  const noResultsMessage = document.getElementById("noResults");

  // Limpa os containers
  if (resultTableBody) resultTableBody.innerHTML = "";
  if (studentsGrid) studentsGrid.innerHTML = "";

  if (alunos.length === 0) {
    mostrarMensagemSemResultados();
    return;
  }

  if (noResultsMessage) {
    noResultsMessage.style.display = "none";
  }

  // Escolhe qual visualização usar
  if (currentView === "cards") {
    exibirResultadosComoCards(alunos);
  } else {
    exibirResultadosComoTabela(alunos);
  }

  console.log(`📋 ${alunos.length} alunos exibidos em ${currentView}`);
}

function exibirResultadosComoCards(alunos) {
  const studentsGrid = document.getElementById("studentsGrid");
  if (!studentsGrid) return;

  alunos.forEach((aluno) => {
    // Calcula média e situação localmente para garantir consistência
    const calculado = calcularMediaESituacao(aluno);
    const mediaExibir =
      calculado.media > 0 ? calculado.media : aluno.Media || 0;
    const situacaoExibir = calculado.situacao;

    // Cria o card do aluno
    const card = document.createElement("div");
    card.className = "student-card";
    card.innerHTML = createStudentCardHTML(aluno, mediaExibir, situacaoExibir);

    studentsGrid.appendChild(card);
  });
}

function createStudentCardHTML(aluno, media, situacao) {
  const iniciais = aluno.Nome.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const nota1 = aluno.Nota1 || "";
  const nota2 = aluno.Nota2 || "";
  const nota3 = aluno.Nota3 || "";
  const faltas = aluno.Faltas || 0;

  return `
    <div class="card-header">
      <div class="student-avatar">${iniciais}</div>
      <div class="student-info">
        <h3>${aluno.Nome}</h3>
        <div class="student-meta">
          <div class="meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
            </svg>
            ID: ${aluno.ID_Unico}
          </div>
          <div class="meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
              <path d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3zm0 3v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6H2zm3 2h1a1 1 0 0 1 1 1v1a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/>
            </svg>
            ${aluno.Origem} - ${aluno.Periodo}
          </div>
        </div>
      </div>
    </div>

    <div class="card-grades">
      <div class="grades-grid">
        <div class="grade-item">
          <div class="grade-label">1º Bim</div>
          <div class="grade-value ${!nota1 ? "empty" : ""}">${
    nota1 || "-"
  }</div>
        </div>
        <div class="grade-item">
          <div class="grade-label">2º Bim</div>
          <div class="grade-value ${!nota2 ? "empty" : ""}">${
    nota2 || "-"
  }</div>
        </div>
        <div class="grade-item">
          <div class="grade-label">3º Bim</div>
          <div class="grade-value ${!nota3 ? "empty" : ""}">${
    nota3 || "-"
  }</div>
        </div>
      </div>
    </div>

    <div class="card-performance">
      <div class="performance-item">
        <div class="performance-label">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
            <path d="M4 2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V2zm2-1a1 1 0 0 0-1 1v12h6V2a1 1 0 0 0-1-1H6z"/>
            <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          </svg>
          Média
        </div>
        <div class="performance-value media">${
          typeof media === "number" ? media.toFixed(1) : media || "-"
        }</div>
      </div>
      <div class="performance-item">
        <div class="performance-label">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          </svg>
          Faltas
        </div>
        <div class="performance-value faltas">${faltas}</div>
      </div>
    </div>

    <div style="text-align: center; margin: 1rem 0;">
      <div class="situation-badge ${situacao.toLowerCase().replace(" ", "-")}">
        ${getSituationIcon(situacao)}
        ${situacao}
      </div>
    </div>

    <div class="card-actions">
      <button class="card-action-btn primary" onclick="abrirPainelDetalhes('${
        aluno.ID_Unico
      }')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
        </svg>
        Ver Detalhes
      </button>
    </div>
  `;
}

function getSituationIcon(situacao) {
  switch (situacao.toLowerCase()) {
    case "aprovado":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2.5 8a5.5 5.5 0 0 1 8.25-4.764.5.5 0 0 0 .5-.866A6.5 6.5 0 1 0 14.5 8a.5.5 0 0 0-1 0 5.5 5.5 0 1 1-11 0z"/>
        <path d="M15.354 3.354a.5.5 0 0 0-.708-.708L8 9.293 5.354 6.646a.5.5 0 1 0-.708.708l3 3a.5.5 0 0 0 .708 0l7-7z"/>
      </svg>`;
    case "reprovado":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <path d="M2.5 8a5.5 5.5 0 0 1 8.25-4.764.5.5 0 0 0 .5-.866A6.5 6.5 0 1 0 14.5 8a.5.5 0 0 0-1 0 5.5 5.5 0 1 1-11 0z"/>
        <path d="M6.146 6.146a.5.5 0 0 1 .708 0L8 7.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 8l1.147 1.146a.5.5 0 0 1-.708.708L8 8.707 6.854 9.854a.5.5 0 0 1-.708-.708L7.293 8 6.146 6.854a.5.5 0 0 1 0-.708z"/>
      </svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="M5 6.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm.25 2.25a.25.25 0 0 0-.5 0v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5zM12.5 6.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z"/>
      </svg>`;
  }
}

function exibirResultadosComoTabela(alunos) {
  const resultTableBody = document.getElementById("resultTableBody");
  if (!resultTableBody) return;

  alunos.forEach((aluno) => {
    // Calcula média e situação localmente para garantir consistência
    const calculado = calcularMediaESituacao(aluno);
    const mediaExibir =
      calculado.media > 0 ? calculado.media : aluno.Media || "-";
    const situacaoExibir = calculado.situacao;

    const linha = document.createElement("tr");
    linha.innerHTML = `
            <td>${aluno.ID_Unico}</td>
            <td class="nome-aluno">${aluno.Nome}</td>
            <td>${aluno.Faltas || 0}</td>
            <td>${aluno.Nota1 || "-"}</td>
            <td>${aluno.Nota2 || "-"}</td>
            <td>${aluno.Nota3 || "-"}</td>
            <td>${mediaExibir}</td>
            <td>
                <span class="badge ${obterClasseSituacao(situacaoExibir)}">
                    ${situacaoExibir}
                </span>
            </td>
            <td>
                <button onclick="abrirPainelDetalhes('${
                  aluno.ID_Unico
                }')" class="btn-detalhes">
                    👁️ Ver
                </button>
            </td>
        `;
    resultTableBody.appendChild(linha);
  });
}

function abrirPainelDetalhes(alunoId) {
  const aluno = allStudentsRawData.find((a) => a.ID_Unico === alunoId);
  if (!aluno) {
    mostrarErro("Aluno não encontrado");
    return;
  }

  selectedStudentId = alunoId;
  atualizarPainelDetalhes(aluno);

  const studentDetail = document.getElementById("studentDetail");
  if (studentDetail) {
    studentDetail.style.display = "block";
  }
}

function atualizarPainelDetalhes(aluno) {
  const detailName = document.getElementById("detailName");
  const detailFaltas = document.getElementById("detailFaltas");
  const detailNota1 = document.getElementById("detailNota1");
  const detailNota2 = document.getElementById("detailNota2");
  const detailNota3 = document.getElementById("detailNota3");

  if (detailName) detailName.textContent = aluno.Nome;
  if (detailFaltas) detailFaltas.textContent = aluno.Faltas || 0;
  if (detailNota1) detailNota1.value = aluno.Nota1 || "";
  if (detailNota2) detailNota2.value = aluno.Nota2 || "";
  if (detailNota3) detailNota3.value = aluno.Nota3 || "";
}

function fecharPainelDetalhes() {
  const studentDetail = document.getElementById("studentDetail");
  if (studentDetail) {
    studentDetail.style.display = "none";
  }
  selectedStudentId = null;
}

function aplicarFiltros() {
  // Esta função aplica filtros localmente nos dados já carregados
  const searchInput = document.getElementById("searchInput");
  const periodoFilter = document.getElementById("periodoFilter");
  const cursoFilter = document.getElementById("cursoFilter");

  const nomeAluno = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const periodo = periodoFilter ? periodoFilter.value : "";
  const curso = cursoFilter ? cursoFilter.value : "";

  let alunosFiltrados = allStudentsRawData;

  if (nomeAluno) {
    alunosFiltrados = alunosFiltrados.filter((aluno) =>
      aluno.Nome.toLowerCase().includes(nomeAluno)
    );
  }

  if (periodo) {
    alunosFiltrados = alunosFiltrados.filter(
      (aluno) => aluno.Periodo === periodo
    );
  }

  if (curso) {
    alunosFiltrados = alunosFiltrados.filter((aluno) => aluno.Origem === curso);
  }

  currentFilteredStudents = alunosFiltrados;
  exibirResultados(currentFilteredStudents);
}

function limparFiltros() {
  const searchInput = document.getElementById("searchInput");
  const periodoFilter = document.getElementById("periodoFilter");
  const cursoFilter = document.getElementById("cursoFilter");

  if (searchInput) searchInput.value = "";
  if (periodoFilter) periodoFilter.value = "";
  if (cursoFilter) cursoFilter.value = "";

  currentFilteredStudents = [...allStudentsRawData];
  exibirResultados(currentFilteredStudents);
}

function preencherFiltros() {
  const periodoFilter = document.getElementById("periodoFilter");
  const cursoFilter = document.getElementById("cursoFilter");

  if (periodoFilter) {
    const periodos = [
      ...new Set(allStudentsRawData.map((a) => a.Periodo).filter((p) => p)),
    ];
    periodoFilter.innerHTML = '<option value="">Todos os períodos</option>';
    periodos.forEach((periodo) => {
      const option = document.createElement("option");
      option.value = periodo;
      option.textContent = periodo;
      periodoFilter.appendChild(option);
    });
  }

  if (cursoFilter) {
    const cursos = [
      ...new Set(allStudentsRawData.map((a) => a.Origem).filter((o) => o)),
    ];
    cursoFilter.innerHTML = '<option value="">Todos os cursos</option>';
    cursos.forEach((curso) => {
      const option = document.createElement("option");
      option.value = curso;
      option.textContent = curso;
      cursoFilter.appendChild(option);
    });
  }
}

function mostrarMensagemSemResultados() {
  const noResultsMessage = document.getElementById("noResults");
  if (noResultsMessage) {
    noResultsMessage.style.display = "block";
  }
}

// === MODAL DE REGISTRO ===
function abrirModalRegistro() {
  const registrationModal = document.getElementById("registrationModal");
  if (registrationModal) {
    registrationModal.style.display = "block";
    preencherModalRegistro();
  }
}

function fecharModalRegistro() {
  const registrationModal = document.getElementById("registrationModal");
  if (registrationModal) {
    registrationModal.style.display = "none";
  }
}

function preencherModalRegistro() {
  const alunoSelecionadoSelect = document.getElementById("alunoSelecionado");
  const dataPresencaInput = document.getElementById("dataPresenca");

  if (alunoSelecionadoSelect) {
    alunoSelecionadoSelect.innerHTML =
      '<option value="">Selecione um aluno</option>';
    allStudentsRawData.forEach((aluno) => {
      const option = document.createElement("option");
      option.value = aluno.ID_Unico;
      option.textContent = `${aluno.Nome} (${aluno.ID_Unico})`;
      alunoSelecionadoSelect.appendChild(option);
    });
  }

  if (dataPresencaInput) {
    const hoje = new Date().toISOString().split("T")[0];
    dataPresencaInput.value = hoje;
  }
}

async function submeterPresenca() {
  const alunoSelecionadoSelect = document.getElementById("alunoSelecionado");
  const dataPresencaInput = document.getElementById("dataPresenca");
  const presenteRadio = document.getElementById("presente");
  const ausenteRadio = document.getElementById("ausente");
  const submitButton = document.getElementById("submitPresenca");

  const alunoId = alunoSelecionadoSelect ? alunoSelecionadoSelect.value : "";
  const data = dataPresencaInput ? dataPresencaInput.value : "";
  const status =
    presenteRadio && presenteRadio.checked
      ? "P"
      : ausenteRadio && ausenteRadio.checked
      ? "A"
      : "";

  if (!alunoId || !data || !status) {
    mostrarErro("Preencha todos os campos", "Campos Obrigatórios");
    return;
  }

  try {
    mostrarLoadingButton(submitButton, true);
    atualizarTextoLoading("Registrando presença...", "Salvando informações");

    console.log("📝 Submetendo presença via modal:", { alunoId, data, status });

    // Usando GET para evitar problemas de CORS
    const params = new URLSearchParams({
      action: "registrarPresenca",
      alunoId: alunoId,
      data: data,
      status: status,
    });

    const response = await fetch(`${API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const resultado = await response.json();

    if (!resultado.success) {
      throw new Error(resultado.error || "Erro desconhecido");
    }

    const acao = status === "P" ? "Presença" : "Falta";
    mostrarSucesso(`${acao} registrada com sucesso!`, "Registro Concluído");

    fecharModalRegistro();
    await carregarTodosAlunos();
  } catch (error) {
    console.error("❌ Erro ao submeter presença:", error);
    mostrarErro(`Erro ao registrar: ${error.message}`, "Falha no Registro");
  } finally {
    mostrarLoadingButton(submitButton, false);
  }
}

// === FUNÇÕES AUXILIARES ===
function calcularMediaESituacao(aluno) {
  const nota1 = parseFloat(String(aluno.Nota1 || 0).replace(",", ".")) || 0;
  const nota2 = parseFloat(String(aluno.Nota2 || 0).replace(",", ".")) || 0;
  const nota3 = parseFloat(String(aluno.Nota3 || 0).replace(",", ".")) || 0;

  const notas = [nota1, nota2, nota3].filter((n) => n > 0);

  if (notas.length === 0) {
    return {
      media: 0,
      situacao: "Em Curso",
    };
  }

  const media = notas.reduce((a, b) => a + b) / notas.length;
  const situacao = media >= 6.0 ? "Aprovado" : "Reprovado";

  return {
    media: media.toFixed(2),
    situacao: situacao,
  };
}

function obterClasseSituacao(situacao) {
  if (!situacao) return "situacao-em-curso";

  const situacaoLower = situacao.toLowerCase();

  if (situacaoLower.includes("aprovado")) return "situacao-aprovado";
  if (situacaoLower.includes("reprovado")) return "situacao-reprovado";
  if (
    situacaoLower.includes("recuperacao") ||
    situacaoLower.includes("recuperação")
  )
    return "situacao-recuperacao";

  return "situacao-em-curso";
}

function mostrarLoading(show) {
  const loading = document.getElementById("loadingOverlay");
  if (loading) {
    if (show) {
      loading.classList.add("active");
    } else {
      loading.classList.remove("active");
    }
  }
}

function mostrarProgressIndicator(show, progress = 0) {
  const indicator = document.getElementById("progressIndicator");
  const bar = document.getElementById("progressBar");

  if (indicator && bar) {
    if (show) {
      indicator.classList.add("active");
      bar.style.width = `${progress}%`;
    } else {
      indicator.classList.remove("active");
      bar.style.width = "0%";
    }
  }
}

function atualizarTextoLoading(
  texto = "Carregando...",
  subtexto = "Aguarde um momento"
) {
  const loadingText = document.querySelector(".loading-text");
  const loadingSubtext = document.querySelector(".loading-subtext");

  if (loadingText) loadingText.textContent = texto;
  if (loadingSubtext) loadingSubtext.textContent = subtexto;
}

function mostrarLoadingButton(buttonElement, show) {
  if (!buttonElement) return;

  if (show) {
    buttonElement.classList.add("btn-loading");
    buttonElement.disabled = true;
    // Salva o texto original
    const originalText = buttonElement.innerHTML;
    buttonElement.dataset.originalText = originalText;
  } else {
    buttonElement.classList.remove("btn-loading");
    buttonElement.disabled = false;
    // Restaura o texto original
    if (buttonElement.dataset.originalText) {
      buttonElement.innerHTML = buttonElement.dataset.originalText;
      delete buttonElement.dataset.originalText;
    }
  }
}

function mostrarSucesso(mensagem, titulo = "Sucesso!") {
  mostrarNotificacaoModal(mensagem, "success", titulo);
}

function mostrarErro(mensagem, titulo = "Erro") {
  mostrarNotificacaoModal(mensagem, "error", titulo);
}

function mostrarAviso(mensagem, titulo = "Atenção") {
  mostrarNotificacaoModal(mensagem, "warning", titulo);
}

function mostrarInfo(mensagem, titulo = "Informação") {
  mostrarNotificacaoModal(mensagem, "info", titulo);
}

function mostrarNotificacaoModal(
  mensagem,
  tipo = "info",
  titulo = "Notificação",
  showCancel = false
) {
  const modal = document.getElementById("notificationModal");
  const icon = document.getElementById("notificationIcon");
  const iconSymbol = document.getElementById("notificationIconSymbol");
  const titleElement = document.getElementById("notificationTitle");
  const messageElement = document.getElementById("notificationMessage");
  const okBtn = document.getElementById("notificationOkBtn");
  const cancelBtn = document.getElementById("notificationCancelBtn");

  if (!modal) return;

  // Remove classes anteriores
  icon.className = `notification-icon ${tipo}`;

  // Define ícone baseado no tipo
  const icons = {
    success: "✓",
    error: "✗",
    warning: "⚠",
    info: "ℹ",
  };

  iconSymbol.textContent = icons[tipo] || "ℹ";
  titleElement.textContent = titulo;
  messageElement.textContent = mensagem;

  // Configura botões
  okBtn.style.display = "block";
  cancelBtn.style.display = showCancel ? "block" : "none";

  // Mostra modal
  modal.classList.add("active");

  // Event listeners
  const closeModal = () => {
    modal.classList.remove("active");
    okBtn.onclick = null;
    cancelBtn.onclick = null;
  };

  okBtn.onclick = closeModal;
  cancelBtn.onclick = closeModal;

  // Auto-close para sucessos
  if (tipo === "success") {
    setTimeout(closeModal, 3000);
  }
}

function mostrarConfirmacao(mensagem, titulo = "Confirmação", callback) {
  const modal = document.getElementById("notificationModal");
  const icon = document.getElementById("notificationIcon");
  const iconSymbol = document.getElementById("notificationIconSymbol");
  const titleElement = document.getElementById("notificationTitle");
  const messageElement = document.getElementById("notificationMessage");
  const okBtn = document.getElementById("notificationOkBtn");
  const cancelBtn = document.getElementById("notificationCancelBtn");

  if (!modal) return;

  icon.className = "notification-icon warning";
  iconSymbol.textContent = "?";
  titleElement.textContent = titulo;
  messageElement.textContent = mensagem;

  okBtn.textContent = "Confirmar";
  cancelBtn.textContent = "Cancelar";
  okBtn.style.display = "block";
  cancelBtn.style.display = "block";

  modal.classList.add("active");

  const closeModal = () => {
    modal.classList.remove("active");
    okBtn.onclick = null;
    cancelBtn.onclick = null;
    okBtn.textContent = "OK";
  };

  okBtn.onclick = () => {
    closeModal();
    if (callback) callback(true);
  };

  cancelBtn.onclick = () => {
    closeModal();
    if (callback) callback(false);
  };
}

function mostrarToast(mensagem, tipo = "info", titulo = "", duracao = 4000) {
  const container = document.getElementById("toastContainer");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;

  const icons = {
    success: "✓",
    error: "✗",
    warning: "⚠",
    info: "ℹ",
  };

  toast.innerHTML = `
    <div class="toast-icon ${tipo}">${icons[tipo] || "ℹ"}</div>
    <div class="toast-content">
      ${titulo ? `<div class="toast-title">${titulo}</div>` : ""}
      <div class="toast-message">${mensagem}</div>
    </div>
    <button class="toast-close">&times;</button>
  `;

  container.appendChild(toast);

  // Anima entrada
  requestAnimationFrame(() => {
    toast.classList.add("active");
  });

  // Event listener para fechar
  const closeBtn = toast.querySelector(".toast-close");
  const closeToast = () => {
    toast.classList.remove("active");
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 300);
  };

  closeBtn.onclick = closeToast;

  // Auto close
  if (duracao > 0) {
    setTimeout(closeToast, duracao);
  }
}
