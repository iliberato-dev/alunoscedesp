// === CONFIGURAÇÃO DO SISTEMA CEDESP ===
const WEB_APP_URL =
  "https://script.google.com/macros/s/AKfycbzNq3Hz1Pvlx3Ty4YGJvj0UM4jQNe2adOEQWyomzpTnBHooEzgHa1TGMWfcd8mpzTDe/exec";

const IS_LOCAL =
  location.hostname === "localhost" || location.hostname === "127.0.0.1";
const API_URL = IS_LOCAL ? WEB_APP_URL : "/api/appsscript";

// === CACHE LOCAL DE STATUS ===
class StatusCache {
  constructor() {
    this.cache = new Map();
    this.lastUpdate = null;
  }

  setStatus(alunoNome, registro) {
    this.cache.set(alunoNome.toLowerCase(), {
      ...registro,
      timestamp: Date.now(),
    });
    this.lastUpdate = Date.now();
    console.log(`📝 Cache atualizado para ${alunoNome}:`, registro);
  }

  getStatus(alunoNome) {
    return this.cache.get(alunoNome.toLowerCase());
  }

  clear() {
    this.cache.clear();
    this.lastUpdate = null;
    console.log("🗑️ Cache de status limpo");
  }

  clearStudent(alunoNome) {
    this.cache.delete(alunoNome.toLowerCase());
    console.log(`🗑️ Cache removido para ${alunoNome}`);
  }

  isExpired(maxAge = 5 * 60 * 1000) {
    // 5 minutos
    return !this.lastUpdate || Date.now() - this.lastUpdate > maxAge;
  }

  size() {
    return this.cache.size;
  }
}

const statusCache = new StatusCache();

// === SISTEMA DE FILA SEQUENCIAL PARA REQUISIÇÕES ===
class RequestQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.maxRetries = 3;
    this.baseDelay = 1000; // 1 segundo entre requisições
  }

  // Adicionar requisição à fila
  async addRequest(requestFunction, priority = 0) {
    return new Promise((resolve, reject) => {
      this.queue.push({
        requestFunction,
        priority,
        resolve,
        reject,
        retries: 0,
        id: Date.now() + Math.random(),
      });

      // Ordenar por prioridade (maior prioridade primeiro)
      this.queue.sort((a, b) => b.priority - a.priority);

      console.log(
        `📋 Requisição adicionada à fila. Total: ${this.queue.length}`
      );

      this.processQueue();
    });
  }

  // Processar fila sequencialmente
  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(
      `🔄 Iniciando processamento da fila com ${this.queue.length} requisições`
    );

    while (this.queue.length > 0) {
      const request = this.queue.shift();

      try {
        console.log(`📤 Processando requisição ID: ${request.id}`);
        const result = await request.requestFunction();
        request.resolve(result);
        console.log(`✅ Requisição ${request.id} concluída com sucesso`);

        // Delay entre requisições para evitar sobrecarga
        if (this.queue.length > 0) {
          await this.delay(this.baseDelay);
        }
      } catch (error) {
        console.error(`❌ Erro na requisição ${request.id}:`, error);

        // Tentar novamente se ainda houver tentativas
        if (request.retries < this.maxRetries) {
          request.retries++;
          console.log(
            `🔄 Tentativa ${request.retries}/${this.maxRetries} para requisição ${request.id}`
          );

          // Adicionar de volta à fila com prioridade menor
          this.queue.unshift({
            ...request,
            priority: request.priority - 1,
          });

          // Delay maior para retry
          await this.delay(this.baseDelay * request.retries);
        } else {
          console.error(
            `💥 Requisição ${request.id} falhou após ${this.maxRetries} tentativas`
          );
          request.reject(error);
        }
      }
    }

    this.isProcessing = false;
    console.log(`✅ Fila de requisições processada completamente`);
  }

  // Função auxiliar para delay
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Limpar fila
  clearQueue() {
    this.queue.forEach((request) => {
      request.reject(new Error("Fila cancelada"));
    });
    this.queue = [];
    this.isProcessing = false;
    console.log("🗑️ Fila de requisições limpa");
  }

  // Obter status da fila
  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      isProcessing: this.isProcessing,
    };
  }
}

// Instância global da fila de requisições
const requestQueue = new RequestQueue();

// === SISTEMA DE MONITORAMENTO DA FILA ===
function initializeQueueMonitoring() {
  // Monitorar status da fila a cada 5 segundos
  setInterval(() => {
    const status = requestQueue.getQueueStatus();
    if (status.queueLength > 0 || status.isProcessing) {
      console.log(
        `📊 Status da fila: ${status.queueLength} pendentes, processando: ${status.isProcessing}`
      );
    }
  }, 5000);

  // Mostrar indicador visual quando há muitas requisições na fila
  setInterval(() => {
    const status = requestQueue.getQueueStatus();
    const indicator = document.getElementById("queue-indicator");

    if (status.queueLength > 5) {
      if (!indicator) {
        const queueIndicator = document.createElement("div");
        queueIndicator.id = "queue-indicator";
        queueIndicator.innerHTML = `
          <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(244, 196, 48, 0.9);
            color: #1a2951;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          ">
            🔄 Carregando registros... ${status.queueLength} pendentes
          </div>
        `;
        document.body.appendChild(queueIndicator);
      } else {
        indicator.innerHTML = `
          <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(244, 196, 48, 0.9);
            color: #1a2951;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 500;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          ">
            🔄 Carregando registros... ${status.queueLength} pendentes
          </div>
        `;
      }
    } else if (indicator) {
      indicator.remove();
    }
  }, 1000);
}

// === SISTEMA DE GERENCIAMENTO DE REQUISIÇÕES ===
function cancelarRequisicoesCards() {
  console.log("🛑 Cancelando requisições pendentes dos cards...");
  requestQueue.clearQueue();

  // Limpar cache se necessário
  statusCache.clear();

  // Remover indicador visual se existir
  const indicator = document.getElementById("queue-indicator");
  if (indicator) {
    indicator.remove();
  }
}

// Cancelar requisições quando usuário sai da página
window.addEventListener("beforeunload", () => {
  cancelarRequisicoesCards();
});

// Cancelar requisições quando usuário muda de filtro/busca
function onFilterChange() {
  console.log("🔄 Filtro alterado, cancelando requisições pendentes...");
  cancelarRequisicoesCards();
}

// === SISTEMA DE PERMISSÕES DE EDIÇÃO DE NOTAS ===
function getProfessorPermissions() {
  if (!currentUser || currentUser.role !== "professor") {
    return { canEdit: false, subjects: [] };
  }

  const permissions = { canEdit: true, subjects: [] };

  // Determinar disciplinas que o professor pode editar baseado no nome
  const userName = currentUser.name.toLowerCase();

  if (userName.includes("convívio") || userName.includes("convivio")) {
    permissions.subjects.push("convivio");
  }

  if (userName.includes("mundo") && userName.includes("trabalho")) {
    permissions.subjects.push("mundoTrabalho");
  }

  // Se não for professor específico de disciplina, pode editar o curso
  if (permissions.subjects.length === 0) {
    permissions.subjects.push("curso");
  }

  console.log("👨‍🏫 Permissões do professor:", permissions);
  return permissions;
}

// === FUNÇÃO PARA RENDERIZAR CAMPO DE NOTA (EDITÁVEL OU READONLY) ===
function renderGradeField(studentId, subject, bimester, currentValue, canEdit) {
  const fieldId = `grade-${studentId}-${subject}-${bimester}`;
  const isEmpty = !currentValue || currentValue === "-" || currentValue === "";

  if (canEdit) {
    return `
      <input 
        type="number" 
        id="${fieldId}"
        class="editable-grade-input ${isEmpty ? "empty" : ""}" 
        value="${isEmpty ? "" : currentValue}"
        min="0" 
        max="10" 
        step="0.1"
        placeholder="0.0"
        onchange="updateGrade('${studentId}', '${subject}', '${bimester}', this.value)"
        onblur="updateGrade('${studentId}', '${subject}', '${bimester}', this.value)"
      />
    `;
  } else {
    return `
      <span class="detailed-grade-value ${isEmpty ? "empty" : ""}">${
      isEmpty ? "-" : currentValue
    }</span>
    `;
  }
}

// Limpeza automática do cache a cada 2 minutos
setInterval(() => {
  invalidarCacheSeNecessario();
}, 2 * 60 * 1000);

// === UTILITÁRIOS DE FORMATAÇÃO DE DATA/HORÁRIO ===
function formatarDataBrasileira(data) {
  if (data instanceof Date) {
    const dia = data.getDate().toString().padStart(2, "0");
    const mes = (data.getMonth() + 1).toString().padStart(2, "0");
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  } else if (typeof data === "string" && data.trim() !== "") {
    const dataStr = data.trim();
    // Se for formato YYYY-MM-DD, converter para Date local
    if (dataStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [ano, mes, dia] = dataStr.split("-");
      return `${dia}/${mes}/${ano}`;
    }
    return dataStr;
  }
  // Se não for Date nem string válida, usar data atual
  const agora = new Date();
  const dia = agora.getDate().toString().padStart(2, "0");
  const mes = (agora.getMonth() + 1).toString().padStart(2, "0");
  const ano = agora.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function formatarHorarioBrasileiro(horario) {
  if (horario instanceof Date) {
    const horas = horario.getHours().toString().padStart(2, "0");
    const minutos = horario.getMinutes().toString().padStart(2, "0");
    return `${horas}:${minutos}`;
  } else if (typeof horario === "string" && horario.trim() !== "") {
    return horario.trim();
  }
  // Se não for Date nem string válida, usar horário atual
  const agora = new Date();
  const horas = agora.getHours().toString().padStart(2, "0");
  const minutos = agora.getMinutes().toString().padStart(2, "0");
  return `${horas}:${minutos}`;
}

function obterDataHorarioAtual() {
  const agora = new Date();
  return {
    data: formatarDataBrasileira(agora),
    horario: formatarHorarioBrasileiro(agora),
  };
}

// === FUNÇÕES DE ATUALIZAÇÃO IMEDIATA DE CARDS ===
function atualizarCardImediatamente(alunoId, novoRegistro) {
  const lastAttendanceElement = document.getElementById(
    `lastAttendance_${alunoId}`
  );

  if (!lastAttendanceElement) {
    console.warn(`⚠️ Elemento lastAttendance_${alunoId} não encontrado`);
    return;
  }

  // Determinar o texto e classe do status
  let statusText, statusClass;
  if (novoRegistro.status === "P") {
    statusText = "Presente";
    statusClass = "status-presente";
  } else if (novoRegistro.status === "F") {
    statusText = "Falta";
    statusClass = "status-falta";
  } else {
    statusText = "Ausente";
    statusClass = "status-ausente";
  }

  // Determinar ícone e texto do professor
  let professorIcon = "";
  let professorText = "";
  let professorClass = "";
  if (novoRegistro.professor) {
    const professor = novoRegistro.professor.toLowerCase();
    if (professor.includes("mundo") && professor.includes("trabalho")) {
      professorIcon = "🌍";
      professorText = "Mundo do Trabalho";
      professorClass = "prof-mundo-trabalho";
    } else if (
      professor.includes("convívio") ||
      professor.includes("convivio")
    ) {
      professorIcon = "🤝";
      professorText = "Convívio";
      professorClass = "prof-convivio";
    }
  }

  lastAttendanceElement.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="attendance-icon">
      <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
      <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
    </svg>
    <div class="attendance-info">
      <span class="attendance-label">Último registro:</span>
      <span class="attendance-date">${novoRegistro.displayTime}</span>
      <span class="status-registro ${statusClass}">${statusText}</span>
      ${
        professorIcon
          ? `<span class="professor-indicator ${professorClass}" title="${novoRegistro.professor}">${professorText} ${professorIcon}</span>`
          : ""
      }
    </div>
  `;
  lastAttendanceElement.className = "last-attendance";

  console.log(
    `✅ Card atualizado imediatamente para ${alunoId}: ${statusText}`
  );
}

// Função para invalidar cache quando necessário
function invalidarCacheSeNecessario() {
  // Limpar cache se muito antigo (mais de 10 minutos)
  if (statusCache.isExpired(10 * 60 * 1000)) {
    statusCache.clear();
    console.log("🗑️ Cache expirado limpo automaticamente");
  }
}

// === SISTEMA DE INDICADORES VISUAIS DE CARREGAMENTO ===
function mostrarLoadingOverlay(mensagem = "Carregando dados...") {
  // Remove overlay existente se houver
  removerLoadingOverlay();

  const overlay = document.createElement("div");
  overlay.id = "loading-overlay";
  overlay.innerHTML = `
    <div class="loading-content">
      <div class="loading-spinner"></div>
      <div class="loading-text">${mensagem}</div>
    </div>
  `;

  document.body.appendChild(overlay);
}

// === LOADING ESPECÍFICO PARA CARDS ===
function mostrarLoadingCard(studentId, mensagem = "Registrando...") {
  const card = document
    .querySelector(`input[data-student-id="${studentId}"]`)
    ?.closest(".student-card");
  if (!card) return;

  // Remove loading existente se houver
  removerLoadingCard(studentId);

  const overlay = document.createElement("div");
  overlay.className = "card-loading-overlay";
  overlay.id = `card-loading-${studentId}`;
  overlay.innerHTML = `
    <div class="card-loading-content">
      <div class="loading-spinner-small"></div>
      <div class="card-loading-text">${mensagem}</div>
    </div>
  `;

  // Adicionar posição relativa ao card se não tiver
  card.style.position = "relative";
  card.appendChild(overlay);
}

function removerLoadingCard(studentId) {
  const loadingOverlay = document.getElementById(`card-loading-${studentId}`);
  if (loadingOverlay) {
    loadingOverlay.remove();
  }
}

function atualizarMensagemLoadingCard(studentId, novaMensagem) {
  const loadingText = document.querySelector(
    `#card-loading-${studentId} .card-loading-text`
  );
  if (loadingText) {
    loadingText.textContent = novaMensagem;
  }
}

// === NOTIFICAÇÕES ESPECÍFICAS PARA CARDS ===
function mostrarSucessoCard(
  studentId,
  mensagem,
  titulo = "Sucesso",
  duracao = 4000
) {
  const card = document
    .querySelector(`input[data-student-id="${studentId}"]`)
    ?.closest(".student-card");
  if (!card) return;

  // Remove notificação existente se houver
  removerNotificacaoCard(studentId);

  const notification = document.createElement("div");
  notification.className = "card-notification card-notification-success";
  notification.id = `card-notification-${studentId}`;
  notification.innerHTML = `
    <div class="card-notification-content">
      <div class="card-notification-header">
        <span class="card-notification-icon">✅</span>
        <span class="card-notification-title">${titulo}</span>
        <button class="card-notification-close" onclick="removerNotificacaoCard('${studentId}')">✕</button>
      </div>
      <div class="card-notification-message">${mensagem}</div>
    </div>
  `;

  // Adicionar posição relativa ao card se não tiver
  card.style.position = "relative";
  card.appendChild(notification);

  // Auto-remover após duração especificada
  setTimeout(() => {
    removerNotificacaoCard(studentId);
  }, duracao);
}

function mostrarErroCard(studentId, mensagem, titulo = "Erro", duracao = 5000) {
  const card = document
    .querySelector(`input[data-student-id="${studentId}"]`)
    ?.closest(".student-card");
  if (!card) return;

  // Remove notificação existente se houver
  removerNotificacaoCard(studentId);

  const notification = document.createElement("div");
  notification.className = "card-notification card-notification-error";
  notification.id = `card-notification-${studentId}`;
  notification.innerHTML = `
    <div class="card-notification-content">
      <div class="card-notification-header">
        <span class="card-notification-icon">❌</span>
        <span class="card-notification-title">${titulo}</span>
        <button class="card-notification-close" onclick="removerNotificacaoCard('${studentId}')">✕</button>
      </div>
      <div class="card-notification-message">${mensagem}</div>
    </div>
  `;

  // Adicionar posição relativa ao card se não tiver
  card.style.position = "relative";
  card.appendChild(notification);

  // Auto-remover após duração especificada
  setTimeout(() => {
    removerNotificacaoCard(studentId);
  }, duracao);
}

function mostrarAvisoCard(
  studentId,
  mensagem,
  titulo = "Atenção",
  duracao = 6000
) {
  const card = document
    .querySelector(`input[data-student-id="${studentId}"]`)
    ?.closest(".student-card");
  if (!card) return;

  // Remove notificação existente se houver
  removerNotificacaoCard(studentId);

  const notification = document.createElement("div");
  notification.className = "card-notification card-notification-warning";
  notification.id = `card-notification-${studentId}`;
  notification.innerHTML = `
    <div class="card-notification-content">
      <div class="card-notification-header">
        <span class="card-notification-icon">⚠️</span>
        <span class="card-notification-title">${titulo}</span>
        <button class="card-notification-close" onclick="removerNotificacaoCard('${studentId}')">✕</button>
      </div>
      <div class="card-notification-message">${mensagem}</div>
    </div>
  `;

  // Adicionar posição relativa ao card se não tiver
  card.style.position = "relative";
  card.appendChild(notification);

  // Auto-remover após duração especificada
  setTimeout(() => {
    removerNotificacaoCard(studentId);
  }, duracao);
}

function removerNotificacaoCard(studentId) {
  const notification = document.getElementById(
    `card-notification-${studentId}`
  );
  if (notification) {
    notification.style.animation = "slideOutUp 0.3s ease-in";
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
}

function removerLoadingOverlay() {
  const existingOverlay = document.getElementById("loading-overlay");
  if (existingOverlay) {
    existingOverlay.remove();
  }
}

function atualizarMensagemLoading(novaMensagem) {
  const loadingText = document.querySelector(".loading-text");
  if (loadingText) {
    loadingText.textContent = novaMensagem;
  }
}

// === SISTEMA DE RASTREAMENTO DE ÚLTIMOS REGISTROS ===
class LastAttendanceTracker {
  constructor() {
    this.storageKey = "cedesp_last_attendance";
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
      displayTime: this.formatDateTime(timestamp),
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
      console.error("Erro ao ler registros de presença:", error);
      return {};
    }
  }

  // Formatar data e hora para exibição
  formatDateTime(isoString) {
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString("pt-BR");
    const timeStr = date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
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

// === SISTEMA DE PRESENÇA ONLINE NA ABA "PRESENÇAS" ===
class OnlineAttendanceManager {
  constructor() {
    this.apiUrl = API_URL;
    console.log(
      "🔧 OnlineAttendanceManager inicializado com URL:",
      this.apiUrl
    );
    console.log("🌍 IS_LOCAL:", IS_LOCAL);
    console.log("🔗 WEB_APP_URL:", WEB_APP_URL);
  }

  // Testar conectividade com o App Script
  async testarConectividade() {
    try {
      console.log("🔍 Testando conectividade...");

      const params = new URLSearchParams({
        teste: "1",
      });

      const response = await withTimeout(
        fetch(`${this.apiUrl}?${params.toString()}`),
        10000
      );

      if (response.ok) {
        const resultado = await response.json();
        console.log("✅ Conectividade OK:", resultado);
        return { success: true, resultado };
      } else {
        console.error(
          "❌ Erro de conectividade:",
          response.status,
          response.statusText
        );
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      console.error("❌ Erro de rede:", error);
      return { success: false, error: error.message };
    }
  }

  // Registrar presença online na aba "Presenças"
  async registrarPresencaOnline(
    nome,
    data,
    horario,
    curso,
    professor,
    status = "P"
  ) {
    // Usar fila para registro de presença com prioridade alta
    return await requestQueue.addRequest(async () => {
      try {
        // GARANTIR FORMATAÇÃO CORRETA usando as funções utilitárias
        const dataFormatada = formatarDataBrasileira(data);
        const horarioFormatado = formatarHorarioBrasileiro(horario);

        console.log("📝 Registrando presença online:", {
          nome,
          data: dataFormatada,
          horario: horarioFormatado,
          curso,
          professor,
          status,
        });
        console.log("🔗 URL da API:", this.apiUrl);

        const params = new URLSearchParams({
          action: "registrarPresencaOnline",
          nome: nome.toString(),
          data: dataFormatada,
          horario: horarioFormatado,
          curso: curso.toString(),
          professor: professor.toString(),
          status: status.toString(),
        });

        console.log("📤 Parâmetros da requisição:", params.toString());
        console.log("🌐 URL completa:", `${this.apiUrl}?${params.toString()}`);

        const response = await withTimeout(
          fetchWithRetry(`${this.apiUrl}?${params.toString()}`, {}, 2),
          15000 // Timeout de 15 segundos
        );

        console.log("📨 Status da resposta:", response.status);
        console.log("📨 Headers da resposta:", response.headers);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const resultado = await response.json();
        console.log("📊 Resultado completo:", resultado);

        if (resultado.success) {
          console.log("✅ Presença registrada online com sucesso");

          // Atualizar cache local
          const registroCache = {
            data: dataFormatada,
            horario: horarioFormatado,
            curso,
            professor,
            status,
            displayTime: `${dataFormatada} às ${horarioFormatado}`,
            timestamp: Date.now(),
          };
          statusCache.setStatus(nome, registroCache);

          return resultado;
        } else {
          console.error(
            "❌ Erro ao registrar presença online:",
            resultado.error
          );
          throw new Error(resultado.error || "Erro desconhecido");
        }
      } catch (error) {
        console.error("❌ Erro na requisição de presença online:", error);
        throw error;
      }
    }, 5); // Prioridade alta para registros
  }

  // Buscar últimos registros de presença online
  async buscarUltimosRegistros(limite = 10) {
    // Usar método direto, mas não adicionar à fila para busca geral
    return await this.buscarUltimosRegistrosDirecto(limite);
  }

  // Buscar último registro de um aluno específico na aba "Presenças"
  async buscarUltimoRegistroAluno(nomeAluno) {
    // Usar a fila de requisições para evitar sobrecarga
    return await requestQueue.addRequest(async () => {
      try {
        console.log(
          `🔍 BUSCA INDIVIDUAL - Procurando último registro para: "${nomeAluno}"`
        );

        // ✅ OTIMIZAÇÃO: Verificar cache primeiro
        const cachedStatus = statusCache.getStatus(nomeAluno);
        if (cachedStatus && !statusCache.isExpired()) {
          console.log(`📋 Cache hit para ${nomeAluno}:`, cachedStatus);
          return {
            success: true,
            registro: cachedStatus,
          };
        }

        // Buscar todos os registros recentes e filtrar pelo nome
        console.log("📋 Buscando registros gerais...");
        const resultado = await this.buscarUltimosRegistrosDirecto(50); // Método direto sem fila

        console.log("📊 Resultado da busca geral:", resultado);

        if (resultado.success && resultado.registros.length > 0) {
          console.log(
            `📋 Total de registros encontrados: ${resultado.registros.length}`
          );

          // Log de todos os nomes encontrados para debug
          const nomesEncontrados = resultado.registros.map((r) => r.nome);
          console.log("👥 Nomes nos registros:", nomesEncontrados);

          // Filtrar registros pelo nome do aluno
          const registrosDoAluno = resultado.registros.filter((registro) => {
            const nomeRegistro = registro.nome.toLowerCase();
            const nomeAluno_lower = nomeAluno.toLowerCase();

            const match =
              nomeRegistro.includes(nomeAluno_lower) ||
              nomeAluno_lower.includes(nomeRegistro);

            if (match) {
              console.log(
                `✅ MATCH encontrado: "${registro.nome}" ↔ "${nomeAluno}"`
              );
            }

            return match;
          });

          console.log(
            `🎯 Registros filtrados para "${nomeAluno}": ${registrosDoAluno.length}`
          );

          if (registrosDoAluno.length > 0) {
            const ultimoRegistro = registrosDoAluno[0]; // Já vem ordenado por mais recente
            console.log(
              `✅ SUCESSO - Último registro encontrado para ${nomeAluno}:`,
              ultimoRegistro
            );

            const registroFormatado = {
              data: ultimoRegistro.data,
              horario: ultimoRegistro.horario,
              curso: ultimoRegistro.curso,
              professor: ultimoRegistro.professor,
              status: ultimoRegistro.status || "P", // Usar status real ou P como fallback
              displayTime: `${ultimoRegistro.data} às ${ultimoRegistro.horario}`,
              timestamp: new Date().toISOString(), // Para compatibilidade
            };

            // Salvar no cache
            statusCache.setStatus(nomeAluno, registroFormatado);

            return {
              success: true,
              registro: registroFormatado,
            };
          }
        } else {
          console.log("❌ ERRO ou nenhum registro retornado da busca geral");
        }

        console.log(
          `⚠️ RESULTADO VAZIO - Nenhum registro encontrado para: "${nomeAluno}"`
        );
        return { success: false, registro: null };
      } catch (error) {
        console.error(`❌ Erro ao buscar registro de ${nomeAluno}:`, error);
        throw error; // Permitir retry através da fila
      }
    }, 1); // Prioridade média
  }

  // Método direto para buscar registros (usado internamente pela fila)
  async buscarUltimosRegistrosDirecto(limite = 10) {
    try {
      console.log("🔍 Buscando últimos registros de presença online...");

      const params = new URLSearchParams({
        action: "buscarUltimosRegistrosPresenca",
        limite: limite,
      });

      console.log("🌐 URL da busca:", `${this.apiUrl}?${params.toString()}`);

      const response = await withTimeout(
        fetchWithRetry(`${this.apiUrl}?${params.toString()}`, {}, 2),
        15000 // Aumentar timeout para 15 segundos
      );

      console.log("📨 Status da resposta da busca:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const resultado = await response.json();
      console.log("📊 Resultado completo da busca:", resultado);

      if (resultado.success) {
        console.log(
          `✅ ${resultado.registros.length} registros encontrados na busca`
        );
        return resultado;
      } else {
        console.error("❌ Erro ao buscar registros:", resultado.error);
        return resultado;
      }
    } catch (error) {
      console.error("❌ Erro na requisição de busca:", error);
      throw error;
    }
  }

  // ✅ OTIMIZAÇÃO: Pré-carregar status de múltiplos alunos
  async preCarregarStatusAlunos(nomesAlunos) {
    if (statusCache.size() > 0 && !statusCache.isExpired()) {
      console.log("📋 Cache ainda válido, pulando pré-carregamento");
      return;
    }

    // Usar fila para pré-carregamento com prioridade alta
    return await requestQueue.addRequest(async () => {
      try {
        console.log("🔄 Pré-carregando status de todos os alunos...");
        const resultado = await this.buscarUltimosRegistrosDirecto(100); // Buscar mais registros

        if (resultado.success && resultado.registros.length > 0) {
          // Agrupar registros por nome do aluno
          const registrosPorAluno = new Map();

          resultado.registros.forEach((registro) => {
            const nomeNormalizado = registro.nome.toLowerCase();
            if (
              !registrosPorAluno.has(nomeNormalizado) ||
              registrosPorAluno.get(nomeNormalizado).id < registro.id
            ) {
              registrosPorAluno.set(nomeNormalizado, registro);
            }
          });

          // Adicionar ao cache
          registrosPorAluno.forEach((registro, nome) => {
            const registroFormatado = {
              data: registro.data,
              horario: registro.horario,
              curso: registro.curso,
              professor: registro.professor,
              status: registro.status || "P",
              displayTime: `${registro.data} às ${registro.horario}`,
              timestamp: Date.now(),
            };
            statusCache.setStatus(nome, registroFormatado);
          });

          console.log(
            `✅ Cache pré-carregado com ${registrosPorAluno.size} alunos`
          );
        }
      } catch (error) {
        console.error("❌ Erro no pré-carregamento:", error);
        throw error;
      }
    }, 10); // Prioridade alta para pré-carregamento
  }

  // Exibir últimos registros na interface
  async exibirUltimosRegistros(containerId = "ultimosRegistros") {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn("Container para últimos registros não encontrado");
      return;
    }

    // Mostrar loading
    container.innerHTML = `
      <div class="loading-registros">
        <div class="loading-spinner"></div>
        <span>Carregando últimos registros...</span>
      </div>
    `;

    const resultado = await this.buscarUltimosRegistros(5);

    if (resultado.success && resultado.registros.length > 0) {
      const html = `
        <div class="ultimos-registros">
          <h4>📋 Últimos Registros de Presença</h4>
          <div class="registros-lista">
            ${resultado.registros
              .map((registro) => {
                // Determinar ícone e texto do professor
                let professorIcon = "";
                let professorText = "";
                let professorClass = "";
                if (registro.professor) {
                  const professor = registro.professor.toLowerCase();
                  if (
                    professor.includes("mundo") &&
                    professor.includes("trabalho")
                  ) {
                    professorIcon = "🌍";
                    professorText = "Mundo do Trabalho";
                    professorClass = "prof-mundo-trabalho";
                  } else if (
                    professor.includes("convívio") ||
                    professor.includes("convivio")
                  ) {
                    professorIcon = "🤝";
                    professorText = "Convívio";
                    professorClass = "prof-convivio";
                  }
                }

                // Determinar ícone do status
                let statusText = "";
                let statusClass = "";
                if (registro.status === "P") {
                  statusText = "Presente";
                  statusClass = "status-presente";
                } else if (registro.status === "F") {
                  statusText = "Falta";
                  statusClass = "status-falta";
                } else {
                  statusText = "Ausente";
                  statusClass = "status-ausente";
                }

                return `
              <div class="registro-item">
                <div class="registro-info">
                  <strong>${registro.nome}</strong>
                  <span class="registro-curso">${registro.curso}</span>
                  <span class="status-registro ${statusClass}">${statusText}</span>
                </div>
                <div class="registro-detalhes">
                  <span class="registro-data">${registro.data}</span>
                  <span class="registro-horario">${registro.horario}</span>
                  <span class="registro-professor">${registro.professor}</span>
                  ${
                    professorIcon
                      ? `<span class="professor-indicator ${professorClass}" title="${registro.professor}">${professorText} ${professorIcon}</span>`
                      : ""
                  }
                </div>
              </div>
            `;
              })
              .join("")}
          </div>
        </div>
      `;
      container.innerHTML = html;
    } else {
      container.innerHTML = `
        <div class="sem-registros">
          <span>📄 Nenhum registro encontrado</span>
        </div>
      `;
    }
  }
}

// Instância global do gerenciador de presença online
const onlineAttendanceManager = new OnlineAttendanceManager();

// === FUNÇÃO PARA REGISTRAR LOTE NA ABA "PRESENÇAS" ===
async function registrarLotePresencaOnline(registrosPorCurso, data) {
  try {
    console.log("📝 Iniciando registro em lote na aba Presenças...");

    // Usar as funções utilitárias para garantir formatação consistente
    const { data: dataFormatada, horario: horarioFormatado } =
      obterDataHorarioAtual();

    console.log(`📅 Data formatada: "${dataFormatada}"`);
    console.log(`🕐 Horário formatado: "${horarioFormatado}"`);

    let totalRegistrados = 0;
    let totalErros = 0;

    // Processar cada curso
    for (const [curso, registros] of registrosPorCurso.entries()) {
      console.log(`📚 Registrando curso ${curso}: ${registros.length} alunos`);

      // Processar registros do curso em pequenos lotes para não sobrecarregar
      const chunkSize = 5;
      for (let i = 0; i < registros.length; i += chunkSize) {
        const chunk = registros.slice(i, i + chunkSize);

        const promises = chunk.map(async (registro) => {
          try {
            // Buscar nome do aluno
            const aluno = allStudentsRawData.find(
              (a) => a.ID_Unico === registro.alunoId
            );
            const nomeAluno = aluno ? aluno.Nome : registro.alunoId;

            const resultado =
              await onlineAttendanceManager.registrarPresencaOnline(
                nomeAluno,
                dataFormatada,
                horarioFormatado,
                curso,
                currentUser.name,
                registro.status // ✅ CORREÇÃO: Usar o status real do registro (P ou F)
              );

            if (resultado.success) {
              totalRegistrados++;
              const acaoTexto = resultado.atualizado
                ? "atualizado"
                : "registrado";
              console.log(`✅ ${nomeAluno} ${acaoTexto} na aba Presenças`);
            } else {
              totalErros++;
              console.warn(
                `⚠️ Erro ao registrar ${nomeAluno}:`,
                resultado.error
              );
            }

            return resultado;
          } catch (error) {
            totalErros++;
            console.error(`❌ Erro no registro:`, error);
            return { success: false, error: error.message };
          }
        });

        // Aguardar processamento do chunk
        await Promise.allSettled(promises);

        // Pequena pausa entre chunks
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    console.log(
      `📊 Registro na aba Presenças concluído: ${totalRegistrados} sucessos, ${totalErros} erros`
    );

    return {
      success: true,
      totalRegistrados,
      totalErros,
    };
  } catch (error) {
    console.error("❌ Erro geral no registro em lote na aba Presenças:", error);
    return {
      success: false,
      error: error.message,
      totalRegistrados: 0,
      totalErros: 1,
    };
  }
}

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

  // Configurar limpeza automática do cache de status
  setInterval(invalidarCacheSeNecessario, 2 * 60 * 1000); // A cada 2 minutos
  console.log("🔧 Limpeza automática de cache configurada");

  // Mostrar botão de estatísticas para admins
  setupStatsButton();
});

// Função para configurar botão de estatísticas
function setupStatsButton() {
  const currentUser = AuthSystem.getCurrentUser();
  const statsButton = document.getElementById("statsButton");

  if (currentUser && statsButton) {
    statsButton.style.display = "flex";
    console.log(
      "📊 Botão de estatísticas habilitado para usuário:",
      currentUser.name
    );
  }
}

// === VARIÁVEIS GLOBAIS OTIMIZADAS ===
let allStudentsRawData = [];
let currentFilteredStudents = [];
let selectedStudentId = null;
let currentUser = null;
const cacheManager = new CacheManager();

// === UTILITÁRIOS DE REDE COM RETRY ===
async function fetchWithRetry(
  url,
  options = {},
  maxRetries = 3,
  timeoutMs = 20000
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Tentativa ${attempt}/${maxRetries} para: ${url.substring(
          0,
          100
        )}... (timeout: ${timeoutMs}ms)`
      );

      // Criar um timeout personalizado para cada tentativa
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

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

      // Backoff exponencial adaptativo: aumentar timeout nas tentativas subsequentes
      const delay = Math.pow(2, attempt - 1) * 1000;
      timeoutMs = Math.min(timeoutMs * 1.5, 30000); // Aumentar timeout até 30s máximo

      console.log(
        `⏳ Aguardando ${delay}ms antes da próxima tentativa (próximo timeout: ${timeoutMs}ms)...`
      );
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

  // Inicializar monitoramento da fila
  initializeQueueMonitoring();

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

  // Se for admin ou professor, adicionar funcionalidades avançadas
  if (currentUser.role === "admin") {
    addAdminFeatures();
  } else if (currentUser.role === "professor") {
    addProfessorFeatures();
  }

  // ✅ NOVO: Adicionar seção de últimos registros para professores
  if (currentUser.role === "professor") {
    addUltimosRegistrosSection();
  }
}

// === SEÇÃO DE ÚLTIMOS REGISTROS ONLINE ===
function addUltimosRegistrosSection() {
  // Verificar se já existe para evitar duplicação
  if (document.getElementById("ultimosRegistrosSection")) {
    return;
  }

  const container = document.querySelector(".container");
  if (!container) return;

  // Criar seção para últimos registros
  const ultimosRegistrosSection = document.createElement("div");
  ultimosRegistrosSection.id = "ultimosRegistrosSection";
  ultimosRegistrosSection.className = "ultimos-registros-section";
  ultimosRegistrosSection.innerHTML = `
    <div class="section-header">
      <h3>📋 Últimos Registros de Presença</h3>
      <button id="refreshRegistrosBtn" class="btn-refresh" title="Atualizar">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
          <path fill-rule="evenodd" d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
          <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
        </svg>
      </button>
    </div>
    <div id="ultimosRegistros" class="registros-container">
      <!-- Será preenchido dinamicamente -->
    </div>
  `;

  // Inserir antes do painel de detalhes
  const painelDetalhes = document.getElementById("painelDetalhes");
  if (painelDetalhes) {
    container.insertBefore(ultimosRegistrosSection, painelDetalhes);
  } else {
    container.appendChild(ultimosRegistrosSection);
  }

  // Event listener para o botão de refresh
  const refreshBtn = document.getElementById("refreshRegistrosBtn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", () => {
      onlineAttendanceManager.exibirUltimosRegistros();
    });
  }

  // Carregar registros iniciais
  setTimeout(() => {
    onlineAttendanceManager.exibirUltimosRegistros();
  }, 1000);
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
    attendanceButton.addEventListener("click", () => {
      console.log("🖱️ Botão Controle de Presenças clicado!");
      abrirControlePresencas();
    });
    buttonsContainer.appendChild(attendanceButton);

    // Adicionar aviso de modo visualização apenas (para edição de presenças individuais)
    const infoButton = document.createElement("div");
    infoButton.className = "admin-info-notice";
    infoButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
      </svg>
      <span>👁️ Visualização e Relatórios - Sem edição individual de presenças</span>
    `;
    buttonsContainer.appendChild(infoButton);
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
    .admin-view #markAbsentButton,
    .admin-view .register-attendance-btn {
      display: none !important;
    }
    .admin-view .student-card {
      cursor: default;
    }
    .admin-view .student-card:hover {
      transform: none;
    }
    .admin-view input[type="checkbox"]:not(:disabled),
    .admin-view input[type="radio"]:not(:disabled) {
      pointer-events: none;
    }
  `;
  document.head.appendChild(style);
  document.body.classList.add("admin-view");
}

// === FUNCIONALIDADES PARA PROFESSORES ===
function addProfessorFeatures() {
  const buttonsContainer = document.getElementById("buttons");
  if (buttonsContainer) {
    // Adicionar botão de estatísticas para professor
    const statsButton = document.createElement("button");
    statsButton.id = "statsButton";
    statsButton.className = "btn-primary";
    statsButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M4 11H2v3h2v-3zm5-4H7v7h2V7zm5-5v12h-2V2h2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1h-2zM6 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm-5 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3z"/>
      </svg>
      <span>📊 Relatórios e Estatísticas</span>
    `;
    statsButton.addEventListener("click", abrirDashboardAdministrativo);
    buttonsContainer.appendChild(statsButton);

    // Adicionar aviso de acesso para professores
    const infoButton = document.createElement("div");
    infoButton.className = "professor-info-notice";
    infoButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="m8.93 6.588-2.29.287-.082.38.45.083c.294.07.352.176.288.469l-.738 3.468c-.194.897.105 1.319.808 1.319.545 0 1.178-.252 1.465-.598l.088-.416c-.2.176-.492.246-.686.246-.275 0-.375-.193-.304-.533L8.93 6.588zM9 4.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
      </svg>
      <span>👨‍🏫 Acesso para visualização de relatórios e estatísticas</span>
    `;
    buttonsContainer.appendChild(infoButton);
  }
}

// === DASHBOARD ADMINISTRATIVO (MODAL) ===
async function abrirDashboardAdministrativo() {
  if (currentUser.role !== "admin" && currentUser.role !== "professor") {
    mostrarErro(
      "Acesso negado. Apenas administradores e professores podem acessar esta funcionalidade.",
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
  console.log("🔍 Abrindo controle de presenças...");
  console.log("👤 Usuário atual:", currentUser);

  if (currentUser.role !== "admin") {
    mostrarErro(
      "Acesso negado. Apenas administradores podem acessar esta funcionalidade.",
      "Acesso Restrito"
    );
    return;
  }

  console.log("✅ Usuário autorizado, criando modal...");

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

  console.log("📝 Modal HTML criado, adicionando ao DOM...");
  document.body.appendChild(modal);

  // Usar setTimeout para garantir que o DOM foi atualizado antes de mostrar
  setTimeout(() => {
    modal.classList.add("active");
    console.log("✅ Modal ativado e exibido!");
  }, 10);

  // Event listeners
  document
    .getElementById("consultarPresencas")
    .addEventListener("click", consultarPresencasPorData);
  document
    .getElementById("exportarPresencas")
    .addEventListener("click", exportarDadosPresenca);

  // Definir data padrão como hoje
  const hojeFormatado = getLocalDateString();
  document.getElementById("attendanceDate").value = hojeFormatado;

  // Melhorar interação entre campos de data
  setupDateFieldsInteraction();
}

function fecharControlePresencas() {
  console.log("🚪 Fechando controle de presenças...");
  const modal = document.getElementById("attendanceControlModal");
  if (modal) {
    modal.classList.remove("active");
    // Aguardar animação de fechamento antes de remover
    setTimeout(() => {
      modal.remove();
      console.log("✅ Modal removido!");
    }, 300);
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

  console.log("🔍 Valores dos campos:", {
    dateInput,
    startDateInput,
    endDateInput,
    courseInput,
  });

  let dateFilter = null;
  let startDate = null;
  let endDate = null;

  // Validar inputs
  if (dateInput) {
    dateFilter = dateInput;
    console.log("📅 Usando data específica:", dateFilter);
  } else if (startDateInput && endDateInput) {
    startDate = startDateInput;
    endDate = endDateInput;
    console.log("📅 Usando período:", startDate, "a", endDate);

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

    // Mostrar overlay de carregamento com mensagem específica
    if (dateFilter) {
      mostrarLoadingOverlay("Consultando presenças da data específica...");
    } else {
      mostrarLoadingOverlay("Consultando presenças do período selecionado...");
    }

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
        atualizarMensagemLoading("Conectando com a planilha Google...");

        const url = `${API_URL}?action=consultarPresencas&data=${dateFilter}${
          courseInput ? `&curso=${courseInput}` : ""
        }`;
        console.log("🔗 Chamando API:", url);

        const response = await fetch(url);

        atualizarMensagemLoading("Processando dados recebidos...");

        const result = await response.json();

        console.log("📊 Resposta da API:", result);

        if (result.success) {
          attendanceData = result.data || [];
        } else {
          throw new Error(result.error || "Erro ao consultar presenças");
        }
      } catch (apiError) {
        console.warn("⚠️ Erro na API, usando dados locais:", apiError);
        atualizarMensagemLoading("Carregando dados locais...");

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
      // Para período (múltiplas datas) - usar API real do Google Sheets
      console.log("📊 Processando consulta por período:", {
        startDate,
        endDate,
        courseInput,
      });

      try {
        atualizarMensagemLoading("Conectando com a planilha Google...");

        const url = `${API_URL}?action=consultarPresencasPorPeriodo&dataInicial=${startDate}&dataFinal=${endDate}${
          courseInput ? `&curso=${courseInput}` : ""
        }`;
        console.log("🔗 Chamando API para período:", url);

        const response = await fetch(url);

        atualizarMensagemLoading("Processando dados do período...");

        const result = await response.json();

        console.log("📊 Resposta da API para período:", result);

        if (result.success) {
          attendanceData = result.data || [];
        } else {
          throw new Error(
            result.error || "Erro ao consultar presenças por período"
          );
        }
      } catch (apiError) {
        console.warn(
          "⚠️ Erro na API de período, usando dados locais:",
          apiError
        );
        atualizarMensagemLoading("Carregando dados locais...");

        // Fallback para dados simulados se a API falhar
        let filteredStudents = [...allStudentsRawData];
        if (courseInput) {
          filteredStudents = filteredStudents.filter(
            (student) => student.Origem === courseInput
          );
        }

        console.log("👥 Alunos filtrados:", filteredStudents.length);

        attendanceData = simulateAttendanceData(
          filteredStudents,
          null,
          startDate,
          endDate
        );

        console.log("📋 Dados de presença gerados:", attendanceData.length);
      }
    }

    atualizarMensagemLoading("Preparando resultados...");

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
    removerLoadingOverlay();
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

  // Gerar dados de demonstração para teste
  generateSampleData() {
    console.log("🎲 Gerando dados de demonstração...");
    const sampleDates = [
      "2025-08-04",
      "2025-08-05",
      "2025-08-06",
      "2025-08-07",
    ];
    const sampleStudents = allStudentsRawData.slice(0, 10); // Primeiros 10 alunos

    sampleDates.forEach((date) => {
      sampleStudents.forEach((student, index) => {
        // Simular padrão realista: ~80% presença
        const isPresent = Math.random() > 0.2;
        this.markAttendance(student.ID_Unico, date, isPresent ? "P" : "A");
      });
    });

    console.log(
      "✅ Dados de demonstração gerados para",
      sampleDates.length,
      "datas e",
      sampleStudents.length,
      "alunos"
    );
  }
}

// Instância global do gerenciador de presença (para backup local)
const attendanceManager = new AttendanceManager();

function simulateAttendanceData(students, dateFilter, startDate, endDate) {
  console.log("🔍 Simulando dados de presença:", {
    dateFilter,
    startDate,
    endDate,
  });
  const attendanceData = [];

  if (dateFilter) {
    // Consulta para data específica
    const targetDate = dateFilter;
    console.log("📅 Processando data específica:", targetDate);

    students.forEach((student) => {
      // ✅ CORREÇÃO: Buscar status diretamente dos dados do servidor ao invés do cache local
      let attendanceStatus = getServerAttendanceStatus(student, targetDate);

      // Se não encontrou nos dados do servidor, buscar no cache local como fallback
      if (!attendanceStatus) {
        attendanceStatus = attendanceManager.getStudentAttendance(
          student.ID_Unico,
          targetDate
        );
      }

      let status, statusText, isMarked;

      if (attendanceStatus) {
        status = attendanceStatus;
        if (attendanceStatus === "P") {
          statusText = "Presente";
        } else if (attendanceStatus === "F") {
          statusText = "Falta";
        } else if (attendanceStatus === "A") {
          statusText = "Ausente";
        } else {
          statusText = "Ausente";
        }
        isMarked = true;
      } else {
        const hasAnyMarked =
          attendanceManager.hasAnyAttendanceMarked(targetDate);
        if (hasAnyMarked) {
          status = "A";
          statusText = "Ausente (Não Marcado)";
          isMarked = false;
        } else {
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
  } else if (startDate && endDate) {
    // Consulta para período - iterar através de cada data
    console.log("📅 Processando período:", startDate, "até", endDate);

    const start = new Date(startDate);
    const end = new Date(endDate);
    const dateList = [];

    // Gerar lista de datas no período
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split("T")[0];
      dateList.push(dateStr);
    }

    console.log("📋 Datas no período:", dateList);

    students.forEach((student) => {
      dateList.forEach((currentDate) => {
        // ✅ CORREÇÃO: Buscar status diretamente dos dados do servidor ao invés do cache local
        let attendanceStatus = getServerAttendanceStatus(student, currentDate);

        // Se não encontrou nos dados do servidor, buscar no cache local como fallback
        if (!attendanceStatus) {
          attendanceStatus = attendanceManager.getStudentAttendance(
            student.ID_Unico,
            currentDate
          );
        }

        let status, statusText, isMarked;

        if (attendanceStatus) {
          status = attendanceStatus;
          if (attendanceStatus === "P") {
            statusText = "Presente";
          } else if (attendanceStatus === "F") {
            statusText = "Falta";
          } else if (attendanceStatus === "A") {
            statusText = "Ausente";
          } else {
            statusText = "Ausente";
          }
          isMarked = true;
        } else {
          const hasAnyMarked =
            attendanceManager.hasAnyAttendanceMarked(currentDate);
          if (hasAnyMarked) {
            status = "A";
            statusText = "Ausente (Não Marcado)";
            isMarked = false;
          } else {
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
          date: currentDate,
          status: status,
          statusText: statusText,
          isMarked: isMarked,
        });
      });
    });
  }

  console.log(
    "📊 Dados de presença gerados:",
    attendanceData.length,
    "registros"
  );
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

  console.log(
    "📊 Calculando estatísticas para",
    attendanceData.length,
    "registros"
  );

  // Calcular estatísticas
  let total, present, absent, rate;

  if (dateFilter) {
    // Para data específica: contar todos os alunos
    total = attendanceData.length;
    present = attendanceData.filter((a) => a.status === "P").length;
    absent = attendanceData.filter(
      (a) => a.status === "A" || a.status === "F"
    ).length;

    // Para data específica, incluir alunos sem registro nas faltas se houver qualquer presença marcada
    const hasAnyPresence = present > 0 || absent > 0;
    if (hasAnyPresence) {
      const withoutRecord = attendanceData.filter(
        (a) => a.status === null
      ).length;
      absent += withoutRecord;
    }
  } else {
    // Para período: contar alunos únicos, não registros
    const uniqueStudents = [...new Set(attendanceData.map((a) => a.studentId))];
    total = uniqueStudents.length;

    // Contar presenças e faltas do período
    present = attendanceData.filter((a) => a.status === "P").length;
    absent = attendanceData.filter(
      (a) => a.status === "A" || a.status === "F"
    ).length;

    const uniqueDates = [...new Set(attendanceData.map((a) => a.date))].length;

    console.log("📋 Estatísticas do período:", {
      uniqueStudents: total,
      uniqueDates,
      totalRecords: attendanceData.length,
      present,
      absent,
    });
  }

  rate = total > 0 ? ((present / (present + absent)) * 100).toFixed(1) : 0;

  console.log("📊 Estatísticas finais:", { total, present, absent, rate });

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

  // Decidir se incluir coluna de data
  const isPeriodQuery = !dateFilter && startDate && endDate;

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
            ${isPeriodQuery ? "<th>Data</th>" : ""}
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
              ${
                isPeriodQuery
                  ? `<td data-label="Data">${new Date(
                      record.date + "T12:00:00"
                    ).toLocaleDateString("pt-BR")}</td>`
                  : ""
              }
              <td data-label="Status">
                <span class="status-registro ${
                  record.status === "P"
                    ? "status-presente"
                    : record.status === "F"
                    ? "status-falta"
                    : "status-ausente"
                } ${!record.isMarked ? "status-nao-marcado" : ""}">
                  ${
                    record.status === "P"
                      ? "Presente"
                      : record.status === "F"
                      ? "Falta"
                      : "Ausente"
                  }
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

  // Modal de registro (apenas para professores)
  if (currentUser.role !== "admin") {
    elements.registerButton?.addEventListener("click", abrirModalRegistro);
    elements.closeRegistrationModalButton?.addEventListener(
      "click",
      fecharModalRegistro
    );
    elements.submitPresencaButton?.addEventListener("click", submeterPresenca);
  } else {
    // Ocultar botão de registro para administradores
    if (elements.registerButton) {
      elements.registerButton.style.display = "none";
    }
  }
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

  console.log(
    `📱 Dispositivo: ${isMobile ? "Mobile" : "Desktop"}, Orientação: ${
      isPortrait ? "Retrato" : "Paisagem"
    }, Mostrar Tabela: ${shouldShow}`
  );

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

    // ✅ OTIMIZAÇÃO: Pré-carregar status dos alunos carregados
    const nomesAlunos = filteredByUser.map((aluno) => aluno.Nome);
    setTimeout(() => {
      onlineAttendanceManager.preCarregarStatusAlunos(nomesAlunos);
    }, 500);

    // 🔥 PRÉ-CACHE INTELIGENTE: Carregar dados de presença em background
    if (filteredByUser.length > 0 && filteredByUser.length <= 50) {
      // Apenas para listas pequenas
      const today = getLocalDateString();
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

    const dataHoje = getLocalDateString();

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
      marcarTodos: "false", // ✅ CORREÇÃO: Usar false como nos cards que funcionam corretamente
    });

    const response = await fetch(`${API_URL}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Erro HTTP: ${response.status}`);
    }

    const resultado = await response.json();

    if (!resultado.success) {
      throw new Error(resultado.error || "Erro desconhecido");
    }

    // ✅ NOVO: Registrar também na aba "Presenças" para histórico online
    try {
      console.log("🔄 Iniciando registro na aba Presenças...");

      // Usar as funções utilitárias para garantir formatação consistente
      const { data: dataFormatada, horario: horarioFormatado } =
        obterDataHorarioAtual();

      console.log("📅 Dados formatados:", {
        nome: aluno.Nome,
        data: dataFormatada,
        horario: horarioFormatado,
        curso: cursoAluno,
        professor: currentUser.name,
      });

      const resultadoPresenca =
        await onlineAttendanceManager.registrarPresencaOnline(
          aluno.Nome,
          dataFormatada,
          horarioFormatado,
          cursoAluno,
          currentUser.name,
          status // ✅ CORREÇÃO: Usar o status real (P ou F) em vez de fixo "P"
        );

      console.log("📊 Resultado presença online:", resultadoPresenca);

      if (resultadoPresenca.success) {
        const acaoTexto = resultadoPresenca.atualizado
          ? "atualizada"
          : "registrada";
        console.log(`✅ Presença ${acaoTexto} também na aba Presenças`);
      } else {
        console.warn(
          "⚠️ Falha ao registrar na aba Presenças:",
          resultadoPresenca.error
        );
      }
    } catch (presencaOnlineError) {
      console.warn(
        "⚠️ Erro ao registrar na aba Presenças (não crítico):",
        presencaOnlineError
      );
      // Não interromper o fluxo principal por erro não crítico
    }

    const acao = status === "P" ? "Presença" : "Falta";
    mostrarSucesso(`${acao} registrada com sucesso!`, "Registro Salvo");

    // ✅ NOVO: Registrar no rastreador local (substitui o localStorage)
    lastAttendanceTracker.recordAttendance(
      selectedStudentId,
      dataHoje,
      status,
      currentUser.name
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
  // Cancelar requisições pendentes antes de exibir novos resultados
  console.log(
    "🔄 Exibindo novos resultados, cancelando requisições pendentes..."
  );
  cancelarRequisicoesCards();

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

// Função auxiliar para buscar coluna por padrões
function buscarColuna(aluno, padroes) {
  // PRIORIDADE 1: Buscar nos campos diretos que vêm do App Script
  for (const padrao of padroes) {
    if (
      aluno[padrao] !== undefined &&
      aluno[padrao] !== null &&
      aluno[padrao] !== ""
    ) {
      return aluno[padrao];
    }
  }

  // PRIORIDADE 2: Buscar nas propriedades case-insensitive
  const alunoKeys = Object.keys(aluno);
  for (const padrao of padroes) {
    for (const key of alunoKeys) {
      if (key.toLowerCase().includes(padrao.toLowerCase())) {
        const valor = aluno[key];
        if (valor !== undefined && valor !== null && valor !== "") {
          return valor;
        }
      }
    }
  }

  return "0";
}

function createStudentCardHTML(aluno, media, situacao, faltas = null) {
  const iniciais = aluno.Nome.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const nota1 = aluno.Nota1 || "0";
  const nota2 = aluno.Nota2 || "0";
  const nota3 = aluno.Nota3 || "0";
  const faltasExibir = faltas !== null ? faltas : aluno.Faltas || 0;

  // Usar a média da tabela diretamente
  const mediaTabela = aluno.Media || media || 0;
  const mediaExibir =
    typeof mediaTabela === "number" ? mediaTabela.toFixed(1) : mediaTabela;

  // Verificar se é reprovado por falta
  const reprovadoPorFalta = situacao === "Reprovado" && faltasExibir > 15;
  const situacaoDisplay = reprovadoPorFalta ? "Reprovado por Falta" : situacao;

  // Criar um placeholder para último registro que será preenchido assincronamente
  const lastAttendanceId = `lastAttendance_${aluno.ID_Unico}`;

  // Verificar cache primeiro
  const cachedStatus = statusCache.getStatus(aluno.Nome);
  if (cachedStatus && !statusCache.isExpired()) {
    // Usar dados do cache imediatamente
    setTimeout(() => {
      atualizarCardImediatamente(aluno.ID_Unico, cachedStatus);
    }, 10);
  } else {
    // Buscar último registro online usando a fila sequencial
    // Usar um delay baseado no índice do aluno para espalhar as requisições
    const cardIndex = document.querySelectorAll(".student-card").length;
    const delayMs = Math.min(cardIndex * 50, 2000); // Máximo de 2 segundos

    setTimeout(async () => {
      try {
        console.log(
          `🔄 Iniciando busca para ${aluno.Nome} (delay: ${delayMs}ms)`
        );

        const resultado =
          await onlineAttendanceManager.buscarUltimoRegistroAluno(aluno.Nome);
        const lastAttendanceElement = document.getElementById(lastAttendanceId);

        if (lastAttendanceElement) {
          if (resultado.success && resultado.registro) {
            const registro = resultado.registro;
            console.log(`✅ Registro encontrado para ${aluno.Nome}:`, registro);

            // Atualizar card
            atualizarCardImediatamente(aluno.ID_Unico, registro);
          } else {
            console.log(`❌ Nenhum registro encontrado para ${aluno.Nome}`);
            lastAttendanceElement.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="attendance-icon">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M5.255 5.786a.237.237 0 0 0 .241.247h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286zm1.557 5.763c0 .533.425.927 1.01.927.609 0 1.028-.394 1.028-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94z"/>
            </svg>
            <div class="attendance-info">
              <span class="attendance-label">Nenhum registro encontrado</span>
            </div>
          `;
            lastAttendanceElement.className = "last-attendance no-record";
          }
        }
      } catch (error) {
        console.error(
          `❌ Erro ao buscar último registro para ${aluno.Nome}:`,
          error
        );

        // Mostrar erro no card
        const lastAttendanceElement = document.getElementById(lastAttendanceId);
        if (lastAttendanceElement) {
          lastAttendanceElement.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="attendance-icon">
              <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
              <path d="M11.46.146A.5.5 0 0 0 11.107 0H4.893a.5.5 0 0 0-.353.146L.146 4.54A.5.5 0 0 0 0 4.893v6.214a.5.5 0 0 0 .146.353l4.394 4.394a.5.5 0 0 0 .353.146h6.214a.5.5 0 0 0 .353-.146l4.394-4.394a.5.5 0 0 0 .146-.353V4.893a.5.5 0 0 0-.146-.353L11.46.146zM8 4c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995A.905.905 0 0 1 8 4zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
            </svg>
            <div class="attendance-info">
              <span class="attendance-label">Erro ao carregar</span>
            </div>
          `;
          lastAttendanceElement.className = "last-attendance error";
        }
      }
    }, delayMs);
  }

  // HTML inicial com placeholder
  const lastAttendanceDisplay = `<div id="${lastAttendanceId}" class="last-attendance loading">
    <div class="loading-spinner-small"></div>
    <div class="attendance-info">
      <span class="attendance-label">Carregando último registro...</span>
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

  // Calcular notas por matéria usando dados reais da tabela
  const notasCurso = {
    bim1: aluno.Nota1 || "0",
    bim2: aluno.Nota2 || "0",
    bim3: aluno.Nota3 || "0",
  };

  // Padrões para buscar colunas de Mundo do Trabalho
  const padroesMT1 = [
    "MundoTrabalho1", // Campo direto do App Script
    "MundoTrabalho_1Bim",
    "Mundo do Trabalho - 1º Bim",
    "MundoTrabalho1Bim",
    "Mundo_Trabalho_1Bim",
    "MT_1Bim",
    "MT1",
    "Mundo Trabalho 1",
    "MT 1º Bim",
  ];
  const padroesMT2 = [
    "MundoTrabalho2", // Campo direto do App Script
    "MundoTrabalho_2Bim",
    "Mundo do Trabalho - 2º Bim",
    "MundoTrabalho2Bim",
    "Mundo_Trabalho_2Bim",
    "MT_2Bim",
    "MT2",
    "Mundo Trabalho 2",
    "MT 2º Bim",
  ];
  const padroesMT3 = [
    "MundoTrabalho3", // Campo direto do App Script
    "MundoTrabalho_3Bim",
    "Mundo do Trabalho - 3º Bim",
    "MundoTrabalho3Bim",
    "Mundo_Trabalho_3Bim",
    "MT_3Bim",
    "MT3",
    "Mundo Trabalho 3",
    "MT 3º Bim",
  ];

  // Padrões para buscar colunas de Convívio
  const padroesConv1 = [
    "Convivio1", // Campo direto do App Script
    "Convivio_1Bim",
    "Convívio - 1º Bim",
    "Convivio1Bim",
    "Conv_1Bim",
    "Conv1",
    "Convivio 1",
    "Convívio 1º Bim",
  ];
  const padroesConv2 = [
    "Convivio2", // Campo direto do App Script
    "Convivio_2Bim",
    "Convívio - 2º Bim",
    "Convivio2Bim",
    "Conv_2Bim",
    "Conv2",
    "Convivio 2",
    "Convívio 2º Bim",
  ];
  const padroesConv3 = [
    "Convivio3", // Campo direto do App Script
    "Convivio_3Bim",
    "Convívio - 3º Bim",
    "Convivio3Bim",
    "Conv_3Bim",
    "Conv3",
    "Convivio 3",
    "Convívio 3º Bim",
  ];

  const notasMundoTrabalho = {
    bim1: buscarColuna(aluno, padroesMT1),
    bim2: buscarColuna(aluno, padroesMT2),
    bim3: buscarColuna(aluno, padroesMT3),
  };

  const notasConvivio = {
    bim1: buscarColuna(aluno, padroesConv1),
    bim2: buscarColuna(aluno, padroesConv2),
    bim3: buscarColuna(aluno, padroesConv3),
  };

  // Usar a média da tabela em vez de calcular
  const mediaGeral = mediaExibir;

  // Log temporário para verificar se as colunas estão sendo detectadas
  if (aluno.Nome === "ARTHUR MATIAS DA SILVA") {
    console.log("🔍 Teste de detecção de colunas:", {
      todasColunas: Object.keys(aluno),
      valoresAluno: aluno,
      mundoTrabalho: {
        bim1: notasMundoTrabalho.bim1,
        bim2: notasMundoTrabalho.bim2,
        bim3: notasMundoTrabalho.bim3,
      },
      convivio: {
        bim1: notasConvivio.bim1,
        bim2: notasConvivio.bim2,
        bim3: notasConvivio.bim3,
      },
    });
  }

  return `
    <div class="flip-card-container">
      <!-- Botões de Ação -->
      <div class="card-action-buttons">
        <button class="flip-card-btn" onclick="toggleCardFlip('${
          aluno.ID_Unico
        }')" title="Ver notas detalhadas">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
            <path d="M1 2.828c.885-.37 2.154-.769 3.388-.893 1.33-.134 2.458.063 3.112.752v9.746c-.935-.53-2.12-.603-3.213-.493-1.18.12-2.37.461-3.287.811V2.828zm7.5-.141c.654-.689 1.782-.886 3.112-.752 1.234.124 2.503.523 3.388.893v9.923c-.918-.35-2.107-.692-3.287-.81-1.094-.111-2.278-.039-3.213.492V2.687zM8 1.783C7.015.936 5.587.81 4.287.94c-1.514.153-3.042.672-3.994 1.105A.5.5 0 0 0 0 2.5v11a.5.5 0 0 0 .707.455c.882-.4 2.303-.881 3.68-1.02 1.409-.142 2.59.087 3.223.877a.5.5 0 0 0 .78 0c.633-.79 1.814-1.019 3.222-.877 1.378.139 2.8.62 3.681 1.02A.5.5 0 0 0 16 13.5v-11a.5.5 0 0 0-.293-.455c-.952-.433-2.48-.952-3.994-1.105C10.413.809 8.985.936 8 1.783z"/>
          </svg>
        </button>
        <button class="attendance-history-btn" onclick="mostrarHistoricoFaltas('${
          aluno.ID_Unico
        }', '${aluno.Nome}')" title="Ver histórico de faltas">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
          </svg>
        </button>
      </div>

      <div class="flip-card" id="flipCard-${aluno.ID_Unico}">
        <!-- FRENTE DO CARD -->
        <div class="flip-card-front">
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

          <!-- Seção Principal de Performance com destaque para média -->
          <div class="main-performance-section">
            <div class="media-destaque">
              <div class="media-label">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 2a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V2zm2-1a1 1 0 0 0-1 1v12h6V2a1 1 0 0 0-1-1H6z"/>
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                </svg>
                Média Geral
              </div>
              <div class="media-valor-principal ${getMediaClass(
                mediaExibir
              )}" data-media="${mediaExibir}">
                ${mediaExibir || "-"}
              </div>
              <div class="media-progress-bar">
                <div class="progress-fill" style="width: ${getMediaPercentage(
                  mediaExibir
                )}%"></div>
              </div>
            </div>

            <div class="situacao-e-faltas">
              <div class="situation-badge ${situacaoDisplay
                .toLowerCase()
                .replace(/\s/g, "-")} ${
    reprovadoPorFalta ? "reprovado-por-falta" : ""
  }">
                ${getSituationIcon(situacao)}
                <span class="situacao-text">${situacaoDisplay}</span>
              </div>
              
              <div class="faltas-info ${
                faltasExibir > 15 ? "faltas-excesso" : ""
              }">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
                </svg>
                <span class="faltas-label">Faltas:</span>
                <span class="faltas-valor">${faltasExibir}</span>
                ${
                  faltasExibir > 15
                    ? '<span class="faltas-alerta">⚠️ Limite excedido</span>'
                    : ""
                }
              </div>
            </div>
          </div>

          <!-- Seção de Presença no Card -->
          <div class="card-attendance-section" id="attendanceSection-${
            aluno.ID_Unico
          }">
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
            
            <div class="attendance-controls hidden" id="attendanceControls-${
              aluno.ID_Unico
            }">
              <div class="attendance-date-group">
                <label for="attendanceDate-${aluno.ID_Unico}">Data:</label>
                <input 
                  type="date" 
                  id="attendanceDate-${aluno.ID_Unico}" 
                  class="attendance-date-input"
                  value="${getLocalDateString()}"
                />
              </div>
              
              <div class="attendance-status-group">
                <label class="status-radio">
                  <input 
                    type="radio" 
                    name="status-${aluno.ID_Unico}" 
                    value="P" 
                    checked
                    ${currentUser.role === "admin" ? "disabled" : ""}
                  />
                  <span class="radio-text">✅ Presente</span>
                </label>
                <label class="status-radio">
                  <input 
                    type="radio" 
                    name="status-${aluno.ID_Unico}" 
                    value="F"
                    ${currentUser.role === "admin" ? "disabled" : ""}
                  />
                  <span class="radio-text">❌ Ausente</span>
                </label>
              </div>
              
              ${
                currentUser.role === "admin"
                  ? `<div class="admin-readonly-notice">
                <span>👁️ Visualização apenas</span>
              </div>`
                  : `<button 
                class="register-attendance-btn" 
                onclick="registrarPresencaCard('${aluno.ID_Unico}')"
              >
                📝 Registrar
              </button>`
              }
            </div>
          </div>
        </div>

        <!-- VERSO DO CARD - NOTAS DETALHADAS -->
        <div class="flip-card-back">
          <div class="card-back-header">
            <h3>${aluno.Nome}</h3>
            <span class="card-back-subtitle">Notas Detalhadas por Matéria</span>
          </div>

          <div class="detailed-grades">
            <!-- Curso Principal -->
            <div class="grade-section">
              <div class="grade-section-title">
                <span class="grade-section-icon">📚</span>
                ${aluno.Origem}
                ${
                  getProfessorPermissions().subjects.includes("curso")
                    ? '<span class="editable-indicator">✏️ Editável</span>'
                    : ""
                }
              </div>
              <div class="grade-section-grid">
                <div class="detailed-grade-item">
                  <span class="detailed-grade-label">1º Bim</span>
                  ${renderGradeField(
                    aluno.ID_Unico,
                    "curso",
                    "1",
                    notasCurso.bim1,
                    getProfessorPermissions().subjects.includes("curso")
                  )}
                </div>
                <div class="detailed-grade-item">
                  <span class="detailed-grade-label">2º Bim</span>
                  ${renderGradeField(
                    aluno.ID_Unico,
                    "curso",
                    "2",
                    notasCurso.bim2,
                    getProfessorPermissions().subjects.includes("curso")
                  )}
                </div>
                <div class="detailed-grade-item">
                  <span class="detailed-grade-label">3º Bim</span>
                  ${renderGradeField(
                    aluno.ID_Unico,
                    "curso",
                    "3",
                    notasCurso.bim3,
                    getProfessorPermissions().subjects.includes("curso")
                  )}
                </div>
              </div>
            </div>

            <!-- Mundo do Trabalho -->
            <div class="grade-section">
              <div class="grade-section-title">
                <span class="grade-section-icon">🌍</span>
                Mundo do Trabalho
                ${
                  getProfessorPermissions().subjects.includes("mundoTrabalho")
                    ? '<span class="editable-indicator">✏️ Editável</span>'
                    : ""
                }
              </div>
              ${
                notasMundoTrabalho.bim1 === "-" &&
                notasMundoTrabalho.bim2 === "-" &&
                notasMundoTrabalho.bim3 === "-" &&
                !getProfessorPermissions().subjects.includes("mundoTrabalho")
                  ? `<div class="grade-section-unavailable">
                  <span class="unavailable-message">📋 Dados não disponíveis na tabela atual</span>
                  <span class="unavailable-note">Para incluir essas notas, adicione as colunas correspondentes na planilha</span>
                </div>`
                  : `<div class="grade-section-grid">
                  <div class="detailed-grade-item">
                    <span class="detailed-grade-label">1º Bim</span>
                    ${renderGradeField(
                      aluno.ID_Unico,
                      "mundoTrabalho",
                      "1",
                      notasMundoTrabalho.bim1,
                      getProfessorPermissions().subjects.includes(
                        "mundoTrabalho"
                      )
                    )}
                  </div>
                  <div class="detailed-grade-item">
                    <span class="detailed-grade-label">2º Bim</span>
                    ${renderGradeField(
                      aluno.ID_Unico,
                      "mundoTrabalho",
                      "2",
                      notasMundoTrabalho.bim2,
                      getProfessorPermissions().subjects.includes(
                        "mundoTrabalho"
                      )
                    )}
                  </div>
                  <div class="detailed-grade-item">
                    <span class="detailed-grade-label">3º Bim</span>
                    ${renderGradeField(
                      aluno.ID_Unico,
                      "mundoTrabalho",
                      "3",
                      notasMundoTrabalho.bim3,
                      getProfessorPermissions().subjects.includes(
                        "mundoTrabalho"
                      )
                    )}
                  </div>
                </div>`
              }
            </div>

            <!-- Convívio -->
            <div class="grade-section">
              <div class="grade-section-title">
                <span class="grade-section-icon">🤝</span>
                Convívio
                ${
                  getProfessorPermissions().subjects.includes("convivio")
                    ? '<span class="editable-indicator">✏️ Editável</span>'
                    : ""
                }
              </div>
              ${
                notasConvivio.bim1 === "-" &&
                notasConvivio.bim2 === "-" &&
                notasConvivio.bim3 === "-" &&
                !getProfessorPermissions().subjects.includes("convivio")
                  ? `<div class="grade-section-unavailable">
                  <span class="unavailable-message">📋 Dados não disponíveis na tabela atual</span>
                  <span class="unavailable-note">Para incluir essas notas, adicione as colunas correspondentes na planilha</span>
                </div>`
                  : `<div class="grade-section-grid">
                  <div class="detailed-grade-item">
                    <span class="detailed-grade-label">1º Bim</span>
                    ${renderGradeField(
                      aluno.ID_Unico,
                      "convivio",
                      "1",
                      notasConvivio.bim1,
                      getProfessorPermissions().subjects.includes("convivio")
                    )}
                  </div>
                  <div class="detailed-grade-item">
                    <span class="detailed-grade-label">2º Bim</span>
                    ${renderGradeField(
                      aluno.ID_Unico,
                      "convivio",
                      "2",
                      notasConvivio.bim2,
                      getProfessorPermissions().subjects.includes("convivio")
                    )}
                  </div>
                  <div class="detailed-grade-item">
                    <span class="detailed-grade-label">3º Bim</span>
                    ${renderGradeField(
                      aluno.ID_Unico,
                      "convivio",
                      "3",
                      notasConvivio.bim3,
                      getProfessorPermissions().subjects.includes("convivio")
                    )}
                  </div>
                </div>`
              }
            </div>

            <!-- Média Geral -->
            <div class="overall-average">
              <div class="overall-average-label">Média Geral do Curso</div>
              <div class="overall-average-value ${
                mediaGeral === "-" ? "empty" : ""
              }">${mediaGeral}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Função para alternar flip do card
function toggleCardFlip(studentId) {
  const flipCard = document.getElementById(`flipCard-${studentId}`);
  const container = flipCard?.closest(".student-card");

  if (flipCard && container) {
    const isFlipping = !flipCard.classList.contains("flipped");

    if (isFlipping) {
      // Virar para o verso - ajustar altura
      flipCard.classList.add("flipped");

      // Aguardar um pouco para que o DOM se atualize e medir a altura real
      setTimeout(() => {
        const backCard = flipCard.querySelector(".flip-card-back");
        if (backCard) {
          // Forçar reflow para obter altura real
          backCard.style.position = "relative";
          const backHeight = backCard.offsetHeight;
          backCard.style.position = "absolute";

          // Aplicar altura mínima com margem de segurança
          container.style.minHeight = `${backHeight + 40}px`;
          container.style.transition = "min-height 0.4s ease-out";

          // Garantir que o container seja visível
          container.style.overflow = "visible";
        }
      }, 100);
    } else {
      // Virar para a frente - restaurar altura original
      flipCard.classList.remove("flipped");

      setTimeout(() => {
        // Restaurar altura automática
        container.style.minHeight = "";
        container.style.transition = "";
        container.style.overflow = "";
      }, 350); // Aguardar animação completa
    }
  }
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
    case "em curso":
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 3.5a.5.5 0 0 0-1 0V9a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 8.71V3.5z"/>
        <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z"/>
      </svg>`;
    default:
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
        <path d="M5 6.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0zm.25 2.25a.25.25 0 0 0-.5 0v.5c0 .138.112.25.25.25h.5a.25.25 0 0 0 .25-.25v-.5zM12.5 6.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0z"/>
      </svg>`;
  }
}

// Função para obter classe CSS baseada na média
function getMediaClass(media) {
  if (!media || media === "-" || media === 0) return "media-vazia";
  const valor = parseFloat(media);
  if (valor >= 6.0) return "media-aprovado";
  return "media-reprovado";
}

// Função para calcular porcentagem da média para barra de progresso
function getMediaPercentage(media) {
  if (!media || media === "-") return 0;
  const valor = parseFloat(media);
  return Math.min((valor / 10) * 100, 100);
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
                       ${currentUser.role === "admin" ? "disabled" : ""}
                       onchange="handleAttendanceChange(this)">
            </td>
            <td data-label="❌ Ausente" class="attendance-col">
                <input type="checkbox" 
                       class="attendance-checkbox absent" 
                       data-aluno-id="${aluno.ID_Unico}"
                       data-type="absent"
                       ${currentUser.role === "admin" ? "disabled" : ""}
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
  if (detailNota1) detailNota1.value = aluno.Nota1 || "0";
  if (detailNota2) detailNota2.value = aluno.Nota2 || "0";
  if (detailNota3) detailNota3.value = aluno.Nota3 || "0";
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

// === FUNÇÃO PARA ATUALIZAR NOTA DIRETAMENTE NO CARD ===
async function updateGrade(studentId, subject, bimester, newValue) {
  try {
    // Validação de permissão
    const permissions = getProfessorPermissions();
    if (!permissions.canEdit || !permissions.subjects.includes(subject)) {
      mostrarErroCard(
        studentId,
        "Você não tem permissão para editar esta disciplina",
        "Acesso Negado"
      );
      return;
    }

    // Validação do valor
    const grade = parseFloat(newValue);
    if (isNaN(grade) || grade < 0 || grade > 10) {
      mostrarErroCard(
        studentId,
        "Nota deve ser entre 0 e 10",
        "Valor Inválido"
      );
      return;
    }

    // Mostrar loading no card
    mostrarLoadingCard(
      studentId,
      `Atualizando nota ${subject} ${bimester}º bim...`
    );

    // Determinar qual campo da planilha atualizar
    let campo;
    switch (subject) {
      case "curso":
        campo = `Nota${bimester}`;
        break;
      case "mundoTrabalho":
        campo = `MundoTrabalho${bimester}`;
        break;
      case "convivio":
        campo = `Convivio${bimester}`;
        break;
      default:
        throw new Error("Disciplina não reconhecida");
    }

    // Preparar dados para envio
    const dadosAtualizacao = {
      action: "atualizarNotaEspecifica",
      ra: studentId,
      disciplina: subject,
      bimestre: `${bimester}_BIMESTRE`,
      nota: grade.toString(),
    };

    console.log("📝 Enviando atualização de nota:", dadosAtualizacao);
    console.log("🌐 URL da API:", API_URL);
    console.log("🔧 IS_LOCAL:", IS_LOCAL);

    // Usar função universal que lida com CORS automaticamente
    const resultado = await enviarRequisicao(dadosAtualizacao, false); // Não tentar fetch POST
    console.log("📊 Resultado:", resultado);

    if (resultado.success) {
      // Se o Apps Script retornou dados da média, atualizar imediatamente
      if (resultado.data && resultado.data.media) {
        console.log("📊 Atualizando média no card com dados do servidor...");
        atualizarMediaNoCardComDados(studentId, {
          media: resultado.data.media,
          situacao: resultado.data.situacao,
        });

        // Mostrar notificação de sucesso com a nova média
        mostrarSucessoCard(
          studentId,
          `Nota ${subject} ${bimester}º bim atualizada para ${grade}. Nova média: ${resultado.data.media}`,
          "Nota e Média Atualizadas"
        );
      } else {
        // Fallback se não tiver dados da média
        mostrarSucessoCard(
          studentId,
          `Nota ${subject} ${bimester}º bim atualizada para ${grade}`,
          "Nota Atualizada"
        );
      }

      // Aguardar um pouco e verificar se a atualização foi bem-sucedida
      setTimeout(async () => {
        try {
          console.log("🔍 Verificando se a atualização foi aplicada...");

          // Buscar dados atualizados do aluno
          const response = await fetch(
            `${API_URL}?nomeAluno=${encodeURIComponent(studentId)}`
          );
          const data = await response.json();

          if (data.saida && data.saida.length > 0) {
            const alunoAtualizado = data.saida.find(
              (a) => a.ID_Unico === studentId
            );
            if (alunoAtualizado) {
              // Verificar se a nota foi realmente atualizada
              let notaAtualizada = false;

              if (subject === "curso") {
                const campoNota = `Nota${bimester}`;
                const notaAtual = parseFloat(alunoAtualizado[campoNota]) || 0;
                notaAtualizada = Math.abs(notaAtual - grade) < 0.01; // Tolerância para comparação de float
                console.log(
                  `📊 Verificação ${campoNota}: esperado=${grade}, atual=${notaAtual}, atualizada=${notaAtualizada}`
                );
              } else if (subject === "mundoTrabalho") {
                const campoNota = `MundoTrabalho${bimester}`;
                const notaAtual = parseFloat(alunoAtualizado[campoNota]) || 0;
                notaAtualizada = Math.abs(notaAtual - grade) < 0.01;
                console.log(
                  `📊 Verificação ${campoNota}: esperado=${grade}, atual=${notaAtual}, atualizada=${notaAtualizada}`
                );
              } else if (subject === "convivio") {
                const campoNota = `Convivio${bimester}`;
                const notaAtual = parseFloat(alunoAtualizado[campoNota]) || 0;
                notaAtualizada = Math.abs(notaAtual - grade) < 0.01;
                console.log(
                  `📊 Verificação ${campoNota}: esperado=${grade}, atual=${notaAtual}, atualizada=${notaAtualizada}`
                );
              }

              if (notaAtualizada) {
                console.log("✅ Atualização confirmada na planilha!");
                // Atualizar a média exibida no card com dados recalculados
                const calculado = calcularMediaESituacao(alunoAtualizado);
                atualizarMediaNoCardComDados(studentId, {
                  media: calculado.media,
                  situacao: calculado.situacao,
                });
              } else {
                console.warn(
                  "⚠️ Nota não foi atualizada na planilha. Tentando novamente..."
                );
                mostrarErroCard(
                  studentId,
                  "Nota pode não ter sido salva. Verifique a planilha.",
                  "Verificação Necessária"
                );
              }
            }
          }
        } catch (error) {
          console.error("❌ Erro ao verificar atualização:", error);
        }
      }, 2000); // Aguardar 2 segundos antes de verificar
    } else {
      throw new Error(resultado.error || "Erro desconhecido");
    }
  } catch (error) {
    console.error("Erro ao atualizar nota:", error);
    mostrarErroCard(
      studentId,
      `Erro: ${error.message}`,
      "Falha na Atualização"
    );
  } finally {
    removerLoadingCard(studentId);
  }
}

// === FUNÇÃO JSONP PARA CONTORNAR CORS ===
function enviarViaJSONP(dados) {
  return new Promise((resolve, reject) => {
    // Criar callback único
    const callbackName = `jsonp_callback_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    console.log("🔗 Iniciando JSONP com callback:", callbackName);

    // Registrar callback global
    window[callbackName] = function (response) {
      console.log("✅ JSONP callback executado:", response);
      // Limpar callback
      delete window[callbackName];
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      resolve(response);
    };

    // Construir URL com parâmetros
    const params = new URLSearchParams({
      ...dados,
      callback: callbackName,
      _method: "POST", // Indicar ao Apps Script para usar lógica do doPost
    });

    const url = `${WEB_APP_URL}?${params.toString()}`;
    console.log("🔗 URL JSONP (simulando POST):", url);

    // Criar script element
    const script = document.createElement("script");
    script.src = url;

    script.onerror = (error) => {
      console.error("❌ Erro no script JSONP:", error);
      delete window[callbackName];
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      reject(new Error("Erro na requisição JSONP - Script não carregou"));
    };

    script.onload = () => {
      console.log("📄 Script JSONP carregado com sucesso");
      // Se chegou aqui mas o callback não foi chamado em 2 segundos, algo deu errado
      setTimeout(() => {
        if (window[callbackName]) {
          console.warn("⚠️ Script carregou mas callback não foi executado");
          delete window[callbackName];
          if (document.head.contains(script)) {
            document.head.removeChild(script);
          }
          reject(new Error("Callback JSONP não foi executado"));
        }
      }, 2000);
    };

    // Timeout de 15 segundos
    setTimeout(() => {
      if (window[callbackName]) {
        console.error("⏰ Timeout na requisição JSONP");
        delete window[callbackName];
        if (document.head.contains(script)) {
          document.head.removeChild(script);
        }
        reject(new Error("Timeout na requisição JSONP"));
      }
    }, 15000);

    // Adicionar ao DOM para executar
    document.head.appendChild(script);
  });
}

// === FUNÇÃO UNIVERSAL PARA REQUISIÇÕES (CORS-SAFE) ===
async function enviarRequisicao(dados, tentarFetch = true) {
  console.log("🚀 Iniciando envio de requisição:", dados);

  // Para localhost, usar estratégia específica baseada na action
  if (IS_LOCAL) {
    console.log("🏠 Localhost detectado, usando estratégia otimizada...");

    // Para ações específicas que requerem POST, tentar JSONP primeiro
    if (dados.action === "atualizarNotaEspecifica") {
      console.log("📝 Action específica detectada, usando JSONP...");
      try {
        return await enviarViaJSONP(dados);
      } catch (jsonpError) {
        console.log(
          "❌ JSONP falhou, tentando GET com parâmetros...",
          jsonpError
        );

        // Fallback: tentar GET mesmo sabendo que pode não funcionar
        const params = new URLSearchParams(dados);
        const url = `${WEB_APP_URL}?${params.toString()}`;
        console.log("🔗 URL GET fallback:", url);

        const response = await fetch(url, {
          method: "GET",
          mode: "no-cors",
        });

        return {
          success: false,
          message: "Action requer POST - usando GET como fallback",
          data: dados,
          error: "Esta action precisa ser adicionada ao doGet do Apps Script",
        };
      }
    }

    // Para outras actions, usar GET normal
    try {
      console.log("1️⃣ Tentando GET request...");
      const params = new URLSearchParams(dados);
      const url = `${WEB_APP_URL}?${params.toString()}`;
      console.log("🔗 URL GET:", url);

      const response = await fetch(url, {
        method: "GET",
        mode: "no-cors",
      });

      console.log("📡 Response recebido:", response);

      // Com no-cors, não conseguimos ler o response diretamente
      console.log("✅ Requisição GET enviada com sucesso");

      return {
        success: true,
        message: "Requisição enviada com sucesso (modo no-cors)",
        data: dados,
      };
    } catch (error) {
      console.log("❌ GET falhou:", error);
      throw error;
    }
  }

  // Em produção, tentar fetch primeiro se solicitado
  if (tentarFetch) {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dados),
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.log("🔄 Fetch falhou, tentando GET como fallback...", error);
      const params = new URLSearchParams(dados);
      const url = `${WEB_APP_URL}?${params.toString()}`;
      const response = await fetch(url, { method: "GET", mode: "no-cors" });
      return { success: true, message: "Requisição enviada via GET fallback" };
    }
  }

  // Usar GET como método principal para maior compatibilidade
  const params = new URLSearchParams(dados);
  const url = `${WEB_APP_URL}?${params.toString()}`;
  const response = await fetch(url, { method: "GET", mode: "no-cors" });
  return { success: true, message: "Requisição enviada via GET" };
}

// === FUNÇÃO PARA ATUALIZAR A MÉDIA NO CARD COM DADOS JÁ CALCULADOS ===
function atualizarMediaNoCardComDados(studentId, dadosMedia) {
  try {
    console.log(`📊 Atualizando média no card ${studentId}:`, dadosMedia);

    // Atualizar elementos da média no card
    const mediaElement = document.querySelector(
      `[data-student-id="${studentId}"] .media-value`
    );
    const situacaoElement = document.querySelector(
      `[data-student-id="${studentId}"] .situacao`
    );

    if (mediaElement && dadosMedia.media) {
      // Adicionar animação de atualização
      mediaElement.classList.add("atualizando");

      // Atualizar o valor após um pequeno delay para mostrar a animação
      setTimeout(() => {
        mediaElement.textContent = dadosMedia.media;
        mediaElement.classList.remove("atualizando");
      }, 150);

      console.log(`✅ Média atualizada para: ${dadosMedia.media}`);
    }

    if (situacaoElement && dadosMedia.situacao) {
      // Remover classes anteriores de situação
      situacaoElement.classList.remove(
        "situacao-aprovado",
        "situacao-recuperacao",
        "situacao-retido"
      );

      // Atualizar texto e classe
      situacaoElement.textContent = dadosMedia.situacao;
      const novaClasse = obterClasseSituacao(dadosMedia.situacao);
      if (novaClasse) {
        situacaoElement.classList.add(novaClasse);
      }

      console.log(`✅ Situação atualizada para: ${dadosMedia.situacao}`);
    }

    // Também atualizar a barra de progresso se existir
    const progressElement = document.querySelector(
      `[data-student-id="${studentId}"] .progress-bar`
    );

    if (progressElement && dadosMedia.media) {
      const mediaNum = parseFloat(dadosMedia.media);
      const progressPercent = Math.min((mediaNum / 10) * 100, 100);

      // Remover classes anteriores de progresso
      progressElement.classList.remove(
        "progress-aprovado",
        "progress-recuperacao",
        "progress-retido",
        "progress-default"
      );

      // Atualizar largura da barra
      progressElement.style.width = `${progressPercent}%`;

      // Atualizar cor da barra baseada na situação
      const classeProgresso = obterClasseProgressoSituacao(dadosMedia.situacao);
      progressElement.classList.add(classeProgresso);

      console.log(`✅ Barra de progresso atualizada: ${progressPercent}%`);
    }

    // Feedback visual no card inteiro
    const cardElement = document.querySelector(
      `[data-student-id="${studentId}"]`
    );
    if (cardElement) {
      cardElement.style.transform = "scale(1.02)";
      cardElement.style.boxShadow =
        "0 8px 25px rgba(var(--color-primary-rgb), 0.15)";

      setTimeout(() => {
        cardElement.style.transform = "";
        cardElement.style.boxShadow = "";
      }, 300);
    }

    console.log(`✅ Card ${studentId} atualizado com sucesso!`);
  } catch (error) {
    console.error(`❌ Erro ao atualizar card ${studentId}:`, error);
  }
}

// === FUNÇÃO AUXILIAR PARA OBTER CLASSE CSS DA SITUAÇÃO ===
function obterClasseSituacao(situacao) {
  if (!situacao) return "";

  const situacaoLower = situacao.toLowerCase();
  if (situacaoLower.includes("aprovado")) return "situacao-aprovado";
  if (situacaoLower.includes("reprovado")) return "situacao-reprovado";
  if (situacaoLower.includes("em curso")) return "situacao-em-curso";
  if (situacaoLower.includes("retido")) return "situacao-retido";

  return "";
}

// === FUNÇÃO AUXILIAR PARA OBTER CLASSE CSS DA BARRA DE PROGRESSO ===
function obterClasseProgressoSituacao(situacao) {
  if (!situacao) return "progress-default";

  const situacaoLower = situacao.toLowerCase();
  if (situacaoLower.includes("aprovado")) return "progress-aprovado";
  if (situacaoLower.includes("reprovado")) return "progress-reprovado";
  if (situacaoLower.includes("em curso")) return "progress-em-curso";
  if (situacaoLower.includes("retido")) return "progress-retido";

  return "progress-default";
}

// === FUNÇÃO PARA ATUALIZAR A MÉDIA NO CARD APÓS MUDANÇA DE NOTA ===
async function atualizarMediaNoCard(studentId) {
  try {
    // Buscar dados atualizados do aluno
    const response = await fetch(
      `${API_URL}?nomeAluno=${encodeURIComponent(studentId)}`
    );
    const data = await response.json();

    if (data.saida && data.saida.length > 0) {
      const alunoAtualizado = data.saida.find((a) => a.ID_Unico === studentId);
      if (alunoAtualizado) {
        // Recalcular média
        const calculado = calcularMediaESituacao(alunoAtualizado);

        // Atualizar elementos da média no card
        const mediaElement = document.querySelector(
          `[data-student-id="${studentId}"] .media-value`
        );
        const situacaoElement = document.querySelector(
          `[data-student-id="${studentId}"] .situacao`
        );

        if (mediaElement) {
          mediaElement.textContent = calculado.media;
        }

        if (situacaoElement) {
          situacaoElement.textContent = calculado.situacao;
          situacaoElement.className = `situacao ${obterClasseSituacao(
            calculado.situacao
          )}`;
        }

        console.log(
          `✅ Média atualizada no card ${studentId}: ${calculado.media}`
        );
      }
    }
  } catch (error) {
    console.error("Erro ao atualizar média no card:", error);
  }
}

// Tornar a função global para onClick
window.selectAutocompleteItem = selectAutocompleteItem;
window.updateGrade = updateGrade;

// === FUNÇÃO DE TESTE PARA ATUALIZAÇÃO DE NOTAS ===
async function testarAtualizacaoNota() {
  console.log("🧪 === TESTANDO ATUALIZAÇÃO DE NOTA ===");

  try {
    // Dados de teste
    const dadosTeste = {
      action: "atualizarNotaEspecifica",
      alunoId: "TESTE_ID",
      campo: "Nota1",
      valor: 8.5,
      professor: "Professor Teste",
      disciplina: "curso",
      bimestre: 1,
    };

    console.log("📝 Dados de teste:", dadosTeste);

    // Testar diferentes métodos
    console.log("1️⃣ Testando GET request...");
    try {
      const params = new URLSearchParams(dadosTeste);
      const url = `${WEB_APP_URL}?${params.toString()}`;
      console.log("🔗 URL de teste:", url);

      const response = await fetch(url, { method: "GET", mode: "cors" });
      const resultado = await response.json();
      console.log("✅ GET funcionou:", resultado);
      return resultado;
    } catch (error) {
      console.error("❌ GET falhou:", error);
    }

    console.log("2️⃣ Testando JSONP...");
    try {
      const resultado = await enviarViaJSONP(dadosTeste);
      console.log("✅ JSONP funcionou:", resultado);
      return resultado;
    } catch (error) {
      console.error("❌ JSONP falhou:", error);
    }

    console.log("❌ Todos os métodos falharam");
    return { success: false, error: "Todos os métodos de requisição falharam" };
  } catch (error) {
    console.error("❌ Erro no teste:", error);
    return { success: false, error: error.message };
  }
}

// Disponibilizar função de teste globalmente
window.testarAtualizacaoNota = testarAtualizacaoNota;

// === FUNÇÃO DE TESTE ESPECÍFICA PARA VERIFICAR APPS SCRIPT ===
async function verificarAppsScript() {
  console.log("🔍 === VERIFICANDO GOOGLE APPS SCRIPT ===");

  try {
    // Teste 1: Verificar se o Apps Script responde
    console.log("1️⃣ Testando conectividade básica...");
    const testeBasico = await fetch(`${WEB_APP_URL}?teste=1`, {
      method: "GET",
      mode: "cors",
    });

    const resultadoBasico = await testeBasico.json();
    console.log("✅ Apps Script responde:", resultadoBasico);

    // Teste 2: Verificar se suporta a action de atualização de nota
    console.log("2️⃣ Testando action atualizarNotaEspecifica...");
    const testeAction = await fetch(
      `${WEB_APP_URL}?action=atualizarNotaEspecifica&alunoId=TESTE&campo=Nota1&valor=5&teste=true`,
      {
        method: "GET",
        mode: "cors",
      }
    );

    const resultadoAction = await testeAction.json();
    console.log("📊 Resultado da action:", resultadoAction);

    // Teste 3: Verificar parâmetros completos
    console.log("3️⃣ Testando com parâmetros completos...");
    const params = new URLSearchParams({
      action: "atualizarNotaEspecifica",
      alunoId: "TESTE_COMPLETO",
      campo: "MundoTrabalho1",
      valor: 7.5,
      professor: "Professor Teste",
      disciplina: "mundoTrabalho",
      bimestre: 1,
      teste: true,
    });

    const testeCompleto = await fetch(`${WEB_APP_URL}?${params.toString()}`, {
      method: "GET",
      mode: "cors",
    });

    const resultadoCompleto = await testeCompleto.json();
    console.log("🎯 Resultado completo:", resultadoCompleto);

    return {
      success: true,
      testeBasico: resultadoBasico,
      testeAction: resultadoAction,
      testeCompleto: resultadoCompleto,
    };
  } catch (error) {
    console.error("❌ Erro na verificação:", error);
    return { success: false, error: error.message };
  }
}

// Disponibilizar função de verificação globalmente
window.verificarAppsScript = verificarAppsScript;

// === FUNÇÃO PARA TESTAR ATUALIZAÇÃO REAL DE NOTA ===
async function testarAtualizacaoReal(alunoId, disciplina, bimestre, nota) {
  console.log("🧪 === TESTANDO ATUALIZAÇÃO REAL DE NOTA ===");
  console.log(
    `📋 Parâmetros: Aluno=${alunoId}, Disciplina=${disciplina}, Bimestre=${bimestre}, Nota=${nota}`
  );

  try {
    // Primeiro, buscar o aluno para ver o estado atual
    console.log("1️⃣ Buscando estado atual do aluno...");
    const responseBusca = await fetch(
      `${WEB_APP_URL}?nomeAluno=${encodeURIComponent(alunoId)}`
    );
    const dadosBusca = await responseBusca.json();

    if (dadosBusca.saida && dadosBusca.saida.length > 0) {
      const alunoAntes = dadosBusca.saida.find((a) => a.ID_Unico === alunoId);
      if (alunoAntes) {
        console.log("📊 Estado atual do aluno:", alunoAntes);

        // Determinar campo correto
        let campo;
        switch (disciplina) {
          case "curso":
            campo = `Nota${bimestre}`;
            break;
          case "mundoTrabalho":
            campo = `MundoTrabalho${bimestre}`;
            break;
          case "convivio":
            campo = `Convivio${bimestre}`;
            break;
          default:
            throw new Error("Disciplina não reconhecida");
        }

        console.log(`📝 Campo a ser atualizado: ${campo}`);
        console.log(`🔍 Valor atual: ${alunoAntes[campo] || "não definido"}`);

        // Enviar atualização
        console.log("2️⃣ Enviando atualização...");
        const dadosAtualizacao = {
          action: "atualizarNotaEspecifica",
          alunoId: alunoId,
          campo: campo,
          valor: nota,
          professor: "Teste Manual",
          disciplina: disciplina,
          bimestre: bimestre,
        };

        const params = new URLSearchParams(dadosAtualizacao);
        const urlAtualizacao = `${WEB_APP_URL}?${params.toString()}`;
        console.log("🔗 URL de atualização:", urlAtualizacao);

        const responseAtualizacao = await fetch(urlAtualizacao, {
          method: "GET",
          mode: "cors",
        });

        const resultadoAtualizacao = await responseAtualizacao.json();
        console.log("📊 Resultado da atualização:", resultadoAtualizacao);

        // Aguardar e verificar o resultado
        console.log("3️⃣ Aguardando e verificando resultado...");
        await new Promise((resolve) => setTimeout(resolve, 3000)); // Aguardar 3 segundos

        const responseVerificacao = await fetch(
          `${WEB_APP_URL}?nomeAluno=${encodeURIComponent(alunoId)}`
        );
        const dadosVerificacao = await responseVerificacao.json();

        if (dadosVerificacao.saida && dadosVerificacao.saida.length > 0) {
          const alunoDepois = dadosVerificacao.saida.find(
            (a) => a.ID_Unico === alunoId
          );
          if (alunoDepois) {
            console.log("📊 Estado após atualização:", alunoDepois);
            console.log(
              `🔍 Valor após atualização: ${
                alunoDepois[campo] || "não definido"
              }`
            );

            const valorAntes = parseFloat(alunoAntes[campo]) || 0;
            const valorDepois = parseFloat(alunoDepois[campo]) || 0;
            const valorEsperado = parseFloat(nota);

            const foiAtualizado = Math.abs(valorDepois - valorEsperado) < 0.01;

            console.log(`📈 Comparação:`);
            console.log(`   Antes: ${valorAntes}`);
            console.log(`   Esperado: ${valorEsperado}`);
            console.log(`   Depois: ${valorDepois}`);
            console.log(
              `   Foi atualizado: ${foiAtualizado ? "✅ SIM" : "❌ NÃO"}`
            );

            return {
              success: foiAtualizado,
              valorAntes,
              valorDepois,
              valorEsperado,
              campo,
              resultadoAtualizacao,
            };
          }
        }

        throw new Error(
          "Não foi possível verificar o resultado da atualização"
        );
      }
    }

    throw new Error("Aluno não encontrado");
  } catch (error) {
    console.error("❌ Erro no teste:", error);
    return { success: false, error: error.message };
  }
}

// Disponibilizar função de teste real globalmente
window.testarAtualizacaoReal = testarAtualizacaoReal;

// === FUNÇÃO DE TESTE CORS ===
async function testarCORS() {
  console.log("🧪 Testando conectividade CORS...");

  try {
    // Teste 1: Requisição GET simples
    console.log("1️⃣ Testando GET...");
    const responseGet = await fetch(`${API_URL}?teste=1`);
    const dataGet = await responseGet.json();
    console.log("✅ GET funcionou:", dataGet);

    // Teste 2: Requisição POST simples
    console.log("2️⃣ Testando POST...");
    const responsePost = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "testarConectividade",
        timestamp: new Date().toISOString(),
      }),
    });
    const dataPost = await responsePost.json();
    console.log("✅ POST funcionou:", dataPost);

    console.log("🎉 CORS está funcionando corretamente!");
    return true;
  } catch (error) {
    console.error("❌ Erro CORS:", error);
    console.log("🔧 Possíveis soluções:");
    console.log(
      "1. Republique o App Script com permissões 'Anyone can access'"
    );
    console.log("2. Use HTTPS em vez de HTTP");
    console.log(
      "3. Abra o HTML diretamente (file://) em vez de servidor local"
    );
    return false;
  }
}

// Tornar função global para teste manual
window.testarCORS = testarCORS;

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

    cursoFilter.innerHTML = '<option value="">Tarde e Noite</option>';
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
    const hoje = getLocalDateString();
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
      ? "F"
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

    // ✅ NOVO: Registrar também na aba "Presenças" para qualquer status (P ou F)
    try {
      const dataFormatada = formatarDataBrasileira(data);
      const horarioAtual = formatarHorarioBrasileiro(new Date());

      const professorAtual = currentUser?.username || "Sistema";

      console.log("📝 Registrando presença online na aba Presenças:", {
        nome: aluno.Nome,
        data: dataFormatada,
        horario: horarioAtual,
        curso: cursoAluno,
        professor: professorAtual,
        status: status,
      });

      // Registrar na aba Presenças
      const resultadoRegistro =
        await onlineAttendanceManager.registrarPresencaOnline(
          aluno.Nome,
          dataFormatada,
          horarioAtual,
          cursoAluno,
          professorAtual,
          status
        );

      const acaoTexto = resultadoRegistro.atualizado
        ? "atualizada"
        : "registrada";
      console.log(`✅ Presença ${acaoTexto} na aba Presenças com sucesso!`);
    } catch (error) {
      console.warn(
        "⚠️ Erro ao registrar na aba Presenças (continuando normalmente):",
        error
      );
    }

    // ✅ OTIMIZAÇÃO: Salvar na planilha via API APENAS NO CURSO ESPECÍFICO
    const params = new URLSearchParams({
      action: "registrarPresencaAutomatica",
      alunoId: alunoId,
      data: data,
      status: status,
      professor: currentUser?.username || "system",
      curso: cursoAluno, // ✅ Especificar curso para processar apenas essa aba/coluna
      marcarTodos: "false", // ✅ CORREÇÃO: Usar false como nos cards que funcionam corretamente
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

    // Atualizar interface imediatamente
    cacheManager.clearAttendance();
    attendanceManager.clearAllRecords(); // Limpar cache local de presença
    await carregarTodosAlunos(true);

    // Fechar modal após delay menor
    setTimeout(() => {
      fecharModalRegistro();
    }, 1500);
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

// Função para obter data atual no formato YYYY-MM-DD respeitando o fuso horário local
function getLocalDateString(date = null) {
  const now = date || new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Função para buscar status de presença dos dados do servidor
function getServerAttendanceStatus(student, targetDate) {
  if (!student || typeof student !== "object") return null;

  // Formatar data em diferentes formatos para buscar
  const dateFormats = [
    targetDate.toLocaleDateString("pt-BR"), // DD/MM/YYYY
    targetDate.toISOString().split("T")[0], // YYYY-MM-DD
    targetDate.getDate().toString().padStart(2, "0") +
      "/" +
      (targetDate.getMonth() + 1).toString().padStart(2, "0"), // DD/MM
    targetDate.getDate().toString(), // D
    `${targetDate.getDate()}/${
      targetDate.getMonth() + 1
    }/${targetDate.getFullYear()}`, // D/M/YYYY
  ];

  // Procurar em todas as propriedades do aluno
  for (const [key, value] of Object.entries(student)) {
    // Verificar se a chave contém algum formato de data
    for (const dateFormat of dateFormats) {
      if (key.includes(dateFormat)) {
        const status = value && value.toString().trim().toUpperCase();
        if (status && ["P", "F", "A"].includes(status)) {
          console.log(
            `📅 Status encontrado nos dados do servidor: ${key} = ${status}`
          );
          return status;
        }
      }
    }
  }

  return null;
}

function calcularMediaESituacao(aluno) {
  const nota1 = parseFloat(String(aluno.Nota1 || 0).replace(",", ".")) || 0;
  const nota2 = parseFloat(String(aluno.Nota2 || 0).replace(",", ".")) || 0;
  const nota3 = parseFloat(String(aluno.Nota3 || 0).replace(",", ".")) || 0;

  // Padrões para buscar colunas de Mundo do Trabalho
  const padroesMT1 = [
    "MundoTrabalho1", // Campo direto do App Script
    "MundoTrabalho_1Bim",
    "Mundo do Trabalho - 1º Bim",
    "MundoTrabalho1Bim",
    "Mundo_Trabalho_1Bim",
    "MT_1Bim",
    "MT1",
    "Mundo Trabalho 1",
    "MT 1º Bim",
  ];
  const padroesMT2 = [
    "MundoTrabalho2", // Campo direto do App Script
    "MundoTrabalho_2Bim",
    "Mundo do Trabalho - 2º Bim",
    "MundoTrabalho2Bim",
    "Mundo_Trabalho_2Bim",
    "MT_2Bim",
    "MT2",
    "Mundo Trabalho 2",
    "MT 2º Bim",
  ];
  const padroesMT3 = [
    "MundoTrabalho3", // Campo direto do App Script
    "MundoTrabalho_3Bim",
    "Mundo do Trabalho - 3º Bim",
    "MundoTrabalho3Bim",
    "Mundo_Trabalho_3Bim",
    "MT_3Bim",
    "MT3",
    "Mundo Trabalho 3",
    "MT 3º Bim",
  ];

  // Padrões para buscar colunas de Convívio
  const padroesConv1 = [
    "Convivio1", // Campo direto do App Script
    "Convivio_1Bim",
    "Convívio - 1º Bim",
    "Convivio1Bim",
    "Conv_1Bim",
    "Conv1",
    "Convivio 1",
    "Convívio 1º Bim",
  ];
  const padroesConv2 = [
    "Convivio2", // Campo direto do App Script
    "Convivio_2Bim",
    "Convívio - 2º Bim",
    "Convivio2Bim",
    "Conv_2Bim",
    "Conv2",
    "Convivio 2",
    "Convívio 2º Bim",
  ];
  const padroesConv3 = [
    "Convivio3", // Campo direto do App Script
    "Convivio_3Bim",
    "Convívio - 3º Bim",
    "Convivio3Bim",
    "Conv_3Bim",
    "Conv3",
    "Convivio 3",
    "Convívio 3º Bim",
  ];

  // Buscar notas do Mundo do Trabalho
  const mundoTrabalho1 =
    parseFloat(
      String(buscarColuna(aluno, padroesMT1) || 0).replace(",", ".")
    ) || 0;
  const mundoTrabalho2 =
    parseFloat(
      String(buscarColuna(aluno, padroesMT2) || 0).replace(",", ".")
    ) || 0;
  const mundoTrabalho3 =
    parseFloat(
      String(buscarColuna(aluno, padroesMT3) || 0).replace(",", ".")
    ) || 0;

  // Buscar notas do Convívio
  const convivio1 =
    parseFloat(
      String(buscarColuna(aluno, padroesConv1) || 0).replace(",", ".")
    ) || 0;
  const convivio2 =
    parseFloat(
      String(buscarColuna(aluno, padroesConv2) || 0).replace(",", ".")
    ) || 0;
  const convivio3 =
    parseFloat(
      String(buscarColuna(aluno, padroesConv3) || 0).replace(",", ".")
    ) || 0;

  // Todas as notas disponíveis (incluindo zeros para cálculo correto da média)
  const todasAsNotas = [
    nota1,
    nota2,
    nota3,
    mundoTrabalho1,
    mundoTrabalho2,
    mundoTrabalho3,
    convivio1,
    convivio2,
    convivio3,
  ];

  // Usar faltas diretamente da planilha (que já inclui o sistema automático)
  const totalFaltas = parseInt(aluno.Faltas) || 0;

  // Usar média da tabela se disponível, senão calcular com todas as 9 notas
  let media;
  if (aluno.Media !== undefined && aluno.Media !== null && aluno.Media !== "") {
    media = parseFloat(String(aluno.Media).replace(",", ".")) || 0;
  } else {
    // Calcular média considerando todas as 9 disciplinas (incluindo zeros)
    media = todasAsNotas.reduce((a, b) => a + b) / todasAsNotas.length;
  }

  console.log(`📊 Média calculada para ${aluno.Nome}:`, {
    mediaTabela: aluno.Media,
    mediaCalculada: media.toFixed(2),
    notasCurso: [nota1, nota2, nota3],
    notasMundoTrabalho: [mundoTrabalho1, mundoTrabalho2, mundoTrabalho3],
    notasConvivio: [convivio1, convivio2, convivio3],
    totalDisciplinas: todasAsNotas.length,
    somaNotas: todasAsNotas.reduce((a, b) => a + b),
    todasAsNotas: todasAsNotas,
    observacao:
      "Média calculada considerando todas as 9 disciplinas (incluindo zeros)",
  });

  // Verificar se tem pelo menos uma nota lançada
  const temNotasLancadas = todasAsNotas.some((nota) => nota > 0);

  // Se não tem notas lançadas e não tem faltas, está em curso
  if (!temNotasLancadas && totalFaltas === 0) {
    return {
      media: 0,
      situacao: "Em Curso",
      faltas: totalFaltas,
    };
  }

  // Determinar situação baseada nos critérios:
  // - Reprovado: faltas > 15 OU média < 6.0
  // - Aprovado: média >= 6.0 E faltas <= 15
  // - Em Curso: demais casos (ainda cursando)
  
  let situacao;
  if (totalFaltas > 15) {
    situacao = "Reprovado";
  } else if (media >= 6.0 && totalFaltas <= 15) {
    situacao = "Aprovado";
  } else if (media < 6.0 && temNotasLancadas) {
    situacao = "Reprovado";
  } else {
    situacao = "Em Curso";
  }

  return {
    media: typeof media === "number" ? media.toFixed(1) : media,
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
  if (situacaoLower.includes("em curso")) return "situacao-em-curso";

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
  // Bloquear alterações para administradores
  if (currentUser.role === "admin") {
    checkbox.checked = false;
    mostrarToast(
      "Administradores não podem marcar presença",
      "error",
      "Acesso Negado"
    );
    return;
  }

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
    batchAttendanceData.set(alunoId, type === "present" ? "P" : "F"); // ✅ CORREÇÃO: Usar "F" para falta em vez de "A"
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

  // Ocultar controles em lote para administradores
  if (currentUser.role === "admin") {
    batchControls.classList.add("hidden");
    return;
  }

  if (count > 0) {
    batchControls.classList.remove("hidden");
    selectedCount.textContent = count;
    confirmBtn.disabled = false;

    // Definir data padrão como hoje
    const batchDate = domCache.get("batchDate");
    if (!batchDate.value) {
      batchDate.value = getLocalDateString();
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
        // ✅ NOVO: Registrar também na aba "Presenças" para histórico online
        try {
          console.log("📝 Registrando lote na aba Presenças...");
          await registrarLotePresencaOnline(registrosPorCurso, batchDate);
        } catch (presencaOnlineError) {
          console.warn(
            "⚠️ Erro ao registrar lote na aba Presenças (não crítico):",
            presencaOnlineError
          );
        }

        mostrarSucesso(
          `${totalProcessados} presenças registradas com sucesso! Processamento por curso.`,
          "Registro Concluído"
        );

        // ✅ NOVO: Atualizar seção de últimos registros
        setTimeout(() => {
          if (document.getElementById("ultimosRegistros")) {
            onlineAttendanceManager.exibirUltimosRegistros();
          }
        }, 1000);
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
  const controlsDiv = document.getElementById(
    `attendanceControls-${studentId}`
  );

  if (checkbox.checked) {
    controlsDiv.classList.remove("hidden");
    // Animar a entrada dos controles
    controlsDiv.style.animation = "slideDown 0.3s ease-out";
  } else {
    controlsDiv.classList.add("hidden");
  }
}

async function registrarPresencaCard(studentId) {
  // Bloquear registro para administradores
  if (currentUser.role === "admin") {
    mostrarToast(
      "Administradores não podem registrar presença",
      "error",
      "Acesso Negado"
    );
    return;
  }

  const checkbox = document.getElementById(`attendanceCheck-${studentId}`);
  const dateInput = document.getElementById(`attendanceDate-${studentId}`);
  const statusRadios = document.querySelectorAll(
    `input[name="status-${studentId}"]:checked`
  );
  const registerBtn = document.querySelector(
    `button[onclick="registrarPresencaCard('${studentId}')"]`
  );

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
    registerBtn.innerHTML =
      '<div class="loading-spinner-small"></div> Registrando...';
    registerBtn.disabled = true;

    // Mostrar loading específico do card
    mostrarLoadingCard(studentId, `Registrando presença...`);

    const currentUser = AuthSystem.getCurrentUser();
    if (!currentUser) {
      throw new Error("Usuário não autenticado");
    }

    const registro = {
      alunoId: studentId,
      data: selectedDate,
      status: selectedStatus,
      professor: currentUser.name,
      curso: studentCourse,
    };

    console.log("📝 Registrando presença via card:", registro);

    atualizarMensagemLoadingCard(studentId, "Enviando dados...");

    // Usar o mesmo sistema de processamento do sistema principal
    let success = false;
    let timeoutOccurred = false;

    try {
      success = await smartProcessor.processWithCache(registro);
    } catch (timeoutError) {
      if (timeoutError.message && timeoutError.message.includes("Timeout")) {
        timeoutOccurred = true;
        console.log(
          "⚠️ Timeout detectado, mas presença pode ter sido registrada"
        );

        // Registrar o último acesso mesmo com timeout (provável sucesso)
        lastAttendanceTracker.recordAttendance(
          studentId,
          selectedDate,
          selectedStatus,
          currentUser.name
        );

        // Mesmo com timeout, mostrar mensagem informativa
        const statusText =
          selectedStatus === "P"
            ? "Presente"
            : selectedStatus === "F"
            ? "Falta"
            : "Ausente";
        mostrarAvisoCard(
          studentId,
          `A requisição demorou mais que o esperado, mas a presença pode ter sido registrada.\n\nData: ${new Date(
            selectedDate
          ).toLocaleDateString(
            "pt-BR"
          )}\nStatus: ${statusText}\n\nVerifique o sistema para confirmar.`,
          "Timeout - Verifique o Registro"
        );

        // Resetar o formulário mesmo com timeout
        checkbox.checked = false;
        document
          .getElementById(`attendanceControls-${studentId}`)
          .classList.add("hidden");

        // Atualizar a exibição do card
        setTimeout(() => {
          const cardElement = document.querySelector(
            `input[data-student-id="${studentId}"]`
          );
          if (cardElement) {
            const studentCard = cardElement.closest(".student-card");
            if (studentCard) {
              const alunoData = allStudentsRawData.find(
                (a) => a.ID_Unico === studentId
              );
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

        // Remover loading do card e resetar botão no caso de timeout
        removerLoadingCard(studentId);
        registerBtn.innerHTML = originalText;
        registerBtn.disabled = false;

        return; // Sair da função sem lançar erro
      } else {
        throw timeoutError; // Re-lançar se não for timeout
      }
    }

    if (success) {
      const statusText =
        selectedStatus === "P"
          ? "Presente"
          : selectedStatus === "F"
          ? "Falta"
          : "Ausente";

      // Registrar o último acesso do aluno
      lastAttendanceTracker.recordAttendance(
        studentId,
        selectedDate,
        selectedStatus,
        currentUser.name
      );

      // ✅ NOVO: Registrar também na aba "Presenças" para qualquer status (P ou F)
      try {
        const dataFormatada = formatarDataBrasileira(selectedDate);
        const horarioAtual = formatarHorarioBrasileiro(new Date());

        console.log("📝 Registrando presença do card na aba Presenças:", {
          nome: studentName,
          data: dataFormatada,
          horario: horarioAtual,
          curso: studentCourse,
          professor: currentUser.name,
          status: selectedStatus,
        });

        // Registrar na aba Presenças
        const resultadoRegistro =
          await onlineAttendanceManager.registrarPresencaOnline(
            studentName,
            dataFormatada,
            horarioAtual,
            studentCourse,
            currentUser.name,
            selectedStatus
          );

        // ✅ OTIMIZAÇÃO: Atualizar cache e frontend imediatamente
        const novoRegistro = {
          data: dataFormatada,
          horario: horarioAtual,
          curso: studentCourse,
          professor: currentUser.name,
          status: selectedStatus,
          displayTime: `${dataFormatada} às ${horarioAtual}`,
          timestamp: Date.now(),
        };

        // Atualizar cache local
        statusCache.setStatus(studentName, novoRegistro);

        // Atualizar card imediatamente
        atualizarCardImediatamente(studentId, novoRegistro);

        const acaoTexto = resultadoRegistro.atualizado
          ? "atualizada"
          : "registrada";
        console.log(
          `✅ Presença do card ${acaoTexto} na aba Presenças com sucesso!`
        );
      } catch (error) {
        console.warn(
          "⚠️ Erro ao registrar presença do card na aba Presenças (continuando normalmente):",
          error
        );
      }

      mostrarSucessoCard(
        studentId,
        `Aluno: ${studentName}\nData: ${new Date(
          selectedDate
        ).toLocaleDateString("pt-BR")}\nStatus: ${statusText}`,
        "Presença Registrada"
      );

      // Resetar o formulário
      checkbox.checked = false;
      document
        .getElementById(`attendanceControls-${studentId}`)
        .classList.add("hidden");

      // ✅ OTIMIZAÇÃO: Limpar apenas o cache específico, não recarregar tudo
      cacheManager.clearAttendance();
      attendanceManager.clearAllRecords();
    } else {
      throw new Error("Falha ao registrar presença");
    }
  } catch (error) {
    console.error("❌ Erro ao registrar presença via card:", error);

    mostrarErroCard(
      studentId,
      `${error.message || "Erro desconhecido"}`,
      "Erro no Registro"
    );
  } finally {
    // Restaurar botão sempre, mesmo em caso de erro
    registerBtn.innerHTML = originalText;
    registerBtn.disabled = false;
    removerLoadingCard(studentId);
  }
}

/**
 * 📅 FUNÇÃO PARA MOSTRAR HISTÓRICO DE FALTAS DE UM ALUNO
 */
async function mostrarHistoricoFaltas(alunoId, nomeAluno) {
  console.log(
    `📅 Carregando histórico de faltas para ${nomeAluno} (${alunoId})`
  );

  try {
    // Mostrar loading
    mostrarLoadingOverlay("Carregando histórico de faltas...");

    const response = await fetch(
      `${API_URL}?action=obterHistoricoFaltas&alunoId=${encodeURIComponent(
        alunoId
      )}`
    );
    const data = await response.json();

    removerLoadingOverlay();

    if (!data.success) {
      throw new Error(data.error || "Erro ao carregar histórico");
    }

    const historico = data.historico;

    // Criar modal com histórico
    mostrarModalHistoricoFaltas(alunoId, nomeAluno, historico);
  } catch (error) {
    removerLoadingOverlay();
    console.error("❌ Erro ao carregar histórico de faltas:", error);
    alert("Erro ao carregar histórico de faltas: " + error.message);
  }
}

/**
 * 📅 FUNÇÃO PARA MOSTRAR MODAL COM HISTÓRICO DE FALTAS
 */
function mostrarModalHistoricoFaltas(alunoId, nomeAluno, historico) {
  // Remover modal existente se houver
  const modalExistente = document.getElementById("historicoFaltasModal");
  if (modalExistente) {
    modalExistente.remove();
  }

  // Criar lista de faltas detalhadas
  let faltasHTML = "";
  if (historico.faltasDetalhadas && historico.faltasDetalhadas.length > 0) {
    historico.faltasDetalhadas.forEach((falta) => {
      faltasHTML += `
        <div class="falta-item">
          <div class="falta-data">${falta.data}</div>
          <div class="falta-curso">${falta.curso}</div>
          <div class="falta-status">${falta.status}</div>
        </div>
      `;
    });
  } else {
    faltasHTML =
      '<div class="no-faltas">Nenhuma falta registrada nas colunas de datas</div>';
  }

  // Criar lista de registros de presença online
  let registrosHTML = "";
  if (historico.registrosPresenca && historico.registrosPresenca.length > 0) {
    historico.registrosPresenca.forEach((registro) => {
      const statusClass =
        registro.status === "Falta"
          ? "status-falta"
          : registro.status === "Presente"
          ? "status-presente"
          : "";
      registrosHTML += `
        <div class="registro-item ${statusClass}">
          <div class="registro-data">${registro.data} ${registro.horario}</div>
          <div class="registro-curso">${registro.curso}</div>
          <div class="registro-professor">${registro.professor}</div>
          <div class="registro-status">${registro.status}</div>
        </div>
      `;
    });
  } else {
    registrosHTML =
      '<div class="no-registros">Nenhum registro online encontrado</div>';
  }

  // Criar modal
  const modal = document.createElement("div");
  modal.id = "historicoFaltasModal";
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal-content historico-faltas-modal">
      <div class="modal-header">
        <h2>📅 Histórico de Faltas - ${nomeAluno}</h2>
        <button class="modal-close" onclick="fecharModalHistorico()">&times;</button>
      </div>
      
      <div class="modal-body">
        <div class="aluno-info">
          <h3>${historico.nomeAluno}</h3>
          <p><strong>Curso:</strong> ${historico.cursoAluno}</p>
          <p><strong>Total de Faltas:</strong> 
            <span class="total-faltas ${
              historico.totalFaltas > 15 ? "excesso" : ""
            }">${historico.totalFaltas}</span>
            ${historico.totalFaltas > 15 ? " ⚠️ (Excede o limite)" : ""}
          </p>
        </div>
        
        <div class="historico-sections">
          <div class="historico-section">
            <h4>📊 Faltas por Data (Planilha)</h4>
            <div class="faltas-lista">
              ${faltasHTML}
            </div>
          </div>
          
          <div class="historico-section">
            <h4>📝 Registros Online</h4>
            <div class="registros-lista">
              ${registrosHTML}
            </div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-secondary" onclick="fecharModalHistorico()">Fechar</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Mostrar modal com animação
  setTimeout(() => {
    modal.classList.add("show");
  }, 10);
}

/**
 * 📅 FUNÇÃO PARA FECHAR MODAL DE HISTÓRICO
 */
function fecharModalHistorico() {
  const modal = document.getElementById("historicoFaltasModal");
  if (modal) {
    modal.classList.remove("show");
    setTimeout(() => {
      modal.remove();
    }, 300);
  }
}

// === FUNÇÃO DE TESTE - ATUALIZAÇÃO VIA JSONP ===
async function testarAtualizacaoViaJSONP() {
  console.log("🧪 === TESTE: Atualização via JSONP (simulando POST) ===");

  const dadosTeste = {
    action: "atualizarNotaEspecifica",
    ra: "123456",
    disciplina: "curso",
    bimestre: "1_BIMESTRE",
    nota: "9.5",
  };

  try {
    console.log("📝 Dados do teste:", dadosTeste);

    const resultado = await enviarViaJSONP(dadosTeste);
    console.log("✅ Resultado via JSONP:", resultado);

    if (resultado && resultado.success) {
      console.log("🎉 Atualização via JSONP funcionou!");
      return resultado;
    } else {
      console.log("⚠️ JSONP retornou sem success");
      return resultado;
    }
  } catch (error) {
    console.error("❌ Erro no teste JSONP:", error);
    throw error;
  }
}

// === FUNÇÃO DE DIAGNÓSTICO SIMPLIFICADA ===
async function diagnosticarAppsScript() {
  console.log("🔍 === DIAGNÓSTICO DO APPS SCRIPT ===");

  try {
    // Teste 1: Conectividade básica
    console.log("1️⃣ Testando conectividade básica...");
    const response1 = await fetch(`${WEB_APP_URL}?teste=1`, {
      method: "GET",
      mode: "cors",
    });

    if (response1.ok) {
      const data1 = await response1.json();
      console.log("✅ Conectividade OK:", data1);
    } else {
      console.log("❌ Problema de conectividade");
      return;
    }

    // Teste 2: Verificar se action existe
    console.log("2️⃣ Testando se action atualizarNotaEspecifica existe...");
    const response2 = await fetch(
      `${WEB_APP_URL}?action=atualizarNotaEspecifica`,
      {
        method: "GET",
        mode: "cors",
      }
    );

    if (response2.ok) {
      const data2 = await response2.json();
      console.log("📋 Resposta da action:", data2);

      if (data2.message && data2.message.includes("Esta action requer POST")) {
        console.log("✅ Action existe no doGet!");

        // Teste 3: JSONP simples
        console.log("3️⃣ Testando JSONP...");
        await testarJSONPSimples();
      } else if (data2.error && data2.error.includes("Ação não reconhecida")) {
        console.log("❌ Action NÃO existe no doGet");
        console.log("💡 O Apps Script precisa ser atualizado ou reimplantado");
      } else {
        console.log("⚠️ Resposta inesperada:", data2);
      }
    } else {
      console.log("❌ Erro ao testar action");
    }
  } catch (error) {
    console.error("❌ Erro no diagnóstico:", error);
  }
}

// === TESTE JSONP SIMPLIFICADO ===
function testarJSONPSimples() {
  return new Promise((resolve, reject) => {
    const callbackName = `teste_${Date.now()}`;

    window[callbackName] = function (data) {
      console.log("✅ JSONP funcionou:", data);
      delete window[callbackName];
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      resolve(data);
    };

    const script = document.createElement("script");
    const params = new URLSearchParams({
      action: "atualizarNotaEspecifica",
      ra: "TESTE123",
      disciplina: "curso",
      bimestre: "1_BIMESTRE",
      nota: "7.5",
      callback: callbackName,
      _method: "POST",
    });

    script.src = `${WEB_APP_URL}?${params.toString()}`;
    console.log("🔗 URL JSONP teste:", script.src);

    script.onerror = function (error) {
      console.log("❌ JSONP falhou:", error);
      delete window[callbackName];
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      reject(error);
    };

    // Timeout
    setTimeout(() => {
      if (window[callbackName]) {
        console.log("⏰ JSONP timeout");
        delete window[callbackName];
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        reject(new Error("Timeout"));
      }
    }, 10000);

    document.head.appendChild(script);
  });
}

// Tornar as funções globais para uso no onclick
window.registrarPresencaCard = registrarPresencaCard;
window.abrirControlePresencas = abrirControlePresencas;
window.fecharControlePresencas = fecharControlePresencas;
window.atualizarCardImediatamente = atualizarCardImediatamente;
window.invalidarCacheSeNecessario = invalidarCacheSeNecessario;
window.removerNotificacaoCard = removerNotificacaoCard;
window.toggleCardFlip = toggleCardFlip;

// Tornar funções de teste globais
window.testarAtualizacaoNota = testarAtualizacaoNota;
window.verificarAppsScript = verificarAppsScript;
window.testarAtualizacaoReal = testarAtualizacaoReal;
window.testarAtualizacaoViaJSONP = testarAtualizacaoViaJSONP;
window.diagnosticarAppsScript = diagnosticarAppsScript;
window.testarJSONPSimples = testarJSONPSimples;
