# Flip Cards com Notas Detalhadas - Implementação

## 📋 Funcionalidade Implementada

**Flip Cards**: Cada card de aluno agora pode ser "virado" como uma carta para revelar as notas detalhadas por matéria no verso.

## 🎯 **Características do Sistema**

### **Frente do Card (Original)**

- ✅ Informações básicas do aluno
- ✅ Notas do curso principal (1º, 2º, 3º bimestre)
- ✅ Média e situação
- ✅ Seção de registro de presença
- ✅ Último registro de presença

### **Verso do Card (Novo)**

- 📚 **Curso Principal**: Notas dos 3 bimestres
- 🌍 **Mundo do Trabalho**: Notas dos 3 bimestres
- 🤝 **Convívio**: Notas dos 3 bimestres
- 🎯 **Média Geral**: Média de todas as matérias

## 🛠️ **Implementação Técnica**

### **1. Estrutura JavaScript**

#### Função `createStudentCardHTML` Atualizada:

```javascript
// Estrutura de dados das notas por matéria
const notasCurso = {
  bim1: aluno[`${aluno.Origem}_1Bim`] || nota1 || "-",
  bim2: aluno[`${aluno.Origem}_2Bim`] || nota2 || "-",
  bim3: aluno[`${aluno.Origem}_3Bim`] || nota3 || "-",
};

const notasMundoTrabalho = {
  bim1: aluno.MundoTrabalho_1Bim || "-",
  bim2: aluno.MundoTrabalho_2Bim || "-",
  bim3: aluno.MundoTrabalho_3Bim || "-",
};

const notasConvivio = {
  bim1: aluno.Convivio_1Bim || "-",
  bim2: aluno.Convivio_2Bim || "-",
  bim3: aluno.Convivio_3Bim || "-",
};

// Cálculo da média geral
const mediaGeral =
  todasNotas.length > 0
    ? (
        todasNotas.reduce((sum, nota) => sum + nota, 0) / todasNotas.length
      ).toFixed(1)
    : "-";
```

#### Função `toggleCardFlip`:

```javascript
function toggleCardFlip(studentId) {
  const flipCard = document.getElementById(`flipCard-${studentId}`);
  if (flipCard) {
    flipCard.classList.toggle("flipped");
  }
}
```

### **2. Estrutura HTML**

```html
<div class="flip-card-container">
  <!-- Botão de Flip -->
  <button class="flip-card-btn" onclick="toggleCardFlip('${aluno.ID_Unico}')">
    <svg>...</svg>
  </button>

  <div class="flip-card" id="flipCard-${aluno.ID_Unico}">
    <!-- FRENTE DO CARD -->
    <div class="flip-card-front">
      <!-- Conteúdo original do card -->
    </div>

    <!-- VERSO DO CARD -->
    <div class="flip-card-back">
      <div class="detailed-grades">
        <!-- Seções por matéria -->
        <div class="grade-section">
          <div class="grade-section-title">
            <span class="grade-section-icon">📚</span>
            ${aluno.Origem}
          </div>
          <!-- Grid de notas -->
        </div>

        <!-- Mundo do Trabalho -->
        <!-- Convívio -->
        <!-- Média Geral -->
      </div>
    </div>
  </div>
</div>
```

### **3. Estilos CSS Principais**

#### **Animação de Flip 3D**:

```css
.flip-card {
  transform-style: preserve-3d;
  transition: transform 0.6s ease;
}

.flip-card.flipped {
  transform: rotateY(180deg);
}

.flip-card-front,
.flip-card-back {
  backface-visibility: hidden;
}

.flip-card-back {
  transform: rotateY(180deg);
}
```

#### **Botão de Flip**:

```css
.flip-card-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 20;
  background: var(--color-bg-primary);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  transition: all 0.3s ease;
}

.flip-card-btn:hover {
  transform: scale(1.1);
  background: var(--color-secondary);
}
```

#### **Layout das Notas Detalhadas**:

```css
.grade-section {
  background: rgba(244, 196, 48, 0.05);
  border: 1px solid rgba(244, 196, 48, 0.15);
  border-radius: var(--border-radius-md);
  padding: 1rem;
}

.grade-section-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

.overall-average {
  background: linear-gradient(
    135deg,
    rgba(244, 196, 48, 0.15),
    rgba(244, 196, 48, 0.08)
  );
  border: 2px solid rgba(244, 196, 48, 0.3);
  text-align: center;
}
```

## 🎨 **Design e UX**

### **Elementos Visuais**:

- 🔄 **Animação 3D Suave**: Transição de 0.6s para flip natural
- 🎯 **Botão Intuitivo**: Posicionado no canto superior direito
- 🌈 **Cores Temáticas**: Cada matéria com ícone único
- 📱 **Responsivo**: Layout adaptado para mobile

### **Ícones por Matéria**:

- 📚 **Curso Principal**: Ícone de livros
- 🌍 **Mundo do Trabalho**: Globo terrestre
- 🤝 **Convívio**: Mãos se cumprimentando

### **Estados Visuais**:

- ✅ **Notas Preenchidas**: Destaque colorido
- ➖ **Notas Vazias**: Estilo esmaecido
- 🎯 **Média Geral**: Destaque especial dourado

## 📊 **Cálculo da Média Geral**

```javascript
const todasNotas = [
  notasCurso.bim1,
  notasCurso.bim2,
  notasCurso.bim3,
  notasMundoTrabalho.bim1,
  notasMundoTrabalho.bim2,
  notasMundoTrabalho.bim3,
  notasConvivio.bim1,
  notasConvivio.bim2,
  notasConvivio.bim3,
]
  .filter((nota) => nota !== "-" && nota !== "" && !isNaN(parseFloat(nota)))
  .map((nota) => parseFloat(nota));

const mediaGeral =
  todasNotas.length > 0
    ? (
        todasNotas.reduce((sum, nota) => sum + nota, 0) / todasNotas.length
      ).toFixed(1)
    : "-";
```

## 📱 **Responsividade**

### **Mobile (≤ 768px)**:

- Botão reduzido: 32x32px
- Grid mantido: 3 colunas
- Fonte ajustada para legibilidade
- Padding otimizado

### **Desktop**:

- Botão padrão: 36x36px
- Hover effects completos
- Transições suaves

## 🚀 **Benefícios Implementados**

1. **📈 Visão Completa**: Professor vê todas as notas de uma vez
2. **🎯 Organização**: Notas agrupadas por matéria
3. **📊 Cálculo Automático**: Média geral calculada automaticamente
4. **🎨 UX Intuitiva**: Flip card natural e responsivo
5. **💾 Performance**: Dados calculados no client-side
6. **🔄 Reversível**: Fácil retorno à visão original

## 🎯 **Casos de Uso**

- **👨‍🏫 Professor**: Visão detalhada do desempenho por matéria
- **📋 Coordenação**: Análise completa do aluno
- **📈 Acompanhamento**: Evolução por bimestre/matéria
- **🎯 Intervenção**: Identificação de matérias críticas

---

**Status**: ✅ Implementado e Funcional
**Compatibilidade**: Todos os dispositivos e navegadores modernos
**Performance**: Otimizado para carregamento rápido
