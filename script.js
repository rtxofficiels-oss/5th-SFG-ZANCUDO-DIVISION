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

// --- SYNCHRONISATION ---
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
    }
};

function persist() {
    if (window.updateGlobalData) window.updateGlobalData({ archives, activeOps });
}

// --- CONNEXION ---
window.handleLoginKey = (e) => { if(e.key === "Enter") window.accessGranted(); };
window.accessGranted = function() {
    let u = document.getElementById('user').value.toLowerCase();
    let p = document.getElementById('pass').value;
    if (membresAutorises[u] === p) {
        currentUser = u;
        if (window.updateStatus) window.updateStatus(u, 'online');
        document.getElementById('display-user').textContent = u.toUpperCase();
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        const opt = Object.keys(membresAutorises).sort().map(m => `<option value="${m}">${m.toUpperCase()}</option>`).join('');
        document.getElementById('comms-dest').innerHTML = opt;
        document.getElementById('lead-op').innerHTML = opt;
        updateConnUI();
        setInterval(() => { document.getElementById('system-clock').textContent = "SYSTEM_TIME: " + new Date().toLocaleString(); }, 1000);
    } else { alert("ACCÈS REFUSÉ"); }
};

// --- NAVIGATION GENERALE ---
window.showTab = function(tabId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    // Active le bouton de nav
    document.querySelectorAll('.nav-item').forEach(n => { if(n.getAttribute('onclick')?.includes(tabId)) n.classList.add('active'); });
};

// --- LOGIQUE COMMUNE POUR TOUTES LES SECTIONS (Otages, Absences, Rapports, Comms) ---
window.toggleSub = (type, mode) => {
    document.getElementById(type + '-form').style.display = mode === 'saisie' ? 'block' : 'none';
    document.getElementById(type + '-archive-list').style.display = mode === 'archive' ? 'block' : 'none';
    if(mode === 'archive') renderList(type);
};

// Redirection des fonctions spécifiques du HTML vers la fonction commune
window.toggleCommsSub = (m) => window.toggleSub('comms', m);
window.toggleAbsSub = (m) => window.toggleSub('abs', m);
window.toggleRapSub = (m) => window.toggleSub('rap', m);

function renderList(type) {
    const container = document.getElementById(type + '-archive-list');
    if(!container || !archives[type]) return;
    
    let html = archives[type].slice().reverse().map(item => {
        if(type === 'comms' && item.to !== currentUser && item.from !== currentUser) return ''; // Filtre messages
        return `
            <div class="archive-card" style="border-left: 3px solid var(--green-bright); padding:10px; margin-bottom:10px; background:rgba(0,0,0,0.5);">
                <small>${item.date} | PAR: ${item.agent?.toUpperCase()}</small><br>
                ${item.title ? `<strong>${item.title}</strong><br>` : ''}
                ${item.nom ? `<strong>${item.nom} ${item.prenom}</strong> [${item.grade}]<br>` : ''}
                <p>${item.infos || item.text || item.raison || ''}</p>
            </div>`;
    }).join('');
    container.innerHTML = html || "Aucune donnée.";
}

// --- SAUVEGARDES ---
window.saveOtage = function(type) {
    const p = type === 'hexa' ? 'h-' : 'r-';
    archives[type].push({
        nom: document.getElementById(p+'nom').value,
        prenom: document.getElementById(p+'prenom').value,
        grade: document.getElementById(p+'grade').value,
        infos: document.getElementById(p+'donne').value,
        agent: currentUser, date: new Date().toLocaleString()
    });
    persist(); alert("ARCHIVÉ"); window.toggleSub(type, 'archive');
};

window.sendComm = function() {
    archives.comms.push({ from: currentUser, to: document.getElementById('comms-dest').value, text: document.getElementById('comms-msg').value, date: new Date().toLocaleString(), agent: currentUser });
    persist(); alert("TRANSMIS"); window.toggleCommsSub('archive');
};

window.saveRapport = function() {
    archives.rap.push({ title: document.getElementById('rap-title').value, text: document.getElementById('rap-text').value, agent: currentUser, date: new Date().toLocaleString() });
    persist(); alert("RAPPORT ENREGISTRÉ"); window.toggleRapSub('archive');
};

window.saveAbsence = function() {
    archives.abs.push({ title: "ABSENCE: " + document.getElementById('abs-call').value, raison: document.getElementById('abs-raison').value, agent: currentUser, date: "Du " + document.getElementById('abs-start').value + " au " + document.getElementById('abs-end').value });
    persist(); alert("ABSENCE ARCHIVÉE"); window.toggleAbsSub('archive');
};

// --- MISSIONS ---
window.launchOp = function() {
    activeOps.push({ lead: document.getElementById('lead-op').value, v1: document.getElementById('v1-name').value, p1: document.getElementById('v1-pax').value, date: new Date().toLocaleTimeString() });
    persist(); window.showTab('op-running');
};

function updateOpsUI() {
    document.getElementById('widget-count').textContent = activeOps.length;
    document.getElementById('active-ops-list').innerHTML = activeOps.map((op, i) => `
        <div class="op-card"><strong>LEAD: ${op.lead.toUpperCase()}</strong> (${op.date})<br>
        V: ${op.v1} | PAX: ${op.p1}<br>
        <button onclick="window.closeOp(${i})" style="background:var(--alert-red); padding:2px 5px; font-size:0.6rem;">STOP</button></div>
    `).join('') || "RAS.";
}
window.closeOp = (i) => { activeOps.splice(i,1); persist(); };

function updateConnUI() {
    document.getElementById('conn-list').innerHTML = Object.keys(membresAutorises).sort().map(u => {
        const on = allUsersStatus[u]?.status === 'online';
        return `<tr><td style="color:#00d4ff">${u.toUpperCase()}</td><td style="color:${on?'#00ff00':'#f44'}">${on?'● ONLINE':'○ OFFLINE'}</td></tr>`;
    }).join('');
}
window.logout = () => { if(window.updateStatus) window.updateStatus(currentUser, 'offline'); location.reload(); };
