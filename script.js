const scriptURL = "https://script.google.com/macros/s/AKfycbxREzC6Ie-mBqgvm0vVKmfsgDu27Hh1sKhOI7oZP5tCWBv-4ejM5wBnwQh93QsIHvaEnQ/exec";

async function loadData() {
    try {
        const response = await fetch(scriptURL);
        const data = await response.json();
        processDashboard(data);
    } catch (e) { 
        document.getElementById('entity-grid').innerHTML = `<div style="color:white;text-align:center;">FETCH ERROR: Check Apps Script Permissions</div>`;
    }
}

function processDashboard(data) {
    const { master, logs } = data;
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    const twoWeeksAgo = new Date(now.getTime() - (14 * 24 * 60 * 60 * 1000));

    const logStats = {};
    const hosterCounts = {};
    const entityGrowth = {}; // To track logs this week vs last week

    logs.forEach(row => {
        const time = new Date(row[0]);
        const hoster = row[1]; // Column B
        const entity = row[2]; // Column C
        const type = row[3];   // Column D

        if (type === "Event Logging") {
            // Leaderboard logic
            hosterCounts[hoster] = (hosterCounts[hoster] || 0) + 1;
            
            // Timeline logic
            if (!logStats[entity]) logStats[entity] = { d7:0, d14:0, d28:0, currentWeek:0, lastWeek:0 };
            const diff = (now - time) / (1000*60*60*24);
            if (diff <= 7) { logStats[entity].d7++; logStats[entity].currentWeek++; }
            else if (diff <= 14) { logStats[entity].d14++; logStats[entity].lastWeek++; }
            if (diff <= 28) logStats[entity].d28++;
        }
    });

    const topHoster = Object.entries(hosterCounts).sort((a,b) => b[1]-a[1])[0];
    document.getElementById('best-hoster').innerText = topHoster ? `${topHoster[0]} (${topHoster[1]})` : "---";

    const grid = document.getElementById('entity-grid');
    grid.innerHTML = master.map(row => {
        const name = row[3]; // Entity Name from Tab 3
        if (!name) return "";
        
        const xp = row[6] || 0; // Assuming Column G is Event XP
        const strikes = row[7] || 0;
        const timeline = logStats[name] || { d7:0, d14:0, d28:0, currentWeek:0, lastWeek:0 };
        
        // Simple Growth Calculation
        const growth = timeline.lastWeek === 0 ? 0 : Math.round(((timeline.currentWeek - timeline.lastWeek) / timeline.lastWeek) * 100);
        const growthColor = growth >= 0 ? "#2ecc71" : "#e74c3c";

        return `
            <div class="report-card">
                <div class="card-header">
                    <span>XP: ${xp}</span>
                    <span>STRIKES: ${strikes}</span>
                </div>
                <h3>${name}</h3>
                <div class="timeline-grid">
                    <div class="time-box"><span>7D</span><strong>${timeline.d7}</strong></div>
                    <div class="time-box"><span>14D</span><strong>${timeline.d14}</strong></div>
                    <div class="time-box"><span>28D</span><strong>${timeline.d28}</strong></div>
                </div>
                <div class="growth-tag" style="color:${growthColor}">
                    Growth: ${growth > 0 ? '+' : ''}${growth}% (Events)
                </div>
                <div class="notice-bar">${row[9] || "No current notices"}</div>
            </div>
        `;
    }).join('');
    
    document.getElementById('counter').innerText = "SYNCED";
}

loadData();