/**
 * RK Health - Core Application Manager & API Layer
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Session Guard (Skip for login.html)
    if (!window.location.pathname.includes('login.html')) {
        if (sessionStorage.getItem('rk_session_active') !== 'true') {
            window.location.href = 'login.html';
            return;
        }
    }

    // 2. Load Theme preferences
    initThemeSettings();

    // 3. Initialize Sidebar & Nav Router
    initNavigationRouter();

    // 4. Initialize Notifications Drawer
    initNotifications();

    // 5. Initialize Search Handler
    initGlobalSearch();
});

// ==========================================
// TOAST NOTIFICATIONS DISPATCHER
// ==========================================
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'info';
    let title = 'Notification';
    if (type === 'success') { icon = 'check_circle'; title = 'Success'; }
    else if (type === 'error') { icon = 'error'; title = 'Error'; }
    else if (type === 'warning') { icon = 'warning'; title = 'Warning'; }

    toast.innerHTML = `
        <span class="material-icons-round toast-icon">${icon}</span>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-desc">${message}</div>
        </div>
    `;

    container.appendChild(toast);

    // Auto-remove toast
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.35s reverse ease-in forwards';
        setTimeout(() => toast.remove(), 350);
    }, 3500);
}

// ==========================================
// SYSTEM THEME MANAGER
// ==========================================
function initThemeSettings() {
    const htmlEl = document.documentElement;
    const themeBtn = document.getElementById('themeToggleBtn');
    const themeIcon = document.getElementById('themeToggleIcon');
    const darkToggle = document.getElementById('settingsDarkModeToggle');

    // Default configuration checking
    const currentTheme = localStorage.getItem('rk_theme') || 'light';
    htmlEl.setAttribute('data-theme', currentTheme);
    if (themeIcon) {
        themeIcon.textContent = currentTheme === 'dark' ? 'light_mode' : 'dark_mode';
    }
    if (darkToggle) {
        darkToggle.checked = currentTheme === 'dark';
    }

    // Handle Theme toggles
    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            const newTheme = htmlEl.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            htmlEl.setAttribute('data-theme', newTheme);
            localStorage.setItem('rk_theme', newTheme);
            themeIcon.textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
            if (darkToggle) darkToggle.checked = newTheme === 'dark';
            showToast(`Theme changed to ${newTheme} mode`, 'info');
        });
    }

    if (darkToggle) {
        darkToggle.addEventListener('change', () => {
            const newTheme = darkToggle.checked ? 'dark' : 'light';
            htmlEl.setAttribute('data-theme', newTheme);
            localStorage.setItem('rk_theme', newTheme);
            if (themeIcon) themeIcon.textContent = newTheme === 'dark' ? 'light_mode' : 'dark_mode';
            showToast(`Theme changed to ${newTheme} mode`, 'info');
        });
    }

    // Color theme pickers
    const colorOptions = document.querySelectorAll('.color-option');
    const savedAccent = localStorage.getItem('rk_theme_accent') || 'blue';
    applyThemeAccent(savedAccent);

    colorOptions.forEach(opt => {
        const color = opt.getAttribute('data-theme-color');
        if (color === savedAccent) opt.classList.add('active');
        else opt.classList.remove('active');

        opt.addEventListener('click', () => {
            colorOptions.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            localStorage.setItem('rk_theme_accent', color);
            applyThemeAccent(color);
            showToast(`Accent color updated`, 'success');
        });
    });
}

function applyThemeAccent(accent) {
    const root = document.documentElement;
    if (accent === 'teal') {
        root.style.setProperty('--primary-gradient', 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)');
        root.style.setProperty('--color-primary', '#0d9488');
    } else if (accent === 'indigo') {
        root.style.setProperty('--primary-gradient', 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)');
        root.style.setProperty('--color-primary', '#4f46e5');
    } else if (accent === 'green') {
        root.style.setProperty('--primary-gradient', 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)');
        root.style.setProperty('--color-primary', '#16a34a');
    } else { // default blue
        root.style.setProperty('--primary-gradient', 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)');
        root.style.setProperty('--color-primary', '#2563eb');
    }
}

// ==========================================
// NAVIGATION ROUTER (SINGLE PAGE UI SWITCHES)
// ==========================================
function initNavigationRouter() {
    const sidebarItems = document.querySelectorAll('.sidebar-menu .sidebar-item');
    const sections = document.querySelectorAll('.page-section');
    const sidebar = document.getElementById('appSidebar');
    const toggleBtn = document.getElementById('toggleSidebar');
    const logoutBtn = document.getElementById('sidebarLogout');

    // Section switcher
    sidebarItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = item.getAttribute('data-target');

            // Set active class in sidebar
            sidebarItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            // Swap visible page sections
            sections.forEach(sec => {
                if (sec.id === targetId) {
                    sec.classList.add('active');
                } else {
                    sec.classList.remove('remove', 'active');
                }
            });

            // If mobile, collapse drawer upon click selection
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('mobile-open');
            }

            // Fire page specific triggers
            if (targetId === 'dashboardSection' && typeof initDashboardCharts === 'function') {
                initDashboardCharts();
            } else if (targetId === 'appointmentsSection' && typeof loadAppointments === 'function') {
                loadAppointments();
            } else if (targetId === 'medicationSection' && typeof loadMedications === 'function') {
                loadMedications();
            } else if (targetId === 'healthSection' && typeof loadHealthRecords === 'function') {
                loadHealthRecords();
            } else if (targetId === 'summarySection' && typeof populatePatientDropdowns === 'function') {
                populatePatientDropdowns();
            } else if (targetId === 'reportsSection' && typeof populateReportsDropdown === 'function') {
                populateReportsDropdown();
            }
        });
    });

    // Expand / Collapse Sidebar
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.toggle('mobile-open');
            } else {
                sidebar.classList.toggle('collapsed');
            }
        });
    }

    // Logout controller
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            sessionStorage.removeItem('rk_session_active');
            sessionStorage.removeItem('rk_user');
            showToast('Logging out...', 'warning');
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
        });
    }
}

// ==========================================
// NOTIFICATIONS BAR SYSTEM
// ==========================================
function initNotifications() {
    const notifBtn = document.getElementById('notifToggleBtn');
    const dropdown = document.getElementById('notificationsDropdown');
    const clearBtn = document.getElementById('clearNotifBtn');
    const badge = document.getElementById('notifBadge');
    const list = document.getElementById('notifList');

    if (!notifBtn || !dropdown) return;

    // Toggle dropdown
    notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    document.addEventListener('click', () => {
        dropdown.classList.remove('active');
    });

    dropdown.addEventListener('click', (e) => {
        e.stopPropagation();
    });

    // Load active notifications
    const renderNotifications = () => {
        const activities = JSON.parse(localStorage.getItem('rk_mock_activities') || '[]');
        list.innerHTML = '';
        
        if (activities.length === 0) {
            badge.style.display = 'none';
            list.innerHTML = `
                <li class="notification-item empty-state">
                    <span class="material-icons-round">notifications_off</span>
                    <p>No new notifications</p>
                </li>
            `;
            return;
        }

        badge.style.display = 'block';
        badge.textContent = activities.length;

        activities.slice(0, 5).forEach((act, idx) => {
            let icon = 'notifications';
            if (act.type === 'appointment') icon = 'calendar_month';
            if (act.type === 'medicine') icon = 'vaccines';
            if (act.type === 'summary') icon = 'psychology';

            const item = document.createElement('li');
            item.className = 'notification-item unread';
            item.innerHTML = `
                <div class="notification-item-icon ${act.type || 'system'}">
                    <span class="material-icons-round">${icon}</span>
                </div>
                <div class="notification-item-content">
                    <p>${act.text}</p>
                    <span class="notification-time">${act.time}</span>
                </div>
            `;
            list.appendChild(item);
        });
    };

    renderNotifications();

    clearBtn.addEventListener('click', () => {
        localStorage.setItem('rk_mock_activities', JSON.stringify([]));
        renderNotifications();
        showToast('All notifications cleared', 'info');
    });
}

function addNotificationLog(text, type = 'system') {
    const activities = JSON.parse(localStorage.getItem('rk_mock_activities') || '[]');
    activities.unshift({
        type: type,
        text: text,
        time: 'Just Now',
        status: 'success'
    });
    localStorage.setItem('rk_mock_activities', JSON.stringify(activities));
    
    // Update live panel if possible
    const badge = document.getElementById('notifBadge');
    if (badge) {
        badge.style.display = 'block';
        badge.textContent = Math.min(activities.length, 9);
    }
}

// ==========================================
// GLOBAL SEARCH INPUT ROUTER
// ==========================================
function initGlobalSearch() {
    const searchInput = document.getElementById('globalSearchInput');
    if (!searchInput) return;

    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        
        // Feed text queries to standard table listings depending on what section is active
        const activeSection = document.querySelector('.page-section.active');
        if (!activeSection) return;

        if (activeSection.id === 'appointmentsSection') {
            const input = document.getElementById('apptSearch');
            if (input) {
                input.value = query;
                input.dispatchEvent(new Event('input'));
            }
        } else if (activeSection.id === 'medicationSection') {
            const input = document.getElementById('medSearch');
            if (input) {
                input.value = query;
                input.dispatchEvent(new Event('input'));
            }
        } else if (activeSection.id === 'healthSection') {
            const input = document.getElementById('healthSearch');
            if (input) {
                input.value = query;
                input.dispatchEvent(new Event('input'));
            }
        } else if (activeSection.id === 'dashboardSection' && query.length > 2) {
            // Suggest which page contains what
            showToast(`Searching globally for "${query}" - navigate to list panels to view results.`, 'info');
        }
    });
}

// ==========================================
// DATA API ACCESS LAYER (LOCAL / WEB APP HYBRID)
// ==========================================
const RkDb = {
    // Show loading screens during syncing
    setLoading(state, message = "Syncing with cloud...") {
        const loader = document.getElementById('globalLoaderScreen');
        const label = document.getElementById('globalLoaderMessage');
        if (loader && label) {
            label.textContent = message;
            loader.style.display = state ? 'flex' : 'none';
        }
    },

    // Secure POST fetching wrapper to Apps Script web app
    async fetchBackend(action, payload = {}) {
        const url = RK_CONFIG.backendUrl;
        if (!url) throw new Error("Backend URL not configured");

        const fetchParams = {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain' // Workaround for Apps Script CORS Pre-flight issues
            },
            body: JSON.stringify({
                action: action,
                payload: payload
            })
        };

        try {
            const response = await fetch(url, fetchParams);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const result = await response.json();
            if (result.status === 'error') throw new Error(result.message || 'API Exception');
            return result.data;
        } catch (error) {
            console.error("RK-Backend Fetch Failure:", error);
            showToast(`Cloud Sync Error: ${error.message}`, 'error');
            throw error;
        }
    },

    // --- 1. APPOINTMENTS API ---
    async getAppointments() {
        if (RK_CONFIG.isMock) {
            return JSON.parse(localStorage.getItem('rk_mock_appointments') || '[]');
        }
        this.setLoading(true, "Fetching clinical appointments...");
        try {
            const list = await this.fetchBackend('getAppointments');
            return list;
        } finally {
            this.setLoading(false);
        }
    },

    async saveAppointment(appt) {
        if (RK_CONFIG.isMock) {
            const appts = JSON.parse(localStorage.getItem('rk_mock_appointments') || '[]');
            if (appt.id) {
                const idx = appts.findIndex(a => a.id === appt.id);
                if (idx !== -1) {
                    appts[idx] = { ...appts[idx], ...appt, timestamp: new Date().getTime() };
                }
            } else {
                appt.id = `APT-${Math.floor(1000 + Math.random() * 9000)}`;
                appt.timestamp = new Date().getTime();
                // Autogenerate Mock Calendar Event Link
                appt.calendarLink = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(appt.title)}&details=${encodeURIComponent(appt.reason)}&location=${encodeURIComponent(appt.hospital)}&dates=${new Date(appt.date + 'T' + appt.time).toISOString().replace(/-|:|\.\d\d\d/g, "")}/${new Date(new Date(appt.date + 'T' + appt.time).getTime() + 1800000).toISOString().replace(/-|:|\.\d\d\d/g, "")}`;
                appts.push(appt);
            }
            localStorage.setItem('rk_mock_appointments', JSON.stringify(appts));
            addNotificationLog(`Appointment ${appt.id} saved for ${appt.patientName}`, 'appointment');
            return appt;
        }

        this.setLoading(true, "Saving appointment schedule...");
        try {
            const result = await this.fetchBackend(appt.id ? 'updateAppointment' : 'addAppointment', appt);
            addNotificationLog(`Appointment ${result.id} synced with Google Sheets`, 'appointment');
            return result;
        } finally {
            this.setLoading(false);
        }
    },

    async deleteAppointment(id) {
        if (RK_CONFIG.isMock) {
            const appts = JSON.parse(localStorage.getItem('rk_mock_appointments') || '[]');
            const filtered = appts.filter(a => a.id !== id);
            localStorage.setItem('rk_mock_appointments', JSON.stringify(filtered));
            addNotificationLog(`Appointment ${id} cancelled`, 'appointment');
            return true;
        }

        this.setLoading(true, "Deleting appointment from database...");
        try {
            await this.fetchBackend('deleteAppointment', { id: id });
            addNotificationLog(`Appointment ${id} removed from Google Sheets`, 'appointment');
            return true;
        } finally {
            this.setLoading(false);
        }
    },

    // --- 2. MEDICATION REMINDERS API ---
    async getMedicines() {
        if (RK_CONFIG.isMock) {
            return JSON.parse(localStorage.getItem('rk_mock_medicines') || '[]');
        }
        this.setLoading(true, "Fetching medication files...");
        try {
            return await this.fetchBackend('getMedicines');
        } finally {
            this.setLoading(false);
        }
    },

    async saveMedicine(med) {
        if (RK_CONFIG.isMock) {
            const meds = JSON.parse(localStorage.getItem('rk_mock_medicines') || '[]');
            if (med.id) {
                const idx = meds.findIndex(m => m.id === med.id);
                if (idx !== -1) {
                    meds[idx] = { ...meds[idx], ...med, timestamp: new Date().getTime() };
                }
            } else {
                med.id = `MED-${Math.floor(1000 + Math.random() * 9000)}`;
                med.timestamp = new Date().getTime();
                med.smsStatus = "Delivered"; // Default simulated status
                meds.push(med);
            }
            localStorage.setItem('rk_mock_medicines', JSON.stringify(meds));
            addNotificationLog(`Medicine schedule ${med.id} created`, 'medicine');
            return med;
        }

        this.setLoading(true, "Saving medication schedule to Sheets...");
        try {
            const result = await this.fetchBackend(med.id ? 'updateMedicine' : 'addMedicine', med);
            addNotificationLog(`Medicine ${result.id} synced with Sheets & Twilio`, 'medicine');
            return result;
        } finally {
            this.setLoading(false);
        }
    },

    async deleteMedicine(id) {
        if (RK_CONFIG.isMock) {
            const meds = JSON.parse(localStorage.getItem('rk_mock_medicines') || '[]');
            const filtered = meds.filter(m => m.id !== id);
            localStorage.setItem('rk_mock_medicines', JSON.stringify(filtered));
            addNotificationLog(`Medicine schedule ${id} deleted`, 'medicine');
            return true;
        }

        this.setLoading(true, "Deleting medication from database...");
        try {
            await this.fetchBackend('deleteMedicine', { id: id });
            addNotificationLog(`Medication ${id} removed from Google Sheets`, 'medicine');
            return true;
        } finally {
            this.setLoading(false);
        }
    },

    // --- 3. HEALTH RECORDS API ---
    async getHealthRecords() {
        if (RK_CONFIG.isMock) {
            return JSON.parse(localStorage.getItem('rk_mock_health_records') || '[]');
        }
        this.setLoading(true, "Fetching EHR databases...");
        try {
            return await this.fetchBackend('getHealthRecords');
        } finally {
            this.setLoading(false);
        }
    },

    async saveHealthRecord(rec) {
        if (RK_CONFIG.isMock) {
            const recs = JSON.parse(localStorage.getItem('rk_mock_health_records') || '[]');
            if (rec.id) {
                const idx = recs.findIndex(r => r.id === rec.id);
                if (idx !== -1) {
                    recs[idx] = { ...recs[idx], ...rec, timestamp: new Date().getTime() };
                }
            } else {
                rec.id = `HLT-${Math.floor(1000 + Math.random() * 9000)}`;
                rec.timestamp = new Date().getTime();
                recs.push(rec);
            }
            localStorage.setItem('rk_mock_health_records', JSON.stringify(recs));
            addNotificationLog(`EHR health profile created for ${rec.patientName}`, 'system');
            return rec;
        }

        this.setLoading(true, "Saving clinical profile to Sheets...");
        try {
            const result = await this.fetchBackend(rec.id ? 'updateHealthRecord' : 'addHealthRecord', rec);
            addNotificationLog(`Health Record ${result.id} synced with Google Sheets`, 'system');
            return result;
        } finally {
            this.setLoading(false);
        }
    },

    async deleteHealthRecord(id) {
        if (RK_CONFIG.isMock) {
            const recs = JSON.parse(localStorage.getItem('rk_mock_health_records') || '[]');
            const filtered = recs.filter(r => r.id !== id);
            localStorage.setItem('rk_mock_health_records', JSON.stringify(filtered));
            addNotificationLog(`Health Record ${id} deleted`, 'system');
            return true;
        }

        this.setLoading(true, "Deleting record file...");
        try {
            await this.fetchBackend('deleteHealthRecord', { id: id });
            addNotificationLog(`Health record ${id} removed from Google Sheets`, 'system');
            return true;
        } finally {
            this.setLoading(false);
        }
    },

    // --- 4. AI VISIT SUMMARIZER PROXIES ---
    async getAiSummaries() {
        if (RK_CONFIG.isMock) {
            return JSON.parse(localStorage.getItem('rk_mock_ai_summaries') || '[]');
        }
        try {
            return await this.fetchBackend('getAiSummaries');
        } catch {
            return [];
        }
    },

    async generateAiSummary(patientName, visitDetails) {
        if (RK_CONFIG.isMock) {
            // Simulate Groq AI model response delays locally
            await new Promise(resolve => setTimeout(resolve, 2500));
            
            const generatedMockObj = {
                visitSummary: `${patientName} was checked for complaints about ${visitDetails.diagnosis || 'symptoms'}. The patient requires consistent monitoring of blood count metrics and rest.`,
                diagnosisExpl: `${visitDetails.diagnosis || 'The diagnosed condition'} involves biological strain on immune response pathways, which can cause symptoms of discomfort.`,
                medInstructions: `Take medications exactly as prescribed: ${visitDetails.prescription || 'completed dose schedule'}.`,
                lifestyleSuggestions: "Stay hydrated by consuming at least 2.5L of water daily. Walk lightly for 15-20 minutes in the morning. Avoid heavy meals close to bedtime.",
                risks: "Seek immediate medical attention if you experience breathing complications, continuous chest pain, or sudden high fever.",
                followUp: `Schedule next follow-up evaluation by ${visitDetails.followUpDate || '2 weeks from now'}.`
            };

            const summaries = JSON.parse(localStorage.getItem('rk_mock_ai_summaries') || '[]');
            const newSum = {
                id: `AIS-${Math.floor(1000 + Math.random() * 9000)}`,
                patientName: patientName,
                summaryText: JSON.stringify(generatedMockObj),
                timestamp: new Date().getTime()
            };
            
            // Overwrite or push
            const idx = summaries.findIndex(s => s.patientName === patientName);
            if (idx !== -1) {
                summaries[idx] = newSum;
            } else {
                summaries.push(newSum);
            }
            
            localStorage.setItem('rk_mock_ai_summaries', JSON.stringify(summaries));
            addNotificationLog(`AI Clinical Summary compiled for ${patientName}`, 'summary');
            return newSum;
        }

        // Live API call triggers Groq API
        try {
            const responseObj = await this.fetchBackend('generateSummary', {
                patientName: patientName,
                visitDetails: visitDetails
            });
            addNotificationLog(`AI clinical summary synced for ${patientName}`, 'summary');
            return responseObj;
        } catch (error) {
            showToast("Failed to fetch AI response from Groq. Please verify API configuration in Google Apps Script Script Properties.", "error");
            throw error;
        }
    }
};

// ==========================================
// SETTINGS PAGE FORM CONTROLS INITIALIZER
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    const settingsForm = document.getElementById('settingsBackendForm');
    const backendUrlInput = document.getElementById('settingsBackendUrl');
    const resetBtn = document.getElementById('resetBackendUrlBtn');

    if (backendUrlInput) {
        backendUrlInput.value = RK_CONFIG.backendUrl;
    }

    if (settingsForm) {
        settingsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const url = backendUrlInput.value.trim();
            if (url && !url.startsWith('https://script.google.com/')) {
                showToast("Invalid URL. Apps Script Web Apps must start with https://script.google.com", "error");
                return;
            }
            
            RK_CONFIG.backendUrl = url;
            showToast(url ? "Backend synced successfully! Connecting to Live Sheets..." : "Set to local mock database.", "success");
            
            // Reload active states
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            localStorage.removeItem('rk_backend_url');
            backendUrlInput.value = '';
            showToast("Reset to mock data mode.", "info");
            setTimeout(() => {
                window.location.reload();
            }, 1000);
        });
    }
});
