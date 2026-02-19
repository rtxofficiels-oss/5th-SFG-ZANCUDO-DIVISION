let activeOps = [];
let archives = { hexa: [], res: [], abs: [], rap: [], comms: [], ops: [] };
let currentUser = "";
let allUsersStatus = {};
let currentDefcon = "5"; 

// --- BASE DE DONNÉES HACHÉE ---
// Les mots de passe sont maintenant des empreintes SHA-256. 
// Personne ne peut les lire directement dans l'inspecteur.
const membresAutorises = {
    "november": "79b69994c64391264c70381e4b9679fdfa268e3b44b822d64516752766324e93", 
    "alaska": "54495f00e960b77626359f5a04467d169c735f492a2a0937a4e61066986518a2",
    "general hayes": "022569503f5387f3b5f9026410291931818d09ca08605c4533088b9a1a2b1f81",
    // ... j'ai converti les principaux pour l'exemple
};

// Fonction utilitaire pour transformer le texte en empreinte sécurisée
async function hashPassword(password) {
    const msgBuffer = new TextEncoder().encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// --- LOGIQUE DE CONNEXION SÉCURISÉE ---
window.accessGranted = async function() {
    const u = document.getElementById('user').value.toLowerCase().trim();
    const p = document.getElementById('pass').value;
    
    // On transforme le mot de passe tapé en empreinte pour comparer
    const hashedInput = await hashPassword(p);

    if (membresAutorises[u] === hashedInput) {
        currentUser = u;
        if (window.updateStatus) window.updateStatus(u, 'online');
        document.getElementById('display-user').textContent = u.toUpperCase();
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        
        const opt = Object.keys(membresAutorises).sort().map(m => `<option value="${m}">${m.toUpperCase()}</option>`).join('');
        document.getElementById('comms-dest').innerHTML = opt;
        document.getElementById('lead-op').innerHTML = opt;
        
        updateConnUI();
        applyDefconUI(currentDefcon);

        setInterval(() => {
            document.getElementById('system-clock').textContent = "SYSTEM_TIME: " + new Date().toLocaleString();
        }, 1000);
    } else { 
        alert("ACCÈS REFUSÉ : Identifiants ou Signature numérique invalide."); 
    }
};

// --- LE RESTE DU CODE RESTE IDENTIQUE ---
window.changeDefcon = function(val) { currentDefcon = val; persist(); };
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
    const overlay = document.getElementById('defcon-overlay');
    if (selector) { selector.value = val; selector.style.color = style.main; }
    if (overlay) overlay.style.background = style.bg;
    if (dashboard) {
        dashboard.style.borderColor = style.main;
        dashboard.style.boxShadow = `inset 0 0 30px ${style.main}22`;
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

function persist() {
    if (window.updateGlobalData) {
        window.updateGlobalData({ archives, activeOps, defcon: currentDefcon });
    }
}

window.handleLoginKey = (e) => { if(e.key === "Enter") window.accessGranted(); };

window.sendComm = function() {
    const dest = document.getElementById('comms-dest').value;
    const msg = document.getElementById('comms-msg').value;
    if (!msg) return;
    if (!archives.comms) archives.comms = [];
    archives.comms.push({ title: `POUR: ${dest.toUpperCase()}`, text: msg, dest: dest, agent: currentUser, date: new Date().toLocaleString() });
    persist();
    document.getElementById('comms-msg').value = "";
    window.toggleCommsSub('archive');
};

window.saveOtage = function(type) {
    const prefix = type === 'hexa' ? 'h-' : 'r-';
    const data = {
        title: `${document.getElementById(prefix+'grade').value} ${document.getElementById(prefix+'nom').value} ${document.getElementById(prefix+'prenom').value}`,
        infos: document.getElementById(prefix+'donne').value,
        agent: currentUser,
        date: new Date().toLocaleString()
    };
    if (!archives[type]) archives[type] = [];
    archives[type].push(data);
    persist();
    window.toggleSub(type, 'archive');
};

window.saveAbsence = function() {
    const data = {
        title: `ABSENCE: ${document.getElementById('abs-call').value}`,
        infos: `DU ${document.getElementById('abs-start').value} AU ${document.getElementById('abs-end').value}\nRAISON: ${document.getElementById('abs-raison').value}`,
        agent: currentUser,
        date: new Date().toLocaleString()
    };
    if (!archives.abs) archives.abs = [];
    archives.abs.push(data);
    persist();
    window.toggleAbsSub('archive');
};

window.saveRapport = function() {
    if (!archives.rap) archives.rap = [];
    archives.rap.push({ title: document.getElementById('rap-title').value, text: document.getElementById('rap-text').value, agent: currentUser, date: new Date().toLocaleString() });
    persist(); 
    window.toggleSub('rap', 'archive');
};

window.showTab = function(tabId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    renderList(tabId === 'otages-hexa' ? 'hexa' : tabId === 'otages-res' ? 'res' : tabId === 'absence' ? 'abs' : tabId);
};

window.toggleSub = (type, mode) => {
    document.getElementById(type + '-form').style.display = (mode === 'saisie' ? 'block' : 'none');
    document.getElementById(type + '-archive-list').style.display = (mode === 'archive' ? 'block' : 'none');
    if(mode === 'archive') renderList(type === 'otages-hexa' ? 'hexa' : type === 'otages-res' ? 'res' : type);
};

window.toggleCommsSub = (m) => window.toggleSub('comms', m);
window.toggleAbsSub = (m) => window.toggleSub('abs', m);
window.toggleRapSub = (m) => window.toggleSub('rap', m);

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

function updateOpsUI() {
    const list = document.getElementById('active-ops-list');
    document.getElementById('widget-count').textContent = activeOps.length;
    if(list) {
        list.innerHTML = activeOps.map((op, i) => `
            <div class="op-card" style="border:1px solid #4b5320; padding:15px; margin-bottom:10px; background:rgba(0,0,0,0.8);">
                <strong style="color:var(--green-bright);">LEAD: ${op.lead.toUpperCase()}</strong><br>
                ${op.vehicules.map(v => `<div>🛰️ ${v.name} | PAX: ${v.pax}</div>`).join('')}
                <button onclick="window.closeOp(${i})" style="width:100%; margin-top:10px; background:#8b0000; color:white;">TERMINER</button>
            </div>`).join('') || "AUCUNE OPÉRATION";
    }
}

window.closeOp = (i) => {
    if(!confirm("TERMINER ?")) return;
    const op = activeOps[i];
    if (!archives.rap) archives.rap = [];
    archives.rap.push({ title: "FIN DE MISSION: " + op.lead.toUpperCase(), text: `Lead: ${op.lead}\nDate: ${op.date}`, agent: currentUser, date: new Date().toLocaleString() });
    activeOps.splice(i,1);
    persist();
    updateOpsUI();
};

window.deleteArchive = function(type, index) {
    if(confirm("SUPPRIMER ?")) { archives[type].splice(index, 1); persist(); renderList(type); }
};

function renderList(type) {
    const container = document.getElementById(type + '-archive-list');
    if(!container) return;
    const items = archives[type] || [];
    container.innerHTML = items.map((item, i) => {
        if (type === 'comms' && item.dest !== currentUser && item.agent !== currentUser && currentUser !== "november") return '';
        return `
        <div class="archive-card" style="border-left:3px solid #8db600; padding:10px; margin-bottom:10px; background:rgba(0,0,0,0.5); position:relative;">
            <small>${item.date} | PAR: ${item.agent.toUpperCase()}</small>
            <button onclick="window.deleteArchive('${type}', ${i})" style="position:absolute; right:10px; top:10px; background:none; border:none; color:#ff4444;">[X]</button><br>
            <strong>${item.title || 'INFO'}</strong>
            <p style="white-space: pre-line; color:#ccc;">${item.infos || item.text || ''}</p>
        </div>`;
    }).reverse().join('') || "VIDE";
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
