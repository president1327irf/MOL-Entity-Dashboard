const scriptURL = "https://script.google.com/macros/s/AKfycbzCTWPOJypCiTOgccdsLcNQzQpniGDbdvObIoO_4nvcYyOLeL-nrYqFRdWqANY_1c_y/exec";

async function loadData() {
    try {
        const response = await fetch(scriptURL);
        const data = await response.json();
        const master = data.master; 
        const logs = data.logs;     
        
        const now = new Date();
        const logStats = {};
        const hosters = {};
        const entitiesTotal = {};

        // 1. Process Timeline & Leaderboard from Logs
        logs.forEach(row => {
            const time = new Date(row[0]);
            const hoster = row[1];
            const entity = row[2];
            if (row[3] === "Event Logging") {
                hosters[hoster] = (hosters[hoster] || 0) + 1;
                entitiesTotal[entity] = (entitiesTotal[entity] || 0) + 1;
                
                if (!logStats[entity]) logStats[entity] = { d7:0, d14:0, d28:0 };
                const diff = (now - time) / (1000*60*60*24);
                if (diff <= 7) logStats[entity].d7++;
                if (diff <= 14) logStats[entity].d14++;
                if (diff <= 28) logStats[entity].d28++;
            }
        });

        // Set Leaderboards
        const topHoster = Object.entries(hosters).sort((a,b) => b[1]-a[1])[0];
        const bestEntity = Object.entries(entitiesTotal).sort((a,b) => b[1]-a[1])[0];
        
        document.getElementById('best-hoster').innerText = topHoster ? `${topHoster[0]} (${topHoster[1]})` : "---";
        document.getElementById('best-entity').innerText = bestEntity ? bestEntity[0] : "---";

        // 2. Render Cards
        const grid = document.getElementById('entity-grid');
        grid.innerHTML = master.map(row => {
            const name = row[3];
            if (!name || name.toString().trim() === "") return "";
            
            const strikes = row[7] || 0;
            const notice = row[9] || "No current notices";
            const timeline = logStats[name] || { d7:0, d14:0, d28:0 };

            return `
                <div class="report-card">
                    <div class="card-header">
                        <span>OFFICIAL REPORT</span>
                        <span>STRIKES: ${strikes}</span>
                    </div>
                    <h3>${name}</h3>
                    <div class="timeline-grid">
                        <div class="time-box"><span>7D</span><strong>${timeline.d7}</strong></div>
                        <div class="time-box"><span>14D</span><strong>${timeline.d14}</strong></div>
                        <div class="time-box"><span>28D</span><strong>${timeline.d28}</strong></div>
                    </div>
                    <div class="notice-bar"><strong>NOTICE:</strong> ${notice}</div>
                </div>
            `;
        }).join('');
        
        document.getElementById('counter').innerText = `${master.filter(r => r[3]).length} ENTITIES LOADED`;
    } catch (e) { 
        console.error(e);
        document.getElementById('counter').innerText = "FETCH ERROR";
    }
}

loadData();