# 📊 Estrutura da Planilha Google Sheets - ATUALIZADA

## ✅ Colunas Confirmadas na Planilha

Com base na imagem fornecida, a planilha **JÁ POSSUI** todas as colunas necessárias:

### Colunas Básicas

- `ID_Unico` - Identificador único do aluno
- `Nome` - Nome completo do aluno
- `Faltas` - Número total de faltas
- `Media` - Média final calculada
- `Situacao` - Situação acadêmica (Aprovado/Reprovado/Em Curso)
- `Origem` - Curso/Origem do aluno
- `Periodo` - Período/Turma

### ✅ Notas do Curso Principal

- `NOTA 1º BIMESTRE` (coluna T)
- `NOTA 2º BIMESTRE` (coluna U)
- `NOTA 3º BIMESTRE` (coluna V)

### ✅ Notas do Mundo do Trabalho

- `Mundo do Trabalho - 1º Bim` (coluna W)
- `Mundo do Trabalho - 2º Bim` (coluna X)
- `Mundo do Trabalho - 3º Bim` (coluna Y)

### ✅ Notas do Convívio

- `Convívio - 1º Bim` (coluna Z)
- `Convívio - 2º Bim` (coluna AA)
- `Convívio - 3º Bim` (coluna AB)

## 🔧 Status de Integração

O sistema foi configurado para detectar automaticamente os nomes exatos das colunas:

- ✅ **"Mundo do Trabalho - 1º Bim"** (nome exato da planilha)
- ✅ **"Mundo do Trabalho - 2º Bim"** (nome exato da planilha)
- ✅ **"Mundo do Trabalho - 3º Bim"** (nome exato da planilha)
- ✅ **"Convívio - 1º Bim"** (nome exato da planilha)
- ✅ **"Convívio - 2º Bim"** (nome exato da planilha)
- ✅ **"Convívio - 3º Bim"** (nome exato da planilha)

## 🎯 Comportamento Esperado

Com essa estrutura, o sistema deve:

1. **Frente do Card**: Mostrar média da tabela + faltas
2. **Verso do Card**: Exibir todas as notas por matéria:
   - Curso Principal (3 bimestres)
   - Mundo do Trabalho (3 bimestres)
   - Convívio (3 bimestres)
3. **Cálculo de Média**: Usar coluna MEDIA da tabela ou calcular com todas as 9 notas

## 🔍 Debug Ativo

O sistema está configurado com logs para verificar a detecção das colunas.

### Para Testar:

1. Abra o DevTools (F12) do navegador
2. Carregue a página de alunos
3. Procure no console por "🔍 Teste de detecção de colunas"
4. Verifique se aparecem as notas de Mundo do Trabalho e Convívio

## 🚀 Próximos Passos

Se as colunas não estão sendo detectadas, pode ser que:

1. **Problema de sincronização** - Os dados podem não estar sendo carregados do Google Sheets
2. **Problema de mapeamento** - Os nomes das colunas podem estar diferentes na API
3. **Cache** - Pode haver cache impedindo a atualização dos dados

Execute o teste de debug para identificar o problema específico.
