// === CONFIGURAÇÃO DO SISTEMA CEDESP ===
// IMPORTANTE: Substitua esta URL pela URL do seu Web App do Google Apps Script
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbzNq3Hz1Pvlx3Ty4YGJvj0UM4jQNe2adOEQWyomzpTnBHooEzgHa1TGMWfcd8mpzTDe/exec";

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

// === FUNÇÕES DE API ===
async function carregarTodosAlunos() {
  try {
    mostrarLoading(true);
    console.log("📡 Carregando todos os alunos...");

    // Teste de conectividade
    const testeResponse = await fetch(`${API_URL}?teste=1`);
    if (!testeResponse.ok) {
      throw new Error(`Erro de conectividade: ${testeResponse.status}`);
    }

    const testeData = await testeResponse.json();
    console.log("✅ Conectividade OK:", testeData);

    // Carrega dados
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    allStudentsRawData = data.saida || [];
    currentFilteredStudents = [...allStudentsRawData];

    console.log(`📊 ${allStudentsRawData.length} alunos carregados`);

    exibirResultados(currentFilteredStudents);
    preencherFiltros();
  } catch (error) {
    console.error("❌ Erro ao carregar dados:", error);
    mostrarErro(`Erro ao carregar dados: ${error.message}`);
    mostrarMensagemSemResultados();
  } finally {
    mostrarLoading(false);
  }
}

async function buscarAlunos() {
  const searchInput = document.getElementById("searchInput");
  const periodoFilter = document.getElementById("periodoFilter");
  const cursoFilter = document.getElementById("cursoFilter");

  const nomeAluno = searchInput ? searchInput.value.trim() : "";
  const periodo = periodoFilter ? periodoFilter.value : "";
  const curso = cursoFilter ? cursoFilter.value : "";

  try {
    mostrarLoading(true);
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
  } catch (error) {
    console.error("❌ Erro na busca:", error);
    mostrarErro(`Erro na busca: ${error.message}`);
    mostrarMensagemSemResultados();
  } finally {
    mostrarLoading(false);
  }
}

async function registrarPresencaFalta(status) {
  if (!selectedStudentId) {
    mostrarErro("Nenhum aluno selecionado");
    return;
  }

  try {
    mostrarLoading(true);

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
    mostrarSucesso(`✅ ${acao} registrada com sucesso!`);

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
    mostrarErro(`Erro: ${error.message}`);
  } finally {
    mostrarLoading(false);
  }
}

async function atualizarNotas() {
  if (!selectedStudentId) {
    mostrarErro("Nenhum aluno selecionado");
    return;
  }

  const nota1Input = document.getElementById("detailNota1");
  const nota2Input = document.getElementById("detailNota2");
  const nota3Input = document.getElementById("detailNota3");

  const nota1 = nota1Input ? nota1Input.value : "";
  const nota2 = nota2Input ? nota2Input.value : "";
  const nota3 = nota3Input ? nota3Input.value : "";

  try {
    mostrarLoading(true);

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

    mostrarSucesso("✅ Notas atualizadas com sucesso!");

    // Atualiza os dados
    await carregarTodosAlunos();
  } catch (error) {
    console.error("❌ Erro ao atualizar notas:", error);
    mostrarErro(`Erro: ${error.message}`);
  } finally {
    mostrarLoading(false);
  }
}

// === FUNÇÕES DE INTERFACE ===
function exibirResultados(alunos) {
  const resultTableBody = document.getElementById("resultTableBody");
  const noResultsMessage = document.getElementById("noResults");

  if (!resultTableBody) return;

  resultTableBody.innerHTML = "";

  if (alunos.length === 0) {
    mostrarMensagemSemResultados();
    return;
  }

  if (noResultsMessage) {
    noResultsMessage.style.display = "none";
  }

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

  console.log(`📋 ${alunos.length} alunos exibidos na tabela`);
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

  const alunoId = alunoSelecionadoSelect ? alunoSelecionadoSelect.value : "";
  const data = dataPresencaInput ? dataPresencaInput.value : "";
  const status =
    presenteRadio && presenteRadio.checked
      ? "P"
      : ausenteRadio && ausenteRadio.checked
      ? "A"
      : "";

  if (!alunoId || !data || !status) {
    mostrarErro("Preencha todos os campos");
    return;
  }

  try {
    mostrarLoading(true);

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
    mostrarSucesso(`✅ ${acao} registrada com sucesso!`);

    fecharModalRegistro();
    await carregarTodosAlunos();
  } catch (error) {
    console.error("❌ Erro ao submeter presença:", error);
    mostrarErro(`Erro: ${error.message}`);
  } finally {
    mostrarLoading(false);
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
  const loading = document.getElementById("loading");
  if (loading) {
    loading.style.display = show ? "flex" : "none";
  }
}

function mostrarSucesso(mensagem) {
  mostrarNotificacao(mensagem, "success");
}

function mostrarErro(mensagem) {
  mostrarNotificacao(mensagem, "error");
}

function mostrarAviso(mensagem) {
  mostrarNotificacao(mensagem, "warning");
}

function mostrarNotificacao(mensagem, tipo = "info") {
  // Remove notificações anteriores
  const notificacaoExistente = document.querySelector(".notification");
  if (notificacaoExistente) {
    notificacaoExistente.remove();
  }

  const notificacao = document.createElement("div");
  notificacao.className = `notification notification-${tipo}`;
  notificacao.innerHTML = `
        <span>${mensagem}</span>
        <button onclick="this.parentElement.remove()">&times;</button>
    `;

  document.body.appendChild(notificacao);

  // Remove automaticamente após 5 segundos
  setTimeout(() => {
    if (notificacao.parentElement) {
      notificacao.remove();
    }
  }, 5000);
}
