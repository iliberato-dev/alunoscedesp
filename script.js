// === CONFIGURAÇÃO DO SISTEMA CEDESP ===
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzNq3Hz1Pvlx3Ty4YGJvj0UM4jQNe2adOEQWyomzpTnBHooEzgHa1TGMWfcd8mpzTDe/exec";

const IS_LOCAL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";
const API_URL = IS_LOCAL ? WEB_APP_URL : "/api/appsscript";

// === SISTEMA DE RASTREAMENTO DE ÚLTIMOS REGISTROS ===
class LastAttendanceTracker {
  constructor() {
    this.storageKey = 'cedesp_last_attendance';
  }

  // Registrar último acesso de um aluno
  recordAttendance(alunoId, data, status, professor) {
    const records = this.getRecords();
    const timestamp = new Date().toISOString();
    
    records[alunoId] = {
      data: data,
      status: status,
      professor: professor,
      timestamp: timestamp,
      displayTime: this.formatDateTime(timestamp)
    };
    
    localStorage.setItem(this.storageKey, JSON.stringify(records));
    console.log(`📝 Registro salvo para aluno ${alunoId}:`, records[alunoId]);
  }

  // Obter último registro de um aluno
  getLastAttendance(alunoId) {
    const records = this.getRecords();
    return records[alunoId] || null;
  }

  // Obter todos os registros
  getRecords() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      return saved ? JSON.parse(saved) : {};
    } catch (error) {
      console.error('Erro ao ler registros de presença:', error);
      return {};
    }
  }

  // Formatar data e hora para exibição
  formatDateTime(isoString) {
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('pt-BR');
    const timeStr = date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    return `${dateStr} às ${timeStr}`;
  }

  // Limpar todos os registros
  clearAll() {
    localStorage.removeItem(this.storageKey);
  }
}

// Instância global do rastreador
const lastAttendanceTracker = new LastAttendanceTracker();

// === SISTEMA DE CACHE OTIMIZADO ===
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutos
    this.attendanceCache = new Map(); // Cache específico para presenças
    this.requestCache = new Map(); // Cache para requests duplicadas
  }

  set(key, data, ttl = this.defaultTTL) {
    this.cache.set(key, data);
    this.cacheExpiry.set(key, Date.now() + ttl);
  }

  get(key) {
    if (!this.cache.has(key)) return null;

    if (Date.now() > this.cacheExpiry.get(key)) {
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
      return null;
    }

    return this.cache.get(key);
  }

  // Cache para presenças com TTL mais longo
  setAttendance(key, data) {
    this.attendanceCache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: 15 * 60 * 1000, // 15 minutos para presenças
    });
  }

  getAttendance(key) {
    const cached = this.attendanceCache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      this.attendanceCache.delete(key);
      return null;
    }

    return cached.data;
  }

  // Cache para requests duplicadas (evita múltiplas chamadas simultâneas)
  setRequest(key, promise) {
    this.requestCache.set(key, {
      promise,
      timestamp: Date.now(),
    });

    // Limpar cache de request após 30 segundos
    setTimeout(() => {
      this.requestCache.delete(key);
    }, 30000);
  }

  getRequest(key) {
    const cached = this.requestCache.get(key);
    if (!cached) return null;

    // Se passou mais de 30s, invalidar
    if (Date.now() - cached.timestamp > 30000) {
      this.requestCache.delete(key);
      return null;
    }

    return cached.promise;
  }

  clear() {
    this.cache.clear();
    this.cacheExpiry.clear();
    this.attendanceCache.clear();
    this.requestCache.clear();
  }

  invalidate(key) {
    this.cache.delete(key);
    this.cacheExpiry.delete(key);
    this.attendanceCache.delete(key);
  }

  // Limpar apenas cache de presenças
  clearAttendance() {
    this.attendanceCache.clear();
  }
}

// === SISTEMA DE PROCESSAMENTO INTELIGENTE COM CACHE ===
class SmartBatchProcessor {
  constructor() {
    this.performanceMetrics = {
      avgResponseTime: 2000,
      successRate: 100,
      errorCount: 0,
      lastOptimalChunkSize: 3,
    };
    this.pendingRequests = new Map(); // Evitar requests duplicadas
  }

  // Calcular chunk size dinâmico baseado na performance
  getOptimalChunkSize() {
    const { avgResponseTime, successRate, errorCount } =
      this.performanceMetrics;

    // Se está com problemas, reduzir chunk
    if (successRate < 80 || errorCount > 3) {
      return Math.max(
        1,
        Math.floor(this.performanceMetrics.lastOptimalChunkSize / 2)
      );
    }

    // Se está indo bem, pode aumentar
    if (successRate > 95 && avgResponseTime < 3000) {
      return Math.min(5, this.performanceMetrics.lastOptimalChunkSize + 1);
    }

    return this.performanceMetrics.lastOptimalChunkSize;
  }

  // Atualizar métricas de performance
  updateMetrics(responseTime, success) {
    // Média móvel simples
    this.performanceMetrics.avgResponseTime =
      this.performanceMetrics.avgResponseTime * 0.7 + responseTime * 0.3;

    if (success) {
      this.performanceMetrics.successRate = Math.min(
        100,
        this.performanceMetrics.successRate + 1
      );
      this.performanceMetrics.errorCount = Math.max(
        0,
        this.performanceMetrics.errorCount - 1
      );
    } else {
      this.performanceMetrics.successRate = Math.max(
        0,
        this.performanceMetrics.successRate - 5
      );
      this.performanceMetrics.errorCount++;
    }
  }

  // Processar com cache inteligente
  async processWithCache(registro) {
    const cacheKey = `attendance_${registro.alunoId}_${registro.data}_${registro.status}`;

    // Verificar se já está em cache
    const cached = cacheManager.getAttendance(cacheKey);
    if (cached) {
      console.log(`📋 Cache hit para ${registro.alunoId}`);
      return { success: true, cached: true, alunoId: registro.alunoId };
    }

    // Verificar se já há uma requisição pendente
    const pendingKey = `pending_${registro.alunoId}_${registro.data}`;
    if (this.pendingRequests.has(pendingKey)) {
      console.log(`⏳ Aguardando requisição pendente para ${registro.alunoId}`);
      return await this.pendingRequests.get(pendingKey);
    }

    // Criar nova requisição
    const requestPromise = this.executeRequest(registro);
    this.pendingRequests.set(pendingKey, requestPromise);

    try {
      const result = await requestPromise;

      // Salvar no cache se sucesso
      if (result.success) {
        cacheManager.setAttendance(cacheKey, result);
      }

      return result;
    } finally {
      this.pendingRequests.delete(pendingKey);
    }
  }

  async executeRequest(registro) {
    const startTime = Date.now();

    try {
      // ✅ USAR FUNÇÃO ROBUSTA PARA CRIAR PARÂMETROS
      const params = createAttendanceParams(registro, true);

      console.log(
        `🚀 Executando request para curso ${registro.curso}:`,
        params.toString()
      );

      // Timeout dinâmico baseado na performance (aumentado para reduzir timeouts)
      const timeout = this.performanceMetrics.errorCount > 2 ? 30000 : 15000;

      const response = await withTimeout(
        fetchWithRetry(`${API_URL}?${params.toString()}`, {}, 1),
        timeout
      );

      const resultado = await response.json();
      const responseTime = Date.now() - startTime;

      this.updateMetrics(responseTime, resultado.success);

      if (resultado.success) {
        return { success: true, alunoId: registro.alunoId, responseTime };
      } else {
        console.error(
          `Erro ao registrar ${registro.alunoId}:`,
          resultado.error
        );
        return {
          success: false,
          error: resultado.error,
          alunoId: registro.alunoId,
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.updateMetrics(responseTime, false);
      console.error(`Erro na requisição para ${registro.alunoId}:`, error);
      return {
        success: false,
        error: error.message,
        alunoId: registro.alunoId,
      };
    }
  }
}

const smartProcessor = new SmartBatchProcessor();

// === FUNÇÃO PARA CRIAR PARÂMETROS ROBUSTOS ===
function createAttendanceParams(registro, forceSpecificCourse = true) {
  const params = {
    action: "registrarPresencaAutomatica",
    alunoId: registro.alunoId,
    data: registro.data,
    status: registro.status,
    professor: registro.professor,
    marcarTodos: "false",
  };

  // ✅ CRÍTICO: Sempre especificar curso quando disponível
  if (registro.curso && forceSpecificCourse) {
    params.curso = registro.curso;
    params.apenasEsteCurso = "true"; // Flag crítica para o backend
    params.naoMarcarOutrosCursos = "true"; // Flag adicional

    console.log(
      `🎯 Parâmetros ESPECÍFICOS para curso ${registro.curso}:`,
      params
    );
  } else {
    console.warn(`⚠️ Registro sem curso específico:`, registro);
  }

  return new URLSearchParams(params);
}

// === SISTEMA DE PRÉ-CACHE INTELIGENTE ===
class PreCacheManager {
  constructor() {
    this.isPreCaching = false;
    this.preCache = new Map();
  }

  // Pré-carregar dados que provavelmente serão usados
  async preCacheAttendance(studentIds, date) {
    if (this.isPreCaching) return;

    this.isPreCaching = true;
    console.log(
      `🔮 Pré-carregando dados de presença para ${studentIds.length} alunos...`
    );

    try {
      // Processar em pequenos chunks para não sobrecarregar
      const chunkSize = 5;
      for (let i = 0; i < studentIds.length; i += chunkSize) {
        const chunk = studentIds.slice(i, i + chunkSize);

        const promises = chunk.map(async (studentId) => {
          const cacheKey = `attendance_${studentId}_${date}`;

          // Se já está em cache, pular
          if (cacheManager.getAttendance(cacheKey)) return;

          try {
            // Simular uma busca rápida de presença
            const params = new URLSearchParams({
              action: "verificarPresenca",
              alunoId: studentId,
              data: date,
            });

            const response = await withTimeout(
              fetch(`${API_URL}?${params.toString()}`),
              5000 // Timeout curto para pré-cache
            );

            if (response.ok) {
              const result = await response.json();
              cacheManager.setAttendance(cacheKey, result);
            }
          } catch (error) {
            // Ignorar erros no pré-cache
            console.warn(`Pre-cache failed for ${studentId}:`, error.message);
          }
        });

        await Promise.allSettled(promises);

        // Pequena pausa entre chunks
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      console.log(`✅ Pré-cache concluído para ${studentIds.length} alunos`);
    } finally {
      this.isPreCaching = false;
    }
  }

  // Limpar pré-cache antigo
  cleanup() {
    this.preCache.clear();
  }
}

const preCacheManager = new PreCacheManager();

// === LIMPEZA AUTOMÁTICA DE CACHE ===
function setupCacheCleanup() {
  // Limpar cache antigo a cada 10 minutos
  setInterval(() => {
    console.log("🧹 Limpeza automática de cache...");

    // Limpar apenas dados muito antigos (mais de 30 minutos)
    const now = Date.now();
    const maxAge = 30 * 60 * 1000; // 30 minutos

    for (const [key, expiry] of cacheManager.cacheExpiry.entries()) {
      if (now - expiry > maxAge) {
        cacheManager.invalidate(key);
      }
    }

    // Limpar pré-cache
    preCacheManager.cleanup();

    console.log("✅ Limpeza de cache concluída");
  }, 10 * 60 * 1000); // A cada 10 minutos
}

// Inicializar limpeza quando a página carregar
document.addEventListener("DOMContentLoaded", () => {
  setupCacheCleanup();
});

// === VARIÁVEIS GLOBAIS OTIMIZADAS ===
let allStudentsRawData = [];
let currentFilteredStudents = [];
let selectedStudentId = null;
let currentUser = null;
const cacheManager = new CacheManager();

// === UTILITÁRIOS DE REDE COM RETRY ===
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Tentativa ${attempt}/${maxRetries} para: ${url.substring(0, 100)}...`
      );
      const response = await fetch(url, options);

      // Se a resposta não é ok, mas não é um erro de rede, não fazer retry
      if (!response.ok && response.status < 500) {
        console.log(`Resposta não-ok recebida: ${response.status}`);
        return response;
      }

      if (response.ok) {
        console.log(`✅ Sucesso na tentativa ${attempt}`);
        return response;
      }

      // Para erros 5xx, fazer retry
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.warn(
        `❌ Tentativa ${attempt}/${maxRetries} falhou:`,
        error.message
      );

      if (attempt === maxRetries) {
        throw error;
      }

      // Backoff exponencial: 1s, 2s, 4s
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

// Função utilitária para criar Promise com timeout
function withTimeout(promise, timeoutMs = 30000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(
        () => reject(new Error(`Timeout após ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

// === SISTEMA DE PRESENÇA EM LOTE ===
let batchAttendanceData = new Map(); // {alunoId: 'P' | 'A'}
let isBatchMode = false;

// === DOM ELEMENTS CACHE ===
const domCache = {
  elements: new Map(),
  get(id) {
    if (!this.elements.has(id)) {
      this.elements.set(id, document.getElementById(id));
    }
    return this.elements.get(id);
  },
};

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
  initializeBatchAttendance();
  
  // Garantir que a visibilidade da tabela esteja correta na inicialização
  setTimeout(() => {
    updateTableButtonVisibility();
  }, 100);
  
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
    statsButton.addEventListener("click", abrirDashboardAdministrativo);
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

// === DASHBOARD ADMINISTRATIVO (MODAL) ===
async function abrirDashboardAdministrativo() {
  if (currentUser.role !== "admin") {
    mostrarErro(
      "Acesso negado. Apenas administradores podem acessar esta funcionalidade.",
      "Acesso Restrito"
    );
    return;
  }

  // Criar modal
  const modal = document.createElement("div");
  modal.id = "dashboardModal";
  modal.className = "modal dashboard-modal";
  modal.innerHTML = `
    <div class="modal-content dashboard-content">
      <div class="modal-header">
        <h2>📊 Dashboard Administrativo - CEDESP</h2>
        <button class="close-btn" onclick="fecharDashboard()" title="Fechar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
          </svg>
        </button>
      </div>
      
      <div class="dashboard-loading" id="dashboardLoading">
        <div class="loading-spinner"></div>
        <p>Carregando dados da planilha...</p>
      </div>
      
      <div class="dashboard-content-area" id="dashboardContent" style="display: none;">
        <!-- Cards de Estatísticas Gerais -->
        <div class="stats-overview">
          <h3>📈 Visão Geral</h3>
          <div class="stats-cards">
            <div class="stat-card">
              <div class="stat-icon">👥</div>
              <div class="stat-info">
                <div class="stat-number" id="totalAlunosCount">0</div>
                <div class="stat-label">Total de Alunos</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">🎓</div>
              <div class="stat-info">
                <div class="stat-number" id="totalCursosCount">0</div>
                <div class="stat-label">Cursos Ativos</div>
              </div>
            </div>
            <div class="stat-card success">
              <div class="stat-icon">✅</div>
              <div class="stat-info">
                <div class="stat-number" id="aprovadosCount">0</div>
                <div class="stat-label">Aprovados</div>
              </div>
            </div>
            <div class="stat-card warning">
              <div class="stat-icon">⚠️</div>
              <div class="stat-info">
                <div class="stat-number" id="reprovadosCount">0</div>
                <div class="stat-label">Reprovados</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Estatísticas por Curso -->
        <div class="course-stats">
          <h3>📚 Estatísticas por Curso</h3>
          <div class="course-cards" id="courseCards">
            <!-- Será preenchido dinamicamente -->
          </div>
        </div>

        <!-- Gráficos e Análises -->
        <div class="charts-section">
          <h3>📊 Análises Visuais</h3>
          <div class="charts-grid">
            <div class="chart-container">
              <h4>Distribuição por Período</h4>
              <canvas id="periodoChart" width="400" height="200"></canvas>
            </div>
            <div class="chart-container">
              <h4>Taxa de Aprovação por Curso</h4>
              <canvas id="aprovacaoChart" width="400" height="200"></canvas>
            </div>
          </div>
        </div>

        <!-- Tabela de Alunos com Problemas -->
        <div class="alerts-section">
          <h3>🚨 Alunos que Precisam de Atenção</h3>
          <div class="alerts-table" id="alertsTable">
            <!-- Será preenchido dinamicamente -->
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.style.display = "block";

  // Carregar dados do dashboard
  await carregarDadosDashboard();
}

function fecharDashboard() {
  const modal = document.getElementById("dashboardModal");
  if (modal) {
    modal.remove();
  }
}

async function carregarDadosDashboard() {
  try {
    console.log("📊 Carregando dados do dashboard...");

    // Usar os dados já carregados ou buscar novos
    let dadosAlunos = allStudentsRawData;

    if (!dadosAlunos || dadosAlunos.length === 0) {
      console.log("🔄 Buscando dados atualizados...");
      await carregarTodosAlunos();
      dadosAlunos = allStudentsRawData;
    }

    if (!dadosAlunos || dadosAlunos.length === 0) {
      throw new Error("Nenhum dado de aluno encontrado");
    }

    // Processar dados para o dashboard
    const stats = processarEstatisticas(dadosAlunos);

    // Exibir dados no dashboard
    exibirDadosDashboard(stats, dadosAlunos);

    // Ocultar loading e mostrar conteúdo
    document.getElementById("dashboardLoading").style.display = "none";
    document.getElementById("dashboardContent").style.display = "block";

    console.log("✅ Dashboard carregado com sucesso");
  } catch (error) {
    console.error("❌ Erro ao carregar dashboard:", error);
    document.getElementById("dashboardLoading").innerHTML = `
      <div class="error-message">
        <span class="error-icon">❌</span>
        <p>Erro ao carregar dados: ${error.message}</p>
        <button onclick="carregarDadosDashboard()" class="btn-primary">Tentar Novamente</button>
      </div>
    `;
  }
}

function processarEstatisticas(dadosAlunos) {
  const stats = {
    totalAlunos: dadosAlunos.length,
    cursos: {},
    periodos: {},
    aprovados: 0,
    reprovados: 0,
    emCurso: 0,
    alertas: [],
  };

  // Processar cada aluno
  dadosAlunos.forEach((aluno) => {
    // Contagem por curso
    if (!stats.cursos[aluno.Origem]) {
      stats.cursos[aluno.Origem] = {
        nome: aluno.Origem,
        periodo: aluno.Periodo,
        total: 0,
        aprovados: 0,
        reprovados: 0,
        emCurso: 0,
        mediaGeral: 0,
        somaMedias: 0,
        alunosComMedia: 0,
      };
    }
    stats.cursos[aluno.Origem].total++;

    // Contagem por período
    if (!stats.periodos[aluno.Periodo]) {
      stats.periodos[aluno.Periodo] = 0;
    }
    stats.periodos[aluno.Periodo]++;

    // Análise de situação
    const media = parseFloat(aluno.Media) || 0;
    const faltas = parseInt(aluno.Faltas) || 0;

    if (media > 0) {
      stats.cursos[aluno.Origem].somaMedias += media;
      stats.cursos[aluno.Origem].alunosComMedia++;

      if (media >= 6.0) {
        stats.aprovados++;
        stats.cursos[aluno.Origem].aprovados++;
      } else {
        stats.reprovados++;
        stats.cursos[aluno.Origem].reprovados++;
      }
    } else {
      stats.emCurso++;
      stats.cursos[aluno.Origem].emCurso++;
    }

    // Alertas (alunos com problemas)
    if (faltas >= 10 || (media > 0 && media < 6.0)) {
      const motivo = [];
      if (faltas >= 10) motivo.push(`${faltas} faltas`);
      if (media > 0 && media < 6.0) motivo.push(`Média ${media}`);

      stats.alertas.push({
        id: aluno.ID_Unico,
        nome: aluno.Nome,
        curso: aluno.Origem,
        periodo: aluno.Periodo,
        media: media,
        faltas: faltas,
        motivo: motivo.join(", "),
        prioridade: faltas >= 15 || media < 4.0 ? "alta" : "media",
      });
    }
  });

  // Calcular médias gerais por curso
  Object.values(stats.cursos).forEach((curso) => {
    if (curso.alunosComMedia > 0) {
      curso.mediaGeral = (curso.somaMedias / curso.alunosComMedia).toFixed(1);
    }
  });

  // Ordenar alertas por prioridade
  stats.alertas.sort((a, b) => {
    if (a.prioridade === "alta" && b.prioridade !== "alta") return -1;
    if (a.prioridade !== "alta" && b.prioridade === "alta") return 1;
    return b.faltas - a.faltas;
  });

  return stats;
}

function exibirDadosDashboard(stats, dadosAlunos) {
  // Atualizar cards principais
  document.getElementById("totalAlunosCount").textContent = stats.totalAlunos;
  document.getElementById("totalCursosCount").textContent = Object.keys(
    stats.cursos
  ).length;
  document.getElementById("aprovadosCount").textContent = stats.aprovados;
  document.getElementById("reprovadosCount").textContent = stats.reprovados;

  // Criar cards por curso
  const courseCardsContainer = document.getElementById("courseCards");
  courseCardsContainer.innerHTML = "";

  Object.values(stats.cursos).forEach((curso) => {
    const cursoCard = document.createElement("div");
    cursoCard.className = "course-card";
    cursoCard.innerHTML = `
      <div class="course-header">
        <h4>${curso.nome}</h4>
        <span class="course-period">${curso.periodo}</span>
      </div>
      <div class="course-stats-grid">
        <div class="course-stat">
          <span class="stat-value">${curso.total}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="course-stat success">
          <span class="stat-value">${curso.aprovados}</span>
          <span class="stat-label">Aprovados</span>
        </div>
        <div class="course-stat warning">
          <span class="stat-value">${curso.reprovados}</span>
          <span class="stat-label">Reprovados</span>
        </div>
        <div class="course-stat info">
          <span class="stat-value">${curso.mediaGeral || "N/A"}</span>
          <span class="stat-label">Média Geral</span>
        </div>
      </div>
    `;
    courseCardsContainer.appendChild(cursoCard);
  });

  // Criar tabela de alertas
  const alertsContainer = document.getElementById("alertsTable");
  if (stats.alertas.length > 0) {
    alertsContainer.innerHTML = `
      <table class="alerts-table-grid">
        <thead>
          <tr>
            <th>Prioridade</th>
            <th>ID</th>
            <th>Nome</th>
            <th>Curso</th>
            <th>Motivo</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          ${stats.alertas
            .map(
              (alerta) => `
            <tr class="alert-row ${alerta.prioridade}">
              <td data-label="Prioridade">
                <span class="priority-badge ${alerta.prioridade}">
                  ${alerta.prioridade === "alta" ? "🔴 Alta" : "🟡 Média"}
                </span>
              </td>
              <td data-label="ID">${alerta.id}</td>
              <td data-label="Nome">${alerta.nome}</td>
              <td data-label="Curso">${alerta.curso}</td>
              <td data-label="Motivo">${alerta.motivo}</td>
              <td data-label="Ações">
                <button class="btn-small btn-primary" onclick="abrirDetalhesAluno('${
                  alerta.id
                }')">
                  Ver Detalhes
                </button>
              </td>
            </tr>
          `
            )
            .join("")}
        </tbody>
      </table>
    `;
  } else {
    alertsContainer.innerHTML = `
      <div class="no-alerts">
        <span class="success-icon">✅</span>
        <p>Ótimo! Nenhum aluno precisa de atenção especial no momento.</p>
      </div>
    `;
  }

  // Criar gráficos simples (usando CSS)
  criarGraficosCSS(stats);
}

function criarGraficosCSS(stats) {
  // Gráfico de períodos
  const periodoChart = document.getElementById("periodoChart");
  const periodoData = Object.entries(stats.periodos);
  const maxPeriodo = Math.max(...periodoData.map(([_, count]) => count));

  periodoChart.innerHTML = "";
  periodoChart.style.cssText =
    "display: flex; align-items: end; gap: 10px; height: 200px; padding: 20px;";

  periodoData.forEach(([periodo, count]) => {
    const height = (count / maxPeriodo) * 160;
    const bar = document.createElement("div");
    bar.style.cssText = `
      background: var(--gradient-secondary);
      width: 60px;
      height: ${height}px;
      border-radius: 4px 4px 0 0;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      align-items: center;
      color: var(--color-primary);
      font-weight: bold;
      position: relative;
    `;
    bar.innerHTML = `
      <span style="margin-top: 5px; font-size: 12px;">${count}</span>
      <span style="position: absolute; bottom: -25px; font-size: 10px; color: var(--color-text-muted);">
        ${periodo}
      </span>
    `;
    periodoChart.appendChild(bar);
  });

  // Gráfico de aprovação por curso
  const aprovacaoChart = document.getElementById("aprovacaoChart");
  aprovacaoChart.innerHTML = "";
  aprovacaoChart.style.cssText = "padding: 20px;";

  Object.values(stats.cursos).forEach((curso) => {
    const total = curso.total;
    const aprovados = curso.aprovados;
    const taxa = total > 0 ? (aprovados / total) * 100 : 0;

    const row = document.createElement("div");
    row.style.cssText = "margin-bottom: 15px;";
    row.innerHTML = `
      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
        <span style="color: var(--color-text-primary); font-size: 12px;">${
          curso.nome
        }</span>
        <span style="color: var(--color-text-secondary); font-size: 12px; font-weight: bold;">${taxa.toFixed(
          1
        )}%</span>
      </div>
      <div style="background: rgba(255,255,255,0.1); border-radius: 10px; height: 8px;">
        <div style="background: var(--gradient-secondary); height: 8px; width: ${taxa}%; border-radius: 10px; transition: width 0.5s ease;"></div>
      </div>
    `;
    aprovacaoChart.appendChild(row);
  });
}

function abrirDetalhesAluno(alunoId) {
  // Fechar dashboard
  fecharDashboard();

  // Encontrar e exibir detalhes do aluno
  const aluno = allStudentsRawData.find((a) => a.ID_Unico === alunoId);
  if (aluno) {
    selectedStudentId = alunoId;
    exibirDetalhesAluno(aluno);
  }
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
        <button class="close-btn" onclick="fecharControlePresencas()" title="Fechar">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
          </svg>
        </button>
      </div>
      
      <div class="attendance-filters">
        <div class="filters-section">
          <h3>🎯 Filtros de Consulta</h3>
          
          <div class="filter-row">
            <div class="filter-group">
              <label for="attendanceDate">📅 Data Específica:</label>
              <input type="date" id="attendanceDate" class="form-control date-input">
            </div>
            
            <div class="filter-group">
              <label for="attendanceCourse">🎓 Curso:</label>
              <select id="attendanceCourse" class="form-control select-input">
                <option value="">Todos os Cursos</option>
                <option value="PWT">Programação Web - Tarde</option>
                <option value="PWN">Programação Web - Noite</option>
                <option value="DGT">Design Gráfico - Tarde</option>
                <option value="DGN">Design Gráfico - Noite</option>
                <option value="MNT">Manicure - Tarde</option>
                <option value="MNN">Manicure - Noite</option>
              </select>
            </div>
          </div>
          
          <div class="filter-section-divider">
            <span>ou</span>
          </div>
          
          <div class="filter-row period-row">
            <div class="filter-group">
              <label for="attendanceDateStart">📅 Período - Data Inicial:</label>
              <input type="date" id="attendanceDateStart" class="form-control date-input">
            </div>
            
            <div class="filter-group">
              <label for="attendanceDateEnd">📅 Período - Data Final:</label>
              <input type="date" id="attendanceDateEnd" class="form-control date-input">
            </div>
          </div>
        </div>
        
        <div class="filter-actions">
          <button id="consultarPresencas" class="btn-primary action-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
            <span>Consultar Presenças</span>
          </button>
          <button id="exportarPresencas" class="btn-secondary action-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
            </svg>
            <span>Exportar Dados</span>
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

  // Definir data padrão como hoje (corrigindo timezone)
  const hoje = new Date();
  hoje.setMinutes(hoje.getMinutes() - hoje.getTimezoneOffset());
  const hojeFormatado = hoje.toISOString().split("T")[0];
  document.getElementById("attendanceDate").value = hojeFormatado;

  // Melhorar interação entre campos de data
  setupDateFieldsInteraction();
}

function fecharControlePresencas() {
  const modal = document.getElementById("attendanceControlModal");
  if (modal) {
    modal.remove();
  }
}

// Função para melhorar a interação entre os campos de data
function setupDateFieldsInteraction() {
  const dateSpecific = document.getElementById("attendanceDate");
  const dateStart = document.getElementById("attendanceDateStart");
  const dateEnd = document.getElementById("attendanceDateEnd");

  // Quando preenche data específica, limpa período
  dateSpecific.addEventListener("input", () => {
    if (dateSpecific.value) {
      dateStart.value = "";
      dateEnd.value = "";
    }
  });

  // Quando preenche período, limpa data específica
  [dateStart, dateEnd].forEach((input) => {
    input.addEventListener("input", () => {
      if (dateStart.value || dateEnd.value) {
        dateSpecific.value = "";
      }
    });
  });
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
    ? `Data: ${new Date(dateFilter + "T12:00:00").toLocaleDateString("pt-BR")}`
    : `Período: ${new Date(startDate + "T12:00:00").toLocaleDateString(
        "pt-BR"
      )} a ${new Date(endDate + "T12:00:00").toLocaleDateString("pt-BR")}`;

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
              <td data-label="ID">${record.studentId}</td>
              <td data-label="Nome do Aluno">${record.studentName}</td>
              <td data-label="Curso">${record.course}</td>
              <td data-label="Período">${record.period}</td>
              <td data-label="Status">
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
  // Cache de elementos mais usados
  const elements = {
    searchButton: domCache.get("searchButton"),
    clearSearchButton: domCache.get("clearSearchButton"),
    showAllButton: domCache.get("showAllButton"),
    searchInput: domCache.get("searchInput"),
    autocompleteDropdown: domCache.get("autocompleteDropdown"),
    periodoFilter: domCache.get("periodoFilter"),
    cursoFilter: domCache.get("cursoFilter"),
    registerButton: domCache.get("registerButton"),
    closeRegistrationModalButton: domCache.get("closeRegistrationModalButton"),
    submitPresencaButton: domCache.get("submitPresenca"),
  };

  // Event listeners otimizados
  elements.searchButton?.addEventListener("click", buscarAlunos);
  elements.clearSearchButton?.addEventListener("click", limparFiltros);
  elements.showAllButton?.addEventListener("click", () =>
    carregarTodosAlunos(true)
  ); // Force refresh

  elements.searchInput?.addEventListener("keypress", (e) => {
    if (e.key === "Enter") buscarAlunos();
  });

  // Autocomplete functionality
  elements.searchInput?.addEventListener("input", handleAutocomplete);
  elements.searchInput?.addEventListener(
    "keydown",
    handleAutocompleteNavigation
  );
  elements.searchInput?.addEventListener("blur", () => {
    // Delay hiding to allow item selection
    setTimeout(() => hideAutocomplete(), 200);
  });

  console.log("🔗 Autocomplete events attached:", {
    searchInput: !!elements.searchInput,
    dropdown: !!elements.autocompleteDropdown,
  });

  // Filtros com debounce
  elements.periodoFilter?.addEventListener(
    "change",
    debounce(aplicarFiltros, 300)
  );
  elements.cursoFilter?.addEventListener(
    "change",
    debounce(aplicarFiltros, 300)
  );

  // Modal de registro
  elements.registerButton?.addEventListener("click", abrirModalRegistro);
  elements.closeRegistrationModalButton?.addEventListener(
    "click",
    fecharModalRegistro
  );
  elements.submitPresencaButton?.addEventListener("click", submeterPresenca);
}

// Função debounce para otimizar filtros
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
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

// Função para detectar se é dispositivo móvel
function isMobileDevice() {
  return window.innerWidth <= 768;
}

// Função para detectar orientação landscape
function isLandscape() {
  return window.innerWidth > window.innerHeight;
}

// Função para verificar se tabela deve estar disponível
function shouldShowTableOption() {
  if (!isMobileDevice()) {
    return true; // Desktop sempre pode usar tabela
  }
  
  // Mobile: só permite tabela em landscape
  return isLandscape();
}

// Função para atualizar visibilidade do botão tabela
function updateTableButtonVisibility() {
  const tableViewBtn = document.getElementById("tableViewBtn");
  const viewToggle = document.querySelector(".view-toggle");
  const isMobile = isMobileDevice();
  const isPortrait = !isLandscape();
  const shouldShow = shouldShowTableOption();
  
  console.log(`📱 Dispositivo: ${isMobile ? 'Mobile' : 'Desktop'}, Orientação: ${isPortrait ? 'Retrato' : 'Paisagem'}, Mostrar Tabela: ${shouldShow}`);
  
  if (tableViewBtn && viewToggle) {
    if (shouldShow) {
      tableViewBtn.style.display = "flex";
      viewToggle.classList.remove("mobile-portrait-mode");
      console.log("✅ Botão tabela habilitado");
    } else {
      tableViewBtn.style.display = "none";
      viewToggle.classList.add("mobile-portrait-mode");
      console.log("❌ Botão tabela desabilitado - Mobile Portrait");
      
      // Se estava em modo tabela e não pode mais usar, volta para cards
      if (currentView === "table") {
        console.log("🔄 Forçando volta para modo cards");
        switchView("cards");
      }
    }
  }
}

function initializeViewToggle() {
  const cardViewBtn = document.getElementById("cardViewBtn");
  const tableViewBtn = document.getElementById("tableViewBtn");

  if (cardViewBtn && tableViewBtn) {
    cardViewBtn.addEventListener("click", () => switchView("cards"));
    tableViewBtn.addEventListener("click", () => {
      // Verificar se tabela está permitida antes de trocar
      if (shouldShowTableOption()) {
        switchView("table");
      } else {
        console.log("Tabela não disponível em modo retrato mobile");
      }
    });
  }

  // Listener para mudanças de orientação e redimensionamento
  window.addEventListener("resize", () => {
    updateTableButtonVisibility();
  });

  window.addEventListener("orientationchange", () => {
    // Delay para aguardar a mudança de orientação completa
    setTimeout(() => {
      updateTableButtonVisibility();
    }, 500);
  });

  // Listener adicional para mudanças de orientação via media query
  const mediaQuery = window.matchMedia("(orientation: portrait)");
  if (mediaQuery.addListener) {
    mediaQuery.addListener((e) => {
      setTimeout(() => {
        updateTableButtonVisibility();
      }, 300);
    });
  } else if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener("change", (e) => {
      setTimeout(() => {
        updateTableButtonVisibility();
      }, 300);
    });
  }

  // Carrega visualização salva ou usa cards como padrão
  const savedView = localStorage.getItem("viewMode") || "cards";
  
  // Inicializar visibilidade do botão
  updateTableButtonVisibility();
  
  // Aplicar view apenas se permitida
  if (savedView === "table" && shouldShowTableOption()) {
    switchView("table");
  } else {
    switchView("cards");
  }
}

function switchView(view) {
  // Validar se a view solicitada é permitida
  if (view === "table" && !shouldShowTableOption()) {
    console.log("Forçando modo cards - tabela não disponível");
    view = "cards";
  }
  
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
      // Remove classe table-mode
      tableContainer.querySelectorAll(".table-wrapper").forEach((wrapper) => {
        wrapper.classList.remove("table-mode");
      });
      // Esconder controles de presença em lote no modo cards
      cancelBatchAttendance();
    } else {
      cardsContainer.classList.add("hidden");
      tableContainer.classList.remove("hidden");
      // Adiciona classe table-mode
      tableContainer.querySelectorAll(".table-wrapper").forEach((wrapper) => {
        wrapper.classList.add("table-mode");
      });
      // Mostrar controles de presença em lote no modo tabela se houver alunos
      if (currentFilteredStudents.length > 0) {
        updateBatchControls();
      }
    }
  }

  // Re-renderizar dados no novo formato
  if (currentFilteredStudents.length > 0) {
    exibirResultados(currentFilteredStudents);
  }
}

// === FUNÇÕES DE API ===
async function carregarTodosAlunos(forceRefresh = false) {
  try {
    const cacheKey = "allStudents";

    // Verificar cache primeiro (exceto se forçar refresh)
    if (!forceRefresh) {
      const cachedData = cacheManager.get(cacheKey);
      if (cachedData) {
        console.log("� Carregando do cache (super rápido!)");
        allStudentsRawData = cachedData;

        const filteredByUser =
          currentUser.role === "professor"
            ? allStudentsRawData.filter((aluno) =>
                currentUser.courses.includes(aluno.Origem)
              )
            : allStudentsRawData;
        currentFilteredStudents = [...filteredByUser];

        exibirResultados(currentFilteredStudents);
        preencherFiltros();
        return;
      }
    }

    mostrarLoading(true);
    atualizarTextoLoading("Carregando alunos...", "Buscando dados atualizados");
    mostrarProgressIndicator(true, 30);

    console.log("📡 Carregando alunos da API...");

    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    mostrarProgressIndicator(true, 70);

    if (data.error) {
      throw new Error(data.error);
    }

    allStudentsRawData = data.saida || [];

    // Salvar no cache
    cacheManager.set(cacheKey, allStudentsRawData);

    // Aplicar filtros baseados no usuário logado
    const filteredByUser =
      currentUser.role === "professor"
        ? allStudentsRawData.filter((aluno) =>
            currentUser.courses.includes(aluno.Origem)
          )
        : allStudentsRawData;
    currentFilteredStudents = [...filteredByUser];

    console.log(
      `📊 ${allStudentsRawData.length} alunos total, ${filteredByUser.length} acessíveis para ${currentUser.name}`
    );

    mostrarProgressIndicator(true, 100);

    exibirResultados(currentFilteredStudents);
    preencherFiltros();

    // 🔥 PRÉ-CACHE INTELIGENTE: Carregar dados de presença em background
    if (filteredByUser.length > 0 && filteredByUser.length <= 50) {
      // Apenas para listas pequenas
      const today = new Date().toISOString().split("T")[0];
      const studentIds = filteredByUser.map((aluno) => aluno.ID_Unico);

      // Fazer pré-cache em background (não bloquear UI)
      setTimeout(() => {
        preCacheManager.preCacheAttendance(studentIds, today);
      }, 1000);
    }

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

    // ✅ FILTRAR RESULTADOS POR PERMISSÕES DO USUÁRIO
    let resultadosFiltrados = resultados;
    if (currentUser.role === "professor") {
      resultadosFiltrados = resultados.filter((aluno) =>
        currentUser.courses.includes(aluno.Origem)
      );
      console.log(
        `🔒 Professor - filtrados ${resultados.length} → ${resultadosFiltrados.length} alunos por permissões`
      );
    }

    currentFilteredStudents = resultadosFiltrados;

    console.log(
      `📊 ${resultadosFiltrados.length} alunos encontrados (após filtros de permissão)`
    );

    exibirResultados(resultadosFiltrados);

    // Mostra toast com resultado da busca
    if (resultadosFiltrados.length === 0) {
      if (
        currentUser.role === "professor" &&
        resultados.length > resultadosFiltrados.length
      ) {
        mostrarToast(
          "Nenhum aluno encontrado nos seus cursos autorizados",
          "warning",
          "Acesso restrito"
        );
      } else {
        mostrarToast(
          "Nenhum aluno encontrado com os filtros aplicados",
          "warning",
          "Busca vazia"
        );
      }
    } else {
      mostrarToast(
        `${resultadosFiltrados.length} aluno(s) encontrado(s)`,
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

  // ✅ IDENTIFICAR CURSO DO ALUNO PARA OTIMIZAÇÃO
  const aluno = allStudentsRawData.find(
    (a) => a.ID_Unico === selectedStudentId
  );

  if (!aluno) {
    mostrarErro("Aluno não encontrado nos dados carregados.", "Erro de Dados");
    return;
  }

  const cursoAluno = aluno.Origem;

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
      curso: cursoAluno, // ✅ Log do curso para debug
    });

    // Primeiro registrar no AttendanceManager local
    const dataObj = new Date();
    attendanceManager.markAttendance(selectedStudentId, dataObj, status, true);

    // ✅ OTIMIZAÇÃO: Depois salvar na planilha via API APENAS NO CURSO ESPECÍFICO
    const params = new URLSearchParams({
      action: "registrarPresencaAutomatica",
      alunoId: selectedStudentId,
      data: dataHoje,
      status: status,
      professor: currentUser.username,
      curso: cursoAluno, // ✅ Especificar curso para processar apenas essa aba/coluna
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
  const resultTableBody = domCache.get("resultTableBody");
  const studentsGrid = domCache.get("studentsGrid");
  const noResultsMessage = domCache.get("noResults");

  // Limpa os containers (mais eficiente que innerHTML)
  if (resultTableBody) {
    while (resultTableBody.firstChild) {
      resultTableBody.firstChild.remove();
    }
  }
  if (studentsGrid) {
    while (studentsGrid.firstChild) {
      studentsGrid.firstChild.remove();
    }
  }

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
  const studentsGrid = domCache.get("studentsGrid");
  if (!studentsGrid) return;

  // Usar DocumentFragment para melhor performance
  const fragment = document.createDocumentFragment();

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

    fragment.appendChild(card);
  });

  // Adicionar todos os cards de uma vez (melhor performance)
  studentsGrid.appendChild(fragment);
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

  // Obter último registro de presença
  const lastAttendance = lastAttendanceTracker.getLastAttendance(aluno.ID_Unico);
  const lastAttendanceDisplay = lastAttendance 
    ? `<div class="last-attendance">
         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="attendance-icon">
           <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
           <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
         </svg>
         <div class="attendance-info">
           <span class="attendance-label">Último registro:</span>
           <span class="attendance-date">${lastAttendance.displayTime}</span>
           <span class="attendance-status ${lastAttendance.status === 'P' ? 'presente' : 'ausente'}">
             ${lastAttendance.status === 'P' ? '✅ Presente' : '❌ Ausente'}
           </span>
         </div>
       </div>`
    : `<div class="last-attendance no-record">
         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="attendance-icon">
           <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
           <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
         </svg>
         <div class="attendance-info">
           <span class="attendance-label">Nenhum registro encontrado</span>
         </div>
       </div>`;

  // Alerta para excesso de faltas
  const alertaFalta =
    faltasExibir > 15
      ? `<div class="alert-falta">
      <i class="fas fa-exclamation-triangle"></i>
      ATENÇÃO: Aluno excedeu o limite de faltas (${faltasExibir}/15)
    </div>`
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
    
    ${lastAttendanceDisplay}

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

    <!-- Seção de Presença no Card -->
    <div class="card-attendance-section" id="attendanceSection-${aluno.ID_Unico}">
      <div class="attendance-toggle">
        <label class="attendance-checkbox-label">
          <input 
            type="checkbox" 
            class="attendance-checkbox" 
            id="attendanceCheck-${aluno.ID_Unico}"
            data-student-id="${aluno.ID_Unico}"
            data-student-name="${aluno.Nome}"
            data-student-course="${aluno.Origem}"
          />
          <span class="checkmark"></span>
          <span class="checkbox-text">Registrar Presença</span>
        </label>
      </div>
      
      <div class="attendance-controls hidden" id="attendanceControls-${aluno.ID_Unico}">
        <div class="attendance-date-group">
          <label for="attendanceDate-${aluno.ID_Unico}">Data:</label>
          <input 
            type="date" 
            id="attendanceDate-${aluno.ID_Unico}" 
            class="attendance-date-input"
            value="${new Date().toISOString().split('T')[0]}"
          />
        </div>
        
        <div class="attendance-status-group">
          <label class="status-radio">
            <input 
              type="radio" 
              name="status-${aluno.ID_Unico}" 
              value="P" 
              checked
            />
            <span class="radio-text">✅ Presente</span>
          </label>
          <label class="status-radio">
            <input 
              type="radio" 
              name="status-${aluno.ID_Unico}" 
              value="A"
            />
            <span class="radio-text">❌ Ausente</span>
          </label>
        </div>
        
        <button 
          class="register-attendance-btn" 
          onclick="registrarPresencaCard('${aluno.ID_Unico}')"
        >
          📝 Registrar
        </button>
      </div>
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
  const resultTableBody = domCache.get("resultTableBody");
  if (!resultTableBody) return;

  // Usar DocumentFragment para melhor performance
  const fragment = document.createDocumentFragment();

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

    const linha = document.createElement("tr");
    linha.setAttribute("data-aluno-id", aluno.ID_Unico);
    linha.innerHTML = `
            <td data-label="ID">${aluno.ID_Unico}</td>
            <td data-label="Nome" class="nome-aluno">${aluno.Nome}</td>
            <td data-label="Faltas" class="${
              faltasExibir > 15 ? "faltas excesso" : ""
            }">${faltasExibir} ${faltasExibir > 15 ? "⚠️" : ""}</td>
            <td data-label="1º Bimestre">${aluno.Nota1 || "-"}</td>
            <td data-label="2º Bimestre">${aluno.Nota2 || "-"}</td>
            <td data-label="3º Bimestre">${aluno.Nota3 || "-"}</td>
            <td data-label="Média">${mediaExibir}</td>
            <td data-label="Situação">
                <span class="badge ${obterClasseSituacao(situacaoExibir)} ${
      reprovadoPorFalta ? "reprovado-por-falta" : ""
    }">
                    ${situacaoDisplay}
                </span>
            </td>
            <td data-label="✅ Presente" class="attendance-col">
                <input type="checkbox" 
                       class="attendance-checkbox present" 
                       data-aluno-id="${aluno.ID_Unico}"
                       data-type="present"
                       onchange="handleAttendanceChange(this)">
            </td>
            <td data-label="❌ Ausente" class="attendance-col">
                <input type="checkbox" 
                       class="attendance-checkbox absent" 
                       data-aluno-id="${aluno.ID_Unico}"
                       data-type="absent"
                       onchange="handleAttendanceChange(this)">
            </td>
        `;
    fragment.appendChild(linha);
  });

  // Adicionar todas as linhas de uma vez
  resultTableBody.appendChild(fragment);
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

// ===== AUTOCOMPLETE FUNCTIONALITY =====
let autocompleteIndex = -1;
let autocompleteItems = [];

function handleAutocomplete(e) {
  const searchTerm = e.target.value.toLowerCase().trim();
  const dropdown = domCache.get("autocompleteDropdown");

  console.log("🔍 Autocomplete:", searchTerm, "dropdown:", !!dropdown);

  if (!dropdown) return;

  if (searchTerm.length < 2) {
    hideAutocomplete();
    return;
  }

  // Filtrar alunos baseado nas permissões do usuário
  let availableStudents = allStudentsRawData;

  if (currentUser.role === "professor") {
    availableStudents = availableStudents.filter((aluno) =>
      currentUser.courses.includes(aluno.Origem)
    );
  }

  console.log("👥 Estudantes disponíveis:", availableStudents.length);

  // Buscar correspondências
  const matches = availableStudents
    .filter((aluno) => aluno.Nome.toLowerCase().includes(searchTerm))
    .slice(0, 8); // Limitar a 8 resultados

  console.log("🎯 Correspondências:", matches.length);

  if (matches.length === 0) {
    hideAutocomplete();
    return;
  }

  showAutocomplete(matches);
}

function showAutocomplete(matches) {
  const dropdown = domCache.get("autocompleteDropdown");
  if (!dropdown) return;

  autocompleteItems = matches;
  autocompleteIndex = -1;

  const courseNames = {
    PWT: "Programação Web - Tarde",
    PWN: "Programação Web - Noite",
    DGT: "Design Gráfico - Tarde",
    DGN: "Design Gráfico - Noite",
    MNT: "Manicure - Tarde",
    MNN: "Manicure - Noite",
  };

  dropdown.innerHTML = matches
    .map(
      (aluno, index) => `
      <div class="autocomplete-item" data-index="${index}" onclick="selectAutocompleteItem(${index})">
        <span>${aluno.Nome}</span>
        <span class="autocomplete-course">${
          courseNames[aluno.Origem] || aluno.Origem
        }</span>
      </div>
    `
    )
    .join("");

  dropdown.classList.add("show");
}

function hideAutocomplete() {
  const dropdown = domCache.get("autocompleteDropdown");
  if (dropdown) {
    dropdown.classList.remove("show");
    autocompleteIndex = -1;
    autocompleteItems = [];
  }
}

function selectAutocompleteItem(index) {
  const searchInput = domCache.get("searchInput");
  if (!searchInput || !autocompleteItems[index]) return;

  searchInput.value = autocompleteItems[index].Nome;
  hideAutocomplete();
  buscarAlunos(); // Executar busca automaticamente
}

// Tornar a função global para onClick
window.selectAutocompleteItem = selectAutocompleteItem;

function handleAutocompleteNavigation(e) {
  const dropdown = domCache.get("autocompleteDropdown");
  if (!dropdown || !dropdown.classList.contains("show")) return;

  const items = dropdown.querySelectorAll(".autocomplete-item");

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      autocompleteIndex = Math.min(autocompleteIndex + 1, items.length - 1);
      updateAutocompleteHighlight(items);
      break;

    case "ArrowUp":
      e.preventDefault();
      autocompleteIndex = Math.max(autocompleteIndex - 1, -1);
      updateAutocompleteHighlight(items);
      break;

    case "Enter":
      e.preventDefault();
      if (autocompleteIndex >= 0 && autocompleteItems[autocompleteIndex]) {
        selectAutocompleteItem(autocompleteIndex);
      } else {
        hideAutocomplete();
        buscarAlunos();
      }
      break;

    case "Escape":
      hideAutocomplete();
      break;
  }
}

function updateAutocompleteHighlight(items) {
  items.forEach((item, index) => {
    if (index === autocompleteIndex) {
      item.classList.add("highlighted");
    } else {
      item.classList.remove("highlighted");
    }
  });
}

function aplicarFiltros() {
  // Esta função aplica filtros localmente nos dados já carregados
  const searchInput = domCache.get("searchInput");
  const periodoFilter = domCache.get("periodoFilter");
  const cursoFilter = domCache.get("cursoFilter");

  const nomeAluno = searchInput ? searchInput.value.toLowerCase().trim() : "";
  const periodo = periodoFilter ? periodoFilter.value : "";
  const curso = cursoFilter ? cursoFilter.value : "";

  let alunosFiltrados = allStudentsRawData;

  // ✅ FILTRO POR PERMISSÕES DO USUÁRIO
  if (currentUser.role === "professor") {
    alunosFiltrados = alunosFiltrados.filter((aluno) =>
      currentUser.courses.includes(aluno.Origem)
    );
    console.log(
      `🔒 Professor - mostrando apenas cursos: ${currentUser.courses.join(
        ", "
      )}`
    );
  }

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

  // ✅ FILTRAR DADOS BASEADO NAS PERMISSÕES DO USUÁRIO
  let dadosPermitidos = allStudentsRawData;
  if (currentUser.role === "professor") {
    dadosPermitidos = allStudentsRawData.filter((aluno) =>
      currentUser.courses.includes(aluno.Origem)
    );
    console.log(
      `🔒 Preenchendo filtros apenas com cursos do professor: ${currentUser.courses.join(
        ", "
      )}`
    );
  }

  if (periodoFilter) {
    const periodos = [
      ...new Set(dadosPermitidos.map((a) => a.Periodo).filter((p) => p)),
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
    // ✅ USAR APENAS CURSOS PERMITIDOS PARA O USUÁRIO
    let cursosPermitidos;

    if (currentUser.role === "professor") {
      // Professor: apenas seus cursos autorizados
      cursosPermitidos = currentUser.courses;
      console.log(
        `👨‍🏫 Professor - cursos no filtro: ${cursosPermitidos.join(", ")}`
      );
    } else {
      // Admin: todos os cursos disponíveis nos dados
      cursosPermitidos = [
        ...new Set(allStudentsRawData.map((a) => a.Origem).filter((o) => o)),
      ];
      console.log(
        `👑 Admin - todos os cursos disponíveis: ${cursosPermitidos.join(", ")}`
      );
    }

    // Mapeamento de nomes dos cursos
    const courseNames = {
      PWT: "Programação Web - Tarde",
      PWN: "Programação Web - Noite",
      DGT: "Design Gráfico - Tarde",
      DGN: "Design Gráfico - Noite",
      MNT: "Manicure - Tarde",
      MNN: "Manicure - Noite",
    };

    cursoFilter.innerHTML = '<option value="">Todos os cursos</option>';
    cursosPermitidos.forEach((curso) => {
      const option = document.createElement("option");
      option.value = curso;
      option.textContent = courseNames[curso] || curso;
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
    registrationModal.classList.remove("hidden");
    registrationModal.style.display = "block";
    esconderStatusRegistro(); // Garantir que status está escondido
    preencherModalRegistro();
  }
}

function fecharModalRegistro() {
  const registrationModal = document.getElementById("registrationModal");
  if (registrationModal) {
    registrationModal.style.display = "none";
    registrationModal.classList.add("hidden");
    esconderStatusRegistro();
  }
}

function preencherModalRegistro() {
  const alunoSelecionadoSelect = document.getElementById("alunoSelecionado");
  const dataPresencaInput = document.getElementById("dataPresenca");
  const filtroOrigemModal = document.getElementById("filtroOrigemModal");
  const filtroPeriodoModal = document.getElementById("filtroPeriodoModal");

  // ✅ PREENCHER FILTRO DE CURSO BASEADO NAS PERMISSÕES
  if (filtroOrigemModal) {
    let cursosPermitidos;

    if (currentUser.role === "professor") {
      cursosPermitidos = currentUser.courses;
      console.log(
        `🔒 Modal - filtro de curso apenas para: ${cursosPermitidos.join(", ")}`
      );
    } else {
      cursosPermitidos = [
        ...new Set(allStudentsRawData.map((a) => a.Origem).filter((o) => o)),
      ];
    }

    const courseNames = {
      PWT: "PROGRAMAÇÃO TARDE",
      PWN: "PROGRAMAÇÃO NOITE",
      DGT: "DESIGNER TARDE",
      DGN: "DESIGNER NOITE",
      MNT: "MANICURE TARDE",
      MNN: "MANICURE NOITE",
    };

    filtroOrigemModal.innerHTML = '<option value="">Todos</option>';
    cursosPermitidos.forEach((curso) => {
      const option = document.createElement("option");
      option.value = curso;
      option.textContent = courseNames[curso] || curso;
      filtroOrigemModal.appendChild(option);
    });
  }

  // ✅ PREENCHER FILTRO DE PERÍODO BASEADO NOS DADOS PERMITIDOS
  if (filtroPeriodoModal) {
    let dadosPermitidos = allStudentsRawData;

    if (currentUser.role === "professor") {
      dadosPermitidos = allStudentsRawData.filter((aluno) =>
        currentUser.courses.includes(aluno.Origem)
      );
    }

    const periodos = [
      ...new Set(dadosPermitidos.map((a) => a.Periodo).filter((p) => p)),
    ];

    filtroPeriodoModal.innerHTML = '<option value="">Todos</option>';
    periodos.forEach((periodo) => {
      const option = document.createElement("option");
      option.value = periodo;
      option.textContent = periodo;
      filtroPeriodoModal.appendChild(option);
    });
  }

  if (alunoSelecionadoSelect) {
    // ✅ FILTRAR ALUNOS BASEADO NAS PERMISSÕES DO USUÁRIO
    let alunosPermitidos = allStudentsRawData;

    if (currentUser.role === "professor") {
      alunosPermitidos = allStudentsRawData.filter((aluno) =>
        currentUser.courses.includes(aluno.Origem)
      );
      console.log(
        `🔒 Modal de registro - apenas alunos dos cursos do professor: ${currentUser.courses.join(
          ", "
        )}`
      );
    }

    alunoSelecionadoSelect.innerHTML =
      '<option value="">Selecione um aluno</option>';
    alunosPermitidos.forEach((aluno) => {
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
  const statusOverlay = document.getElementById("registrationStatus");

  const alunoId = alunoSelecionadoSelect ? alunoSelecionadoSelect.value : "";
  const data = dataPresencaInput ? dataPresencaInput.value : "";
  const status =
    presenteRadio && presenteRadio.checked
      ? "P"
      : ausenteRadio && ausenteRadio.checked
      ? "A"
      : "";

  if (!alunoId || !data || !status) {
    mostrarStatusRegistro(
      "error",
      "Erro de Validação",
      "Preencha todos os campos obrigatórios"
    );
    return;
  }

  try {
    // ✅ IDENTIFICAR CURSO DO ALUNO PARA OTIMIZAÇÃO
    const aluno = allStudentsRawData.find((a) => a.ID_Unico === alunoId);

    if (!aluno) {
      mostrarStatusRegistro(
        "error",
        "Erro de Dados",
        "Aluno não encontrado nos dados carregados"
      );
      return;
    }

    const cursoAluno = aluno.Origem;

    // Mostrar loading
    mostrarStatusRegistro(
      "loading",
      "Registrando Presença",
      `Salvando informações na planilha do curso ${cursoAluno}...`
    );
    submitButton.classList.add("submit-loading");

    console.log("📝 Submetendo presença via modal:", {
      alunoId,
      data,
      status,
      curso: cursoAluno, // ✅ Log do curso para debug
    });

    // Registrar localmente primeiro
    const dataObj = new Date(data + "T00:00:00");
    attendanceManager.markAttendance(alunoId, dataObj, status, true);

    // ✅ OTIMIZAÇÃO: Salvar na planilha via API APENAS NO CURSO ESPECÍFICO
    const params = new URLSearchParams({
      action: "registrarPresencaAutomatica",
      alunoId: alunoId,
      data: data,
      status: status,
      professor: currentUser?.username || "system",
      curso: cursoAluno, // ✅ Especificar curso para processar apenas essa aba/coluna
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

    // Mostrar sucesso
    mostrarStatusRegistro(
      "success",
      "Registro Concluído",
      `${acao} registrada com sucesso! Outros alunos marcados automaticamente como falta.`
    );

    // Fechar modal após delay
    setTimeout(() => {
      fecharModalRegistro();
      carregarTodosAlunos();
    }, 2000);
  } catch (error) {
    console.error("❌ Erro ao submeter presença:", error);

    // Mostrar erro
    mostrarStatusRegistro(
      "error",
      "Falha no Registro",
      `Erro ao registrar: ${error.message}`
    );

    // Reverter registro local se der erro na API
    attendanceManager.clearAllRecords();

    // Esconder overlay após delay
    setTimeout(() => {
      esconderStatusRegistro();
    }, 3000);
  } finally {
    submitButton.classList.remove("submit-loading");
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

// === FUNÇÕES DE FEEDBACK VISUAL DO MODAL ===
function mostrarStatusRegistro(tipo, titulo, mensagem) {
  const statusOverlay = document.getElementById("registrationStatus");
  const statusContent = statusOverlay.querySelector(".status-content");

  if (!statusOverlay || !statusContent) return;

  // Limpar classes anteriores
  statusOverlay.className = "registration-status";

  if (tipo === "loading") {
    statusContent.innerHTML = `
      <div class="status-spinner"></div>
      <div class="status-message">${titulo}</div>
      <div class="status-detail">${mensagem}</div>
    `;
  } else if (tipo === "success") {
    statusOverlay.classList.add("status-success");
    statusContent.innerHTML = `
      <span class="status-icon success">✅</span>
      <div class="status-message">${titulo}</div>
      <div class="status-detail">${mensagem}</div>
    `;
  } else if (tipo === "error") {
    statusOverlay.classList.add("status-error");
    statusContent.innerHTML = `
      <span class="status-icon error">❌</span>
      <div class="status-message">${titulo}</div>
      <div class="status-detail">${mensagem}</div>
    `;
  }

  statusOverlay.style.display = "flex";
}

function esconderStatusRegistro() {
  const statusOverlay = document.getElementById("registrationStatus");
  if (statusOverlay) {
    statusOverlay.style.display = "none";
  }
}

// === SISTEMA DE PRESENÇA EM LOTE ===
function handleAttendanceChange(checkbox) {
  const alunoId = checkbox.getAttribute("data-aluno-id");
  const type = checkbox.getAttribute("data-type");
  const row = checkbox.closest("tr");

  if (checkbox.checked) {
    // Desmarcar o checkbox oposto
    const oppositeType = type === "present" ? "absent" : "present";
    const oppositeCheckbox = row.querySelector(
      `input[data-type="${oppositeType}"]`
    );
    if (oppositeCheckbox.checked) {
      oppositeCheckbox.checked = false;
    }

    // Adicionar ao lote
    batchAttendanceData.set(alunoId, type === "present" ? "P" : "A");
    row.classList.add("selected-row");
  } else {
    // Remover do lote
    batchAttendanceData.delete(alunoId);
    row.classList.remove("selected-row");
  }

  updateBatchControls();
}

function updateBatchControls() {
  const batchControls = domCache.get("batchAttendanceControls");
  const selectedCount = domCache.get("selectedCount");
  const confirmBtn = domCache.get("confirmBatchBtn");

  const count = batchAttendanceData.size;

  if (count > 0) {
    batchControls.classList.remove("hidden");
    selectedCount.textContent = count;
    confirmBtn.disabled = false;

    // Definir data padrão como hoje
    const batchDate = domCache.get("batchDate");
    if (!batchDate.value) {
      batchDate.value = new Date().toISOString().split("T")[0];
    }
  } else {
    batchControls.classList.add("hidden");
    confirmBtn.disabled = true;
  }
}

async function confirmBatchAttendance() {
  const batchDate = domCache.get("batchDate").value;

  if (!batchDate) {
    mostrarErro("Selecione uma data para o registro", "Data Obrigatória");
    return;
  }

  if (batchAttendanceData.size === 0) {
    mostrarErro("Selecione pelo menos um aluno", "Seleção Vazia");
    return;
  }

  try {
    const confirmBtn = domCache.get("confirmBatchBtn");
    confirmBtn.disabled = true;

    // Função para atualizar progresso
    const updateProgress = (processed, total) => {
      const percent = Math.round((processed / total) * 100);
      const status = processed === total ? "✅" : "⏳";
      confirmBtn.innerHTML = `${status} Processando... ${processed}/${total} (${percent}%)`;
    };

    // Teste de conectividade antes de começar
    console.log("🔍 Testando conectividade com o servidor...");
    updateProgress(0, 1);
    confirmBtn.innerHTML = "🔄 Testando conexão...";

    try {
      const testResponse = await withTimeout(
        fetch(`${API_URL}?teste=1`),
        15000 // 15s para teste
      );
      if (!testResponse.ok) {
        throw new Error(`Servidor respondeu com status ${testResponse.status}`);
      }
      console.log("✅ Conectividade confirmada - Servidor respondendo");
    } catch (connError) {
      console.error("❌ Problema de conectividade:", connError);

      // Oferecer opção de continuar mesmo com problemas
      const continuarMesmoAssim = confirm(
        `Problema de conectividade detectado: ${connError.message}\n\n` +
          `Deseja continuar mesmo assim? O processamento pode ser muito lento.`
      );

      if (!continuarMesmoAssim) {
        mostrarErro(
          `Teste de conectividade falhou: ${connError.message}. Operação cancelada pelo usuário.`,
          "Erro de Conexão"
        );
        return;
      }

      console.log(
        "⚠️ Usuário escolheu continuar apesar dos problemas de conectividade"
      );
    }

    // ✅ OTIMIZAÇÃO: Criar array de registros AGRUPADOS POR CURSO para processamento eficiente
    const registrosPorCurso = new Map();

    Array.from(batchAttendanceData.entries()).forEach(([alunoId, status]) => {
      // Encontrar o curso do aluno
      const aluno = allStudentsRawData.find((a) => a.ID_Unico === alunoId);
      if (!aluno) {
        console.warn(`⚠️ Aluno ${alunoId} não encontrado nos dados`);
        return;
      }

      const curso = aluno.Origem;

      if (!registrosPorCurso.has(curso)) {
        registrosPorCurso.set(curso, []);
      }

      registrosPorCurso.get(curso).push({
        alunoId: alunoId,
        data: batchDate,
        status: status,
        professor: currentUser?.username || "system",
        curso: curso, // ✅ Adicionar curso para otimização backend
      });
    });

    // Log da otimização
    console.log("🚀 Otimização por curso:", {
      cursosAfetados: Array.from(registrosPorCurso.keys()),
      totalAlunos: batchAttendanceData.size,
      registrosPorCurso: Object.fromEntries(
        Array.from(registrosPorCurso.entries()).map(([curso, regs]) => [
          curso,
          regs.length,
        ])
      ),
    });

    const totalRegistros = batchAttendanceData.size;
    let processedCount = 0;
    let isCancelled = false;

    // Declarar variáveis de controle de cancelamento no escopo correto
    const cancelBtn = domCache.get("cancelBatchBtn");
    let originalCancelText = "";
    let cancelHandler = null;

    // Configurar botão de cancelamento
    if (cancelBtn) {
      originalCancelText = cancelBtn.innerHTML;
      cancelBtn.innerHTML = "❌ Cancelar Processamento";
      cancelBtn.style.display = "inline-block";

      cancelHandler = () => {
        isCancelled = true;
        console.log("🛑 Operação cancelada pelo usuário");
        mostrarInfo(
          "Operação cancelada pelo usuário",
          "Processamento Interrompido"
        );
      };

      cancelBtn.addEventListener("click", cancelHandler);
    }

    updateProgress(0, totalRegistros);

    // ✅ ESTRATÉGIA: Tentar primeiro APIs existentes, depois fallbacks
    try {
      let totalProcessados = 0;

      // ✅ PRIMEIRA TENTATIVA: API de lote existente (registrarPresencaLote)
      console.log("� Tentando processamento em lote existente...");
      confirmBtn.innerHTML = `⚡ Processando lote... (0/${totalRegistros})`;

      // ✅ ESTRATÉGIA SIMPLIFICADA: Processamento direto por curso (mais confiável)
      console.log(
        "🚀 Processamento direto por curso para máxima confiabilidade..."
      );

      // ✅ Processamento direto por curso COM LOGS DETALHADOS
      for (const [curso, registrosDoCurso] of registrosPorCurso.entries()) {
        if (isCancelled) break;

        console.log(
          `🎯 PROCESSAMENTO ISOLADO - Curso: ${curso} | ${registrosDoCurso.length} alunos`
        );
        console.log(
          `� Dados do curso ${curso}:`,
          registrosDoCurso.map((r) => `${r.alunoId}:${r.status}`)
        );

        confirmBtn.innerHTML = `⚡ Processando APENAS curso ${curso}... (${totalProcessados}/${totalRegistros})`;

        // ✅ CRÍTICO: Verificar se todos os registros têm o curso correto
        registrosDoCurso.forEach((registro) => {
          if (!registro.curso || registro.curso !== curso) {
            console.error(
              `🚨 ERRO: Registro sem curso ou curso incorreto:`,
              registro
            );
            registro.curso = curso; // Corrigir
          }

          console.log(`🔍 Registro validado:`, {
            alunoId: registro.alunoId,
            curso: registro.curso,
            data: registro.data,
            status: registro.status,
            professor: registro.professor,
          });
        });

        // Processar este curso de forma isolada
        const resultado = await processBatchAttendanceParallel(
          registrosDoCurso,
          (processed) =>
            updateProgress(totalProcessados + processed, totalRegistros),
          () => isCancelled
        );

        totalProcessados += registrosDoCurso.length;

        console.log(
          `✅ Curso ${curso} processado. Sucessos: ${
            resultado?.successCount || "N/A"
          }, Erros: ${resultado?.errorCount || "N/A"}`
        );
      }

      if (totalProcessados > 0 && !isCancelled) {
        mostrarSucesso(
          `${totalProcessados} presenças registradas com sucesso! Processamento por curso.`,
          "Registro Concluído"
        );
      }
    } catch (error) {
      console.error("Erro no processamento por curso:", error);

      if (!isCancelled) {
        // ✅ Último recurso: processamento sequencial
        console.log("Tentando processamento sequencial como último recurso...");
        let totalProcessados = 0;

        for (const [curso, registrosDoCurso] of registrosPorCurso.entries()) {
          if (isCancelled) break;

          console.log(`📚 Processamento sequencial - curso ${curso}`);
          await processBatchAttendanceSequential(
            registrosDoCurso,
            (processed) =>
              updateProgress(totalProcessados + processed, totalRegistros),
            () => isCancelled
          );
          totalProcessados += registrosDoCurso.length;
        }

        if (totalProcessados > 0) {
          mostrarSucesso(
            `${totalProcessados} presenças registradas com sucesso! Processamento sequencial.`,
            "Registro Concluído"
          );
        }
      }
    }

    // Limpar seleções
    cancelBatchAttendance();

    // 🔥 ATUALIZAÇÃO INTELIGENTE COM CACHE
    console.log("🔄 Atualizando interface de forma inteligente...");

    // Limpar apenas cache relacionado a presenças (manter cache de alunos)
    cacheManager.clearAttendance();

    // Atualização otimizada baseada no view atual
    if (currentView === "table") {
      const tableBody = domCache.get("resultTableBody");
      if (tableBody && tableBody.children.length > 0) {
        console.log("📊 Atualizando view de tabela...");
        await carregarTodosAlunos(true); // Força reload
      }
    } else {
      const resultsContainer = document.querySelector(".results-container");
      if (resultsContainer && !resultsContainer.classList.contains("hidden")) {
        console.log("📱 Atualizando view de cards...");
        await carregarTodosAlunos(true); // Força reload
      }
    }

    console.log("✅ Interface atualizada com sucesso!");
  } catch (error) {
    mostrarErro(
      `Erro no registro em lote: ${error.message}`,
      "Falha no Sistema"
    );
  } finally {
    const confirmBtn = domCache.get("confirmBatchBtn");

    // Restaurar botões
    confirmBtn.disabled = false;
    confirmBtn.innerHTML =
      '✅ Confirmar Presenças (<span id="selectedCount">0</span>)';

    // Restaurar botão de cancelamento (usar a referência já declarada)
    const cancelBtn = domCache.get("cancelBatchBtn");
    if (cancelBtn) {
      // Verificar se originalCancelText foi definido, senão usar valor padrão
      const defaultCancelText = "❌ Cancelar";
      try {
        cancelBtn.innerHTML =
          typeof originalCancelText !== "undefined"
            ? originalCancelText
            : defaultCancelText;
        if (typeof cancelHandler !== "undefined" && cancelHandler) {
          cancelBtn.removeEventListener("click", cancelHandler);
        }
      } catch (error) {
        console.warn("Erro ao restaurar botão de cancelamento:", error);
        cancelBtn.innerHTML = defaultCancelText;
      }
    }

    // Recriar referência do span
    domCache.elements.delete("selectedCount");
  }
}

// ✅ NOVA FUNÇÃO: Processamento otimizado em lote POR CURSO
async function processBatchAttendanceOptimizedByCourse(
  registrosDoCurso,
  curso,
  updateProgress
) {
  console.log(
    `🎯 Processamento otimizado para curso ${curso} - ${registrosDoCurso.length} registros`
  );

  // ✅ PRIMEIRA TENTATIVA: API de lote específica para curso
  try {
    const params = new URLSearchParams({
      action: "registrarPresencaLoteCursoOtimizada", // ✅ Nova action super otimizada
      curso: curso, // ✅ Especificar curso para processar apenas essa aba/coluna
      apenasEsteCurso: "true", // ✅ Flag crítica para não percorrer outros cursos
      registros: JSON.stringify(registrosDoCurso),
    });

    const response = await withTimeout(
      fetchWithRetry(
        API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        },
        1 // ✅ Apenas 1 tentativa para API de lote
      ),
      45000 // ✅ Reduzir para 45s - deveria ser muito mais rápido
    );

    const resultado = await response.json();
    updateProgress(registrosDoCurso.length);

    return resultado;
  } catch (error) {
    console.warn(`⚠️ API de lote otimizada falhou para curso ${curso}:`, error);

    // ✅ FALLBACK: Usar processamento micro-lote (chunks de 3-5 alunos)
    return await processBatchAttendanceMicroLote(
      registrosDoCurso,
      curso,
      updateProgress
    );
  }
}

// ✅ NOVA FUNÇÃO: Processamento em micro-lotes para máxima eficiência
async function processBatchAttendanceMicroLote(
  registrosDoCurso,
  curso,
  updateProgress
) {
  console.log(`⚡ Processamento micro-lote para curso ${curso}`);

  const MICRO_CHUNK_SIZE = 3; // ✅ Processar 3 alunos por vez
  let processedCount = 0;

  for (let i = 0; i < registrosDoCurso.length; i += MICRO_CHUNK_SIZE) {
    const chunk = registrosDoCurso.slice(i, i + MICRO_CHUNK_SIZE);

    try {
      const params = new URLSearchParams({
        action: "registrarPresencaMicroLote", // ✅ Nova action para micro-lotes
        curso: curso,
        apenasEsteCurso: "true",
        registros: JSON.stringify(chunk),
      });

      await withTimeout(
        fetchWithRetry(
          API_URL,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
            body: params.toString(),
          },
          1
        ),
        20000 // ✅ 20s para micro-lotes
      );

      processedCount += chunk.length;
      updateProgress(processedCount);

      console.log(
        `✅ Micro-lote ${Math.floor(i / MICRO_CHUNK_SIZE) + 1} processado (${
          chunk.length
        } alunos)`
      );
    } catch (error) {
      console.error(
        `❌ Erro no micro-lote ${Math.floor(i / MICRO_CHUNK_SIZE) + 1}:`,
        error
      );
      // Continue com próximo micro-lote em caso de erro
    }

    // ✅ Pausa mínima entre micro-lotes
    if (i + MICRO_CHUNK_SIZE < registrosDoCurso.length) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // 0.5s
    }
  }

  return { success: true, successCount: processedCount };
}

// Função de processamento otimizado geral (fallback para múltiplos cursos)
async function processBatchAttendanceOptimized(registros, updateProgress) {
  console.log(`🔄 Tentando API de lote com ${registros.length} registros`);

  const params = new URLSearchParams({
    action: "registrarPresencaLote",
    registros: JSON.stringify(registros),
  });

  try {
    const response = await withTimeout(
      fetchWithRetry(
        API_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        },
        2
      ), // Apenas 2 tentativas para API de lote
      90000 // Aumentado para 90s para lotes
    );

    const resultado = await response.json();
    console.log("📋 Resposta da API de lote:", resultado);

    updateProgress(registros.length, registros.length);

    // Verificar se a resposta indica sucesso
    if (
      resultado &&
      (resultado.success === true || resultado.status === "success")
    ) {
      console.log("✅ API de lote retornou sucesso");
      return { success: true, ...resultado };
    } else {
      console.warn("⚠️ API de lote não retornou sucesso:", resultado);
      return {
        success: false,
        error: "API de lote não confirmou sucesso",
        response: resultado,
      };
    }
  } catch (error) {
    console.error("❌ Erro na API de lote:", error);
    return { success: false, error: error.message };
  }
}

// Função de fallback com processamento paralelo em chunks adaptativos
// === FUNÇÃO DE PROCESSAMENTO PARALELO ULTRA-OTIMIZADA ===
async function processBatchAttendanceParallel(
  registros,
  updateProgress,
  isCancelledCallback
) {
  let successCount = 0;
  let errorCount = 0;
  let processedCount = 0;
  let cacheHits = 0;

  console.log(
    `🚀 Iniciando processamento inteligente de ${registros.length} registros`
  );

  // Usar chunks dinâmicos baseados na performance
  let currentChunkSize = smartProcessor.getOptimalChunkSize();

  for (let i = 0; i < registros.length; i += currentChunkSize) {
    // Verificar cancelamento
    if (isCancelledCallback && isCancelledCallback()) {
      console.log("🛑 Processamento paralelo cancelado");
      return { successCount, errorCount };
    }

    const startTime = Date.now();
    const chunk = registros.slice(i, i + currentChunkSize);

    console.log(
      `📦 Chunk ${Math.floor(i / currentChunkSize) + 1}/${Math.ceil(
        registros.length / currentChunkSize
      )} | ${chunk.length} registros | Size: ${currentChunkSize}`
    );

    // Processar chunk com cache inteligente
    const promises = chunk.map((registro) =>
      smartProcessor.processWithCache(registro)
    );

    try {
      const results = await Promise.allSettled(promises);
      const chunkTime = Date.now() - startTime;

      let chunkSuccesses = 0;
      let chunkErrors = 0;
      let chunkCacheHits = 0;

      results.forEach((result, index) => {
        processedCount++;

        if (result.status === "fulfilled" && result.value.success) {
          successCount++;
          chunkSuccesses++;
          if (result.value.cached) {
            cacheHits++;
            chunkCacheHits++;
          }
        } else {
          errorCount++;
          chunkErrors++;
          const error =
            result.status === "rejected" ? result.reason : result.value.error;
          console.error(`❌ Erro ${chunk[index].alunoId}:`, error);
        }
      });

      console.log(
        `✅ Chunk: ${chunkTime}ms | ✓${chunkSuccesses} ❌${chunkErrors} 📋${chunkCacheHits}`
      );

      // Atualizar progresso
      updateProgress(processedCount, registros.length);

      // 🔥 OTIMIZAÇÃO DINÂMICA AGRESSIVA
      const chunkSuccessRate = (chunkSuccesses / chunk.length) * 100;
      const avgResponseTime = smartProcessor.performanceMetrics.avgResponseTime;

      if (chunkSuccessRate < 70) {
        // Muitos erros - reduzir drasticamente
        currentChunkSize = 1;
        console.log(`⚠️ Chunk size → 1 (muitos erros)`);
      } else if (chunkSuccessRate === 100) {
        if (chunkTime < 3000 && currentChunkSize < 8) {
          // Performance excelente - aumentar agressivamente
          currentChunkSize = Math.min(8, currentChunkSize + 2);
          console.log(
            `🚀 Chunk size → ${currentChunkSize} (ótima performance)`
          );
        } else if (chunkTime < 5000 && currentChunkSize < 5) {
          currentChunkSize++;
          console.log(`📈 Chunk size → ${currentChunkSize}`);
        }
      }

      // 🔥 PAUSA SUPER OTIMIZADA
      if (i + currentChunkSize < registros.length) {
        let pauseTime;
        if (chunkErrors > 0) {
          pauseTime = 800; // Problemas
        } else if (chunkCacheHits === chunk.length) {
          pauseTime = 50; // Tudo em cache - mínimo
        } else if (chunkTime < 2000) {
          pauseTime = 100; // Rápido
        } else {
          pauseTime = 300; // Normal
        }

        await new Promise((resolve) => setTimeout(resolve, pauseTime));
      }
    } catch (error) {
      console.error("💥 Erro crítico no chunk:", error);
      errorCount += chunk.length;
      processedCount += chunk.length;
      updateProgress(processedCount, registros.length);
      currentChunkSize = 1; // Modo de segurança
    }
  }

  const successRate = (successCount / registros.length) * 100;
  const cacheRate = (cacheHits / registros.length) * 100;

  console.log(
    `🎯 CONCLUÍDO | ✓${successCount}/${registros.length} (${successRate.toFixed(
      1
    )}%) | 📋Cache: ${cacheRate.toFixed(1)}%`
  );
  console.log(`📊 Métricas:`, smartProcessor.performanceMetrics);

  // Exibir resultado otimizado
  if (errorCount === 0) {
    mostrarSucesso(
      `${successCount} presenças registradas! Cache acelerou ${cacheHits} registros.`,
      "✅ Sucesso Total"
    );
  } else {
    mostrarInfo(
      `${successCount} sucessos, ${errorCount} erros. Cache: ${cacheHits} hits.`,
      "⚠️ Resultado Parcial"
    );
  }

  return { successCount, errorCount, cacheHits };
}

// Função de último recurso: processamento completamente sequencial
async function processBatchAttendanceSequential(
  registros,
  updateProgress,
  isCancelledCallback
) {
  console.log("🐌 Iniciando processamento sequencial (um por vez)");

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < registros.length; i++) {
    // Verificar cancelamento
    if (isCancelledCallback && isCancelledCallback()) {
      console.log("🛑 Processamento sequencial cancelado");
      return;
    }

    const registro = registros[i];
    try {
      console.log(
        `Processando ${i + 1}/${registros.length}: Aluno ${
          registro.alunoId
        } (Curso: ${registro.curso})`
      );

      // ✅ USAR FUNÇÃO ROBUSTA PARA CRIAR PARÂMETROS ESPECÍFICOS DO CURSO
      const params = createAttendanceParams(registro, true);

      console.log(
        `🎯 Request sequencial para curso ${registro.curso}:`,
        params.toString()
      );

      const response = await withTimeout(
        fetchWithRetry(`${API_URL}?${params.toString()}`, {}, 1), // ✅ Apenas 1 tentativa
        20000 // ✅ Reduzir para 20s para modo sequencial
      );

      const resultado = await response.json();

      if (resultado.success) {
        successCount++;
        console.log(`✅ Sucesso para aluno ${registro.alunoId}`);
      } else {
        errorCount++;
        console.error(
          `❌ Erro para aluno ${registro.alunoId}:`,
          resultado.error
        );
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ Erro ao processar aluno ${registro.alunoId}:`, error);
    }

    // Atualizar progresso
    updateProgress(i + 1, registros.length);

    // ✅ Pausa MÍNIMA entre registros para máxima velocidade
    if (i < registros.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500)); // ✅ Reduzir para 0.5s
    }
  }

  // Mostrar resultado final
  if (errorCount === 0) {
    mostrarSucesso(
      `${successCount} presenças registradas com sucesso!`,
      "Registro Concluído (Modo Sequencial)"
    );
  } else {
    mostrarInfo(
      `${successCount} sucessos, ${errorCount} erros. Verifique o console para detalhes.`,
      "Registro Parcial (Modo Sequencial)"
    );
  }
}

function cancelBatchAttendance() {
  // Limpar dados
  batchAttendanceData.clear();

  // Desmarcar todos os checkboxes
  const checkboxes = document.querySelectorAll(".attendance-checkbox");
  checkboxes.forEach((cb) => (cb.checked = false));

  // Remover highlight das linhas
  const rows = document.querySelectorAll(".selected-row");
  rows.forEach((row) => row.classList.remove("selected-row"));

  // Esconder controles
  const batchControls = domCache.get("batchAttendanceControls");
  batchControls.classList.add("hidden");
}

// Inicializar event listeners para presença em lote
function initializeBatchAttendance() {
  const confirmBtn = domCache.get("confirmBatchBtn");
  const cancelBtn = domCache.get("cancelBatchBtn");

  if (confirmBtn) {
    // Adicionar debouncing e proteção contra múltiplos cliques
    let isProcessing = false;
    confirmBtn.addEventListener("click", async (e) => {
      e.preventDefault();

      if (isProcessing) {
        console.log("Processamento já em andamento, ignorando clique...");
        return;
      }

      isProcessing = true;
      try {
        await confirmBatchAttendance();
      } finally {
        // Delay para evitar cliques duplos acidentais
        setTimeout(() => {
          isProcessing = false;
        }, 1000);
      }
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", cancelBatchAttendance);
  }

  // Event listeners para checkboxes de presença nos cards
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("attendance-checkbox")) {
      handleCardAttendanceToggle(e.target);
    }
  });
}

// === FUNÇÕES DE PRESENÇA NOS CARDS ===
function handleCardAttendanceToggle(checkbox) {
  const studentId = checkbox.dataset.studentId;
  const controlsDiv = document.getElementById(`attendanceControls-${studentId}`);
  
  if (checkbox.checked) {
    controlsDiv.classList.remove("hidden");
    // Animar a entrada dos controles
    controlsDiv.style.animation = "slideDown 0.3s ease-out";
  } else {
    controlsDiv.classList.add("hidden");
  }
}

async function registrarPresencaCard(studentId) {
  const checkbox = document.getElementById(`attendanceCheck-${studentId}`);
  const dateInput = document.getElementById(`attendanceDate-${studentId}`);
  const statusRadios = document.querySelectorAll(`input[name="status-${studentId}"]:checked`);
  const registerBtn = document.querySelector(`button[onclick="registrarPresencaCard('${studentId}')"]`);
  
  if (!checkbox || !dateInput || statusRadios.length === 0) {
    mostrarErro("Erro ao obter dados da presença", "Erro");
    return;
  }

  const studentName = checkbox.dataset.studentName;
  const studentCourse = checkbox.dataset.studentCourse;
  const selectedDate = dateInput.value;
  const selectedStatus = statusRadios[0].value;
  
  if (!selectedDate) {
    mostrarAviso("Por favor, selecione uma data", "Data Obrigatória");
    return;
  }

  // Salvar o texto original do botão antes do try
  const originalText = registerBtn.innerHTML;

  try {
    // Mostrar loading no botão
    registerBtn.innerHTML = '<div class="loading-spinner-small"></div> Registrando...';
    registerBtn.disabled = true;

    const currentUser = AuthSystem.getCurrentUser();
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }

    const registro = {
      alunoId: studentId,
      data: selectedDate,
      status: selectedStatus,
      professor: currentUser.name,
      curso: studentCourse
    };

    console.log("📝 Registrando presença via card:", registro);

    // Usar o mesmo sistema de processamento do sistema principal
    let success = false;
    let timeoutOccurred = false;
    
    try {
      success = await smartProcessor.processWithCache(registro);
    } catch (timeoutError) {
      if (timeoutError.message && timeoutError.message.includes("Timeout")) {
        timeoutOccurred = true;
        console.log("⚠️ Timeout detectado, mas presença pode ter sido registrada");
        
        // Registrar o último acesso mesmo com timeout (provável sucesso)
        lastAttendanceTracker.recordAttendance(
          studentId,
          selectedDate,
          selectedStatus,
          currentUser.name
        );
        
        // Mesmo com timeout, mostrar mensagem informativa
        mostrarAviso(
          `A requisição demorou mais que o esperado, mas a presença pode ter sido registrada com sucesso.\n\nAluno: ${studentName}\nData: ${new Date(selectedDate).toLocaleDateString('pt-BR')}\nStatus: ${selectedStatus === "P" ? "Presente" : "Ausente"}\n\nVerifique o sistema para confirmar.`,
          "Timeout - Verifique o Registro"
        );
        
        // Resetar o formulário mesmo com timeout
        checkbox.checked = false;
        document.getElementById(`attendanceControls-${studentId}`).classList.add("hidden");
        
        // Atualizar a exibição do card
        setTimeout(() => {
          const cardElement = document.querySelector(`input[data-student-id="${studentId}"]`);
          if (cardElement) {
            const studentCard = cardElement.closest('.student-card');
            if (studentCard) {
              const alunoData = allStudentsRawData.find(a => a.ID_Unico === studentId);
              if (alunoData) {
                const calculado = calcularMediaESituacao(alunoData);
                studentCard.innerHTML = createStudentCardHTML(
                  alunoData, 
                  calculado.media, 
                  calculado.situacao, 
                  calculado.faltas
                );
              }
            }
          }
        }, 100);
        
        return; // Sair da função sem lançar erro
      } else {
        throw timeoutError; // Re-lançar se não for timeout
      }
    }

    if (success) {
      const statusText = selectedStatus === "P" ? "Presente" : "Ausente";
      
      // Registrar o último acesso do aluno
      lastAttendanceTracker.recordAttendance(
        studentId,
        selectedDate,
        selectedStatus,
        currentUser.name
      );
      
      mostrarSucesso(
        `Presença registrada com sucesso!\n\nAluno: ${studentName}\nData: ${new Date(selectedDate).toLocaleDateString('pt-BR')}\nStatus: ${statusText}`,
        "Presença Registrada"
      );

      // Resetar o formulário
      checkbox.checked = false;
      document.getElementById(`attendanceControls-${studentId}`).classList.add("hidden");
      
      // Atualizar cache se necessário
      cacheManager.clearAttendance();
      
      // Atualizar a exibição do card para mostrar o novo último registro
      setTimeout(() => {
        // Re-renderizar apenas este card específico
        const cardElement = document.querySelector(`input[data-student-id="${studentId}"]`);
        if (cardElement) {
          const studentCard = cardElement.closest('.student-card');
          if (studentCard) {
            // Encontrar o aluno nos dados
            const alunoData = allStudentsRawData.find(a => a.ID_Unico === studentId);
            if (alunoData) {
              const calculado = calcularMediaESituacao(alunoData);
              studentCard.innerHTML = createStudentCardHTML(
                alunoData, 
                calculado.media, 
                calculado.situacao, 
                calculado.faltas
              );
            }
          }
        }
      }, 100);
      
    } else {
      throw new Error("Falha ao registrar presença");
    }

  } catch (error) {
    console.error("❌ Erro ao registrar presença via card:", error);
    
    mostrarErro(
      `Erro ao registrar presença: ${error.message || "Erro desconhecido"}`,
      "Erro no Registro"
    );
  } finally {
    // Restaurar botão sempre, mesmo em caso de erro
    registerBtn.innerHTML = originalText;
    registerBtn.disabled = false;
  }
}

// Tornar a função global para uso no onclick
window.registrarPresencaCard = registrarPresencaCard;
