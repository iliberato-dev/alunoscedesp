// Sistema de Estatísticas CEDESP
class StatsSystem {
  constructor() {
    this.data = [];
    this.charts = {};
    this.init();
  }

  init() {
    // Verificar se é admin
    if (!this.checkAdminAccess()) {
      return;
    }

    this.setupEventListeners();
    this.loadData();
  }

  checkAdminAccess() {
    const currentUser = AuthSystem.getCurrentUser();

    if (!currentUser) {
      window.location.href = "login.html";
      return false;
    }

    if (currentUser.role !== "admin") {
      alert("Acesso negado. Apenas administradores podem ver estatísticas.");
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

      this.generateStats();
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
      alert("Erro ao carregar dados: " + error.message);
    } finally {
      this.showLoading(false);
    }
  }

  generateStats() {
    this.updateSummaryCards();
    this.createCharts();
    this.generateDetailedTables();
  }

  updateSummaryCards() {
    // Usar estatísticas calculadas no backend se disponíveis
    if (this.statistics && this.statistics.totalAlunos) {
      document.getElementById("totalStudents").textContent =
        this.statistics.totalAlunos;
      document.getElementById("approvedStudents").textContent =
        this.statistics.aprovados;
      document.getElementById("inProgressStudents").textContent =
        this.statistics.emCurso;
      document.getElementById("failedStudents").textContent =
        this.statistics.reprovados + this.statistics.reprovadosPorFaltas;
    } else {
      // Fallback para cálculo local se necessário
      const stats = this.calculateBasicStats();
      document.getElementById("totalStudents").textContent = stats.total;
      document.getElementById("approvedStudents").textContent = stats.approved;
      document.getElementById("inProgressStudents").textContent =
        stats.inProgress;
      document.getElementById("failedStudents").textContent = stats.failed;
    }
  }

  calculateBasicStats() {
    const total = this.data.length;
    let approved = 0;
    let inProgress = 0;
    let failed = 0;

    this.data.forEach((student) => {
      const situation = this.calculateStudentSituation(student);
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

    return { total, approved, inProgress, failed };
  }

  calculateStudentSituation(student) {
    // Se a situação já vem calculada do backend, usar ela
    if (student.Situacao) {
      switch (student.Situacao.toLowerCase()) {
        case "aprovado":
          return "aprovado";
        case "reprovado":
        case "reprovado por faltas":
          return "reprovado";
        default:
          return "em-curso";
      }
    }

    // Fallback para cálculo local (compatibilidade)
    const nota1 = parseFloat(student.Nota1) || 0;
    const nota2 = parseFloat(student.Nota2) || 0;
    const nota3 = parseFloat(student.Nota3) || 0;

    // Incluir notas de outras matérias se disponíveis
    const mundoTrabalho1 = parseFloat(student.MundoTrabalho1) || 0;
    const mundoTrabalho2 = parseFloat(student.MundoTrabalho2) || 0;
    const mundoTrabalho3 = parseFloat(student.MundoTrabalho3) || 0;
    const convivio1 = parseFloat(student.Convivio1) || 0;
    const convivio2 = parseFloat(student.Convivio2) || 0;
    const convivio3 = parseFloat(student.Convivio3) || 0;

    const faltas = parseInt(student.Faltas) || 0;

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
    ].filter((nota) => nota > 0);

    if (todasAsNotas.length === 0) {
      return "em-curso";
    }

    const media = todasAsNotas.reduce((a, b) => a + b) / todasAsNotas.length;

    if (faltas > 15) {
      return "reprovado";
    }

    return media >= 6.0 ? "aprovado" : "reprovado";
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
    this.generateCourseStatsTable();
    this.generateTopStudentsTable();
    this.loadRecentAttendanceRecords();
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
                <td>${course}</td>
                <td>${stats.total}</td>
                <td>${stats.approved}</td>
                <td>${stats.inProgress}</td>
                <td>${stats.failed}</td>
                <td>${approvalRate.toFixed(1)}%</td>
                <td>${stats.averageGrade}</td>
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
                <td>${index + 1}º</td>
                <td>${student.Nome}</td>
                <td>${courseName}</td>
                <td>${student.media.toFixed(1)}</td>
                <td><span class="badge ${situation
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
        <td>${this.formatDateTime(registro.data, registro.horario)}</td>
        <td>${registro.nome || "Nome não informado"}</td>
        <td>${registro.curso || "Curso não informado"}</td>
        <td><span class="status-badge ${statusClass}">${
        registro.status || "N/A"
      }</span></td>
        <td class="professor-info">
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
