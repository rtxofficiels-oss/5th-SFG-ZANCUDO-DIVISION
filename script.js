let activeOps = [];
let archives = { hexa: [], res: [], abs: [], rap: [], comms: [], ops: [] };
let currentUser = "";
let allUsersStatus = {};
let currentDefcon = "5";

// Mots de passe en Base64
const membresAutorises = {
    "november": "MjExMA==", "alaska": "c2Y1dGg=", "alabama": "cGFzczE=", "rhode": "NXRoU0ZHLVJob2RlMDY=",
    "vermont": "QWxwaGEtMDN2ZXJtb250", "mississippi": "bWlzc2lzc2lwcGl0cm9mb3I=", "montana": "cGFzczQ=",
    "nevada": "NXRoLWJyYXZvMDMtU0ZH", "kentucky": "cGFzczY=", "iowa": "Q2hhcmxpZS0xOS1zLWYtZw==",
    "colorado": "Q29sb3JhY29vbjExJjc=", "idaho": "cGFzczk=", "arizona": "cGFzczEw",
    "oregon": "cGFzczEx", "utha": "cGFzczEy", "maine": "cGFzczEz", "indiana": "cGFzczE0"
};

// --- GESTION DES OTAGES ---
window.saveOtage = function(type) {
    const prefix = type === 'hexa' ? 'h-' : 'r-';
    const nom = document.getElementById(prefix + 'nom').value;
    const donnees = document.getElementById(prefix + 'donne').value;

    if (!nom) return alert("NOM REQUIS");

    if (!archives[type]) archives[type] = [];
    archives[type].push({
        title: "OTAGE: " + nom.toUpperCase(),
        infos: donnees,
        agent: currentUser,
        date: new Date().toLocaleString()
    });

    persist();
    window.toggleSub(type, 'archive');
    // Reset champs
    document.getElementById(prefix + 'nom').value = "";
    document.getElementById(prefix + 'donne').value = "";
};

// --- GESTION DES ABSENCES ---
window.saveAbsence = function() {
    const call = document.getElementById('abs-call').value;
    const raison = document.getElementById('abs-raison').value;

    if (!call) return alert("NOM REQUIS");

    if (!archives.abs) archives.abs = [];
    archives.abs.push({
        title: "ABSENCE: " + call.toUpperCase(),
        raison: raison,
        agent: currentUser,
        date: new Date().toLocaleString()
    });

    persist();
    window.toggleSub('abs', 'archive');
    document.getElementById('abs-call').value = "";
    document.getElementById('abs-raison').value = "";
};

// --- NAVIGATION & DEFCON ---
window.changeDefcon = function(val) {
    currentDefcon = val;
    applyDefconUI(val);
    persist();
};

function applyDefconUI(val) {
    const config = {
        "1": { main: "#ed0707", bg: "rgba(237, 7, 7, 0.3)" },
        "2": { main: "#be2727", bg: "rgba(190, 39, 39, 0.25)" },
        "3": { main: "#c1630b", bg: "rgba(193, 99, 11, 0.2)" },
        "4": { main: "#8db600", bg: "rgba(0, 0, 0, 0)" },
        "5": { main: "#8db600", bg: "rgba(0, 0, 0, 0)" }
    };
    const style = config[val] || config["5"];
    const overlay = document.getElementById('defcon-overlay');
    const dashboard = document.getElementById('dashboard');
    if (overlay) overlay.style.background = style.bg;
    if (dashboard) dashboard.style.borderColor = style.main;
    const widget = document.getElementById('op-widget');
    if (widget) {
        (val === "1" || val === "2") ? widget.classList.add('blink-red-active') : widget.classList.remove('blink-red-active');
    }
}

window.showTab = function(tabId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const target = document.getElementById(tabId);
    if(target) target.classList.add('active');
};

window.toggleSub = (type, mode) => {
    const form = document.getElementById(type + '-form');
    const list = document.getElementById(type + '-archive-list');
    if(form) form.style.display = (mode === 'saisie' ? 'block' : 'none');
    if(list) list.style.display = (mode === 'archive' ? 'block' : 'none');
    if(mode === 'archive') renderList(type);
};

// --- LOGIQUE DE CONNEXION ---
window.handleLoginKey = (e) => { if(e.key === "Enter") window.accessGranted(); };

window.accessGranted = function() {
    const u = document.getElementById('user').value.toLowerCase().trim();
    const p = btoa(document.getElementById('pass').value);
    if (membresAutorises[u] === p) {
        currentUser = u;
        if (window.updateStatus) window.updateStatus(u, 'online');
        document.getElementById('display-user').textContent = u.toUpperCase();
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        updateConnUI();
        applyDefconUI(currentDefcon);
        setInterval(() => {
            const clock = document.getElementById('system-clock');
            if(clock) clock.textContent = "SYSTEM_TIME: " + new Date().toLocaleString();
        }, 1000);
    } else { alert("ACCÈS REFUSÉ"); }
};

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
};

// --- SYNC & RENDER ---
function persist() {
    if (window.updateGlobalData) {
        window.updateGlobalData({ archives, activeOps, defcon: currentDefcon });
    }
}

window.refreshUIdisplay = function(data) {
    if (!data) return;
    if (data.users) allUsersStatus = data.users;
    if (data.global) {
        archives = data.global.archives || { hexa: [], res: [], abs: [], rap: [], comms: [], ops: [] };
        activeOps = data.global.activeOps || [];
        currentDefcon = data.global.defcon || "5";
        applyDefconUI(currentDefcon);
    }
    if (currentUser !== "") { updateConnUI(); updateOpsUI(); }
};

function renderList(type) {
    const container = document.getElementById(type + '-archive-list');
    if(!container) return;
    const items = archives[type] || [];
    container.innerHTML = items.map((item, i) => `
        <div class="archive-card" style="border-left:3px solid #8db600; padding:10px; margin-bottom:10px; background:rgba(0,0,0,0.5);">
            <small>${item.date} | PAR: ${item.agent.toUpperCase()}</small>
            <strong>${item.title || 'INFO'}</strong>
            <p style="white-space: pre-line; color:#ccc;">${item.infos || item.text || item.raison || ''}</p>
        </div>`).reverse().join('') || "VIDE";
}

function updateConnUI() {
    const list = document.getElementById('conn-list');
    if(!list) return;
    list.innerHTML = Object.keys(membresAutorises).sort().map(u => {
        const on = allUsersStatus[u] && allUsersStatus[u].status === 'online';
        return `<tr><td>${u.toUpperCase()}</td><td style="color:${on?'#00ff00':'#ff4444'}">${on?'● EN LIGNE':'○ HORS LIGNE'}</td></tr>`;
    }).join('');
}

window.logout = () => { if(window.updateStatus) window.updateStatus(currentUser, 'offline'); location.reload(); };
