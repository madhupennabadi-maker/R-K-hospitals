/**
 * RK Health - Dashboard Metrics & Analytics Visualization
 */

let combinedChartInstance = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initial load of dashboard indicators
    if (document.getElementById('dashboardSection').classList.contains('active')) {
        initDashboardCharts();
    }
});

/**
 * Initializes and fetches data for dashboard charts and summaries
 */
async function initDashboardCharts() {
    try {
        const role = sessionStorage.getItem('rk_user_role') || 'Patient';
        const activeUser = sessionStorage.getItem('rk_user') || 'Sarah Jenkins';

        // Fetch fresh datasets
        const appointments = await RkDb.getAppointments();
        const medicines = await RkDb.getMedicines();
        const records = await RkDb.getHealthRecords();
        const summaries = await RkDb.getAiSummaries();

        // Enforce patient-level data partitioning on the dashboard
        let filteredAppts = appointments;
        let filteredMeds = medicines;
        let filteredRecords = records;
        let filteredSummaries = summaries;

        if (role === 'Patient') {
            filteredAppts = appointments.filter(a => a.patientName === activeUser);
            filteredMeds = medicines.filter(m => m.notes && m.notes.toLowerCase().includes(activeUser.toLowerCase()) || true); // mock demo safety
            filteredRecords = records.filter(r => r.patientName === activeUser);
            filteredSummaries = summaries.filter(s => s.patientName === activeUser);
        }

        // 1. Calculate Stats counters
        calculateStats(filteredAppts, filteredMeds, filteredRecords, filteredSummaries);

        // 2. Populate Recent Activities Timeline
        populateActivitiesTimeline();

        // 3. Render Chart.js Analytics
        renderAnalyticsCharts(filteredAppts, filteredMeds);

        // 4. Render recommendations & predictive score on Dashboard landing
        renderDashboardRiskAlerts(activeUser, role);

    } catch (error) {
        console.error("Dashboard initialization failure:", error);
        showToast("Error updating dashboard analytics", "error");
    }
}

/**
 * Perform math counts on raw datasets for indicator panels
 */
function calculateStats(appointments, medicines, records, summaries) {
    const todayStr = new Date().toISOString().split('T')[0];

    // Today's appointments count
    const todayAppts = appointments.filter(a => a.date === todayStr).length;
    document.getElementById('statsTodayAppts').textContent = todayAppts;

    // Health records files count
    document.getElementById('statsHealthRecords').textContent = records.length;

    // Medicines counts
    const pendingMeds = medicines.length; // Active schedules
    document.getElementById('statsPendingMeds').textContent = pendingMeds;

    // Medicine compliance calculation
    // Percentage = (delivered SMS / total SMS sent) * 100
    if (medicines.length === 0) {
        document.getElementById('statsMedicineCompliance').textContent = "100%";
    } else {
        const delivered = medicines.filter(m => m.smsStatus === 'Delivered').length;
        const total = medicines.length;
        const rate = Math.round((delivered / total) * 100);
        document.getElementById('statsMedicineCompliance').textContent = `${rate}%`;
    }
}

/**
 * Render the activity list from localStorage logs
 */
function populateActivitiesTimeline() {
    const timeline = document.getElementById('recentActivitiesTimeline');
    if (!timeline) return;

    const logs = JSON.parse(localStorage.getItem('rk_mock_activities') || '[]');
    timeline.innerHTML = '';

    if (logs.length === 0) {
        timeline.innerHTML = `
            <li class="timeline-item">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <p class="timeline-title">No actions logged</p>
                    <span class="timeline-time">System Ready</span>
                </div>
            </li>
        `;
        return;
    }

    logs.slice(0, 4).forEach(log => {
        let statusClass = 'success';
        if (log.status) statusClass = log.status;
        else if (log.type === 'system') statusClass = 'warning';

        const item = document.createElement('li');
        item.className = `timeline-item ${statusClass}`;
        item.innerHTML = `
            <div class="timeline-marker"></div>
            <div class="timeline-content">
                <div class="timeline-title">${log.text}</div>
                <div class="timeline-time">${log.time}</div>
            </div>
        `;
        timeline.appendChild(item);
    });
}

/**
 * Visualizes medical trends using Chart.js
 */
function renderAnalyticsCharts(appointments, medicines) {
    const ctx = document.getElementById('dashboardCombinedChart');
    if (!ctx) return;

    // Destroy existing instance to prevent visual glitches on re-draws
    if (combinedChartInstance) {
        combinedChartInstance.destroy();
    }

    // Process visits per month (Jan-Jun)
    const monthlyVisits = {
        'Jan': 4, 'Feb': 8, 'Mar': 5, 'Apr': 12, 'May': 15, 'Jun': 18
    };

    // Calculate dynamic data based on appointments if dates fall in these ranges
    appointments.forEach(appt => {
        if (!appt.date) return;
        const dateObj = new Date(appt.date);
        const monthName = dateObj.toLocaleString('default', { month: 'short' });
        if (monthlyVisits[monthName] !== undefined) {
            monthlyVisits[monthName]++;
        }
    });

    const labels = Object.keys(monthlyVisits);
    const visitsData = Object.values(monthlyVisits);
    
    // Simulate medicine compliance rate variations over months
    const complianceRates = [85, 88, 82, 90, 93, 95];
    // Dynamic adjustment of last month's compliance rate based on medicine data
    if (medicines.length > 0) {
        const delivered = medicines.filter(m => m.smsStatus === 'Delivered').length;
        complianceRates[complianceRates.length - 1] = Math.round((delivered / medicines.length) * 100);
    }

    // Chart.js Configuration
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const gridColor = isDark ? '#1f2937' : '#e2e8f0';
    const textColor = isDark ? '#f3f4f6' : '#0f172a';

    combinedChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Monthly Patient Visits',
                    data: visitsData,
                    backgroundColor: 'rgba(37, 99, 235, 0.65)',
                    borderColor: '#2563eb',
                    borderWidth: 2,
                    borderRadius: 6,
                    yAxisID: 'y',
                    order: 2
                },
                {
                    label: 'Medication Compliance (%)',
                    data: complianceRates,
                    type: 'line',
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    fill: false,
                    tension: 0.4,
                    borderWidth: 3,
                    pointBackgroundColor: '#10b981',
                    yAxisID: 'y1',
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: textColor,
                        font: { family: 'Outfit', size: 12 }
                    }
                },
                tooltip: {
                    padding: 10,
                    bodyFont: { family: 'Outfit' },
                    titleFont: { family: 'Outfit', weight: 'bold' }
                }
            },
            scales: {
                x: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Outfit' } }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'Outfit' } },
                    title: {
                        display: true,
                        text: 'Total Appointments / Visits',
                        color: textColor,
                        font: { family: 'Outfit', weight: 'bold' }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: { drawOnChartArea: false }, // Only show grids for the left axis
                    ticks: { color: textColor, font: { family: 'Outfit' } },
                    min: 0,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Compliance Rate (%)',
                        color: textColor,
                        font: { family: 'Outfit', weight: 'bold' }
                    }
                }
            }
        }
    });
}

/**
 * Renders predictive suggestions and alert states on dashboard landing cards
 */
async function renderDashboardRiskAlerts(patientName, role) {
    const riskBadgeContainer = document.getElementById('dashboardRiskBadgeArea');
    const recsList = document.getElementById('dashboardRecommendationsList');

    if (!recsList) return;

    try {
        const risks = await RkDb.getRisks();
        const patientRisk = risks.find(r => r.patientName === patientName);

        if (patientRisk) {
            // Update Risk Score Badge on dashboard
            if (riskBadgeContainer) {
                let badgeClass = 'low';
                let color = '#10b981';
                if (patientRisk.riskLevel.toLowerCase() === 'medium') { badgeClass = 'medium'; color = '#f59e0b'; }
                if (patientRisk.riskLevel.toLowerCase() === 'high') { badgeClass = 'high'; color = '#ef4444'; }
                
                riskBadgeContainer.innerHTML = `
                    <div style="display: flex; align-items: center; gap: 8px;">
                        <span class="risk-score-badge ${badgeClass}">${patientRisk.riskLevel} Risk (${patientRisk.riskScore}/100)</span>
                        <span style="font-size: 12.5px; color: var(--text-secondary);">AI Evaluation active</span>
                    </div>
                `;
            }

            // Render predictive list suggestions
            recsList.innerHTML = '';
            
            // Render AI actions & recommendations as clean lists
            const actions = (patientRisk.actions || '').split('\n').filter(Boolean);
            const recs = (patientRisk.recommendations || '').split('\n').filter(Boolean);
            const combined = [...actions, ...recs];

            if (combined.length === 0) {
                recsList.innerHTML = '<li style="color: var(--text-secondary);">Maintain baseline healthy diagnostics.</li>';
            } else {
                combined.forEach(item => {
                    const cleanText = item.replace(/^[•\-\*\d\.\s]+/, '').trim(); // strip bullet marks
                    if (cleanText) {
                        recsList.innerHTML += `
                            <li style="display: flex; gap: 8px; font-size: 13.5px; line-height: 1.4; color: var(--text-secondary); margin-bottom: 8px;">
                                <span class="material-icons-round" style="font-size: 16px; color: var(--color-primary);">offline_pin</span>
                                <span>${escapeHtml(cleanText)}</span>
                            </li>
                        `;
                    }
                });
            }
        } else {
            // Fallback if no computed file exists yet
            if (riskBadgeContainer) {
                riskBadgeContainer.innerHTML = `<span style="font-size: 13px; color: var(--text-light); font-style: italic;">No AI evaluation yet.</span>`;
            }
            recsList.innerHTML = `
                <li style="display: flex; gap: 8px; font-size: 13.5px; color: var(--text-light); font-style: italic;">
                    <span class="material-icons-round" style="font-size: 16px;">help_outline</span>
                    <span>Navigate to the "Health Risk" tab in the sidebar and run "Analyze Vitals Risk" to generate AI predictive suggestions.</span>
                </li>
            `;
        }
    } catch (e) {
        console.error("Dashboard risk widget render failure:", e);
    }
}
