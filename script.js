let activeOps = [];
let archives = { hexa: [], res: [], abs: [], rap: [], comms: [] };
let currentUser = "";

// Suivi des dernières déconnexions
let userLastSeen = {};

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

window.onload = () => {
    const data = localStorage.getItem('gbzd_data');
    if(data) {
        const parsed = JSON.parse(data);
        archives = parsed.archives || archives;
        activeOps = parsed.activeOps || activeOps;
        userLastSeen = parsed.userLastSeen || {};
        updateOpsUI();
    }
    setInterval(updateClock, 1000);
    setInterval(updateConnUI, 10000); // Rafraichit la liste des connexions toutes les 10s
};

function persist() {
    localStorage.setItem('gbzd_data', JSON.stringify({ archives, activeOps, userLastSeen }));
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
        // Supprimer l'heure de déconnexion car il est en ligne
        delete userLastSeen[u];
        persist();

        document.getElementById('display-user').textContent = u.toUpperCase();
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
       
        const noms = Object.keys(membresAutorises).sort();
        const optionsHTML = noms.map(m => `<option value="${m}">${m.toUpperCase()}</option>`).join('');
        document.getElementById('comms-dest').innerHTML = optionsHTML;
        document.getElementById('lead-op').innerHTML = optionsHTML;
       
        document.getElementById('user').value = ""; document.getElementById('pass').value = "";
        updateConnUI();
    } else {
        alert("ACCÈS REFUSÉ : IDENTIFIANTS INCORRECTS");
    }
}

function logout() {
    if(currentUser) {
        // Enregistrer l'heure de déconnexion
        userLastSeen[currentUser] = Date.now();
        persist();
    }
    currentUser = "";
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('login-screen').style.display = 'flex';
}

// Fonction pour l'onglet Connexion
function updateConnUI() {
    const list = document.getElementById('conn-list');
    if(!list) return;

    const noms = Object.keys(membresAutorises).sort();
    list.innerHTML = noms.map(u => {
        let status = "";
        let timeInfo = "";

        if (u === currentUser) {
            status = '<span class="status-online">EN LIGNE</span>';
            timeInfo = "Actif maintenant";
        } else if (userLastSeen[u]) {
            status = '<span class="status-offline">HORS LIGNE</span>';
            timeInfo = "Depuis " + formatTimeAgo(userLastSeen[u]);
        } else {
            status = '<span class="status-offline">INCONNU</span>';
            timeInfo = "Aucune donnée";
        }

        return `<tr>
            <td>${u.toUpperCase()}</td>
            <td>${status}</td>
            <td>${timeInfo}</td>
        </tr>`;
    }).join('');
}

function formatTimeAgo(timestamp) {
    const diff = Math.floor((Date.now() - timestamp) / 1000);
    if (diff < 60) return diff + "s";
    if (diff < 3600) return Math.floor(diff / 60) + "m";
    if (diff < 86400) return Math.floor(diff / 3600) + "h";
    return Math.floor(diff / 86400) + "j";
}

function showTab(tabId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(t => t.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
   
    document.querySelectorAll('.nav-item').forEach(item => {
        if(item.getAttribute('onclick').includes(`'${tabId}'`)) item.classList.add('active');
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
    document.getElementById('widget-count').textContent = activeOps.length;
    const list = document.getElementById('active-ops-list');
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

function editOp(id) {
    const op = activeOps.find(o => o.id === id);
    if(!op) return;
    if(currentUser !== op.lead.toLowerCase()) return alert("ERREUR : SEUL LE LEAD PEUT MODIFIER.");
    document.getElementById('lead-op').value = op.lead;
    const vNames = document.querySelectorAll('.v-name');
    const vPax = document.querySelectorAll('.v-pax');
    op.units.forEach((u, i) => { if(i < vNames.length) { vNames[i].value = u.name; vPax[i].value = u.pax; } });
    activeOps = activeOps.filter(o => o.id !== id);
    showTab('depart');
    updateOpsUI();
}

function finishOp(id) { if(confirm("Terminer cette mission ?")) { activeOps = activeOps.filter(o => o.id !== id); persist(); updateOpsUI(); } }

function deleteArchive(type, index) {
    if(confirm("Confirmer la suppression ?")) {
        archives[type].splice(index, 1);
        persist();
        if(type === 'hexa' || type === 'res') displayArchives(type);
        if(type === 'abs') displayAbs();
        if(type === 'rap') displayRap();
        if(type === 'comms') displayComms();
    }
}

function saveOtage(type) {
    const p = type === 'hexa' ? 'h' : 'r';
    const data = {
        nom: document.getElementById(`${p}-nom`).value,
        prenom: document.getElementById(`${p}-prenom`).value,
        grade: document.getElementById(`${p}-grade`).value,
        reg: document.getElementById(`${p}-reg`).value,
        info: document.getElementById(`${p}-donne`).value,
        timestamp: new Date().toLocaleString()
    };
    if(!data.nom) return alert("NOM REQUIS");
    archives[type].push(data);
    persist();
    alert("DOSSIER ARCHIVÉ");
    [`${p}-nom`, `${p}-prenom`, `${p}-grade`, `${p}-reg`, `${p}-donne`].forEach(id => document.getElementById(id).value = "");
    toggleSub(type, 'archive');
}

function saveAbsence() {
    const data = {
        call: document.getElementById('abs-call').value,
        grade: document.getElementById('abs-grade').value,
        start: document.getElementById('abs-start').value,
        end: document.getElementById('abs-end').value,
        reason: document.getElementById('abs-raison').value
    };
    if(!data.call || !data.start) return alert("DONNÉES MANQUANTES");
    archives.abs.push(data);
    persist();
    ['abs-call', 'abs-grade', 'abs-start', 'abs-end', 'abs-raison'].forEach(id => document.getElementById(id).value = "");
    toggleAbsSub('archive');
}

function displayAbs() {
    document.getElementById('abs-archive-list').innerHTML = archives.abs.map((a, index) => `
        <div class="archive-card">
            <button class="btn-delete" onclick="deleteArchive('abs', ${index})">SUPPRIMER</button>
            <strong style="color:var(--green-bright)">${a.call}</strong> [${a.grade}]<br>
            <small>DU ${a.start} AU ${a.end}</small>
            <p style="margin-top:5px;">RAISON: ${a.reason}</p>
        </div>`).join('');
}

function saveRapport() {
    const title = document.getElementById('rap-title').value;
    const text = document.getElementById('rap-text').value;
    if(!text) return alert("CONTENU VIDE");
    archives.rap.push({t: title, x: text, time: new Date().toLocaleString()});
    persist();
    document.getElementById('rap-title').value = ""; document.getElementById('rap-text').value = "";
    toggleRapSub('archive');
}

function displayRap() {
    document.getElementById('rap-archive-list').innerHTML = archives.rap.map((r, index) => `
        <div class="archive-card">
            <button class="btn-edit" onclick="editRap(${index})">MODIFIER</button>
            <button class="btn-delete" onclick="deleteArchive('rap', ${index})">SUPPRIMER</button>
            <strong>${r.t}</strong> <small>(${r.time})</small><p>${r.x}</p>
        </div>`).join('');
}

function editRap(index) {
    const data = archives.rap[index];
    document.getElementById('rap-title').value = data.t;
    document.getElementById('rap-text').value = data.x;
    archives.rap.splice(index, 1);
    toggleRapSub('saisie');
}

function sendComm() {
    const dest = document.getElementById('comms-dest').value;
    const msg = document.getElementById('comms-msg').value;
    if(!msg) return alert("MESSAGE VIDE");
    archives.comms.push({ from: currentUser, to: dest, text: msg, time: new Date().toLocaleString() });
    persist();
    alert("TRANSMISSION RÉUSSIE");
    document.getElementById('comms-msg').value = "";
    toggleCommsSub('archive');
}

function displayComms() {
    const list = document.getElementById('comms-archive-list');
    const mesMessages = archives.comms.filter(c => c.from === currentUser || c.to === currentUser);
    list.innerHTML = mesMessages.length === 0 ? "<p>Aucun message.</p>" :
        mesMessages.reverse().map((c, index) => `
            <div class="archive-card" style="border-left-color: ${c.from === currentUser ? 'var(--green-bright)' : 'var(--edit-blue)'}">
                <button class="btn-delete" onclick="deleteArchive('comms', ${archives.comms.indexOf(c)})">EFFACER</button>
                <small style="color:#888">${c.time}</small><br>
                <strong>DE: ${c.from.toUpperCase()} | À: ${c.to.toUpperCase()}</strong>
                <p style="margin-top:10px; font-style: italic;">"${c.text}"</p>
            </div>`).join('');
}

function toggleSub(type, mode) {
    document.getElementById(`${type}-form`).style.display = (mode === 'saisie') ? 'block' : 'none';
    document.getElementById(`${type}-archive-list`).style.display = (mode === 'archive') ? 'block' : 'none';
    document.getElementById(`sub-${type}-saisie`).className = `sub-item ${mode === 'saisie' ? 'active' : ''}`;
    document.getElementById(`sub-${type}-archive`).className = `sub-item ${mode === 'archive' ? 'active' : ''}`;
    if(mode === 'archive') displayArchives(type);
}
function toggleAbsSub(m) {
    document.getElementById('abs-form').style.display = m=='saisie'?'block':'none';
    document.getElementById('abs-archive-list').style.display = m=='archive'?'block':'none';
    document.getElementById('sub-abs-saisie').className = `sub-item ${m === 'saisie' ? 'active' : ''}`;
    document.getElementById('sub-abs-archive').className = `sub-item ${m === 'archive' ? 'active' : ''}`;
    if(m=='archive') displayAbs();
}
function toggleRapSub(m) {
    document.getElementById('rap-form').style.display = m=='saisie'?'block':'none';
    document.getElementById('rap-archive-list').style.display = m=='archive'?'block':'none';
    document.getElementById('sub-rap-saisie').className = `sub-item ${m === 'saisie' ? 'active' : ''}`;
    document.getElementById('sub-rap-archive').className = `sub-item ${m === 'archive' ? 'active' : ''}`;
    if(m=='archive') displayRap();
}
function toggleCommsSub(m) {
    document.getElementById('comms-form').style.display = m=='saisie'?'block':'none';
    document.getElementById('comms-archive-list').style.display = m=='archive'?'block':'none';
    document.getElementById('sub-comms-saisie').className = `sub-item ${m === 'saisie' ? 'active' : ''}`;
    document.getElementById('sub-comms-archive').className = `sub-item ${m === 'archive' ? 'active' : ''}`;
    if(m=='archive') displayComms();
}
function displayArchives(type) {
    const list = document.getElementById(`${type}-archive-list`);
    list.innerHTML = archives[type].length === 0 ? "<p>Aucune donnée.</p>" :
        archives[type].map((o, index) => `
            <div class="archive-card">
                <button class="btn-edit" onclick="editOtage('${type}', ${index})">MODIFIER</button>
                <button class="btn-delete" onclick="deleteArchive('${type}', ${index})">SUPPRIMER</button>
                <strong style="color:var(--green-bright)">${o.nom} ${o.prenom}</strong> [${o.grade}]<br>
                <small>Régiment: ${o.reg} | Enregistré le: ${o.timestamp}</small>
                <p style="margin-top:10px; border-top:1px solid #333; padding-top:5px;">${o.info}</p>
            </div>`).join('');
}
function editOtage(type, index) {
    const p = type === 'hexa' ? 'h' : 'r';
    const data = archives[type][index];
    document.getElementById(`${p}-nom`).value = data.nom;
    document.getElementById(`${p}-prenom`).value = data.prenom;
    document.getElementById(`${p}-grade`).value = data.grade;
    document.getElementById(`${p}-reg`).value = data.reg;
    document.getElementById(`${p}-donne`).value = data.info;
    archives[type].splice(index, 1);
    toggleSub(type, 'saisie');
}