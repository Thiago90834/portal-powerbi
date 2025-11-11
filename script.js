// Função para abrir relatórios (inalterada)
function abrirRelatorio(titulo, url) {
  window.location.href = `relatorio.html?titulo=${encodeURIComponent(
    titulo
  )}&url=${encodeURIComponent(url)}`;
}

// NOVO: Função para abrir o relatório RCA com a URL específica do usuário
function abrirRCA(titulo) {
  // A URL foi salva no localStorage durante o login
  const url = localStorage.getItem("rcaUrl");

  if (url) {
    window.location.href = `relatorio.html?titulo=${encodeURIComponent(
      titulo
    )}&url=${encodeURIComponent(url)}`;
  } else {
    // Caso a URL não esteja no localStorage (o que não deve acontecer após um login bem-sucedido)
    alert(
      "Erro: URL do relatório RCA não encontrada para este usuário. Faça login novamente."
    );
  }
}

// =======================================================
// LÓGICA DE SESSÃO E LOGOUT
// =======================================================

function fazerLogout() {
  // 1. Limpa todas as chaves de sessão e credenciais salvas
  localStorage.removeItem("userProfile");
  localStorage.removeItem("loggedInUser");
  localStorage.removeItem("rcaUrl");

  // 2. Redireciona IMEDIATAMENTE para a página de login
  window.location.href = "index.html";
}

function toggleUserMenu() {
  const dropdown = document.getElementById("userDropdown");
  dropdown.classList.toggle("show");
}

// =======================================================
// NOVOS: LÓGICA DO NOVO HEADER (TEMA, DATA E CONTADORES)
// =======================================================

function updateDate() {
  const dateElement = document.getElementById("current-date");
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  dateElement.textContent = new Date().toLocaleDateString("pt-BR", options);
}

function updateHeaderInfo(loggedInUser) {
  // Preenche o nome do usuário no novo header
  const nomeUsuario = loggedInUser.split("@")[0];
  document.getElementById("usuario-logado").textContent = nomeUsuario; // Botão de sair
  document.getElementById("dropdown-email-menu").textContent = loggedInUser; // Dropdown de sair
  document.getElementById("welcome-username").textContent = nomeUsuario; // Mensagem de boas-vindas
}

/**
 * CORREÇÃO APLICADA AQUI: Garante que os contadores recebam os valores corretos.
 */
function updateCounters(relatoriosCount, favoritosCount) {
  // Corrigido: relatorios-count recebe o total de relatórios visíveis
  document.getElementById("relatorios-count").textContent = relatoriosCount;
  // Corrigido: favoritos-count recebe o total de favoritos
  document.getElementById("favoritos-count").textContent = favoritosCount;
}

function toggleTheme() {
  const body = document.body;
  const themeIcon = document.getElementById("theme-icon");

  // Implementação básica de dark mode (apenas trocando o ícone)
  if (body.classList.contains("dark-mode")) {
    body.classList.remove("dark-mode");
    themeIcon.classList.remove("fa-moon");
    themeIcon.classList.add("fa-sun");
    localStorage.setItem("theme", "light");
  } else {
    body.classList.add("dark-mode");
    themeIcon.classList.remove("fa-sun");
    themeIcon.classList.add("fa-moon");
    localStorage.setItem("theme", "dark");
  }
}

// =======================================================
// LÓGICA DE PERMISSÃO E FILTRAGEM (Verificação de sessão removida daqui)
// =======================================================

function filtrarRelatoriosPorPermissao() {
  const userProfile = localStorage.getItem("userProfile");
  const loggedInUser = localStorage.getItem("loggedInUser");

  // A verificação de sessão foi movida para o topo de portal.html

  // ATUALIZA O CABEÇALHO COM O NOME/EMAIL DO USUÁRIO
  updateHeaderInfo(loggedInUser);

  // LÓGICA DE FILTRAGEM DOS CARTÕES (Contagem)
  const cardsContainer = document.getElementById("aba-inicio");
  const cards = cardsContainer.querySelectorAll(".card");
  let visibleReportsCount = 0;

  cards.forEach((card) => {
    const perfisPermitidos = card.getAttribute("data-perfil").split(",");

    if (perfisPermitidos.includes(userProfile)) {
      // ATENÇÃO: Define como 'flex' para reexibir todos os permitidos
      card.style.display = "flex";
      visibleReportsCount++;
    } else {
      card.style.display = "none"; // Oculta o card se não permitido
    }
  });

  // Obtém contagem de favoritos e atualiza os contadores
  const storageKey = `favoritos_${loggedInUser}`;
  const favoritos = JSON.parse(localStorage.getItem(storageKey) || "[]");
  updateCounters(visibleReportsCount, favoritos.length); // Passa a contagem correta

  return visibleReportsCount; // Retorna a contagem de relatórios permitidos
}

/**
 * Função de pesquisa aprimorada para re-aplicar a permissão e o filtro.
 */
function filtrarRelatoriosPorNome() {
  // 1. Reexibe todos os cartões permitidos (necessário para "limpar" a pesquisa anterior)
  filtrarRelatoriosPorPermissao();

  const termo = document
    .getElementById("report-search")
    .value.toLowerCase()
    .trim();
  const abaInicio = document.getElementById("aba-inicio");
  const cards = abaInicio.querySelectorAll(".card");

  if (termo === "") {
    // Se o termo for vazio, a chamada a filtrarRelatoriosPorPermissao() acima já resolveu.
    return;
  }

  // 2. Aplica o filtro de nome SÓ nos cartões que já estão visíveis (permitidos)
  cards.forEach((card) => {
    // Se o cartão já foi escondido por permissão, não mexemos nele
    if (card.style.display === "none") {
      return;
    }

    const nomeRelatorio = card
      .getAttribute("data-nome-relatorio")
      .toLowerCase();

    if (!nomeRelatorio.includes(termo)) {
      card.style.display = "none"; // Esconde se não corresponder à pesquisa
    }
  });
}

// =======================================================
// LÓGICA DE NAVEGAÇÃO ENTRE ABAS E FAVORITOS
// =======================================================

/**
 * Alterna a aba ativa (Relatórios/Favoritos) e a classe 'active' dos itens de navegação.
 * @param {string} aba - 'inicio' ou 'favoritos'.
 * @param {HTMLElement | null} clickedElement - O elemento de navegação lateral que foi clicado. É null se a chamada vier do header.
 */
function mostrarAba(aba, clickedElement) {
  // 1. Alterna a visibilidade das seções
  document.getElementById("relatorios-acordeon").style.display =
    aba === "inicio" ? "block" : "none";

  document.getElementById("aba-favoritos").style.display =
    aba === "favoritos" ? "flex" : "none";

  // 2. SINCRONIZA NAVEGAÇÃO LATERAL (SIDEBAR)
  const sidebarNavLinks = document.querySelectorAll(".sidebar nav a");
  sidebarNavLinks.forEach((link) => {
    link.classList.remove("active");
  });

  // Se clickedElement é nulo, a chamada veio do header. Caso contrário, veio da sidebar.
  if (clickedElement) {
    // Se a chamada veio da sidebar, ativamos o item clicado
    clickedElement.classList.add("active");
  } else {
    // Se veio do header, ativamos o item correspondente da sidebar
    const defaultLink = document.querySelector(
      `.sidebar nav a[onclick*="mostrarAba('${aba}')"]`
    );
    if (defaultLink) defaultLink.classList.add("active");
  }

  // 3. SINCRONIZA NAVEGAÇÃO HORIZONTAL (HEADER)
  const headerRelatorios = document.getElementById("nav-relatorios");
  const headerFavoritos = document.getElementById("nav-favoritos");

  // Remove 'active' de ambos os botões de contador
  headerRelatorios.classList.remove("active");
  headerFavoritos.classList.remove("active");

  // Adiciona 'active' ao botão correto
  if (aba === "inicio") {
    headerRelatorios.classList.add("active");
  } else if (aba === "favoritos") {
    headerFavoritos.classList.add("active");
  }

  // 4. Carrega Favoritos ou re-aplica filtro
  if (aba === "favoritos") {
    carregarFavoritos();
  } else {
    // Garante que o acordeão de relatórios esteja expandido ao voltar para a aba
    const relatoriosAcordeon = document.getElementById("relatorios-acordeon");
    if (relatoriosAcordeon) {
      relatoriosAcordeon.classList.add("expanded");
      relatoriosAcordeon
        .querySelector(".acordeon-content")
        .classList.add("show");
    }
  }

  // 5. Limpa o termo de pesquisa ao mudar de aba
  document.getElementById("report-search").value = "";
  // Se mudar para a aba 'inicio', garante que todos os permitidos estejam visíveis
  if (aba === "inicio") {
    filtrarRelatoriosPorPermissao();
  }
}

/**
 * Correção: Remove apenas os cards dinâmicos (corrigindo o sumiço) e
 * a imagem do card é ajustada para ser igual ao da aba "Relatórios".
 */
function carregarFavoritos() {
  const container = document.getElementById("aba-favoritos");
  const semFav = document.getElementById("sem-favoritos");
  const loggedInUser = localStorage.getItem("loggedInUser");
  const storageKey = `favoritos_${loggedInUser}`;
  const favoritos = JSON.parse(localStorage.getItem(storageKey) || "[]");

  // CORREÇÃO: Remove APENAS os cards gerados dinamicamente para manter o #sem-favoritos no DOM
  container.querySelectorAll(".card").forEach((card) => card.remove());

  // Pega a contagem de relatórios ATUALMENTE exibida no cabeçalho
  const relatoriosCount = parseInt(
    document.getElementById("relatorios-count").textContent || "0"
  );

  // Atualiza os contadores
  updateCounters(relatoriosCount, favoritos.length);

  if (favoritos.length === 0) {
    // Se não houver favoritos, exibe a mensagem e para
    semFav.style.display = "block";
    return;
  }

  // Se houver favoritos, esconde a mensagem
  semFav.style.display = "none";

  favoritos.forEach((fav) => {
    const div = document.createElement("div");
    div.className = "card card-powerbi";
    div.innerHTML = `
      <img
        src="https://www.doutoresdoexcel.com.br/wp-content/uploads/2017/02/social-default-image.png"
        alt="Ícone Power BI"
      >
      <h3 class="card-title">${fav.titulo}</h3>
    `;
    div.onclick = () => abrirRelatorio(fav.titulo, fav.url);
    container.appendChild(div);
  });
}

// LÓGICA DO MENU EXPANSÍVEL/COMPACTO (Inalterada)
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const content = document.getElementById("main-content");

  sidebar.classList.toggle("compact");
  content.classList.toggle("compact-margin");

  const texts = document.querySelectorAll(".sidebar-text");
  texts.forEach((text) => {
    text.style.display = sidebar.classList.contains("compact")
      ? "none"
      : "inline";
  });
}

// LÓGICA DO ACORDEÃO (EXPANDIR/RECOLHER SEÇÃO) (Inalterada)
function toggleAcordeon(id) {
  const section = document.getElementById(id);
  const content = section.querySelector(".acordeon-content");
  const isExpanded = section.classList.contains("expanded");

  if (isExpanded) {
    section.classList.remove("expanded");
    content.classList.remove("show");
  } else {
    section.classList.add("expanded");
    content.classList.add("show");
  }
}

// =======================================================
// INICIALIZAÇÃO: Garantir que o portal comece corretamente
// =======================================================

window.onload = function () {
  filtrarRelatoriosPorPermissao();
  updateDate();

  // Aplica o tema salvo (se houver)
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    document.getElementById("theme-icon").classList.remove("fa-sun");
    document.getElementById("theme-icon").classList.add("fa-moon");
  }

  // Configura a aba inicial como "Início" e a sincroniza
  mostrarAba("inicio");

  // Acordeão deve iniciar aberto
  const relatoriosAcordeon = document.getElementById("relatorios-acordeon");
  if (relatoriosAcordeon) {
    relatoriosAcordeon.classList.add("expanded");
    relatoriosAcordeon.querySelector(".acordeon-content").classList.add("show");
  }
};
