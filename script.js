document.addEventListener('DOMContentLoaded', () => {
    // ATUALIZE ESTA URL com a URL de implantação do seu Google Apps Script!
    const API_URL = 'https://script.google.com/macros/s/AKfycbxXInG7aYeUvRYyfHmAKUmN4nfO5gsZ5bUgoYWqzi72CCDV7EkEHL50FV1YCW7vKh8r/exec'; // Sua URL da API

    // Elementos existentes para a interface de consulta
    const nomeAlunoInput = document.getElementById('nomeAluno');
    const filtroOrigemSelect = document.getElementById('filtroOrigem');
    const filtroPeriodoSelect = document.getElementById('filtroPeriodo');
    const searchButton = document.getElementById('searchButton');
    const clearSearchButton = document.getElementById('clearSearchButton');
    const showAllButton = document.getElementById('showAllButton');
    const alunosTableBody = document.querySelector('#alunosTable tbody');
    const noResultsMessage = document.getElementById('noResults');

    // NOVOS elementos para a modal de registro
    const registerButton = document.getElementById('registerButton');
    const registrationModal = document.getElementById('registrationModal');
    const closeModalButton = document.querySelector('#registrationModal .close-button');
    const alunoSelecionadoSelect = document.getElementById('alunoSelecionado');
    const dataPresencaInput = document.getElementById('dataPresenca');
    const submitPresencaButton = document.getElementById('submitPresenca');
    const nota1Input = document.getElementById('nota1');
    const nota2Input = document.getElementById('nota2');
    const nota3Input = document.getElementById('nota3');
    const submitNotasButton = document.getElementById('submitNotas');
    const feedbackMessage = document.getElementById('feedbackMessage'); // Mensagem dentro da modal

    // NOVOS elementos de filtro da modal
    const filtroPeriodoModalSelect = document.getElementById('filtroPeriodoModal');
    const filtroOrigemModalSelect = document.getElementById('filtroOrigemModal');


    let abortController = null;
    let debounceTimer;

    // --- Funções de Utilitário ---
    function showFeedback(message, isError = false) {
        feedbackMessage.textContent = message;
        feedbackMessage.style.color = isError ? 'red' : 'green';
        feedbackMessage.classList.remove('hidden');
        setTimeout(() => {
            feedbackMessage.classList.add('hidden');
        }, 3000); // Esconde a mensagem após 3 segundos
    }

    // --- Funções da Interface de Consulta (Lógica Existente) ---
    async function fetchAndDisplayStudents(searchTerm = '', originFilter = '', periodFilter = '') {
        if (abortController) {
            abortController.abort();
            console.log('Requisição anterior cancelada.');
        }
        abortController = new AbortController();
        const signal = abortController.signal;

        alunosTableBody.innerHTML = '';
        noResultsMessage.classList.add('hidden');

        let url = API_URL;
        const params = new URLSearchParams();

        if (searchTerm) {
            params.append('nomeAluno', searchTerm);
        }
        if (originFilter) {
            params.append('curso', originFilter);
        }
        if (periodFilter) {
            params.append('periodo', periodFilter);
        }

        if (params.toString()) {
            url += `?${params.toString()}`;
        }

        try {
            const response = await fetch(url, { signal }); 
            
            if (signal.aborted) {
                console.log('Requisição abortada pelo usuário (nova busca iniciada).');
                return;
            }

            // A API do Apps Script sempre retorna 200 OK, mesmo em caso de erro lógico
            // O tratamento de erro ocorre verificando o conteúdo do JSON
            const data = await response.json(); 
            
            let studentsToShow = [];
            // Verifica se a resposta contém um erro
            if (data.error) {
                console.error('Erro da API:', data.error);
                alunosTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Erro da API: ${data.error}</td></tr>`;
                return; // Para a execução se houver um erro da API
            } else if (data.saida) { // Assume que dados de sucesso vêm em 'saida'
                studentsToShow = data.saida;
            }

            if (studentsToShow.length === 0) {
                noResultsMessage.classList.remove('hidden'); 
                return;
            }

            studentsToShow.forEach(student => {
                const row = alunosTableBody.insertRow();
                row.insertCell().setAttribute('data-label', 'Nome');
                row.cells[0].textContent = student.Nome || 'N/A';

                row.insertCell().setAttribute('data-label', 'Faltas');
                row.cells[1].textContent = student.Faltas !== undefined ? student.Faltas : 'N/A';

                row.insertCell().setAttribute('data-label', 'Nota 1º Bimestre');
                row.cells[2].textContent = student.Nota1 !== undefined ? student.Nota1 : 'N/A';

                row.insertCell().setAttribute('data-label', 'Nota 2º Bimestre');
                row.cells[3].textContent = student.Nota2 !== undefined ? student.Nota2 : 'N/A';

                row.insertCell().setAttribute('data-label', 'Nota 3º Bimestre');
                row.cells[4].textContent = student.Nota3 !== undefined ? student.Nota3 : 'N/A';

                row.insertCell().setAttribute('data-label', 'Média');
                if (typeof student.Media === 'number' && !isNaN(student.Media)) {
                    row.cells[5].textContent = student.Media.toFixed(1); 
                } else {
                    row.cells[5].textContent = 'N/A'; 
                }

                row.insertCell().setAttribute('data-label', 'Situacao');
                row.cells[6].textContent = student.Situacao || 'N/A';

                row.insertCell().setAttribute('data-label', 'Origem');
                row.cells[7].textContent = student.Origem || 'N/A';
            });

        } catch (error) {
            if (error.name === 'AbortError') {
                console.log('Fetch abortado:', error.message);
                return;
            }
            console.error('Erro ao buscar dados:', error);
            alunosTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Erro ao carregar os dados. Verifique a URL da API e a conexão. Detalhes: ${error.message || error}</td></tr>`;
        } finally {
            abortController = null;
        }
    }

    const triggerSearch = () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const searchTerm = nomeAlunoInput.value.trim();
            const originFilter = filtroOrigemSelect.value;
            const periodFilter = filtroPeriodoSelect.value;
            fetchAndDisplayStudents(searchTerm, originFilter, periodFilter);
        }, 300);
    };

    // Listeners de Eventos para a Interface de Consulta
    nomeAlunoInput.addEventListener('input', triggerSearch);
    filtroOrigemSelect.addEventListener('change', triggerSearch);
    filtroPeriodoSelect.addEventListener('change', triggerSearch);
    searchButton.addEventListener('click', () => {
        clearTimeout(debounceTimer);
        const searchTerm = nomeAlunoInput.value.trim();
        const originFilter = filtroOrigemSelect.value;
        const periodFilter = filtroPeriodoSelect.value;
        fetchAndDisplayStudents(searchTerm, originFilter, periodFilter);
    });
    clearSearchButton.addEventListener('click', () => {
        clearTimeout(debounceTimer);
        nomeAlunoInput.value = '';
        filtroOrigemSelect.value = '';
        filtroPeriodoSelect.value = '';
        fetchAndDisplayStudents('', '', '');
        nomeAlunoInput.focus();
    });
    showAllButton.addEventListener('click', () => {
        clearTimeout(debounceTimer);
        nomeAlunoInput.value = '';
        filtroOrigemSelect.value = '';
        filtroPeriodoSelect.value = '';
        fetchAndDisplayStudents('', '', '');
        nomeAlunoInput.focus();
    });

    fetchAndDisplayStudents(); // Carregamento inicial para a tabela de consulta

    // --- NOVAS Funções da Modal e de Registro ---

    // Função para popular o dropdown de alunos na modal com filtros
    async function populateStudentDropdown(periodo = '', curso = '') {
        alunoSelecionadoSelect.innerHTML = '<option value="">Carregando alunos...</option>';
        try {
            let url = API_URL;
            const params = new URLSearchParams();
            if (periodo) {
                params.append('periodo', periodo);
            }
            if (curso) {
                params.append('curso', curso);
            }
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await fetch(url);
            const data = await response.json();
            
            let allStudents = [];
            if (data.error) {
                console.error('Erro da API ao carregar alunos para dropdown:', data.error);
                showFeedback('Erro ao carregar a lista de alunos: ' + data.error, true);
                alunoSelecionadoSelect.innerHTML = '<option value="">Erro ao carregar alunos</option>';
                return;
            } else if (data.saida) {
                allStudents = data.saida;
            }

            alunoSelecionadoSelect.innerHTML = '<option value="">Selecione um aluno</option>'; // Redefine o dropdown
            allStudents.sort((a, b) => (a.Nome || '').localeCompare(b.Nome || '')); // Opcional: ordenar por nome
            allStudents.forEach(student => {
                const option = document.createElement('option');
                option.value = student.Nome; // Usa o nome como valor
                option.textContent = student.Nome;
                alunoSelecionadoSelect.appendChild(option);
            });
        } catch (error) {
            console.error('Erro ao carregar a lista de alunos para o dropdown:', error);
            showFeedback('Erro de comunicação ao carregar a lista de alunos.', true);
            alunoSelecionadoSelect.innerHTML = '<option value="">Erro ao carregar alunos</option>';
        }
    }

    // Listeners de Eventos para Modal
    registerButton.addEventListener('click', () => {
        registrationModal.classList.add('visible');
        // Resetar os filtros da modal para "Todos" ao abrir
        filtroPeriodoModalSelect.value = '';
        filtroOrigemModalSelect.value = '';
        // Popula o dropdown com todos os alunos inicialmente
        populateStudentDropdown(); 
        // Limpa os campos do formulário
        alunoSelecionadoSelect.value = '';
        dataPresencaInput.value = new Date().toISOString().slice(0,10); // Define a data atual
        document.getElementById('presente').checked = true;
        nota1Input.value = '';
        nota2Input.value = '';
        nota3Input.value = '';
        feedbackMessage.classList.add('hidden'); // Esconde o feedback anterior
    });

    closeModalButton.addEventListener('click', () => {
        registrationModal.classList.remove('visible');
    });

    // Fecha a modal se clicar fora do conteúdo
    window.addEventListener('click', (event) => {
        if (event.target === registrationModal) {
            registrationModal.classList.remove('visible');
        }
    });

    // Listeners para os novos filtros da modal
    filtroPeriodoModalSelect.addEventListener('change', () => {
        const periodo = filtroPeriodoModalSelect.value;
        const curso = filtroOrigemModalSelect.value;
        populateStudentDropdown(periodo, curso);
    });

    filtroOrigemModalSelect.addEventListener('change', () => {
        const periodo = filtroPeriodoModalSelect.value;
        const curso = filtroOrigemModalSelect.value;
        populateStudentDropdown(periodo, curso);
    });


    // Listener de Eventos para Envio de Presença
    submitPresencaButton.addEventListener('click', async () => {
        const alunoNome = alunoSelecionadoSelect.value;
        const dataPresenca = dataPresencaInput.value;
        const statusPresenca = document.querySelector('input[name="statusPresenca"]:checked')?.value;

        if (!alunoNome || !dataPresenca || !statusPresenca) {
            showFeedback('Por favor, preencha todos os campos de presença.', true);
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
                    nomeAluno: alunoNome,
                    data: dataPresenca,
                    status: statusPresenca
                }),
            });

            const result = await response.json();

            if (result.success) {
                showFeedback('Presença registrada com sucesso!');
                // Atualiza a tabela principal após o registro
                fetchAndDisplayStudents(nomeAlunoInput.value.trim(), filtroOrigemSelect.value, filtroPeriodoSelect.value); 
            } else {
                showFeedback(`Erro ao registrar presença: ${result.error || 'Desconhecido'}`, true);
            }
        } catch (error) {
            console.error('Erro ao enviar presença:', error);
            showFeedback('Erro de comunicação ao registrar presença.', true);
        }
    });

    // Listener de Eventos para Envio de Notas
    submitNotasButton.addEventListener('click', async () => {
        const alunoNome = alunoSelecionadoSelect.value;
        const nota1 = parseFloat(nota1Input.value);
        const nota2 = parseFloat(nota2Input.value);
        const nota3 = parseFloat(nota3Input.value);

        if (!alunoNome || (isNaN(nota1) && isNaN(nota2) && isNaN(nota3))) {
            showFeedback('Por favor, selecione um aluno e insira pelo menos uma nota válida.', true);
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
                    nomeAluno: alunoNome,
                    nota1: isNaN(nota1) ? null : nota1,
                    nota2: isNaN(nota2) ? null : nota2,
                    nota3: isNaN(nota3) ? null : nota3
                }),
            });

            const result = await response.json();

            if (result.success) {
                showFeedback('Notas atualizadas com sucesso!');
                // Atualiza a tabela principal após a atualização das notas
                fetchAndDisplayStudents(nomeAlunoInput.value.trim(), filtroOrigemSelect.value, filtroPeriodoSelect.value); 
            } else {
                showFeedback(`Erro ao atualizar notas: ${result.error || 'Desconhecido'}`, true);
            }
        } catch (error) {
            console.error('Erro ao enviar notas:', error);
            showFeedback('Erro de comunicação ao atualizar notas.', true);
        }
    });
});
