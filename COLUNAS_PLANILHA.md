# 📊 Guia de Colunas da Planilha

## Colunas Atuais Identificadas

✅ **Existentes na tabela:**

- `ID_Unico` - Identificador único do aluno
- `Nome` - Nome completo do aluno
- `Faltas` - Número total de faltas
- `Nota1` - Nota do 1º bimestre (curso)
- `Nota2` - Nota do 2º bimestre (curso)
- `Nota3` - Nota do 3º bimestre (curso)
- `Media` - Média final do curso
- `Situacao` - Situação acadêmica (Aprovado/Reprovado/Em Curso)
- `Origem` - Curso/Origem do aluno
- `Periodo` - Período/Turma

## Colunas Adicionais para Mundo do Trabalho

❌ **Para adicionar na planilha:**

### Opção 1: Formato Underscore

- `MundoTrabalho_1Bim`
- `MundoTrabalho_2Bim`
- `MundoTrabalho_3Bim`

### Opção 2: Formato Descritivo

- `Mundo do Trabalho - 1º Bim`
- `Mundo do Trabalho - 2º Bim`
- `Mundo do Trabalho - 3º Bim`

### Opção 3: Formato Simplificado

- `MT_1Bim`
- `MT_2Bim`
- `MT_3Bim`

## Colunas Adicionais para Convívio

❌ **Para adicionar na planilha:**

### Opção 1: Formato Underscore

- `Convivio_1Bim`
- `Convivio_2Bim`
- `Convivio_3Bim`

### Opção 2: Formato Descritivo

- `Convívio - 1º Bim`
- `Convívio - 2º Bim`
- `Convívio - 3º Bim`

### Opção 3: Formato Simplificado

- `Conv_1Bim`
- `Conv_2Bim`
- `Conv_3Bim`

## Status Atual do Sistema

📌 **Comportamento atual:**

- ✅ Exibe notas do curso principal (Nota1, Nota2, Nota3)
- ✅ Usa coluna `Media` da tabela quando disponível
- ✅ Calcula média automaticamente se não estiver na tabela
- ❌ Mostra mensagem informativa para Mundo do Trabalho (dados não disponíveis)
- ❌ Mostra mensagem informativa para Convívio (dados não disponíveis)

## Como Adicionar as Novas Colunas

1. **Abrir a planilha** no Google Sheets ou Excel
2. **Adicionar as colunas** usando qualquer um dos formatos acima
3. **Preencher com as notas** correspondentes
4. **Atualizar os dados** no sistema
5. **As notas aparecerão automaticamente** nos flip cards

## Detecção Automática

🔍 **O sistema detecta automaticamente** qualquer um dos formatos de nome de coluna listados acima, então você pode escolher o que preferir.

## Cálculo da Média

📊 **Quando as novas colunas forem adicionadas:**

- A média será calculada considerando **todas as matérias**
- Curso + Mundo do Trabalho + Convívio
- A coluna `Media` na tabela terá prioridade sobre o cálculo automático
