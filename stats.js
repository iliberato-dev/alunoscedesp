// Sistema de Estatísticas CEDESP
class StatsSystem {
  constructor() {
    this.data = [];
    this.charts = {};
    this.init();
  }

  init() {
    // Verificar se é admin ou professor
    if (!this.checkStatsAccess()) {
      return;
    }

    this.setupEventListeners();
    this.loadData();
  }

  checkStatsAccess() {
    const currentUser = AuthSystem.getCurrentUser();

    if (!currentUser) {
      window.location.href = "login.html";
      return false;
    }

    if (currentUser.role !== "admin" && currentUser.role !== "professor") {
      alert(
        "Acesso negado. Apenas administradores e professores podem ver estatísticas."
      );
      window.location.href = "index.html";
      return false;
    }

    return true;
  }

  setupEventListeners() {
    document.getElementById("backToMain").addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  async loadData() {
    try {
      this.showLoading(true);

      // Usar a mesma API do sistema principal com ação específica para estatísticas
      const API_URL =
        "https://script.google.com/macros/s/AKfycbzNq3Hz1Pvlx3Ty4YGJvj0UM4jQNe2adOEQWyomzpTnBHooEzgHa1TGMWfcd8mpzTDe/exec";

      console.log("📊 Carregando dados de estatísticas...");
      const response = await fetch(`${API_URL}?action=obterEstatisticas`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Erro ao carregar estatísticas");
      }

      this.data = data.alunos || [];
      this.statistics = data.estatisticas || {};

      console.log("📊 Dados carregados:", this.data.length, "alunos");
      console.log("📈 Estatísticas:", this.statistics);

      console.log("🚀 Chamando generateStats...");
      this.generateStats();
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
      alert("Erro ao carregar dados: " + error.message);
    } finally {
      this.showLoading(false);
    }
  }

  generateStats() {
    console.log("📊 Iniciando geração de estatísticas...");
    this.updateSummaryCards();
    this.createCharts();
    this.generateDetailedTables();
    console.log("✅ Geração de estatísticas concluída");
  }

  updateSummaryCards() {
    console.log("🔄 Atualizando cards de resumo...");

    // Sempre usar cálculo local para garantir consistência com a lógica atual
    const stats = this.calculateBasicStats();
    console.log("📊 Estatísticas para cards:", stats);

    document.getElementById("totalStudents").textContent = stats.total;
    document.getElementById("approvedStudents").textContent = stats.approved;
    document.getElementById("inProgressStudents").textContent =
      stats.inProgress;
    document.getElementById("failedStudents").textContent = stats.failed;

    console.log("✅ Cards atualizados com sucesso");
  }

  calculateBasicStats() {
    const total = this.data.length;
    let approved = 0;
    let inProgress = 0;
    let failed = 0;

    console.log("📊 Calculando estatísticas básicas...");
    console.log("Total de alunos:", total);

    this.data.forEach((student) => {
      const situation = this.calculateStudentSituation(student);

      // Log temporário para debug
      if (
        student.Faltas > 15 ||
        (student.Media && parseFloat(student.Media) < 6.0)
      ) {
        console.log(`🔍 Aluno ${student.Nome}:`, {
          situacao: situation,
          faltas: student.Faltas,
          media: student.Media,
          situacaoOriginal: student.Situacao,
        });
      }

      switch (situation) {
        case "aprovado":
          approved++;
          break;
        case "em-curso":
          inProgress++;
          break;
        case "reprovado":
          failed++;
          break;
      }
    });

    console.log("Estatísticas calculadas:", {
      total,
      approved,
      inProgress,
      failed,
    });
    return { total, approved, inProgress, failed };
  }

  calculateStudentSituation(student) {
    // Se a situação já vem calculada do backend, usar ela
    if (student.Situacao) {
      const situacaoLower = student.Situacao.toLowerCase();
      if (situacaoLower === "aprovado") {
        return "aprovado";
      } else if (
        situacaoLower === "reprovado" ||
        situacaoLower === "reprovado por faltas"
      ) {
        return "reprovado";
      } else if (situacaoLower === "em curso") {
        return "em-curso";
      } else {
        return "em-curso";
      }
    }

    // Fallback para cálculo local usando a mesma lógica do sistema principal
    const nota1 = parseFloat(String(student.Nota1 || 0).replace(",", ".")) || 0;
    const nota2 = parseFloat(String(student.Nota2 || 0).replace(",", ".")) || 0;
    const nota3 = parseFloat(String(student.Nota3 || 0).replace(",", ".")) || 0;

    // Padrões para buscar colunas de Mundo do Trabalho
    const mundoTrabalho1 =
      parseFloat(String(student.MundoTrabalho1 || 0).replace(",", ".")) || 0;
    const mundoTrabalho2 =
      parseFloat(String(student.MundoTrabalho2 || 0).replace(",", ".")) || 0;
    const mundoTrabalho3 =
      parseFloat(String(student.MundoTrabalho3 || 0).replace(",", ".")) || 0;

    // Padrões para buscar colunas de Convívio
    const convivio1 =
      parseFloat(String(student.Convivio1 || 0).replace(",", ".")) || 0;
    const convivio2 =
      parseFloat(String(student.Convivio2 || 0).replace(",", ".")) || 0;
    const convivio3 =
      parseFloat(String(student.Convivio3 || 0).replace(",", ".")) || 0;

    const faltas = parseInt(student.Faltas) || 0;

    // Todas as notas (incluindo zeros para cálculo correto)
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

    // Verificar se tem pelo menos uma nota lançada
    const temNotasLancadas = todasAsNotas.some((nota) => nota > 0);

    // Usar média da tabela se disponível, senão calcular
    let media;
    if (
      student.Media !== undefined &&
      student.Media !== null &&
      student.Media !== ""
    ) {
      media = parseFloat(String(student.Media).replace(",", ".")) || 0;
    } else {
      // Calcular média considerando todas as 9 disciplinas
      media = todasAsNotas.reduce((a, b) => a + b) / todasAsNotas.length;
    }

    // Se não tem notas lançadas e não tem faltas, está em curso
    if (!temNotasLancadas && faltas === 0) {
      return "em-curso";
    }

    // Lógica de situação:
    // - Reprovado: faltas > 15 OU média < 6.0
    // - Aprovado: média >= 6.0 E faltas <= 15
    // - Em Curso: demais casos

    if (faltas > 15) {
      return "reprovado";
    } else if (media >= 6.0 && faltas <= 15) {
      return "aprovado";
    } else if (media < 6.0 && temNotasLancadas) {
      return "reprovado";
    } else {
      return "em-curso";
    }
  }

  createCharts() {
    this.createCoursesChart();
    this.createStatusChart();
    this.createPeriodsChart();
    this.createGradesChart();
  }

  createCoursesChart() {
    const coursesData = this.groupByCourse();
    const ctx = document.getElementById("coursesChart").getContext("2d");

    this.charts.courses = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: Object.keys(coursesData),
        datasets: [
          {
            data: Object.values(coursesData),
            backgroundColor: [
              "#f4c430",
              "#ffd700",
              "#1a2951",
              "#2d4785",
              "#28a745",
              "#ffc107",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#ffffff",
            },
          },
        },
      },
    });
  }

  createStatusChart() {
    const stats = this.calculateBasicStats();
    const ctx = document.getElementById("statusChart").getContext("2d");

    this.charts.status = new Chart(ctx, {
      type: "pie",
      data: {
        labels: ["Aprovados", "Em Curso", "Reprovados"],
        datasets: [
          {
            data: [stats.approved, stats.inProgress, stats.failed],
            backgroundColor: ["#28a745", "#ffc107", "#dc3545"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#ffffff",
            },
          },
        },
      },
    });
  }

  createPeriodsChart() {
    const periodsData = this.groupByPeriod();
    const ctx = document.getElementById("periodsChart").getContext("2d");

    this.charts.periods = new Chart(ctx, {
      type: "bar",
      data: {
        labels: Object.keys(periodsData),
        datasets: [
          {
            label: "Alunos por Período",
            data: Object.values(periodsData),
            backgroundColor: "#f4c430",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: "#ffffff",
            },
          },
        },
        scales: {
          y: {
            ticks: {
              color: "#ffffff",
            },
          },
          x: {
            ticks: {
              color: "#ffffff",
            },
          },
        },
      },
    });
  }

  createGradesChart() {
    const gradesData = this.groupByGrades();
    const ctx = document.getElementById("gradesChart").getContext("2d");

    // Ajustar labels baseado nos dados disponíveis
    let labels, data, colors;

    if (this.statistics && this.statistics.notasDistribuicao) {
      labels = [
        "Insuficiente (0-5)",
        "Regular (5-7)",
        "Bom (7-9)",
        "Excelente (9-10)",
      ];
      data = [
        gradesData["0-5"],
        gradesData["5-7"],
        gradesData["7-9"],
        gradesData["9-10"],
      ];
      colors = ["#dc3545", "#ffc107", "#28a745", "#0dcaf0"];
    } else {
      labels = ["0-3", "3-5", "5-7", "7-8", "8-9", "9-10"];
      data = Object.values(gradesData);
      colors = [
        "#dc3545",
        "#fd7e14",
        "#ffc107",
        "#28a745",
        "#20c997",
        "#0dcaf0",
      ];
    }

    this.charts.grades = new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Quantidade de Alunos",
            data: data,
            backgroundColor: colors,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            labels: {
              color: "#ffffff",
            },
          },
        },
        scales: {
          y: {
            ticks: {
              color: "#ffffff",
            },
          },
          x: {
            ticks: {
              color: "#ffffff",
            },
          },
        },
      },
    });
  }

  groupByCourse() {
    // Usar dados das estatísticas do backend se disponíveis
    if (this.statistics && this.statistics.porCurso) {
      const courses = {};
      Object.keys(this.statistics.porCurso).forEach((curso) => {
        courses[curso] = this.statistics.porCurso[curso].total;
      });
      return courses;
    }

    // Fallback para agrupamento local
    const courses = {};
    const courseNames = {
      PWT: "Programação Tarde",
      PWN: "Programação Noite",
      DGT: "Design Tarde",
      DGN: "Design Noite",
      MNT: "Manicure Tarde",
      MNN: "Manicure Noite",
    };

    this.data.forEach((student) => {
      const course =
        student.Curso ||
        courseNames[student.Origem] ||
        student.Origem ||
        "Não informado";
      courses[course] = (courses[course] || 0) + 1;
    });

    return courses;
  }

  groupByPeriod() {
    // Usar dados das estatísticas do backend se disponíveis
    if (this.statistics && this.statistics.porPeriodo) {
      const periods = {};
      Object.keys(this.statistics.porPeriodo).forEach((periodo) => {
        periods[periodo] = this.statistics.porPeriodo[periodo].total;
      });
      return periods;
    }

    // Fallback para agrupamento local
    const periods = {};

    this.data.forEach((student) => {
      const period = student.Periodo || student.Período || "Não informado";
      periods[period] = (periods[period] || 0) + 1;
    });

    return periods;
  }

  groupByGrades() {
    // Usar dados das estatísticas do backend se disponíveis
    if (this.statistics && this.statistics.notasDistribuicao) {
      return {
        "0-5": this.statistics.notasDistribuicao.insuficiente,
        "5-7": this.statistics.notasDistribuicao.regular,
        "7-9": this.statistics.notasDistribuicao.bom,
        "9-10": this.statistics.notasDistribuicao.excelente,
      };
    }

    // Fallback para agrupamento local
    const grades = {
      "0-3": 0,
      "3-5": 0,
      "5-7": 0,
      "7-8": 0,
      "8-9": 0,
      "9-10": 0,
    };

    this.data.forEach((student) => {
      // Usar média calculada ou calcular localmente
      let media = parseFloat(student.Media) || 0;

      if (media === 0) {
        // Calcular média incluindo todas as matérias
        const todasAsNotas = [
          parseFloat(student.Nota1) || 0,
          parseFloat(student.Nota2) || 0,
          parseFloat(student.Nota3) || 0,
          parseFloat(student.MundoTrabalho1) || 0,
          parseFloat(student.MundoTrabalho2) || 0,
          parseFloat(student.MundoTrabalho3) || 0,
          parseFloat(student.Convivio1) || 0,
          parseFloat(student.Convivio2) || 0,
          parseFloat(student.Convivio3) || 0,
        ].filter((nota) => nota > 0);

        if (todasAsNotas.length === 0) return;
        media = todasAsNotas.reduce((a, b) => a + b) / todasAsNotas.length;
      }

      if (media < 3) grades["0-3"]++;
      else if (media < 5) grades["3-5"]++;
      else if (media < 7) grades["5-7"]++;
      else if (media < 8) grades["7-8"]++;
      else if (media < 9) grades["8-9"]++;
      else grades["9-10"]++;
    });

    return grades;
  }

  generateDetailedTables() {
    console.log("📋 Iniciando geração de tabelas detalhadas...");
    this.generateCourseStatsTable();
    this.generateTopStudentsTable();
    this.loadRecentAttendanceRecords();

    console.log("⏰ Aguardando 100ms para criar análises visuais...");
    // Aguardar um pouco para garantir que o DOM esteja pronto
    setTimeout(() => {
      console.log("🚀 Timeout completado, chamando createVisualAnalysis...");

      this.createVisualAnalysis();
    }, 100);
  }

  generateCourseStatsTable() {
    const courseStats = this.calculateCourseStats();
    const tbody = document.getElementById("courseStatsBody");
    tbody.innerHTML = "";

    Object.entries(courseStats).forEach(([course, stats]) => {
      const row = document.createElement("tr");

      // Calcular taxa de aprovação se não estiver disponível
      const approvalRate =
        stats.approvalRate !== undefined
          ? stats.approvalRate
          : stats.total > 0
          ? (stats.approved / stats.total) * 100
          : 0;

      row.innerHTML = `
                <td data-label="Curso">${course}</td>
                <td data-label="Total">${stats.total}</td>
                <td data-label="Aprovados">${stats.approved}</td>
                <td data-label="Em Curso">${stats.inProgress}</td>
                <td data-label="Reprovados">${stats.failed}</td>
                <td data-label="Taxa Aprovação">${approvalRate.toFixed(1)}%</td>
                <td data-label="Média Geral">${stats.averageGrade}</td>
            `;
      tbody.appendChild(row);
    });
  }

  calculateCourseStats() {
    // Usar dados das estatísticas do backend se disponíveis
    if (this.statistics && this.statistics.porCurso) {
      const courseStats = {};

      Object.keys(this.statistics.porCurso).forEach((curso) => {
        const stats = this.statistics.porCurso[curso];
        courseStats[curso] = {
          total: stats.total,
          approved: stats.aprovados,
          inProgress: stats.emCurso,
          failed: stats.reprovados,
          averageGrade: parseFloat(stats.mediaGeral) || 0,
        };
      });

      return courseStats;
    }

    // Fallback para cálculo local
    const courseStats = {};
    const courseNames = {
      PWT: "Programação Tarde",
      PWN: "Programação Noite",
      DGT: "Design Tarde",
      DGN: "Design Noite",
      MNT: "Manicure Tarde",
      MNN: "Manicure Noite",
    };

    this.data.forEach((student) => {
      const courseName =
        student.Curso ||
        courseNames[student.Origem] ||
        student.Origem ||
        "Não informado";

      if (!courseStats[courseName]) {
        courseStats[courseName] = {
          total: 0,
          approved: 0,
          inProgress: 0,
          failed: 0,
          totalGrades: 0,
          gradeSum: 0,
        };
      }

      const stats = courseStats[courseName];
      stats.total++;

      const situation = this.calculateStudentSituation(student);
      switch (situation) {
        case "aprovado":
          stats.approved++;
          break;
        case "em-curso":
          stats.inProgress++;
          break;
        case "reprovado":
          stats.failed++;
          break;
      }

      const media = parseFloat(student.Media) || 0;
      if (media > 0) {
        stats.totalGrades++;
        stats.gradeSum += media;
      }
    });

    // Calcula média por curso
    Object.keys(courseStats).forEach((course) => {
      const stats = courseStats[course];
      stats.averageGrade =
        stats.totalGrades > 0
          ? (stats.gradeSum / stats.totalGrades).toFixed(2)
          : 0;
    });

    return courseStats;
  }

  generateTopStudentsTable() {
    const topStudents = this.getTopStudents(10);
    const tbody = document.getElementById("topStudentsBody");
    tbody.innerHTML = "";

    topStudents.forEach((student, index) => {
      const row = document.createElement("tr");

      const courseName = student.curso || "Não informado";
      const situation =
        student.Situacao || this.calculateStudentSituation(student);

      const situationText = {
        Aprovado: "Aprovado",
        "Em Curso": "Em Curso",
        Reprovado: "Reprovado",
        "Reprovado por Faltas": "Reprovado por Faltas",
        aprovado: "Aprovado",
        "em-curso": "Em Curso",
        reprovado: "Reprovado",
      };

      row.innerHTML = `
                <td data-label="Posição">${index + 1}º</td>
                <td data-label="Nome">${student.Nome}</td>
                <td data-label="Curso">${courseName}</td>
                <td data-label="Média">${student.media.toFixed(1)}</td>
                <td data-label="Situação"><span class="badge ${situation
                  .toLowerCase()
                  .replace(/\s+/g, "-")}">${
        situationText[situation] || situation
      }</span></td>
            `;

      tbody.appendChild(row);
    });
  }

  getTopStudents(limit) {
    const studentsWithGrades = this.data
      .map((student) => {
        // Usar média já calculada no backend ou calcular localmente
        let media = parseFloat(student.Media) || 0;

        if (media === 0) {
          // Calcular incluindo todas as matérias
          const todasAsNotas = [
            parseFloat(student.Nota1) || 0,
            parseFloat(student.Nota2) || 0,
            parseFloat(student.Nota3) || 0,
            parseFloat(student.MundoTrabalho1) || 0,
            parseFloat(student.MundoTrabalho2) || 0,
            parseFloat(student.MundoTrabalho3) || 0,
            parseFloat(student.Convivio1) || 0,
            parseFloat(student.Convivio2) || 0,
            parseFloat(student.Convivio3) || 0,
          ].filter((nota) => nota > 0);

          media =
            todasAsNotas.length > 0
              ? todasAsNotas.reduce((a, b) => a + b) / todasAsNotas.length
              : 0;
        }

        return {
          ...student,
          media: media,
          curso: student.Curso || student.Origem || "Não informado",
        };
      })
      .filter((student) => student.media > 0)
      .sort((a, b) => b.media - a.media)
      .slice(0, limit);

    return studentsWithGrades;
  }

  async loadRecentAttendanceRecords() {
    try {
      console.log("📝 Carregando registros de presença recentes...");

      const API_URL =
        "https://script.google.com/macros/s/AKfycbzNq3Hz1Pvlx3Ty4YGJvj0UM4jQNe2adOEQWyomzpTnBHooEzgHa1TGMWfcd8mpzTDe/exec";
      const response = await fetch(
        `${API_URL}?action=buscarUltimosRegistrosPresenca&limite=10`
      );
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Erro ao carregar registros de presença");
      }

      this.displayRecentAttendanceRecords(data.registros || []);
    } catch (error) {
      console.error("❌ Erro ao carregar registros de presença:", error);
      // Não mostra alert para não interromper o carregamento das outras estatísticas
      const tbody = document.getElementById("recentAttendanceBody");
      tbody.innerHTML =
        '<tr><td colspan="5" class="error-message">Erro ao carregar registros recentes</td></tr>';
    }
  }

  displayRecentAttendanceRecords(registros) {
    const tbody = document.getElementById("recentAttendanceBody");
    tbody.innerHTML = "";

    if (!registros || registros.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="5" class="no-data">Nenhum registro encontrado</td></tr>';
      return;
    }

    registros.forEach((registro) => {
      const row = document.createElement("tr");
      const statusClass =
        registro.status === "Falta"
          ? "status-absent"
          : registro.status === "Presente"
          ? "status-present"
          : "";

      row.innerHTML = `
        <td data-label="Data/Hora">${this.formatDateTime(
          registro.data,
          registro.horario
        )}</td>
        <td data-label="Aluno">${registro.nome || "Nome não informado"}</td>
        <td data-label="Curso">${registro.curso || "Curso não informado"}</td>
        <td data-label="Status"><span class="status-badge ${statusClass}">${
        registro.status || "N/A"
      }</span></td>
        <td data-label="Professor" class="professor-info">
          <div class="professor-name">${
            registro.professor || "Professor não informado"
          }</div>
          ${
            registro.professor &&
            registro.professor.toLowerCase().includes("mundo")
              ? '<span class="professor-badge">👨‍🏫 Mundo do Trabalho</span>'
              : ""
          }
        </td>
      `;

      tbody.appendChild(row);
    });
  }

  formatDateTime(data, horario) {
    try {
      if (data && horario) {
        return `${data} ${horario}`;
      } else if (data) {
        return data;
      }
      return "Data não informada";
    } catch (error) {
      return "Data inválida";
    }
  }

  createVisualAnalysis() {
    console.log("🎨 Iniciando criação de análises visuais...");

    // Verificar se Chart.js está disponível
    if (typeof Chart === "undefined") {
      console.error("❌ Chart.js não está carregado!");
      return;
    }

    console.log("✅ Chart.js está disponível, criando gráficos...");

    // Verificar se a seção de análises visuais existe
    const visualSection = document.querySelector(".visual-analysis-section");
    if (!visualSection) {
      console.error(
        "❌ Seção '.visual-analysis-section' não encontrada no DOM!"
      );
      console.log("📍 Procurando por elementos relacionados...");
      const allSections = document.querySelectorAll("section");
      console.log("📍 Seções encontradas:", allSections.length);
      allSections.forEach((section, index) => {
        console.log(`📍 Seção ${index}:`, section.className, section.id);
      });
      return;
    }

    console.log("✅ Seção de análises visuais encontrada!");

    this.createPeriodDistributionChart();
    this.createApprovalRateChart();
    this.generateAttentionStudents();
  }

  createPeriodDistributionChart() {
    console.log("📊 Criando gráfico de distribuição por período...");

    const canvasElement = document.getElementById("periodDistributionChart");
    if (!canvasElement) {
      console.error("❌ Canvas 'periodDistributionChart' não encontrado!");
      return;
    }

    console.log("✅ Canvas encontrado:", canvasElement);

    const periodsData = this.groupByPeriod();
    console.log("📊 Dados dos períodos:", periodsData);

    // Verificar se há dados
    if (!periodsData || Object.keys(periodsData).length === 0) {
      console.warn("⚠️ Nenhum dado de período encontrado");
      return;
    }

    const ctx = canvasElement.getContext("2d");

    // Calcular percentuais
    const total = Object.values(periodsData).reduce(
      (sum, count) => sum + count,
      0
    );
    console.log("📊 Total de alunos:", total);

    if (total === 0) {
      console.warn("⚠️ Total de alunos é zero");
      return;
    }

    const percentages = {};
    Object.keys(periodsData).forEach((period) => {
      percentages[period] = ((periodsData[period] / total) * 100).toFixed(1);
    });

    console.log("📊 Percentuais calculados:", percentages);

    this.charts.periodDistribution = new Chart(ctx, {
      type: "pie",
      data: {
        labels: Object.keys(periodsData).map(
          (period) => `${period} (${percentages[period]}%)`
        ),
        datasets: [
          {
            data: Object.values(periodsData),
            backgroundColor: [
              "#f4c430", // Tarde
              "#1a2951", // Noite
              "#28a745", // Manhã (se existir)
              "#ffc107", // Outros
            ],
            borderWidth: 2,
            borderColor: "#fff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#ffffff",
              font: {
                size: 12,
              },
              padding: 15,
            },
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.parsed;
                return `${label}: ${value} alunos`;
              },
            },
          },
        },
      },
    });
  }

  createApprovalRateChart() {
    console.log("📈 Criando gráfico de taxa de aprovação...");

    const canvasElement = document.getElementById("approvalRateChart");
    if (!canvasElement) {
      console.error("❌ Canvas 'approvalRateChart' não encontrado!");
      return;
    }

    const courseStats = this.calculateCourseStats();
    console.log("📈 Dados dos cursos:", courseStats);

    const ctx = canvasElement.getContext("2d");

    const courses = Object.keys(courseStats);
    const approvalRates = courses.map((course) => {
      const stats = courseStats[course];
      return stats.total > 0
        ? ((stats.approved / stats.total) * 100).toFixed(1)
        : 0;
    });

    console.log("📈 Taxas de aprovação:", approvalRates);

    this.charts.approvalRate = new Chart(ctx, {
      type: "bar",
      data: {
        labels: courses,
        datasets: [
          {
            label: "Taxa de Aprovação (%)",
            data: approvalRates,
            backgroundColor: courses.map((course) => {
              const rate = parseFloat(approvalRates[courses.indexOf(course)]);
              if (rate >= 80) return "#28a745"; // Verde - Excelente
              if (rate >= 60) return "#ffc107"; // Amarelo - Bom
              if (rate >= 40) return "#fd7e14"; // Laranja - Regular
              return "#dc3545"; // Vermelho - Crítico
            }),
            borderRadius: 8,
            borderSkipped: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                return `Taxa de Aprovação: ${context.parsed.y}%`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              color: "#ffffff",
              callback: function (value) {
                return value + "%";
              },
            },
            title: {
              display: true,
              text: "Taxa de Aprovação (%)",
              color: "#ffffff",
            },
          },
          x: {
            ticks: {
              color: "#ffffff",
            },
            title: {
              display: true,
              text: "Cursos",
              color: "#ffffff",
            },
          },
        },
      },
    });
  }

  generateAttentionStudents() {
    console.log("⚠️ Gerando seção de alunos que precisam de atenção...");

    const attentionGrid = document.getElementById("attentionStudentsGrid");
    if (!attentionGrid) {
      console.error("❌ Elemento 'attentionStudentsGrid' não encontrado!");
      return;
    }

    const attentionStudents = this.identifyAttentionStudents();
    console.log("⚠️ Alunos que precisam de atenção:", attentionStudents);

    if (attentionStudents.length === 0) {
      attentionGrid.innerHTML = `
        <div class="attention-empty">
          🎉 Parabéns! Nenhum aluno precisa de atenção especial no momento.
        </div>
      `;
      return;
    }

    attentionGrid.innerHTML = attentionStudents
      .map(
        (student) => `
      <div class="attention-card">
        <div class="attention-student-name">${student.name}</div>
        <div class="attention-reason">${student.reason}</div>
        <div class="attention-details">${student.details}</div>
      </div>
    `
      )
      .join("");
  }

  calculateStudentAverage(student) {
    // Usar média já calculada no backend ou calcular localmente
    let media = parseFloat(student.Media) || 0;

    if (media === 0) {
      // Calcular incluindo todas as matérias
      const todasAsNotas = [
        parseFloat(student.Nota1) || 0,
        parseFloat(student.Nota2) || 0,
        parseFloat(student.Nota3) || 0,
        parseFloat(student.MundoTrabalho1) || 0,
        parseFloat(student.MundoTrabalho2) || 0,
        parseFloat(student.MundoTrabalho3) || 0,
        parseFloat(student.Convivio1) || 0,
        parseFloat(student.Convivio2) || 0,
        parseFloat(student.Convivio3) || 0,
      ].filter((nota) => nota > 0);

      media =
        todasAsNotas.length > 0
          ? todasAsNotas.reduce((a, b) => a + b) / todasAsNotas.length
          : 0;
    }

    return media;
  }

  identifyAttentionStudents() {
    const attentionStudents = [];

    this.data.forEach((student) => {
      const reasons = [];

      // Verificar faltas excessivas (alinhado com alerts-section)
      const faltas = parseInt(student.Faltas) || 0;
      if (faltas >= 10) {
        reasons.push({
          reason: "⚠️ Faltas Excessivas",
          details: `${faltas} faltas registradas (Limite: 10)`,
        });
      }

      // Verificar média baixa (alinhado com alerts-section)
      const media = this.calculateStudentAverage(student);
      if (media > 0 && media < 6.0) {
        reasons.push({
          reason: "📉 Média Baixa",
          details: `Média atual: ${media.toFixed(1)} (Mínimo: 6.0)`,
        });
      }

      // Se há motivos para atenção, adicionar o aluno
      if (reasons.length > 0) {
        reasons.forEach((reasonObj) => {
          attentionStudents.push({
            name: student.Nome || "Nome não informado",
            course: student.Curso || student.Origem || "Curso não informado",
            reason: reasonObj.reason,
            details: reasonObj.details,
          });
        });
      }
    });

    return attentionStudents;
  }

  showLoading(show) {
    const loadingOverlay = document.getElementById("loadingOverlay");
    if (show) {
      loadingOverlay.classList.add("active");
    } else {
      loadingOverlay.classList.remove("active");
    }
  }
}

// Inicializar quando a página carregar
document.addEventListener("DOMContentLoaded", () => {
  new StatsSystem();
});
