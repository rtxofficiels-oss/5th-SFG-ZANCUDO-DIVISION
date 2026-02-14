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

// --- SYNCHRONISATION CLOUD ---
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

// --- SYSTEME DE CONNEXION (Correction ReferenceError) ---
window.handleLoginKey = function(e) { 
    if(e.key === "Enter") window.accessGranted(); 
};

window.accessGranted = function() {
    let u = document.getElementById('user').value.toLowerCase();
    let p = document.getElementById('pass').value;
    
    if (membresAutorises[u] === p) {
        currentUser = u;
        if (window.updateStatus) window.updateStatus(u, 'online');
        
        document.getElementById('display-user').textContent = u.toUpperCase();
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        
        // Setup menus
        const noms = Object.keys(membresAutorises).sort();
        const opt = noms.map(m => `<option value="${m}">${m.toUpperCase()}</option>`).join('');
        
        if(document.getElementById('comms-dest')) document.getElementById('comms-dest').innerHTML = opt;
        if(document.getElementById('lead-op')) document.getElementById('lead-op').innerHTML = opt;
        
        updateConnUI();
        setInterval(() => {
            const clock = document.getElementById('system-clock');
            if(clock) clock.textContent = "SYSTEM_TIME: " + new Date().toLocaleString();
        }, 1000);
    } else { 
        alert("ACCÈS REFUSÉ : IDENTIFIANTS INVALIDES"); 
    }
};

// --- NAVIGATION (Correction TypeError classList) ---
window.showTab = function(tabId) {
    const sections = document.querySelectorAll('.content-section');
    const navItems = document.querySelectorAll('.nav-item');
    
    sections.forEach(s => s.classList.remove('active'));
    navItems.forEach(n => n.classList.remove('active'));
    
    const targetSection = document.getElementById(tabId);
    if(targetSection) targetSection.classList.add('active');
    
    // On cherche l'item de nav qui a le onclick correspondant
    navItems.forEach(n => {
        if(n.getAttribute('onclick')?.includes(tabId)) n.classList.add('active');
    });
};

function updateConnUI() {
    const list = document.getElementById('conn-list');
    if (!list) return; // Sécurité pour éviter le null 'innerHTML'
    
    list.innerHTML = Object.keys(membresAutorises).sort().map(u => {
        const online = allUsersStatus[u] && allUsersStatus[u].status === 'online';
        const color = online ? '#00ff00' : '#ff4444';
        return `<tr>
            <td style="color:#00d4ff; font-weight:bold;">${u.toUpperCase()}</td>
            <td style="color:${color}; font-weight:bold;">${online ? '● EN LIGNE' : '○ HORS LIGNE'}</td>
            <td style="color:#666; font-size:0.8rem;">SATELLITE SCAN...</td>
        </tr>`;
    }).join('');
}

function updateOpsUI() {
    const count = document.getElementById('widget-count');
    if(count) count.textContent = activeOps.length;
}

window.logout = function() {
    if(currentUser && window.updateStatus) window.updateStatus(currentUser, 'offline');
    location.reload();
};
