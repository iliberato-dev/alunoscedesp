// const API_URL = 'https://script.google.com/macros/s/AKfycbxXInG7aYeUvRYyfHmAKUmN4nfO5gsZ5bUgoYWqzi72CCDV7EkEHL50FV1YCW7vKh8r/exec';
document.addEventListener('DOMContentLoaded', () => {
    // ATENÇÃO: SUBSTITUA ESTA URL PELA SUA URL DE IMPLANTAÇÃO MAIS RECENTE DO APPS SCRIPT
    const API_URL = 'https://script.google.com/macros/s/AKfycbzNq3Hz1Pvlx3Ty4YGJvj0UM4jQNe2adOEQWyomzpTnBHooEzgHa1TGMWfcd8mpzTDe/exec'; 

    const nomeAlunoInput = document.getElementById('nomeAluno');
    const filtroOrigemSelect = document.getElementById('filtroOrigem');
    const filtroPeriodoSelect = document.getElementById('filtroPeriodo'); // Obter o elemento do filtro de período
    const searchButton = document.getElementById('searchButton');
    const clearSearchButton = document.getElementById('clearSearchButton');
    const showAllButton = document.getElementById('showAllButton');
    const alunosTableBody = document.querySelector('#alunosTable tbody');
    const noResultsMessage = document.getElementById('noResults');

    let abortController = null;
    let debounceTimer;

    async function fetchAndDisplayStudents(searchTerm = '', originFilter = '', periodFilter = '') { // Adicionado periodFilter
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
        if (periodFilter) { // Adiciona o parâmetro período à URL
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

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido.' }));
                throw new Error(`Erro HTTP! Status: ${response.status}. Detalhes: ${errorData.error || 'N/A'}`);
            }
            
            const data = await response.json();
            
            let studentsToShow = [];
            if (data.saida) {
                studentsToShow = data.saida;
            } else if (data.retornoDaSaida) {
                studentsToShow = data.retornoDaSaida;
            } else if (data.error) {
                console.error('Erro retornado pela API:', data.error);
                alunosTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Erro da API: ${data.error}</td></tr>`;
                return;
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

                row.insertCell().setAttribute('data-label', 'Nota 1º Bimestre'); // Atualizado o label
                row.cells[2].textContent = student.Nota1 !== undefined ? student.Nota1 : 'N/A';

                row.insertCell().setAttribute('data-label', 'Nota 2º Bimestre'); // Atualizado o label
                row.cells[3].textContent = student.Nota2 !== undefined ? student.Nota2 : 'N/A';

                row.insertCell().setAttribute('data-label', 'Nota 3º Bimestre'); // Atualizado o label
                row.cells[4].textContent = student.Nota3 !== undefined ? student.Nota3 : 'N/A';

                row.insertCell().setAttribute('data-label', 'Média');
                // Formata a média para 1 casa decimal
                if (typeof student.Media === 'number' && !isNaN(student.Media)) {
                    row.cells[5].textContent = student.Media.toFixed(1); 
                } else {
                    row.cells[5].textContent = 'N/A'; 
                }

                row.insertCell().setAttribute('data-label', 'Situação');
                row.cells[6].textContent = student.Situacao || 'N/A';

                row.insertCell().setAttribute('data-label', 'Origem'); // Mantém 'Origem' para corresponder à API
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
            const periodFilter = filtroPeriodoSelect.value; // Obter valor do filtro de período
            fetchAndDisplayStudents(searchTerm, originFilter, periodFilter); // Passar periodFilter
        }, 300);
    };

    nomeAlunoInput.addEventListener('input', triggerSearch);
    filtroOrigemSelect.addEventListener('change', triggerSearch);
    filtroPeriodoSelect.addEventListener('change', triggerSearch); // Adicionar listener para o novo filtro

    searchButton.addEventListener('click', () => {
        clearTimeout(debounceTimer);
        const searchTerm = nomeAlunoInput.value.trim();
        const originFilter = filtroOrigemSelect.value;
        const periodFilter = filtroPeriodoSelect.value; // Obter valor do filtro de período
        fetchAndDisplayStudents(searchTerm, originFilter, periodFilter); // Passar periodFilter
    });

    clearSearchButton.addEventListener('click', () => {
        clearTimeout(debounceTimer);
        nomeAlunoInput.value = '';
        filtroOrigemSelect.value = '';
        filtroPeriodoSelect.value = ''; // Limpar o filtro de período
        fetchAndDisplayStudents('', '', ''); // Resetar todos os filtros
        nomeAlunoInput.focus();
    });

    showAllButton.addEventListener('click', () => {
        clearTimeout(debounceTimer);
        nomeAlunoInput.value = '';
        filtroOrigemSelect.value = '';
        filtroPeriodoSelect.value = ''; // Limpar o filtro de período
        fetchAndDisplayStudents('', '', ''); // Resetar todos os filtros
        nomeAlunoInput.focus();
    });

    fetchAndDisplayStudents(); // Carrega os dados na inicialização
});
