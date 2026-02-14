// --- CONFIGURATION ---
let activeOps = [];
// Initialisation robuste pour éviter les erreurs "push of undefined"
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

// --- SYNCHRO CLOUD ---
window.refreshUIdisplay = function(data) {
    if (!data) return;
    if (data.users) allUsersStatus = data.users;
    if (data.global) {
        // Sécurité : on s'assure que chaque catégorie existe dans l'objet archives
        const incomingArchives = data.global.archives || {};
        archives = {
            hexa: incomingArchives.hexa || [],
            res: incomingArchives.res || [],
            abs: incomingArchives.abs || [],
            rap: incomingArchives.rap || [],
            comms: incomingArchives.comms || []
        };
        activeOps = data.global.activeOps || [];
    }
    if (currentUser !== "") {
        updateConnUI();
        updateOpsUI();
    }
};

function persist() {
    if (window.updateGlobalData) {
        window.updateGlobalData({ archives, activeOps });
    }
}

// --- CONNEXION ---
window.handleLoginKey = (e) => { if(e.key === "Enter") window.accessGranted(); };

window.accessGranted = function() {
    const uEl = document.getElementById('user');
    const pEl = document.getElementById('pass');
    if(!uEl || !pEl) return;

    let u = uEl.value.toLowerCase().trim(); // Ajout de .trim() pour éviter les espaces accidentels
    let p = pEl.value;

    if (membresAutorises[u] === p) {
        currentUser = u;
        if (window.updateStatus) window.updateStatus(u, 'online');
        
        document.getElementById('display-user').textContent = u.toUpperCase();
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        
        // Remplissage des menus
        const opt = Object.keys(membresAutorises).sort().map(m => `<option value="${m}">${m.toUpperCase()}</option>`).join('');
        const dest = document.getElementById('comms-dest');
        const lead = document.getElementById('lead-op');
        if(dest) dest.innerHTML = opt;
        if(lead) lead.innerHTML = opt;

        updateConnUI();
        updateOpsUI();

        // Horloge système
        setInterval(() => {
            const clk = document.getElementById('system-clock');
            if(clk) clk.textContent = "SYSTEM_TIME: " + new Date().toLocaleString();
        }, 1000);
    } else {
        alert("ACCÈS REFUSÉ");
    }
};

// --- NAVIGATION ---
window.showTab = function(tabId) {
    const sections = document.querySelectorAll('.content-section');
    const navs = document.querySelectorAll('.nav-item');
    
    sections.forEach(s => s.classList.remove('active'));
    navs.forEach(n => n.classList.remove('active'));

    const target = document.getElementById(tabId);
    if(target) target.classList.add('active');

    // Mise à jour visuelle du menu de navigation
    navs.forEach(n => {
        if(n.getAttribute('onclick') && n.getAttribute('onclick').includes(tabId)) {
            n.classList.add('active');
        }
    });
};

// --- GESTION DES SOUS-SECTIONS ---
window.toggleSub = (type, mode) => {
    const f = document.getElementById(type + '-form');
    const l = document.getElementById(type + '-archive-list');
    if(f) f.style.display = (mode === 'saisie' ? 'block' : 'none');
    if(l) l.style.display = (mode === 'archive' ? 'block' : 'none');
    if(mode === 'archive') renderList(type);
};

window.toggleCommsSub = (m) => window.toggleSub('comms', m);
window.toggleAbsSub = (m) => window.toggleSub('abs', m);
window.toggleRapSub = (m) => window.toggleSub('rap', m);

function renderList(type) {
    const container = document.getElementById(type + '-archive-list');
    if(!container) return;
    
    const items = archives[type] || [];
    container.innerHTML = items.slice().reverse().map(item => {
        // Filtre pour les communications privées
        if(type === 'comms' && item.to !== currentUser && item.from !== currentUser) return '';
        
        return `
            <div class="archive-card" style="border-left:3px solid #8db600; padding:10px; margin-bottom:10px; background:rgba(0,0,0,0.5); border-bottom: 1px solid #333;">
                <small style="color:#aaa;">${item.date || ''} | PAR: ${(item.agent || 'SYSTEM').toUpperCase()}</small><br>
                ${item.title ? `<strong style="color:var(--green-bright);">${item.title}</strong><br>` : ''}
                ${item.nom ? `<strong style="color:#00d4ff;">${item.nom} ${item.prenom}</strong> [${item.grade}]<br>` : ''}
                <p style="margin:5px 0 0 0; white-space: pre-wrap;">${item.infos || item.text || item.raison || ''}</p>
            </div>`;
    }).join('') || "AUCUNE DONNÉE ENREGISTRÉE";
}

// --- ACTIONS DE SAUVEGARDE (SÉCURISÉES) ---
window.saveOtage = function(type) {
    const p = (type === 'hexa' ? 'h-' : 'r-');
    const nom = document.getElementById(p+'nom').value;
    if(!nom) return alert("NOM OBLIGATOIRE");

    if(!archives[type]) archives[type] = [];
    
    archives[type].push({
        nom: nom,
        prenom: document.getElementById(p+'prenom').value,
        grade: document.getElementById(p+'grade').value,
        infos: document.getElementById(p+'donne').value,
        agent: currentUser,
        date: new Date().toLocaleString()
    });
    persist();
    alert("DOSSIER ARCHIVÉ");
    window.toggleSub(type, 'archive');
};

window.sendComm = function() {
    const msg = document.getElementById('comms-msg');
    const dst = document.getElementById('comms-dest');
    if(!msg || !msg.value) return;

    if(!archives.comms) archives.comms = [];
    
    archives.comms.push({ 
        from: currentUser, 
        to: dst.value, 
        text: msg.value, 
        date: new Date().toLocaleString(), 
        agent: currentUser 
    });
    persist();
    msg.value = "";
    window.toggleSub('comms', 'archive');
};

window.saveRapport = function() {
    const t = document.getElementById('rap-title');
    const txt = document.getElementById('rap-text');
    if(!t.value || !txt.value) return alert("CHAMPS VIDES");

    if(!archives.rap) archives.rap = [];

    archives.rap.push({ 
        title: t.value, 
        text: txt.value, 
        agent: currentUser, 
        date: new Date().toLocaleString() 
    });
    persist();
    t.value = ""; txt.value = "";
    window.toggleSub('rap', 'archive');
};

window.saveAbsence = function() {
    const call = document.getElementById('abs-call');
    const raison = document.getElementById('abs-raison');
    
    if(!archives.abs) archives.abs = [];

    archives.abs.push({ 
        title: "ABSENCE: " + (call ? call.value : "NON SPÉCIFIÉ"), 
        raison: (raison ? raison.value : ""), 
        agent: currentUser, 
        date: new Date().toLocaleString() 
    });
    persist();
    window.toggleSub('abs', 'archive');
};

// --- MISSIONS (8 Véhicules) ---
window.launchOp = function() {
    let missionVehicules = [];
    for (let i = 1; i <= 8; i++) {
        let nameEl = document.getElementById(`v${i}-name`);
        let paxEl = document.getElementById(`v${i}-pax`);
        if (nameEl && nameEl.value.trim() !== "") {
            missionVehicules.push({ name: nameEl.value, pax: paxEl.value });
        }
    }

    if (missionVehicules.length === 0) return alert("ERREUR: AUCUN VÉHICULE SAISI");

    activeOps.push({ 
        lead: document.getElementById('lead-op').value, 
        vehicules: missionVehicules, 
        date: new Date().toLocaleTimeString() 
    });

    persist();
    updateOpsUI();
    window.showTab('op-running');
    
    // Reset champs
    for (let i = 1; i <= 8; i++) {
        document.getElementById(`v${i}-name`).value = "";
        document.getElementById(`v${i}-pax`).value = "";
    }
};

function updateOpsUI() {
    const count = document.getElementById('widget-count');
    const list = document.getElementById('active-ops-list');
    if(count) count.textContent = activeOps.length;
    if(list) {
        list.innerHTML = activeOps.map((op, i) => `
            <div class="op-card" style="border:1px solid #4b5320; padding:15px; margin-bottom:15px; background:rgba(0,0,0,0.8); border-left: 5px solid var(--green-bright);">
                <strong style="color:var(--green-bright); font-size:1.1rem;">LEAD: ${op.lead.toUpperCase()}</strong> 
                <span style="font-size:0.8rem; color:#666;">- Lancé à ${op.date}</span><br><br>
                ${op.vehicules.map(v => `<div style="font-size:0.9rem; margin-bottom:3px;">🛰️ ${v.name} | <span style="color:#00d4ff">PAX: ${v.pax}</span></div>`).join('')}
                <button onclick="window.closeOp(${i})" style="background:#8b0000; color:white; border:none; padding:10px; margin-top:15px; width:100%; cursor:pointer; font-weight:bold;">TERMINER LA MISSION</button>
            </div>`).join('') || "<p style='color:#666;'>RAS - AUCUNE OPÉRATION EN COURS</p>";
    }
}

window.closeOp = (i) => { 
    if(confirm("Confirmer la fin de mission ?")) {
        activeOps.splice(i,1); 
        persist(); 
        updateOpsUI(); 
    }
};

function updateConnUI() {
    const list = document.getElementById('conn-list');
    if(!list) return;
    list.innerHTML = Object.keys(membresAutorises).sort().map(u => {
        const on = allUsersStatus[u] && allUsersStatus[u].status === 'online';
        return `<tr><td style="color:#00d4ff">${u.toUpperCase()}</td><td style="color:${on?'#00ff00':'#ff4444'}">${on?'● EN LIGNE':'○ HORS LIGNE'}</td></tr>`;
    }).join('');
}

window.logout = () => { 
    if(window.updateStatus) window.updateStatus(currentUser, 'offline'); 
    location.reload(); 
};
