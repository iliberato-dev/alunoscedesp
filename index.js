    // const API_URL = 'https://script.google.com/macros/s/AKfycbycvvhn9PiFct9F1L-2K4aK9b0vAHtJLpTCm5z2D_ZY2qljmCJlaiUjfXLPqro6GCHP/exec'; 
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'https://script.google.com/macros/s/AKfycbycvvhn9PiFct9F1L-2K4aK9b0vAHtJLpTCm5z2D_ZY2qljmCJlaiUjfXLPqro6GCHP/exec'; 

    const nomeAlunoInput = document.getElementById('nomeAluno');
    const searchButton = document.getElementById('searchButton');
    const clearSearchButton = document.getElementById('clearSearchButton');
    const showAllButton = document.getElementById('showAllButton');
    const alunosTableBody = document.querySelector('#alunosTable tbody');
    const noResultsMessage = document.getElementById('noResults');

    let abortController = null; // Variável para controlar o cancelamento de requisições
    let debounceTimer; // Variável para controlar o debounce

    // Função para buscar e exibir os dados
    async function fetchAndDisplayStudents(searchTerm = '') {
        // Se houver uma requisição anterior em andamento, cancele-a
        if (abortController) {
            abortController.abort();
            console.log('Requisição anterior cancelada.');
        }
        abortController = new AbortController(); // Cria um novo AbortController para a nova requisição
        const signal = abortController.signal; // Pega o sinal para passar para o fetch

        alunosTableBody.innerHTML = ''; // Limpa a tabela antes de cada nova busca
        noResultsMessage.classList.add('hidden'); 

        let url = API_URL;
        if (searchTerm) {
            url += `?nomeAluno=${encodeURIComponent(searchTerm)}`;
        }

        try {
            // Passa o sinal do AbortController para a requisição fetch
            const response = await fetch(url, { signal }); 
            
            // Verifica se a requisição foi cancelada antes de processar
            if (signal.aborted) {
                console.log('Requisição abortada pelo usuário (nova busca iniciada).');
                return; // Sai da função se a requisição foi abortada
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
                // Adicione o atributo data-label para cada célula (td)
                row.insertCell().setAttribute('data-label', 'Nome');
                row.cells[0].textContent = student.Nome || 'N/A';

                row.insertCell().setAttribute('data-label', 'Faltas');
                row.cells[1].textContent = student.Faltas !== undefined ? student.Faltas : 'N/A';

                row.insertCell().setAttribute('data-label', 'Nota 1');
                row.cells[2].textContent = student.Nota1 !== undefined ? student.Nota1 : 'N/A';

                row.insertCell().setAttribute('data-label', 'Nota 2');
                row.cells[3].setAttribute('data-label', 'Nota 2');
                row.cells[3].textContent = student.Nota2 !== undefined ? student.Nota2 : 'N/A';

                row.insertCell().setAttribute('data-label', 'Nota 3');
                row.cells[4].textContent = student.Nota3 !== undefined ? student.Nota3 : 'N/A';

                row.insertCell().setAttribute('data-label', 'Média');
                row.cells[5].textContent = student.Media !== undefined ? student.Media : 'N/A';

                row.insertCell().setAttribute('data-label', 'Situação');
                row.cells[6].textContent = student.Situacao || 'N/A';

                row.insertCell().setAttribute('data-label', 'Origem');
                row.cells[7].textContent = student.Origem || 'N/A';
            });

        } catch (error) {
            // Ignora o erro se foi uma requisição abortada intencionalmente
            if (error.name === 'AbortError') {
                console.log('Fetch abortado:', error.message);
                return;
            }
            console.error('Erro ao buscar dados:', error);
            alunosTableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: red;">Erro ao carregar os dados. Verifique a URL da API e a conexão. Detalhes: ${error.message || error}</td></tr>`;
        } finally {
            abortController = null; // Limpa o controller após a requisição (bem-sucedida ou com erro não-abort)
        }
    }

    // --- Mudança Principal: Evento 'input' com Debounce e AbortController ---
    nomeAlunoInput.addEventListener('input', () => {
        clearTimeout(debounceTimer); // Limpa o timer anterior (reseta a contagem)
        debounceTimer = setTimeout(() => { // Define um novo timer
            const searchTerm = nomeAlunoInput.value.trim();
            fetchAndDisplayStudents(searchTerm);
        }, 300); // Espera 300 milissegundos depois que o usuário para de digitar
    });

    // Os botões de busca e limpar ainda podem ser úteis
    searchButton.addEventListener('click', () => {
        clearTimeout(debounceTimer); // Garante que nenhum debounce esteja pendente
        const searchTerm = nomeAlunoInput.value.trim();
        fetchAndDisplayStudents(searchTerm);
    });

    clearSearchButton.addEventListener('click', () => {
        clearTimeout(debounceTimer); // Garante que nenhum debounce esteja pendente
        nomeAlunoInput.value = ''; 
        fetchAndDisplayStudents('');
        nomeAlunoInput.focus();
    });

    showAllButton.addEventListener('click', () => {
        clearTimeout(debounceTimer); // Garante que nenhum debounce esteja pendente
        nomeAlunoInput.value = ''; 
        fetchAndDisplayStudents('');
        nomeAlunoInput.focus();
    });

    // Carrega todos os alunos ao iniciar a página (com busca vazia)
    fetchAndDisplayStudents();
});