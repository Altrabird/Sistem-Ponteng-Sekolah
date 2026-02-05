// CONFIGURATION
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx6zN_PJSdm7BtScD20me4JfkwkxAPOU52U5RwqsD8yg9hfn-UNfyoc_go2b_7R4pcVKw/exec"; 

// START APP
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard(); 
});

// FETCH DATA
function loadDashboard() {
    const dashboardDiv = document.getElementById('dashboardData');
    dashboardDiv.innerHTML = "<p>Scanning attendance logs...</p>";

    fetch(WEB_APP_URL)
    .then(response => response.json())
    .then(data => {
        // DRAW DASHBOARD LEADERBOARD 📊
        if (!data.dashboard || data.dashboard.length === 0) {
            dashboardDiv.innerHTML = "<p>✅ No absent students found.</p>";
            return;
        }

        let html = '<ul class="dashboard-list">';
        
        // Sort: Murid paling bermasalah di atas
        data.dashboard.sort((a, b) => b.Consecutive_Warn_Level - a.Consecutive_Warn_Level);

        data.dashboard.forEach(student => {
            let warningClass = "no-warn";
            let warningText = "No Warnings";

            // Warning Logic
            if (student.Consecutive_Warn_Level > 0) {
                warningClass = "warn-consecutive";
                warningText = `⚠️ Consecutive Warning Level ${student.Consecutive_Warn_Level}`;
            } else if (student.NonConsec_Warn_Level > 0) {
                warningClass = "warn-total";
                warningText = `⚠️ Non-Consecutive Warning Level ${student.NonConsec_Warn_Level}`;
            }

            // --- LOGIK BARU: Susun Tarikh ---
            // Kita gabungkan array tarikh menjadi satu string panjang
            let datesListHtml = "";
            if (student.All_Dates && student.All_Dates.length > 0) {
                datesListHtml = `
                    <details class="date-details">
                        <summary>Lihat semua ${student.Total_Absence} tarikh</summary>
                        <p class="date-list">${student.All_Dates.join(', ')}</p>
                    </details>
                `;
            }
            // ---------------------------------

            html += `
                <li class="student-card ${warningClass}">
                    <div class="card-info">
                        <strong>${student.Name}</strong> <span class="class-tag">${student.Class}</span><br>
                        <small>Last Absent: ${student.Last_Absent_Date}</small>
                    </div>
                    
                    <div class="card-stats">
                        <span class="stat">🔥 Streak: ${student.Current_Streak}</span>
                        <span class="stat">Total: ${student.Total_Absence}</span>
                    </div>

                    ${datesListHtml} 
                    
                    <div class="card-badge">${warningText}</div>
                </li>
            `;
        });
        html += '</ul>';
        dashboardDiv.innerHTML = html;
    })
    .catch(error => {
        console.error('Error:', error);
        dashboardDiv.innerHTML = "<p>Error loading data.</p>";
    });
}