// CONFIGURATION
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx6zN_PJSdm7BtScD20me4JfkwkxAPOU52U5RwqsD8yg9hfn-UNfyoc_go2b_7R4pcVKw/exec"; // Pastikan URL anda ada di sini

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
        
        // 1. DATA PROCESSING UNTUK GRAF 📊
        processAndDrawCharts(data.dashboard);

        // 2. DRAW DASHBOARD LIST (Sama seperti sebelum ini)
        if (!data.dashboard || data.dashboard.length === 0) {
            dashboardDiv.innerHTML = "<p>✅ No absent students found.</p>";
            return;
        }

        let html = '<ul class="dashboard-list">';
        
        // Sort by warning level
        data.dashboard.sort((a, b) => b.Consecutive_Warn_Level - a.Consecutive_Warn_Level);

        data.dashboard.forEach(student => {
            let warningClass = "no-warn";
            let warningText = "No Warnings";

            if (student.Consecutive_Warn_Level > 0) {
                warningClass = "warn-consecutive";
                warningText = `⚠️ Consecutive Warning Level ${student.Consecutive_Warn_Level}`;
            } else if (student.NonConsec_Warn_Level > 0) {
                warningClass = "warn-total";
                warningText = `⚠️ Non-Consecutive Warning Level ${student.NonConsec_Warn_Level}`;
            }

            let datesListHtml = "";
            if (student.All_Dates && student.All_Dates.length > 0) {
                datesListHtml = `
                    <details class="date-details">
                        <summary>Lihat semua ${student.Total_Absence} tarikh</summary>
                        <p class="date-list">${student.All_Dates.join(', ')}</p>
                    </details>
                `;
            }

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

// --- FUNGSI BARU: LUKIS GRAF ---
function processAndDrawCharts(students) {
    if (!students) return;

    // A. KIRA DATA (Statistics)
    let totalStudents = students.length;
    let under10 = 0;
    let over10 = 0;
    
    // Objek untuk kira Tahun 1 - 6
    let yearCounts = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 };

    students.forEach(s => {
        // 1. Kira Bawah/Lebih 10 Hari
        if (s.Total_Absence >= 10) {
            over10++;
        } else {
            under10++;
        }

        // 2. Kira Mengikut Tahun (Andaikan format kelas bermula dengan nombor, cth: "1 Anggerik")
        let firstChar = s.Class.trim().charAt(0);
        if (yearCounts[firstChar] !== undefined) {
            yearCounts[firstChar]++;
        }
    });

    // B. LUKIS GRAF 1: RINGKASAN (Pie Chart)
    const ctxSummary = document.getElementById('summaryChart').getContext('2d');
    
    // Hapus graf lama jika ada (untuk elak glitch bila refresh)
    if (window.myPieChart) window.myPieChart.destroy();

    window.myPieChart = new Chart(ctxSummary, {
        type: 'doughnut',
        data: {
            labels: ['Bawah 10 Hari', 'Lebih 10 Hari'],
            datasets: [{
                data: [under10, over10],
                backgroundColor: ['#48bb78', '#f56565'], // Hijau, Merah
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' },
                title: { 
                    display: true, 
                    text: `Total Murid Terlibat: ${totalStudents}` 
                }
            }
        }
    });

    // C. LUKIS GRAF 2: TAHUN (Bar Chart)
    const ctxYear = document.getElementById('yearChart').getContext('2d');

    if (window.myBarChart) window.myBarChart.destroy();

    window.myBarChart = new Chart(ctxYear, {
        type: 'bar',
        data: {
            labels: ['Tahun 1', 'Tahun 2', 'Tahun 3', 'Tahun 4', 'Tahun 5', 'Tahun 6'],
            datasets: [{
                label: 'Bilangan Murid',
                data: [yearCounts["1"], yearCounts["2"], yearCounts["3"], yearCounts["4"], yearCounts["5"], yearCounts["6"]],
                backgroundColor: '#4299e1', // Biru
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1 } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}