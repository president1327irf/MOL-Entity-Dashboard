async function loadDashboard() {
    const response = await fetch("https://script.google.com/macros/s/AKfycbzCTWPOJypCiTOgccdsLcNQzQpniGDbdvObIoO_4nvcYyOLeL-nrYqFRdWqANY_1c_y/exec");
    const data = await response.json();
    const master = data.master;
    const logs = data.logs;

    // 1. Process Logs for Timeline & Leaderboard
    const logStats = {};
    const hosterCounts = {};
    const now = new Date();

    logs.forEach(row => {
        const time = new Date(row[0]);
        const hoster = row[1];
        const entity = row[2];
        
        if (row[3] === "Event Logging") {
            hosterCounts[hoster] = (hosterCounts[hoster] || 0) + 1;
            if (!logStats[entity]) logStats[entity] = { d7: 0, d14: 0, d28: 0 };
            
            const diffDays = (now - time) / (1000 * 60 * 60 * 24);
            if (diffDays <= 7) logStats[entity].d7++;
            if (diffDays <= 14) logStats[entity].d14++;
            if (diffDays <= 28) logStats[entity].d28++;
        }
    });

    // Set Leaderboard
    const topHoster = Object.entries(hosterCounts).sort((a,b) => b[1]-a[1])[0];
    document.getElementById('best-hoster').innerText = topHoster ? `${topHoster[0]} (${topHoster[1]})` : "N/A";

    // 2. Render Cards (Merging Master Data with Log Stats)
    const grid = document.getElementById('entity-grid');
    grid.innerHTML = master.map(row => {
        const name = row[3];
        if (!name) return "";
        const strikes = row[7];
        const timeline = logStats[name] || { d7: 0, d14: 0, d28: 0 };

        return `
            <div class="report-card">
                <div class="card-header">
                    <h3>${name}</h3>
                    <span class="strike-count">STRIKES: ${strikes}</span>
                </div>
                <div class="timeline-row">
                    <div class="t-box"><span>7D</span><strong>${timeline.d7}</strong></div>
                    <div class="t-box"><span>14D</span><strong>${timeline.d14}</strong></div>
                    <div class="t-box"><span>28D</span><strong>${timeline.d28}</strong></div>
                </div>
                <div class="notice-area">${row[9] || "No current notices"}</div>
            </div>
        `;
    }).join('');
}