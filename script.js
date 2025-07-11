document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const cursoFilter = document.getElementById('cursoFilter');
    const periodoFilter = document.getElementById('periodoFilter');
    const searchButton = document.getElementById('searchButton');
    const resultTableBody = document.getElementById('resultTableBody');
    const studentDetail = document.getElementById('studentDetail');
    const closeDetailButton = document.getElementById('closeDetail');

    // ** ATENÇÃO: Esta é a URL do proxy Vercel para o seu Apps Script **
    // Certifique-se de que seu vercel.json está configurado para /api/appsscript
    const API_URL = '/api/appsscript';

    let currentStudentsData = []; // Armazena os dados dos alunos para uso local

    // Função para buscar alunos
    async function fetchStudents() {
        const nomeAluno = searchInput.value.trim();
        const curso = cursoFilter.value;
        const periodo = periodoFilter.value;

        let url = new URL(API_URL);
        if (nomeAluno) {
            url.searchParams.append('nomeAluno', nomeAluno);
        }
        if (curso) {
            url.searchParams.append('curso', curso);
        }
        if (periodo) {
            url.searchParams.append('periodo', periodo);
        }

        try {
            const response = await fetch(url);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            currentStudentsData = data.saida || []; // Armazena os dados brutos
            displayStudents(currentStudentsData);
        } catch (error) {
            console.error('Erro ao buscar alunos:', error);
            resultTableBody.innerHTML = `<tr><td colspan="8">Erro ao carregar dados: ${error.message}</td></tr>`;
        }
    }

    // Função para exibir alunos na tabela
    function displayStudents(students) {
        resultTableBody.innerHTML = '';
        if (students.length === 0) {
            resultTableBody.innerHTML = '<tr><td colspan="8">Nenhum aluno encontrado.</td></tr>';
            return;
        }

        students.forEach(student => {
            const row = resultTableBody.insertRow();
            row.insertCell(0).textContent = student.Nome;
            row.insertCell(1).textContent = student.Faltas;
            row.insertCell(2).textContent = student.Nota1 !== 0 ? student.Nota1 : '-';
            row.insertCell(3).textContent = student.Nota2 !== 0 ? student.Nota2 : '-';
            row.insertCell(4).textContent = student.Nota3 !== 0 ? student.Nota3 : '-';
            row.insertCell(5).textContent = student.Media !== 0 ? student.Media.toFixed(1) : '-';
            row.insertCell(6).textContent = student.Situacao;
            row.insertCell(7).textContent = student.Origem; // Coluna de origem (nome da aba)

            row.addEventListener('click', () => showStudentDetail(student));
        });
    }

    // Função para mostrar detalhes do aluno em um modal/painel lateral
    function showStudentDetail(student) {
        document.getElementById('detailName').textContent = student.Nome;
        document.getElementById('detailFaltas').textContent = student.Faltas;
        document.getElementById('detailNota1').value = student.Nota1 !== 0 ? student.Nota1 : '';
        document.getElementById('detailNota2').value = student.Nota2 !== 0 ? student.Nota2 : '';
        document.getElementById('detailNota3').value = student.Nota3 !== 0 ? student.Nota3 : '';

        // Adiciona event listeners para os botões de ação
        document.getElementById('updateNotesButton').onclick = () => updateNotes(student.Nome);
        document.getElementById('markPresentButton').onclick = () => registrarPresencaOuFalta(student.Nome, 'presenca');
        document.getElementById('markAbsentButton').onclick = () => registrarPresencaOuFalta(student.Nome, 'falta');

        studentDetail.classList.add('active'); // Mostra o modal/painel
    }

    // Função para fechar o modal de detalhes
    closeDetailButton.addEventListener('click', () => {
        studentDetail.classList.remove('active');
    });

    // Função para atualizar notas
    async function updateNotes(nomeAluno) {
        const nota1 = document.getElementById('detailNota1').value;
        const nota2 = document.getElementById('detailNota2').value;
        const nota3 = document.getElementById('detailNota3').value;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'atualizarNotas',
                    nomeAluno: nomeAluno,
                    nota1: nota1 !== '' ? parseFloat(nota1.replace(',', '.')) : null,
                    nota2: nota2 !== '' ? parseFloat(nota2.replace(',', '.')) : null,
                    nota3: nota3 !== '' ? parseFloat(nota3.replace(',', '.')) : null,
                }),
            });

            const result = await response.json();
            if (result.success) {
                alert(result.message);
                studentDetail.classList.remove('active'); // Fecha o modal após o sucesso
                fetchStudents(); // Atualiza a tabela
            } else {
                alert(`Erro ao atualizar notas: ${result.error}`);
            }
        } catch (error) {
            console.error('Erro ao enviar atualização de notas:', error);
            alert('Erro ao enviar atualização de notas: ' + error.message);
        }
    }

    // Função para registrar presença ou falta
    // O 'tipoRegistro' deve ser 'presenca' para status 'P' ou 'falta' para status 'A'
    async function registrarPresencaOuFalta(nomeAluno, tipoRegistro) { 
        const url = API_URL; // Usa o endpoint do proxy Vercel
        const dataAtual = new Date().toISOString().slice(0, 10); // YYYY-MM-DD (ex: "2025-07-10")

        let statusParaEnviar = '';
        let mensagemExibida = '';

        if (tipoRegistro === 'presenca') {
            statusParaEnviar = 'P'; // Envia 'P' para marcar presença na coluna do dia
            mensagemExibida = 'presença';
        } else if (tipoRegistro === 'falta') {
            statusParaEnviar = 'A'; // Envia 'A' para marcar falta na coluna do dia e incrementar faltas totais
            mensagemExibida = 'falta';
        } else {
            alert('Tipo de registro inválido. Use "presenca" ou "falta".');
            return; 
        }

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'registrarPresenca', // Ação no Apps Script
                    nomeAluno: nomeAluno,
                    status: statusParaEnviar,   // 'P' ou 'A'
                    data: dataAtual             // Data para criar coluna do dia
                }),
            });

            const result = await response.json();
            if (result.success) {
                alert(`Sucesso: ${mensagemExibida} registrada. ${result.message}`); 
                studentDetail.classList.remove('active'); // Fecha o modal após o sucesso
                fetchStudents(); // Atualiza a tabela para refletir as mudanças
            } else {
                alert(`Erro ao registrar ${mensagemExibida}: ${result.error}`);
            }
        } catch (error) {
            console.error('Erro ao enviar registro:', error);
            alert('Erro ao enviar registro: ' + error.message);
        }
    }


    // Event listeners para os filtros e botão de busca
    searchButton.addEventListener('click', fetchStudents);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchStudents();
        }
    });
    // Adiciona event listeners para os filtros de curso e período
    cursoFilter.addEventListener('change', fetchStudents);
    periodoFilter.addEventListener('change', fetchStudents);

    // Carrega os alunos na primeira vez que a página é carregada
    fetchStudents();
});
