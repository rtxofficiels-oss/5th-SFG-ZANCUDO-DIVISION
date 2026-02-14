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
        archives = data.global.archives || { hexa: [], res: [], abs: [], rap: [], comms: [] };
        activeOps = data.global.activeOps || [];
    }
    if (currentUser !== "") {
        updateConnUI();
        updateOpsUI();
        // Rafraîchir l'affichage de l'onglet si on est sur une archive
        const activeTab = document.querySelector('.content-section.active');
        if (activeTab) refreshTabData(activeTab.id);
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
        
        const noms = Object.keys(membresAutorises).sort();
        const opt = noms.map(m => `<option value="${m}">${m.toUpperCase()}</option>`).join('');
        if(document.getElementById('comms-dest')) document.getElementById('comms-dest').innerHTML = opt;
        if(document.getElementById('lead-op')) document.getElementById('lead-op').innerHTML = opt;
        
        updateConnUI();
        updateOpsUI();
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

// --- NAVIGATION ---
window.showTab = function(tabId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    const target = document.getElementById(tabId);
    if(target) target.classList.add('active');
    
    // Activer le bouton de nav
    document.querySelectorAll('.nav-item').forEach(n => {
        if(n.getAttribute('onclick')?.includes(tabId)) n.classList.add('active');
    });

    refreshTabData(tabId);
};

function refreshTabData(tabId) {
    if(tabId === 'connexions') updateConnUI();
    if(tabId === 'comms') displayComms();
    if(tabId === 'otages-hexa') displayArchive('hexa');
    if(tabId === 'otages-res') displayArchive('res');
    if(tabId === 'absence') displayAbsences();
    if(tabId === 'rapport') displayRapports();
    if(tabId === 'op-running') updateOpsUI();
}

// --- GESTION DES OTAGES & ARCHIVES ---
window.toggleSub = (type, m) => {
    document.getElementById(type + '-form').style.display = m === 'saisie' ? 'block' : 'none';
    document.getElementById(type + '-archive-list').style.display = m === 'archive' ? 'block' : 'none';
    if(m === 'archive') displayArchive(type);
};

window.saveOtage = function(type) {
    const prefix = type === 'hexa' ? 'h-' : 'r-';
    const data = {
        nom: document.getElementById(prefix+'nom').value,
        prenom: document.getElementById(prefix+'prenom').value,
        grade: document.getElementById(prefix+'grade').value,
        infos: document.getElementById(prefix+'donne').value,
        date: new Date().toLocaleString(),
        agent: currentUser
    };
    archives[type].push(data);
    persist();
    alert("ARCHIVÉ");
    window.toggleSub(type, 'archive');
};

function displayArchive(type) {
    const list = document.getElementById(type + '-archive-list');
    if(!list) return;
    list.innerHTML = archives[type].slice().reverse().map(o => `
        <div class="archive-card">
            <strong>${o.nom.toUpperCase()} ${o.prenom}</strong> [${o.grade}]<br>
            <small>Agent: ${o.agent} | ${o.date}</small>
            <p>${o.infos}</p>
        </div>
    `).join('') || "Aucune archive.";
}

// --- MISSIONS / DEPART ---
window.launchOp = function() {
    const op = {
        lead: document.getElementById('lead-op').value,
        v1: { name: document.getElementById('v1-name').value, pax: document.getElementById('v1-pax').value },
        v2: { name: document.getElementById('v2-name').value, pax: document.getElementById('v2-pax').value },
        v3: { name: document.getElementById('v3-name').value, pax: document.getElementById('v3-pax').value },
        date: new Date().toLocaleTimeString()
    };
    activeOps.push(op);
    persist();
    alert("MISSION INITIALISÉE");
    window.showTab('op-running');
};

function updateOpsUI() {
    const widget = document.getElementById('widget-count');
    if(widget) widget.textContent = activeOps.length;

    const list = document.getElementById('active-ops-list');
    if(!list) return;
    list.innerHTML = activeOps.map((op, index) => `
        <div class="op-card">
            <h3 style="color:var(--green-bright); margin:0;">OPÉRATION LEAD: ${op.lead.toUpperCase()}</h3>
            <small>Lancée à : ${op.date}</small><br><br>
            <div class="vehicule-row"><div>${op.v1.name}</div><div>PAX: ${op.v1.pax}</div></div>
            ${op.v2.name ? `<div class="vehicule-row"><div>${op.v2.name}</div><div>PAX: ${op.v2.pax}</div></div>` : ''}
            <button onclick="window.closeOp(${index})" style="background:var(--alert-red); font-size:0.7rem;">TERMINER MISSION</button>
        </div>
    `).join('') || "Aucune opération en cours.";
}

window.closeOp = function(index) {
    activeOps.splice(index, 1);
    persist();
};

// --- COMMUNICATIONS ---
window.toggleCommsSub = (m) => {
    document.getElementById('comms-form').style.display = m === 'saisie' ? 'block' : 'none';
    document.getElementById('comms-archive-list').style.display = m === 'archive' ? 'block' : 'none';
};

window.sendComm = function() {
    const msg = document.getElementById('comms-msg').value;
    const dest = document.getElementById('comms-dest').value;
    if(!msg) return;
    archives.comms.push({ from: currentUser, to: dest, text: msg, date: new Date().toLocaleString() });
    persist();
    document.getElementById('comms-msg').value = "";
    alert("TRANSMIS");
};

function displayComms() {
    const list = document.getElementById('comms-archive-list');
    if(!list) return;
    const filtered = archives.comms.filter(c => c.to === currentUser || c.from === currentUser);
    list.innerHTML = filtered.slice().reverse().map(c => `
        <div class="archive-card" style="border-left-color:#00d4ff">
            <small>${c.date} | DE: ${c.from.toUpperCase()} À: ${c.to.toUpperCase()}</small>
            <p>${c.text}</p>
        </div>
    `).join('') || "Aucun message.";
}

// --- RAPPORTS & ABSENCES ---
window.toggleRapSub = (m) => {
    document.getElementById('rap-form').style.display = m === 'saisie' ? 'block' : 'none';
    document.getElementById('rap-archive-list').style.display = m === 'archive' ? 'block' : 'none';
};

window.saveRapport = function() {
    const title = document.getElementById('rap-title').value;
    const text = document.getElementById('rap-text').value;
    archives.rap.push({ title, text, agent: currentUser, date: new Date().toLocaleString() });
    persist();
    alert("RAPPORT TRANSMIS");
};

function displayRapports() {
    const list = document.getElementById('rap-archive-list');
    if(!list) return;
    list.innerHTML = archives.rap.slice().reverse().map(r => `
        <div class="archive-card">
            <strong>${r.title}</strong><br>
            <small>Agent: ${r.agent} | ${r.date}</small>
            <p>${r.text}</p>
        </div>
    `).join('');
}

// --- GESTION DES CONNEXIONS ---
function updateConnUI() {
    const list = document.getElementById('conn-list');
    if (!list) return;
    list.innerHTML = Object.keys(membresAutorises).sort().map(u => {
        const online = allUsersStatus[u] && allUsersStatus[u].status === 'online';
        return `<tr>
            <td style="color:#00d4ff;">${u.toUpperCase()}</td>
            <td style="color:${online ? '#00ff00' : '#ff4444'}">${online ? '● EN LIGNE' : '○ HORS LIGNE'}</td>
            <td>SCANNING...</td>
        </tr>`;
    }).join('');
}
