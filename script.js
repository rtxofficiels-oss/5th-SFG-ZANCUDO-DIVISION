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

// --- SYNCHRONISATION FIREBASE ---
window.refreshUIdisplay = function(data) {
    if (!data) return;
    if (data.users) { allUsersStatus = data.users; updateConnUI(); }
    if (data.global) {
        archives = data.global.archives || { hexa: [], res: [], abs: [], rap: [], comms: [] };
        activeOps = data.global.activeOps || [];
        updateOpsUI();
        // Rafraîchir les messages si on est sur l'onglet comms
        const commsTab = document.getElementById('comms');
        if(commsTab && commsTab.classList.contains('active')) displayComms();
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

// --- FONCTIONS D'ACCÈS (CORRIGÉES POUR LES BOUTONS) ---

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
        
        const noms = Object.keys(membresAutorises).sort();
        const optionsHTML = noms.map(m => `<option value="${m}">${m.toUpperCase()}</option>`).join('');
        
        const destSelect = document.getElementById('comms-dest');
        const leadSelect = document.getElementById('lead-op');
        if(destSelect) destSelect.innerHTML = optionsHTML;
        if(leadSelect) leadSelect.innerHTML = optionsHTML;
    } else { 
        alert("ACCÈS REFUSÉ : IDENTIFIANTS INCORRECTS"); 
    }
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
    archives.comms.push({ 
        from: currentUser, 
        to: dest, 
        text: msg, 
        time: new Date().toLocaleString() 
    });
    
    persist();
    alert("TRANSMISSION RÉUSSIE");
    document.getElementById('comms-msg').value = "";
    window.toggleCommsSub('archive');
};

function displayComms() {
    const list = document.getElementById('comms-archive-list');
    if(!list) return;
    
    const mesMessages = (archives.comms || []).filter(c => 
        c.from.toLowerCase() === currentUser.toLowerCase() || 
        c.to.toLowerCase() === currentUser.toLowerCase()
    );
    
    list.innerHTML = mesMessages.length === 0 ? "<p style='color:#666;'>Aucune transmission.</p>" : 
    mesMessages.slice().reverse().map(c => `
        <div style="border:1px solid #00d4ff; padding:10px; margin-bottom:10px; background:rgba(0,0,0,0.5);">
            <small style="color:#888;">${c.time}</small><br>
            <strong style="color:#00d4ff">${c.from.toUpperCase()} > ${c.to.toUpperCase()}</strong>
            <p style="margin-top:5px;">${c.text}</p>
        </div>`).join('');
}

window.toggleCommsSub = function(mode) {
    const form = document.getElementById('comms-form');
    const list = document.getElementById('comms-archive-list');
    if(form) form.style.display = mode === 'saisie' ? 'block' : 'none';
    if(list) list.style.display = mode === 'archive' ? 'block' : 'none';
    if(mode === 'archive') displayComms();
};

// --- NAVIGATION ---

window.showTab = function(tabId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const target = document.getElementById(tabId);
    if(target) target.classList.add('active');
    
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

// --- AUTRES FONCTIONS (STUBS) ---
function updateOpsUI() {}
window.launchOp = function() { alert("Mission lancée (Cloud)"); persist(); };
window.saveRapport = function() { alert("Rapport enregistré (Cloud)"); persist(); };
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
