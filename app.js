// CONFIGURATION
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbx6zN_PJSdm7BtScD20me4JfkwkxAPOU52U5RwqsD8yg9hfn-UNfyoc_go2b_7R4pcVKw/exec"; 

// GLOBAL VARIABLE
let allStudentsData = [];

// START APP
document.addEventListener('DOMContentLoaded', () => {
    loadDashboard(); 
});

// 1. FETCH DATA
function loadDashboard() {
    const dashboardDiv = document.getElementById('dashboardData');
    dashboardDiv.innerHTML = "<p>Scanning attendance logs...</p>";

    fetch(WEB_APP_URL)
    .then(response => response.json())
    .then(data => {
        if (data.dashboard) {
            // Sort data siap-siap
            data.dashboard.sort((a, b) => b.Consecutive_Warn_Level - a.Consecutive_Warn_Level);
            allStudentsData = data.dashboard; 

            // Lukis Graf (Sekarang ada fungsi klik!)
            processAndDrawCharts(data.dashboard);
            
            // Papar Senarai Penuh
            renderStudentList(allStudentsData);
        } else {
             dashboardDiv.innerHTML = "<p>✅ Tiada rekod ketidakhadiran.</p>";
        }
    })
    .catch(error => {
        console.error('Error:', error);
        dashboardDiv.innerHTML = "<p>Error loading data.</p>";
    });
}

// 2. FUNGSI RESET FILTER (Kembali asal) 🔄
function resetFilter() {
    document.getElementById('listTitle').innerText = "Senarai Murid Bermasalah (Semua)";
    renderStudentList(allStudentsData);
}

// 3. FUNGSI FILTER DARI GRAF (Dipanggil bila graf diklik) 🖱️
function filterByYear(yearDigit) {
    // Tapis murid yang kelasnya bermula dengan digit tahun (cth: "5")
    const filtered = allStudentsData.filter(s => {
        const className = String(s.Class).trim();
        return className.startsWith(yearDigit);
    });

    // Kemaskini Tajuk & Senarai
    document.getElementById('listTitle').innerText = `Senarai Murid: Tahun ${yearDigit}`;
    renderStudentList(filtered);
}

// 4. LUKIS SENARAI 📝
function renderStudentList(students) {
    const dashboardDiv = document.getElementById('dashboardData');

    if (students.length === 0) {
        dashboardDiv.innerHTML = "<p style='text-align:center; padding:20px; color:#718096;'>🔍 Tiada murid untuk tahun ini.</p>";
        return;
    }

    let html = '<ul class="dashboard-list">';
    
    students.forEach(student => {
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
                    <small>Terakhir Ponteng: ${student.Last_Absent_Date}</small>
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
}

// 5. LUKIS GRAF (Dengan Event Listener) 📊
function processAndDrawCharts(students) {
    if (!students) return;

    // Kira Data
    let totalStudents = students.length;
    let under10 = 0, over10 = 0;
    let yearCounts = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0, "6": 0 };

    students.forEach(s => {
        if (s.Total_Absence >= 10) over10++; else under10++;
        let className = String(s.Class || "").trim(); 
        let firstChar = className.charAt(0);
        if (yearCounts[firstChar] !== undefined) yearCounts[firstChar]++;
    });

    // Graf 1: Pie Chart (Ringkasan)
    const ctxSummary = document.getElementById('summaryChart');
    if (ctxSummary) {
        if (window.myPieChart) window.myPieChart.destroy();
        window.myPieChart = new Chart(ctxSummary.getContext('2d'), {
            type: 'doughnut',
            data: {
                labels: ['Bawah 10 Hari', 'Lebih 10 Hari'],
                datasets: [{
                    data: [under10, over10],
                    backgroundColor: ['#48bb78', '#f56565'],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    title: { display: true, text: `Total: ${totalStudents} Murid` }
                }
            }
        });
    }

    // Graf 2: Bar Chart (INTERAKTIF) 🖱️
    const ctxYear = document.getElementById('yearChart');
    if (ctxYear) {
        if (window.myBarChart) window.myBarChart.destroy();
        window.myBarChart = new Chart(ctxYear.getContext('2d'), {
            type: 'bar',
            data: {
                labels: ['Tahun 1', 'Tahun 2', 'Tahun 3', 'Tahun 4', 'Tahun 5', 'Tahun 6'],
                datasets: [{
                    label: 'Bilangan Murid',
                    data: [yearCounts["1"], yearCounts["2"], yearCounts["3"], yearCounts["4"], yearCounts["5"], yearCounts["6"]],
                    backgroundColor: '#4299e1', // Biru Biasa
                    hoverBackgroundColor: '#2b6cb0', // Biru Gelap bila hover
                    borderRadius: 4,
                    cursor: 'pointer' // Tunjuk cursor tangan
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
                plugins: { legend: { display: false } },
                
                // --- EVENT LISTENER UNTUK KLIK ---
                onClick: (e, activeElements) => {
                    if (activeElements.length > 0) {
                        // Dapat index bar yang diklik (0 = Tahun 1, 1 = Tahun 2...)
                        const index = activeElements[0].index;
                        const yearSelected = index + 1; // Tukar index jadi nombor Tahun
                        
                        // Panggil fungsi filter
                        filterByYear(String(yearSelected));
                    }
                },
                onHover: (event, chartElement) => {
                    // Tukar cursor jadi 'pointer' bila lalu atas bar
                    event.native.target.style.cursor = chartElement[0] ? 'pointer' : 'default';
                }
            }
        });
    }
}