// --- CONFIGURATION & ETAT ---
let activeOps = [];
let archives = { hexa: [], res: [], abs: [], rap: [], comms: [] };
let currentUser = "";
let allUsersStatus = {}; // Stocke les statuts Firebase

const membresAutorises = {
    "november": "a",
    "alaska": "sf5th",
    "alabama": "pass1",
    "rhode": "5thSFG-Rhode06",
    "vermont": "Alpha-03vermont",
    "mississippi": "mississippitrofor",
    "montana": "pass4",
    "nevada": "5th-bravo03-SFG",
    "kentucky": "pass6",
    "iowa": "Charlie-19-s-f-g",
    "colorado": "Coloracoon11&7",
    "idaho": "pass9",
    "arizona": "pass10",
    "oregon": "pass11",
    "utha": "pass12",
    "maine": "pass13",
    "indiana": "pass14"
};

// --- INITIALISATION ---
window.onload = () => {
    setInterval(updateClock, 1000);
    setInterval(updateConnUI, 10000); 
};

window.refreshUIdisplay = function(data) {
    if (!data) return;
    
    if (data.users) {
        allUsersStatus = data.users;
        updateConnUI();
    }
    
    if (data.global) {
        archives = data.global.archives || archives;
        activeOps = data.global.activeOps || [];
        updateOpsUI();
        // Rafraîchir l'affichage des messages si on est sur l'onglet comms
        if(document.getElementById('comms').classList.contains('active')) displayComms();
    }
};

function persist() {
    if (typeof window.updateGlobalData === 'function') {
        window.updateGlobalData({ archives, activeOps });
    }
}

function updateClock() {
    const now = new Date();
    document.getElementById('system-clock').textContent = "SYSTEM_TIME: " + now.toLocaleString();
}

function handleLoginKey(e) { if(e.key === "Enter") accessGranted(); }

function accessGranted() {
    let u = document.getElementById('user').value.toLowerCase();
    let p = document.getElementById('pass').value;

    if (membresAutorises.hasOwnProperty(u) && membresAutorises[u] === p) {
        currentUser = u;
        if (window.updateStatus) window.updateStatus(u, 'online');

        document.getElementById('display-user').textContent = u.toUpperCase();
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        
        const noms = Object.keys(membresAutorises).sort();
        const optionsHTML = noms.map(m => `<option value="${m}">${m.toUpperCase()}</option>`).join('');
        document.getElementById('comms-dest').innerHTML = optionsHTML;
        document.getElementById('lead-op').innerHTML = optionsHTML;
        
        document.getElementById('user').value = ""; 
        document.getElementById('pass').value = "";
    } else {
        alert("ACCÈS REFUSÉ : IDENTIFIANTS INCORRECTS");
    }
}

function logout() {
    if(currentUser) {
        if (window.updateStatus) window.updateStatus(currentUser, 'offline');
    }
    currentUser = "";
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
}

function updateConnUI() {
    const list = document.getElementById('conn-list');
    if(!list) return;

    const noms = Object.keys(membresAutorises).sort();
    list.innerHTML = noms.map(u => {
        let status = "";
        let timeInfo = "";
        const userData = allUsersStatus[u];

        if (userData && userData.status === 'online') {
            status = '<span class="status-online" style="color:#00ff00; font-weight:bold;">● EN LIGNE</span>';
            timeInfo = "Actif maintenant";
        } else if (userData && userData.last_changed) {
            status = '<span class="status-offline" style="color:#ff4444;">○ HORS LIGNE</span>';
            timeInfo = "Depuis " + formatTimeAgo(userData.last_changed);
        } else {
            status = '<span class="status-offline" style="color:#666;">○ INCONNU</span>';
            timeInfo = "Jamais connecté";
        }

        return `<tr><td>${u.toUpperCase()}</td><td>${status}</td><td>${timeInfo}</td></tr>`;
    }).join('');
}

function formatTimeAgo(timestamp) {
    if(!timestamp) return "...";
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return diff + "s";
    if (diff < 3600) return Math.floor(diff / 60) + "m";
    if (diff < 86400) return Math.floor(diff / 3600) + "h";
    return Math.floor(diff / 86400) + "j";
}

// --- GESTION DES COMMUNICATIONS ---

function sendComm() {
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
    toggleCommsSub('archive');
}

function displayComms() {
    const list = document.getElementById('comms-archive-list');
    if(!list) return;

    const mesMessages = (archives.comms || []).filter(c => 
        c.from.toLowerCase() === currentUser.toLowerCase() || 
        c.to.toLowerCase() === currentUser.toLowerCase()
    );

    if (mesMessages.length === 0) {
        list.innerHTML = "<p style='color:#666; font-style:italic;'>Aucune transmission.</p>";
        return;
    }

    list.innerHTML = mesMessages.slice().reverse().map(c => {
        const isFromMe = c.from.toLowerCase() === currentUser.toLowerCase();
        const color = isFromMe ? '#00ff00' : '#00d4ff';
        return `
            <div style="border:1px solid ${color}; padding:10px; margin-bottom:10px; background:rgba(0,0,0,0.5);">
                <small style="color:#888">${c.time}</small><br>
                <strong style="color:${color}">${isFromMe ? "À: " + c.to.toUpperCase() : "DE: " + c.from.toUpperCase()}</strong>
                <p style="margin:5px 0 0 0;">${c.text}</p>
            </div>`;
    }).join('');
}

function toggleCommsSub(mode) {
    document.getElementById('comms-form').style.display = mode === 'saisie' ? 'block' : 'none';
    document.getElementById('comms-archive-list').style.display = mode === 'archive' ? 'block' : 'none';
    document.getElementById('sub-comms-saisie').classList.toggle('active', mode === 'saisie');
    document.getElementById('sub-comms-archive').classList.toggle('active', mode === 'archive');
    if(mode === 'archive') displayComms();
}

// --- RESTE DU CODE ---

function showTab(tabId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    if(tabId === 'connexions') updateConnUI();
    if(tabId === 'comms') displayComms();
}

function launchOp() {
    const lead = document.getElementById('lead-op').value;
    const vNames = document.querySelectorAll('.v-name');
    const vPax = document.querySelectorAll('.v-pax');
    let vehicles = [];
    vNames.forEach((v, i) => { if(v.value) vehicles.push({ name: v.value, pax: vPax[i].value }); });
    if(!lead || vehicles.length === 0) return alert("DONNÉES MANQUANTES");
    activeOps.push({ id: Date.now(), lead, units: vehicles });
    persist();
    vNames.forEach(v => v.value = ""); vPax.forEach(p => p.value = "");
    updateOpsUI();
    showTab('op-running');
}

function updateOpsUI() {
    const widget = document.getElementById('widget-count');
    if(widget) widget.textContent = activeOps.length;
    const list = document.getElementById('active-ops-list');
    if(!list) return;
    list.innerHTML = activeOps.length === 0 ? '<p style="font-style: italic; color: #444;">Aucune opération en cours.</p>' :
    activeOps.map(op => `
        <div class="op-card">
            <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                <strong style="color:var(--green-bright)">LEAD: ${op.lead.toUpperCase()}</strong>
                <button style="background:var(--alert-red); font-size:0.6rem;" onclick="finishOp(${op.id})">FIN</button>
            </div>
            <ul style="font-size:0.8rem; list-style:none; padding:0;">
                ${op.units.map(u => `<li><span style="color:#888;">${u.name}:</span> ${u.pax}</li>`).join('')}
            </ul>
        </div>
    `).join('');
}

function finishOp(id) { if(confirm("Terminer cette mission ?")) { activeOps = activeOps.filter(o => o.id !== id); persist(); updateOpsUI(); } }

function saveRapport() {
    const title = document.getElementById('rap-title').value;
    const text = document.getElementById('rap-text').value;
    if(!text) return alert("CONTENU VIDE");
    archives.rap.push({t: title, x: text, time: new Date().toLocaleString()});
    persist();
    document.getElementById('rap-title').value = ""; document.getElementById('rap-text').value = "";
    toggleRapSub('archive');
}

function toggleRapSub(mode) {
    document.getElementById('rap-form').style.display = mode === 'saisie' ? 'block' : 'none';
    document.getElementById('rap-archive-list').style.display = mode === 'archive' ? 'block' : 'none';
    document.getElementById('sub-rap-saisie').classList.toggle('active', mode === 'saisie');
    document.getElementById('sub-rap-archive').classList.toggle('active', mode === 'archive');
}
