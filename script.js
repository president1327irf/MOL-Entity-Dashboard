const scriptURL = "https://script.google.com/macros/s/AKfycbxREzC6Ie-mBqgvm0vVKmfsgDu27Hh1sKhOI7oZP5tCWBv-4ejM5wBnwQh93QsIHvaEnQ/exec";

async function loadData() {
    const counter = document.getElementById('counter');
    try {
        const response = await fetch(scriptURL);
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        processDashboard(data);
    } catch (e) { 
        counter.innerText = "ERROR: CHECK GOOGLE SCRIPT PERMISSIONS";
        console.error(e);
    }
}

function processDashboard(data) {
    const { master, logs } = data;
    const now = new Date();
    
    // Calculate Monday 00:00:00
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    currentMonday.setHours(0,0,0,0);

    const logStats = {};
    const hosterCounts = {};
    let topXP = -1;
    let topEntityName = "N/A";

    // 1. Process Master (Tab 3) - XP reset logic
    master.forEach(row => {
        const name = row[3]; 
        const xp = parseInt(row[6]) || 0; 
        if (name && xp > topXP) {
            topXP = xp;
            topEntityName = name;
        }
    });

    // 2. Process Logs (Tab 17) - Filtered for this week
    logs.forEach(row => {
        const time = new Date(row[0]);
        const hoster = row[1]; // User
        const entity = row[2]; // Entity
        
        if (row[3] === "Event Logging" && time >= currentMonday) {
            if (hoster) hosterCounts[hoster] = (hosterCounts[hoster] || 0) + 1;
            if (entity) {
                logStats[entity] = (logStats[entity] || 0) + 1;
            }
        }
    });

    // Update Top 2 Cards
    document.getElementById('best-entity').innerText = topEntityName || "NONE";
    document.getElementById('best-entity-xp').innerText = `${topXP} XP THIS WEEK`;
    
    const sortedHosters = Object.entries(hosterCounts).sort((a,b) => b[1]-a[1]);
    const topHoster = sortedHosters[0];
    document.getElementById('best-hoster').innerText = topHoster ? topHoster[0] : "---";
    document.getElementById('best-hoster-count').innerText = topHoster ? `${topHoster[1]} EVENTS` : "0 EVENTS";

    // 3. Render Main Grid
    const grid = document.getElementById('entity-grid');
    grid.innerHTML = master.map(row => {
        const name = row[3];
        if (!name) return "";
        
        const events = logStats[name] || 0;
        const statusClass = events > 2 ? 'growing' : 'dormant';
        const statusText = events > 2 ? 'ACTIVE' : 'DORMANT';

        return `
            <div class="report-card">
                <div class="status-tag ${statusClass}">${statusText}</div>
                <h3 style="margin: 5px 0;">${name}</h3>
                <div style="display:flex; justify-content: space-between; margin-top:10px; font-size: 0.9rem;">
                    <span>XP: <strong>${row[6] || 0}</strong></span>
                    <span>EVENTS: <strong>${events}</strong></span>
                    <span>STRIKES: <strong>${row[7] || 0}</strong></span>
                </div>
            </div>
        `;
    }).join('');

    // 4. Render Leaderboard
    const lb = document.getElementById('host-leaderboard');
    lb.innerHTML = sortedHosters.slice(0, 5).map((entry, i) => `
        <div class="leader-row">
            <span>${i+1}. ${entry[0]}</span>
            <span style="color: #ffca28;">${entry[1]} Logs</span>
        </div>
    `).join('');

    document.getElementById('counter').innerText = "LIVE SYNCED";
}

loadData();