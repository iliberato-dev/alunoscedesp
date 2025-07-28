# 🎓 Sistema de Gestão Acadêmica CEDESP

Sistema completo para gestão de alunos, notas e presenças com design moderno e cálculo automático de situação.

## ✨ Funcionalidades

- 📊 **Consulta de Alunos**: Busca por nome, período e curso
- 📝 **Gestão de Notas**: Atualização individual por bimestre
- 👥 **Controle de Presença**: Registro de presença/falta por data
- 🎯 **Situação Automática**: Aprovado ≥ 6.0, Reprovado < 6.0
- 🌙 **Tema Claro/Escuro**: Interface adaptável
- 📱 **Design Responsivo**: Funciona em desktop e mobile

## 🚀 Deploy

### Vercel (Recomendado)

```bash
vercel --prod
```

### Netlify

```bash
netlify deploy --prod --dir .
```

### GitHub Pages

1. Push para repositório GitHub
2. Ative GitHub Pages nas configurações
3. Configure para usar branch `main`

## ⚙️ Configuração

### 1. Google Apps Script

1. Abra [Google Apps Script](https://script.google.com)
2. Crie novo projeto e cole o código de `appscript_universal.gs`
3. Implante como **Web App**:
   - Executar como: **Eu**
   - Acesso: **Qualquer pessoa**
4. Copie a URL gerada

### 2. Frontend

1. Edite `script.js` linha 3:

```javascript
const WEB_APP_URL = "SUA_URL_DO_APPS_SCRIPT_AQUI";
```

## 📁 Estrutura

```
/
├── index.html      # Interface principal
├── script.js       # Lógica da aplicação
├── style.css       # Estilos CEDESP
├── vercel.json     # Configuração Vercel
└── appscript_universal.gs # Backend Google Apps Script
```

## 🎨 Personalização

### Cores CEDESP

- **Azul Principal**: `#1a2951`
- **Azul Secundário**: `#233a6b`
- **Dourado**: `#f4c430`

### Planilhas Suportadas

- PWT, PWN (Programação)
- DGT, DGN (Design Gráfico)
- MNT, MNN (Manicure)

## 📊 Sistema de Notas

- **Aprovado**: Média ≥ 6.0
- **Reprovado**: Média < 6.0
- **Em Curso**: Sem notas suficientes

## 🔧 Suporte

Sistema totalmente funcional e otimizado para produção.

---

**CEDESP** - Centro de Desenvolvimento em Sistemas e Programação
