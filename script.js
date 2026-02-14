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
    // On ne charge plus depuis localStorage, Firebase s'en occupe via refreshUIdisplay
    setInterval(updateClock, 1000);
    setInterval(updateConnUI, 10000); // Rafraîchit l'affichage du temps écoulé
};

// Cette fonction est appelée par le code Firebase que tu as mis dans index.html
window.refreshUIdisplay = function(data) {
    if (!data) return;
    
    // 1. Mise à jour des statuts de connexion
    if (data.users) {
        allUsersStatus = data.users;
        updateConnUI();
    }
    
    // 2. Mise à jour des données globales (Archives & Ops)
    if (data.global) {
        archives = data.global.archives || archives;
        activeOps = data.global.activeOps || [];
        updateOpsUI();
    }
};

// Remplace l'ancien persist() pour écrire sur le Cloud
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
        
        // Signalement de connexion à Firebase
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

// --- INTERFACE DES CONNEXIONS (TEMPS RÉEL) ---
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

        return `<tr>
            <td>${u.toUpperCase()}</td>
            <td>${status}</td>
            <td>${timeInfo}</td>
        </tr>`;
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

// --- RESTE DES FONCTIONS (OPÉRATIONS / ARCHIVES) ---
// Note: Le reste de tes fonctions (showTab, launchOp, etc.) reste identique 
// mais elles utilisent maintenant le persist() synchronisé.

function showTab(tabId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => {
        if(item.getAttribute('onclick') && item.getAttribute('onclick').includes(`'${tabId}'`)) item.classList.add('active');
    });

    if(tabId === 'connexions') updateConnUI();
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
                <div>
                    <button style="background:var(--edit-blue); font-size:0.6rem; margin-right:5px;" onclick="editOp(${op.id})">MODIFIER</button>
                    <button style="background:var(--alert-red); font-size:0.6rem;" onclick="finishOp(${op.id})">FIN</button>
                </div>
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

// ... Garde tes autres fonctions de gestion (deleteArchive, saveOtage, etc.) 
// assure-toi juste qu'elles appellent bien persist() à la fin.
