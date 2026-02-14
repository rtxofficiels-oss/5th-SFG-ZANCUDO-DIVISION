// --- CONFIGURATION & ETAT ---
let activeOps = [];
let archives = { hexa: [], res: [], abs: [], rap: [], comms: [] };
let currentUser = "";
let allUsersStatus = {};

const membresAutorises = {
    "november": "a", "alaska": "sf5th", "alabama": "pass1", "rhode": "5thSFG-Rhode06",
    "vermont": "Alpha-03vermont", "mississippi": "mississippitrofor", "montana": "pass4",
    "nevada": "5th-bravo03-SFG", "kentucky": "pass6", "iowa": "Charlie-19-s-f-g",
    "colorado": "Coloracoon11&7", "idaho": "pass9", "arizona": "pass10",
    "oregon": "pass11", "utha": "pass12", "maine": "pass13", "indiana": "pass14"
};

// --- SYNCHRONISATION CLOUD (Appelé par Firebase dans le HTML) ---
window.refreshUIdisplay = function(data) {
    if (!data) return;
    console.log("Mise à jour des données reçue...");

    if (data.users) allUsersStatus = data.users;
    if (data.global) {
        archives = data.global.archives || { hexa: [], res: [], abs: [], rap: [], comms: [] };
        activeOps = data.global.activeOps || [];
    }

    // Si on est connecté, on rafraîchit la vue
    if (currentUser !== "") {
        updateConnUI();
        updateOpsUI();
        
        // Rafraîchir l'onglet actif
        const activeTab = document.querySelector('.content-section.active');
        if (activeTab && activeTab.id === 'comms') displayComms();
    }
};

function persist() {
    if (typeof window.updateGlobalData === 'function') {
        window.updateGlobalData({ archives, activeOps });
    }
}

// --- SYSTEME DE CONNEXION ---
window.handleLoginKey = function(e) { 
    if(e.key === "Enter") window.accessGranted(); 
};

window.accessGranted = function() {
    let u = document.getElementById('user').value.toLowerCase();
    let p = document.getElementById('pass').value;
    
    if (membresAutorises[u] === p) {
        currentUser = u;
        if (window.updateStatus) window.updateStatus(u, 'online');
        
        document.getElementById('display-user').textContent = u.toUpperCase();
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        
        // Setup menus
        const noms = Object.keys(membresAutorises).sort();
        const opt = noms.map(m => `<option value="${m}">${m.toUpperCase()}</option>`).join('');
        document.getElementById('comms-dest').innerHTML = opt;
        document.getElementById('lead-op').innerHTML = opt;
        
        updateConnUI();
        setInterval(() => {
            const clock = document.getElementById('system-clock');
            if(clock) clock.textContent = "SYSTEM_TIME: " + new Date().toLocaleString();
        }, 1000);
    } else { 
        alert("ACCÈS REFUSÉ : IDENTIFIANTS INVALIDES"); 
    }
};

window.logout = function() {
    if(currentUser && window.updateStatus) window.updateStatus(currentUser, 'offline');
    location.reload();
};

// --- MISE À JOUR VISUELLE DES CONNEXIONS ---
function updateConnUI() {
    const list = document.getElementById('conn-list');
    if (!list) return;
    
    list.innerHTML = Object.keys(membresAutorises).sort().map(u => {
        const online = allUsersStatus[u] && allUsersStatus[u].status === 'online';
        const color = online ? '#00ff00' : '#ff4444';
        const status = online ? '● EN LIGNE' : '○ HORS LIGNE';
        return `<tr>
            <td style="color:#00d4ff; font-weight:bold;">${u.toUpperCase()}</td>
            <td style="color:${color}; font-weight:bold;">${status}</td>
            <td style="color:#666; font-size:0.8rem;">SATELLITE SCAN...</td>
        </tr>`;
    }).join('');
}

// --- NAVIGATION ---
window.showTab = function(tabId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    if(tabId === 'connexions') updateConnUI();
    if(tabId === 'comms') displayComms();
};

// --- AUTRES FONCTIONS (STUBS) ---
window.toggleCommsSub = (m) => {
    document.getElementById('comms-form').style.display = m === 'saisie' ? 'block' : 'none';
    document.getElementById('comms-archive-list').style.display = m === 'archive' ? 'block' : 'none';
};
window.toggleSub = (type, m) => {
    document.getElementById(type + '-form').style.display = m === 'saisie' ? 'block' : 'none';
    document.getElementById(type + '-archive-list').style.display = m === 'archive' ? 'block' : 'none';
};
function updateOpsUI() {
    const count = document.getElementById('widget-count');
    if(count) count.textContent = activeOps.length;
}
function displayComms() { /* Code pour afficher les messages */ }
