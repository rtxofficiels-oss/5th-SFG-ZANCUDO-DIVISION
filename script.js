let activeOps = [];
let archives = { hexa: [], res: [], abs: [], rap: [], comms: [], ops: [] };
let currentUser = "";
let allUsersStatus = {};
let currentDefcon = "5"; 

// Tes mots de passe encodés en Base64
const membresAutorises = {
    "november": "MjExMA==", "alaska": "c2Y1dGg=", "alabama": "cGFzczE=", "rhode": "NXRoU0ZHLVJob2RlMDY=",
    "vermont": "QWxwaGEtMDN2ZXJtb250", "mississippi": "bWlzc2lzc2lwcGl0cm9mb3I=", "montana": "cGFzczQ=",
    "nevada": "NXRoLWJyYXZvMDMtU0ZH", "kentucky": "cGFzczY=", "iowa": "Q2hhcmxpZS0xOS1zLWYtZw==",
    "colorado": "Q29sb3JhY29vbjExJjc=", "idaho": "cGFzczk=", "arizona": "cGFzczEw",
    "oregon": "cGFzczEx", "utha": "cGFzczEy", "maine": "cGFzczEz", "indiana": "cGFzczE0"
};

// --- GESTION VISUELLE DU DEFCON ---
window.changeDefcon = function(val) {
    currentDefcon = val;
    applyDefconUI(val);
    persist(); 
};

function applyDefconUI(val) {
    const config = {
        "1": { main: "rgb(237, 7, 7)",  bg: "rgba(237, 7, 7, 0.3)" },
        "2": { main: "rgb(190, 39, 39)", bg: "rgba(190, 39, 39, 0.25)" },
        "3": { main: "rgb(193, 99, 11)", bg: "rgba(193, 99, 11, 0.2)" },
        "4": { main: "#8db600",          bg: "rgba(0, 0, 0, 0)" },
        "5": { main: "#8db600",          bg: "rgba(0, 0, 0, 0)" }
    };

    const style = config[val] || config["5"];
    const selector = document.getElementById('defcon-selector');
    const dashboard = document.getElementById('dashboard');
    const widget = document.getElementById('op-widget');
    const overlay = document.getElementById('defcon-overlay');

    if (selector) { selector.value = val; selector.style.color = style.main; }
    if (overlay) { overlay.style.background = style.bg; }
    if (dashboard) {
        dashboard.style.borderColor = style.main;
        dashboard.style.boxShadow = `inset 0 0 30px ${style.main}22`;
    }
    if (widget) {
        (val === "1" || val === "2") ? widget.classList.add('blink-red-active') : widget.classList.remove('blink-red-active');
    }
}

// --- MISE À JOUR FIREBASE ---
window.refreshUIdisplay = function(data) {
    if (!data) return;
    if (data.users) allUsersStatus = data.users;
    if (data.global) {
        archives = data.global.archives || { hexa: [], res: [], abs: [], rap: [], comms: [], ops: [] };
        activeOps = data.global.activeOps || [];
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
        window.updateGlobalData({ archives, activeOps, defcon: currentDefcon });
    }
}

// --- LOGIQUE DE CONNEXION ---
window.handleLoginKey = (e) => { if(e.key === "Enter") window.accessGranted(); };

window.accessGranted = function() {
    const u = document.getElementById('user').value.toLowerCase().trim();
    const p = btoa(document.getElementById('pass').value); // On encode l'entrée pour comparer au Base64
    
    if (membresAutorises[u] === p) {
        currentUser = u;
        if (window.updateStatus) window.updateStatus(u, 'online');
        document.getElementById('display-user').textContent = u.toUpperCase();
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        
        const opt = Object.keys(membresAutorises).sort().map(m => `<option value="${m}">${m.toUpperCase()}</option>`).join('');
        const commsDest = document.getElementById('comms-dest');
        const leadOp = document.getElementById('lead-op');
        if(commsDest) commsDest.innerHTML = opt;
        if(leadOp) leadOp.innerHTML = opt;
        
        updateConnUI();
        applyDefconUI(currentDefcon);

        setInterval(() => {
            const clock = document.getElementById('system-clock');
            if(clock) clock.textContent = "SYSTEM_TIME: " + new Date().toLocaleString();
        }, 1000);
    } else { alert("ACCÈS REFUSÉ"); }
};

// --- NAVIGATION & INTERFACE ---
window.showTab = function(tabId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const target = document.getElementById(tabId);
    if(target) target.classList.add('active');
    if(tabId === 'rapport') renderList('rap');
};

window.toggleSub = (type, mode) => {
    const form = document.getElementById(type + '-form');
    const list = document.getElementById(type + '-archive-list');
    if(form) form.style.display = (mode === 'saisie' ? 'block' : 'none');
    if(list) list.style.display = (mode === 'archive' ? 'block' : 'none');
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
    const widgetCount = document.getElementById('widget-count');
    if(widgetCount) widgetCount.textContent = activeOps.length;
    if(list) {
        list.innerHTML = activeOps.map((op, i) => `
            <div class="op-card" style="border:1px solid #4b5320; padding:15px; margin-bottom:10px; background:rgba(0,0,0,0.8);">
                <strong style="color:#8db600;">LEAD: ${op.lead.toUpperCase()}</strong><br>
                ${op.vehicules.map(v => `<div>🛰️ ${v.name} | PAX: ${v.pax}</div>`).join('')}
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button onclick="window.closeOp(${i})" style="flex:1; background:#8b0000; color:white; border:none; padding:5px; cursor:pointer;">TERMINER</button>
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
    const title = document.getElementById('rap-title');
    const text = document.getElementById('rap-text');
    if (!archives.rap) archives.rap = [];
    archives.rap.push({ 
        title: title.value, 
        text: text.value, 
        agent: currentUser, 
        date: new Date().toLocaleString() 
    });
    persist(); 
    window.toggleSub('rap', 'archive');
    title.value = ""; text.value = "";
};

function updateConnUI() {
    const list = document.getElementById('conn-list');
    if(!list) return;
    list.innerHTML = Object.keys(membresAutorises).sort().map(u => {
        const on = allUsersStatus[u] && allUsersStatus[u].status === 'online';
        return `<tr><td>${u.toUpperCase()}</td><td style="color:${on?'#00ff00':'#ff4444'}">${on?'● EN LIGNE':'○ HORS LIGNE'}</td></tr>`;
    }).join('');
}

window.logout = () => { if(window.updateStatus) window.updateStatus(currentUser, 'offline'); location.reload(); };
