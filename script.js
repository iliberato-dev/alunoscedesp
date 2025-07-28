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
let currentUser = null;

// === INICIALIZAÇÃO ===
document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 Sistema CEDESP Universal carregado");
  console.log("🔗 Usando API:", API_URL);

  // Verificar autenticação
  if (!checkAuthentication()) {
    return; // Redireciona para login se não autenticado
  }

  inicializarToggleTheme();
  initializeEventListeners();
  initializeViewToggle();
  setupUserInterface();
  carregarTodosAlunos();
});

// === VERIFICAÇÃO DE AUTENTICAÇÃO ===
function checkAuthentication() {
  // Verificar se o AuthSystem está disponível
  if (typeof AuthSystem === "undefined") {
    console.error("❌ AuthSystem não carregado");
    window.location.href = "login.html";
    return false;
  }

  currentUser = AuthSystem.getCurrentUser();

  if (!currentUser) {
    // Não está logado, redirecionar para login
    console.log("🔄 Redirecionando para login - usuário não autenticado");
    window.location.href = "login.html";
    return false;
  }

  console.log(
    "👤 Usuário logado:",
    currentUser.name,
    "(" + currentUser.role + ")"
  );
  return true;
}

// === CONFIGURAÇÃO DA INTERFACE BASEADA NO USUÁRIO ===
function setupUserInterface() {
  // Adicionar informações do usuário no header
  const headerContent = document.querySelector(".header-content");
  if (headerContent) {
    const userInfo = document.createElement("div");
    userInfo.className = "user-info";
    userInfo.innerHTML = `
      <div class="user-badge">
        <span class="user-avatar">${currentUser.avatar}</span>
        <div class="user-details">
          <span class="user-name">${currentUser.name}</span>
          <span class="user-role">${
            currentUser.role === "admin" ? "Administrador" : "Professor"
          }</span>
        </div>
        <button id="logoutBtn" class="logout-btn" title="Sair">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
            <path fill-rule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
          </svg>
        </button>
      </div>
    `;
    headerContent.appendChild(userInfo);

    // Event listener para logout
    document.getElementById("logoutBtn").addEventListener("click", () => {
      mostrarNotificacaoModal(
        "warning",
        "Confirmar Logout",
        "Deseja realmente sair do sistema?",
        true
      ).then((confirmed) => {
        if (confirmed) {
          AuthSystem.logout();
        }
      });
    });
  }

  // Configurar filtros baseados no usuário
  setupUserFilters();

  // Se for admin, adicionar link para estatísticas
  if (currentUser.role === "admin") {
    addAdminFeatures();
  }
}

// === CONFIGURAÇÃO DE FILTROS BASEADOS NO USUÁRIO ===
function setupUserFilters() {
  const cursoFilter = document.getElementById("cursoFilter");

  if (currentUser.role === "professor" && cursoFilter) {
    // Limpar opções existentes
    cursoFilter.innerHTML = '<option value="">Todos os cursos</option>';

    // Adicionar apenas os cursos do professor
    const courseNames = {
      PWT: "Programação Web - Tarde",
      PWN: "Programação Web - Noite",
      DGT: "Design Gráfico - Tarde",
      DGN: "Design Gráfico - Noite",
      MNT: "Manicure - Tarde",
      MNN: "Manicure - Noite",
    };

    console.log(
      "🎯 Configurando filtros para professor:",
      currentUser.name,
      "Cursos:",
      currentUser.courses
    );

    currentUser.courses.forEach((courseCode) => {
      if (courseNames[courseCode]) {
        const option = document.createElement("option");
        option.value = courseCode;
        option.textContent = courseNames[courseCode];
        cursoFilter.appendChild(option);
      }
    });
  } else if (currentUser.role === "admin" && cursoFilter) {
    // Admin pode ver todos os cursos, mas os filtros são só para visualização
    console.log("👑 Admin - todos os cursos disponíveis nos filtros");
  }
}

// === FUNCIONALIDADES ADMINISTRATIVAS ===
function addAdminFeatures() {
  // Para admin, remover funcionalidades de edição individual e focar em estatísticas
  const buttonsContainer = document.getElementById("buttons");
  if (buttonsContainer) {
    // Limpar botões existentes para admin
    buttonsContainer.innerHTML = "";

    // Adicionar botão de estatísticas para admin
    const statsButton = document.createElement("button");
    statsButton.id = "statsButton";
    statsButton.className = "btn-primary";
    statsButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM11 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 17 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 11a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 15.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>
      </svg>
      <span>📊 Dashboard Administrativo</span>
    `;
    statsButton.addEventListener("click", () => {
      window.open("stats.html", "_blank");
    });
    buttonsContainer.appendChild(statsButton);

    // Adicionar controle de presenças por data para admin
    const attendanceButton = document.createElement("button");
    attendanceButton.id = "attendanceControlButton";
    attendanceButton.className = "btn-secondary";
    attendanceButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M3.5 0a.5.5 0 0 1 .5.5V1h8V.5a.5.5 0 0 1 1 0V1h1a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V3a2 2 0 0 1 2-2h1V.5a.5.5 0 0 1 .5-.5zM1 4v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V4H1z"/>
      </svg>
      <span>📅 Controle de Presenças</span>
    `;
    attendanceButton.addEventListener("click", abrirControlePresencas);
    buttonsContainer.appendChild(attendanceButton);
  }

  // Ocultar funcionalidades de edição individual para admin
  hideIndividualEditingForAdmin();
}

function hideIndividualEditingForAdmin() {
  // Admin não deve ver botões de edição individual nos cards
  const style = document.createElement("style");
  style.textContent = `
    .admin-view .card-actions,
    .admin-view .btn-detalhes,
    .admin-view #updateNotesButton,
    .admin-view #markPresentButton,
    .admin-view #markAbsentButton {
      display: none !important;
    }
    .admin-view .student-card {
      cursor: default;
    }
    .admin-view .student-card:hover {
      transform: none;
    }
  `;
  document.head.appendChild(style);
  document.body.classList.add("admin-view");
}

// === CONTROLE DE PRESENÇAS POR DATA (ADMIN) ===
function abrirControlePresencas() {
  if (currentUser.role !== "admin") {
    mostrarErro(
      "Acesso negado. Apenas administradores podem acessar esta funcionalidade.",
      "Acesso Restrito"
    );
    return;
  }

  const modal = document.createElement("div");
  modal.id = "attendanceControlModal";
  modal.className = "modal attendance-modal";
  modal.innerHTML = `
    <div class="modal-content attendance-content">
      <div class="modal-header">
        <h2>📅 Controle de Presenças - Administração</h2>
        <button class="close-btn" onclick="fecharControlePresencas()">×</button>
      </div>
      
      <div class="attendance-filters">
        <div class="filter-group">
          <label for="attendanceDate">Data Específica:</label>
          <input type="date" id="attendanceDate" class="form-control">
        </div>
        
        <div class="filter-group">
          <label for="attendanceDateStart">Período - Data Inicial:</label>
          <input type="date" id="attendanceDateStart" class="form-control">
        </div>
        
        <div class="filter-group">
          <label for="attendanceDateEnd">Período - Data Final:</label>
          <input type="date" id="attendanceDateEnd" class="form-control">
        </div>
        
        <div class="filter-group">
          <label for="attendanceCourse">Curso:</label>
          <select id="attendanceCourse" class="form-control">
            <option value="">Todos os Cursos</option>
            <option value="PWT">Programação Web - Tarde</option>
            <option value="PWN">Programação Web - Noite</option>
            <option value="DGT">Design Gráfico - Tarde</option>
            <option value="DGN">Design Gráfico - Noite</option>
            <option value="MNT">Manicure - Tarde</option>
            <option value="MNN">Manicure - Noite</option>
          </select>
        </div>
        
        <div class="filter-actions">
          <button id="consultarPresencas" class="btn-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
            Consultar Presenças
          </button>
          <button id="exportarPresencas" class="btn-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
            </svg>
            Exportar Dados
          </button>
        </div>
      </div>
      
      <div class="attendance-summary" id="attendanceSummary" style="display: none;">
        <div class="summary-cards">
          <div class="summary-card">
            <div class="summary-icon">👥</div>
            <div class="summary-info">
              <div class="summary-number" id="totalStudentsCount">0</div>
              <div class="summary-label">Total de Alunos</div>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">✅</div>
            <div class="summary-info">
              <div class="summary-number" id="presentCount">0</div>
              <div class="summary-label">Presenças</div>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">❌</div>
            <div class="summary-info">
              <div class="summary-number" id="absentCount">0</div>
              <div class="summary-label">Faltas</div>
            </div>
          </div>
          <div class="summary-card">
            <div class="summary-icon">📊</div>
            <div class="summary-info">
              <div class="summary-number" id="attendanceRate">0%</div>
              <div class="summary-label">Taxa de Presença</div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="attendance-results" id="attendanceResults">
        <div class="results-placeholder">
          <div class="placeholder-icon">📅</div>
          <p>Selecione uma data ou período e clique em "Consultar Presenças" para ver os resultados.</p>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.style.display = "block";

  // Event listeners
  document
    .getElementById("consultarPresencas")
    .addEventListener("click", consultarPresencasPorData);
  document
    .getElementById("exportarPresencas")
    .addEventListener("click", exportarDadosPresenca);

  // Definir data padrão como hoje
  const hoje = new Date().toISOString().split("T")[0];
  document.getElementById("attendanceDate").value = hoje;
}

function fecharControlePresencas() {
  const modal = document.getElementById("attendanceControlModal");
  if (modal) {
    modal.remove();
  }
}

async function consultarPresencasPorData() {
  const dateInput = document.getElementById("attendanceDate").value;
  const startDateInput = document.getElementById("attendanceDateStart").value;
  const endDateInput = document.getElementById("attendanceDateEnd").value;
  const courseInput = document.getElementById("attendanceCourse").value;
  const button = document.getElementById("consultarPresencas");

  let dateFilter = null;
  let startDate = null;
  let endDate = null;

  // Validar inputs
  if (dateInput) {
    dateFilter = dateInput;
  } else if (startDateInput && endDateInput) {
    startDate = startDateInput;
    endDate = endDateInput;
    if (new Date(startDate) > new Date(endDate)) {
      mostrarErro(
        "Data inicial não pode ser maior que a data final.",
        "Período Inválido"
      );
      return;
    }
  } else {
    mostrarErro(
      "Selecione uma data específica ou um período (data inicial e final).",
      "Data Obrigatória"
    );
    return;
  }

  try {
    mostrarLoadingButton(button, true);

    console.log("📅 Consultando presenças:", {
      dateFilter,
      startDate,
      endDate,
      courseInput,
    });

    let attendanceData = [];

    if (dateFilter) {
      // Consulta para data específica - usar API real
      try {
        const url = `${API_URL}?action=consultarPresencas&data=${dateFilter}${
          courseInput ? `&curso=${courseInput}` : ""
        }`;
        console.log("🔗 Chamando API:", url);

        const response = await fetch(url);
        const result = await response.json();

        console.log("📊 Resposta da API:", result);

        if (result.success) {
          attendanceData = result.data || [];
        } else {
          throw new Error(result.error || "Erro ao consultar presenças");
        }
      } catch (apiError) {
        console.warn("⚠️ Erro na API, usando dados locais:", apiError);
        // Fallback para dados simulados se a API falhar
        let filteredStudents = [...allStudentsRawData];
        if (courseInput) {
          filteredStudents = filteredStudents.filter(
            (student) => student.Origem === courseInput
          );
        }
        attendanceData = simulateAttendanceData(
          filteredStudents,
          dateFilter,
          null,
          null
        );
      }
    } else {
      // Para período (múltiplas datas) - usar simulação por enquanto
      let filteredStudents = [...allStudentsRawData];
      if (courseInput) {
        filteredStudents = filteredStudents.filter(
          (student) => student.Origem === courseInput
        );
      }
      attendanceData = simulateAttendanceData(
        filteredStudents,
        null,
        startDate,
        endDate
      );
    }

    exibirResultadosPresenca(
      attendanceData,
      dateFilter,
      startDate,
      endDate,
      courseInput
    );
  } catch (error) {
    console.error("❌ Erro ao consultar presenças:", error);
    mostrarErro(
      `Erro ao consultar presenças: ${error.message}`,
      "Erro na Consulta"
    );
  } finally {
    mostrarLoadingButton(button, false);
  }
}

// === SISTEMA DE REGISTRO DE PRESENÇA ===
class AttendanceManager {
  constructor() {
    this.storageKey = "cedesp_attendance_records";
  }

  // Obter todos os registros de presença
  getAttendanceRecords() {
    const saved = localStorage.getItem(this.storageKey);
    return saved ? JSON.parse(saved) : {};
  }

  // Salvar registros de presença
  saveAttendanceRecords(records) {
    localStorage.setItem(this.storageKey, JSON.stringify(records));
  }

  // Marcar presença/falta para um aluno em uma data específica
  markAttendance(studentId, date, status, markAll = false) {
    const records = this.getAttendanceRecords();
    const dateKey = this.formatDateKey(date);

    if (!records[dateKey]) {
      records[dateKey] = {};
    }

    // Se markAll for true, marcar todos os outros alunos como falta
    if (markAll) {
      allStudentsRawData.forEach((student) => {
        if (
          student.ID_Unico !== studentId &&
          !records[dateKey][student.ID_Unico]
        ) {
          records[dateKey][student.ID_Unico] = "A"; // Ausente
        }
      });
    }

    // Marcar o aluno específico
    records[dateKey][studentId] = status;

    this.saveAttendanceRecords(records);
    return records;
  }

  // Obter presença de um aluno em uma data específica
  getStudentAttendance(studentId, date) {
    const records = this.getAttendanceRecords();
    const dateKey = this.formatDateKey(date);
    return records[dateKey] ? records[dateKey][studentId] : null;
  }

  // Obter presença de todos os alunos em uma data específica
  getDayAttendance(date) {
    const records = this.getAttendanceRecords();
    const dateKey = this.formatDateKey(date);
    return records[dateKey] || {};
  }

  // Verificar se algum aluno foi marcado em uma data específica
  hasAnyAttendanceMarked(date) {
    const dayAttendance = this.getDayAttendance(date);
    return Object.keys(dayAttendance).length > 0;
  }

  // Calcular total de faltas de um aluno
  calculateStudentAbsences(studentId) {
    const records = this.getAttendanceRecords();
    let absences = 0;

    Object.keys(records).forEach((dateKey) => {
      if (records[dateKey][studentId] === "A") {
        absences++;
      }
    });

    return absences;
  }

  // Calcular total de presenças de um aluno
  calculateStudentPresences(studentId) {
    const records = this.getAttendanceRecords();
    let presences = 0;

    Object.keys(records).forEach((dateKey) => {
      if (records[dateKey][studentId] === "P") {
        presences++;
      }
    });

    return presences;
  }

  // Obter todas as datas com registros
  getRecordedDates() {
    const records = this.getAttendanceRecords();
    return Object.keys(records).sort();
  }

  // Formatar data para chave de armazenamento
  formatDateKey(date) {
    if (typeof date === "string") {
      return date;
    }
    return date.toISOString().split("T")[0]; // YYYY-MM-DD
  }

  // Limpar todos os registros (para desenvolvimento/teste)
  clearAllRecords() {
    localStorage.removeItem(this.storageKey);
  }
}

// Instância global do gerenciador de presença (para backup local)
const attendanceManager = new AttendanceManager();

function simulateAttendanceData(students, dateFilter, startDate, endDate) {
  const attendanceData = [];
  const targetDate = dateFilter || startDate;

  students.forEach((student) => {
    // Verificar se existe registro para este aluno nesta data
    const attendanceStatus = attendanceManager.getStudentAttendance(
      student.ID_Unico,
      targetDate
    );

    let status, statusText, isMarked;

    if (attendanceStatus) {
      // Há registro explícito para este aluno
      status = attendanceStatus;
      statusText = attendanceStatus === "P" ? "Presente" : "Ausente";
      isMarked = true;
    } else {
      // Verificar se algum aluno foi marcado nesta data
      const hasAnyMarked = attendanceManager.hasAnyAttendanceMarked(targetDate);

      if (hasAnyMarked) {
        // Se algum aluno foi marcado e este não foi, considera ausente
        status = "A";
        statusText = "Ausente (Não Marcado)";
        isMarked = false;
      } else {
        // Se ninguém foi marcado ainda, não exibe nada (neutro)
        status = null;
        statusText = "Sem Registro";
        isMarked = false;
      }
    }

    attendanceData.push({
      studentId: student.ID_Unico,
      studentName: student.Nome,
      course: student.Origem,
      period: student.Periodo,
      date: targetDate,
      status: status,
      statusText: statusText,
      isMarked: isMarked,
    });
  });

  return attendanceData;
}

function exibirResultadosPresenca(
  attendanceData,
  dateFilter,
  startDate,
  endDate,
  course
) {
  const summaryDiv = document.getElementById("attendanceSummary");
  const resultsDiv = document.getElementById("attendanceResults");

  // Calcular estatísticas
  const total = attendanceData.length;
  const present = attendanceData.filter((a) => a.status === "P").length;
  const absent = attendanceData.filter((a) => a.status === "A").length;
  const rate = total > 0 ? ((present / total) * 100).toFixed(1) : 0;

  // Atualizar cards de resumo
  document.getElementById("totalStudentsCount").textContent = total;
  document.getElementById("presentCount").textContent = present;
  document.getElementById("absentCount").textContent = absent;
  document.getElementById("attendanceRate").textContent = rate + "%";

  // Mostrar resumo
  summaryDiv.style.display = "block";

  // Criar tabela de resultados
  const periodText = dateFilter
    ? `Data: ${new Date(dateFilter).toLocaleDateString("pt-BR")}`
    : `Período: ${new Date(startDate).toLocaleDateString("pt-BR")} a ${new Date(
        endDate
      ).toLocaleDateString("pt-BR")}`;

  const courseText = course ? ` - Curso: ${course}` : " - Todos os Cursos";

  resultsDiv.innerHTML = `
    <div class="results-header">
      <h3>📊 Resultados da Consulta</h3>
      <p class="results-info">${periodText}${courseText}</p>
    </div>
    
    <div class="results-table-container">
      <table class="attendance-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nome do Aluno</th>
            <th>Curso</th>
            <th>Período</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${attendanceData
            .map(
              (record) => `
            <tr class="attendance-row ${
              record.status === "P" ? "present" : "absent"
            } ${!record.isMarked ? "not-marked" : ""}">
              <td>${record.studentId}</td>
              <td>${record.studentName}</td>
              <td>${record.course}</td>
              <td>${record.period}</td>
              <td>
                <span class="status-badge ${
                  record.status === "P" ? "present" : "absent"
                } ${!record.isMarked ? "not-marked" : ""}">
                  ${record.status === "P" ? "✅" : "❌"} ${record.statusText}
                  ${!record.isMarked && record.status === "A" ? " ⚠️" : ""}
                </span>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    </div>
  `;
}

function exportarDadosPresenca() {
  const resultsTable = document.querySelector(".attendance-table");
  if (!resultsTable) {
    mostrarErro(
      "Não há dados para exportar. Faça uma consulta primeiro.",
      "Sem Dados"
    );
    return;
  }

  // Criar CSV dos dados
  const rows = Array.from(resultsTable.querySelectorAll("tr"));
  const csvContent = rows
    .map((row) => {
      const cells = Array.from(row.querySelectorAll("th, td"));
      return cells.map((cell) => cell.textContent.trim()).join(",");
    })
    .join("\n");

  // Download do arquivo
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `presencas_${new Date().toISOString().split("T")[0]}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  mostrarSucesso("Dados exportados com sucesso!", "Exportação Concluída");
}
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

    // Aplicar filtros baseados no usuário logado
    const filteredByUser = AuthSystem.filterStudentsByUser(
      allStudentsRawData,
      currentUser
    );
    currentFilteredStudents = [...filteredByUser];

    console.log(
      `📊 ${allStudentsRawData.length} alunos total, ${filteredByUser.length} acessíveis para ${currentUser.name}`
    );

    mostrarProgressIndicator(true, 100);
    atualizarTextoLoading("Finalizando...", "Exibindo resultados");

    exibirResultados(currentFilteredStudents);
    preencherFiltros();

    // Mostra toast de sucesso
    mostrarToast(
      `${filteredByUser.length} alunos carregados com sucesso`,
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

  // Verificar permissões
  if (currentUser.role === "admin") {
    mostrarErro(
      "Administradores devem usar o Controle de Presenças para gerenciar presenças.",
      "Acesso Restrito"
    );
    return;
  }

  if (currentUser.role === "professor") {
    const aluno = allStudentsRawData.find(
      (a) => a.ID_Unico === selectedStudentId
    );
    if (!aluno || !currentUser.courses.includes(aluno.Origem)) {
      mostrarErro(
        "Você não tem permissão para registrar presença deste aluno.",
        "Acesso Negado"
      );
      return;
    }
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
      professor: currentUser.name,
    });

    // Primeiro registrar no AttendanceManager local
    const dataObj = new Date();
    attendanceManager.markAttendance(selectedStudentId, dataObj, status, true);

    // Depois salvar na planilha via API
    const params = new URLSearchParams({
      action: "registrarPresencaAutomatica",
      alunoId: selectedStudentId,
      data: dataHoje,
      status: status,
      professor: currentUser.username,
      marcarTodos: "true", // Indica que deve marcar os outros como falta
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
    mostrarSucesso(
      `${acao} registrada com sucesso! Outros alunos marcados automaticamente como falta.`,
      "Registro Salvo"
    );

    // Atualizar a interface
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

    // Se der erro na API, reverter o registro local
    attendanceManager.clearAllRecords();
  } finally {
    mostrarLoadingButton(button, false);
  }
}

async function atualizarNotas() {
  if (!selectedStudentId) {
    mostrarErro("Nenhum aluno selecionado", "Seleção Obrigatória");
    return;
  }

  // Verificar permissões
  if (currentUser.role === "admin") {
    mostrarErro(
      "Administradores não podem editar notas individuais. Use o Dashboard Administrativo.",
      "Acesso Restrito"
    );
    return;
  }

  if (currentUser.role === "professor") {
    const aluno = allStudentsRawData.find(
      (a) => a.ID_Unico === selectedStudentId
    );
    if (!aluno || !currentUser.courses.includes(aluno.Origem)) {
      mostrarErro(
        "Você não tem permissão para editar notas deste aluno.",
        "Acesso Negado"
      );
      return;
    }
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
      professor: currentUser.name,
    });

    // Usando GET para evitar problemas de CORS
    const params = new URLSearchParams({
      action: "atualizarNotas",
      alunoId: selectedStudentId,
      nota1: nota1 || "",
      nota2: nota2 || "",
      nota3: nota3 || "",
      professor: currentUser.username,
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
    const faltasExibir = calculado.faltas || aluno.Faltas || 0;

    // Cria o card do aluno
    const card = document.createElement("div");
    card.className = "student-card";

    // Adicionar classe especial se reprovado por falta
    if (situacaoExibir === "Reprovado por Falta") {
      card.classList.add("reprovado-falta");
    }

    card.innerHTML = createStudentCardHTML(
      aluno,
      mediaExibir,
      situacaoExibir,
      faltasExibir
    );

    studentsGrid.appendChild(card);
  });
}

function createStudentCardHTML(aluno, media, situacao, faltas = null) {
  const iniciais = aluno.Nome.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const nota1 = aluno.Nota1 || "";
  const nota2 = aluno.Nota2 || "";
  const nota3 = aluno.Nota3 || "";
  const faltasExibir = faltas !== null ? faltas : aluno.Faltas || 0;

  // Verificar se é reprovado por falta
  const reprovadoPorFalta = situacao === "Reprovado" && faltasExibir > 15;
  const situacaoDisplay = reprovadoPorFalta ? "Reprovado por Falta" : situacao;

  // Alerta para excesso de faltas
  const alertaFalta =
    faltasExibir > 15
      ? `<div class="alert-falta">
      <i class="fas fa-exclamation-triangle"></i>
      ATENÇÃO: Aluno excedeu o limite de faltas (${faltasExibir}/15)
    </div>`
      : "";

  // Para admin, não mostrar botão de detalhes
  const showDetailsButton = currentUser.role !== "admin";
  const cardActions = showDetailsButton
    ? `
    <div class="card-actions">
      <button class="card-action-btn primary" onclick="abrirPainelDetalhes('${aluno.ID_Unico}')">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
          <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
        </svg>
        Ver Detalhes
      </button>
    </div>
  `
    : "";

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

    ${alertaFalta}

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
          Faltas ${faltasExibir > 15 ? "⚠️" : ""}
        </div>
        <div class="performance-value faltas ${
          faltasExibir > 15 ? "excesso" : ""
        }">${faltasExibir}</div>
      </div>
    </div>

    <div style="text-align: center; margin: 1rem 0;">
      <div class="situation-badge ${situacaoDisplay
        .toLowerCase()
        .replace(/\s/g, "-")} ${
    reprovadoPorFalta ? "reprovado-por-falta" : ""
  }">
        ${getSituationIcon(situacao)}
        ${situacaoDisplay}
      </div>
    </div>

    ${cardActions}
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
    const faltasExibir = calculado.faltas;

    // Verificar se é reprovado por falta
    const reprovadoPorFalta =
      situacaoExibir === "Reprovado" && faltasExibir > 15;
    const situacaoDisplay = reprovadoPorFalta
      ? "Reprovado por Falta"
      : situacaoExibir;

    // Para admin, não mostrar botão de detalhes
    const showDetailsButton = currentUser.role !== "admin";
    const actionButton = showDetailsButton
      ? `
      <button onclick="abrirPainelDetalhes('${aluno.ID_Unico}')" class="btn-detalhes">
        👁️ Ver
      </button>
    `
      : `
      <span class="admin-info">Visualização</span>
    `;

    const linha = document.createElement("tr");
    linha.innerHTML = `
            <td>${aluno.ID_Unico}</td>
            <td class="nome-aluno">${aluno.Nome}</td>
            <td class="${
              faltasExibir > 15 ? "faltas excesso" : ""
            }">${faltasExibir} ${faltasExibir > 15 ? "⚠️" : ""}</td>
            <td>${aluno.Nota1 || "-"}</td>
            <td>${aluno.Nota2 || "-"}</td>
            <td>${aluno.Nota3 || "-"}</td>
            <td>${mediaExibir}</td>
            <td>
                <span class="badge ${obterClasseSituacao(situacaoExibir)} ${
      reprovadoPorFalta ? "reprovado-por-falta" : ""
    }">
                    ${situacaoDisplay}
                </span>
            </td>
            <td>
                ${actionButton}
            </td>
        `;
    resultTableBody.appendChild(linha);
  });
}

function abrirPainelDetalhes(alunoId) {
  // Verificar se é admin - admin não deve editar alunos individuais
  if (currentUser && currentUser.role === "admin") {
    mostrarInfo(
      "Administradores devem usar o Dashboard Administrativo para visualizar estatísticas e controlar presenças.",
      "Acesso Restrito"
    );
    return;
  }

  const aluno = allStudentsRawData.find((a) => a.ID_Unico === alunoId);
  if (!aluno) {
    mostrarErro("Aluno não encontrado");
    return;
  }

  // Verificar se professor tem permissão para ver este aluno
  if (currentUser && currentUser.role === "professor") {
    if (!currentUser.courses.includes(aluno.Origem)) {
      mostrarErro(
        "Você não tem permissão para visualizar alunos deste curso.",
        "Acesso Negado"
      );
      return;
    }
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

    // Registrar localmente primeiro
    const dataObj = new Date(data + "T00:00:00");
    attendanceManager.markAttendance(alunoId, dataObj, status, true);

    // Salvar na planilha via API
    const params = new URLSearchParams({
      action: "registrarPresencaAutomatica",
      alunoId: alunoId,
      data: data,
      status: status,
      professor: currentUser?.username || "system",
      marcarTodos: "true",
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
    mostrarSucesso(
      `${acao} registrada com sucesso! Outros alunos marcados automaticamente como falta.`,
      "Registro Concluído"
    );

    fecharModalRegistro();
    await carregarTodosAlunos();
  } catch (error) {
    console.error("❌ Erro ao submeter presença:", error);
    mostrarErro(`Erro ao registrar: ${error.message}`, "Falha no Registro");

    // Reverter registro local se der erro na API
    attendanceManager.clearAllRecords();
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

  // Usar faltas diretamente da planilha (que já inclui o sistema automático)
  const totalFaltas = parseInt(aluno.Faltas) || 0;

  console.log(`📊 Situação ${aluno.Nome}:`, {
    faltasNaPlanilha: totalFaltas,
  });

  if (notas.length === 0) {
    return {
      media: 0,
      situacao: totalFaltas > 15 ? "Reprovado por Falta" : "Em Curso",
      faltas: totalFaltas,
    };
  }

  const media = notas.reduce((a, b) => a + b) / notas.length;

  // Verificar reprovação por falta primeiro
  if (totalFaltas > 15) {
    return {
      media: media.toFixed(2),
      situacao: "Reprovado por Falta",
      faltas: totalFaltas,
    };
  }

  // Depois verificar por nota
  const situacao = media >= 6.0 ? "Aprovado" : "Reprovado";

  return {
    media: media.toFixed(2),
    situacao: situacao,
    faltas: totalFaltas,
  };
}

// Função auxiliar para calcular dias letivos decorridos
function calcularDiasLetivosDecorridos() {
  // Esta é uma simulação - você deve integrar com seu sistema de calendário acadêmico
  // Por exemplo: se o semestre começou em 1º de fevereiro e hoje é 28 de julho
  const inicioSemestre = new Date("2025-02-01");
  const hoje = new Date();
  const diasDecorridos = Math.floor(
    (hoje - inicioSemestre) / (1000 * 60 * 60 * 24)
  );

  // Simular que há aula 5 dias por semana (segunda a sexta)
  // Aproximadamente 22 dias letivos por mês
  const diasLetivos = Math.floor(diasDecorridos * (5 / 7)) - 4 * 2; // Descontar finais de semana e feriados estimados

  return Math.max(0, Math.min(diasLetivos, 100)); // Máximo de 100 dias letivos no semestre
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

  if (!modal) {
    return showCancel ? Promise.resolve(false) : undefined;
  }

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

  // Se showCancel é true, retorna uma Promise
  if (showCancel) {
    return new Promise((resolve) => {
      const closeModal = (result) => {
        modal.classList.remove("active");
        okBtn.onclick = null;
        cancelBtn.onclick = null;
        resolve(result);
      };

      okBtn.onclick = () => closeModal(true);
      cancelBtn.onclick = () => closeModal(false);
    });
  } else {
    // Event listeners para modal simples
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
