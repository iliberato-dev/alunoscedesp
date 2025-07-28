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

      // Usar a mesma API do sistema principal
      const API_URL =
        "https://script.google.com/macros/s/AKfycbzNq3Hz1Pvlx3Ty4YGJvj0UM4jQNe2adOEQWyomzpTnBHooEzgHa1TGMWfcd8mpzTDe/exec";

      const response = await fetch(API_URL);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      this.data = data.saida || [];
      console.log(
        "📊 Dados carregados para estatísticas:",
        this.data.length,
        "alunos"
      );

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
    const stats = this.calculateBasicStats();

    document.getElementById("totalStudents").textContent = stats.total;
    document.getElementById("approvedStudents").textContent = stats.approved;
    document.getElementById("inProgressStudents").textContent =
      stats.inProgress;
    document.getElementById("failedStudents").textContent = stats.failed;
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
    const nota1 = parseFloat(student["1º Bimestre"]) || 0;
    const nota2 = parseFloat(student["2º Bimestre"]) || 0;
    const nota3 = parseFloat(student["3º Bimestre"]) || 0;
    const faltas = parseInt(student.Faltas) || 0;

    const notasPreenchidas = [nota1, nota2, nota3].filter(
      (nota) => nota > 0
    ).length;

    if (notasPreenchidas === 0) {
      return "em-curso";
    }

    const media =
      notasPreenchidas > 0 ? (nota1 + nota2 + nota3) / notasPreenchidas : 0;

    if (notasPreenchidas < 3) {
      return "em-curso";
    }

    if (faltas > 15) {
      return "reprovado";
    }

    return media >= 7 ? "aprovado" : "reprovado";
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

    this.charts.grades = new Chart(ctx, {
      type: "bar",
      data: {
        labels: ["0-3", "3-5", "5-7", "7-8", "8-9", "9-10"],
        datasets: [
          {
            label: "Quantidade de Alunos",
            data: Object.values(gradesData),
            backgroundColor: [
              "#dc3545",
              "#fd7e14",
              "#ffc107",
              "#28a745",
              "#20c997",
              "#0dcaf0",
            ],
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
      const course = courseNames[student.Origem] || student.Origem;
      courses[course] = (courses[course] || 0) + 1;
    });

    return courses;
  }

  groupByPeriod() {
    const periods = {};

    this.data.forEach((student) => {
      const period = student.Período || "Não informado";
      periods[period] = (periods[period] || 0) + 1;
    });

    return periods;
  }

  groupByGrades() {
    const grades = {
      "0-3": 0,
      "3-5": 0,
      "5-7": 0,
      "7-8": 0,
      "8-9": 0,
      "9-10": 0,
    };

    this.data.forEach((student) => {
      const nota1 = parseFloat(student["1º Bimestre"]) || 0;
      const nota2 = parseFloat(student["2º Bimestre"]) || 0;
      const nota3 = parseFloat(student["3º Bimestre"]) || 0;

      const notasPreenchidas = [nota1, nota2, nota3].filter((nota) => nota > 0);
      if (notasPreenchidas.length === 0) return;

      const media =
        notasPreenchidas.reduce((a, b) => a + b, 0) / notasPreenchidas.length;

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
  }

  generateCourseStatsTable() {
    const courseStats = this.calculateCourseStats();
    const tbody = document.getElementById("courseStatsBody");
    tbody.innerHTML = "";

    Object.entries(courseStats).forEach(([course, stats]) => {
      const row = document.createElement("tr");
      row.innerHTML = `
                <td>${course}</td>
                <td>${stats.total}</td>
                <td>${stats.approved}</td>
                <td>${stats.inProgress}</td>
                <td>${stats.failed}</td>
                <td>${stats.approvalRate.toFixed(1)}%</td>
                <td>${stats.averageGrade.toFixed(1)}</td>
            `;
      tbody.appendChild(row);
    });
  }

  calculateCourseStats() {
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
      const courseName = courseNames[student.Origem] || student.Origem;

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
      if (situation === "aprovado") stats.approved++;
      else if (situation === "em-curso") stats.inProgress++;
      else stats.failed++;

      // Calcular média do aluno
      const nota1 = parseFloat(student["1º Bimestre"]) || 0;
      const nota2 = parseFloat(student["2º Bimestre"]) || 0;
      const nota3 = parseFloat(student["3º Bimestre"]) || 0;

      const notasPreenchidas = [nota1, nota2, nota3].filter((nota) => nota > 0);
      if (notasPreenchidas.length > 0) {
        const media =
          notasPreenchidas.reduce((a, b) => a + b, 0) / notasPreenchidas.length;
        stats.gradeSum += media;
        stats.totalGrades++;
      }
    });

    // Calcular percentuais e médias
    Object.values(courseStats).forEach((stats) => {
      stats.approvalRate =
        stats.total > 0 ? (stats.approved / stats.total) * 100 : 0;
      stats.averageGrade =
        stats.totalGrades > 0 ? stats.gradeSum / stats.totalGrades : 0;
    });

    return courseStats;
  }

  generateTopStudentsTable() {
    const topStudents = this.getTopStudents(10);
    const tbody = document.getElementById("topStudentsBody");
    tbody.innerHTML = "";

    topStudents.forEach((student, index) => {
      const row = document.createElement("tr");
      const courseNames = {
        PWT: "Programação Tarde",
        PWN: "Programação Noite",
        DGT: "Design Tarde",
        DGN: "Design Noite",
        MNT: "Manicure Tarde",
        MNN: "Manicure Noite",
      };

      const courseName = courseNames[student.Origem] || student.Origem;
      const situation = this.calculateStudentSituation(student);
      const situationText = {
        aprovado: "Aprovado",
        "em-curso": "Em Curso",
        reprovado: "Reprovado",
      };

      row.innerHTML = `
                <td>${index + 1}º</td>
                <td>${student.Nome}</td>
                <td>${courseName}</td>
                <td>${student.media.toFixed(1)}</td>
                <td><span class="situation-badge ${situation}">${
        situationText[situation]
      }</span></td>
            `;
      tbody.appendChild(row);
    });
  }

  getTopStudents(limit) {
    const studentsWithGrades = this.data
      .map((student) => {
        const nota1 = parseFloat(student["1º Bimestre"]) || 0;
        const nota2 = parseFloat(student["2º Bimestre"]) || 0;
        const nota3 = parseFloat(student["3º Bimestre"]) || 0;

        const notasPreenchidas = [nota1, nota2, nota3].filter(
          (nota) => nota > 0
        );
        const media =
          notasPreenchidas.length > 0
            ? notasPreenchidas.reduce((a, b) => a + b, 0) /
              notasPreenchidas.length
            : 0;

        return { ...student, media };
      })
      .filter((student) => student.media > 0)
      .sort((a, b) => b.media - a.media)
      .slice(0, limit);

    return studentsWithGrades;
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
