const scriptURL = "PASTE_YOUR_NEW_URL_HERE";

async function loadData() {
    try {
        const response = await fetch(scriptURL);
        const data = await response.json();
        processDashboard(data);
    } catch (e) { 
        console.error("Fetch Error:", e);
    }
}

function processDashboard(data) {
    const { master, logs } = data;
    const now = new Date();
    
    // Monday Reset Logic
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    currentMonday.setHours(0,0,0,0);

    const logStats = {};
    const hosterCounts = {};
    let topXP = -1;
    let topEntityName = "N/A";

    // 1. Process Master Tracker (Tab 3)
    master.forEach(row => {
        const name = row[3]; // Entity Name
        const xp = parseInt(row[6]) || 0; // Weekly XP
        if (name && xp > topXP) {
            topXP = xp;
            topEntityName = name;
        }
    });

    // 2. Process Logs (Tab 17) - Mapping Col B (Hoster) and Col C (Entity)
    logs.forEach(row => {
        const time = new Date(row[0]);
        const hoster = row[1]; 
        const entity = row[2];
        
        if (row[3] === "Event Logging" && time >= currentMonday) {
            // Leaderboard data
            if (hoster) hosterCounts[hoster] = (hosterCounts[hoster] || 0) + 1;
            
            // Entity activity data
            if (entity) {
                if (!logStats[entity]) logStats[entity] = 0;
                logStats[entity]++;
            }
        }
    });

    // Update Top Cards
    document.getElementById('best-entity').innerText = topEntityName;
    document.getElementById('best-entity-xp').innerText = `${topXP} XP THIS WEEK`;
    
    const topHoster = Object.entries(hosterCounts).sort((a,b) => b[1]-a[1])[0];
    document.getElementById('best-hoster').innerText = topHoster ? topHoster[0] : "---";
    document.getElementById('best-hoster-count').innerText = topHoster ? `${topHoster[1]} EVENTS HOSTED` : "0 EVENTS";

    // 3. Render Grid with Status Tags
    const grid = document.getElementById('entity-grid');
    grid.innerHTML = master.map(row => {
        const name = row[3];
        if (!name) return "";
        
        const eventCount = logStats[name] || 0;
        const status = eventCount > 3 ? 'GROWING' : 'DORMANT'; // Custom threshold
        const statusClass = eventCount > 3 ? 'status-growing' : 'status-dormant';

        return `
            <div class="report-card">
                <div class="status-tag ${statusClass}">${status}</div>
                <h3>${name}</h3>
                <div class="stats-row">
                    <div class="stat-item"><span>XP</span><strong>${row[6] || 0}</strong></div>
                    <div class="stat-item"><span>EVENTS</span><strong>${eventCount}</strong></div>
                    <div class="stat-item"><span>STRIKES</span><strong>${row[7] || 0}</strong></div>
                </div>
            </div>
        `;
    }).join('');

    // 4. Render Host Leaderboard
    const lb = document.getElementById('host-leaderboard');
    lb.innerHTML = Object.entries(hosterCounts)
        .sort((a,b) => b[1]-a[1])
        .slice(0, 5)
        .map((entry, i) => `
            <div class="leader-row">
                <span>${i+1}. ${entry[0]}</span>
                <span>${entry[1]} Events</span>
            </div>
        `).join('');

    document.getElementById('counter').innerText = "LIVE SYNCED";
}

loadData();