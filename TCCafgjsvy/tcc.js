// --- CONFIGURAÇÃO E CONEXÃO COM O SUPABASE ---
const SUPABASE_URL = 'https://zlsclkcggaotdeckvueg.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpsc2Nsa2NnZ2FvdGRlY2t2dWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMzNTY3NjgsImV4cCI6MjA5ODkzMjc2OH0.hOaTpzY9aiPd8QJnii373Ih6n5k19H20MYAQfwDVGVE';

// Inicializa a ligação oficial ao teu backend (MUDAMOS O NOME AQUI PARA NÃO DAR CONFLITO)
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Variáveis de controlo da sessão atual
let currentUser = "";
let currentRole = "";
let currentCity = "";
let allLoadedCities = [];

document.addEventListener("DOMContentLoaded", () => {
    loadStates();
    document.getElementById('chat-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendChatMessage();
    });
});

// --- API IBGE (CARREGAR ESTADOS E CIDADES) ---
async function loadStates() {
    const stateSelect = document.getElementById("login-uf");
    try {
        const response = await fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome");
        const states = await response.json();
        states.forEach(state => {
            const option = document.createElement("option");
            option.value = state.sigla;
            option.textContent = `${state.nome} - ${state.sigla}`;
            stateSelect.appendChild(option);
        });
    } catch (error) { console.error(error); }
}

async function loadCities(uf) {
    const citySelect = document.getElementById("login-city");
    const searchInput = document.getElementById("search-city-input");
    
    citySelect.innerHTML = '<option value="">-- Carregando municípios... --</option>';
    citySelect.disabled = true; searchInput.disabled = true; searchInput.value = "";

    if (!uf) { citySelect.innerHTML = '<option value="">-- Selecione primeiro o Estado --</option>'; return; }

    try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`);
        allLoadedCities = await response.json();
        renderCityOptions(allLoadedCities, uf);
        citySelect.disabled = false; searchInput.disabled = false;
    } catch (error) { citySelect.innerHTML = '<option value="">Erro ao carregar municípios</option>'; }
}

function renderCityOptions(citiesList, uf) {
    const citySelect = document.getElementById("login-city");
    citySelect.innerHTML = '<option value="">-- Escolha uma cidade --</option>';
    citiesList.forEach(city => {
        const option = document.createElement("option");
        option.value = `${city.nome} - ${uf}`;
        option.textContent = `${city.nome} - ${uf}`;
        citySelect.appendChild(option);
    });
}

function filterCities() {
    const query = document.getElementById("search-city-input").value.toLowerCase().trim();
    const currentUf = document.getElementById("login-uf").value;
    const filtered = allLoadedCities.filter(city => 
        city.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(query.normalize("NFD").replace(/[\u0300-\u036f]/g, ""))
    );
    renderCityOptions(filtered, currentUf);
}

// --- CONTROLO DE ECRÃS ---
function showRegisterScreen() {
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('register-screen').classList.remove('hidden');
}

function showLoginScreen() {
    document.getElementById('register-screen').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}

// --- AUTENTICAÇÃO COM BACKEND (SUPABASE) ---
async function handleRegister() {
    const user = document.getElementById('reg-user').value.trim();
    const password = document.getElementById('reg-password').value;

    if (!user || !password) return alert("Preencha todos os campos.");
    if (password.length < 5) return alert("Senha mínima 5 caracteres.");

    // Verifica na nuvem se o usuário já existe
    const { data: existingUser, error: checkError } = await supabaseClient
        .from('usuarios')
        .select('username')
        .eq('username', user)
        .maybeSingle();

    if (checkError) return alert("Erro ao verificar utilizador.");
    if (existingUser) return alert("Nome de usuário já indisponível.");

    // Grava o novo usuário na tabela do Supabase
    const { error: insertError } = await supabaseClient
        .from('usuarios')
        .insert([{ username: user, password: password, role: "user" }]);

    if (insertError) return alert("Erro ao criar conta: " + insertError.message);

    alert("Cadastro concluído com sucesso na nuvem! Faça seu login.");
    showLoginScreen();
    document.getElementById('reg-user').value = "";
    document.getElementById('reg-password').value = "";
}

async function handleLogin() {
    const citySelect = document.getElementById('login-city');
    const userInput = document.getElementById('login-user').value.trim();
    const passwordInput = document.getElementById('login-password').value;

    if (!citySelect.value) return alert("Selecione sua localização.");

    let userFound = null;

    if (userInput.toLowerCase() === 'admin' && passwordInput === 'admin') {
        const cityName = citySelect.value.split('-')[0].trim();
        userFound = { 
            username: "Gestor " + cityName, 
            role: "admin" 
        };
    } else {
        const { data, error } = await supabaseClient
            .from('usuarios')
            .select('*')
            .eq('username', userInput)
            .eq('password', passwordInput)
            .maybeSingle();

        if (error) return alert("Erro ao conectar ao servidor: " + error.message);
        userFound = data;
    }

    if (userFound) {
        currentUser = userFound.username;
        currentRole = userFound.role || "user"; 
        currentCity = citySelect.value;
        
        let displayBadge = currentRole === 'admin' ? '<span class="admin-badge">ADMIN</span>' : '';
        document.getElementById('user-display-info').innerHTML = `👤 ${currentUser} ${displayBadge} (${currentCity})`;
        document.getElementById('chat-city-title').innerText = currentCity;
        document.getElementById('stats-city-title').innerText = currentCity;
        
        setupRoleUI(); 

        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-app').classList.remove('hidden');

        document.getElementById('search-chat').value = "";
        document.getElementById('search-ideas').value = "";
        
        loadChat();
        loadSuggestions();
        loadCityData(); 
        loadSupportTickets();
    } else {
        alert("Credenciais incorretas.");
    }
}

function handleLogout() {
    currentUser = ""; currentRole = ""; currentCity = "";
    document.getElementById('login-user').value = ""; document.getElementById('login-password').value = "";
    
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('tab-debates').classList.remove('hidden');
    document.querySelector('.tab-btn').classList.add('active');
    
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('login-screen').classList.remove('hidden');
}

function setupRoleUI() {
    const adminDataBox = document.getElementById('admin-data-box');
    const userSupportSection = document.getElementById('user-support-section');
    const supportListTitle = document.getElementById('support-list-title');

    if (currentRole === 'admin') {
        adminDataBox.style.display = 'block'; 
        userSupportSection.style.display = 'none'; 
        supportListTitle.innerText = `Dúvidas Pendentes em ${currentCity}:`;
    } else {
        adminDataBox.style.display = 'none'; 
        userSupportSection.style.display = 'block'; 
        supportListTitle.innerText = "Meus Relatos:";
    }
}

function switchTab(tabId, buttonElement) {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.remove('hidden');
    buttonElement.classList.add('active');
}

// --- FÓRUM / CHAT (SUPABASE) ---
function filterChat() {
    const term = document.getElementById('search-chat').value.toLowerCase();
    loadChat(term);
}

async function loadChat(filterTerm = "") {
    const chatBox = document.getElementById('chat-messages');
    chatBox.innerHTML = "<p style='color: #777; font-size: 13px;'>Buscando mensagens em tempo real...</p>";

    let query = supabaseClient
        .from('chat_messages')
        .select('*')
        .eq('city', currentCity)
        .order('created_at', { ascending: true });

    if (filterTerm !== "") {
        query = query.ilike('text', `%${filterTerm}%`);
    }

    const { data: messages, error } = await query;
    if (error) return console.error("Erro ao carregar chat:", error);

    chatBox.innerHTML = "";
    messages.forEach(msg => {
        const newMessage = document.createElement('div');
        let senderName = msg.sender === currentUser ? "Você" : msg.sender;
        let badge = msg.sender.includes("Gestor") ? '<span class="admin-badge">Admin</span>' : '';
        
        newMessage.className = msg.sender === currentUser ? "message sent" : "message received";
        newMessage.innerHTML = `<strong>${senderName} ${badge}:</strong> ${msg.text}`;
        chatBox.appendChild(newMessage);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
}

async function sendChatMessage() {
    const input = document.getElementById('chat-input');
    if (input.value.trim() === "") return;

    const { error } = await supabaseClient
        .from('chat_messages')
        .insert([{ sender: currentUser, text: input.value.trim(), city: currentCity }]);

    if (error) return alert("Erro ao enviar mensagem: " + error.message);
    
    input.value = "";
    filterChat();
}

// --- BANCO DE IDEIAS (SUPABASE) ---
function filterIdeas() {
    const term = document.getElementById('search-ideas').value.toLowerCase();
    loadSuggestions(term);
}

async function loadSuggestions(filterTerm = "") {
    const list = document.getElementById('suggestions-list');
    list.innerHTML = "<p style='color: #777; font-size:13px;'>Carregando propostas...</p>";
    
    let query = supabaseClient
        .from('suggestions')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (filterTerm !== "") {
        query = query.or(`title.ilike.%${filterTerm}%,text.ilike.%${filterTerm}%`);
    }
    
    const { data: ideas, error } = await query;
    if (error) return console.error(error);

    list.innerHTML = "";
    ideas.forEach(sug => {
        const li = document.createElement('li');
        let badge = sug.sender.includes("Gestor") ? '<span class="admin-badge">Admin</span>' : '';
        li.innerHTML = `<strong>[${sug.title}]</strong> ${sug.text} <div style="font-size:11px; color:#546e7a; margin-top:5px;">Por ${sug.sender} ${badge}</div>`;
        list.appendChild(li);
    });
}

async function submitSuggestion() {
    const title = document.getElementById('sug-title').value.trim();
    const text = document.getElementById('sug-text').value.trim();
    if (!title || !text) return alert("Preencha todos os campos.");

    const { error } = await supabaseClient
        .from('suggestions')
        .insert([{ title: title, text: text, sender: currentUser }]);

    if (error) return alert("Erro ao salvar ideia: " + error.message);

    document.getElementById('sug-title').value = ""; 
    document.getElementById('sug-text').value = "";
    filterIdeas();
}

// --- SUPORTE TÉCNICO / CHAMADOS (SUPABASE) ---
async function submitSupportQuestion() {
    const desc = document.getElementById('prob-desc').value.trim();
    if (desc === "") return alert("Descreva o problema.");
    
    const { error } = await supabaseClient
        .from('support_tickets')
        .insert([{
            usuario: currentUser,
            city: currentCity,
            question: desc,
            answer: null,
            date_str: new Date().toLocaleDateString()
        }]);

    if (error) return alert("Erro ao abrir chamado: " + error.message);
    
    document.getElementById('prob-desc').value = "";
    loadSupportTickets();
    alert("Seu chamado foi enviado para a nuvem! Acompanhe a resposta nesta mesma aba.");
}

async function loadSupportTickets() {
    const list = document.getElementById('support-tickets-list');
    list.innerHTML = "<p style='color: #777; font-size:13px;'>Buscando chamados...</p>";

    let query = supabaseClient.from('support_tickets').select('*').eq('city', currentCity);

    if (currentRole !== 'admin') {
        query = query.eq('usuario', currentUser);
    }

    const { data: tickets, error } = await query;
    if (error) return console.error(error);

    list.innerHTML = "";

    if (tickets.length === 0) {
        list.innerHTML = "<p style='color:#777; font-size:14px;'>Nenhum registro encontrado para esta região.</p>";
        return;
    }

    tickets.sort((a, b) => b.id - a.id);

    tickets.forEach(t => {
        const isAnswered = t.answer !== null;
        const card = document.createElement('div');
        card.className = `ticket-card ${isAnswered ? 'answered' : ''}`;
        
        let htmlContent = `
            <div class="ticket-header">
                <span><strong>Autor:</strong> ${t.usuario}</span>
                <span>${t.date_str}</span>
            </div>
            <div class="ticket-question">${t.question}</div>
        `;

        if (isAnswered) {
            htmlContent += `<div class="ticket-answer-box"><strong>Resposta Técnica:</strong> ${t.answer}</div>`;
        } else if (currentRole === 'admin') {
            htmlContent += `
                <div class="admin-reply-area">
                    <input type="text" id="reply-${t.id}" placeholder="Escreva a resposta técnica...">
                    <button onclick="answerTicket(${t.id})">Responder</button>
                </div>
            `;
        } else {
            htmlContent += `<div style="font-size:12px; color:#ffb300; font-weight:bold;">⏳ Aguardando análise da engenharia...</div>`;
        }

        card.innerHTML = htmlContent;
        list.appendChild(card);
    });
}

async function answerTicket(ticketId) {
    const replyInput = document.getElementById(`reply-${ticketId}`);
    if (replyInput.value.trim() === "") return alert("Digite uma resposta.");

    const { error } = await supabaseClient
        .from('support_tickets')
        .update({ answer: replyInput.value.trim() })
        .eq('id', ticketId);

    if (error) return alert("Erro ao salvar resposta: " + error.message);
    loadSupportTickets();
}

// --- INDICADORES E DADOS LOCAIS (SUPABASE) ---
async function loadCityData() {
    const { data: currentData, error } = await supabaseClient
        .from('city_data')
        .select('*')
        .eq('city', currentCity)
        .maybeSingle();

    if (error) return console.error(error);

    if (currentData && currentData.registrado) {
        document.getElementById('label-agua').innerText = currentData.agua + "%";
        document.getElementById('bar-agua').style.width = currentData.agua + "%";
        document.getElementById('label-esgoto').innerText = currentData.esgoto + "%";
        document.getElementById('bar-esgoto').style.width = currentData.esgoto + "%";
        document.getElementById('text-informativo').innerHTML = currentData.informativo;
        
        if (currentRole === 'admin') {
            document.getElementById('input-agua').value = currentData.agua;
            document.getElementById('input-esgoto').value = currentData.esgoto;
            document.getElementById('input-informativo').value = currentData.informativo;
        }
    } else {
        document.getElementById('label-agua').innerText = "Não informado";
        document.getElementById('bar-agua').style.width = "0%";
        document.getElementById('label-esgoto').innerText = "Não informado";
        document.getElementById('bar-esgoto').style.width = "0%";
        document.getElementById('text-informativo').innerText = "Nenhum informativo registrado para esta cidade ainda.";
        
        if (currentRole === 'admin') {
            document.getElementById('input-agua').value = "";
            document.getElementById('input-esgoto').value = "";
            document.getElementById('input-informativo').value = "";
        }
    }
}

async function saveLocalData() {
    if (currentRole !== 'admin') return;

    const aguaValue = parseInt(document.getElementById('input-agua').value);
    const esgotoValue = parseInt(document.getElementById('input-esgoto').value);
    const infoText = document.getElementById('input-informativo').value.trim();

    if (isNaN(aguaValue) || aguaValue < 0 || aguaValue > 100 || isNaN(esgotoValue) || esgotoValue < 0 || esgotoValue > 100) {
        return alert("Insira valores de porcentagem entre 0% e 100%.");
    }
    if (infoText === "") return alert("Preencha o campo do informativo técnico.");

    const { error } = await supabaseClient
        .from('city_data')
        .upsert({ 
            city: currentCity, 
            agua: aguaValue, 
            esgoto: esgotoValue, 
            informativo: infoText, 
            registrado: true 
        }, { onConflict: 'city' });

    if (error) return alert("Erro ao salvar dados ambientais: " + error.message);
    
    alert("Dados ambientais de " + currentCity + " salvos com sucesso na nuvem!");
    loadCityData(); 
}