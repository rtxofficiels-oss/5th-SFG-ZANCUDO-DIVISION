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

// --- SYNCHRONISATION CLOUD ---
window.refreshUIdisplay = function(data) {
    if (!data) return;
    
    if (data.users) allUsersStatus = data.users;
    if (data.global) {
        // On récupère les archives ou on initialise si vide
        archives = data.global.archives || { hexa: [], res: [], abs: [], rap: [], comms: [] };
        activeOps = data.global.activeOps || [];
    }

    if (currentUser !== "") {
        updateConnUI();
        updateOpsUI();
        
        // Rafraîchir les listes si l'utilisateur est sur un onglet d'archive
        const activeTab = document.querySelector('.content-section.active');
        if (activeTab) {
            const id = activeTab.id;
            if (id === 'comms') displayComms();
            if (id === 'otages-hexa') displayArchive('hexa');
            if (id === 'otages-res') displayArchive('res');
            if (id === 'absence') displayAbsences();
            if (id === 'rapport') displayRapports();
        }
    }
};

function persist() {
    if (typeof window.updateGlobalData === 'function') {
        window.updateGlobalData({ archives, activeOps });
    }
}

// --- CONNEXION ---
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
        const opt = noms.map(m => `<option value="${m}">${m.toUpperCase()}</option>`).join('');
        document.getElementById('comms-dest').innerHTML = opt;
        document.getElementById('lead-op').innerHTML = opt;
        
        updateConnUI();
        setInterval(() => {
            const clock = document.getElementById('system-clock');
            if(clock) clock.textContent = "SYSTEM_TIME: " + new Date().toLocaleString();
        }, 1000);
    } else { 
        alert("ACCÈS REFUSÉ"); 
    }
};

window.logout = function() {
    if(currentUser && window.updateStatus) window.updateStatus(currentUser, 'offline');
    location.reload();
};

// --- NAVIGATION & UI ---
window.showTab = function(tabId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    if(tabId === 'connexions') updateConnUI();
    if(tabId === 'comms') displayComms();
};

function updateConnUI() {
    const list = document.getElementById('conn-list');
    if (!list) return;
    list.innerHTML = Object.keys(membresAutorises).sort().map(u => {
        const online = allUsersStatus[u] && allUsersStatus[u].status === 'online';
        const color = online ? '#00ff00' : '#ff4444';
        return `<tr>
            <td style="color:#00d4ff; font-weight:bold;">${u.toUpperCase()}</td>
            <td style="color:${color}; font-weight:bold;">${online ? '● EN LIGNE' : '○ HORS LIGNE'}</td>
            <td style="color:#666; font-size:0.8rem;">SCAN SATELLITE...</td>
        </tr>`;
    }).join('');
}

function updateOpsUI() {
    const count = document.getElementById('widget-count');
    if(count) count.textContent = activeOps.length;
}

// --- GESTION DES OTAGES ---
window.saveOtage = function(type) {
    const prefix = type === 'hexa' ? 'h-' : 'r-';
    const data = {
        nom: document.getElementById(prefix+'nom').value,
        prenom: document.getElementById(prefix+'prenom').value,
        grade: document.getElementById(prefix+'grade').value,
        infos: document.getElementById(prefix+'donne').value,
        agent: currentUser,
        date: new Date().toLocaleString()
    };
    if(!data.nom || !data.infos) return alert("ERREUR: CHAMPS VIDES");
    
    if(!archives[type]) archives[type] = [];
    archives[type].push(data);
    persist();
    alert("ARCHIVAGE RÉUSSI");
    window.toggleSub(type, 'archive');
};

function displayArchive(type) {
    const container = document.getElementById(type + '-archive-list');
    if(!container || !archives[type]) return;
    container.innerHTML = archives[type].slice().reverse().map(o => `
        <div style="border:1px solid #444; padding:10px; margin-bottom:10px; background:rgba(0,0,0,0.5);">
            <strong style="color:var(--green-bright);">${o.nom.toUpperCase()} ${o.prenom}</strong> (${o.grade})<br>
            <small>Agent: ${o.agent} | ${o.date}</small>
            <p style="margin-top:5px; color:#ccc;">${o.infos}</p>
        </div>
    `).join('');
}

// --- COMMUNICATIONS ---
window.sendComm = function() {
    const dest = document.getElementById('comms-dest').value;
    const msg = document.getElementById('comms-msg').value;
    if(!msg) return;
    if(!archives.comms) archives.comms = [];
    archives.comms.push({ from: currentUser, to: dest, text: msg, date: new Date().toLocaleString() });
    persist();
    document.getElementById('comms-msg').value = "";
    alert("MESSAGE TRANSMIS");
};

function displayComms() {
    const list = document.getElementById('comms-archive-list');
    if(!list || !archives.comms) return;
    // On n'affiche que les messages qui concernent l'utilisateur
    const myComms = archives.comms.filter(c => c.from === currentUser || c.to === currentUser);
    list.innerHTML = myComms.slice().reverse().map(c => `
        <div style="border-left:3px solid #00d4ff; padding:5px 10px; margin-bottom:10px; background:rgba(0,212,255,0.1);">
            <small>${c.date}</small><br>
            <strong>${c.from.toUpperCase()} > ${c.to.toUpperCase()}</strong>
            <p>${c.text}</p>
        </div>
    `).join('') || "Aucun message.";
}

// --- FONCTIONS DE NAVIGATION SECONDAIRE ---
window.toggleCommsSub = (m) => {
    document.getElementById('comms-form').style.display = m === 'saisie' ? 'block' : 'none';
    document.getElementById('comms-archive-list').style.display = m === 'archive' ? 'block' : 'none';
    if(m === 'archive') displayComms();
};

window.toggleSub = (type, m) => {
    document.getElementById(type + '-form').style.display = m === 'saisie' ? 'block' : 'none';
    document.getElementById(type + '-archive-list').style.display = m === 'archive' ? 'block' : 'none';
    if(m === 'archive') displayArchive(type);
};

// Fonctions Rapports et Absences (Stubs activés)
window.saveRapport = function() { alert("FONCTIONNALITÉ EN COURS DE SYNCHRO..."); };
window.saveAbsence = function() { alert("ABSENCE ENREGISTRÉE..."); };
