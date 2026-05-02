const scriptURL = "https://script.google.com/macros/s/AKfycbxREzC6Ie-mBqgvm0vVKmfsgDu27Hh1sKhOI7oZP5tCWBv-4ejM5wBnwQh93QsIHvaEnQ/exec";

async function loadData() {
    try {
        const response = await fetch(scriptURL);
        const data = await response.json();
        processDashboard(data);
    } catch (e) { 
        document.getElementById('counter').innerText = "SYNC ERROR";
    }
}

function processDashboard(data) {
    const { master, logs } = data;
    const now = new Date();
    
    // 1. Calculate the start of the current week (Monday 00:00:00)
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1));
    currentMonday.setHours(0,0,0,0);

    const hosterMap = {}; // Stores { "Name": { entity: "Name", count: 0 } }
    const entityMap = {}; // Stores { "EntityName": count }

    // 2. Scan Logs and Aggregate Data
    logs.forEach(row => {
        const timestamp = new Date(row[0]);
        const hosterName = row[1];
        const entityName = row[2];
        const actionType = row[3];

        // Only count "Event Logging" from THIS week
        if (actionType === "Event Logging" && timestamp >= currentMonday) {
            // Count for Hosters
            if (!hosterMap[hosterName]) {
                hosterMap[hosterName] = { entity: entityName, count: 0 };
            }
            hosterMap[hosterName].count++;

            // Count for Entities
            entityMap[entityName] = (entityMap[entityName] || 0) + 1;
        }
    });

    // 3. Determine the Winners Dynamically
    const sortedHosters = Object.entries(hosterMap)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.count - a.count);

    const sortedEntities = Object.entries(entityMap)
        .sort((a, b) => b[1] - a[1]);

    const bestHoster = sortedHosters[0] || { name: "N/A", count: 0 };
    const bestEntity = sortedEntities[0] || ["N/A", 0];

    // 4. Update the Top Cards
    document.getElementById('best-entity').innerText = bestEntity[0];
    document.getElementById('best-entity-xp').innerText = `${bestEntity[1]} LOGS RECORDED`;
    
    document.getElementById('best-hoster').innerText = bestHoster.name;
    document.getElementById('best-hoster-count').innerText = `${bestHoster.count} EVENTS COMPLETED`;

    // 5. Render the Leaderboard Table
    const lb = document.getElementById('host-leaderboard');
    lb.innerHTML = `
        <table style="width: 100%; border-collapse: collapse; color: white;">
            <thead>
                <tr style="border-bottom: 2px solid #ffca28; text-align: left; font-size: 0.75rem; color: #888;">
                    <th style="padding: 10px;">HOSTER</th>
                    <th style="padding: 10px;">ENTITY</th>
                    <th style="padding: 10px; text-align: right;">COUNT</th>
                </tr>
            </thead>
            <tbody>
                ${sortedHosters.slice(0, 5).map(item => `
                    <tr style="border-bottom: 1px solid #3d2a2a;">
                        <td style="padding: 12px; font-weight: bold;">${item.name}</td>
                        <td style="padding: 12px; color: #aaa; font-size: 0.85rem;">${item.entity}</td>
                        <td style="padding: 12px; text-align: right; color: #ffca28; font-weight: bold;">${item.count}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;

    // 6. Render Entity Grid
    const grid = document.getElementById('entity-grid');
    grid.innerHTML = master.map(row => {
        if (!row[3]) return "";
        const entName = row[3];
        const entEvents = entityMap[entName] || 0;
        return `
            <div class="report-card">
                <div class="status-tag ${entEvents > 0 ? 'growing' : 'dormant'}">
                    ${entEvents > 0 ? 'ACTIVE' : 'INACTIVE'}
                </div>
                <h3>${entName}</h3>
                <div style="display:flex; justify-content: space-between; font-size: 0.8rem; margin-top:10px;">
                    <span>XP: <strong>${row[6] || 0}</strong></span>
                    <span>EVENTS: <strong>${entEvents}</strong></span>
                </div>
            </div>
        `;
    }).join('');

    document.getElementById('counter').innerText = "LIVE DATA SYNCED";
}

loadData();