/**
 * RK Health - System Configurations & Mock Data Store
 */

const RK_CONFIG = {
    // Current active Google Apps Script deployment URL. Fallbacks to mock mode if blank.
    get backendUrl() {
        return localStorage.getItem('rk_backend_url') || '';
    },
    set backendUrl(url) {
        localStorage.setItem('rk_backend_url', url);
    },
    
    // Automatically determine if we are running in local mock sandbox database mode
    get isMock() {
        return !this.backendUrl;
    },

    // UI Configuration options
    doctors: [
        "Dr. Madhu S Reddy (Gen Physician)",
        "Dr. Shalini K (Cardiologist)",
        "Dr. Pranav Sharma (Dentist)",
        "Dr. Anjali Bose (Pediatrician)",
        "Dr. Rajesh Kumar (Orthopedic)"
    ],
    
    hospitals: [
        "RK Hospital - Main Branch",
        "RK Clinics - Whitefield",
        "RK Hospital - Indiranagar",
        "RK Care Center - Jayanagar"
    ]
};

// ==========================================
// MOCK DATABASE INITIALIZER (LOCAL STORAGE)
// ==========================================

const INITIAL_MOCK_APPOINTMENTS = [
    {
        id: "APT-1001",
        patientName: "Sarah Jenkins",
        doctorName: "Dr. Shalini K (Cardiologist)",
        title: "Cardiology Review",
        date: new Date().toISOString().split('T')[0], // Today
        time: "10:30",
        hospital: "RK Hospital - Main Branch",
        reason: "Routine ECG post-medication check",
        notes: "Patient reports slight fatigue after evening beta-blocker dose. Pulse rate stable at 72 bpm.",
        calendarLink: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Cardiology+Review&details=Routine+ECG+post-medication+check&dates=20260628T103000/20260628T110000",
        timestamp: new Date().getTime()
    },
    {
        id: "APT-1002",
        patientName: "Robert Miller",
        doctorName: "Dr. Rajesh Kumar (Orthopedic)",
        title: "Knee Surgery Follow-up",
        date: new Date().toISOString().split('T')[0], // Today
        time: "14:15",
        hospital: "RK Hospital - Indiranagar",
        reason: "Post-op suture evaluation",
        notes: "Incision healing nicely. Prescribe light physical therapy exercises twice a week.",
        calendarLink: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Knee+Followup&details=Post-op+evaluation&dates=20260628T141500/20260628T144500",
        timestamp: new Date().getTime() - 86400000
    },
    {
        id: "APT-1003",
        patientName: "Amelia Watson",
        doctorName: "Dr. Pranav Sharma (Dentist)",
        title: "Root Canal Session 2",
        date: new Date(new Date().getTime() + 86400000).toISOString().split('T')[0], // Tomorrow
        time: "09:00",
        hospital: "RK Clinics - Whitefield",
        reason: "Second phase nerve cleansing",
        notes: "No infection observed. Prepare cavity for permanent composite filling next week.",
        calendarLink: "https://calendar.google.com/calendar/render?action=TEMPLATE&text=Root+Canal&details=Second+phase+cleansing&dates=20260629T090000/20260629T093000",
        timestamp: new Date().getTime() - 172800000
    }
];

const INITIAL_MOCK_MEDICINES = [
    {
        id: "MED-2001",
        medicineName: "Atorvastatin (Lipitor)",
        dosage: "20mg (1 tablet)",
        frequency: "Once Daily",
        morning: false,
        afternoon: false,
        night: true,
        startDate: "2026-06-01",
        endDate: "2026-12-01",
        phoneNumber: "+15005550006",
        notes: "Take at bedtime. Avoid grapefruit juice.",
        smsStatus: "Delivered",
        timestamp: new Date().getTime()
    },
    {
        id: "MED-2002",
        medicineName: "Amoxicillin Trihydrate",
        dosage: "500mg (1 capsule)",
        frequency: "Three Times Daily",
        morning: true,
        afternoon: true,
        night: true,
        startDate: new Date().toISOString().split('T')[0], // Today
        endDate: new Date(new Date().getTime() + 7 * 86400000).toISOString().split('T')[0], // 7 Days
        phoneNumber: "+15005550006",
        notes: "Complete entire course. Take with meals.",
        smsStatus: "Delivered",
        timestamp: new Date().getTime()
    },
    {
        id: "MED-2003",
        medicineName: "Metformin HCl",
        dosage: "850mg (1 tablet)",
        frequency: "Twice Daily",
        morning: true,
        afternoon: false,
        night: true,
        startDate: "2026-05-15",
        endDate: "2027-05-15",
        phoneNumber: "+15005550006",
        notes: "Take with breakfast and dinner.",
        smsStatus: "Failed",
        timestamp: new Date().getTime() - 86400000
    }
];

const INITIAL_MOCK_HEALTH_RECORDS = [
    {
        id: "HLT-3001",
        patientName: "Sarah Jenkins",
        age: 45,
        gender: "Female",
        bloodGroup: "O+",
        height: 165,
        weight: 68,
        allergies: "Sulfonamides, Penicillin",
        doctor: "Dr. Shalini K (Cardiologist)",
        diagnosis: "Essential Hypertension & Hyperlipidemia",
        prescription: "Atorvastatin 20mg Once Daily (Bedtime)\nLisinopril 10mg Once Daily (Morning)",
        visitNotes: "Complaining of minor dry cough. Cardiac markers normal. Diet counseling provided (low sodium).",
        followUpDate: "2026-09-15",
        timestamp: new Date().getTime()
    },
    {
        id: "HLT-3002",
        patientName: "Robert Miller",
        age: 58,
        gender: "Male",
        bloodGroup: "A+",
        height: 178,
        weight: 84,
        allergies: "Aspirin (triggers asthma)",
        doctor: "Dr. Rajesh Kumar (Orthopedic)",
        diagnosis: "Osteoarthritis of right knee, Post meniscus-repair status",
        prescription: "Celecoxib 100mg Twice Daily as needed\nPhysiotherapy thrice weekly for range of motion",
        visitNotes: "Stitches removed safely. Flexion improved to 95 degrees. Advised ice compresses for mild swelling.",
        followUpDate: "2026-07-28",
        timestamp: new Date().getTime() - 86400000
    }
];

const INITIAL_MOCK_AI_SUMMARIES = [
    {
        id: "AIS-4001",
        patientName: "Sarah Jenkins",
        summaryText: JSON.stringify({
            visitSummary: "Sarah visited Dr. Shalini on June 28 for her Essential Hypertension and high cholesterol management. Her blood pressure was evaluated, and she was counselled on managing a low-sodium diet due to slight cough complaints.",
            diagnosisExpl: "Hypertension means chronically high pressure in your arteries, requiring heart medication. Hyperlipidemia means elevated fats/cholesterol in the bloodstream, which can deposit in blood vessels.",
            medInstructions: "Take Lisinopril 10mg in the morning to lower blood pressure. Take Atorvastatin 20mg at bedtime to control cholesterol levels. Complete daily routines.",
            lifestyleSuggestions: "Follow a heart-healthy dietary plan (DASH diet). Restrict daily sodium intake to under 1,500mg. Walk at a moderate pace for 30 minutes daily.",
            risks: "If you experience severe chest pain, extreme breathlessness, or facial swelling (rare lisinopril allergy), seek emergency support immediately.",
            followUp: "Return in three months (September 15, 2026) for repeat blood lipid panel and BP assessment."
        }),
        timestamp: new Date().getTime()
    }
];

// Setup storage if empty
const setupStorage = (key, initialValue) => {
    if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(initialValue));
    }
};

// Initialize Mock Databases
setupStorage('rk_mock_appointments', INITIAL_MOCK_APPOINTMENTS);
setupStorage('rk_mock_medicines', INITIAL_MOCK_MEDICINES);
setupStorage('rk_mock_health_records', INITIAL_MOCK_HEALTH_RECORDS);
setupStorage('rk_mock_ai_summaries', INITIAL_MOCK_AI_SUMMARIES);
setupStorage('rk_mock_activities', [
    { type: 'appointment', text: 'Appointment APT-1001 created for Sarah Jenkins', time: '10 mins ago', status: 'success' },
    { type: 'medicine', text: 'Medicine reminder MED-2002 scheduled for Robert Miller', time: '1 hour ago', status: 'success' },
    { type: 'summary', text: 'AI clinical summary generated for Sarah Jenkins', time: '2 hours ago', status: 'success' },
    { type: 'system', text: 'System initialized in mock sandbox mode', time: '3 hours ago', status: 'warning' }
]);
