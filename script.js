const scriptURL = "https://script.google.com/macros/s/AKfycbzRJ2E7WrLcg5mPd4bUsVo9TtJVPF2QfDj2zRrF_dsEWP5kr11J9tKNE8UlNXPhOhh37A/exec";

async function loadData() {
    try {
        const response = await fetch(scriptURL);
        const data = await response.json();
        renderDashboard(data);
    } catch (error) {
        console.error("Error fetching data:", error);
        document.getElementById('counter').innerText = "CONNECTION ERROR";
    }
}

function renderDashboard(data) {
    const grid = document.getElementById('entity-grid');
    document.getElementById('counter').innerText = `${data.length} TOTAL ENTITIES`;
    
    grid.innerHTML = data.map((row) => {
        const entityName = row[3] || "UNKNOWN";
        const eventXPS = row[6] || 0;
        const strikeRaw = row[7] ? row[7].toString().toUpperCase() : "0";
        const noticeInfo = row[9] || "";
        const licenseType = row[10] || "STANDARD";

        const isExempt = strikeRaw.includes("EXEMPT");
        const displayEvents = isExempt ? "EXEMPTED" : eventXPS;
        const strikes = isExempt ? 0 : (parseInt(strikeRaw) || 0);

        let accentColor = '#2ecc71';
        let statusText = 'GROWING - ACTIVE';
        let statusClass = 'card-good';
        let trendIcon = '▲';

        if (isExempt) {
            accentColor = '#3498db';
            statusClass = 'card-exempt';
            statusText = 'OFFICIAL - EXEMPT';
        } else if (strikes >= 2) {
            accentColor = '#e74c3c';
            statusClass = 'card-declining';
            statusText = 'DECLINING - ALERT';
            trendIcon = '▼';
        } else if (eventXPS === 0) {
            accentColor = '#95a5a6';
            statusClass = 'card-dormant';
            statusText = 'STABLE - DORMANT';
        }

        let noticeHTML = (noticeInfo && noticeInfo !== "N/A" && noticeInfo !== "") ? 
            `<div class="notice-bar"><strong>ON NOTICE:</strong> ${noticeInfo}</div>` : "";

        return `
          <div class="report-card ${statusClass}">
            <div class="status-row" style="color: ${accentColor}">
              <span>${statusText}</span>
              <span class="license-tag">${licenseType}</span>
            </div>
            <h3>${entityName}</h3>
            <div class="stats-grid">
              <div class="stat-item"><span class="stat-label">Event XP</span><span class="stat-value">${displayEvents}</span></div>
              <div class="stat-item"><span class="stat-label">STRIKES</span><span class="stat-value">${isExempt ? 'N/A' : strikes}</span></div>
              <div class="stat-item"><span class="stat-label">GROWTH</span><span class="stat-value" style="color: ${accentColor}">${trendIcon} 0%</span></div>
            </div>
            ${noticeHTML}
          </div>`;
    }).join('');
}


loadData();

// Refresh data every 2 minutes
setInterval(loadData, 120000);