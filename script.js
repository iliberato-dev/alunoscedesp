document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const cursoFilter = document.getElementById('cursoFilter');
    const periodoFilter = document.getElementById('periodoFilter');
    const searchButton = document.getElementById('searchButton');
    const clearSearchButton = document.getElementById('clearSearchButton'); // Adicionado
    const showAllButton = document.getElementById('showAllButton'); // Adicionado
    const resultTableBody = document.getElementById('resultTableBody');
    const noResultsMessage = document.getElementById('noResults'); // Adicionado

    // Elementos do Modal de Registro
    const registerButton = document.getElementById('registerButton');
    const registrationModal = document.getElementById('registrationModal');
    const closeRegistrationModalButton = document.getElementById('closeRegistrationModalButton'); // ID CORRIGIDO
    const filtroPeriodoModal = document.getElementById('filtroPeriodoModal');
    const filtroOrigemModal = document.getElementById('filtroOrigemModal');
    const alunoSelecionado = document.getElementById('alunoSelecionado');
    const dataPresencaInput = document.getElementById('dataPresenca');
    const statusPresenteRadio = document.getElementById('presente');
    const statusAusenteRadio = document.getElementById('ausente');
    const submitPresencaButton = document.getElementById('submitPresenca');
    const nota1Input = document.getElementById('nota1');
    const nota2Input = document.getElementById('nota2');
    const nota3Input = document.getElementById('nota3');
    const submitNotasButton = document.getElementById('submitNotas');
    const feedbackMessage = document.getElementById('feedbackMessage');


    // Elementos do Painel Lateral de Detalhes do Aluno
    const studentDetail = document.getElementById('studentDetail');
    // ID CORRIGIDO: Agora aponta para 'closeDetailPanel' conforme o HTML
    const closeDetailButton = document.getElementById('closeDetailPanel');
    const detailName = document.getElementById('detailName');
    const detailFaltas = document.getElementById('detailFaltas');
    const detailNota1 = document.getElementById('detailNota1');
    const detailNota2 = document.getElementById('detailNota2');
    const detailNota3 = document.getElementById('detailNota3');
    const updateNotesButton = document.getElementById('updateNotesButton');
    const markPresentButton = document.getElementById('markPresentButton');
    const markAbsentButton = document.getElementById('markAbsentButton');


    // ** ATENÇÃO: Esta é a URL do proxy Vercel para o seu Apps Script **
    // Certifique-se de que seu vercel.json está configurado para /api/appsscript
    const API_URL = '/api/appsscript';

    let currentStudentsData = []; // Armazena os dados dos alunos para uso local
    let selectedStudentId = null; // Para armazenar o ID do aluno selecionado no modal

    // Função para buscar alunos
    async function fetchStudents(filter = true) {
        const nomeAluno = searchInput.value.trim();
        const curso = filter ? cursoFilter.value : '';
        const periodo = filter ? periodoFilter.value : '';

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
            populateStudentSelect(currentStudentsData); // Preenche o select do modal
        } catch (error) {
            console.error('Erro ao buscar alunos:', error);
            resultTableBody.innerHTML = `<tr><td colspan="8">Erro ao carregar dados: ${error.message}</td></tr>`;
            noResultsMessage.classList.remove('hidden');
        }
    }

    // Função para exibir alunos na tabela
    function displayStudents(students) {
        resultTableBody.innerHTML = '';
        noResultsMessage.classList.add('hidden'); // Esconde a mensagem de "nenhum aluno" por padrão

        if (students.length === 0) {
            noResultsMessage.classList.remove('hidden');
            return;
        }

        students.forEach(student => {
            const row = resultTableBody.insertRow();
            // Adiciona atributos data-label para responsividade
            row.insertCell(0).setAttribute('data-label', 'Nome:');
            row.insertCell(0).textContent = student.Nome;

            row.insertCell(1).setAttribute('data-label', 'Faltas:');
            row.insertCell(1).textContent = student.Faltas;

            row.insertCell(2).setAttribute('data-label', 'Nota 1º Bimestre:');
            row.insertCell(2).textContent = student.Nota1 !== 0 ? student.Nota1 : '-';

            row.insertCell(3).setAttribute('data-label', 'Nota 2º Bimestre:');
            row.insertCell(3).textContent = student.Nota2 !== 0 ? student.Nota2 : '-';

            row.insertCell(4).setAttribute('data-label', 'Nota 3º Bimestre:');
            row.insertCell(4).textContent = student.Nota3 !== 0 ? student.Nota3 : '-';

            row.insertCell(5).setAttribute('data-label', 'Média:');
            row.insertCell(5).textContent = student.Media !== 0 ? student.Media.toFixed(1) : '-';

            row.insertCell(6).setAttribute('data-label', 'Situação:');
            row.insertCell(6).textContent = student.Situacao;

            row.insertCell(7).setAttribute('data-label', 'Origem:');
            row.insertCell(7).textContent = student.Origem; // Coluna de origem (nome da aba)

            row.addEventListener('click', () => showStudentDetail(student));
        });
    }

    // Função para mostrar detalhes do aluno no painel lateral
    function showStudentDetail(student) {
        detailName.textContent = student.Nome;
        detailFaltas.textContent = student.Faltas;
        detailNota1.value = student.Nota1 !== 0 ? student.Nota1 : '';
        detailNota2.value = student.Nota2 !== 0 ? student.Nota2 : '';
        detailNota3.value = student.Nota3 !== 0 ? student.Nota3 : '';

        // Armazena o ID do aluno para uso nas funções de atualização/registro
        selectedStudentId = student.ID_Unico; // Supondo que você tenha um ID único para cada aluno

        // Remove listeners antigos para evitar duplicação e adiciona novos
        updateNotesButton.onclick = null;
        markPresentButton.onclick = null;
        markAbsentButton.onclick = null;

        updateNotesButton.onclick = () => updateNotes(selectedStudentId);
        markPresentButton.onclick = () => registrarPresencaOuFalta(selectedStudentId, 'P');
        markAbsentButton.onclick = () => registrarPresencaOuFalta(selectedStudentId, 'A');

        studentDetail.classList.add('active'); // Mostra o painel lateral
    }

    // Event listener para fechar o painel lateral de detalhes do aluno
    closeDetailButton.addEventListener('click', () => {
        studentDetail.classList.remove('active');
    });

    // Função para atualizar notas
    async function updateNotes(alunoId) {
        const nota1 = nota1Input.value; // Usando os inputs do modal principal para o exemplo, mas o correto seria usar os do painel de detalhes
        const nota2 = nota2Input.value;
        const nota3 = nota3Input.value;

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'atualizarNotas',
                    alunoId: alunoId, // Envia o ID único do aluno
                    nota1: nota1 !== '' ? parseFloat(nota1.replace(',', '.')) : null,
                    nota2: nota2 !== '' ? parseFloat(nota2.replace(',', '.')) : null,
                    nota3: nota3 !== '' ? parseFloat(nota3.replace(',', '.')) : null,
                }),
            });

            const result = await response.json();
            if (result.success) {
                showFeedback(result.message, 'success');
                studentDetail.classList.remove('active'); // Fecha o modal/painel após o sucesso
                fetchStudents(); // Atualiza a tabela
            } else {
                showFeedback(`Erro ao atualizar notas: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Erro ao enviar atualização de notas:', error);
            showFeedback('Erro ao enviar atualização de notas: ' + error.message, 'error');
        }
    }

    // Função para registrar presença ou falta (agora unificada)
    async function registrarPresencaOuFalta(alunoId, status) {
        const dataAtual = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'registrarPresenca', // Ação no Apps Script
                    alunoId: alunoId,       // Envia o ID único do aluno
                    status: status,         // 'P' ou 'A'
                    data: dataAtual         // Data para criar coluna do dia
                }),
            });

            const result = await response.json();
            if (result.success) {
                showFeedback(`Sucesso: ${status === 'P' ? 'Presença' : 'Falta'} registrada. ${result.message}`, 'success');
                studentDetail.classList.remove('active'); // Fecha o modal/painel
                fetchStudents(); // Atualiza a tabela para refletir as mudanças
            } else {
                showFeedback(`Erro ao registrar ${status === 'P' ? 'presença' : 'falta'}: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Erro ao enviar registro:', error);
            showFeedback('Erro ao enviar registro: ' + error.message, 'error');
        }
    }

    // --- Funções e Event Listeners para o Modal de Registro Principal ---

    // Abre o modal de registro
    registerButton.addEventListener('click', () => {
        registrationModal.classList.add('active');
        // Limpa campos e preenche a data atual
        alunoSelecionado.value = '';
        dataPresencaInput.value = new Date().toISOString().slice(0, 10);
        statusPresenteRadio.checked = true;
        nota1Input.value = '';
        nota2Input.value = '';
        nota3Input.value = '';
        feedbackMessage.classList.add('hidden');
        feedbackMessage.textContent = '';
        populateStudentSelect(currentStudentsData); // Popula o select com os alunos atuais
    });

    // Fecha o modal de registro
    closeRegistrationModalButton.addEventListener('click', () => {
        registrationModal.classList.remove('active');
    });

    // Fecha o modal se clicar fora
    window.addEventListener('click', (event) => {
        if (event.target === registrationModal) {
            registrationModal.classList.remove('active');
        }
    });

    // Popula o <select> de alunos no modal
    function populateStudentSelect(students) {
        alunoSelecionado.innerHTML = '<option value="">Selecione um aluno</option>';
        const filteredModalStudents = students.filter(student => {
            const matchesPeriodo = filtroPeriodoModal.value === '' || student.Periodo === filtroPeriodoModal.value;
            const matchesOrigem = filtroOrigemModal.value === '' || student.Origem === filtroOrigemModal.value;
            return matchesPeriodo && matchesOrigem;
        });

        filteredModalStudents.forEach(student => {
            const option = document.createElement('option');
            option.value = student.ID_Unico; // Usar ID_Unico para identificar o aluno
            option.textContent = `${student.Nome} (${student.Origem} - ${student.Periodo})`;
            alunoSelecionado.appendChild(option);
        });
    }

    // Event listeners para os filtros dentro do modal
    filtroPeriodoModal.addEventListener('change', () => populateStudentSelect(currentStudentsData));
    filtroOrigemModal.addEventListener('change', () => populateStudentSelect(currentStudentsData));


    // Submeter Registro de Presença do modal
    submitPresencaButton.addEventListener('click', async () => {
        const alunoIdParaRegistro = alunoSelecionado.value;
        const dataRegistro = dataPresencaInput.value;
        const statusRegistro = document.querySelector('input[name="statusPresenca"]:checked').value;

        if (!alunoIdParaRegistro) {
            showFeedback('Por favor, selecione um aluno para registrar a presença.', 'error');
            return;
        }
        if (!dataRegistro) {
            showFeedback('Por favor, selecione uma data para registrar a presença.', 'error');
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'registrarPresenca',
                    alunoId: alunoIdParaRegistro,
                    status: statusRegistro, // 'P' ou 'A'
                    data: dataRegistro
                }),
            });

            const result = await response.json();
            if (result.success) {
                showFeedback(`Sucesso: ${result.message}`, 'success');
                // Opcional: fechar modal ou resetar campos
                // registrationModal.classList.remove('active');
                fetchStudents(); // Atualiza a tabela principal
            } else {
                showFeedback(`Erro ao registrar: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Erro ao enviar registro de presença:', error);
            showFeedback('Erro ao enviar registro de presença: ' + error.message, 'error');
        }
    });

    // Submeter Atualização de Notas do modal
    submitNotasButton.addEventListener('click', async () => {
        const alunoIdParaNotas = alunoSelecionado.value;
        const n1 = nota1Input.value;
        const n2 = nota2Input.value;
        const n3 = nota3Input.value;

        if (!alunoIdParaNotas) {
            showFeedback('Por favor, selecione um aluno para atualizar as notas.', 'error');
            return;
        }

        // Validação básica das notas (podem ser vazias, mas se houver, devem ser válidas)
        if ((n1 !== '' && (isNaN(parseFloat(n1)) || parseFloat(n1) < 0 || parseFloat(n1) > 10)) ||
            (n2 !== '' && (isNaN(parseFloat(n2)) || parseFloat(n2) < 0 || parseFloat(n2) > 10)) ||
            (n3 !== '' && (isNaN(parseFloat(n3)) || parseFloat(n3) < 0 || parseFloat(n3) > 10))) {
            showFeedback('Por favor, insira notas válidas entre 0 e 10.', 'error');
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'atualizarNotas',
                    alunoId: alunoIdParaNotas,
                    nota1: n1 !== '' ? parseFloat(n1.replace(',', '.')) : null,
                    nota2: n2 !== '' ? parseFloat(n2.replace(',', '.')) : null,
                    nota3: n3 !== '' ? parseFloat(n3.replace(',', '.')) : null,
                }),
            });

            const result = await response.json();
            if (result.success) {
                showFeedback(`Sucesso: ${result.message}`, 'success');
                // Opcional: fechar modal ou resetar campos
                // registrationModal.classList.remove('active');
                fetchStudents(); // Atualiza a tabela principal
            } else {
                showFeedback(`Erro ao atualizar notas: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Erro ao enviar atualização de notas:', error);
            showFeedback('Erro ao enviar atualização de notas: ' + error.message, 'error');
        }
    });


    // Função para mostrar feedback ao usuário
    function showFeedback(message, type) {
        feedbackMessage.textContent = message;
        feedbackMessage.classList.remove('hidden', 'success', 'error');
        feedbackMessage.classList.add(type); // Adiciona classe 'success' ou 'error'
        setTimeout(() => {
            feedbackMessage.classList.add('hidden');
        }, 5000); // Esconde a mensagem após 5 segundos
    }


    // Event listeners para os filtros e botão de busca
    searchButton.addEventListener('click', () => fetchStudents(true)); // Passa true para aplicar filtros
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchStudents(true);
        }
    });
    cursoFilter.addEventListener('change', () => fetchStudents(true));
    periodoFilter.addEventListener('change', () => fetchStudents(true));

    // Limpar Busca
    clearSearchButton.addEventListener('click', () => {
        searchInput.value = '';
        cursoFilter.value = '';
        periodoFilter.value = '';
        // Não chama fetchStudents aqui, apenas limpa
    });

    // Mostrar Todos os Alunos
    showAllButton.addEventListener('click', () => {
        searchInput.value = ''; // Limpa o campo de busca por nome
        cursoFilter.value = ''; // Limpa o filtro de curso
        periodoFilter.value = ''; // Limpa o filtro de período
        fetchStudents(false); // Chama fetchStudents com 'false' para ignorar os filtros de busca
    });


    // Carrega os alunos na primeira vez que a página é carregada
    fetchStudents();
});
