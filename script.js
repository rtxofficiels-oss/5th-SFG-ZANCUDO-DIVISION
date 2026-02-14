let activeOps = [];
let archives = { hexa: [], res: [], abs: [], rap: [], comms: [], ops: [] };
let currentUser = "";
let allUsersStatus = {};
let currentDefcon = "5"; // Valeur par défaut

const membresAutorises = {
    "november": "a", "alaska": "sf5th", "alabama": "pass1", "rhode": "5thSFG-Rhode06",
    "vermont": "Alpha-03vermont", "mississippi": "mississippitrofor", "montana": "pass4",
    "nevada": "5th-bravo03-SFG", "kentucky": "pass6", "iowa": "Charlie-19-s-f-g",
    "colorado": "Coloracoon11&7", "idaho": "pass9", "arizona": "pass10",
    "oregon": "pass11", "utha": "pass12", "maine": "pass13", "indiana": "pass14"
};

// --- GESTION VISUELLE DU DEFCON ---
window.changeDefcon = function(val) {
    currentDefcon = val;
    persist(); // Sauvegarde immédiate dans Firebase
};

function applyDefconUI(val) {
    const colors = { "5": "#8db600", "3": "#ff8800", "1": "#ff0000" };
    const selectedColor = colors[val] || "#8db600";
    
    const selector = document.getElementById('defcon-selector');
    const dashboard = document.getElementById('dashboard');
    const widget = document.getElementById('op-widget');

    if (selector) {
        selector.value = val;
        selector.style.color = selectedColor;
    }

    if (dashboard) {
        dashboard.style.borderTop = `4px solid ${selectedColor}`;
        dashboard.style.boxShadow = `inset 0 0 30px ${selectedColor}22`;
    }

    if (widget) {
        if (val === "1") {
            widget.classList.add('blink-red-active');
        } else {
            widget.classList.remove('blink-red-active');
        }
    }
}

// --- MISE À JOUR FIREBASE ---
window.refreshUIdisplay = function(data) {
    if (!data) return;
    if (data.users) allUsersStatus = data.users;
    if (data.global) {
        archives = data.global.archives || { hexa: [], res: [], abs: [], rap: [], comms: [], ops: [] };
        activeOps = data.global.activeOps || [];
        
        // On récupère le Defcon depuis la base de données
        currentDefcon = data.global.defcon || "5";
        applyDefconUI(currentDefcon);
    }
    if (currentUser !== "") {
        updateConnUI();
        updateOpsUI();
    }
};

function persist() {
    if (window.updateGlobalData) {
        window.updateGlobalData({ 
            archives, 
            activeOps, 
            defcon: currentDefcon // On sauve le defcon ici
        });
    }
}

// --- LOGIQUE DE CONNEXION ---
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
        applyDefconUI(currentDefcon); // Appliquer au login

        setInterval(() => {
            document.getElementById('system-clock').textContent = "SYSTEM_TIME: " + new Date().toLocaleString();
        }, 1000);
    } else { alert("ACCÈS REFUSÉ"); }
};

// --- NAVIGATION & INTERFACE ---
window.showTab = function(tabId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if(tabId === 'rapport') renderList('rap');
};

window.toggleSub = (type, mode) => {
    document.getElementById(type + '-form').style.display = (mode === 'saisie' ? 'block' : 'none');
    document.getElementById(type + '-archive-list').style.display = (mode === 'archive' ? 'block' : 'none');
    if(mode === 'archive') renderList(type);
};

window.toggleCommsSub = (m) => window.toggleSub('comms', m);
window.toggleAbsSub = (m) => window.toggleSub('abs', m);
window.toggleRapSub = (m) => window.toggleSub('rap', m);

// --- MISSIONS ---
window.launchOp = function() {
    let vels = [];
    for (let i = 1; i <= 8; i++) {
        let n = document.getElementById(`v${i}-name`).value;
        let p = document.getElementById(`v${i}-pax`).value;
        if (n !== "") vels.push({ name: n, pax: p });
    }
    if (vels.length === 0) return alert("VIDE");
    activeOps.push({ lead: document.getElementById('lead-op').value, vehicules: vels, date: new Date().toLocaleString(), agent: currentUser });
    persist(); 
    window.showTab('op-running');
    for (let i = 1; i <= 8; i++) { document.getElementById(`v${i}-name`).value = ""; document.getElementById(`v${i}-pax`).value = ""; }
};

function updateOpsUI() {
    const list = document.getElementById('active-ops-list');
    document.getElementById('widget-count').textContent = activeOps.length;
    if(list) {
        list.innerHTML = activeOps.map((op, i) => `
            <div class="op-card" style="border:1px solid #4b5320; padding:15px; margin-bottom:10px; background:rgba(0,0,0,0.8);">
                <strong style="color:var(--green-bright);">LEAD: ${op.lead.toUpperCase()}</strong><br>
                ${op.vehicules.map(v => `<div>🛰️ ${v.name} | PAX: ${v.pax}</div>`).join('')}
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button onclick="window.editOp(${i})" style="flex:1; background:#4b5320; color:white;">MODIFIER</button>
                    <button onclick="window.closeOp(${i})" style="flex:1; background:#8b0000; color:white;">TERMINER</button>
                </div>
            </div>`).join('') || "AUCUNE OPÉRATION";
    }
}

window.closeOp = (i) => {
    if(!confirm("TERMINER ET GÉNÉRER LE RAPPORT ?")) return;
    const op = activeOps[i];
    let details = `MISSION TERMINÉE\nLEAD: ${op.lead.toUpperCase()}\nDÉPLOIEMENT :\n`;
    op.vehicules.forEach(v => details += `- ${v.name} [PAX: ${v.pax}]\n`);

    if (!archives.rap) archives.rap = [];
    archives.rap.push({
        title: "FIN DE MISSION : " + op.lead.toUpperCase(),
        text: details,
        agent: currentUser,
        date: new Date().toLocaleString()
    });

    activeOps.splice(i,1);
    persist();
    updateOpsUI();
};

// --- AUTRES ARCHIVES ---
window.deleteArchive = function(type, index) {
    const item = archives[type][index];
    if (currentUser !== item.agent.toLowerCase() && currentUser !== "november") return alert("REFUSÉ");
    if(confirm("SUPPRIMER ?")) { archives[type].splice(index, 1); persist(); renderList(type); }
};

function renderList(type) {
    const container = document.getElementById(type + '-archive-list');
    if(!container) return;
    const items = archives[type] || [];
    container.innerHTML = items.map((item, i) => `
        <div class="archive-card" style="border-left:3px solid #8db600; padding:10px; margin-bottom:10px; background:rgba(0,0,0,0.5); position:relative;">
            <small>${item.date} | PAR: ${item.agent.toUpperCase()}</small>
            <button onclick="window.deleteArchive('${type}', ${i})" style="position:absolute; right:10px; top:10px; background:none; border:none; color:#ff4444; cursor:pointer;">[X]</button><br>
            <strong>${item.title || 'INFO'}</strong>
            <p style="white-space: pre-line; color:#ccc;">${item.infos || item.text || item.raison || ''}</p>
        </div>`).reverse().join('') || "VIDE";
}

// --- SAUVEGARDES ---
window.saveRapport = function() {
    if (!archives.rap) archives.rap = [];
    archives.rap.push({ title: document.getElementById('rap-title').value, text: document.getElementById('rap-text').value, agent: currentUser, date: new Date().toLocaleString() });
    persist(); window.toggleSub('rap', 'archive');
};

function updateConnUI() {
    document.getElementById('conn-list').innerHTML = Object.keys(membresAutorises).sort().map(u => {
        const on = allUsersStatus[u] && allUsersStatus[u].status === 'online';
        return `<tr><td>${u.toUpperCase()}</td><td style="color:${on?'#00ff00':'#ff4444'}">${on?'● EN LIGNE':'○ HORS LIGNE'}</td></tr>`;
    }).join('');
}

window.logout = () => { if(window.updateStatus) window.updateStatus(currentUser, 'offline'); location.reload(); };
