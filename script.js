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

window.onload = () => {
    setInterval(updateClock, 1000);
    setInterval(updateConnUI, 10000); 
};

window.refreshUIdisplay = function(data) {
    if (!data) return;
    if (data.users) { allUsersStatus = data.users; updateConnUI(); }
    if (data.global) {
        archives = data.global.archives || { hexa: [], res: [], abs: [], rap: [], comms: [] };
        activeOps = data.global.activeOps || [];
        updateOpsUI();
        if(document.getElementById('comms').classList.contains('active')) displayComms();
    }
};

function persist() {
    if (typeof window.updateGlobalData === 'function') {
        window.updateGlobalData({ archives, activeOps });
    }
}

function updateClock() {
    const now = new Date();
    const clockEl = document.getElementById('system-clock');
    if(clockEl) clockEl.textContent = "SYSTEM_TIME: " + now.toLocaleString();
}

window.handleLoginKey = function(e) { if(e.key === "Enter") accessGranted(); };

window.accessGranted = function() {
    let u = document.getElementById('user').value.toLowerCase();
    let p = document.getElementById('pass').value;
    if (membresAutorises[u] === p) {
        currentUser = u;
        if (window.updateStatus) window.updateStatus(u, 'online');
        document.getElementById('display-user').textContent = u.toUpperCase();
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        const noms = Object.keys(membresAutorises).sort();
        const optionsHTML = noms.map(m => `<option value="${m}">${m.toUpperCase()}</option>`).join('');
        document.getElementById('comms-dest').innerHTML = optionsHTML;
        document.getElementById('lead-op').innerHTML = optionsHTML;
    } else { alert("ACCÈS REFUSÉ"); }
};

window.logout = function() {
    if(currentUser && window.updateStatus) window.updateStatus(currentUser, 'offline');
    location.reload(); 
};

// --- COMMUNICATIONS ---
window.sendComm = function() {
    const dest = document.getElementById('comms-dest').value;
    const msg = document.getElementById('comms-msg').value;
    if(!msg) return alert("MESSAGE VIDE");
    if (!archives.comms) archives.comms = [];
    archives.comms.push({ from: currentUser, to: dest, text: msg, time: new Date().toLocaleString() });
    persist();
    alert("TRANSMISSION RÉUSSIE");
    document.getElementById('comms-msg').value = "";
    toggleCommsSub('archive');
};

function displayComms() {
    const list = document.getElementById('comms-archive-list');
    if(!list) return;
    const mesMessages = (archives.comms || []).filter(c => 
        c.from.toLowerCase() === currentUser.toLowerCase() || c.to.toLowerCase() === currentUser.toLowerCase()
    );
    list.innerHTML = mesMessages.length === 0 ? "<p>Aucune transmission.</p>" : 
    mesMessages.slice().reverse().map(c => `
        <div style="border:1px solid #00d4ff; padding:10px; margin-bottom:10px; background:rgba(0,0,0,0.5);">
            <small>${c.time}</small><br>
            <strong style="color:#00d4ff">${c.from.toUpperCase()} > ${c.to.toUpperCase()}</strong>
            <p>${c.text}</p>
        </div>`).join('');
}

window.toggleCommsSub = function(mode) {
    document.getElementById('comms-form').style.display = mode === 'saisie' ? 'block' : 'none';
    document.getElementById('comms-archive-list').style.display = mode === 'archive' ? 'block' : 'none';
    if(mode === 'archive') displayComms();
};

// --- NAVIGATION & UI ---
window.showTab = function(tabId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    const target = document.getElementById(tabId);
    if(target) target.classList.add('active');
    
    // Mise à jour visuelle des onglets
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
        if(nav.getAttribute('onclick') && nav.getAttribute('onclick').includes(tabId)) {
            nav.classList.add('active');
        }
    });

    if(tabId === 'comms') displayComms();
    if(tabId === 'connexions') updateConnUI();
};

function updateConnUI() {
    const list = document.getElementById('conn-list');
    if(!list) return;
    list.innerHTML = Object.keys(membresAutorises).sort().map(u => {
        const online = allUsersStatus[u] && allUsersStatus[u].status === 'online';
        return `<tr><td>${u.toUpperCase()}</td><td style="color:${online ? '#00ff00' : '#ff4444'}">${online ? '● EN LIGNE' : '○ HORS LIGNE'}</td></tr>`;
    }).join('');
}

// Fonctions supplémentaires pour éviter les erreurs ReferenceError
window.saveOtage = function(type) { alert("Fonction de sauvegarde otage à configurer"); };
window.saveAbsence = function() { alert("Fonction de sauvegarde absence à configurer"); };
window.saveRapport = function() { alert("Fonction de sauvegarde rapport à configurer"); };
window.launchOp = function() { alert("Fonction de lancement d'opération à configurer"); };
window.toggleSub = function(type, mode) {
    document.getElementById(`${type}-form`).style.display = mode === 'saisie' ? 'block' : 'none';
    document.getElementById(`${type}-archive-list`).style.display = mode === 'archive' ? 'block' : 'none';
};
window.toggleAbsSub = function(mode) {
    document.getElementById('abs-form').style.display = mode === 'saisie' ? 'block' : 'none';
    document.getElementById('abs-archive-list').style.display = mode === 'archive' ? 'block' : 'none';
};
window.toggleRapSub = function(mode) {
    document.getElementById('rap-form').style.display = mode === 'saisie' ? 'block' : 'none';
    document.getElementById('rap-archive-list').style.display = mode === 'archive' ? 'block' : 'none';
};

function updateOpsUI() {} 
function finishOp() {}
