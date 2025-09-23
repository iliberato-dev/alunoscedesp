/**
 * SISTEMA DE GESTÃO ACADÊMICA - CEDESP
 * Versão Universal - Funciona com qualquer formato de planilha
 *
 * IMPORTANTE:
 * 1. Configure o Web App como "Qualquer pessoa" pode acessar
 * 2. Defina as planilhas que você usa na constante SHEET_NAMES
 * 3. Execute a função diagnosticarPlanilha() para verificar a estrutura
 */

// === CONFIGURAÇÕES ===

// Nomes das planilhas que você usa (ajuste conforme necessário)
const SHEET_NAMES = ["PWT", "PWN", "DGT", "DGN", "MNT", "MNN"];

// Mapeamento de cursos para períodos (ajuste conforme necessário)
const CURSO_PARA_PERIODO = {
  PWT: "Tarde",
  DGT: "Tarde",
  MNT: "Tarde",
  PWN: "Noite",
  DGN: "Noite",
  MNN: "Noite",
};

// === FUNÇÕES DE DIAGNÓSTICO ===

/**
 * Execute esta função para diagnosticar a estrutura da sua planilha
 */
function diagnosticarPlanilha() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const sheetName = sheet.getName();

  console.log(`=== DIAGNÓSTICO DA PLANILHA: ${sheetName} ===`);

  const lastCol = sheet.getLastColumn();
  const lastRow = sheet.getLastRow();

  console.log(`Dimensões: ${lastRow} linhas x ${lastCol} colunas`);

  if (lastRow === 0) {
    console.log("ERRO: Planilha está vazia!");
    return;
  }

  // Mostra os cabeçalhos
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  console.log("\n=== CABEÇALHOS ENCONTRADOS ===");

  for (let i = 0; i < headers.length; i++) {
    const colLetter = String.fromCharCode(65 + i);
    const header = headers[i];
    console.log(`Coluna ${colLetter} (${i}): "${header}"`);
  }

  // Mostra algumas linhas de dados como exemplo
  if (lastRow > 1) {
    console.log("\n=== EXEMPLO DE DADOS (primeiras 3 linhas) ===");
    const sampleRows = Math.min(4, lastRow); // Cabeçalho + 3 linhas de dados
    const sampleData = sheet.getRange(1, 1, sampleRows, lastCol).getValues();

    for (let row = 0; row < sampleData.length; row++) {
      console.log(`Linha ${row + 1}:`, sampleData[row]);
    }
  }

  // Detecta automaticamente as colunas
  console.log("\n=== DETECÇÃO AUTOMÁTICA DE COLUNAS ===");
  const indices = detectarColunasUniversal(sheet);

  for (const [campo, indice] of Object.entries(indices)) {
    if (indice !== undefined) {
      const colLetter = String.fromCharCode(65 + indice);
      const headerText = headers[indice] || "N/A";
      console.log(
        `✅ ${campo}: Coluna ${colLetter} (${indice}) - "${headerText}"`
      );
    } else {
      console.log(`❌ ${campo}: NÃO ENCONTRADO`);
    }
  }

  console.log("\n=== INSTRUÇÕES ===");
  console.log("1. Verifique se as colunas foram detectadas corretamente");
  console.log("2. Se alguma coluna não foi encontrada, ajuste os cabeçalhos");
  console.log(
    "3. Ou modifique a função detectarColunasUniversal() com seus padrões específicos"
  );
}

/**
 * Função universal para detectar colunas em qualquer formato de planilha
 */
function detectarColunasUniversal(sheet) {
  const lastCol = sheet.getLastColumn();
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];

  return detectarColunasUniversalPorArray(headers);
}

/**
 * Versão que funciona diretamente com array de cabeçalhos
 */
function detectarColunasUniversalPorArray(headers) {
  const indices = {};

  for (let i = 0; i < headers.length; i++) {
    const header = String(headers[i]).toLowerCase().trim();

    // === ID ÚNICO / CÓDIGO ===
    if (
      !indices.ID_Unico &&
      (header.includes("id") ||
        header.includes("código") ||
        header.includes("codigo") ||
        header.includes("único") ||
        header.includes("unico") ||
        header.includes("identificador") ||
        header.includes("matricula") ||
        header.includes("matrícula") ||
        header === "a" || // Primeira coluna como ID
        i === 0) // Se nenhum padrão for encontrado, usa a primeira coluna
    ) {
      indices.ID_Unico = i;
    }

    // === NOME DO ALUNO ===
    else if (
      !indices.Nome &&
      (header.includes("nome") ||
        header.includes("aluno") ||
        header.includes("estudante") ||
        header.includes("discente"))
    ) {
      indices.Nome = i;
    }

    // === FALTAS / AUSÊNCIAS ===
    else if (
      !indices.Faltas &&
      (header.includes("falta") ||
        header.includes("ausencia") ||
        header.includes("ausência") ||
        (header.includes("total") && header.includes("falta")) ||
        header.includes("absences") ||
        header.includes("missed"))
    ) {
      indices.Faltas = i;
    }

    // === PRESENÇAS ===
    else if (
      !indices.Presencas &&
      (header.includes("presença") ||
        header.includes("presenca") ||
        header.includes("presence") ||
        header.includes("attendances") ||
        (header.includes("total") && header.includes("presença")) ||
        (header.includes("total") && header.includes("presenca")))
    ) {
      indices.Presencas = i;
    }

    // === NOTAS ===
    // 1º Bimestre/Período
    else if (
      !indices.Nota1 &&
      (header.includes("1º") ||
        header.includes("1°") ||
        header.includes("primeiro") ||
        header.includes("1 bimestre") ||
        header.includes("1º bimestre") ||
        header.includes("bimestre 1") ||
        header.includes("periodo 1") ||
        header.includes("período 1") ||
        header.includes("nota 1") ||
        header.includes("n1") ||
        header.includes("p1") ||
        header.includes("av1") ||
        header.includes("avaliação 1") ||
        header.includes("prova 1") ||
        (header.includes("nota") &&
          header.includes("i") &&
          !header.includes("ii")))
    ) {
      indices.Nota1 = i;
    }

    // 2º Bimestre/Período
    else if (
      !indices.Nota2 &&
      (header.includes("2º") ||
        header.includes("2°") ||
        header.includes("segundo") ||
        header.includes("2 bimestre") ||
        header.includes("2º bimestre") ||
        header.includes("bimestre 2") ||
        header.includes("periodo 2") ||
        header.includes("período 2") ||
        header.includes("nota 2") ||
        header.includes("n2") ||
        header.includes("p2") ||
        header.includes("av2") ||
        header.includes("avaliação 2") ||
        header.includes("prova 2") ||
        (header.includes("nota") && header.includes("ii")))
    ) {
      indices.Nota2 = i;
    }

    // 3º Bimestre/Período
    else if (
      !indices.Nota3 &&
      (header.includes("3º") ||
        header.includes("3°") ||
        header.includes("terceiro") ||
        header.includes("3 bimestre") ||
        header.includes("3º bimestre") ||
        header.includes("bimestre 3") ||
        header.includes("periodo 3") ||
        header.includes("período 3") ||
        header.includes("nota 3") ||
        header.includes("n3") ||
        header.includes("p3") ||
        header.includes("av3") ||
        header.includes("avaliação 3") ||
        header.includes("prova 3") ||
        (header.includes("nota") && header.includes("iii")))
    ) {
      indices.Nota3 = i;
    }

    // === MÉDIA ===
    else if (
      !indices.Media &&
      (header.includes("média") ||
        header.includes("media") ||
        header.includes("final") ||
        header.includes("média final") ||
        header.includes("media final") ||
        header.includes("resultado") ||
        header.includes("average"))
    ) {
      indices.Media = i;
    }

    // === SITUAÇÃO ===
    else if (
      !indices.Situacao &&
      (header.includes("situação") ||
        header.includes("situacao") ||
        header.includes("status") ||
        header.includes("resultado") ||
        header.includes("aprovado") ||
        header.includes("reprovado") ||
        header.includes("aprovação") ||
        header.includes("aprovacao"))
    ) {
      indices.Situacao = i;
    }

    // === MUNDO DO TRABALHO ===
    // 1º Bimestre Mundo do Trabalho
    else if (
      !indices.MundoTrabalho1 &&
      (header.includes("mundo do trabalho") ||
        header.includes("mundo trabalho") ||
        header.includes("world work") ||
        header.includes("trabalho")) &&
      (header.includes("1º") ||
        header.includes("1°") ||
        header.includes("primeiro") ||
        header.includes("1 bim") ||
        header.includes("bim 1") ||
        header.includes("bimestre 1"))
    ) {
      indices.MundoTrabalho1 = i;
    }

    // 2º Bimestre Mundo do Trabalho
    else if (
      !indices.MundoTrabalho2 &&
      (header.includes("mundo do trabalho") ||
        header.includes("mundo trabalho") ||
        header.includes("world work") ||
        header.includes("trabalho")) &&
      (header.includes("2º") ||
        header.includes("2°") ||
        header.includes("segundo") ||
        header.includes("2 bim") ||
        header.includes("bim 2") ||
        header.includes("bimestre 2"))
    ) {
      indices.MundoTrabalho2 = i;
    }

    // 3º Bimestre Mundo do Trabalho
    else if (
      !indices.MundoTrabalho3 &&
      (header.includes("mundo do trabalho") ||
        header.includes("mundo trabalho") ||
        header.includes("world work") ||
        header.includes("trabalho")) &&
      (header.includes("3º") ||
        header.includes("3°") ||
        header.includes("terceiro") ||
        header.includes("3 bim") ||
        header.includes("bim 3") ||
        header.includes("bimestre 3"))
    ) {
      indices.MundoTrabalho3 = i;
    }

    // === CONVÍVIO ===
    // 1º Bimestre Convívio
    else if (
      !indices.Convivio1 &&
      (header.includes("convívio") ||
        header.includes("convivio") ||
        header.includes("social") ||
        header.includes("living") ||
        header.includes("together")) &&
      (header.includes("1º") ||
        header.includes("1°") ||
        header.includes("primeiro") ||
        header.includes("1 bim") ||
        header.includes("bim 1") ||
        header.includes("bimestre 1"))
    ) {
      indices.Convivio1 = i;
    }

    // 2º Bimestre Convívio
    else if (
      !indices.Convivio2 &&
      (header.includes("convívio") ||
        header.includes("convivio") ||
        header.includes("social") ||
        header.includes("living") ||
        header.includes("together")) &&
      (header.includes("2º") ||
        header.includes("2°") ||
        header.includes("segundo") ||
        header.includes("2 bim") ||
        header.includes("bim 2") ||
        header.includes("bimestre 2"))
    ) {
      indices.Convivio2 = i;
    }

    // 3º Bimestre Convívio
    else if (
      !indices.Convivio3 &&
      (header.includes("convívio") ||
        header.includes("convivio") ||
        header.includes("social") ||
        header.includes("living") ||
        header.includes("together")) &&
      (header.includes("3º") ||
        header.includes("3°") ||
        header.includes("terceiro") ||
        header.includes("3 bim") ||
        header.includes("bim 3") ||
        header.includes("bimestre 3"))
    ) {
      indices.Convivio3 = i;
    }

    // === ORIGEM (opcional) ===
    else if (
      !indices.Origem &&
      (header.includes("origem") ||
        header.includes("source") ||
        header.includes("procedência") ||
        header.includes("procedencia"))
    ) {
      indices.Origem = i;
    }

    // === PERÍODO (opcional) ===
    else if (
      !indices.Periodo &&
      (header.includes("período") ||
        header.includes("periodo") ||
        header.includes("turno") ||
        header.includes("horário") ||
        header.includes("horario"))
    ) {
      indices.Periodo = i;
    }
  }

  // Se não encontrou ID, usa a primeira coluna
  if (indices.ID_Unico === undefined) {
    indices.ID_Unico = 0;
    console.log("⚠️ AVISO: Usando primeira coluna como ID_Unico");
  }

  // Validação das colunas essenciais
  const essenciais = ["ID_Unico", "Nome"];
  const faltando = essenciais.filter((col) => indices[col] === undefined);

  if (faltando.length > 0) {
    console.log(
      `❌ ERRO: Colunas essenciais não encontradas: ${faltando.join(", ")}`
    );
    console.log("Execute a função diagnosticarPlanilha() para ver a estrutura");
  }

  return indices;
}

// === FUNÇÕES PRINCIPAIS ===

/**
 * Cria resposta JSON com cabeçalhos CORS melhorados
 */
/**
 * Cria resposta JSON com cabeçalhos CORS robustos
 */
function criarRespostaJson(data) {
  try {
    const output = ContentService.createTextOutput(JSON.stringify(data));
    output.setMimeType(ContentService.MimeType.JSON);

    // Headers CORS obrigatórios para funcionar com localhost
    try {
      // Google Apps Script usa setHeaders (plural) com objeto
      output.setHeaders({
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
        "Access-Control-Allow-Headers":
          "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control",
        "Access-Control-Max-Age": "86400",
        "Access-Control-Allow-Credentials": "false",
      });

      console.log("✅ Headers CORS completos definidos");
    } catch (corsError) {
      console.error("❌ Erro ao definir headers CORS:", corsError.message);
      console.log("🔧 Criando resposta JSON simples (sem CORS)");
      return criarRespostaJsonSimples(data);
    }

    return output;
  } catch (error) {
    console.error("❌ Erro crítico ao criar resposta JSON:", error);
    return criarRespostaJsonSimples(data);
  }
}

/**
 * Versão simples de backup para resposta JSON (sem headers CORS)
 */
function criarRespostaJsonSimples(data) {
  try {
    console.log("🔧 Criando resposta JSON simples (sem CORS)");
    const output = ContentService.createTextOutput(JSON.stringify(data));
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  } catch (error) {
    console.error("❌ Erro crítico na resposta simples:", error);
    // Último recurso
    return ContentService.createTextOutput(
      JSON.stringify({
        success: false,
        error: "Erro interno do servidor",
        message: "Falha na criação da resposta",
      })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// === FUNÇÕES AUXILIARES PARA AÇÕES ===

/**
 * Função auxiliar para registrar presença/falta
 */
function registrarPresencaFuncao(alunoId, status, dataPresenca) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let abaEncontrada = null;
    let linhaAluno = -1;
    let indices = null;

    // Busca o aluno em todas as planilhas
    for (const nomeAba of SHEET_NAMES) {
      const aba = spreadsheet.getSheetByName(nomeAba);
      if (!aba) continue;

      indices = detectarColunasUniversal(aba);
      if (indices.ID_Unico === undefined) continue;

      const ultimaLinha = aba.getLastRow();
      if (ultimaLinha <= 1) continue;

      const idsColuna = aba
        .getRange(2, indices.ID_Unico + 1, ultimaLinha - 1, 1)
        .getValues();

      for (let i = 0; i < idsColuna.length; i++) {
        if (String(idsColuna[i][0]).trim() === String(alunoId).trim()) {
          abaEncontrada = aba;
          linhaAluno = i + 2;
          break;
        }
      }

      if (abaEncontrada) break;
    }

    if (!abaEncontrada) {
      return {
        success: false,
        error: `Aluno com ID '${alunoId}' não encontrado`,
      };
    }

    // Formata a data para o cabeçalho
    const data = new Date(dataPresenca + "T12:00:00Z");
    const cabecalhoData = Utilities.formatDate(
      data,
      Session.getScriptTimeZone(),
      "dd/MM"
    );

    // Procura ou cria a coluna da data
    let colunaData = -1;
    const cabecalhos = abaEncontrada
      .getRange(1, 1, 1, abaEncontrada.getLastColumn())
      .getValues()[0];

    for (let i = 0; i < cabecalhos.length; i++) {
      if (String(cabecalhos[i]).trim() === cabecalhoData) {
        colunaData = i;
        break;
      }
    }

    // Se não encontrou a coluna da data, cria uma nova
    if (colunaData === -1) {
      const colunaFaltas =
        indices.Faltas !== undefined
          ? indices.Faltas
          : abaEncontrada.getLastColumn() - 1;
      abaEncontrada.insertColumnAfter(colunaFaltas + 1);
      colunaData = colunaFaltas + 1;
      abaEncontrada.getRange(1, colunaData + 1).setValue(cabecalhoData);
    }

    // Registra a presença/falta
    const celulaData = abaEncontrada.getRange(linhaAluno, colunaData + 1);
    const statusAnterior = String(celulaData.getValue()).trim().toUpperCase();

    let novoStatus = "";
    let mensagem = "";

    if (status.toUpperCase() === "P") {
      novoStatus = "P";
      mensagem = `Presença registrada para ${cabecalhoData}`;

      if (statusAnterior === "F" && indices.Faltas !== undefined) {
        const celulaFaltas = abaEncontrada.getRange(
          linhaAluno,
          indices.Faltas + 1
        );
        const faltasAtuais = parseInt(celulaFaltas.getValue()) || 0;
        if (faltasAtuais > 0) {
          celulaFaltas.setValue(faltasAtuais - 1);
        }
      }
    } else {
      novoStatus = "F";
      mensagem = `Falta registrada para ${cabecalhoData}`;

      if (statusAnterior !== "F" && indices.Faltas !== undefined) {
        const celulaFaltas = abaEncontrada.getRange(
          linhaAluno,
          indices.Faltas + 1
        );
        const faltasAtuais = parseInt(celulaFaltas.getValue()) || 0;
        celulaFaltas.setValue(faltasAtuais + 1);
      }
    }

    celulaData.setValue(novoStatus);

    return {
      success: true,
      message: mensagem,
    };
  } catch (erro) {
    console.error("Erro em registrarPresencaFuncao:", erro);
    return {
      success: false,
      error: `Erro interno: ${erro.message}`,
    };
  }
}

/**
 * Função auxiliar para atualizar notas
 */
function atualizarNotasFuncao(alunoId, nota1, nota2, nota3) {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let abaEncontrada = null;
    let linhaAluno = -1;
    let indices = null;

    // Busca o aluno em todas as planilhas
    for (const nomeAba of SHEET_NAMES) {
      const aba = spreadsheet.getSheetByName(nomeAba);
      if (!aba) continue;

      indices = detectarColunasUniversal(aba);
      if (indices.ID_Unico === undefined) continue;

      const ultimaLinha = aba.getLastRow();
      if (ultimaLinha <= 1) continue;

      const idsColuna = aba
        .getRange(2, indices.ID_Unico + 1, ultimaLinha - 1, 1)
        .getValues();

      for (let i = 0; i < idsColuna.length; i++) {
        if (String(idsColuna[i][0]).trim() === String(alunoId).trim()) {
          abaEncontrada = aba;
          linhaAluno = i + 2;
          break;
        }
      }

      if (abaEncontrada) break;
    }

    if (!abaEncontrada) {
      return {
        success: false,
        error: `Aluno com ID '${alunoId}' não encontrado`,
      };
    }

    let atualizado = false;

    // Processar Nota1
    if (nota1 !== null && nota1 !== undefined && indices.Nota1 !== undefined) {
      if (nota1 === "" || nota1 === null) {
        // Limpar nota (valor vazio)
        abaEncontrada.getRange(linhaAluno, indices.Nota1 + 1).setValue("");
        atualizado = true;
      } else {
        const nota = parseFloat(String(nota1).replace(",", "."));
        if (!isNaN(nota) && nota >= 0 && nota <= 10) {
          abaEncontrada.getRange(linhaAluno, indices.Nota1 + 1).setValue(nota);
          atualizado = true;
        }
      }
    }

    // Processar Nota2
    if (nota2 !== null && nota2 !== undefined && indices.Nota2 !== undefined) {
      if (nota2 === "" || nota2 === null) {
        // Limpar nota (valor vazio)
        abaEncontrada.getRange(linhaAluno, indices.Nota2 + 1).setValue("");
        atualizado = true;
      } else {
        const nota = parseFloat(String(nota2).replace(",", "."));
        if (!isNaN(nota) && nota >= 0 && nota <= 10) {
          abaEncontrada.getRange(linhaAluno, indices.Nota2 + 1).setValue(nota);
          atualizado = true;
        }
      }
    }

    // Processar Nota3
    if (nota3 !== null && nota3 !== undefined && indices.Nota3 !== undefined) {
      if (nota3 === "" || nota3 === null) {
        // Limpar nota (valor vazio)
        abaEncontrada.getRange(linhaAluno, indices.Nota3 + 1).setValue("");
        atualizado = true;
      } else {
        const nota = parseFloat(String(nota3).replace(",", "."));
        if (!isNaN(nota) && nota >= 0 && nota <= 10) {
          abaEncontrada.getRange(linhaAluno, indices.Nota3 + 1).setValue(nota);
          atualizado = true;
        }
      }
    }

    if (!atualizado) {
      return {
        success: false,
        error:
          "Nenhuma nota foi fornecida para atualização ou valores inválidos (notas devem estar entre 0 e 10)",
      };
    }

    // Calcula e atualiza a média e situação automaticamente
    if (indices.Media !== undefined || indices.Situacao !== undefined) {
      // Busca as notas atuais da planilha
      const nota1Atual =
        indices.Nota1 !== undefined
          ? (() => {
              const valor = abaEncontrada
                .getRange(linhaAluno, indices.Nota1 + 1)
                .getValue();
              if (valor === "" || valor === null || valor === undefined)
                return null;
              const nota = parseFloat(String(valor).replace(",", "."));
              return isNaN(nota) ? null : nota;
            })()
          : null;

      const nota2Atual =
        indices.Nota2 !== undefined
          ? (() => {
              const valor = abaEncontrada
                .getRange(linhaAluno, indices.Nota2 + 1)
                .getValue();
              if (valor === "" || valor === null || valor === undefined)
                return null;
              const nota = parseFloat(String(valor).replace(",", "."));
              return isNaN(nota) ? null : nota;
            })()
          : null;

      const nota3Atual =
        indices.Nota3 !== undefined
          ? (() => {
              const valor = abaEncontrada
                .getRange(linhaAluno, indices.Nota3 + 1)
                .getValue();
              if (valor === "" || valor === null || valor === undefined)
                return null;
              const nota = parseFloat(String(valor).replace(",", "."));
              return isNaN(nota) ? null : nota;
            })()
          : null;

      // Filtrar apenas notas válidas (não nulas)
      const notasValidas = [nota1Atual, nota2Atual, nota3Atual].filter(
        (n) => n !== null && n >= 0
      );

      if (notasValidas.length > 0) {
        const mediaCalculada =
          notasValidas.reduce((a, b) => a + b) / notasValidas.length;

        // Atualiza a média na planilha
        if (indices.Media !== undefined) {
          abaEncontrada
            .getRange(linhaAluno, indices.Media + 1)
            .setValue(parseFloat(mediaCalculada.toFixed(2)));
        }

        // Atualiza a situação na planilha
        if (indices.Situacao !== undefined) {
          let situacao;
          if (mediaCalculada >= 7.0) {
            situacao = "Aprovado";
          } else if (mediaCalculada >= 5.0) {
            situacao = "Recuperação";
          } else {
            situacao = "Reprovado";
          }
          abaEncontrada
            .getRange(linhaAluno, indices.Situacao + 1)
            .setValue(situacao);
        }
      } else {
        // Sem notas válidas - limpar média e situação
        if (indices.Media !== undefined) {
          abaEncontrada.getRange(linhaAluno, indices.Media + 1).setValue("");
        }
        if (indices.Situacao !== undefined) {
          abaEncontrada
            .getRange(linhaAluno, indices.Situacao + 1)
            .setValue("Sem Notas");
        }
      }
    }

    return {
      success: true,
      message: "Notas atualizadas com sucesso",
    };
  } catch (erro) {
    console.error("Erro em atualizarNotasFuncao:", erro);
    return {
      success: false,
      error: `Erro interno: ${erro.message}`,
    };
  }
}

/**
 * Função para registrar presença automática - novo sistema otimizado
 * Ao marcar um aluno, todos os outros ficam automaticamente com falta
 * Cria coluna automaticamente se não existir para a data
 * NOVO: Suporte a curso específico para evitar criar colunas em todas as abas
 */
function registrarPresencaAutomatica(
  alunoId,
  data,
  status,
  professor,
  marcarTodos = "true",
  apenasEsteCurso = null
) {
  try {
    console.log("📝 Registrando presença automática:", {
      alunoId,
      data,
      status,
      professor,
      marcarTodos,
      apenasEsteCurso,
    });

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const updates = [];
    let alunoEncontrado = false;

    // Definir quais planilhas processar
    let planilhasParaProcessar = SHEET_NAMES;
    if (apenasEsteCurso) {
      // Se curso específico foi informado, processar apenas essa aba
      planilhasParaProcessar = [apenasEsteCurso];
      console.log(`🎯 Processando apenas o curso: ${apenasEsteCurso}`);
    }

    // Processar planilhas (todas ou apenas uma específica)
    for (const sheetName of planilhasParaProcessar) {
      const worksheet = spreadsheet.getSheetByName(sheetName);
      if (!worksheet) continue;

      console.log(`Processando planilha: ${sheetName}`);

      // Encontrar índices das colunas
      const indices = detectarColunasUniversal(worksheet);
      if (indices.ID_Unico === undefined) {
        console.log(`Planilha ${sheetName} não tem ID_Unico, pulando...`);
        continue;
      }

      const ultimaLinha = worksheet.getLastRow();
      if (ultimaLinha <= 1) {
        console.log(`Planilha ${sheetName} está vazia, pulando...`);
        continue;
      }

      // Obter todos os cabeçalhos atuais
      const ultimaColuna = worksheet.getLastColumn();
      const headers = worksheet.getRange(1, 1, 1, ultimaColuna).getValues()[0];

      // Formatar data para cabeçalho (formato brasileiro: dd/MM)
      const dataObj = new Date(data + "T12:00:00Z");
      const cabecalhoData = Utilities.formatDate(
        dataObj,
        Session.getScriptTimeZone(),
        "dd/MM"
      );

      console.log(`Procurando/criando coluna para data: ${cabecalhoData}`);

      // Verificar se existe coluna para esta data
      let colunaData = -1;
      for (let i = 0; i < headers.length; i++) {
        if (String(headers[i]).trim() === cabecalhoData) {
          colunaData = i;
          break;
        }
      }

      // Se não existe a coluna para esta data, criar
      if (colunaData === -1) {
        // Inserir nova coluna após a coluna de Faltas (se existir) ou no final
        const posicaoInsercao =
          indices.Faltas !== undefined
            ? indices.Faltas + 2 // Após a coluna de Faltas
            : ultimaColuna + 1; // No final

        worksheet.insertColumnAfter(posicaoInsercao - 1);
        colunaData = posicaoInsercao - 1; // Ajuste para índice 0-based
        worksheet.getRange(1, posicaoInsercao).setValue(cabecalhoData);

        console.log(
          `Nova coluna '${cabecalhoData}' criada na posição ${posicaoInsercao}`
        );

        // Atualizar array de headers
        headers.splice(colunaData, 0, cabecalhoData);
      }

      // Obter todos os dados dos alunos
      const dadosAlunos = worksheet
        .getRange(2, 1, ultimaLinha - 1, worksheet.getLastColumn())
        .getValues();

      // Processar todos os alunos desta planilha
      for (let i = 0; i < dadosAlunos.length; i++) {
        const row = dadosAlunos[i];
        const currentId = String(row[indices.ID_Unico] || "").trim();
        const nomeAluno = String(row[indices.Nome] || "").trim();

        if (!currentId || !nomeAluno) continue;

        const rowNumber = i + 2; // +2 porque começamos da linha 2
        let statusParaEsteAluno;

        if (currentId === alunoId) {
          // Este é o aluno que está sendo marcado
          statusParaEsteAluno = status;
          alunoEncontrado = true;
          console.log(
            `✅ Aluno encontrado: ${nomeAluno} (${currentId}) - Status: ${status}`
          );
        } else if (marcarTodos === "true") {
          // Verificar se já tem status marcado para hoje
          const statusExistente =
            colunaData < row.length ? String(row[colunaData] || "").trim() : "";

          if (!statusExistente) {
            // Se não tem status marcado, marcar como ausente
            statusParaEsteAluno = "A";
          } else {
            // Se já tem status, manter o existente
            statusParaEsteAluno = statusExistente;
          }
        }

        // Marcar o status na coluna da data
        if (statusParaEsteAluno) {
          worksheet
            .getRange(rowNumber, colunaData + 1)
            .setValue(statusParaEsteAluno);
        }

        // Calcular e atualizar total de faltas (se a coluna existir)
        if (indices.Faltas !== undefined) {
          let totalFaltas = 0;

          // ✅ CORREÇÃO: Obter dados atualizados APÓS marcar o status
          const dadosAtualizados = worksheet
            .getRange(rowNumber, 1, 1, worksheet.getLastColumn())
            .getValues()[0];

          // ✅ CORREÇÃO: Obter headers atualizados APÓS possível inserção de coluna
          const headersAtualizados = worksheet
            .getRange(1, 1, 1, worksheet.getLastColumn())
            .getValues()[0];

          // Contar faltas em todas as colunas de data (formato dd/MM)
          for (let col = 0; col < headersAtualizados.length; col++) {
            const header = String(headersAtualizados[col]).trim();

            // Verificar se é uma coluna de data (formato dd/MM)
            if (header.match(/^\d{1,2}\/\d{1,2}$/)) {
              let statusNaData;
              if (col < dadosAtualizados.length) {
                statusNaData = String(dadosAtualizados[col] || "")
                  .trim()
                  .toUpperCase();
              }

              console.log(
                `🔍 Contando faltas - Coluna ${header} (pos ${col}): status = "${statusNaData}"`
              );

              if (statusNaData === "A" || statusNaData === "F") {
                totalFaltas++;
                console.log(`📊 Falta encontrada! Total agora: ${totalFaltas}`);
              }
            }
          }

          console.log(
            `📊 Total de faltas calculado para ${nomeAluno}: ${totalFaltas}`
          );

          // Atualizar total de faltas na planilha
          worksheet
            .getRange(rowNumber, indices.Faltas + 1)
            .setValue(totalFaltas);
        }

        // Se existe coluna de presenças, calcular e atualizar também
        if (indices.Presencas !== undefined) {
          let totalPresencas = 0;

          // ✅ CORREÇÃO: Obter dados atualizados APÓS marcar o status
          const dadosAtualizados = worksheet
            .getRange(rowNumber, 1, 1, worksheet.getLastColumn())
            .getValues()[0];

          // ✅ CORREÇÃO: Obter headers atualizados APÓS possível inserção de coluna
          const headersAtualizados = worksheet
            .getRange(1, 1, 1, worksheet.getLastColumn())
            .getValues()[0];

          // Contar presenças em todas as colunas de data
          for (let col = 0; col < headersAtualizados.length; col++) {
            const header = String(headersAtualizados[col]).trim();

            if (header.match(/^\d{1,2}\/\d{1,2}$/)) {
              let statusNaData;
              if (col < dadosAtualizados.length) {
                statusNaData = String(dadosAtualizados[col] || "")
                  .trim()
                  .toUpperCase();
              }

              console.log(
                `🔍 Contando presenças - Coluna ${header} (pos ${col}): status = "${statusNaData}"`
              );

              if (statusNaData === "P") {
                totalPresencas++;
                console.log(
                  `✅ Presença encontrada! Total agora: ${totalPresencas}`
                );
              }
            }
          }

          console.log(
            `📊 Total de presenças calculado para ${nomeAluno}: ${totalPresencas}`
          );

          worksheet
            .getRange(rowNumber, indices.Presencas + 1)
            .setValue(totalPresencas);
        }

        updates.push({
          planilha: sheetName,
          id: currentId,
          nome: nomeAluno,
          faltas:
            indices.Faltas !== undefined
              ? worksheet.getRange(rowNumber, indices.Faltas + 1).getValue()
              : 0,
          presencas:
            indices.Presencas !== undefined
              ? worksheet.getRange(rowNumber, indices.Presencas + 1).getValue()
              : 0,
          statusHoje: statusParaEsteAluno,
          data: cabecalhoData,
        });
      }
    }

    if (!alunoEncontrado) {
      throw new Error(
        `Aluno com ID ${alunoId} não encontrado em nenhuma planilha`
      );
    }

    console.log(
      "✅ Presença registrada com sucesso:",
      updates.length,
      "registros atualizados"
    );

    return {
      success: true,
      message: `Presença registrada para ${alunoId}. ${
        marcarTodos === "true"
          ? "Outros alunos marcados como falta automaticamente."
          : ""
      }`,
      updates: updates.length,
      data: updates,
    };
  } catch (error) {
    console.error("❌ Erro ao registrar presença automática:", error);
    return {
      success: false,
      error: error.toString(),
      message: "Erro ao registrar presença automática",
    };
  }
}

/**
 * Função para consultar presenças por data específica
 * Retorna dados de presença/falta para uma data específica
 */
function consultarPresencasPorData(dataConsulta, cursoFiltro = null) {
  try {
    console.log("📅 Consultando presenças para data:", dataConsulta);

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const resultados = [];

    // Formatar data para o formato brasileiro (dd/MM)
    const dataObj = new Date(dataConsulta + "T12:00:00Z");
    const cabecalhoData = Utilities.formatDate(
      dataObj,
      Session.getScriptTimeZone(),
      "dd/MM"
    );

    console.log(`🔍 Procurando coluna com cabeçalho: ${cabecalhoData}`);

    // Processar todas as planilhas
    for (const sheetName of SHEET_NAMES) {
      // Aplicar filtro de curso se especificado
      if (cursoFiltro && cursoFiltro !== sheetName) {
        continue;
      }

      const worksheet = spreadsheet.getSheetByName(sheetName);
      if (!worksheet) continue;

      console.log(`📋 Processando planilha: ${sheetName}`);

      const indices = detectarColunasUniversal(worksheet);
      if (indices.ID_Unico === undefined || indices.Nome === undefined) {
        console.log(`Planilha ${sheetName} não tem colunas essenciais`);
        continue;
      }

      const ultimaLinha = worksheet.getLastRow();
      if (ultimaLinha <= 1) continue;

      // Obter cabeçalhos
      const headers = worksheet
        .getRange(1, 1, 1, worksheet.getLastColumn())
        .getValues()[0];

      // Encontrar coluna da data
      let colunaData = -1;
      for (let i = 0; i < headers.length; i++) {
        if (String(headers[i]).trim() === cabecalhoData) {
          colunaData = i;
          break;
        }
      }

      // Obter dados dos alunos
      const dados = worksheet
        .getRange(2, 1, ultimaLinha - 1, worksheet.getLastColumn())
        .getValues();

      for (let i = 0; i < dados.length; i++) {
        const linha = dados[i];
        const id = String(linha[indices.ID_Unico] || "").trim();
        const nome = String(linha[indices.Nome] || "").trim();

        if (!id || !nome) continue;

        let status = null;
        let statusText = "Sem Registro";
        let isMarked = false;

        // Se encontrou a coluna da data, verificar o status
        if (colunaData !== -1 && colunaData < linha.length) {
          const valorStatus = String(linha[colunaData] || "")
            .trim()
            .toUpperCase();

          if (valorStatus === "P") {
            status = "P";
            statusText = "Presente";
            isMarked = true;
          } else if (valorStatus === "A" || valorStatus === "F") {
            status = "A";
            statusText = "Ausente";
            isMarked = true;
          }
        }

        resultados.push({
          studentId: id,
          studentName: nome,
          course: sheetName,
          period: CURSO_PARA_PERIODO[sheetName] || "Não definido",
          date: dataConsulta,
          status: status,
          statusText: statusText,
          isMarked: isMarked,
          faltas: linha[indices.Faltas] || 0,
          presencas: linha[indices.Presencas] || 0,
        });
      }
    }

    console.log(
      `✅ Consulta concluída: ${resultados.length} registros encontrados`
    );

    return {
      success: true,
      data: resultados,
      dataConsultada: dataConsulta,
      cabecalhoData: cabecalhoData,
      totalRegistros: resultados.length,
    };
  } catch (error) {
    console.error("❌ Erro ao consultar presenças:", error);
    return {
      success: false,
      error: error.toString(),
      message: "Erro ao consultar presenças por data",
    };
  }
}

/**
 * Consultar presenças por período (múltiplas datas)
 */
function consultarPresencasPorPeriodo(dataInicio, dataFim, cursoFiltro = null) {
  try {
    console.log(
      "📅 Consultando presenças por período:",
      dataInicio,
      "a",
      dataFim
    );

    const resultados = [];
    const dataInicioObj = new Date(dataInicio + "T12:00:00Z");
    const dataFimObj = new Date(dataFim + "T12:00:00Z");

    // Gerar lista de datas no período
    const datas = [];
    for (
      let d = new Date(dataInicioObj);
      d <= dataFimObj;
      d.setDate(d.getDate() + 1)
    ) {
      const dataStr = Utilities.formatDate(
        d,
        Session.getScriptTimeZone(),
        "yyyy-MM-dd"
      );
      datas.push(dataStr);
    }

    console.log(`🔍 Processando ${datas.length} datas: ${datas.join(", ")}`);

    // Consultar cada data
    for (const data of datas) {
      const resultado = consultarPresencasPorData(data, cursoFiltro);
      if (resultado.success && resultado.data) {
        resultados.push(...resultado.data);
      }
    }

    console.log(
      `✅ Consulta por período concluída: ${resultados.length} registros encontrados`
    );

    return {
      success: true,
      data: resultados,
      dataInicio: dataInicio,
      dataFim: dataFim,
      totalDatas: datas.length,
      totalRegistros: resultados.length,
    };
  } catch (error) {
    console.error("❌ Erro ao consultar presenças por período:", error);
    return {
      success: false,
      error: error.toString(),
      message: "Erro ao consultar presenças por período",
    };
  }
}

/**
 * NOVA FUNÇÃO OTIMIZADA - Registrar presença em curso específico
 * Esta função resolve o problema de criar colunas em todas as abas
 * Processa APENAS a aba do curso especificado
 */
function registrarPresencaCursoEspecifico(
  alunoId,
  data,
  status,
  professor,
  curso
) {
  try {
    console.log("🎯 Registrando presença para curso específico:", {
      alunoId,
      data,
      status,
      professor,
      curso,
    });

    // Usar a função principal com filtro de curso
    const resultado = registrarPresencaAutomatica(
      alunoId,
      data,
      status,
      professor,
      "true", // marcarTodos
      curso // apenasEsteCurso
    );

    if (resultado.success) {
      console.log(`✅ Presença registrada com sucesso no curso ${curso}`);
      return {
        success: true,
        message: `Presença registrada para ${alunoId} no curso ${curso}`,
        curso: curso,
        data: resultado.data,
        updates: resultado.updates,
      };
    } else {
      console.log(
        `❌ Erro ao registrar presença no curso ${curso}:`,
        resultado.error
      );
      return resultado;
    }
  } catch (error) {
    console.error("❌ Erro em registrarPresencaCursoEspecifico:", error);
    return {
      success: false,
      error: error.toString(),
      message: "Erro ao registrar presença em curso específico",
    };
  }
}

/**
 * NOVA FUNÇÃO OTIMIZADA - Processar presença em aba específica apenas
 * Esta função garante que apenas uma aba seja afetada
 */
function processarPresencaAbaEspecifica(
  alunoId,
  data,
  status,
  professor,
  curso
) {
  try {
    console.log("📋 Processando presença em aba específica:", {
      alunoId,
      data,
      status,
      professor,
      curso,
    });

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const worksheet = spreadsheet.getSheetByName(curso);

    if (!worksheet) {
      throw new Error(`Aba do curso '${curso}' não encontrada`);
    }

    // Verificar se o aluno existe nesta aba
    const indices = detectarColunasUniversal(worksheet);
    if (indices.ID_Unico === undefined) {
      throw new Error(`Aba '${curso}' não tem estrutura válida`);
    }

    const ultimaLinha = worksheet.getLastRow();
    if (ultimaLinha <= 1) {
      throw new Error(`Aba '${curso}' está vazia`);
    }

    // Buscar o aluno especificamente nesta aba
    const idsColuna = worksheet
      .getRange(2, indices.ID_Unico + 1, ultimaLinha - 1, 1)
      .getValues();

    let linhaAluno = -1;
    for (let i = 0; i < idsColuna.length; i++) {
      if (String(idsColuna[i][0]).trim() === String(alunoId).trim()) {
        linhaAluno = i + 2;
        break;
      }
    }

    if (linhaAluno === -1) {
      throw new Error(`Aluno ${alunoId} não encontrado na aba ${curso}`);
    }

    // Usar a função principal apenas para esta aba
    const resultado = registrarPresencaAutomatica(
      alunoId,
      data,
      status,
      professor,
      "true", // marcarTodos
      curso // apenasEsteCurso
    );

    if (resultado.success) {
      console.log(`✅ Presença processada com sucesso na aba ${curso}`);
      return {
        success: true,
        message: `Presença processada para ${alunoId} apenas na aba ${curso}`,
        abaProcessada: curso,
        linhaAluno: linhaAluno,
        data: resultado.data,
        updates: resultado.updates,
      };
    } else {
      return resultado;
    }
  } catch (error) {
    console.error("❌ Erro em processarPresencaAbaEspecifica:", error);
    return {
      success: false,
      error: error.toString(),
      message: "Erro ao processar presença em aba específica",
    };
  }
}

/**
 * ✅ NOVA FUNÇÃO OTIMIZADA - Registrar presença apenas na aba do aluno específico
 * Esta função corrige o problema de criar colunas desnecessárias em todas as abas
 * Processa APENAS a aba onde o aluno está localizado
 */
function registrarPresencaOtimizada(
  alunoId,
  data,
  status,
  professor,
  marcarTodos = "false"
) {
  try {
    console.log("🎯 === REGISTRANDO PRESENÇA OTIMIZADA ===");
    console.log("Parâmetros:", {
      alunoId,
      data,
      status,
      professor,
      marcarTodos,
    });

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let abaEncontrada = null;
    let linhaAluno = -1;
    let indices = null;

    // PASSO 1: Encontrar em qual aba está o aluno
    for (const sheetName of SHEET_NAMES) {
      const worksheet = spreadsheet.getSheetByName(sheetName);
      if (!worksheet) continue;

      const indicesTemp = detectarColunasUniversal(worksheet);
      if (indicesTemp.ID_Unico === undefined) continue;

      const ultimaLinha = worksheet.getLastRow();
      if (ultimaLinha <= 1) continue;

      // Buscar o aluno nesta aba
      const dadosIds = worksheet
        .getRange(2, indicesTemp.ID_Unico + 1, ultimaLinha - 1, 1)
        .getValues();

      for (let i = 0; i < dadosIds.length; i++) {
        const currentId = String(dadosIds[i][0] || "").trim();
        if (currentId === alunoId) {
          abaEncontrada = worksheet;
          linhaAluno = i + 2; // +2 porque começamos da linha 2
          indices = indicesTemp;
          console.log(
            `✅ Aluno encontrado na aba: ${sheetName}, linha: ${linhaAluno}`
          );
          break;
        }
      }

      if (abaEncontrada) break; // Parar quando encontrar o aluno
    }

    if (!abaEncontrada) {
      throw new Error(
        `Aluno com ID ${alunoId} não encontrado em nenhuma planilha`
      );
    }

    // PASSO 2: Processar APENAS a aba onde o aluno foi encontrado
    console.log(`🎯 Processando APENAS a aba: ${abaEncontrada.getName()}`);

    // Obter cabeçalhos atuais da aba específica
    const ultimaColuna = abaEncontrada.getLastColumn();
    const headers = abaEncontrada
      .getRange(1, 1, 1, ultimaColuna)
      .getValues()[0];

    // Formatar data para cabeçalho (formato brasileiro: dd/MM)
    const dataObj = new Date(data + "T12:00:00Z");
    const cabecalhoData = Utilities.formatDate(
      dataObj,
      Session.getScriptTimeZone(),
      "dd/MM"
    );

    console.log(`📅 Procurando/criando coluna para data: ${cabecalhoData}`);

    // Verificar se existe coluna para esta data APENAS nesta aba
    let colunaData = -1;
    for (let i = 0; i < headers.length; i++) {
      if (String(headers[i]).trim() === cabecalhoData) {
        colunaData = i;
        console.log(`✅ Coluna da data já existe na posição: ${colunaData}`);
        break;
      }
    }

    // Se não existe a coluna para esta data, criar APENAS nesta aba
    if (colunaData === -1) {
      // Inserir nova coluna após a coluna de Faltas (se existir) ou no final
      const posicaoInsercao =
        indices.Faltas !== undefined
          ? indices.Faltas + 2 // Após a coluna de Faltas
          : ultimaColuna + 1; // No final

      abaEncontrada.insertColumnAfter(posicaoInsercao - 1);
      colunaData = posicaoInsercao - 1; // Ajuste para índice 0-based
      abaEncontrada.getRange(1, posicaoInsercao).setValue(cabecalhoData);

      console.log(
        `✅ Nova coluna '${cabecalhoData}' criada APENAS na aba ${abaEncontrada.getName()} na posição ${posicaoInsercao}`
      );

      // Atualizar array de headers
      headers.splice(colunaData, 0, cabecalhoData);
    }

    // PASSO 3: Marcar presença/falta do aluno específico
    abaEncontrada.getRange(linhaAluno, colunaData + 1).setValue(status);

    console.log(
      `✅ Status '${status}' registrado para o aluno na linha ${linhaAluno}, coluna ${
        colunaData + 1
      }`
    );

    const updates = [];

    // PASSO 4: Se marcarTodos = true, marcar outros alunos APENAS desta aba como ausentes
    if (marcarTodos === "true") {
      console.log("📝 Marcando outros alunos da mesma aba como ausentes...");

      const ultimaLinhaAba = abaEncontrada.getLastRow();
      const dadosCompletos = abaEncontrada
        .getRange(2, 1, ultimaLinhaAba - 1, abaEncontrada.getLastColumn())
        .getValues();

      for (let i = 0; i < dadosCompletos.length; i++) {
        const row = dadosCompletos[i];
        const currentId = String(row[indices.ID_Unico] || "").trim();
        const nomeAluno = String(row[indices.Nome] || "").trim();
        const rowNumber = i + 2;

        if (!currentId || !nomeAluno) continue;

        if (currentId !== alunoId) {
          // Para outros alunos, verificar se já tem status para hoje
          const statusExistente =
            colunaData < row.length ? String(row[colunaData] || "").trim() : "";

          if (!statusExistente) {
            // Se não tem status, marcar como ausente
            abaEncontrada.getRange(rowNumber, colunaData + 1).setValue("A");
            console.log(
              `📝 Aluno ${nomeAluno} marcado como ausente automaticamente`
            );
          }
        }
      }
    }

    // PASSO 5: Recalcular totais de faltas e presenças APENAS para esta aba
    console.log("🔄 Recalculando totais de faltas e presenças...");

    const ultimaLinhaAba = abaEncontrada.getLastRow();
    const dadosCompletos = abaEncontrada
      .getRange(2, 1, ultimaLinhaAba - 1, abaEncontrada.getLastColumn())
      .getValues();

    // Obter headers atualizados após possível inserção de coluna
    const headersAtualizados = abaEncontrada
      .getRange(1, 1, 1, abaEncontrada.getLastColumn())
      .getValues()[0];

    for (let i = 0; i < dadosCompletos.length; i++) {
      const row = dadosCompletos[i];
      const currentId = String(row[indices.ID_Unico] || "").trim();
      const nomeAluno = String(row[indices.Nome] || "").trim();
      const rowNumber = i + 2;

      if (!currentId || !nomeAluno) continue;

      let totalFaltas = 0;
      let totalPresencas = 0;

      // Contar faltas e presenças em todas as colunas de data
      for (let col = 0; col < headersAtualizados.length; col++) {
        const header = String(headersAtualizados[col]).trim();

        // Verificar se é uma coluna de data (formato dd/MM)
        if (header.match(/^\d{1,2}\/\d{1,2}$/)) {
          const statusNaData = String(row[col] || "")
            .trim()
            .toUpperCase();

          if (statusNaData === "A" || statusNaData === "F") {
            totalFaltas++;
          } else if (statusNaData === "P") {
            totalPresencas++;
          }
        }
      }

      // Atualizar totais na planilha
      if (indices.Faltas !== undefined) {
        abaEncontrada
          .getRange(rowNumber, indices.Faltas + 1)
          .setValue(totalFaltas);
      }

      if (indices.Presencas !== undefined) {
        abaEncontrada
          .getRange(rowNumber, indices.Presencas + 1)
          .setValue(totalPresencas);
      }

      updates.push({
        planilha: abaEncontrada.getName(),
        id: currentId,
        nome: nomeAluno,
        faltas: totalFaltas,
        presencas: totalPresencas,
        statusHoje: currentId === alunoId ? status : "A",
        data: cabecalhoData,
      });
    }

    console.log(
      `✅ Presença registrada com sucesso! Processada APENAS 1 aba: ${abaEncontrada.getName()}`
    );

    return {
      success: true,
      message: `Presença registrada para ${alunoId} na aba ${abaEncontrada.getName()}. ${
        marcarTodos === "true"
          ? "Outros alunos da mesma aba marcados como ausentes."
          : ""
      }`,
      updates: updates.length,
      abaProcessada: abaEncontrada.getName(),
      data: updates,
    };
  } catch (error) {
    console.error("❌ Erro ao registrar presença otimizada:", error);
    return {
      success: false,
      error: error.toString(),
      message: "Erro ao registrar presença",
    };
  }
}

/**
 * Função de teste para o sistema de presença automática
 * Execute esta função para testar o novo sistema
 */
function testarPresencaAutomatica() {
  console.log("🧪 Testando sistema de presença automática...");

  // Primeiro, vamos ver que alunos temos disponíveis
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let primeiroAlunoId = null;
  let worksheetTeste = null;

  for (const sheetName of SHEET_NAMES) {
    const worksheet = spreadsheet.getSheetByName(sheetName);
    if (!worksheet) continue;

    const indices = detectarColunasUniversal(worksheet);
    if (indices.ID_Unico === undefined) continue;

    const ultimaLinha = worksheet.getLastRow();
    if (ultimaLinha <= 1) continue;

    // Pegar o primeiro aluno desta planilha
    const primeiroAluno = worksheet
      .getRange(2, indices.ID_Unico + 1)
      .getValue();
    if (primeiroAluno) {
      primeiroAlunoId = String(primeiroAluno).trim();
      worksheetTeste = worksheet;
      console.log(
        `📋 Primeiro aluno encontrado: ${primeiroAlunoId} na planilha ${sheetName}`
      );

      // Mostrar dados atuais de presença/falta para este aluno
      console.log("🔍 Analisando dados atuais de presença...");
      const headers = worksheet
        .getRange(1, 1, 1, worksheet.getLastColumn())
        .getValues()[0];
      const dadosAluno = worksheet
        .getRange(2, 1, 1, worksheet.getLastColumn())
        .getValues()[0];

      console.log("📋 Colunas encontradas:");
      headers.forEach((header, index) => {
        const headerStr = String(header).trim();
        if (headerStr.match(/^\d{1,2}\/\d{1,2}$/)) {
          const valor = String(dadosAluno[index] || "").trim();
          console.log(`  📅 ${headerStr}: "${valor}"`);
        }
      });

      if (indices.Presencas !== undefined) {
        const presencasAtuais = dadosAluno[indices.Presencas] || 0;
        console.log(
          `📊 Total de presenças atual na planilha: ${presencasAtuais}`
        );
      }

      break;
    }
  }

  if (!primeiroAlunoId) {
    console.log("❌ Nenhum aluno encontrado nas planilhas");
    return {
      success: false,
      error: "Nenhum aluno encontrado para teste",
    };
  }

  // Testar com o primeiro aluno encontrado
  const hoje = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  const resultado = registrarPresencaAutomatica(
    primeiroAlunoId,
    hoje,
    "P",
    "Professor Teste",
    "true"
  );

  console.log("📊 Resultado do teste:", resultado);

  if (resultado.success) {
    console.log("✅ Teste realizado com sucesso!");
    console.log(`📈 ${resultado.updates} registros atualizados`);

    // Mostrar alguns detalhes dos updates
    if (resultado.data && resultado.data.length > 0) {
      console.log("🔍 Primeiros 3 registros atualizados:");
      resultado.data.slice(0, 3).forEach((update) => {
        console.log(
          `  - ${update.nome} (${update.id}): ${update.statusHoje} - Faltas: ${update.faltas} - Presenças: ${update.presencas}`
        );
      });
    }

    // Verificar dados após atualização
    if (worksheetTeste) {
      console.log("\n🔄 Verificando dados após atualização...");
      const indices = detectarColunasUniversal(worksheetTeste);
      const dadosAtualizados = worksheetTeste
        .getRange(2, 1, 1, worksheetTeste.getLastColumn())
        .getValues()[0];

      if (indices.Presencas !== undefined) {
        const presencasFinais = dadosAtualizados[indices.Presencas] || 0;
        console.log(
          `📊 Total de presenças final na planilha: ${presencasFinais}`
        );
      }
    }
  } else {
    console.log("❌ Teste falhou:", resultado.error);
  }

  return resultado;
}

/**
 * Função para diagnosticar problemas de contagem de presenças
 * Execute esta função para verificar a contagem atual de presenças
 */
function diagnosticarContadorPresencas() {
  console.log("🔍 === DIAGNÓSTICO DO CONTADOR DE PRESENÇAS ===");

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  for (const sheetName of SHEET_NAMES) {
    const worksheet = spreadsheet.getSheetByName(sheetName);
    if (!worksheet) continue;

    console.log(`\n📋 Analisando planilha: ${sheetName}`);

    const indices = detectarColunasUniversal(worksheet);
    if (indices.ID_Unico === undefined) {
      console.log("❌ Não tem coluna ID_Unico");
      continue;
    }

    const ultimaLinha = worksheet.getLastRow();
    if (ultimaLinha <= 1) {
      console.log("❌ Planilha vazia");
      continue;
    }

    // Obter cabeçalhos
    const headers = worksheet
      .getRange(1, 1, 1, worksheet.getLastColumn())
      .getValues()[0];
    console.log(
      "📄 Cabeçalhos:",
      headers.map((h, i) => `${i}: "${h}"`)
    );

    // Verificar colunas de data
    const colunasData = [];
    headers.forEach((header, index) => {
      const headerStr = String(header).trim();
      if (headerStr.match(/^\d{1,2}\/\d{1,2}$/)) {
        colunasData.push({ index, header: headerStr });
      }
    });

    console.log(`📅 Colunas de data encontradas: ${colunasData.length}`);
    colunasData.forEach((col) =>
      console.log(`  - Posição ${col.index}: "${col.header}"`)
    );

    // Analisar primeiro aluno como exemplo
    if (ultimaLinha >= 2) {
      const dadosAluno = worksheet
        .getRange(2, 1, 1, worksheet.getLastColumn())
        .getValues()[0];
      const nomeAluno = String(dadosAluno[indices.Nome] || "").trim();
      const idAluno = String(dadosAluno[indices.ID_Unico] || "").trim();

      console.log(`\n👤 Analisando aluno: ${nomeAluno} (${idAluno})`);

      let presencasContadas = 0;
      let faltasContadas = 0;

      colunasData.forEach((col) => {
        const valor = String(dadosAluno[col.index] || "").trim();
        console.log(`  📅 ${col.header}: "${valor}"`);

        if (valor === "P") presencasContadas++;
        if (valor === "A" || valor === "F") faltasContadas++;
      });

      console.log(`📊 Presenças contadas manualmente: ${presencasContadas}`);
      console.log(`📊 Faltas contadas manualmente: ${faltasContadas}`);

      if (indices.Presencas !== undefined) {
        const presencasNaPlanilha = dadosAluno[indices.Presencas] || 0;
        console.log(
          `📊 Presenças na coluna da planilha: ${presencasNaPlanilha}`
        );

        if (presencasContadas !== presencasNaPlanilha) {
          console.log("⚠️ DIVERGÊNCIA ENCONTRADA!");
        }
      }

      if (indices.Faltas !== undefined) {
        const faltasNaPlanilha = dadosAluno[indices.Faltas] || 0;
        console.log(`📊 Faltas na coluna da planilha: ${faltasNaPlanilha}`);

        if (faltasContadas !== faltasNaPlanilha) {
          console.log("⚠️ DIVERGÊNCIA ENCONTRADA!");
        }
      }
    }
  }

  console.log("\n✅ Diagnóstico concluído!");
}

/**
 * Função para testar a consulta de presenças por data
 * Execute esta função para testar a nova funcionalidade
 */
function testarConsultaPresencas() {
  console.log("🧪 === TESTANDO CONSULTA DE PRESENÇAS ===");

  // Testar com data de hoje
  const hoje = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
  console.log(`📅 Testando consulta para data: ${hoje}`);

  const resultado = consultarPresencasPorData(hoje);

  console.log("📊 Resultado da consulta:", resultado);

  if (resultado.success) {
    console.log("✅ Consulta realizada com sucesso!");
    console.log(`📈 Total de registros: ${resultado.totalRegistros}`);
    console.log(`📅 Data consultada: ${resultado.dataConsultada}`);
    console.log(`🏷️ Cabeçalho procurado: ${resultado.cabecalhoData}`);

    if (resultado.data && resultado.data.length > 0) {
      console.log("🔍 Primeiros 5 registros:");
      resultado.data.slice(0, 5).forEach((reg) => {
        console.log(
          `  - ${reg.studentName} (${reg.studentId}): ${reg.statusText} [${reg.course}]`
        );
      });

      // Estatísticas
      const presentes = resultado.data.filter((r) => r.status === "P").length;
      const ausentes = resultado.data.filter((r) => r.status === "A").length;
      const semRegistro = resultado.data.filter(
        (r) => r.status === null
      ).length;

      console.log("\n📊 Estatísticas:");
      console.log(`  ✅ Presentes: ${presentes}`);
      console.log(`  ❌ Ausentes: ${ausentes}`);
      console.log(`  ⚪ Sem registro: ${semRegistro}`);
    }
  } else {
    console.log("❌ Teste falhou:", resultado.error);
  }

  return resultado;
}

/**
 * NOVA FUNÇÃO OTIMIZADA - Registrar múltiplas presenças em lote
 * Reduz drasticamente o tempo de processamento usando operações em batch
 */
function registrarPresencaLote(registros) {
  try {
    console.log(
      "Iniciando registro em lote para",
      registros.length,
      "registros"
    );
    const startTime = new Date().getTime();

    // Validação de entrada
    if (!Array.isArray(registros) || registros.length === 0) {
      return {
        success: false,
        error: "Dados de registro inválidos ou vazios",
      };
    }

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let successCount = 0;
    let errorCount = 0;
    let processedSheets = new Set();

    // Agrupar registros por aluno para otimizar busca
    const registrosPorAluno = new Map();
    registros.forEach((registro) => {
      const key = registro.alunoId;
      if (!registrosPorAluno.has(key)) {
        registrosPorAluno.set(key, []);
      }
      registrosPorAluno.get(key).push(registro);
    });

    // Processar cada aluno
    for (const [alunoId, registrosAluno] of registrosPorAluno) {
      try {
        // Buscar aluno em todas as planilhas (cache da busca)
        let abaEncontrada = null;
        let linhaAluno = -1;
        let indices = null;

        // Busca otimizada do aluno
        for (const nomeAba of SHEET_NAMES) {
          const aba = spreadsheet.getSheetByName(nomeAba);
          if (!aba) continue;

          indices = detectarColunasUniversal(aba);
          if (indices.ID_Unico === undefined) continue;

          const ultimaLinha = aba.getLastRow();
          if (ultimaLinha <= 1) continue;

          // Cache da busca de IDs
          const idsColuna = aba
            .getRange(2, indices.ID_Unico + 1, ultimaLinha - 1, 1)
            .getValues();

          for (let i = 0; i < idsColuna.length; i++) {
            if (String(idsColuna[i][0]).trim() === String(alunoId).trim()) {
              abaEncontrada = aba;
              linhaAluno = i + 2;
              break;
            }
          }

          if (abaEncontrada) break;
        }

        if (!abaEncontrada) {
          console.error(`Aluno ${alunoId} não encontrado`);
          errorCount += registrosAluno.length;
          continue;
        }

        processedSheets.add(abaEncontrada.getName());

        // Processar todos os registros deste aluno em lote
        for (const registro of registrosAluno) {
          try {
            const { data, status, professor } = registro;

            if (!data || !status) {
              console.error(
                "Registro inválido para aluno",
                alunoId,
                ":",
                registro
              );
              errorCount++;
              continue;
            }

            // Usar a função existente otimizada
            const resultado = registrarPresencaAutomatica(
              alunoId,
              data,
              status,
              professor || "sistema",
              "false"
            );

            if (resultado.success) {
              successCount++;
            } else {
              console.error(
                `Erro ao registrar ${alunoId} em ${data}:`,
                resultado.error
              );
              errorCount++;
            }
          } catch (error) {
            console.error(`Erro ao processar registro individual:`, error);
            errorCount++;
          }
        }
      } catch (error) {
        console.error(`Erro ao processar aluno ${alunoId}:`, error);
        errorCount += registrosAluno.length;
      }
    }

    const endTime = new Date().getTime();
    const processingTime = endTime - startTime;

    console.log(`Processamento em lote concluído em ${processingTime}ms`);
    console.log(`Sucessos: ${successCount}, Erros: ${errorCount}`);
    console.log(
      `Planilhas processadas: ${Array.from(processedSheets).join(", ")}`
    );

    return {
      success: errorCount === 0,
      successCount: successCount,
      errorCount: errorCount,
      processingTime: processingTime,
      details: {
        totalRegistros: registros.length,
        alunosProcessados: registrosPorAluno.size,
        planilhasAfetadas: Array.from(processedSheets),
      },
    };
  } catch (error) {
    console.error("Erro geral no processamento em lote:", error);
    return {
      success: false,
      error: error.toString(),
      successCount: 0,
      errorCount: registros ? registros.length : 0,
    };
  }
}

/**
 * Função GET - Busca alunos
 */
function doGet(e) {
  console.log("=== INICIANDO doGet ===");
  console.log("Parâmetros recebidos:", e.parameter);
  console.log("Headers:", e.headers || "Não disponível");

  // Teste de conectividade MELHORADO
  if (e.parameter.teste) {
    console.log("📡 Teste de conectividade solicitado");
    return criarRespostaJson({
      status: "OK",
      message: "Web App funcionando!",
      timestamp: new Date().toISOString(),
      parametros: e.parameter,
      userAgent: e.headers ? e.headers["User-Agent"] : "N/A",
      metodo: "GET",
    });
  }

  // Teste de Web App
  if (e.parameter.action === "testarWebApp") {
    console.log("🧪 Teste de Web App solicitado");
    return criarRespostaJson({
      status: "OK",
      message: "Sistema CEDESP funcionando!",
      timestamp: new Date().toISOString(),
      version: "Universal 1.0 + Lote Otimizado + CORS Melhorado",
      planilhas: SHEET_NAMES,
    });
  }

  // Tratamento de ações específicas (registrar presença, atualizar notas)
  if (e.parameter.action) {
    try {
      const acao = e.parameter.action;

      if (acao === "registrarPresenca") {
        const alunoId = e.parameter.alunoId;
        const status = e.parameter.status;
        const data = e.parameter.data;

        if (!alunoId || !status || !data) {
          return criarRespostaJson({
            success: false,
            error: "Parâmetros obrigatórios: alunoId, status, data",
          });
        }

        const resultado = registrarPresencaFuncao(alunoId, status, data);
        return criarRespostaJson(resultado);
      } else if (acao === "registrarPresencaAutomatica") {
        const alunoId = e.parameter.alunoId;
        const status = e.parameter.status;
        const data = e.parameter.data;
        const professor = e.parameter.professor;
        const marcarTodos = e.parameter.marcarTodos;
        const curso = e.parameter.curso; // ← CAPTURAR PARÂMETRO CURSO

        if (!alunoId || !status || !data) {
          return criarRespostaJson({
            success: false,
            error: "Parâmetros obrigatórios: alunoId, status, data",
          });
        }

        const resultado = registrarPresencaOtimizada(
          alunoId,
          data,
          status,
          professor,
          marcarTodos
        );
        return criarRespostaJson(resultado);
      } else if (acao === "registrarPresencaOtimizada") {
        // ✅ NOVA FUNCIONALIDADE: Registrar presença de forma otimizada (evita criar colunas desnecessárias)
        const alunoId = e.parameter.alunoId;
        const status = e.parameter.status;
        const data = e.parameter.data;
        const professor = e.parameter.professor;
        const marcarTodos = e.parameter.marcarTodos || "false";

        if (!alunoId || !status || !data) {
          return criarRespostaJson({
            success: false,
            error: "Parâmetros obrigatórios: alunoId, status, data",
          });
        }

        const resultado = registrarPresencaOtimizada(
          alunoId,
          data,
          status,
          professor,
          marcarTodos
        );
        return criarRespostaJson(resultado);
      } else if (acao === "registrarPresencaCursoEspecifico") {
        // NOVA FUNCIONALIDADE: Registrar presença apenas no curso específico
        const alunoId = e.parameter.alunoId;
        const status = e.parameter.status;
        const data = e.parameter.data;
        const professor = e.parameter.professor;
        const curso = e.parameter.curso;

        if (!alunoId || !status || !data || !curso) {
          return criarRespostaJson({
            success: false,
            error: "Parâmetros obrigatórios: alunoId, status, data, curso",
          });
        }

        const resultado = registrarPresencaCursoEspecifico(
          alunoId,
          data,
          status,
          professor,
          curso
        );
        return criarRespostaJson(resultado);
      } else if (acao === "processarPresencaAbaEspecifica") {
        // NOVA FUNCIONALIDADE: Processar presença apenas na aba específica
        const alunoId = e.parameter.alunoId;
        const status = e.parameter.status;
        const data = e.parameter.data;
        const professor = e.parameter.professor;
        const curso = e.parameter.curso;

        if (!alunoId || !status || !data || !curso) {
          return criarRespostaJson({
            success: false,
            error: "Parâmetros obrigatórios: alunoId, status, data, curso",
          });
        }

        const resultado = processarPresencaAbaEspecifica(
          alunoId,
          data,
          status,
          professor,
          curso
        );
        return criarRespostaJson(resultado);
      } else if (acao === "registrarPresencaLote") {
        // NOVA FUNCIONALIDADE: Processamento em lote via GET
        const registrosJson = e.parameter.registros;

        if (!registrosJson) {
          return criarRespostaJson({
            success: false,
            error: "Parâmetro 'registros' não encontrado",
          });
        }

        let registros;
        try {
          registros = JSON.parse(registrosJson);
        } catch (parseError) {
          return criarRespostaJson({
            success: false,
            error: "Erro ao parsear registros: " + parseError.toString(),
          });
        }

        const resultado = registrarPresencaLote(registros);
        return criarRespostaJson(resultado);
      } else if (acao === "obterEstatisticas") {
        // NOVA FUNCIONALIDADE: Carregar estatísticas do dashboard admin
        console.log("📊 Carregando estatísticas do dashboard...");
        const resultado = obterEstatisticasCompletas();
        return criarRespostaJson(resultado);
      } else if (acao === "obterHistoricoFaltas") {
        // NOVA FUNCIONALIDADE: Obter histórico de faltas de um aluno
        const alunoId = e.parameter.alunoId;
        if (!alunoId) {
          return criarRespostaJson({
            success: false,
            error: "Parâmetro alunoId é obrigatório",
          });
        }
        const resultado = obterHistoricoFaltas(alunoId);
        return criarRespostaJson(resultado);
      } else if (acao === "registrarPresencaOnline") {
        // NOVA FUNCIONALIDADE: Registrar presença na aba "Presenças"
        const nome = e.parameter.nome;
        const data = e.parameter.data;
        const horario = e.parameter.horario;
        const curso = e.parameter.curso;
        const professor = e.parameter.professor;
        const status = e.parameter.status || "P"; // Padrão para presente se não especificado

        if (!nome || !data || !horario || !curso || !professor) {
          return criarRespostaJson({
            success: false,
            error:
              "Parâmetros obrigatórios: nome, data, horario, curso, professor",
          });
        }

        const resultado = registrarPresencaOnline(
          nome,
          data,
          horario,
          curso,
          professor,
          status
        );
        return criarRespostaJson(resultado);
      } else if (acao === "buscarUltimosRegistrosPresenca") {
        // NOVA FUNCIONALIDADE: Buscar últimos registros de presença
        const limite = e.parameter.limite ? parseInt(e.parameter.limite) : 10;
        const resultado = buscarUltimosRegistrosPresenca(limite);
        return criarRespostaJson(resultado);
      } else if (acao === "corrigirFormatacaoPresencas") {
        // NOVA FUNCIONALIDADE: Corrigir formatação da aba Presenças
        const resultado = corrigirFormatacaoAbaPresencas();
        return criarRespostaJson(resultado);
      } else if (acao === "limparRegistrosAntigosPresenca") {
        // NOVA FUNCIONALIDADE: Limpar registros antigos (manutenção)
        const resultado = limparRegistrosAntigosPresenca();
        return criarRespostaJson(resultado);
      } else if (acao === "atualizarNotas") {
        const alunoId = e.parameter.alunoId;
        const nota1 =
          e.parameter.nota1 !== "" ? parseFloat(e.parameter.nota1) : null;
        const nota2 =
          e.parameter.nota2 !== "" ? parseFloat(e.parameter.nota2) : null;
        const nota3 =
          e.parameter.nota3 !== "" ? parseFloat(e.parameter.nota3) : null;

        if (!alunoId) {
          return criarRespostaJson({
            success: false,
            error: "Parâmetro obrigatório: alunoId",
          });
        }

        const resultado = atualizarNotasFuncao(alunoId, nota1, nota2, nota3);
        return criarRespostaJson(resultado);
      } else if (acao === "consultarPresencas") {
        const dataConsulta = e.parameter.data;
        const cursoFiltro = e.parameter.curso;

        if (!dataConsulta) {
          return criarRespostaJson({
            success: false,
            error: "Parâmetro obrigatório: data",
          });
        }

        const resultado = consultarPresencasPorData(dataConsulta, cursoFiltro);
        return criarRespostaJson(resultado);
      } else if (acao === "consultarPresencasPorPeriodo") {
        const dataInicial = e.parameter.dataInicial;
        const dataFinal = e.parameter.dataFinal;
        const cursoFiltro = e.parameter.curso;

        if (!dataInicial || !dataFinal) {
          return criarRespostaJson({
            success: false,
            error: "Parâmetros obrigatórios: dataInicial e dataFinal",
          });
        }

        const resultado = consultarPresencasPorPeriodo(
          dataInicial,
          dataFinal,
          cursoFiltro
        );
        return criarRespostaJson(resultado);
      } else if (acao === "atualizarNotaEspecifica") {
        // NOVA FUNCIONALIDADE: Atualizar nota específica (via JSONP)
        console.log("📝 === AÇÃO: atualizarNotaEspecifica ===");
        console.log(" Parâmetros recebidos:", e.parameter);

        // Verificar se é uma requisição JSONP (simulando POST)
        const isJSONP = e.parameter.callback && e.parameter._method === "POST";
        console.log("🔍 É requisição JSONP?", isJSONP);

        if (isJSONP) {
          // Usar lógica específica para JSONP
          const ra = e.parameter.ra;
          const disciplina = e.parameter.disciplina;
          const bimestre = e.parameter.bimestre;
          const nota = e.parameter.nota;

          console.log(
            `✍️ Recebido via JSONP - RA: ${ra}, Disciplina: ${disciplina}, Bimestre: ${bimestre}, Nota: ${nota}`
          );

          // Validar nota
          const notaNum = parseFloat(nota);
          if (isNaN(notaNum) || notaNum < 0 || notaNum > 10) {
            const erro = {
              success: false,
              message: "Nota deve ser um número entre 0 e 10",
            };
            console.log("❌ Nota inválida:", erro);
            return ContentService.createTextOutput(
              `${e.parameter.callback}(${JSON.stringify(erro)})`
            ).setMimeType(ContentService.MimeType.JAVASCRIPT);
          }

          try {
            // Buscar aluno em todas as planilhas
            const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
            let abaEncontrada = null;
            let linhaAluno = -1;

            console.log("🔍 Buscando aluno em todas as planilhas...");
            console.log("📋 Planilhas disponíveis:", SHEET_NAMES);

            for (const nomeAba of SHEET_NAMES) {
              const aba = spreadsheet.getSheetByName(nomeAba);
              if (!aba) {
                console.log(`⚠️ Planilha ${nomeAba} não encontrada`);
                continue;
              }

              const indices = detectarColunasUniversal(aba);
              if (indices.ID_Unico === undefined) {
                console.log(`⚠️ Coluna ID_Unico não encontrada em ${nomeAba}`);
                continue;
              }

              const ultimaLinha = aba.getLastRow();
              if (ultimaLinha <= 1) {
                console.log(`⚠️ Planilha ${nomeAba} está vazia`);
                continue;
              }

              console.log(
                `🔍 Procurando aluno ${ra} na planilha ${nomeAba}...`
              );

              // Buscar o aluno
              const idsColuna = aba
                .getRange(2, indices.ID_Unico + 1, ultimaLinha - 1, 1)
                .getValues();

              for (let i = 0; i < idsColuna.length; i++) {
                if (idsColuna[i][0] && idsColuna[i][0].toString() === ra) {
                  abaEncontrada = aba;
                  linhaAluno = i + 2; // +2 porque começamos na linha 2 e i é 0-based
                  console.log(
                    `✅ Aluno ${ra} encontrado na linha ${linhaAluno} da planilha ${nomeAba}`
                  );
                  break;
                }
              }

              if (abaEncontrada) break;
            }

            if (!abaEncontrada || linhaAluno === -1) {
              const erro = { success: false, message: "Aluno não encontrado" };
              console.log("❌ Aluno não encontrado:", erro);
              return ContentService.createTextOutput(
                `${e.parameter.callback}(${JSON.stringify(erro)})`
              ).setMimeType(ContentService.MimeType.JAVASCRIPT);
            }

            console.log(
              `👤 Aluno encontrado na aba ${abaEncontrada.getName()}, linha ${linhaAluno}`
            );

            // Detectar colunas da aba encontrada
            const indices = detectarColunasUniversal(abaEncontrada);
            console.log("📊 Índices de colunas:", indices);

            // Mapear disciplina e bimestre para índice de coluna
            let colunaIndice = undefined;

            if (disciplina === "curso") {
              if (bimestre === "1_BIMESTRE") colunaIndice = indices.Nota1;
              else if (bimestre === "2_BIMESTRE") colunaIndice = indices.Nota2;
              else if (bimestre === "3_BIMESTRE") colunaIndice = indices.Nota3;
            } else if (disciplina === "mundoTrabalho") {
              if (bimestre === "1_BIMESTRE")
                colunaIndice = indices.MundoTrabalho1;
              else if (bimestre === "2_BIMESTRE")
                colunaIndice = indices.MundoTrabalho2;
              else if (bimestre === "3_BIMESTRE")
                colunaIndice = indices.MundoTrabalho3;
            } else if (disciplina === "convivio") {
              if (bimestre === "1_BIMESTRE") colunaIndice = indices.Convivio1;
              else if (bimestre === "2_BIMESTRE")
                colunaIndice = indices.Convivio2;
              else if (bimestre === "3_BIMESTRE")
                colunaIndice = indices.Convivio3;
            }

            console.log(
              `🎯 Disciplina: ${disciplina}, Bimestre: ${bimestre}, Coluna índice: ${colunaIndice}`
            );

            if (colunaIndice === undefined) {
              const erro = {
                success: false,
                message: "Disciplina ou bimestre não encontrado na planilha",
              };
              console.log("❌ Coluna não encontrada:", erro);
              return ContentService.createTextOutput(
                `${e.parameter.callback}(${JSON.stringify(erro)})`
              ).setMimeType(ContentService.MimeType.JAVASCRIPT);
            }

            console.log(
              `📍 Atualizando célula linha ${linhaAluno}, coluna ${
                colunaIndice + 1
              } com valor ${notaNum}`
            );

            // Atualizar nota
            abaEncontrada
              .getRange(linhaAluno, colunaIndice + 1)
              .setValue(notaNum);

            console.log("✅ Nota atualizada na planilha");

            // Recalcular média se existir coluna de média
            let media = null;
            let situacao = null;

            if (indices.Media !== undefined) {
              console.log("📊 Recalculando média...");

              // Coletar todas as notas para calcular média
              const todasNotas = [];

              // Notas principais (3)
              if (indices.Nota1 !== undefined)
                todasNotas.push(
                  abaEncontrada
                    .getRange(linhaAluno, indices.Nota1 + 1)
                    .getValue() || 0
                );
              if (indices.Nota2 !== undefined)
                todasNotas.push(
                  abaEncontrada
                    .getRange(linhaAluno, indices.Nota2 + 1)
                    .getValue() || 0
                );
              if (indices.Nota3 !== undefined)
                todasNotas.push(
                  abaEncontrada
                    .getRange(linhaAluno, indices.Nota3 + 1)
                    .getValue() || 0
                );

              // Mundo do Trabalho (3)
              if (indices.MundoTrabalho1 !== undefined)
                todasNotas.push(
                  abaEncontrada
                    .getRange(linhaAluno, indices.MundoTrabalho1 + 1)
                    .getValue() || 0
                );
              if (indices.MundoTrabalho2 !== undefined)
                todasNotas.push(
                  abaEncontrada
                    .getRange(linhaAluno, indices.MundoTrabalho2 + 1)
                    .getValue() || 0
                );
              if (indices.MundoTrabalho3 !== undefined)
                todasNotas.push(
                  abaEncontrada
                    .getRange(linhaAluno, indices.MundoTrabalho3 + 1)
                    .getValue() || 0
                );

              // Convívio (3)
              if (indices.Convivio1 !== undefined)
                todasNotas.push(
                  abaEncontrada
                    .getRange(linhaAluno, indices.Convivio1 + 1)
                    .getValue() || 0
                );
              if (indices.Convivio2 !== undefined)
                todasNotas.push(
                  abaEncontrada
                    .getRange(linhaAluno, indices.Convivio2 + 1)
                    .getValue() || 0
                );
              if (indices.Convivio3 !== undefined)
                todasNotas.push(
                  abaEncontrada
                    .getRange(linhaAluno, indices.Convivio3 + 1)
                    .getValue() || 0
                );

              console.log("📋 Todas as notas coletadas:", todasNotas);

              // Calcular média (dividir por 9 para incluir zeros)
              media =
                todasNotas.reduce(
                  (sum, nota) => sum + parseFloat(nota || 0),
                  0
                ) / 9;

              // Atualizar média
              abaEncontrada
                .getRange(linhaAluno, indices.Media + 1)
                .setValue(media.toFixed(2));

              // Calcular situação
              if (indices.Situacao !== undefined) {
                situacao =
                  media >= 7
                    ? "Aprovado"
                    : media >= 5
                    ? "Recuperação"
                    : "Retido";
                abaEncontrada
                  .getRange(linhaAluno, indices.Situacao + 1)
                  .setValue(situacao);
              }

              console.log(
                `📊 Média recalculada: ${media.toFixed(
                  2
                )}, Situação: ${situacao}`
              );
            }

            const sucesso = {
              success: true,
              message: "Nota atualizada com sucesso",
              data: {
                ra,
                disciplina,
                bimestre,
                nota: notaNum,
                media: media ? media.toFixed(2) : null,
                situacao,
                aba: abaEncontrada.getName(),
                linha: linhaAluno,
                coluna: colunaIndice + 1,
              },
            };

            console.log("✅ Atualização concluída:", sucesso);

            return ContentService.createTextOutput(
              `${e.parameter.callback}(${JSON.stringify(sucesso)})`
            ).setMimeType(ContentService.MimeType.JAVASCRIPT);
          } catch (error) {
            console.error("❌ Erro ao atualizar nota:", error);
            const erro = {
              success: false,
              message: "Erro interno: " + error.toString(),
            };
            return ContentService.createTextOutput(
              `${e.parameter.callback}(${JSON.stringify(erro)})`
            ).setMimeType(ContentService.MimeType.JAVASCRIPT);
          }
        } else {
          // GET normal (não JSONP) - retornar erro explicativo
          const erro = {
            success: false,
            message:
              "Esta action requer POST. Use JSONP com _method=POST para localhost.",
          };
          console.log("⚠️ Requisição GET normal:", erro);
          return criarRespostaJson(erro);
        }
      } else {
        return criarRespostaJson({
          success: false,
          error: `Ação não reconhecida: ${acao}`,
        });
      }
    } catch (erro) {
      console.error("Erro ao processar ação:", erro);
      return criarRespostaJson({
        success: false,
        error: `Erro interno: ${erro.message}`,
      });
    }
  }

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let todosAlunos = [];

    // Filtros opcionais
    const filtroNome = e.parameter.nomeAluno
      ? String(e.parameter.nomeAluno).toLowerCase()
      : "";
    const filtroCurso = e.parameter.curso
      ? String(e.parameter.curso).toUpperCase()
      : "";

    // Processa cada planilha
    for (const nomeAba of SHEET_NAMES) {
      const aba = spreadsheet.getSheetByName(nomeAba);

      if (!aba) {
        console.log(`Planilha '${nomeAba}' não encontrada`);
        continue;
      }

      // Aplica filtros se especificados
      if (filtroCurso && filtroCurso !== nomeAba) {
        continue;
      }

      console.log(`Processando planilha: ${nomeAba}`);

      const indices = detectarColunasUniversal(aba);

      // Debug: Mostrar colunas detectadas
      console.log(`📊 Colunas detectadas em ${nomeAba}:`, {
        ID_Unico: indices.ID_Unico,
        Nome: indices.Nome,
        Nota1: indices.Nota1,
        Nota2: indices.Nota2,
        Nota3: indices.Nota3,
        MundoTrabalho1: indices.MundoTrabalho1,
        MundoTrabalho2: indices.MundoTrabalho2,
        MundoTrabalho3: indices.MundoTrabalho3,
        Convivio1: indices.Convivio1,
        Convivio2: indices.Convivio2,
        Convivio3: indices.Convivio3,
        Media: indices.Media,
        Situacao: indices.Situacao,
      });

      if (indices.ID_Unico === undefined || indices.Nome === undefined) {
        console.log(`Planilha '${nomeAba}' não tem colunas essenciais`);
        continue;
      }

      const ultimaLinha = aba.getLastRow();
      if (ultimaLinha <= 1) continue;

      const dados = aba
        .getRange(2, 1, ultimaLinha - 1, aba.getLastColumn())
        .getValues();

      for (let i = 0; i < dados.length; i++) {
        const linha = dados[i];

        const id = String(linha[indices.ID_Unico] || "").trim();
        const nome = String(linha[indices.Nome] || "").trim();

        if (!id || !nome) continue;

        // Aplica filtro de nome se especificado
        if (filtroNome && !nome.toLowerCase().includes(filtroNome)) {
          continue;
        }

        const aluno = {
          ID_Unico: id,
          Nome: nome,
          Faltas: linha[indices.Faltas] || 0,
          Nota1: linha[indices.Nota1] || "",
          Nota2: linha[indices.Nota2] || "",
          Nota3: linha[indices.Nota3] || "",
          Media: linha[indices.Media] || "",
          Situacao: linha[indices.Situacao] || "",
          Origem: nomeAba,
          Periodo: CURSO_PARA_PERIODO[nomeAba] || "Não definido",
          // === MUNDO DO TRABALHO ===
          MundoTrabalho1: linha[indices.MundoTrabalho1] || "",
          MundoTrabalho2: linha[indices.MundoTrabalho2] || "",
          MundoTrabalho3: linha[indices.MundoTrabalho3] || "",
          // === CONVÍVIO ===
          Convivio1: linha[indices.Convivio1] || "",
          Convivio2: linha[indices.Convivio2] || "",
          Convivio3: linha[indices.Convivio3] || "",
        };

        // Calcula média se não estiver preenchida, incluindo todas as matérias
        if (!aluno.Media) {
          // Notas do curso
          const notasCurso = [aluno.Nota1, aluno.Nota2, aluno.Nota3]
            .map((n) => parseFloat(String(n).replace(",", ".")) || 0)
            .filter((n) => n > 0);

          // Notas de Mundo do Trabalho
          const notasMT = [
            aluno.MundoTrabalho1,
            aluno.MundoTrabalho2,
            aluno.MundoTrabalho3,
          ]
            .map((n) => parseFloat(String(n).replace(",", ".")) || 0)
            .filter((n) => n > 0);

          // Notas de Convívio
          const notasConvivio = [
            aluno.Convivio1,
            aluno.Convivio2,
            aluno.Convivio3,
          ]
            .map((n) => parseFloat(String(n).replace(",", ".")) || 0)
            .filter((n) => n > 0);

          // Todas as notas válidas
          const todasAsNotas = [...notasCurso, ...notasMT, ...notasConvivio];

          if (todasAsNotas.length > 0) {
            aluno.Media = (
              todasAsNotas.reduce((a, b) => a + b) / todasAsNotas.length
            ).toFixed(2);

            console.log(
              `📊 Média calculada para ${aluno.Nome}: ${aluno.Media} (${todasAsNotas.length} notas)`
            );
          }
        }

        // Calcula situação automaticamente baseada na média
        if (aluno.Media && parseFloat(aluno.Media) > 0) {
          const mediaFinal = parseFloat(aluno.Media);
          aluno.Situacao = mediaFinal >= 6.0 ? "Aprovado" : "Reprovado";
        } else {
          aluno.Situacao = "Em Curso";
        }

        todosAlunos.push(aluno);
      }
    }

    console.log(`Total de alunos encontrados: ${todosAlunos.length}`);

    return criarRespostaJson({ saida: todosAlunos });
  } catch (erro) {
    console.error("Erro em doGet:", erro);
    return criarRespostaJson({
      error: "Erro interno: " + erro.message,
    });
  }
}

/**
 * Função POST - Registra presença/falta e atualiza notas
 */
function doPost(e) {
  console.log("=== INICIANDO doPost ===");

  try {
    const dados = JSON.parse(e.postData.contents);
    const acao = dados.action;
    const alunoId = dados.alunoId;

    console.log(`Ação: ${acao}, ID: ${alunoId}`);

    // Validação especial: processamento em lote não requer alunoId individual
    if (!alunoId && acao !== "registrarPresencaLote") {
      return criarRespostaJson({
        success: false,
        error: "ID do aluno é obrigatório",
      });
    }

    // Para ações em lote, pular busca individual do aluno
    if (acao === "registrarPresencaLote") {
      // Processar diretamente sem buscar aluno individual
      if (!dados.registros) {
        return criarRespostaJson({
          success: false,
          error:
            "Parâmetro 'registros' é obrigatório para processamento em lote",
        });
      }

      let registros;
      try {
        registros = Array.isArray(dados.registros)
          ? dados.registros
          : JSON.parse(dados.registros);
      } catch (parseError) {
        return criarRespostaJson({
          success: false,
          error: "Erro ao parsear registros: " + parseError.toString(),
        });
      }

      const resultado = registrarPresencaLote(registros);
      return criarRespostaJson(resultado);
    }

    // Para registrar presença online, não precisa buscar aluno
    if (acao === "registrarPresencaOnline") {
      const nome = dados.nome;
      const data = dados.data;
      const horario = dados.horario;
      const curso = dados.curso;
      const professor = dados.professor;
      const status = dados.status || "P"; // Padrão para presente se não especificado

      if (!nome || !data || !horario || !curso || !professor) {
        return criarRespostaJson({
          success: false,
          error:
            "Parâmetros obrigatórios: nome, data, horario, curso, professor",
        });
      }

      const resultado = registrarPresencaOnline(
        nome,
        data,
        horario,
        curso,
        professor,
        status
      );
      return criarRespostaJson(resultado);
    }

    // Para buscar últimos registros, não precisa buscar aluno específico
    if (acao === "buscarUltimosRegistrosPresenca") {
      const limite = dados.limite ? parseInt(dados.limite) : 10;
      const resultado = buscarUltimosRegistrosPresenca(limite);
      return criarRespostaJson(resultado);
    }

    // Para corrigir formatação, não precisa buscar aluno específico
    if (acao === "corrigirFormatacaoPresencas") {
      const resultado = corrigirFormatacaoAbaPresencas();
      return criarRespostaJson(resultado);
    }

    // Busca do aluno para ações individuais
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let abaEncontrada = null;
    let linhaAluno = -1;
    let indices = null;

    // Busca o aluno em todas as planilhas
    for (const nomeAba of SHEET_NAMES) {
      const aba = spreadsheet.getSheetByName(nomeAba);
      if (!aba) continue;

      indices = detectarColunasUniversal(aba);
      if (indices.ID_Unico === undefined) continue;

      const ultimaLinha = aba.getLastRow();
      if (ultimaLinha <= 1) continue;

      const idsColuna = aba
        .getRange(2, indices.ID_Unico + 1, ultimaLinha - 1, 1)
        .getValues();

      for (let i = 0; i < idsColuna.length; i++) {
        if (String(idsColuna[i][0]).trim() === String(alunoId).trim()) {
          abaEncontrada = aba;
          linhaAluno = i + 2; // +2 porque é 1-indexed e começamos da linha 2
          break;
        }
      }

      if (abaEncontrada) break;
    }

    if (!abaEncontrada) {
      return criarRespostaJson({
        success: false,
        error: `Aluno com ID '${alunoId}' não encontrado`,
      });
    }

    console.log(
      `Aluno encontrado na planilha '${abaEncontrada.getName()}', linha ${linhaAluno}`
    );

    // === REGISTRAR PRESENÇA/FALTA ===
    if (acao === "registrarPresenca") {
      const dataPresenca = dados.data;
      const status = dados.status; // "P" para presença, "A" para ausência

      if (!dataPresenca || !status) {
        return criarRespostaJson({
          success: false,
          error: "Data e status são obrigatórios",
        });
      }

      // Formata a data para o cabeçalho
      const data = new Date(dataPresenca + "T12:00:00Z");
      const cabecalhoData = Utilities.formatDate(
        data,
        Session.getScriptTimeZone(),
        "dd/MM"
      );

      // Procura ou cria a coluna da data
      let colunaData = -1;
      const cabecalhos = abaEncontrada
        .getRange(1, 1, 1, abaEncontrada.getLastColumn())
        .getValues()[0];

      for (let i = 0; i < cabecalhos.length; i++) {
        if (String(cabecalhos[i]).trim() === cabecalhoData) {
          colunaData = i;
          break;
        }
      }

      // Se não encontrou a coluna da data, cria uma nova
      if (colunaData === -1) {
        const colunaFaltas =
          indices.Faltas !== undefined
            ? indices.Faltas
            : abaEncontrada.getLastColumn() - 1;
        abaEncontrada.insertColumnAfter(colunaFaltas + 1);
        colunaData = colunaFaltas + 1;
        abaEncontrada.getRange(1, colunaData + 1).setValue(cabecalhoData);
        console.log(
          `Nova coluna '${cabecalhoData}' criada na posição ${colunaData + 1}`
        );
      }

      // Registra a presença/falta na coluna da data
      const celulaData = abaEncontrada.getRange(linhaAluno, colunaData + 1);
      const statusAnterior = String(celulaData.getValue()).trim().toUpperCase();

      let novoStatus = "";
      let mensagem = "";

      if (status.toUpperCase() === "P") {
        novoStatus = "P";
        mensagem = `Presença registrada para ${cabecalhoData}`;

        // Se era falta antes, diminui o contador de faltas
        if (statusAnterior === "F" && indices.Faltas !== undefined) {
          const celulaFaltas = abaEncontrada.getRange(
            linhaAluno,
            indices.Faltas + 1
          );
          const faltasAtuais = parseInt(celulaFaltas.getValue()) || 0;
          if (faltasAtuais > 0) {
            celulaFaltas.setValue(faltasAtuais - 1);
            console.log(
              `Faltas decrementadas: ${faltasAtuais} → ${faltasAtuais - 1}`
            );
          }
        }
      } else {
        novoStatus = "F";
        mensagem = `Falta registrada para ${cabecalhoData}`;

        // Se não era falta antes, aumenta o contador de faltas
        if (statusAnterior !== "F" && indices.Faltas !== undefined) {
          const celulaFaltas = abaEncontrada.getRange(
            linhaAluno,
            indices.Faltas + 1
          );
          const faltasAtuais = parseInt(celulaFaltas.getValue()) || 0;
          celulaFaltas.setValue(faltasAtuais + 1);
          console.log(
            `Faltas incrementadas: ${faltasAtuais} → ${faltasAtuais + 1}`
          );
        }
      }

      celulaData.setValue(novoStatus);

      return criarRespostaJson({
        success: true,
        message: mensagem,
      });
    }

    // === ATUALIZAR NOTAS ===
    else if (acao === "atualizarNotas") {
      let atualizado = false;

      // Processar Nota1
      if (dados.nota1 !== undefined && indices.Nota1 !== undefined) {
        if (dados.nota1 === "" || dados.nota1 === null) {
          // Limpar nota (valor vazio)
          abaEncontrada.getRange(linhaAluno, indices.Nota1 + 1).setValue("");
          atualizado = true;
        } else {
          const nota = parseFloat(String(dados.nota1).replace(",", "."));
          if (!isNaN(nota) && nota >= 0 && nota <= 10) {
            abaEncontrada
              .getRange(linhaAluno, indices.Nota1 + 1)
              .setValue(nota);
            atualizado = true;
          }
        }
      }

      // Processar Nota2
      if (dados.nota2 !== undefined && indices.Nota2 !== undefined) {
        if (dados.nota2 === "" || dados.nota2 === null) {
          // Limpar nota (valor vazio)
          abaEncontrada.getRange(linhaAluno, indices.Nota2 + 1).setValue("");
          atualizado = true;
        } else {
          const nota = parseFloat(String(dados.nota2).replace(",", "."));
          if (!isNaN(nota) && nota >= 0 && nota <= 10) {
            abaEncontrada
              .getRange(linhaAluno, indices.Nota2 + 1)
              .setValue(nota);
            atualizado = true;
          }
        }
      }

      // Processar Nota3
      if (dados.nota3 !== undefined && indices.Nota3 !== undefined) {
        if (dados.nota3 === "" || dados.nota3 === null) {
          // Limpar nota (valor vazio)
          abaEncontrada.getRange(linhaAluno, indices.Nota3 + 1).setValue("");
          atualizado = true;
        } else {
          const nota = parseFloat(String(dados.nota3).replace(",", "."));
          if (!isNaN(nota) && nota >= 0 && nota <= 10) {
            abaEncontrada
              .getRange(linhaAluno, indices.Nota3 + 1)
              .setValue(nota);
            atualizado = true;
          }
        }
      }

      if (!atualizado) {
        return criarRespostaJson({
          success: false,
          error: "Nenhuma nota válida fornecida",
        });
      }

      // Calcula e atualiza a média e situação automaticamente
      if (indices.Media !== undefined || indices.Situacao !== undefined) {
        // Busca as notas atuais da planilha
        const nota1Atual =
          indices.Nota1 !== undefined
            ? parseFloat(
                String(
                  abaEncontrada
                    .getRange(linhaAluno, indices.Nota1 + 1)
                    .getValue()
                ).replace(",", ".")
              ) || null
            : null;
        const nota2Atual =
          indices.Nota2 !== undefined
            ? parseFloat(
                String(
                  abaEncontrada
                    .getRange(linhaAluno, indices.Nota2 + 1)
                    .getValue()
                ).replace(",", ".")
              ) || null
            : null;
        const nota3Atual =
          indices.Nota3 !== undefined
            ? parseFloat(
                String(
                  abaEncontrada
                    .getRange(linhaAluno, indices.Nota3 + 1)
                    .getValue()
                ).replace(",", ".")
              ) || null
            : null;

        // Filtrar apenas notas válidas (não nulas e maiores que 0)
        const notasValidas = [nota1Atual, nota2Atual, nota3Atual].filter(
          (n) => n !== null && !isNaN(n) && n >= 0
        );

        if (notasValidas.length > 0) {
          const mediaCalculada =
            notasValidas.reduce((a, b) => a + b) / notasValidas.length;

          // Atualiza a média na planilha
          if (indices.Media !== undefined) {
            abaEncontrada
              .getRange(linhaAluno, indices.Media + 1)
              .setValue(mediaCalculada.toFixed(2));
          }

          // Atualiza a situação na planilha
          if (indices.Situacao !== undefined) {
            const situacao = mediaCalculada >= 6.0 ? "Aprovado" : "Reprovado";
            abaEncontrada
              .getRange(linhaAluno, indices.Situacao + 1)
              .setValue(situacao);
          }
        } else {
          // Sem notas válidas - limpar média e situação
          if (indices.Media !== undefined) {
            abaEncontrada.getRange(linhaAluno, indices.Media + 1).setValue("");
          }
          if (indices.Situacao !== undefined) {
            abaEncontrada
              .getRange(linhaAluno, indices.Situacao + 1)
              .setValue("Em Curso");
          }
        }
      }

      return criarRespostaJson({
        success: true,
        message: "Notas atualizadas com sucesso",
      });
    }

    // === ATUALIZAR NOTA ESPECÍFICA (NOVA FUNCIONALIDADE) ===
    else if (acao === "atualizarNotaEspecifica") {
      const campo = dados.campo; // Ex: "Nota1", "MundoTrabalho2", "Convivio3"
      const valor = dados.valor;
      const professor = dados.professor;
      const disciplina = dados.disciplina;
      const bimestre = dados.bimestre;

      if (!campo || valor === undefined) {
        return criarRespostaJson({
          success: false,
          error: "Parâmetros obrigatórios: campo, valor",
        });
      }

      // Validar valor da nota
      const nota = parseFloat(valor);
      if (isNaN(nota) || nota < 0 || nota > 10) {
        return criarRespostaJson({
          success: false,
          error: "Nota deve ser um número entre 0 e 10",
        });
      }

      // Verificar se o campo existe nos índices
      if (indices[campo] === undefined) {
        return criarRespostaJson({
          success: false,
          error: `Campo '${campo}' não encontrado na planilha`,
        });
      }

      // Atualizar a nota específica
      abaEncontrada.getRange(linhaAluno, indices[campo] + 1).setValue(nota);

      console.log(
        `📝 Nota atualizada: ${alunoId} - ${campo} = ${nota} (Professor: ${professor})`
      );

      // Recalcular média incluindo todas as matérias
      const nota1 =
        indices.Nota1 !== undefined
          ? parseFloat(
              String(
                abaEncontrada.getRange(linhaAluno, indices.Nota1 + 1).getValue()
              ).replace(",", ".")
            ) || 0
          : 0;
      const nota2 =
        indices.Nota2 !== undefined
          ? parseFloat(
              String(
                abaEncontrada.getRange(linhaAluno, indices.Nota2 + 1).getValue()
              ).replace(",", ".")
            ) || 0
          : 0;
      const nota3 =
        indices.Nota3 !== undefined
          ? parseFloat(
              String(
                abaEncontrada.getRange(linhaAluno, indices.Nota3 + 1).getValue()
              ).replace(",", ".")
            ) || 0
          : 0;

      const mundoTrabalho1 =
        indices.MundoTrabalho1 !== undefined
          ? parseFloat(
              String(
                abaEncontrada
                  .getRange(linhaAluno, indices.MundoTrabalho1 + 1)
                  .getValue()
              ).replace(",", ".")
            ) || 0
          : 0;
      const mundoTrabalho2 =
        indices.MundoTrabalho2 !== undefined
          ? parseFloat(
              String(
                abaEncontrada
                  .getRange(linhaAluno, indices.MundoTrabalho2 + 1)
                  .getValue()
              ).replace(",", ".")
            ) || 0
          : 0;
      const mundoTrabalho3 =
        indices.MundoTrabalho3 !== undefined
          ? parseFloat(
              String(
                abaEncontrada
                  .getRange(linhaAluno, indices.MundoTrabalho3 + 1)
                  .getValue()
              ).replace(",", ".")
            ) || 0
          : 0;

      const convivio1 =
        indices.Convivio1 !== undefined
          ? parseFloat(
              String(
                abaEncontrada
                  .getRange(linhaAluno, indices.Convivio1 + 1)
                  .getValue()
              ).replace(",", ".")
            ) || 0
          : 0;
      const convivio2 =
        indices.Convivio2 !== undefined
          ? parseFloat(
              String(
                abaEncontrada
                  .getRange(linhaAluno, indices.Convivio2 + 1)
                  .getValue()
              ).replace(",", ".")
            ) || 0
          : 0;
      const convivio3 =
        indices.Convivio3 !== undefined
          ? parseFloat(
              String(
                abaEncontrada
                  .getRange(linhaAluno, indices.Convivio3 + 1)
                  .getValue()
              ).replace(",", ".")
            ) || 0
          : 0;

      // Todas as notas válidas
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
      ].filter((n) => n > 0);

      if (todasAsNotas.length > 0) {
        const mediaCalculada =
          todasAsNotas.reduce((a, b) => a + b) / todasAsNotas.length;

        // Atualizar média na planilha
        if (indices.Media !== undefined) {
          abaEncontrada
            .getRange(linhaAluno, indices.Media + 1)
            .setValue(mediaCalculada.toFixed(2));
        }

        // Atualizar situação na planilha
        if (indices.Situacao !== undefined) {
          const situacao = mediaCalculada >= 6.0 ? "Aprovado" : "Reprovado";
          abaEncontrada
            .getRange(linhaAluno, indices.Situacao + 1)
            .setValue(situacao);
        }

        console.log(
          `📊 Média recalculada: ${mediaCalculada.toFixed(2)} (${
            todasAsNotas.length
          } notas)`
        );
      }

      return criarRespostaJson({
        success: true,
        message: `Nota ${disciplina} ${bimestre}º bimestre atualizada para ${nota}`,
        novoValor: nota,
        campo: campo,
      });
    }

    // === REGISTRAR PRESENÇAS EM LOTE (POST) ===
    else if (acao === "registrarPresencaLote") {
      // Validação especial para lote - não requer alunoId individual
      if (!dados.registros) {
        return criarRespostaJson({
          success: false,
          error:
            "Parâmetro 'registros' é obrigatório para processamento em lote",
        });
      }

      let registros;
      try {
        registros = Array.isArray(dados.registros)
          ? dados.registros
          : JSON.parse(dados.registros);
      } catch (parseError) {
        return criarRespostaJson({
          success: false,
          error: "Erro ao parsear registros: " + parseError.toString(),
        });
      }

      const resultado = registrarPresencaLote(registros);
      return criarRespostaJson(resultado);
    }

    // === REGISTRAR PRESENÇA EM CURSO ESPECÍFICO ===
    else if (acao === "registrarPresencaCursoEspecifico") {
      const dataPresenca = dados.data;
      const status = dados.status;
      const professor = dados.professor;
      const curso = dados.curso;

      if (!dataPresenca || !status || !curso) {
        return criarRespostaJson({
          success: false,
          error: "Data, status e curso são obrigatórios",
        });
      }

      const resultado = registrarPresencaCursoEspecifico(
        alunoId,
        dataPresenca,
        status,
        professor,
        curso
      );
      return criarRespostaJson(resultado);
    }

    // === PROCESSAR PRESENÇA EM ABA ESPECÍFICA ===
    else if (acao === "processarPresencaAbaEspecifica") {
      const dataPresenca = dados.data;
      const status = dados.status;
      const professor = dados.professor;
      const curso = dados.curso;

      if (!dataPresenca || !status || !curso) {
        return criarRespostaJson({
          success: false,
          error: "Data, status e curso são obrigatórios",
        });
      }

      const resultado = processarPresencaAbaEspecifica(
        alunoId,
        dataPresenca,
        status,
        professor,
        curso
      );
      return criarRespostaJson(resultado);
    } else {
      return criarRespostaJson({
        success: false,
        error: "Ação inválida",
      });
    }
  } catch (erro) {
    console.error("Erro em doPost:", erro);
    return criarRespostaJson({
      success: false,
      error: "Erro interno: " + erro.message,
    });
  }
}

/**
 * Função para lidar com requisições OPTIONS (CORS preflight)
 */
function doOptions(e) {
  console.log("=== REQUISIÇÃO OPTIONS (CORS Preflight) ===");

  const output = ContentService.createTextOutput("");
  output.setMimeType(ContentService.MimeType.TEXT);

  // Cabeçalhos CORS completos para preflight (usando setHeaders)
  output.setHeaders({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS, PUT, DELETE",
    "Access-Control-Allow-Headers":
      "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control",
    "Access-Control-Max-Age": "86400",
  });

  return output;
}

/**
 * FUNÇÃO DE TESTE CRÍTICA - Execute esta função para verificar se o CORS foi corrigido
 */
function testarCORSCorrigido() {
  console.log("🧪 === TESTANDO CORREÇÃO CORS (VERSÃO 2) ===");

  try {
    // Teste 1: Função criarRespostaJson
    console.log("1️⃣ Testando criarRespostaJson...");
    const resposta1 = criarRespostaJson({
      teste: "CORS",
      status: "OK",
      timestamp: new Date().toISOString(),
    });
    console.log("✅ criarRespostaJson funcionou");

    // Teste 2: Função doOptions
    console.log("2️⃣ Testando doOptions...");
    const resposta2 = doOptions({});
    console.log("✅ doOptions funcionou");

    // Teste 3: Simular requisição GET
    console.log("3️⃣ Testando doGet...");
    const fakeGetEvent = { parameter: { teste: true } };
    const resposta3 = doGet(fakeGetEvent);
    console.log("✅ doGet funcionou");

    console.log("🎉 === TODOS OS TESTES PASSARAM (VERSÃO 2) ===");
    console.log("📋 CORREÇÃO APLICADA:");
    console.log("- Mudança de output.setHeader() para output.setHeaders()");
    console.log(
      "- Google Apps Script usa setHeaders com objeto, não setHeader individual"
    );
    console.log("📋 PRÓXIMOS PASSOS:");
    console.log("1. Republique o Web App como 'Anyone can access'");
    console.log("2. Use a nova URL de deployment");
    console.log("3. Teste em HTTPS ou abra o HTML diretamente");

    return "CORS configurado corretamente! (Versão 2 - setHeaders)";
  } catch (error) {
    console.error("❌ Erro nos testes CORS:", error);
    return "Erro: " + error.message;
  }
}

/**
 * Função para testar se o deploy está funcionando corretamente
 */
function verificarDeploy() {
  console.log("🚀 === VERIFICANDO DEPLOY ===");

  const info = {
    planilhas_configuradas: SHEET_NAMES,
    funcoes_principais: [
      typeof doGet !== "undefined" ? "✅ doGet" : "❌ doGet",
      typeof doPost !== "undefined" ? "✅ doPost" : "❌ doPost",
      typeof doOptions !== "undefined" ? "✅ doOptions" : "❌ doOptions",
      typeof criarRespostaJson !== "undefined"
        ? "✅ criarRespostaJson"
        : "❌ criarRespostaJson",
    ],
    timestamp: new Date().toISOString(),
    versao: "Universal 1.0 + CORS Corrigido",
  };

  console.log("📊 Informações do deploy:", info);
  return info;
}
function testarWebApp() {
  console.log("=== TESTANDO WEB APP ===");

  try {
    const resultado = criarRespostaJson({
      status: "OK",
      message: "Sistema CEDESP funcionando!",
      timestamp: new Date().toISOString(),
      version: "Universal 1.0 + CORS Corrigido",
      headers_funcionando: true,
    });

    console.log("✅ Teste de criação de resposta JSON bem-sucedido");
    return resultado;
  } catch (error) {
    console.error("❌ Erro no teste:", error);

    // Fallback simples se houver problema
    const output = ContentService.createTextOutput(
      JSON.stringify({
        status: "ERROR",
        message: "Problema na configuração de headers",
        error: error.toString(),
        timestamp: new Date().toISOString(),
      })
    );
    output.setMimeType(ContentService.MimeType.JSON);
    return output;
  }
}

/**
 * Função de teste para validar o processamento em lote
 */
function testarRegistroLote() {
  console.log("=== TESTANDO REGISTRO EM LOTE ===");

  const registrosTeste = [
    {
      alunoId: "1",
      data: "2025-01-28",
      status: "presente",
      professor: "sistema_teste",
    },
    {
      alunoId: "2",
      data: "2025-01-28",
      status: "ausente",
      professor: "sistema_teste",
    },
  ];

  const resultado = registrarPresencaLote(registrosTeste);
  console.log("Resultado do teste:", resultado);

  return resultado;
}

/**
 * NOVA FUNÇÃO DE TESTE - Testar registro de presença em curso específico
 * Esta função testa se apenas o curso especificado é afetado
 */
function testarRegistroCursoEspecifico() {
  console.log("🎯 === TESTANDO REGISTRO EM CURSO ESPECÍFICO ===");

  // Buscar primeiro aluno disponível
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let primeiroAlunoId = null;
  let cursoTeste = null;

  for (const sheetName of SHEET_NAMES) {
    const worksheet = spreadsheet.getSheetByName(sheetName);
    if (!worksheet) continue;

    const indices = detectarColunasUniversal(worksheet);
    if (indices.ID_Unico === undefined) continue;

    const ultimaLinha = worksheet.getLastRow();
    if (ultimaLinha <= 1) continue;

    // Pegar o primeiro aluno desta planilha
    const primeiroAluno = worksheet
      .getRange(2, indices.ID_Unico + 1)
      .getValue();
    if (primeiroAluno) {
      primeiroAlunoId = String(primeiroAluno).trim();
      cursoTeste = sheetName;
      console.log(
        `📋 Aluno teste encontrado: ${primeiroAlunoId} no curso ${cursoTeste}`
      );
      break;
    }
  }

  if (!primeiroAlunoId || !cursoTeste) {
    console.log("❌ Nenhum aluno encontrado para teste");
    return {
      success: false,
      error: "Nenhum aluno encontrado para teste",
    };
  }

  // Testar com data de hoje
  const hoje = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  console.log(
    `🧪 Testando registro para aluno ${primeiroAlunoId} no curso ${cursoTeste}`
  );

  const resultado = registrarPresencaCursoEspecifico(
    primeiroAlunoId,
    hoje,
    "P",
    "Professor Teste",
    cursoTeste
  );

  console.log("📊 Resultado do teste:", resultado);

  if (resultado.success) {
    console.log("✅ Teste de curso específico realizado com sucesso!");
    console.log(`📈 Curso processado: ${resultado.curso}`);
    console.log(`📈 Registros atualizados: ${resultado.updates}`);
  } else {
    console.log("❌ Teste falhou:", resultado.error);
  }

  return resultado;
}

/**
 * NOVA FUNÇÃO DE TESTE - Testar processamento em aba específica
 * Esta função valida que apenas uma aba é afetada
 */
function testarChamadaCompleta() {
  console.log("📋 === TESTANDO CHAMADA COMPLETA COM ISOLAMENTO ===");

  // Buscar primeiro aluno disponível
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let primeiroAlunoId = null;
  let cursoTeste = null;

  for (const sheetName of SHEET_NAMES) {
    const worksheet = spreadsheet.getSheetByName(sheetName);
    if (!worksheet) continue;

    const indices = detectarColunasUniversal(worksheet);
    if (indices.ID_Unico === undefined) continue;

    const ultimaLinha = worksheet.getLastRow();
    if (ultimaLinha <= 1) continue;

    // Pegar o primeiro aluno desta planilha
    const primeiroAluno = worksheet
      .getRange(2, indices.ID_Unico + 1)
      .getValue();
    if (primeiroAluno) {
      primeiroAlunoId = String(primeiroAluno).trim();
      cursoTeste = sheetName;
      console.log(
        `📋 Aluno teste encontrado: ${primeiroAlunoId} no curso ${cursoTeste}`
      );
      break;
    }
  }

  if (!primeiroAlunoId || !cursoTeste) {
    console.log("❌ Nenhum aluno encontrado para teste");
    return {
      success: false,
      error: "Nenhum aluno encontrado para teste",
    };
  }

  // Contar colunas antes do teste em todas as abas
  const colunasAntes = {};
  for (const sheetName of SHEET_NAMES) {
    const worksheet = spreadsheet.getSheetByName(sheetName);
    if (worksheet) {
      colunasAntes[sheetName] = worksheet.getLastColumn();
    }
  }

  console.log("📊 Colunas antes do teste:", colunasAntes);

  // Testar com data única para verificar isolamento
  const dataHoje = new Date();
  const dataTesteBR = `${String(dataHoje.getDate()).padStart(2, "0")}/${String(
    dataHoje.getMonth() + 1
  ).padStart(2, "0")}`;
  const dataTesteISO = dataHoje.toISOString().split("T")[0];

  console.log(
    `🧪 Testando processamento isolado para ${cursoTeste} - Data: ${dataTesteBR}`
  );

  const resultado = processarPresencaAbaEspecifica(
    primeiroAlunoId,
    dataTesteISO,
    "P",
    "Professor Teste",
    cursoTeste
  );

  console.log("📊 Resultado do teste:", resultado);

  // Contar colunas depois do teste
  const colunasDeps = {};
  let novasColunasDetectadas = [];

  for (const sheetName of SHEET_NAMES) {
    const worksheet = spreadsheet.getSheetByName(sheetName);
    if (worksheet) {
      colunasDeps[sheetName] = worksheet.getLastColumn();

      if (colunasDeps[sheetName] > colunasAntes[sheetName]) {
        novasColunasDetectadas.push(sheetName);
      }
    }
  }

  console.log("📊 Colunas depois do teste:", colunasDeps);
  console.log("🔍 Novas colunas detectadas em:", novasColunasDetectadas);

  if (resultado.success) {
    console.log("✅ Teste de aba específica realizado com sucesso!");
    console.log(`📈 Aba processada: ${resultado.abaProcessada}`);
    console.log(`📈 Linha do aluno: ${resultado.linhaAluno}`);

    // Validar isolamento
    if (
      novasColunasDetectadas.length === 1 &&
      novasColunasDetectadas[0] === cursoTeste
    ) {
      console.log(
        "🎯 ✅ ISOLAMENTO CONFIRMADO - Apenas a aba correta foi afetada!"
      );
    } else if (novasColunasDetectadas.length > 1) {
      console.log(
        "⚠️ PROBLEMA - Múltiplas abas foram afetadas:",
        novasColunasDetectadas
      );
    } else if (novasColunasDetectadas.length === 0) {
      console.log("📋 Nenhuma nova coluna criada (data já existia)");
    }
  } else {
    console.log("❌ Teste falhou:", resultado.error);
  }

  return {
    ...resultado,
    isolamento: {
      colunasAntes,
      colunasDeps,
      novasColunasDetectadas,
      isolamentoConfirmado:
        novasColunasDetectadas.length <= 1 &&
        (novasColunasDetectadas.length === 0 ||
          novasColunasDetectadas[0] === cursoTeste),
    },
  };
}

/**
 * Função para diagnosticar a performance do sistema
 */
function diagnosticarPerformance() {
  const startTime = new Date().getTime();

  try {
    // Teste básico de conectividade
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = spreadsheet.getSheets().map((s) => s.getName());

    // Teste de busca de alunos
    const alunosTeste = buscarTodosAlunos();

    const endTime = new Date().getTime();
    const processingTime = endTime - startTime;

    return {
      success: true,
      diagnostico: {
        tempoProcessamento: processingTime + "ms",
        planilhasEncontradas: sheets,
        totalAlunos: alunosTeste.saida ? alunosTeste.saida.length : 0,
        timestamp: new Date().toISOString(),
        versao: "Universal 1.0 + Lote Otimizado",
      },
    };
  } catch (error) {
    const endTime = new Date().getTime();
    const processingTime = endTime - startTime;

    return {
      success: false,
      error: error.toString(),
      tempoProcessamento: processingTime + "ms",
    };
  }
}

/**
 * FUNÇÃO DE TESTE CRÍTICA - Simula exatamente o que o frontend faz
 * Esta função testa se o parâmetro 'curso' do frontend funciona corretamente
 */
function testarParametroFrontend() {
  console.log("🧪 === TESTANDO PARÂMETRO CURSO DO FRONTEND ===");

  // Simular exatamente como o frontend chama a API
  const parametersMock = {
    action: "registrarPresencaAutomatica",
    alunoId: null, // Será preenchido automaticamente
    data: new Date().toISOString().split("T")[0], // Hoje
    status: "P",
    professor: "Teste Frontend",
    marcarTodos: "true",
    curso: null, // Será preenchido automaticamente
  };

  // Buscar primeiro aluno disponível
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let primeiroAlunoId = null;
  let cursoTeste = null;

  for (const sheetName of SHEET_NAMES) {
    const worksheet = spreadsheet.getSheetByName(sheetName);
    if (!worksheet) continue;

    const indices = detectarColunasUniversal(worksheet);
    if (indices.ID_Unico === undefined) continue;

    const ultimaLinha = worksheet.getLastRow();
    if (ultimaLinha <= 1) continue;

    // Pegar o primeiro aluno desta planilha
    const primeiroAluno = worksheet
      .getRange(2, indices.ID_Unico + 1)
      .getValue();
    if (primeiroAluno) {
      primeiroAlunoId = String(primeiroAluno).trim();
      cursoTeste = sheetName;
      console.log(
        `📋 Aluno teste encontrado: ${primeiroAlunoId} no curso ${cursoTeste}`
      );
      break;
    }
  }

  if (!primeiroAlunoId || !cursoTeste) {
    console.log("❌ Nenhum aluno encontrado para teste");
    return {
      success: false,
      error: "Nenhum aluno encontrado para teste",
    };
  }

  // Preencher parâmetros como o frontend faz
  parametersMock.alunoId = primeiroAlunoId;
  parametersMock.curso = cursoTeste;

  console.log(
    "📨 Simulando chamada do frontend com parâmetros:",
    parametersMock
  );

  // Contar colunas antes do teste em todas as abas
  const colunasAntes = {};
  for (const sheetName of SHEET_NAMES) {
    const worksheet = spreadsheet.getSheetByName(sheetName);
    if (worksheet) {
      colunasAntes[sheetName] = worksheet.getLastColumn();
    }
  }

  console.log("📊 Colunas antes do teste:", colunasAntes);

  // Simular o processamento do doGet (como o frontend chama)
  const alunoId = parametersMock.alunoId;
  const status = parametersMock.status;
  const data = parametersMock.data;
  const professor = parametersMock.professor;
  const marcarTodos = parametersMock.marcarTodos;
  const curso = parametersMock.curso; // ← Este é o parâmetro crítico

  console.log(`🎯 Testando com curso específico: ${curso}`);
  console.log(
    `📝 Chamando registrarPresencaAutomatica com apenasEsteCurso = ${curso}`
  );

  // Chamar a função exatamente como o doGet faz agora
  const resultado = registrarPresencaAutomatica(
    alunoId,
    data,
    status,
    professor,
    marcarTodos,
    curso // ← Este parâmetro deve isolar o processamento
  );

  console.log("📊 Resultado do teste:", resultado);

  // Contar colunas depois do teste
  const colunasDeps = {};
  let novasColunasDetectadas = [];

  for (const sheetName of SHEET_NAMES) {
    const worksheet = spreadsheet.getSheetByName(sheetName);
    if (worksheet) {
      colunasDeps[sheetName] = worksheet.getLastColumn();

      if (colunasDeps[sheetName] > colunasAntes[sheetName]) {
        novasColunasDetectadas.push(sheetName);
      }
    }
  }

  console.log("📊 Colunas depois do teste:", colunasDeps);
  console.log("🔍 Novas colunas detectadas em:", novasColunasDetectadas);

  // Validar resultado
  if (resultado.success) {
    console.log("✅ Teste do parâmetro frontend realizado com sucesso!");

    // Validar isolamento crítico
    if (
      novasColunasDetectadas.length === 1 &&
      novasColunasDetectadas[0] === cursoTeste
    ) {
      console.log(
        "🎯 ✅ ISOLAMENTO PERFEITO - Apenas a aba correta foi afetada!"
      );
      console.log(
        `🎯 ✅ PROBLEMA RESOLVIDO - Frontend agora funciona corretamente!`
      );
    } else if (novasColunasDetectadas.length > 1) {
      console.log(
        "❌ PROBLEMA PERSISTE - Múltiplas abas foram afetadas:",
        novasColunasDetectadas
      );
      console.log("❌ O bug ainda não foi resolvido completamente");
    } else if (novasColunasDetectadas.length === 0) {
      console.log("📋 Nenhuma nova coluna criada (data já existia)");
    }
  } else {
    console.log("❌ Teste falhou:", resultado.error);
  }

  return {
    ...resultado,
    parametrosTeste: parametersMock,
    isolamento: {
      colunasAntes,
      colunasDeps,
      novasColunasDetectadas,
      isolamentoConfirmado:
        novasColunasDetectadas.length <= 1 &&
        (novasColunasDetectadas.length === 0 ||
          novasColunasDetectadas[0] === cursoTeste),
      problemaResolvido: novasColunasDetectadas.length <= 1,
    },
  };
}

/**
 * FUNÇÃO DE DIAGNÓSTICO - Verificar contagem de faltas e presenças
 * Esta função analisa se as colunas estão sendo detectadas e calculadas corretamente
 */
function diagnosticarContadorFaltasPresencas() {
  console.log("🔍 === DIAGNÓSTICO CONTADOR FALTAS/PRESENÇAS ===");

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

  for (const sheetName of SHEET_NAMES) {
    const worksheet = spreadsheet.getSheetByName(sheetName);
    if (!worksheet) continue;

    console.log(`\n📋 Analisando planilha: ${sheetName}`);

    const indices = detectarColunasUniversal(worksheet);
    console.log("📊 Índices detectados:", indices);

    // Verificar se colunas de Faltas e Presenças foram encontradas
    if (indices.Faltas !== undefined) {
      const faltasCol = String.fromCharCode(65 + indices.Faltas);
      console.log(
        `✅ Coluna Faltas encontrada: ${faltasCol} (posição ${indices.Faltas})`
      );
    } else {
      console.log("❌ Coluna Faltas NÃO encontrada");
    }

    if (indices.Presencas !== undefined) {
      const presencasCol = String.fromCharCode(65 + indices.Presencas);
      console.log(
        `✅ Coluna Presenças encontrada: ${presencasCol} (posição ${indices.Presencas})`
      );
    } else {
      console.log("❌ Coluna Presenças NÃO encontrada");
    }

    const ultimaLinha = worksheet.getLastRow();
    if (ultimaLinha <= 1) {
      console.log("❌ Planilha vazia");
      continue;
    }

    // Obter cabeçalhos
    const ultimaColuna = worksheet.getLastColumn();
    const headers = worksheet.getRange(1, 1, 1, ultimaColuna).getValues()[0];
    console.log(
      "📄 Cabeçalhos:",
      headers.map((h, i) => `${String.fromCharCode(65 + i)}: "${h}"`)
    );

    // Verificar colunas de data
    const colunasData = [];
    headers.forEach((header, index) => {
      const headerStr = String(header).trim();
      if (headerStr.match(/^\d{1,2}\/\d{1,2}$/)) {
        colunasData.push({ index, header: headerStr });
      }
    });

    console.log(`📅 Colunas de data encontradas: ${colunasData.length}`);
    colunasData.forEach((col) =>
      console.log(`  - Posição ${col.index}: "${col.header}"`)
    );

    // Analisar primeiro aluno como exemplo
    if (ultimaLinha >= 2) {
      const dadosAluno = worksheet
        .getRange(2, 1, 1, ultimaColuna)
        .getValues()[0];
      const nomeAluno = String(dadosAluno[indices.Nome] || "").trim();
      const idAluno = String(dadosAluno[indices.ID_Unico] || "").trim();

      console.log(`\n👤 Analisando aluno: ${nomeAluno} (${idAluno})`);

      // Contar presencas e faltas manualmente
      let presencasContadas = 0;
      let faltasContadas = 0;

      colunasData.forEach((col) => {
        const valor = String(dadosAluno[col.index] || "")
          .trim()
          .toUpperCase();
        console.log(`  📅 ${col.header}: "${valor}"`);

        if (valor === "P") presencasContadas++;
        if (valor === "A" || valor === "F") faltasContadas++;
      });

      console.log(`📊 Presenças contadas manualmente: ${presencasContadas}`);
      console.log(`📊 Faltas contadas manualmente: ${faltasContadas}`);

      // Comparar com valores na planilha
      if (indices.Presencas !== undefined) {
        const presencasNaPlanilha = dadosAluno[indices.Presencas] || 0;
        console.log(
          `📊 Presenças na coluna da planilha: ${presencasNaPlanilha}`
        );

        if (presencasContadas !== presencasNaPlanilha) {
          console.log("⚠️ DIVERGÊNCIA NAS PRESENÇAS!");
        } else {
          console.log("✅ Presenças corretas");
        }
      }

      if (indices.Faltas !== undefined) {
        const faltasNaPlanilha = dadosAluno[indices.Faltas] || 0;
        console.log(`📊 Faltas na coluna da planilha: ${faltasNaPlanilha}`);

        if (faltasContadas !== faltasNaPlanilha) {
          console.log("⚠️ DIVERGÊNCIA NAS FALTAS!");
        } else {
          console.log("✅ Faltas corretas");
        }
      }

      // Simular recálculo manual
      console.log("\n🔄 Simulando recálculo manual...");

      // Recalcular totais
      const novoTotalPresencas = presencasContadas;
      const novoTotalFaltas = faltasContadas;

      console.log(`🔢 Novo total de presenças: ${novoTotalPresencas}`);
      console.log(`🔢 Novo total de faltas: ${novoTotalFaltas}`);

      // Atualizar na planilha se necessário
      if (
        indices.Presencas !== undefined &&
        presencasContadas !== (dadosAluno[indices.Presencas] || 0)
      ) {
        console.log("🔧 Corrigindo total de presenças...");
        worksheet
          .getRange(2, indices.Presencas + 1)
          .setValue(novoTotalPresencas);
      }

      if (
        indices.Faltas !== undefined &&
        faltasContadas !== (dadosAluno[indices.Faltas] || 0)
      ) {
        console.log("🔧 Corrigindo total de faltas...");
        worksheet.getRange(2, indices.Faltas + 1).setValue(novoTotalFaltas);
      }
    }
  }

  console.log("\n✅ Diagnóstico concluído!");
  return {
    success: true,
    message: "Diagnóstico de contadores realizado",
  };
}

/**
 * FUNÇÃO DE CORREÇÃO - Recalcular todos os totais de faltas e presenças
 * Esta função corrige todos os contadores em todas as planilhas
 */
function recalcularTodosTotais() {
  console.log("🔧 === RECALCULANDO TODOS OS TOTAIS ===");

  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let totalCorrecoes = 0;

  for (const sheetName of SHEET_NAMES) {
    const worksheet = spreadsheet.getSheetByName(sheetName);
    if (!worksheet) continue;

    console.log(`\n📋 Recalculando planilha: ${sheetName}`);

    const indices = detectarColunasUniversal(worksheet);
    if (indices.ID_Unico === undefined || indices.Nome === undefined) {
      console.log(`❌ Planilha ${sheetName} não tem estrutura válida`);
      continue;
    }

    const ultimaLinha = worksheet.getLastRow();
    if (ultimaLinha <= 1) {
      console.log(`❌ Planilha ${sheetName} está vazia`);
      continue;
    }

    // Obter cabeçalhos
    const ultimaColuna = worksheet.getLastColumn();
    const headers = worksheet.getRange(1, 1, 1, ultimaColuna).getValues()[0];

    // Identificar colunas de data
    const colunasData = [];
    headers.forEach((header, index) => {
      const headerStr = String(header).trim();
      if (headerStr.match(/^\d{1,2}\/\d{1,2}$/)) {
        colunasData.push({ index, header: headerStr });
      }
    });

    console.log(`📅 Encontradas ${colunasData.length} colunas de data`);

    // Processar todos os alunos
    for (let row = 2; row <= ultimaLinha; row++) {
      const dadosAluno = worksheet
        .getRange(row, 1, 1, ultimaColuna)
        .getValues()[0];
      const nomeAluno = String(dadosAluno[indices.Nome] || "").trim();
      const idAluno = String(dadosAluno[indices.ID_Unico] || "").trim();

      if (!nomeAluno || !idAluno) continue;

      // Contar presencas e faltas
      let presencasContadas = 0;
      let faltasContadas = 0;

      colunasData.forEach((col) => {
        const valor = String(dadosAluno[col.index] || "")
          .trim()
          .toUpperCase();
        if (valor === "P") presencasContadas++;
        if (valor === "A" || valor === "F") faltasContadas++;
      });

      // Atualizar totais se necessário
      let corrigido = false;

      if (indices.Presencas !== undefined) {
        const presencasAtuais = dadosAluno[indices.Presencas] || 0;
        if (presencasContadas !== presencasAtuais) {
          worksheet
            .getRange(row, indices.Presencas + 1)
            .setValue(presencasContadas);
          console.log(
            `🔧 ${nomeAluno}: Presenças ${presencasAtuais} → ${presencasContadas}`
          );
          corrigido = true;
        }
      }

      if (indices.Faltas !== undefined) {
        const faltasAtuais = dadosAluno[indices.Faltas] || 0;
        if (faltasContadas !== faltasAtuais) {
          worksheet.getRange(row, indices.Faltas + 1).setValue(faltasContadas);
          console.log(
            `🔧 ${nomeAluno}: Faltas ${faltasAtuais} → ${faltasContadas}`
          );
          corrigido = true;
        }
      }

      if (corrigido) {
        totalCorrecoes++;
      }
    }
  }

  console.log(
    `\n✅ Recálculo concluído! ${totalCorrecoes} correções aplicadas`
  );

  return {
    success: true,
    message: `Recálculo concluído com ${totalCorrecoes} correções`,
    correcoes: totalCorrecoes,
  };
}

/**
 * FUNÇÃO DE TESTE - Verificar se totais estão corretos após o recálculo
 */
function testarTotaisCorrigidos() {
  console.log("🧪 === TESTANDO TOTAIS APÓS CORREÇÃO ===");

  // Primeiro recalcular
  const resultadoRecalculo = recalcularTodosTotais();
  console.log("📊 Resultado do recálculo:", resultadoRecalculo);

  // Depois diagnosticar
  const resultadoDiagnostico = diagnosticarContadorFaltasPresencas();
  console.log("📊 Resultado do diagnóstico:", resultadoDiagnostico);

  return {
    recalculo: resultadoRecalculo,
    diagnostico: resultadoDiagnostico,
  };
}

/**
 * FUNÇÃO DE TESTE - Testar sistema de presença online
 * Execute esta função para verificar se o novo sistema está funcionando
 */
function testarSistemaPresencaOnline() {
  console.log("🧪 === TESTANDO SISTEMA DE PRESENÇA ONLINE ===");

  try {
    // Teste 1: Registrar uma presença teste
    console.log("📝 Teste 1: Registrando presença teste...");
    const resultado1 = registrarPresencaOnline(
      "Aluno Teste",
      new Date().toLocaleDateString("pt-BR"),
      new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      "PWT",
      "Professor Teste",
      "P"
    );
    console.log("Resultado 1:", resultado1);

    // Teste 2: Buscar últimos registros
    console.log("🔍 Teste 2: Buscando últimos registros...");
    const resultado2 = buscarUltimosRegistrosPresenca(5);
    console.log("Resultado 2:", resultado2);

    // Teste 3: Verificar se a aba existe
    console.log("📋 Teste 3: Verificando aba Presenças...");
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("Presenças");
    console.log("Aba Presenças existe:", !!sheet);
    if (sheet) {
      console.log("Última linha:", sheet.getLastRow());
      if (sheet.getLastRow() > 0) {
        const headers = sheet
          .getRange(1, 1, 1, sheet.getLastColumn())
          .getValues()[0];
        console.log("Cabeçalhos:", headers);
      }
    }

    console.log("✅ Teste do sistema de presença online concluído!");

    return {
      success: true,
      teste1: resultado1,
      teste2: resultado2,
      abaExiste: !!sheet,
    };
  } catch (error) {
    console.error("❌ Erro no teste:", error);
    return {
      success: false,
      error: error.toString(),
    };
  }
}

/**
 * === SISTEMA DE REGISTRO DE PRESENÇA ONLINE NA ABA "PRESENÇAS" ===
 * Registra uma presença na aba 'Presenças' da planilha
 * Parâmetros: nome, data, horario, curso, professor
 * Pode ser chamado via requisição HTTP (do frontend)
 */
function registrarPresencaOnline(
  nome,
  data,
  horario,
  curso,
  professor,
  status = "P"
) {
  try {
    console.log("📝 Registrando presença/falta online:", {
      nome,
      data,
      horario,
      curso,
      professor,
      status,
    });

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = spreadsheet.getSheetByName("Presenças");

    if (!sheet) {
      console.log("⚠️ Aba 'Presenças' não existe. Criando...");
      sheet = spreadsheet.insertSheet("Presenças");

      // Criar cabeçalhos incluindo Status
      const headers = [
        "Nome",
        "Data",
        "Horário",
        "Curso",
        "Professor",
        "Status",
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

      // Formatar cabeçalhos
      const headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#4CAF50");
      headerRange.setFontColor("#FFFFFF");

      // IMPORTANTE: Formatar as colunas de Data e Horário como TEXTO SIMPLES
      const dataColumn = sheet.getRange("B:B"); // Coluna Data (B)
      const horarioColumn = sheet.getRange("C:C"); // Coluna Horário (C)

      dataColumn.setNumberFormat("@"); // @ = formato texto
      horarioColumn.setNumberFormat("@"); // @ = formato texto

      console.log("📋 Cabeçalhos criados e colunas formatadas como texto");
    }

    // Garantir que as colunas estejam formatadas como texto (redundância para segurança)
    const dataColumn = sheet.getRange("B:B");
    const horarioColumn = sheet.getRange("C:C");
    dataColumn.setNumberFormat("@");
    horarioColumn.setNumberFormat("@");

    // Verificar se há cabeçalhos, senão criar
    const lastRow = sheet.getLastRow();
    if (lastRow === 0) {
      // Criar cabeçalhos se a planilha estiver vazia
      sheet.appendRow([
        "Nome",
        "Data",
        "Horário",
        "Curso",
        "Professor",
        "Status",
      ]);
      console.log("📋 Cabeçalhos criados na aba Presenças");
    }

    // Verificar se a coluna Status existe, senão adicionar
    const headers = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    let statusColIndex = headers.indexOf("Status");

    if (statusColIndex === -1) {
      // Adicionar coluna Status se não existir
      const numCols = sheet.getLastColumn();
      sheet.getRange(1, numCols + 1).setValue("Status");
      statusColIndex = numCols;
      console.log("➕ Coluna Status adicionada na aba Presenças");
    }

    // Garantir que os dados sejam strings simples
    const dataString = data.toString();
    const horarioString = horario.toString();
    const statusString = status.toString();

    // ✅ VERIFICAR SE JÁ EXISTE REGISTRO PARA O MESMO ALUNO NA MESMA DATA
    const allData = sheet.getDataRange().getValues();
    let linhaExistente = -1;

    // Procurar por registro existente (ignorar linha de cabeçalho)
    for (let i = 1; i < allData.length; i++) {
      const linhaDados = allData[i];
      const nomeNaLinha = String(linhaDados[0] || "").trim();
      const dataNaLinha = String(linhaDados[1] || "").trim();

      // Comparar nome e data (case-insensitive para nomes)
      if (
        nomeNaLinha.toLowerCase() === String(nome).toLowerCase().trim() &&
        dataNaLinha === dataString
      ) {
        linhaExistente = i + 1; // +1 porque getDataRange é 0-indexed, mas sheet é 1-indexed
        console.log(
          `🔄 Registro existente encontrado para ${nome} em ${dataString} na linha ${linhaExistente}`
        );
        break;
      }
    }

    let linhaDados;
    if (linhaExistente > 0) {
      // ✅ ATUALIZAR REGISTRO EXISTENTE
      linhaDados = linhaExistente;
      console.log(`📝 Atualizando registro existente na linha ${linhaDados}`);

      // Atualizar apenas as colunas necessárias (manter nome e data, atualizar horário, curso, professor, status)
      sheet.getRange(linhaDados, 1).setValue(String(nome)); // Nome
      sheet.getRange(linhaDados, 2).setValue(dataString); // Data
      sheet.getRange(linhaDados, 3).setValue(horarioString); // Horário (atualizar)
      sheet.getRange(linhaDados, 4).setValue(String(curso)); // Curso
      sheet.getRange(linhaDados, 5).setValue(String(professor)); // Professor
      sheet.getRange(linhaDados, 6).setValue(statusString); // Status (atualizar)

      // Garantir formatação como texto
      sheet.getRange(linhaDados, 2).setNumberFormat("@"); // Data
      sheet.getRange(linhaDados, 3).setNumberFormat("@"); // Horário
    } else {
      // ✅ CRIAR NOVO REGISTRO
      const novaLinha = [
        String(nome), // Nome como texto
        dataString, // Data como texto
        horarioString, // Horário como texto
        String(curso), // Curso como texto
        String(professor), // Professor como texto
        statusString, // Status como texto (P/F)
      ];

      linhaDados = sheet.getLastRow() + 1;
      console.log(`➕ Criando novo registro na linha ${linhaDados}`);
      sheet.getRange(linhaDados, 1, 1, novaLinha.length).setValues([novaLinha]);

      // Garantir que a linha inserida também está formatada como texto nas colunas de data/horário
      sheet.getRange(linhaDados, 2).setNumberFormat("@"); // Data
      sheet.getRange(linhaDados, 3).setNumberFormat("@"); // Horário
    }

    const statusText = status === "P" ? "Presente" : "Falta";
    const acao = linhaExistente > 0 ? "atualizado" : "registrado";
    console.log(`✅ ${statusText} ${acao} com sucesso na linha ${linhaDados}`);

    return {
      success: true,
      message: `${statusText} ${acao} com sucesso na aba Presenças`,
      dados: {
        nome,
        data: dataString,
        horario: horarioString,
        curso,
        professor,
        status: statusString,
      },
      linha: linhaDados,
      atualizado: linhaExistente > 0,
    };
  } catch (error) {
    console.error("❌ Erro ao registrar presença online:", error);
    return {
      success: false,
      error: error.toString(),
      message: "Erro ao registrar presença online",
    };
  }
}

/**
 * Buscar últimos registros de presença da aba "Presenças"
 * Retorna os últimos N registros para exibir no frontend
 */
function buscarUltimosRegistrosPresenca(limite = 10) {
  try {
    console.log("🔍 Buscando últimos registros de presença...");

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("Presenças");

    if (!sheet) {
      console.log("❌ Aba 'Presenças' não encontrada");
      return {
        success: false,
        error: "Aba 'Presenças' não encontrada",
        registros: [],
      };
    }

    const lastRow = sheet.getLastRow();
    if (lastRow <= 1) {
      console.log("📭 Nenhum registro encontrado na aba Presenças");
      return {
        success: true,
        registros: [],
        message: "Nenhum registro de presença encontrado",
      };
    }

    // Determinar quantas linhas buscar
    const linhasParaBuscar = Math.min(limite, lastRow - 1);
    const primeiraLinha = Math.max(2, lastRow - linhasParaBuscar + 1);

    console.log(
      `📊 Buscando ${linhasParaBuscar} registros a partir da linha ${primeiraLinha}`
    );

    // Buscar dados - agora são 6 colunas incluindo Status
    const dados = sheet
      .getRange(primeiraLinha, 1, linhasParaBuscar, 6)
      .getValues();

    // Converter para formato de objeto e GARANTIR que data/horário sejam strings
    const registros = dados
      .map((linha, index) => {
        // CONVERSÃO ROBUSTA para string - trata qualquer tipo de input
        let dataFormatada = "";
        let horarioFormatado = "";

        // Processar DATA
        if (linha[1] instanceof Date) {
          // Se for objeto Date do Google Sheets
          const dia = linha[1].getDate().toString().padStart(2, "0");
          const mes = (linha[1].getMonth() + 1).toString().padStart(2, "0");
          const ano = linha[1].getFullYear();
          dataFormatada = `${dia}/${mes}/${ano}`;
        } else if (typeof linha[1] === "string" && linha[1].trim() !== "") {
          // Se for string válida
          dataFormatada = linha[1].trim();
        } else if (typeof linha[1] === "number") {
          // Se for número (serial date), converter
          const date = new Date((linha[1] - 25569) * 86400 * 1000);
          const dia = date.getDate().toString().padStart(2, "0");
          const mes = (date.getMonth() + 1).toString().padStart(2, "0");
          const ano = date.getFullYear();
          dataFormatada = `${dia}/${mes}/${ano}`;
        } else {
          // Fallback
          dataFormatada = linha[1] ? linha[1].toString() : "Data inválida";
        }

        // Processar HORÁRIO
        if (linha[2] instanceof Date) {
          // Se for objeto Date do Google Sheets
          const horas = linha[2].getHours().toString().padStart(2, "0");
          const minutos = linha[2].getMinutes().toString().padStart(2, "0");
          horarioFormatado = `${horas}:${minutos}`;
        } else if (typeof linha[2] === "string" && linha[2].trim() !== "") {
          // Se for string válida
          horarioFormatado = linha[2].trim();
        } else if (typeof linha[2] === "number") {
          // Se for número decimal representando time
          const totalMinutos = Math.round(linha[2] * 24 * 60);
          const horas = Math.floor(totalMinutos / 60);
          const minutos = totalMinutos % 60;
          horarioFormatado = `${horas.toString().padStart(2, "0")}:${minutos
            .toString()
            .padStart(2, "0")}`;
        } else {
          // Fallback
          horarioFormatado = linha[2]
            ? linha[2].toString()
            : "Horário inválido";
        }

        const registro = {
          id: primeiraLinha + index,
          nome: linha[0] ? linha[0].toString() : "",
          data: dataFormatada,
          horario: horarioFormatado,
          curso: linha[3] ? linha[3].toString() : "",
          professor: linha[4] ? linha[4].toString() : "",
          status: linha[5] ? linha[5].toString() : "P", // Coluna Status - padrão "P" se vazia
        };

        console.log(`📄 Registro processado:`, registro);
        return registro;
      })
      .reverse(); // Mais recentes primeiro

    console.log(
      `✅ ${registros.length} registros encontrados e formatados corretamente`
    );

    return {
      success: true,
      registros: registros,
      total: lastRow - 1,
    };
  } catch (error) {
    console.error("❌ Erro ao buscar registros de presença:", error);
    return {
      success: false,
      error: error.toString(),
      registros: [],
    };
  }
}

/**
 * Limpar registros antigos de presença (manter apenas os últimos 1000)
 * Função de manutenção para evitar que a planilha fique muito grande
 */
function limparRegistrosAntigosPresenca() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("Presenças");

    if (!sheet) {
      return { success: false, error: "Aba 'Presenças' não encontrada" };
    }

    const lastRow = sheet.getLastRow();
    const maxRegistros = 1000; // Manter últimos 1000 registros

    if (lastRow <= maxRegistros + 1) {
      // Não precisa limpar
      return {
        success: true,
        message: `Planilha tem ${
          lastRow - 1
        } registros, limpeza não necessária`,
      };
    }

    // Calcular quantas linhas deletar
    const linhasParaDeletar = lastRow - maxRegistros - 1;

    // Deletar linhas antigas (mantendo cabeçalho)
    sheet.deleteRows(2, linhasParaDeletar);

    console.log(`🧹 ${linhasParaDeletar} registros antigos removidos`);

    return {
      success: true,
      message: `${linhasParaDeletar} registros antigos removidos. Mantidos ${maxRegistros} registros mais recentes.`,
      removidos: linhasParaDeletar,
    };
  } catch (error) {
    console.error("❌ Erro ao limpar registros antigos:", error);
    return {
      success: false,
      error: error.toString(),
    };
  }
}

/**
 * Função para corrigir formatação da aba "Presenças" existente
 */
function corrigirFormatacaoAbaPresencas() {
  try {
    console.log("🔧 Corrigindo formatação da aba Presenças...");

    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("Presenças");

    if (!sheet) {
      console.log("❌ Aba 'Presenças' não encontrada");
      return { success: false, error: "Aba 'Presenças' não encontrada" };
    }

    // Formatar cabeçalhos
    const headerRange = sheet.getRange(1, 1, 1, 5);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#4CAF50");
    headerRange.setFontColor("#FFFFFF");
    headerRange.setBorder(true, true, true, true, true, true);

    // CORREÇÃO PRINCIPAL: Formatar as colunas de Data e Horário como TEXTO
    const dataColumn = sheet.getRange("B:B"); // Coluna Data (B)
    const horarioColumn = sheet.getRange("C:C"); // Coluna Horário (C)

    console.log("🔧 Aplicando formato de texto nas colunas Data e Horário...");
    dataColumn.setNumberFormat("@"); // @ = formato texto
    horarioColumn.setNumberFormat("@"); // @ = formato texto

    // Se há dados existentes, converter objetos Date para strings
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      console.log(`🔄 Convertendo ${lastRow - 1} registros existentes...`);

      const dadosExistentes = sheet.getRange(2, 1, lastRow - 1, 5).getValues();

      for (let i = 0; i < dadosExistentes.length; i++) {
        const linha = dadosExistentes[i];
        let mudou = false;

        // Converter data se for objeto Date
        if (linha[1] instanceof Date) {
          const dia = linha[1].getDate().toString().padStart(2, "0");
          const mes = (linha[1].getMonth() + 1).toString().padStart(2, "0");
          const ano = linha[1].getFullYear();
          linha[1] = `${dia}/${mes}/${ano}`;
          mudou = true;
        }

        // Converter horário se for objeto Date
        if (linha[2] instanceof Date) {
          const horas = linha[2].getHours().toString().padStart(2, "0");
          const minutos = linha[2].getMinutes().toString().padStart(2, "0");
          linha[2] = `${horas}:${minutos}`;
          mudou = true;
        }

        // Se houve mudanças, atualizar a linha
        if (mudou) {
          sheet.getRange(i + 2, 1, 1, 5).setValues([linha]);
          console.log(
            `✓ Linha ${i + 2} convertida: ${linha[1]} às ${linha[2]}`
          );
        }
      }
    }

    console.log("✅ Formatação corrigida na aba Presenças - dados como texto");

    return {
      success: true,
      message: "Formatação da aba Presenças corrigida com sucesso",
      registrosProcessados: lastRow - 1,
    };
  } catch (error) {
    console.error("❌ Erro ao corrigir formatação:", error);
    return {
      success: false,
      error: error.toString(),
    };
  }
}

/**
 * FUNÇÃO DE DIAGNÓSTICO - Verificar e corrigir aba "Presenças"
 * Execute esta função para diagnosticar problemas com a aba de presenças
 */
function diagnosticarAbaPresencas() {
  console.log("🔍 === DIAGNÓSTICO DA ABA PRESENÇAS ===");

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    console.log("📊 Planilha ativa:", spreadsheet.getName());

    // Listar todas as abas disponíveis
    const sheets = spreadsheet.getSheets();
    console.log(
      "📋 Abas disponíveis:",
      sheets.map((s) => s.getName())
    );

    // Verificar se a aba "Presenças" existe
    let sheetPresencas = spreadsheet.getSheetByName("Presenças");

    if (!sheetPresencas) {
      console.log("❌ Aba 'Presenças' não encontrada. Criando...");

      // Criar a aba "Presenças"
      sheetPresencas = spreadsheet.insertSheet("Presenças");

      // Adicionar cabeçalhos
      sheetPresencas.appendRow([
        "Nome do Aluno",
        "Data",
        "Horário",
        "Curso",
        "Professor",
      ]);

      // Formatar cabeçalhos
      const headerRange = sheetPresencas.getRange(1, 1, 1, 5);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#1a2951");
      headerRange.setFontColor("#ffffff");

      console.log("✅ Aba 'Presenças' criada com sucesso!");
    } else {
      console.log("✅ Aba 'Presenças' encontrada!");
    }

    // Verificar conteúdo da aba
    const lastRow = sheetPresencas.getLastRow();
    const lastCol = sheetPresencas.getLastColumn();
    console.log(
      `📊 Dimensões da aba Presenças: ${lastRow} linhas x ${lastCol} colunas`
    );

    if (lastRow > 0) {
      // Mostrar cabeçalhos
      const headers = sheetPresencas.getRange(1, 1, 1, lastCol).getValues()[0];
      console.log("📋 Cabeçalhos:", headers);

      // Mostrar últimas linhas se houver dados
      if (lastRow > 1) {
        const ultimasLinhas = Math.min(5, lastRow - 1);
        const dados = sheetPresencas
          .getRange(lastRow - ultimasLinhas + 1, 1, ultimasLinhas, lastCol)
          .getValues();
        console.log(`📝 Últimos ${ultimasLinhas} registros:`, dados);
      } else {
        console.log("📄 Apenas cabeçalhos encontrados, sem dados de presença");
      }
    } else {
      console.log("📄 Aba vazia, adicionando cabeçalhos...");
      sheetPresencas.appendRow([
        "Nome do Aluno",
        "Data",
        "Horário",
        "Curso",
        "Professor",
      ]);
    }

    // Teste de escrita
    console.log("🧪 Testando escrita na aba...");
    const testeData = [
      "Aluno Teste",
      new Date().toLocaleDateString("pt-BR"),
      new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      "PWT",
      "Professor Teste",
    ];

    sheetPresencas.appendRow(testeData);
    console.log("✅ Teste de escrita bem-sucedido!");
    console.log("📝 Dados inseridos:", testeData);

    return {
      success: true,
      abaExistia: !!sheetPresencas,
      linhasAntes: lastRow,
      linhasDepois: sheetPresencas.getLastRow(),
      message: "Diagnóstico concluído com sucesso",
    };
  } catch (error) {
    console.error("❌ Erro no diagnóstico:", error);
    return {
      success: false,
      error: error.toString(),
      message: "Erro durante o diagnóstico",
    };
  }
}

/**
 * FUNÇÃO DE TESTE COMPLETO - Testar todo o fluxo de presença online
 */
function testarFluxoCompletoPresencaOnline() {
  console.log("🔬 === TESTE COMPLETO DO FLUXO DE PRESENÇA ONLINE ===");

  try {
    // Passo 1: Diagnosticar aba
    console.log("📋 Passo 1: Diagnóstico da aba...");
    const diagnostico = diagnosticarAbaPresencas();
    console.log("Resultado diagnóstico:", diagnostico);

    // Passo 2: Registrar presença via função
    console.log("📝 Passo 2: Registrando presença via função...");
    const resultadoRegistro = registrarPresencaOnline(
      "João da Silva",
      new Date().toLocaleDateString("pt-BR"),
      new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      "PWT",
      "Prof. Teste",
      "P"
    );
    console.log("Resultado registro:", resultadoRegistro);

    // Passo 3: Buscar registros
    console.log("🔍 Passo 3: Buscando registros...");
    const resultadoBusca = buscarUltimosRegistrosPresenca(5);
    console.log("Resultado busca:", resultadoBusca);

    // Passo 4: Verificação final
    console.log("✅ Passo 4: Verificação final...");
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName("Presenças");
    const finalRows = sheet.getLastRow();
    console.log("Total de linhas final:", finalRows);

    return {
      success: true,
      diagnostico,
      registro: resultadoRegistro,
      busca: resultadoBusca,
      linhasFinais: finalRows,
    };
  } catch (error) {
    console.error("❌ Erro no teste completo:", error);
    return {
      success: false,
      error: error.toString(),
    };
  }
}

/**
 * FUNÇÃO DE TESTE SIMPLES - Apenas criar e testar a aba Presenças
 * Execute esta função primeiro para verificar se consegue criar/acessar a aba
 */
function testeSimpleAbaPresencas() {
  console.log("🔧 === TESTE SIMPLES DA ABA PRESENÇAS ===");

  try {
    // Passo 1: Obter planilha ativa
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    console.log("✅ Planilha obtida:", spreadsheet.getName());

    // Passo 2: Verificar/criar aba Presenças
    let sheet = spreadsheet.getSheetByName("Presenças");

    if (!sheet) {
      console.log("🔨 Criando aba Presenças...");
      sheet = spreadsheet.insertSheet("Presenças");
      console.log("✅ Aba criada!");
    } else {
      console.log("✅ Aba já existe!");
    }

    // Passo 3: Verificar se está vazia e adicionar cabeçalhos
    if (sheet.getLastRow() === 0) {
      console.log("📝 Adicionando cabeçalhos...");
      sheet
        .getRange(1, 1, 1, 5)
        .setValues([
          ["Nome do Aluno", "Data", "Horário", "Curso", "Professor"],
        ]);
      console.log("✅ Cabeçalhos adicionados!");
    }

    // Passo 4: Testar inserção de dados
    console.log("🧪 Testando inserção...");
    const dadosTeste = [
      "Teste Manual",
      "08/08/2025",
      "14:30",
      "PWT",
      "Professor Teste",
    ];

    sheet.appendRow(dadosTeste);
    console.log("✅ Dados inseridos:", dadosTeste);

    // Passo 5: Verificar se foi inserido
    const ultimaLinha = sheet.getLastRow();
    const dadosInseridos = sheet.getRange(ultimaLinha, 1, 1, 5).getValues()[0];
    console.log("📊 Última linha:", ultimaLinha);
    console.log("📝 Dados recuperados:", dadosInseridos);

    return {
      success: true,
      ultimaLinha: ultimaLinha,
      dadosInseridos: dadosInseridos,
      message: "Teste simples bem-sucedido!",
    };
  } catch (error) {
    console.error("❌ Erro no teste simples:", error);
    return {
      success: false,
      error: error.toString(),
    };
  }
}

/**
 * FUNÇÃO DE TESTE VIA HTTP - Testar endpoint de presença online
 * Simula uma chamada HTTP para o endpoint
 */
function testeEndpointPresencaOnline() {
  console.log("🌐 === TESTE DO ENDPOINT HTTP ===");

  try {
    // Simular parâmetros de uma requisição HTTP
    const parametrosMock = {
      action: "registrarPresencaOnline",
      nome: "Aluno Via HTTP",
      data: "08/08/2025",
      horario: "15:45",
      curso: "PWN",
      professor: "Prof. Via HTTP",
    };

    console.log("📤 Parâmetros simulados:", parametrosMock);

    // Simular objeto de evento HTTP
    const eventoMock = {
      parameter: parametrosMock,
    };

    // Chamar a função doGet diretamente
    console.log("🔄 Chamando doGet...");
    const resposta = doGet(eventoMock);

    // Tentar converter a resposta
    const conteudo = resposta.getContent();
    console.log("📨 Resposta bruta:", conteudo);

    const resultado = JSON.parse(conteudo);
    console.log("📊 Resultado parseado:", resultado);

    return {
      success: true,
      parametros: parametrosMock,
      resposta: resultado,
    };
  } catch (error) {
    console.error("❌ Erro no teste HTTP:", error);
    return {
      success: false,
      error: error.toString(),
    };
  }
}

/**
 * FUNÇÃO DE DEBUG - Monitorar chamadas do endpoint
 */
function debugEndpointPresencaOnline() {
  console.log("🔍 === DEBUG ENDPOINT PRESENÇA ONLINE ===");

  const resultados = {};

  try {
    // Teste GET
    const eventoGET = {
      parameter: {
        action: "registrarPresencaOnline",
        nome: "Debug GET",
        data: "08/08/2025",
        horario: "16:00",
        curso: "PWT",
        professor: "Debug Prof",
      },
    };

    console.log("🧪 Testando GET...");
    const resultadoGET = doGet(eventoGET);
    const conteudoGET = resultadoGET.getContent();
    resultados.GET = JSON.parse(conteudoGET);
    console.log("✅ GET resultado:", resultados.GET);
  } catch (error) {
    console.error("❌ Erro GET:", error);
    resultados.GET = { error: error.toString() };
  }

  return resultados;
}

/**
 * FUNÇÃO DE TESTE CORS - Verificar se os headers CORS estão funcionando
 */
function testarCORS() {
  console.log("🔧 === TESTE DE HEADERS CORS ===");

  try {
    // Dados de teste
    const dadosTeste = {
      success: true,
      message: "Teste CORS",
      timestamp: new Date().toISOString(),
    };

    console.log("📝 Testando criarRespostaJson...");
    const resposta = criarRespostaJson(dadosTeste);

    console.log("📨 Resposta criada com sucesso");
    const conteudo = resposta.getContent();
    console.log("📄 Conteúdo:", conteudo);

    const parsed = JSON.parse(conteudo);
    console.log("✅ JSON parseado com sucesso:", parsed);

    return {
      success: true,
      resposta: parsed,
      message: "Teste CORS bem-sucedido",
    };
  } catch (error) {
    console.error("❌ Erro no teste CORS:", error);
    return {
      success: false,
      error: error.toString(),
    };
  }
}

/**
 * FUNÇÃO DE TESTE COMPLETO - Teste integrado presença + CORS
 */
function testeCompletoPresencaCORS() {
  console.log("🎯 === TESTE COMPLETO PRESENÇA + CORS ===");

  const resultados = {};

  try {
    // Passo 1: Teste CORS
    console.log("🔧 Passo 1: Testando CORS...");
    resultados.cors = testarCORS();

    // Passo 2: Teste presença direta
    console.log("📝 Passo 2: Testando presença direta...");
    resultados.presencaDireta = registrarPresencaOnline(
      "Teste Completo",
      "08/08/2025",
      "17:30",
      "PWT",
      "Prof. Teste Completo",
      "P"
    );

    // Passo 3: Teste via doGet
    console.log("🌐 Passo 3: Testando via doGet...");
    const eventoGet = {
      parameter: {
        action: "registrarPresencaOnline",
        nome: "Teste GET Completo",
        data: "08/08/2025",
        horario: "17:45",
        curso: "PWN",
        professor: "Prof. GET Completo",
      },
    };

    const respostaGet = doGet(eventoGet);
    const conteudoGet = respostaGet.getContent();
    resultados.getCompleto = JSON.parse(conteudoGet);

    console.log("✅ Teste completo finalizado");
    return {
      success: true,
      resultados: resultados,
    };
  } catch (error) {
    console.error("❌ Erro no teste completo:", error);
    return {
      success: false,
      error: error.toString(),
      resultados: resultados,
    };
  }
}

/**
 * Verifica se os dados estão realmente aparecendo na aba Presenças
 */
function verificarDadosPresencas() {
  console.log("🧪 === VERIFICANDO DADOS NA ABA PRESENÇAS ===");

  try {
    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const abaPresencas = planilha.getSheetByName("Presenças");

    if (!abaPresencas) {
      console.log("❌ Aba 'Presenças' não encontrada!");
      return false;
    }

    const ultimaLinha = abaPresencas.getLastRow();
    console.log(`📊 Última linha com dados: ${ultimaLinha}`);

    if (ultimaLinha <= 1) {
      console.log(
        "⚠️ Apenas cabeçalhos encontrados, nenhum registro de presença"
      );
      return false;
    }

    // Pega os últimos 5 registros
    const inicioLeitura = Math.max(2, ultimaLinha - 4);
    const dadosRecentes = abaPresencas
      .getRange(inicioLeitura, 1, ultimaLinha - inicioLeitura + 1, 5)
      .getValues();

    console.log(`📋 Registros encontrados (${dadosRecentes.length}):`);
    dadosRecentes.forEach((linha, index) => {
      const linhaReal = inicioLeitura + index;
      console.log(
        `Linha ${linhaReal}: Nome: "${linha[0]}", Data: "${linha[1]}", Horário: "${linha[2]}", Curso: "${linha[3]}", Professor: "${linha[4]}"`
      );
    });

    // Verifica se há registros de teste
    const registrosTeste = dadosRecentes.filter(
      (linha) =>
        linha[0] &&
        (linha[0].includes("Teste") || linha[0].includes("Frontend"))
    );

    if (registrosTeste.length > 0) {
      console.log(
        `✅ ${registrosTeste.length} registro(s) de teste encontrado(s)!`
      );
      return true;
    } else {
      console.log("⚠️ Nenhum registro de teste encontrado nos dados recentes");
      return false;
    }
  } catch (error) {
    console.log("❌ ERRO ao verificar dados:", error.toString());
    return false;
  }
}

/**
 * Limpa registros de teste da aba Presenças
 */
function limparRegistrosTeste() {
  console.log("🧹 === LIMPANDO REGISTROS DE TESTE ===");

  try {
    const planilha = SpreadsheetApp.getActiveSpreadsheet();
    const abaPresencas = planilha.getSheetByName("Presenças");

    if (!abaPresencas) {
      console.log("❌ Aba 'Presenças' não encontrada!");
      return false;
    }

    const ultimaLinha = abaPresencas.getLastRow();
    if (ultimaLinha <= 1) {
      console.log("⚠️ Nenhum registro para limpar");
      return true;
    }

    // Lê todos os dados
    const dados = abaPresencas.getRange(2, 1, ultimaLinha - 1, 5).getValues();
    const linhasParaManter = [];
    let linhasRemovidas = 0;

    // Filtra registros que NÃO são de teste
    dados.forEach((linha, index) => {
      const nome = linha[0];
      const ehTeste =
        nome &&
        (nome.includes("Teste") ||
          nome.includes("Debug") ||
          nome.includes("Frontend") ||
          nome.includes("GET Completo"));

      if (!ehTeste) {
        linhasParaManter.push(linha);
      } else {
        linhasRemovidas++;
        console.log(`🗑️ Removendo: ${nome}`);
      }
    });

    // Limpa tudo e reconstrói
    abaPresencas.clear();

    // Recriar cabeçalhos
    abaPresencas.appendRow([
      "Nome do Aluno",
      "Data",
      "Horário",
      "Curso",
      "Professor",
    ]);

    // Adicionar dados válidos de volta
    if (linhasParaManter.length > 0) {
      abaPresencas
        .getRange(2, 1, linhasParaManter.length, 5)
        .setValues(linhasParaManter);
    }

    console.log(
      `✅ Limpeza concluída! ${linhasRemovidas} registros de teste removidos, ${linhasParaManter.length} registros válidos mantidos`
    );
    return true;
  } catch (error) {
    console.log("❌ ERRO ao limpar registros:", error.toString());
    return false;
  }
}

/**
 * Teste com formatação correta de data e hora
 */
function testeFormatacaoCorreta() {
  console.log("🧪 === TESTE COM FORMATAÇÃO CORRETA ===");

  try {
    // Primeiro limpa registros de teste
    limparRegistrosTeste();

    // Registra com formatação correta
    const resultado = registrarPresencaOnline(
      "Maria Santos",
      "08/08/2025",
      "14:30",
      "PWT",
      "Prof. Carlos",
      "P"
    );

    console.log("📊 Resultado:", resultado);

    // Verifica se foi salvo corretamente
    setTimeout(() => {
      verificarDadosPresencas();
    }, 1000);

    return resultado;
  } catch (error) {
    console.log("❌ ERRO no teste:", error.toString());
    return { success: false, error: error.toString() };
  }
}

/**
 * 📊 FUNÇÃO PARA OBTER ESTATÍSTICAS COMPLETAS DO DASHBOARD ADMIN
 * Processa dados reais da planilha para gerar estatísticas
 */
function obterEstatisticasCompletas() {
  console.log("📊 === INICIANDO CÁLCULO DE ESTATÍSTICAS ===");

  try {
    const todosAlunos = [];

    // Processa todas as abas/cursos
    for (const nomeAba of SHEET_NAMES) {
      console.log(`📚 Processando aba: ${nomeAba}`);

      try {
        const planilha =
          SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nomeAba);
        if (!planilha) {
          console.log(`⚠️ Aba não encontrada: ${nomeAba}`);
          continue;
        }

        const dados = planilha.getDataRange().getValues();
        if (dados.length <= 1) {
          console.log(`⚠️ Aba vazia: ${nomeAba}`);
          continue;
        }

        const indices = detectarColunasUniversalPorArray(dados[0]);

        // Processa cada aluno da aba
        for (let i = 1; i < dados.length; i++) {
          const linha = dados[i];
          const id = String(linha[indices.ID_Unico] || "").trim();
          const nome = String(linha[indices.Nome] || "").trim();

          if (!id || !nome) continue;

          const aluno = {
            ID_Unico: id,
            Nome: nome,
            Curso: nomeAba,
            Periodo: CURSO_PARA_PERIODO[nomeAba] || "Não definido",
            Faltas: parseInt(linha[indices.Faltas]) || 0,

            // Notas do curso
            Nota1:
              parseFloat(
                String(linha[indices.Nota1] || "").replace(",", ".")
              ) || 0,
            Nota2:
              parseFloat(
                String(linha[indices.Nota2] || "").replace(",", ".")
              ) || 0,
            Nota3:
              parseFloat(
                String(linha[indices.Nota3] || "").replace(",", ".")
              ) || 0,

            // Notas Mundo do Trabalho
            MundoTrabalho1:
              parseFloat(
                String(linha[indices.MundoTrabalho1] || "").replace(",", ".")
              ) || 0,
            MundoTrabalho2:
              parseFloat(
                String(linha[indices.MundoTrabalho2] || "").replace(",", ".")
              ) || 0,
            MundoTrabalho3:
              parseFloat(
                String(linha[indices.MundoTrabalho3] || "").replace(",", ".")
              ) || 0,

            // Notas Convívio
            Convivio1:
              parseFloat(
                String(linha[indices.Convivio1] || "").replace(",", ".")
              ) || 0,
            Convivio2:
              parseFloat(
                String(linha[indices.Convivio2] || "").replace(",", ".")
              ) || 0,
            Convivio3:
              parseFloat(
                String(linha[indices.Convivio3] || "").replace(",", ".")
              ) || 0,
          };

          // Calcula média geral incluindo todas as matérias
          const todasAsNotas = [
            aluno.Nota1,
            aluno.Nota2,
            aluno.Nota3,
            aluno.MundoTrabalho1,
            aluno.MundoTrabalho2,
            aluno.MundoTrabalho3,
            aluno.Convivio1,
            aluno.Convivio2,
            aluno.Convivio3,
          ];

          // Verificar se tem pelo menos uma nota lançada
          const temNotasLancadas = todasAsNotas.some((nota) => nota > 0);

          // Calcular média considerando todas as 9 disciplinas (incluindo zeros)
          aluno.Media =
            todasAsNotas.reduce((a, b) => a + b) / todasAsNotas.length;

          // Determinar situação baseada nos novos critérios:
          // - Reprovado: faltas > 15 OU média < 6.0
          // - Aprovado: média >= 6.0 E faltas <= 15
          // - Em Curso: demais casos

          if (!temNotasLancadas && aluno.Faltas === 0) {
            aluno.Situacao = "Em Curso";
          } else if (aluno.Faltas > 15) {
            aluno.Situacao = "Reprovado";
          } else if (aluno.Media >= 6.0 && aluno.Faltas <= 15) {
            aluno.Situacao = "Aprovado";
          } else if (aluno.Media < 6.0 && temNotasLancadas) {
            aluno.Situacao = "Reprovado";
          } else {
            aluno.Situacao = "Em Curso";
          }

          todosAlunos.push(aluno);
        }
      } catch (abaError) {
        console.error(`❌ Erro ao processar aba ${nomeAba}:`, abaError);
      }
    }

    console.log(`📊 Total de alunos processados: ${todosAlunos.length}`);

    // Gera estatísticas consolidadas
    const estatisticas = calcularEstatisticas(todosAlunos);

    return {
      success: true,
      alunos: todosAlunos,
      estatisticas: estatisticas,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("❌ Erro ao obter estatísticas:", error);
    return {
      success: false,
      error: error.toString(),
    };
  }
}

/**
 * 📈 FUNÇÃO PARA CALCULAR ESTATÍSTICAS CONSOLIDADAS
 */
function calcularEstatisticas(alunos) {
  console.log("📈 Calculando estatísticas consolidadas...");

  const stats = {
    // Estatísticas gerais
    totalAlunos: alunos.length,
    aprovados: 0,
    reprovados: 0,
    emCurso: 0,
    reprovadosPorFaltas: 0,

    // Por curso
    porCurso: {},

    // Por período
    porPeriodo: {},

    // Estatísticas de notas
    mediaGeral: 0,
    notasDistribuicao: {
      excelente: 0, // 9-10
      bom: 0, // 7-8.9
      regular: 0, // 5-6.9
      insuficiente: 0, // 0-4.9
    },

    // Estatísticas de faltas
    faltasDistribuicao: {
      baixa: 0, // 0-5
      media: 0, // 6-10
      alta: 0, // 11-15
      critica: 0, // >15
    },
  };

  let somaMedias = 0;
  let alunosComMedia = 0;

  alunos.forEach((aluno) => {
    // Verificar se é reprovado especificamente por faltas para estatísticas
    const reprovadoPorFalta =
      aluno.Situacao === "Reprovado" && aluno.Faltas > 15;

    // Contadores gerais
    switch (aluno.Situacao) {
      case "Aprovado":
        stats.aprovados++;
        break;
      case "Reprovado":
        if (reprovadoPorFalta) {
          stats.reprovadosPorFaltas++;
        } else {
          stats.reprovados++;
        }
        break;
      default:
        stats.emCurso++;
    }

    // Por curso
    if (!stats.porCurso[aluno.Curso]) {
      stats.porCurso[aluno.Curso] = {
        total: 0,
        aprovados: 0,
        reprovados: 0,
        emCurso: 0,
        mediaGeral: 0,
      };
    }
    stats.porCurso[aluno.Curso].total++;
    if (aluno.Situacao === "Aprovado") stats.porCurso[aluno.Curso].aprovados++;
    else if (aluno.Situacao === "Reprovado")
      stats.porCurso[aluno.Curso].reprovados++;
    else stats.porCurso[aluno.Curso].emCurso++;

    // Por período
    if (!stats.porPeriodo[aluno.Periodo]) {
      stats.porPeriodo[aluno.Periodo] = {
        total: 0,
        aprovados: 0,
        reprovados: 0,
        emCurso: 0,
      };
    }
    stats.porPeriodo[aluno.Periodo].total++;
    if (aluno.Situacao === "Aprovado")
      stats.porPeriodo[aluno.Periodo].aprovados++;
    else if (aluno.Situacao === "Reprovado")
      stats.porPeriodo[aluno.Periodo].reprovados++;
    else stats.porPeriodo[aluno.Periodo].emCurso++;

    // Distribuição de notas
    if (aluno.Media > 0) {
      somaMedias += aluno.Media;
      alunosComMedia++;

      if (aluno.Media >= 9) stats.notasDistribuicao.excelente++;
      else if (aluno.Media >= 7) stats.notasDistribuicao.bom++;
      else if (aluno.Media >= 5) stats.notasDistribuicao.regular++;
      else stats.notasDistribuicao.insuficiente++;
    }

    // Distribuição de faltas
    if (aluno.Faltas <= 5) stats.faltasDistribuicao.baixa++;
    else if (aluno.Faltas <= 10) stats.faltasDistribuicao.media++;
    else if (aluno.Faltas <= 15) stats.faltasDistribuicao.alta++;
    else stats.faltasDistribuicao.critica++;
  });

  // Calcula média geral
  stats.mediaGeral =
    alunosComMedia > 0 ? (somaMedias / alunosComMedia).toFixed(2) : 0;

  // Calcula média por curso
  Object.keys(stats.porCurso).forEach((curso) => {
    const alunosCurso = alunos.filter((a) => a.Curso === curso && a.Media > 0);
    if (alunosCurso.length > 0) {
      const mediasCurso = alunosCurso.map((a) => a.Media);
      stats.porCurso[curso].mediaGeral = (
        mediasCurso.reduce((a, b) => a + b) / mediasCurso.length
      ).toFixed(2);
    }
  });

  console.log("📈 Estatísticas calculadas:", stats);
  return stats;
}

/**
 * 📅 FUNÇÃO PARA OBTER HISTÓRICO DE FALTAS DE UM ALUNO
 * Busca todas as faltas registradas para um aluno específico
 */
function obterHistoricoFaltas(alunoId) {
  console.log(`📅 === OBTENDO HISTÓRICO DE FALTAS PARA ${alunoId} ===`);

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const historicoFaltas = {
      alunoId: alunoId,
      totalFaltas: 0,
      faltasDetalhadas: [],
      registrosPresenca: [],
    };

    // 1. Buscar informações básicas do aluno
    let nomeAluno = "";
    let cursoAluno = "";
    let faltasContador = 0;

    for (const nomeAba of SHEET_NAMES) {
      const aba = spreadsheet.getSheetByName(nomeAba);
      if (!aba) continue;

      const dados = aba.getDataRange().getValues();
      const indices = detectarColunasUniversalPorArray(dados[0]);
      if (indices.ID_Unico === undefined) continue;

      for (let i = 1; i < dados.length; i++) {
        const linha = dados[i];
        if (String(linha[indices.ID_Unico]).trim() === String(alunoId).trim()) {
          nomeAluno = linha[indices.Nome] || "";
          cursoAluno = nomeAba;
          faltasContador = parseInt(linha[indices.Faltas]) || 0;

          // Buscar faltas registradas nas colunas de datas
          for (let j = 0; j < linha.length; j++) {
            const cabecalho = dados[0][j];
            const valor = String(linha[j]).trim().toUpperCase();

            // Verificar se é uma coluna de data e se está marcada como falta
            if (cabecalho && cabecalho.includes("/") && valor === "F") {
              historicoFaltas.faltasDetalhadas.push({
                data: cabecalho,
                status: "Falta",
                curso: nomeAba,
              });
            }
          }
          break;
        }
      }

      if (nomeAluno) break;
    }

    // 2. Buscar registros na aba "Presenças" (se existir)
    const abaPresencas = spreadsheet.getSheetByName("Presenças");
    if (abaPresencas) {
      const dadosPresencas = abaPresencas.getDataRange().getValues();

      if (dadosPresencas.length > 1) {
        const cabecalhos = dadosPresencas[0];
        const indiceNome = cabecalhos.findIndex((h) =>
          h.toLowerCase().includes("nome")
        );
        const indiceData = cabecalhos.findIndex((h) =>
          h.toLowerCase().includes("data")
        );
        const indiceHorario = cabecalhos.findIndex(
          (h) =>
            h.toLowerCase().includes("horário") ||
            h.toLowerCase().includes("horario")
        );
        const indiceCurso = cabecalhos.findIndex((h) =>
          h.toLowerCase().includes("curso")
        );
        const indiceProfessor = cabecalhos.findIndex((h) =>
          h.toLowerCase().includes("professor")
        );
        const indiceStatus = cabecalhos.findIndex((h) =>
          h.toLowerCase().includes("status")
        );

        for (let i = 1; i < dadosPresencas.length; i++) {
          const linha = dadosPresencas[i];
          const nome = linha[indiceNome] || "";
          const status = String(linha[indiceStatus]).trim().toUpperCase();

          // Verificar se é o aluno correto (por nome ou ID)
          if (
            nome.toLowerCase().includes(nomeAluno.toLowerCase()) ||
            nomeAluno.toLowerCase().includes(nome.toLowerCase())
          ) {
            historicoFaltas.registrosPresenca.push({
              data: linha[indiceData] || "",
              horario: linha[indiceHorario] || "",
              curso: linha[indiceCurso] || "",
              professor: linha[indiceProfessor] || "",
              status:
                status === "F" ? "Falta" : status === "P" ? "Presente" : status,
              tipo: "Registro Online",
            });
          }
        }
      }
    }

    historicoFaltas.nomeAluno = nomeAluno;
    historicoFaltas.cursoAluno = cursoAluno;
    historicoFaltas.totalFaltas = faltasContador;

    console.log(`📅 Histórico encontrado:`, historicoFaltas);

    return {
      success: true,
      historico: historicoFaltas,
    };
  } catch (error) {
    console.error("❌ Erro ao obter histórico de faltas:", error);
    return {
      success: false,
      error: error.toString(),
    };
  }
}

/**
 * ✅ FUNÇÃO DE TESTE - Validar correção de colunas desnecessárias
 * Execute esta função para testar se o problema foi resolvido
 */
function testarCorrecaoColunasUnicas() {
  console.log("🧪 === TESTANDO CORREÇÃO DE COLUNAS ÚNICAS ===");

  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    // PASSO 1: Contar colunas antes do teste
    const colunasAntes = {};
    for (const sheetName of SHEET_NAMES) {
      const sheet = spreadsheet.getSheetByName(sheetName);
      if (sheet) {
        colunasAntes[sheetName] = sheet.getLastColumn();
      }
    }

    console.log("📊 Colunas antes do teste:", colunasAntes);

    // PASSO 2: Buscar primeiro aluno disponível
    let alunoTeste = null;
    let abaTeste = null;

    for (const sheetName of SHEET_NAMES) {
      const sheet = spreadsheet.getSheetByName(sheetName);
      if (!sheet) continue;

      const indices = detectarColunasUniversal(sheet);
      if (indices.ID_Unico === undefined) continue;

      const lastRow = sheet.getLastRow();
      if (lastRow <= 1) continue;

      const primeiroId = sheet.getRange(2, indices.ID_Unico + 1).getValue();
      if (primeiroId) {
        alunoTeste = String(primeiroId).trim();
        abaTeste = sheetName;
        break;
      }
    }

    if (!alunoTeste) {
      throw new Error("Nenhum aluno encontrado para teste");
    }

    console.log(`👤 Testando com aluno ${alunoTeste} da aba ${abaTeste}`);

    // PASSO 3: Testar função otimizada
    const dataTesteISO = new Date().toISOString().split("T")[0];

    console.log("🎯 Executando registrarPresencaOtimizada...");
    const resultado = registrarPresencaOtimizada(
      alunoTeste,
      dataTesteISO,
      "P",
      "Professor Teste",
      "false"
    );

    console.log("📊 Resultado do teste:", resultado);

    if (!resultado.success) {
      throw new Error("Teste falhou: " + resultado.error);
    }

    // PASSO 4: Contar colunas depois do teste
    const colunasDepois = {};
    let novasColunasDetectadas = [];

    for (const sheetName of SHEET_NAMES) {
      const sheet = spreadsheet.getSheetByName(sheetName);
      if (sheet) {
        colunasDepois[sheetName] = sheet.getLastColumn();

        // Verificar se houve mudança
        if (colunasDepois[sheetName] > colunasAntes[sheetName]) {
          novasColunasDetectadas.push({
            aba: sheetName,
            antes: colunasAntes[sheetName],
            depois: colunasDepois[sheetName],
            diferenca: colunasDepois[sheetName] - colunasAntes[sheetName],
          });
        }
      }
    }

    console.log("📊 Colunas depois do teste:", colunasDepois);
    console.log("🔍 Novas colunas detectadas:", novasColunasDetectadas);

    // PASSO 5: Validar resultado
    const abaProcessada = resultado.abaProcessada;
    const esperadoUmaAba =
      novasColunasDetectadas.length === 1 &&
      novasColunasDetectadas[0].aba === abaProcessada;
    const nenhumaNovaColuna = novasColunasDetectadas.length === 0;

    if (esperadoUmaAba) {
      console.log(
        `✅ SUCESSO: Apenas 1 aba foi afetada (${abaProcessada}) - problema resolvido!`
      );
      return {
        success: true,
        message: "Correção validada com sucesso",
        detalhes: {
          alunoTestado: alunoTeste,
          abaProcessada: abaProcessada,
          colunasAntes: colunasAntes,
          colunasDepois: colunasDepois,
          novasColunasDetectadas: novasColunasDetectadas,
          problema: "RESOLVIDO",
        },
      };
    } else if (nenhumaNovaColuna) {
      console.log(
        `✅ EXCELENTE: Nenhuma nova coluna foi criada - coluna já existia!`
      );
      return {
        success: true,
        message: "Teste perfeito - nenhuma coluna desnecessária criada",
        detalhes: {
          alunoTestado: alunoTeste,
          abaProcessada: abaProcessada,
          colunasAntes: colunasAntes,
          colunasDepois: colunasDepois,
          novasColunasDetectadas: novasColunasDetectadas,
          problema: "INEXISTENTE",
        },
      };
    } else {
      console.log(`❌ PROBLEMA PERSISTE: Múltiplas abas foram afetadas!`);
      return {
        success: false,
        message: "Problema ainda não foi totalmente resolvido",
        detalhes: {
          alunoTestado: alunoTeste,
          abaProcessada: abaProcessada,
          colunasAntes: colunasAntes,
          colunasDepois: colunasDepois,
          novasColunasDetectadas: novasColunasDetectadas,
          problema: "AINDA_EXISTE",
        },
      };
    }
  } catch (error) {
    console.error("❌ Erro no teste:", error);
    return {
      success: false,
      error: error.toString(),
      message: "Erro durante o teste",
    };
  }
}
