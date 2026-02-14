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

window.refreshUIdisplay = function(data) {
    if (!data) return;
    if (data.users) allUsersStatus = data.users;
    if (data.global) {
        archives = data.global.archives || { hexa: [], res: [], abs: [], rap: [], comms: [] };
        if (!archives.hexa) archives.hexa = [];
        if (!archives.res) archives.res = [];
        if (!archives.abs) archives.abs = [];
        if (!archives.rap) archives.rap = [];
        if (!archives.comms) archives.comms = [];
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

window.handleLoginKey = (e) => { if(e.key === "Enter") window.accessGranted(); };

window.accessGranted = function() {
    const u = document.getElementById('user').value.toLowerCase();
    const p = document.getElementById('pass').value;

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
        setInterval(() => {
            document.getElementById('system-clock').textContent = "SYSTEM_TIME: " + new Date().toLocaleString();
        }, 1000);
    } else { alert("ACCÈS REFUSÉ"); }
};

window.showTab = function(tabId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
};

window.toggleSub = (type, mode) => {
    document.getElementById(type + '-form').style.display = (mode === 'saisie' ? 'block' : 'none');
    document.getElementById(type + '-archive-list').style.display = (mode === 'archive' ? 'block' : 'none');
    if(mode === 'archive') renderList(type);
};

window.toggleCommsSub = (m) => window.toggleSub('comms', m);
window.toggleAbsSub = (m) => window.toggleSub('abs', m);
window.toggleRapSub = (m) => window.toggleSub('rap', m);

function renderList(type) {
    const container = document.getElementById(type + '-archive-list');
    const items = archives[type] || [];
    container.innerHTML = items.slice().reverse().map(item => {
        if(type === 'comms' && item.to !== currentUser && item.from !== currentUser) return '';
        return `
            <div class="archive-card" style="border-left:3px solid #8db600; padding:10px; margin-bottom:10px; background:rgba(0,0,0,0.5);">
                <small>${item.date || ''} | PAR: ${(item.agent || 'SYSTEM').toUpperCase()}</small><br>
                ${item.title ? `<strong>${item.title}</strong><br>` : ''}
                ${item.nom ? `<strong>${item.nom} ${item.prenom}</strong> [${item.grade}]<br>` : ''}
                <p>${item.infos || item.text || item.raison || ''}</p>
            </div>`;
    }).join('') || "AUCUNE DONNÉE";
}

window.saveOtage = function(type) {
    if (!archives[type]) archives[type] = [];
    const p = (type === 'hexa' ? 'h-' : 'r-');
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
    if (!archives.comms) archives.comms = [];
    archives.comms.push({ from: currentUser, to: document.getElementById('comms-dest').value, text: document.getElementById('comms-msg').value, date: new Date().toLocaleString(), agent: currentUser });
    persist(); document.getElementById('comms-msg').value = ""; window.toggleSub('comms', 'archive');
};

window.saveRapport = function() {
    if (!archives.rap) archives.rap = [];
    archives.rap.push({ title: document.getElementById('rap-title').value, text: document.getElementById('rap-text').value, agent: currentUser, date: new Date().toLocaleString() });
    persist(); window.toggleSub('rap', 'archive');
};

window.saveAbsence = function() {
    if (!archives.abs) archives.abs = [];
    archives.abs.push({ title: "ABSENCE: " + document.getElementById('abs-call').value, raison: document.getElementById('abs-raison').value, agent: currentUser, date: new Date().toLocaleString() });
    persist(); window.toggleSub('abs', 'archive');
};

window.launchOp = function() {
    let vels = [];
    for (let i = 1; i <= 8; i++) {
        let n = document.getElementById(`v${i}-name`).value;
        let p = document.getElementById(`v${i}-pax`).value;
        if (n !== "") vels.push({ name: n, pax: p });
    }
    if (vels.length === 0) return alert("VIDE");
    activeOps.push({ lead: document.getElementById('lead-op').value, vehicules: vels, date: new Date().toLocaleTimeString() });
    persist(); window.showTab('op-running');
    for (let i = 1; i <= 8; i++) { document.getElementById(`v${i}-name`).value = ""; document.getElementById(`v${i}-pax`).value = ""; }
};

// --- RENDU DES MISSIONS AVEC BOUTON MODIFIER ---
function updateOpsUI() {
    const count = document.getElementById('widget-count');
    const list = document.getElementById('active-ops-list');
    if(count) count.textContent = activeOps.length;
    if(list) {
        list.innerHTML = activeOps.map((op, i) => `
            <div class="op-card" style="border:1px solid #4b5320; padding:15px; margin-bottom:15px; background:rgba(0,0,0,0.8); border-left: 5px solid var(--green-bright);">
                <strong style="color:var(--green-bright); font-size:1.1rem;">LEAD: ${op.lead.toUpperCase()}</strong> 
                <span style="font-size:0.8rem; color:#666;">- ${op.date}</span><br><br>
                ${op.vehicules.map(v => `<div style="font-size:0.9rem;">🛰️ ${v.name} | PAX: ${v.pax}</div>`).join('')}
                <div style="display: flex; gap: 10px; margin-top: 15px;">
                    <button onclick="window.editOp(${i})" style="background:#4b5320; color:white; border:none; padding:8px; flex:1; cursor:pointer; font-weight:bold;">MODIFIER</button>
                    <button onclick="window.closeOp(${i})" style="background:#8b0000; color:white; border:none; padding:8px; flex:1; cursor:pointer; font-weight:bold;">TERMINER</button>
                </div>
            </div>`).join('') || "RAS - AUCUNE OPÉRATION";
    }
}

window.editOp = function(index) {
    const op = activeOps[index];
    if (currentUser !== op.lead.toLowerCase()) {
        return alert("ACCÈS REFUSÉ : SEUL LE LEAD (" + op.lead.toUpperCase() + ") PEUT MODIFIER.");
    }
    window.showTab('depart');
    document.getElementById('lead-op').value = op.lead.toLowerCase();
    for (let i = 1; i <= 8; i++) {
        if (op.vehicules[i-1]) {
            document.getElementById(`v${i}-name`).value = op.vehicules[i-1].name;
            document.getElementById(`v${i}-pax`).value = op.vehicules[i-1].pax;
        } else {
            document.getElementById(`v${i}-name`).value = "";
            document.getElementById(`v${i}-pax`).value = "";
        }
    }
    activeOps.splice(index, 1);
    persist();
    alert("MODE MODIFICATION : METTEZ À JOUR ET RE-VALIDEZ.");
};

window.closeOp = (i) => { activeOps.splice(i,1); persist(); updateOpsUI(); };

function updateConnUI() {
    document.getElementById('conn-list').innerHTML = Object.keys(membresAutorises).sort().map(u => {
        const on = allUsersStatus[u] && allUsersStatus[u].status === 'online';
        return `<tr><td>${u.toUpperCase()}</td><td style="color:${on?'#00ff00':'#ff4444'}">${on?'● EN LIGNE':'○ HORS LIGNE'}</td></tr>`;
    }).join('');
}

window.logout = () => { if(window.updateStatus) window.updateStatus(currentUser, 'offline'); location.reload(); };
