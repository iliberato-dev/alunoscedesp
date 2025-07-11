document.addEventListener('DOMContentLoaded', () => {
    // Seletores dos elementos da interface principal
    const searchInput = document.getElementById('searchInput');
    const cursoFilter = document.getElementById('cursoFilter');
    const periodoFilter = document.getElementById('periodoFilter');
    const searchButton = document.getElementById('searchButton');
    const clearSearchButton = document.getElementById('clearSearchButton');
    const showAllButton = document.getElementById('showAllButton');
    const resultTableBody = document.getElementById('resultTableBody');
    const noResultsMessage = document.getElementById('noResults');

    // Seletores dos elementos do Modal de Registro de Aluno
    const registerButton = document.getElementById('registerButton');
    const registrationModal = document.getElementById('registrationModal');
    const closeRegistrationModalButton = document.getElementById('closeRegistrationModalButton');
    const filtroPeriodoModal = document.getElementById('filtroPeriodoModal');
    const filtroOrigemModal = document.getElementById('filtroOrigemModal');
    const alunoSelecionado = document.getElementById('alunoSelecionado');
    const dataPresencaInput = document.getElementById('dataPresenca');
    const statusPresenteRadio = document.getElementById('presente');
    const statusAusenteRadio = document.getElementById('ausente');
    const submitPresencaButton = document.getElementById('submitPresenca');
    const nota1Input = document.getElementById('nota1'); // Inputs do formulário principal de notas
    const nota2Input = document.getElementById('nota2');
    const nota3Input = document.getElementById('nota3');
    const submitNotasButton = document.getElementById('submitNotas');
    const feedbackMessage = document.getElementById('feedbackMessage'); // Mensagem de feedback do modal

    // Seletores dos elementos do Painel Lateral de Detalhes do Aluno
    const studentDetail = document.getElementById('studentDetail');
    const closeDetailButton = document.getElementById('closeDetailPanel'); // ID CORRIGIDO AQUI
    const detailName = document.getElementById('detailName');
    const detailFaltas = document.getElementById('detailFaltas');
    const detailNota1 = document.getElementById('detailNota1'); // Inputs de notas do painel de detalhes
    const detailNota2 = document.getElementById('detailNota2');
    const detailNota3 = document.getElementById('detailNota3');
    const updateNotesButton = document.getElementById('updateNotesButton');
    const markPresentButton = document.getElementById('markPresentButton');
    const markAbsentButton = document.getElementById('markAbsentButton');

    // URL do proxy Vercel para o seu Apps Script
    const API_URL = '/api/appsscript';

    let currentStudentsData = []; // Armazena os dados dos alunos para uso local
    let selectedStudentId = null; // Para armazenar o ID_Unico do aluno selecionado no painel de detalhes

    // Função para buscar alunos
    async function fetchStudents(applyFilters = true) {
        const nomeAluno = searchInput.value.trim();
        const curso = applyFilters ? cursoFilter.value : '';
        const periodo = applyFilters ? periodoFilter.value : '';

        // Construindo a URL com parâmetros de forma segura para fetch()
        let queryString = '';
        if (nomeAluno) {
            queryString += `&nomeAluno=${encodeURIComponent(nomeAluno)}`;
        }
        if (curso) {
            queryString += `&curso=${encodeURIComponent(curso)}`;
        }
        if (periodo) {
            queryString += `&periodo=${encodeURIComponent(periodo)}`;
        }

        // Adiciona '?' ou ajusta '&' inicial
        if (queryString.startsWith('&')) {
            queryString = '?' + queryString.substring(1);
        } else if (queryString.length > 0) {
            queryString = '?' + queryString;
        }

        const fullUrl = API_URL + queryString;

        try {
            const response = await fetch(fullUrl);
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            currentStudentsData = data.saida || [];
            displayStudents(currentStudentsData);
            populateStudentSelect(currentStudentsData); // Preenche o select do modal de registro
        } catch (error) {
            console.error('Erro ao buscar alunos:', error);
            resultTableBody.innerHTML = `<tr><td colspan="8">Erro ao carregar dados: ${error.message}</td></tr>`;
            noResultsMessage.classList.remove('hidden');
        }
    }

    // Função para exibir alunos na tabela principal
    function displayStudents(students) {
        resultTableBody.innerHTML = '';
        noResultsMessage.classList.add('hidden'); // Esconde a mensagem de "nenhum aluno" por padrão

        if (students.length === 0) {
            noResultsMessage.classList.remove('hidden');
            return;
        }

        students.forEach(student => {
            const row = resultTableBody.insertRow();
            // Adiciona atributos data-label para responsividade móvel
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
            row.insertCell(7).textContent = student.Origem; // Coluna de origem (nome da aba/curso)

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

        // Armazena o ID_Unico do aluno selecionado
        selectedStudentId = student.ID_Unico;

        // Limpa e adiciona event listeners para os botões de ação do painel
        updateNotesButton.onclick = null; // Limpa listener anterior
        markPresentButton.onclick = null; // Limpa listener anterior
        markAbsentButton.onclick = null; // Limpa listener anterior

        updateNotesButton.onclick = () => updateNotes(selectedStudentId, detailNota1.value, detailNota2.value, detailNota3.value);
        markPresentButton.onclick = () => registrarPresencaOuFalta(selectedStudentId, 'P');
        markAbsentButton.onclick = () => registrarPresencaOuFalta(selectedStudentId, 'A');

        studentDetail.classList.add('active'); // Mostra o painel lateral
    }

    // Event listener para fechar o painel lateral de detalhes do aluno
    closeDetailButton.addEventListener('click', () => {
        studentDetail.classList.remove('active');
    });

    // Função para atualizar notas (chamada do painel lateral ou modal de registro)
    async function updateNotes(alunoId, n1, n2, n3) {
        // As notas podem vir dos inputs do modal principal ou do painel lateral, dependendo da chamada
        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'atualizarNotas',
                    alunoId: alunoId, // Envia o ID único do aluno
                    nota1: n1 !== '' ? parseFloat(String(n1).replace(',', '.')) : null,
                    nota2: n2 !== '' ? parseFloat(String(n2).replace(',', '.')) : null,
                    nota3: n3 !== '' ? parseFloat(String(n3).replace(',', '.')) : null,
                }),
            });

            const result = await response.json();
            if (result.success) {
                showFeedback(result.message, 'success');
                // Fecha o modal/painel de onde a ação foi iniciada
                if (registrationModal.classList.contains('active')) {
                    registrationModal.classList.remove('active');
                }
                if (studentDetail.classList.contains('active')) {
                    studentDetail.classList.remove('active');
                }
                fetchStudents(); // Atualiza a tabela principal
            } else {
                showFeedback(`Erro ao atualizar notas: ${result.error}`, 'error');
            }
        } catch (error) {
            console.error('Erro ao enviar atualização de notas:', error);
            showFeedback('Erro ao enviar atualização de notas: ' + error.message, 'error');
        }
    }

    // Função para registrar presença ou falta (chamada do painel lateral ou modal de registro)
    async function registrarPresencaOuFalta(alunoId, status) {
        const dataRegistro = dataPresencaInput.value; // Pega a data do input do modal principal

        if (!dataRegistro && !studentDetail.classList.contains('active')) { // Se não estiver no painel de detalhes, exige data
             showFeedback('Por favor, selecione uma data para registrar a presença/falta.', 'error');
             return;
        }

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
                    data: studentDetail.classList.contains('active') ? new Date().toISOString().slice(0, 10) : dataRegistro // Usa data atual se do painel, senão usa do input
                }),
            });

            const result = await response.json();
            if (result.success) {
                showFeedback(`Sucesso: ${status === 'P' ? 'Presença' : 'Falta'} registrada. ${result.message}`, 'success');
                // Fecha o modal/painel de onde a ação foi iniciada
                if (registrationModal.classList.contains('active')) {
                    registrationModal.classList.remove('active');
                }
                if (studentDetail.classList.contains('active')) {
                    studentDetail.classList.remove('active');
                }
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
        dataPresencaInput.value = new Date().toISOString().slice(0, 10); // Data atual no formato YYYY-MM-DD
        statusPresenteRadio.checked = true; // Marca 'Presente' por padrão
        nota1Input.value = '';
        nota2Input.value = '';
        nota3Input.value = '';
        feedbackMessage.classList.add('hidden'); // Esconde mensagens antigas
        feedbackMessage.textContent = '';
        populateStudentSelect(currentStudentsData); // Popula o select com os alunos carregados
    });

    // Fecha o modal de registro
    closeRegistrationModalButton.addEventListener('click', () => {
        registrationModal.classList.remove('active');
    });

    // Fecha o modal se clicar fora da área de conteúdo
    window.addEventListener('click', (event) => {
        if (event.target === registrationModal) {
            registrationModal.classList.remove('active');
        }
    });

    // Popula o <select> de alunos dentro do modal de registro
    function populateStudentSelect(students) {
        alunoSelecionado.innerHTML = '<option value="">Selecione um aluno</option>';
        const filteredModalStudents = students.filter(student => {
            const matchesPeriodo = filtroPeriodoModal.value === '' || student.Periodo === filtroPeriodoModal.value;
            const matchesOrigem = filtroOrigemModal.value === '' || student.Origem === filtroOrigemModal.value;
            return matchesPeriodo && matchesOrigem;
        });

        filteredModalStudents.forEach(student => {
            const option = document.createElement('option');
            option.value = student.ID_Unico; // Usar ID_Unico para identificar o aluno no backend
            option.textContent = `${student.Nome} (${student.Origem} - ${student.Periodo})`;
            alunoSelecionado.appendChild(option);
        });
    }

    // Event listeners para os filtros dentro do modal de registro
    filtroPeriodoModal.addEventListener('change', () => populateStudentSelect(currentStudentsData));
    filtroOrigemModal.addEventListener('change', () => populateStudentSelect(currentStudentsData));

    // Submeter Registro de Presença do modal de registro
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

        await registrarPresencaOuFalta(alunoIdParaRegistro, statusRegistro);
    });

    // Submeter Atualização de Notas do modal de registro
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
        if ((n1 !== '' && (isNaN(parseFloat(String(n1).replace(',', '.'))) || parseFloat(String(n1).replace(',', '.')) < 0 || parseFloat(String(n1).replace(',', '.')) > 10)) ||
            (n2 !== '' && (isNaN(parseFloat(String(n2).replace(',', '.'))) || parseFloat(String(n2).replace(',', '.')) < 0 || parseFloat(String(n2).replace(',', '.')) > 10)) ||
            (n3 !== '' && (isNaN(parseFloat(String(n3).replace(',', '.'))) || parseFloat(String(n3).replace(',', '.')) < 0 || parseFloat(String(n3).replace(',', '.')) > 10))) {
            showFeedback('Por favor, insira notas válidas entre 0 e 10.', 'error');
            return;
        }

        await updateNotes(alunoIdParaNotas, n1, n2, n3);
    });

    // Função para mostrar feedback ao usuário (no modal de registro)
    function showFeedback(message, type) {
        feedbackMessage.textContent = message;
        feedbackMessage.classList.remove('hidden', 'success', 'error');
        feedbackMessage.classList.add(type); // Adiciona classe 'success' ou 'error'
        setTimeout(() => {
            feedbackMessage.classList.add('hidden');
        }, 5000); // Esconde a mensagem após 5 segundos
    }

    // --- Event listeners para os filtros e botões da interface principal ---

    searchButton.addEventListener('click', () => fetchStudents(true)); // Aplica filtros
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            fetchStudents(true); // Aplica filtros
        }
    });
    cursoFilter.addEventListener('change', () => fetchStudents(true)); // Aplica filtros
    periodoFilter.addEventListener('change', () => fetchStudents(true)); // Aplica filtros

    // Limpar Busca
    clearSearchButton.addEventListener('click', () => {
        searchInput.value = '';
        cursoFilter.value = '';
        periodoFilter.value = '';
        // Não chama fetchStudents aqui, apenas limpa os campos.
        // Se quiser que a tabela seja atualizada ao limpar, chame fetchStudents(false)
        // fetchStudents(false);
    });

    // Mostrar Todos os Alunos
    showAllButton.addEventListener('click', () => {
        searchInput.value = ''; // Limpa o campo de busca por nome
        cursoFilter.value = ''; // Limpa o filtro de curso
        periodoFilter.value = ''; // Limpa o filtro de período
        fetchStudents(false); // Chama fetchStudents com 'false' para ignorar os filtros atuais e buscar todos
    });

    // Carrega os alunos na primeira vez que a página é carregada
    fetchStudents(false); // Carrega todos os alunos inicialmente
});
