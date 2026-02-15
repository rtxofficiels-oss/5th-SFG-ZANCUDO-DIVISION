(function() {
    "use strict";

    // --- VARIABLES D'ÉTAT ---
    let activeOps = [];
    let archives = { hexa: [], res: [], abs: [], rap: [], comms: [], ops: [] };
    let currentUser = "";
    let allUsersStatus = {};
    let currentDefcon = "5";

    // Tes mots de passe (Base64)
    const _accessKeys = {
        "november": "MjExMA==", "alaska": "c2Y1dGg=", "alabama": "cGFzczE=", 
        "rhode": "NXRoU0ZHLVJob2RlMDY=", "vermont": "QWxwaGEtMDN2ZXJtb250",
        "mississippi": "bWlzc2lzc2lwcGl0cm9mb3I=", "montana": "cGFzczQ=",
        "nevada": "NXRoLWJyYXZvMDMtU0ZH", "kentucky": "cGFzczY=", 
        "iowa": "Q2hhcmxpZS0xOS1zLWYtZw==", "colorado": "Q29sb3JhY29vbjExJjc=",
        "idaho": "cGFzczk=", "arizona": "cGFzczEw", "oregon": "cGFzczEx",
        "utha": "cGFzczEy", "maine": "cGFzczEz", "indiana": "cGFzczE0"
    };

    // --- CONNEXION ET AUTHENTIFICATION ---
    window.handleLoginKey = (e) => { if(e.key === "Enter") window.accessGranted(); };

    window.accessGranted = function() {
        const u = document.getElementById('user').value.toLowerCase().trim();
        const p = btoa(document.getElementById('pass').value);

        if (_accessKeys[u] && _accessKeys[u] === p) {
            currentUser = u;
            if (window.updateStatus) window.updateStatus(u, 'online');
            
            document.getElementById('display-user').textContent = u.toUpperCase();
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'flex';
            
            const opt = Object.keys(_accessKeys).sort().map(m => `<option value="${m}">${m.toUpperCase()}</option>`).join('');
            if(document.getElementById('comms-dest')) document.getElementById('comms-dest').innerHTML = opt;
            if(document.getElementById('lead-op')) document.getElementById('lead-op').innerHTML = opt;
            
            updateConnUI();
            applyDefconUI(currentDefcon);

            setInterval(() => {
                const clock = document.getElementById('system-clock');
                if(clock) clock.textContent = "SYSTEM_TIME: " + new Date().toLocaleString('fr-FR');
            }, 1000);
        } else {
            alert("ACCÈS REFUSÉ");
        }
    };

    // --- NAVIGATION (ONGLETS) ---
    window.showTab = (id) => {
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        
        const target = document.getElementById(id);
        if(target) target.classList.add('active');

        // Mise en surbrillance du bouton de menu
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            if(item.textContent.toLowerCase().includes(id.substring(0,3))) item.classList.add('active');
        });

        if(id === 'connexions') updateConnUI();
        if(['rap', 'hexa', 'res', 'abs', 'comms', 'op-running'].includes(id)) renderList(id);
        if(id === 'op-running') updateOpsUI();
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

    // --- GESTION DES MISSIONS ---
    window.launchOp = function() {
        let vels = [];
        for (let i = 1; i <= 8; i++) {
            let n = document.getElementById(`v${i}-name`).value.trim();
            let p = document.getElementById(`v${i}-pax`).value.trim();
            if (n !== "") vels.push({ name: n, pax: p });
        }
        if (vels.length === 0) return alert("ERREUR : AUCUN VÉHICULE");
        
        activeOps.push({ 
            lead: document.getElementById('lead-op').value, 
            vehicules: vels, 
            date: new Date().toLocaleString('fr-FR'), 
            agent: currentUser 
        });
        persist(); 
        window.showTab('op-running');
        for (let i = 1; i <= 8; i++) { 
            document.getElementById(`v${i}-name`).value = ""; 
            document.getElementById(`v${i}-pax`).value = ""; 
        }
    };

    function updateOpsUI() {
        const list = document.getElementById('active-ops-list');
        const count = document.getElementById('widget-count');
        if(count) count.textContent = activeOps.length;
        if(!list) return;

        list.innerHTML = activeOps.map((op, i) => `
            <div class="op-card" style="border:1px solid #4b5320; padding:15px; margin-bottom:10px; background:rgba(0,0,0,0.8);">
                <strong style="color:var(--green-bright);">LEAD: ${op.lead.toUpperCase()}</strong><br>
                ${op.vehicules.map(v => `<div>🛰️ ${v.name} | PAX: ${v.pax}</div>`).join('')}
                <div style="display:flex; gap:10px; margin-top:10px;">
                    <button onclick="window.closeOp(${i})" style="flex:1; background:#8b0000; color:white; border:none; padding:5px; cursor:pointer;">TERMINER MISSION</button>
                </div>
            </div>`).join('') || "AUCUNE OPÉRATION EN COURS";
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
            date: new Date().toLocaleString('fr-FR')
        });

        activeOps.splice(i, 1);
        persist();
        updateOpsUI();
    };

    // --- ARCHIVES & RAPPORTS ---
    window.saveRapport = function() {
        const t = document.getElementById('rap-title').value;
        const txt = document.getElementById('rap-text').value;
        if(!t || !txt) return alert("CHAMPS VIDES");
        if (!archives.rap) archives.rap = [];
        archives.rap.push({ title: t, text: txt, agent: currentUser, date: new Date().toLocaleString('fr-FR') });
        persist(); 
        window.toggleSub('rap', 'archive');
    };

    window.saveOtage = function(type) {
        const n = document.getElementById(`${type === 'hexa' ? 'h' : 'r'}-nom`).value;
        const i = document.getElementById(`${type === 'hexa' ? 'h' : 'r'}-donne`).value;
        if(!n) return alert("NOM REQUIS");
        archives[type].push({ title: n, text: i, agent: currentUser, date: new Date().toLocaleString('fr-FR') });
        persist();
        window.toggleSub(type, 'archive');
    };

    window.saveAbsence = function() {
        const call = document.getElementById('abs-call').value;
        const raison = document.getElementById('abs-raison').value;
        if(!call) return alert("NOM REQUIS");
        archives.abs.push({ title: "ABSENCE: " + call, text: raison, agent: currentUser, date: new Date().toLocaleString('fr-FR') });
        persist();
        window.toggleAbsSub('archive');
    };

    window.deleteArchive = function(type, index) {
        const item = archives[type][index];
        if (currentUser !== item.agent.toLowerCase() && currentUser !== "november") return alert("ACCÈS REFUSÉ (PROPRIÉTAIRE UNIQUEMENT)");
        if(confirm("SUPPRIMER DÉFINITIVEMENT ?")) { 
            archives[type].splice(index, 1); 
            persist(); 
            renderList(type); 
        }
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
                <p style="white-space: pre-line; color:#ccc;">${item.text || item.raison || ''}</p>
            </div>`).reverse().join('') || "AUCUNE ARCHIVE";
    }

    // --- DEFCON & SYNC ---
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
        const sel = document.getElementById('defcon-selector');
        const dash = document.getElementById('dashboard');
        const over = document.getElementById('defcon-overlay');
        const wid = document.getElementById('op-widget');

        if (sel) { sel.value = val; sel.style.color = style.main; }
        if (over) over.style.background = style.bg;
        if (dash) { dash.style.borderColor = style.main; dash.style.boxShadow = `inset 0 0 30px ${style.main}22`; }
        if (wid) (val === "1" || val === "2") ? wid.classList.add('blink-active') : wid.classList.remove('blink-active');
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
        if (currentUser !== "") {
            updateConnUI();
            updateOpsUI();
        }
    };

    function persist() {
        if (window.updateGlobalData && currentUser !== "") {
            window.updateGlobalData({ archives, activeOps, defcon: currentDefcon });
        }
    }

    function updateConnUI() {
        const list = document.getElementById('conn-list');
        if(!list) return;
        list.innerHTML = Object.keys(_accessKeys).sort().map(u => {
            const on = allUsersStatus[u] && allUsersStatus[u].status === 'online';
            return `<tr><td>${u.toUpperCase()}</td><td style="color:${on?'#00ff00':'#ff4444'}">${on?'● EN LIGNE':'○ HORS LIGNE'}</td></tr>`;
        }).join('');
    }

    window.logout = () => { 
        if(window.updateStatus) window.updateStatus(currentUser, 'offline');
        location.reload(); 
    };

})();
