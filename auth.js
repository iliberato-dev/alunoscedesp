// Sistema de Autenticação CEDESP
class AuthSystem {
  constructor() {
    this.users = {
      "prof.programacao": {
        password: "prog123",
        role: "professor",
        course: "programacao",
        name: "Prof. Programação",
        courses: ["PWT", "PWN"], // Programação Web Tarde e Noite
        avatar: "👨‍💻",
      },
      "prof.design": {
        password: "design123",
        role: "professor",
        course: "design",
        name: "Prof. Design Gráfico",
        courses: ["DGT", "DGN"], // Design Gráfico Tarde e Noite
        avatar: "🎨",
      },
      "prof.manicure": {
        password: "mani123",
        role: "professor",
        course: "manicure",
        name: "Prof. Manicure",
        courses: ["MNT", "MNN"], // Manicure Tarde e Noite
        avatar: "💅",
      },
      "prof.mundotrabalho": {
        password: "mundo123",
        role: "professor",
        course: "mundotrabalho",
        name: "Prof. Mundo do Trabalho",
        courses: ["PWT", "PWN", "DGT", "DGN", "MNT", "MNN"], // Acesso a todas as turmas
        avatar: "🌍",
      },
      "prof.convivio": {
        password: "convivio123",
        role: "professor",
        course: "convivio",
        name: "Prof. Convívio",
        courses: ["PWT", "PWN", "DGT", "DGN", "MNT", "MNN"], // Acesso a todas as turmas
        avatar: "🤝",
      },
      admin: {
        password: "admin123",
        role: "admin",
        course: "all",
        name: "Administrador",
        courses: ["PWT", "PWN", "DGT", "DGN", "MNT", "MNN"],
        avatar: "⚙️",
      },
    };

    this.currentUser = null;
    this.init();
  }

  init() {
    // Verificar se já está logado
    this.checkExistingSession();

    // Só configurar event listeners se estivermos na página de login
    if (window.location.pathname.endsWith("login.html")) {
      this.setupLoginPageElements();
    }
  }

  setupLoginPageElements() {
    // Event listeners
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => this.handleLogin(e));
    }

    // Auto-complete dos usuários de teste
    this.setupTestUserCards();

    // Modal de notificação
    this.setupNotificationModal();
  }

  checkExistingSession() {
    console.log("🔍 Verificando sessão existente...");
    console.log("📍 Página atual:", window.location.pathname);

    const savedUser = localStorage.getItem("cedesp_user");
    if (savedUser) {
      try {
        this.currentUser = JSON.parse(savedUser);
        console.log("✅ Sessão encontrada:", this.currentUser.name);

        // Só redirecionar se estivermos na página de login
        if (
          window.location.pathname.endsWith("login.html") ||
          window.location.pathname.endsWith("/") ||
          window.location.pathname === "/"
        ) {
          console.log("🔄 Redirecionando da página de login...");
          this.redirectToMainApp();
        } else {
          console.log("✅ Já na página correta, não redirecionando");
        }
      } catch (e) {
        console.error("❌ Erro ao carregar sessão:", e);
        localStorage.removeItem("cedesp_user");
      }
    } else {
      console.log("❌ Nenhuma sessão encontrada");
    }
  }

  setupTestUserCards() {
    const userCards = document.querySelectorAll(".user-card");
    if (userCards.length > 0) {
      userCards.forEach((card) => {
        card.addEventListener("click", () => {
          const username = this.extractUsernameFromCard(card);
          if (username) {
            const usernameInput = document.getElementById("username");
            const passwordInput = document.getElementById("password");
            if (usernameInput && passwordInput) {
              usernameInput.value = username;
              passwordInput.focus();
            }
          }
        });
      });
    }
  }

  extractUsernameFromCard(card) {
    const codeElement = card.querySelector("code");
    if (
      codeElement &&
      codeElement.previousElementSibling?.textContent.includes("Usuário:")
    ) {
      return codeElement.textContent;
    }
    return null;
  }

  setupNotificationModal() {
    const notificationOkBtn = document.getElementById("notificationOkBtn");
    if (notificationOkBtn) {
      notificationOkBtn.addEventListener("click", () => {
        this.hideNotification();
      });
    }
  }

  async handleLogin(e) {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;

    if (!username || !password) {
      this.showNotification(
        "error",
        "Campos Obrigatórios",
        "Por favor, preencha usuário e senha."
      );
      return;
    }

    this.showLoading();

    // Simular delay de autenticação
    await this.delay(1500);

    const isValid = this.validateCredentials(username, password);

    this.hideLoading();

    if (isValid) {
      this.currentUser = {
        username,
        ...this.users[username],
        loginTime: new Date().toISOString(),
      };

      // Salvar sessão
      localStorage.setItem("cedesp_user", JSON.stringify(this.currentUser));

      this.showNotification(
        "success",
        "Login Realizado!",
        `Bem-vindo(a), ${this.currentUser.name}! Redirecionando...`
      );

      // Redirecionar após um tempo
      setTimeout(() => {
        this.redirectToMainApp();
      }, 2000);
    } else {
      this.showNotification(
        "error",
        "Acesso Negado",
        "Usuário ou senha incorretos. Verifique suas credenciais."
      );
    }
  }

  validateCredentials(username, password) {
    const user = this.users[username];
    return user && user.password === password;
  }

  redirectToMainApp() {
    // Verificar se já estamos na página principal para evitar loop
    if (
      window.location.pathname.endsWith("index.html") ||
      (!window.location.pathname.endsWith("login.html") &&
        !window.location.pathname.endsWith("stats.html"))
    ) {
      console.log("🔄 Já na página principal, não redirecionando");
      return;
    }

    // Adicionar parâmetros de usuário à URL
    const params = new URLSearchParams({
      user: this.currentUser.username,
      role: this.currentUser.role,
      course: this.currentUser.course,
    });

    console.log("🔄 Redirecionando para página principal...");
    window.location.href = `index.html?${params.toString()}`;
  }

  showLoading() {
    const loadingOverlay = document.getElementById("loadingOverlay");
    const loginBtn = document.getElementById("loginBtn");

    if (loadingOverlay) {
      loadingOverlay.classList.add("active");
    }
    if (loginBtn) {
      loginBtn.classList.add("loading");
      loginBtn.disabled = true;
    }
  }

  hideLoading() {
    const loadingOverlay = document.getElementById("loadingOverlay");
    const loginBtn = document.getElementById("loginBtn");

    if (loadingOverlay) {
      loadingOverlay.classList.remove("active");
    }
    if (loginBtn) {
      loginBtn.classList.remove("loading");
      loginBtn.disabled = false;
    }
  }

  showNotification(type, title, message) {
    const modal = document.getElementById("notificationModal");
    const icon = document.getElementById("notificationIcon");
    const iconSymbol = document.getElementById("notificationIconSymbol");
    const titleEl = document.getElementById("notificationTitle");
    const messageEl = document.getElementById("notificationMessage");

    // Limpar classes anteriores
    icon.className = "notification-icon";

    // Definir ícone e classe baseado no tipo
    switch (type) {
      case "success":
        icon.classList.add("success");
        iconSymbol.textContent = "✓";
        break;
      case "error":
        icon.classList.add("error");
        iconSymbol.textContent = "✕";
        break;
      case "warning":
        icon.classList.add("warning");
        iconSymbol.textContent = "⚠";
        break;
      default:
        icon.classList.add("info");
        iconSymbol.textContent = "ℹ";
    }

    titleEl.textContent = title;
    messageEl.textContent = message;
    modal.classList.add("active");
  }

  hideNotification() {
    const modal = document.getElementById("notificationModal");
    modal.classList.remove("active");
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Método estático para verificar se o usuário está logado
  static getCurrentUser() {
    const savedUser = localStorage.getItem("cedesp_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        localStorage.removeItem("cedesp_user");
        return null;
      }
    }
    return null;
  }

  // Método estático para fazer logout
  static logout() {
    console.log("🔓 Fazendo logout...");
    localStorage.removeItem("cedesp_user");
    window.location.href = "login.html";
  }

  // Método para limpar dados em caso de erro
  static clearSession() {
    console.log("🧹 Limpando sessão...");
    localStorage.removeItem("cedesp_user");
  }

  // Método para verificar permissões
  static hasPermission(requiredRole, userRole = null) {
    const currentUser = userRole
      ? { role: userRole }
      : AuthSystem.getCurrentUser();
    if (!currentUser) return false;

    if (currentUser.role === "admin") return true;
    if (requiredRole === "professor" && currentUser.role === "professor")
      return true;

    return false;
  }

  // Método para filtrar alunos baseado no usuário logado
  static filterStudentsByUser(students, user = null) {
    const currentUser = user || AuthSystem.getCurrentUser();
    if (!currentUser) return [];

    console.log(
      "🔍 Filtrando alunos para:",
      currentUser.name,
      "Role:",
      currentUser.role
    );

    // Admin tem acesso a todos os alunos
    if (currentUser.role === "admin") {
      console.log("👑 Admin - acesso total a", students.length, "alunos");
      return students;
    }

    // Professor só vê alunos de seus cursos
    if (currentUser.role === "professor") {
      const filteredStudents = students.filter((student) =>
        currentUser.courses.includes(student.Origem)
      );
      console.log(
        "👨‍🏫 Professor",
        currentUser.name,
        "- cursos:",
        currentUser.courses
      );
      console.log(
        "📚 Alunos filtrados:",
        filteredStudents.length,
        "de",
        students.length,
        "total"
      );
      return filteredStudents;
    }

    return [];
  }
}

// Inicializar o sistema de autenticação quando a página carregar
document.addEventListener("DOMContentLoaded", () => {
  new AuthSystem();
});

// Exportar para uso global
window.AuthSystem = AuthSystem;
