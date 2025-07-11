// A URL do seu Web App implantado (substitua pela sua URL real)
const WEB_APP_URL = '/api/appsscript'; // SUBSTITUA PELA SUA URL REAL

let allStudentsRawData = []; // Armazena todos os alunos carregados (dados brutos para os modais)
let currentFilteredStudents = []; // Armazena os alunos filtrados atualmente na tabela principal
let selectedStudentId = null; // Armazena o ID_Unico do aluno selecionado no painel de detalhes

document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do DOM para a consulta principal
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const clearSearchButton = document.getElementById('clearSearchButton');
    const showAllButton = document.getElementById('showAllButton');
    const periodoFilter = document.getElementById('periodoFilter');
    const cursoFilter = document.getElementById('cursoFilter');
    const resultTableBody = document.getElementById('resultTableBody');
    const noResultsMessage = document.getElementById('noResults');

    // Referências aos elementos do DOM para o painel de detalhes do aluno
    const studentDetail = document.getElementById('studentDetail');
    const closeDetailPanelButton = document.getElementById('closeDetailPanel');
    const detailName = document.getElementById('detailName');
    const detailFaltas = document.getElementById('detailFaltas');
    const detailNota1 = document.getElementById('detailNota1');
    const detailNota2 = document.getElementById('detailNota2');
    const detailNota3 = document.getElementById('detailNota3');
    const updateNotesButton = document.getElementById('updateNotesButton');
    const markPresentButton = document.getElementById('markPresentButton');
    const markAbsentButton = document.getElementById('markAbsentButton');

    // Referências aos elementos do DOM para o modal de registro
    const registerButton = document.getElementById('registerButton');
    const registrationModal = document.getElementById('registrationModal');
    const closeRegistrationModalButton = document.getElementById('closeRegistrationModalButton');
    const filtroPeriodoModal = document.getElementById('filtroPeriodoModal');
    const filtroOrigemModal = document.getElementById('filtroOrigemModal');
    const alunoSelecionadoSelect = document.getElementById('alunoSelecionado');
    const dataPresencaInput = document.getElementById('dataPresenca');
    const presenteRadio = document.getElementById('presente');
    const ausenteRadio = document.getElementById('ausente');
    const submitPresencaButton = document.getElementById('submitPresenca');
    const nota1Input = document.getElementById('nota1');
    const nota2Input = document.getElementById('nota2');
    const nota3Input = document.getElementById('nota3');
    const submitNotasButton = document.getElementById('submitNotas');
    const feedbackMessage = document.getElementById('feedbackMessage');

    // Função para mostrar feedback ao usuário
    const showFeedback = (message, type = 'success') => {
        feedbackMessage.textContent = message;
        feedbackMessage.className = `feedback-message ${type}`;
        feedbackMessage.classList.remove('hidden');
        setTimeout(() => {
            feedbackMessage.classList.add('hidden');
        }, 5000); // Esconde a mensagem após 5 segundos
    };

    // Função para buscar e exibir os alunos
    const fetchAndDisplayStudents = async (filters = {}) => {
        resultTableBody.innerHTML = '<tr><td colspan="8">Carregando...</td></tr>';
        noResultsMessage.classList.add('hidden');

        const params = new URLSearchParams(filters);
        const url = `${WEB_APP_URL}?${params.toString()}`;

        try {
            const response = await fetch(WEB_APP_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();

            allStudentsRawData = data.saida || []; // Armazena todos os alunos para o modal
            currentFilteredStudents = allStudentsRawData; // Por padrão, a tabela exibe todos ao carregar

            // Aplica os filtros da busca principal à lista completa
            const filteredForTable = allStudentsRawData.filter(student => {
                const nomeMatch = filters.nomeAluno ? String(student.Nome).toLowerCase().includes(filters.nomeAluno.toLowerCase()) : true;
                const periodoMatch = filters.periodo ? String(student.Periodo).toLowerCase() === filters.periodo.toLowerCase() : true;
                const cursoMatch = filters.curso ? String(student.Origem).toUpperCase() === filters.curso.toUpperCase() : true;
                return nomeMatch && periodoMatch && cursoMatch;
            });
            displayStudents(filteredForTable);

        } catch (error) {
            console.error('Erro ao buscar alunos:', error);
            resultTableBody.innerHTML = '<tr><td colspan="8">Erro ao carregar dados. Tente novamente.</td></tr>';
            noResultsMessage.classList.remove('hidden');
            noResultsMessage.textContent = `Erro ao carregar dados: ${error.message}`;
        }
    };

    // Função para exibir os alunos na tabela principal
    const displayStudents = (students) => {
        resultTableBody.innerHTML = ''; // Limpa a tabela
        if (students.length === 0) {
            noResultsMessage.classList.remove('hidden');
            noResultsMessage.textContent = 'Nenhum aluno encontrado com os filtros aplicados.';
            return;
        }

        noResultsMessage.classList.add('hidden');
        students.forEach(student => {
            const row = resultTableBody.insertRow();
            // Adiciona data-label para responsividade da tabela
            row.insertCell(0).setAttribute('data-label', 'Nome');
            row.cells[0].textContent = student.Nome;
            row.insertCell(1).setAttribute('data-label', 'Faltas');
            row.cells[1].textContent = student.Faltas;
            row.insertCell(2).setAttribute('data-label', '1º Bim.');
            row.cells[2].textContent = student.Nota1 || '';
            row.insertCell(3).setAttribute('data-label', '2º Bim.');
            row.cells[3].textContent = student.Nota2 || '';
            row.insertCell(4).setAttribute('data-label', '3º Bim.');
            row.cells[4].textContent = student.Nota3 || '';
            row.insertCell(5).setAttribute('data-label', 'Média');
            row.cells[5].textContent = student.Media ? student.Media.toFixed(1) : '';
            row.insertCell(6).setAttribute('data-label', 'Situação');
            row.cells[6].textContent = student.Situacao;
            row.insertCell(7).setAttribute('data-label', 'Origem');
            row.cells[7].textContent = student.Origem;

            row.addEventListener('click', () => showStudentDetail(student));
        });
    };

    // Função para mostrar o painel de detalhes do aluno
    const showStudentDetail = (student) => {
        selectedStudentId = student.ID_Unico; // Armazena o ID_Unico do aluno selecionado
        detailName.textContent = student.Nome;
        detailFaltas.textContent = student.Faltas;
        detailNota1.value = student.Nota1 > 0 ? student.Nota1 : ''; // Só mostra se a nota for maior que 0
        detailNota2.value = student.Nota2 > 0 ? student.Nota2 : '';
        detailNota3.value = student.Nota3 > 0 ? student.Nota3 : '';

        // Adiciona um listener para fechar o painel
        closeDetailPanelButton.onclick = () => {
            studentDetail.classList.remove('active');
            selectedStudentId = null; // Limpa o ID selecionado
        };

        // Adiciona listeners para os botões do painel de detalhes
        updateNotesButton.onclick = () => updateNotes(selectedStudentId, detailNota1.value, detailNota2.value, detailNota3.value);
        markPresentButton.onclick = () => registrarPresencaOuFalta(selectedStudentId, 'P');
        markAbsentButton.onclick = () => registrarPresencaOuFalta(selectedStudentId, 'A');

        studentDetail.classList.add('active'); // Mostra o painel
    };

    // Função para atualizar notas (usada tanto no painel de detalhes quanto no modal)
    const updateNotes = async (alunoId, n1, n2, n3) => {
        if (!alunoId) {
            showFeedback('Nenhum aluno selecionado para atualizar as notas.', 'error');
            return;
        }

        if (confirm(`Confirma a atualização das notas para o aluno ID: ${alunoId}?`)) {
            try {
                const response = await fetch(WEB_APP_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'atualizarNotas',
                        alunoId: alunoId, // Enviando o ID_Unico
                        nota1: n1 !== '' ? parseFloat(String(n1).replace(',', '.')) : null,
                        nota2: n2 !== '' ? parseFloat(String(n2).replace(',', '.')) : null,
                        nota3: n3 !== '' ? parseFloat(String(n3).replace(',', '.')) : null,
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                if (result.success) {
                    showFeedback('Notas atualizadas com sucesso!', 'success');
                    fetchAndDisplayStudents({ // Recarrega os dados após a atualização
                        nomeAluno: searchInput.value,
                        periodo: periodoFilter.value,
                        curso: cursoFilter.value
                    });
                    studentDetail.classList.remove('active'); // Fecha o painel de detalhes
                    registrationModal.classList.add('hidden'); // Fecha o modal (se aberto)
                } else {
                    showFeedback(`Erro ao atualizar notas: ${result.error || 'Erro desconhecido'}`, 'error');
                    console.error('Erro do servidor:', result.error);
                }
            } catch (error) {
                console.error('Erro na requisição de atualização de notas:', error);
                showFeedback(`Erro ao conectar com o servidor: ${error.message}`, 'error');
            }
        }
    };

    // Função para registrar presença ou falta (usada tanto no painel de detalhes quanto no modal)
    const registrarPresencaOuFalta = async (alunoId, status) => {
        if (!alunoId) {
            showFeedback('Nenhum aluno selecionado para registrar presença/falta.', 'error');
            return;
        }

        const dataRegistro = dataPresencaInput.value; // Pega a data do input do modal ou usa a data atual
        if (!dataRegistro) {
            showFeedback('Por favor, selecione uma data para o registro de presença/falta.', 'error');
            return;
        }

        let confirmMessage = status === 'P'
            ? `Confirma a presença para o aluno ID: ${alunoId} na data ${dataRegistro}?`
            : `Confirma a falta para o aluno ID: ${alunoId} na data ${dataRegistro}? Isso incrementará as faltas.`;

        if (confirm(confirmMessage)) {
            try {
                const response = await fetch(WEB_APP_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'registrarPresenca',
                        alunoId: alunoId, // Enviando o ID_Unico
                        status: status,
                        data: dataRegistro
                    }),
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                if (result.success) {
                    showFeedback(result.message, 'success');
                    fetchAndDisplayStudents({ // Recarrega os dados após a atualização
                        nomeAluno: searchInput.value,
                        periodo: periodoFilter.value,
                        curso: cursoFilter.value
                    });
                    studentDetail.classList.remove('active'); // Fecha o painel de detalhes
                    registrationModal.classList.add('hidden'); // Fecha o modal (se aberto)
                } else {
                    showFeedback(`Erro ao registrar: ${result.error || 'Erro desconhecido'}`, 'error');
                    console.error('Erro do servidor:', result.error);
                }
            } catch (error) {
                console.error('Erro na requisição de registro de presença/falta:', error);
                showFeedback(`Erro ao conectar com o servidor: ${error.message}`, 'error');
            }
        }
    };

    // --- Lógica do Modal de Registro ---
    registerButton.addEventListener('click', () => {
        registrationModal.classList.remove('hidden');
        // Preenche o campo de data com a data atual
        const today = new Date();
        dataPresencaInput.value = today.toISOString().slice(0, 10);
        // Garante que o rádio "Presente" esteja selecionado por padrão
        presenteRadio.checked = true;
        // Limpa as notas
        nota1Input.value = '';
        nota2Input.value = '';
        nota3Input.value = '';
        // Reseta os filtros de seleção de aluno no modal
        filtroPeriodoModal.value = '';
        filtroOrigemModal.value = '';
        populateAlunoSelect(); // Popula com todos os alunos inicialmente
    });

    closeRegistrationModalButton.addEventListener('click', () => {
        registrationModal.classList.add('hidden');
        showFeedback('', 'hidden'); // Limpa qualquer feedback
    });

    // Função para popular o select de alunos no modal
    const populateAlunoSelect = () => {
        alunoSelecionadoSelect.innerHTML = '<option value="">Selecione um aluno</option>';
        const filtroPeriodo = filtroPeriodoModal.value.toLowerCase();
        const filtroOrigem = filtroOrigemModal.value.toUpperCase();

        const filteredStudentsForModal = allStudentsRawData.filter(student => {
            const periodoMatch = filtroPeriodo ? String(student.Periodo).toLowerCase() === filtroPeriodo : true;
            const origemMatch = filtroOrigem ? String(student.Origem).toUpperCase() === filtroOrigem : true;
            return periodoMatch && origemMatch;
        });

        filteredStudentsForModal.sort((a, b) => String(a.Nome).localeCompare(String(b.Nome))); // Ordena por nome

        filteredStudentsForModal.forEach(student => {
            const option = document.createElement('option');
            option.value = student.ID_Unico; // O valor da option será o ID_Unico do aluno
            option.textContent = `${student.Nome} (${student.Origem})`;
            alunoSelecionadoSelect.appendChild(option);
        });
    };

    // Event listeners para os filtros do modal de seleção de aluno
    filtroPeriodoModal.addEventListener('change', populateAlunoSelect);
    filtroOrigemModal.addEventListener('change', populateAlunoSelect);

    // Event listener para o botão de registrar presença no modal
    submitPresencaButton.addEventListener('click', () => {
        const alunoIdParaRegistro = alunoSelecionadoSelect.value;
        const statusSelecionado = document.querySelector('input[name="statusPresenca"]:checked').value;
        registrarPresencaOuFalta(alunoIdParaRegistro, statusSelecionado);
    });

    // Event listener para o botão de atualizar notas no modal
    submitNotasButton.addEventListener('click', () => {
        const alunoIdParaNotas = alunoSelecionadoSelect.value;
        updateNotes(alunoIdParaNotas, nota1Input.value, nota2Input.value, nota3Input.value);
    });

    // --- Event Listeners para os botões de busca principais ---
    searchButton.addEventListener('click', () => {
        const filters = {
            nomeAluno: searchInput.value,
            periodo: periodoFilter.value,
            curso: cursoFilter.value
        };
        fetchAndDisplayStudents(filters);
    });

    clearSearchButton.addEventListener('click', () => {
        searchInput.value = '';
        periodoFilter.value = '';
        cursoFilter.value = '';
        fetchAndDisplayStudents(); // Carrega todos os alunos sem filtros
    });

    showAllButton.addEventListener('click', () => {
        searchInput.value = '';
        periodoFilter.value = '';
        cursoFilter.value = '';
        fetchAndDisplayStudents(); // Carrega todos os alunos sem filtros
    });

    // Carrega todos os alunos ao iniciar a página e popula o select do modal
    fetchAndDisplayStudents().then(() => {
        populateAlunoSelect();
    });
});
