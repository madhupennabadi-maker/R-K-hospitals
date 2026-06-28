/**
 * RK Health - Google Apps Script Backend Web App
 * Deployed as: Web App (Execute as: Me, Who has access: Anyone)
 * Database: Bound Google Sheets
 */

// ==========================================
// CORE CORS-COMPLIANT ROUTERS
// ==========================================

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: "success",
    message: "RK Health Web App Backend is active. Send POST requests to write/read."
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  // Handle CORS Preflight / Parsing
  var responseData;
  try {
    var requestBody = JSON.parse(e.postData.contents);
    var action = requestBody.action;
    var payload = requestBody.payload || {};
    
    // Automatically initialize tables if not existing
    initDatabaseSheets();
    
    // Router to corresponding functions
    switch (action) {
      // Appointments
      case 'getAppointments':
        responseData = getAppointments();
        break;
      case 'addAppointment':
        responseData = addAppointment(payload);
        break;
      case 'updateAppointment':
        responseData = updateAppointment(payload);
        break;
      case 'deleteAppointment':
        responseData = deleteAppointment(payload);
        break;
        
      // Medicines
      case 'getMedicines':
        responseData = getMedicines();
        break;
      case 'addMedicine':
        responseData = addMedicine(payload);
        break;
      case 'updateMedicine':
        responseData = updateMedicine(payload);
        break;
      case 'deleteMedicine':
        responseData = deleteMedicine(payload);
        break;
        
      // Health Records
      case 'getHealthRecords':
        responseData = getHealthRecords();
        break;
      case 'addHealthRecord':
        responseData = addHealthRecord(payload);
        break;
      case 'updateHealthRecord':
        responseData = updateHealthRecord(payload);
        break;
      case 'deleteHealthRecord':
        responseData = deleteHealthRecord(payload);
        break;
        
      // AI Summarizer
      case 'getAiSummaries':
        responseData = getAiSummaries();
        break;
      case 'generateSummary':
        responseData = generateSummary(payload);
        break;
        
      default:
        throw new Error("Action not supported: " + action);
    }
    
    return createJsonResponse("success", responseData);
    
  } catch (error) {
    return createJsonResponse("error", null, error.toString());
  }
}

function createJsonResponse(status, data, errorMsg) {
  var output = {
    status: status,
    data: data,
    message: errorMsg || ""
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// SHEETS INITIALIZATION SETUP
// ==========================================

function initDatabaseSheets() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  var sheets = {
    "Appointments": ["id", "patientName", "doctorName", "title", "date", "time", "hospital", "reason", "notes", "calendarLink", "timestamp"],
    "Medicines": ["id", "medicineName", "dosage", "frequency", "morning", "afternoon", "night", "startDate", "endDate", "phoneNumber", "notes", "smsStatus", "timestamp"],
    "HealthRecords": ["id", "patientName", "age", "gender", "bloodGroup", "height", "weight", "allergies", "doctor", "followUpDate", "diagnosis", "prescription", "visitNotes", "timestamp"],
    "AISummaries": ["id", "patientName", "summaryText", "timestamp"]
  };
  
  for (var sheetName in sheets) {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(sheets[sheetName]);
      // Bold headers
      sheet.getRange(1, 1, 1, sheets[sheetName].length).setFontWeight("bold");
    }
  }
}

// ==========================================
// APPOINTMENTS CRUD FUNCTIONS
// ==========================================

function getAppointments() {
  return getSheetDataAsJson("Appointments");
}

function addAppointment(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Appointments");
  var id = "APT-" + Math.floor(1000 + Math.random() * 9000);
  var timestamp = new Date().getTime();
  
  // Create simple Google Calendar Event creation link
  var calendarLink = createGoogleCalendarLink(data.title, data.date, data.time, data.hospital, data.reason);
  
  var row = [
    id,
    data.patientName,
    data.doctorName,
    data.title,
    data.date,
    data.time,
    data.hospital,
    data.reason,
    data.notes || "",
    calendarLink,
    timestamp
  ];
  
  sheet.appendRow(row);
  data.id = id;
  data.calendarLink = calendarLink;
  data.timestamp = timestamp;
  return data;
}

function updateAppointment(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Appointments");
  var rows = sheet.getDataRange().getValues();
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.id) {
      var calendarLink = createGoogleCalendarLink(data.title, data.date, data.time, data.hospital, data.reason);
      
      // Update values
      sheet.getRange(i + 1, 2).setValue(data.patientName);
      sheet.getRange(i + 1, 3).setValue(data.doctorName);
      sheet.getRange(i + 1, 4).setValue(data.title);
      sheet.getRange(i + 1, 5).setValue(data.date);
      sheet.getRange(i + 1, 6).setValue(data.time);
      sheet.getRange(i + 1, 7).setValue(data.hospital);
      sheet.getRange(i + 1, 8).setValue(data.reason);
      sheet.getRange(i + 1, 9).setValue(data.notes || "");
      sheet.getRange(i + 1, 10).setValue(calendarLink);
      sheet.getRange(i + 1, 11).setValue(new Date().getTime());
      
      data.calendarLink = calendarLink;
      return data;
    }
  }
  throw new Error("Appointment not found with ID: " + data.id);
}

function deleteAppointment(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Appointments");
  var rows = sheet.getDataRange().getValues();
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.id) {
      sheet.deleteRow(i + 1);
      return { success: true, id: data.id };
    }
  }
  throw new Error("Appointment not found for cancellation: " + data.id);
}

// ==========================================
// MEDICATION REMINDERS CRUD & TWILIO INTEGRATION
// ==========================================

function getMedicines() {
  return getSheetDataAsJson("Medicines");
}

function addMedicine(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Medicines");
  var id = "MED-" + Math.floor(1000 + Math.random() * 9000);
  var timestamp = new Date().getTime();
  
  // Trigger SMS Reminder Alert via Twilio immediately upon reservation
  var smsStatus = "Failed";
  try {
    var smsText = "RK Health Alert: Hi " + data.notes.split('.')[0] + ", take " + data.medicineName + " (" + data.dosage + ") frequency: " + data.frequency + ". Directions: " + (data.notes || 'As prescribed.');
    var sid = sendTwilioSms(data.phoneNumber, smsText);
    if (sid) smsStatus = "Delivered";
  } catch (err) {
    Logger.log("Twilio SMS send error: " + err.toString());
  }
  
  var row = [
    id,
    data.medicineName,
    data.dosage,
    data.frequency,
    data.morning ? "TRUE" : "FALSE",
    data.afternoon ? "TRUE" : "FALSE",
    data.night ? "TRUE" : "FALSE",
    data.startDate,
    data.endDate,
    data.phoneNumber,
    data.notes || "",
    smsStatus,
    timestamp
  ];
  
  sheet.appendRow(row);
  data.id = id;
  data.smsStatus = smsStatus;
  data.timestamp = timestamp;
  return data;
}

function updateMedicine(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Medicines");
  var rows = sheet.getDataRange().getValues();
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.id) {
      sheet.getRange(i + 1, 2).setValue(data.medicineName);
      sheet.getRange(i + 1, 3).setValue(data.dosage);
      sheet.getRange(i + 1, 4).setValue(data.frequency);
      sheet.getRange(i + 1, 5).setValue(data.morning ? "TRUE" : "FALSE");
      sheet.getRange(i + 1, 6).setValue(data.afternoon ? "TRUE" : "FALSE");
      sheet.getRange(i + 1, 7).setValue(data.night ? "TRUE" : "FALSE");
      sheet.getRange(i + 1, 8).setValue(data.startDate);
      sheet.getRange(i + 1, 9).setValue(data.endDate);
      sheet.getRange(i + 1, 10).setValue(data.phoneNumber);
      sheet.getRange(i + 1, 11).setValue(data.notes || "");
      sheet.getRange(i + 1, 13).setValue(new Date().getTime());
      
      return data;
    }
  }
  throw new Error("Medication not found with ID: " + data.id);
}

function deleteMedicine(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Medicines");
  var rows = sheet.getDataRange().getValues();
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.id) {
      sheet.deleteRow(i + 1);
      return { success: true, id: data.id };
    }
  }
  throw new Error("Medication not found with ID: " + data.id);
}

// ==========================================
// PATIENT HEALTH RECORDS CRUD
// ==========================================

function getHealthRecords() {
  return getSheetDataAsJson("HealthRecords");
}

function addHealthRecord(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("HealthRecords");
  var id = "HLT-" + Math.floor(1000 + Math.random() * 9000);
  var timestamp = new Date().getTime();
  
  var row = [
    id,
    data.patientName,
    data.age,
    data.gender,
    data.bloodGroup,
    data.height,
    data.weight,
    data.allergies || "None",
    data.doctor,
    data.followUpDate || "",
    data.diagnosis,
    data.prescription,
    data.visitNotes || "",
    timestamp
  ];
  
  sheet.appendRow(row);
  data.id = id;
  data.timestamp = timestamp;
  return data;
}

function updateHealthRecord(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("HealthRecords");
  var rows = sheet.getDataRange().getValues();
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.id) {
      sheet.getRange(i + 1, 2).setValue(data.patientName);
      sheet.getRange(i + 1, 3).setValue(data.age);
      sheet.getRange(i + 1, 4).setValue(data.gender);
      sheet.getRange(i + 1, 5).setValue(data.bloodGroup);
      sheet.getRange(i + 1, 6).setValue(data.height);
      sheet.getRange(i + 1, 7).setValue(data.weight);
      sheet.getRange(i + 1, 8).setValue(data.allergies || "None");
      sheet.getRange(i + 1, 9).setValue(data.doctor);
      sheet.getRange(i + 1, 10).setValue(data.followUpDate || "");
      sheet.getRange(i + 1, 11).setValue(data.diagnosis);
      sheet.getRange(i + 1, 12).setValue(data.prescription);
      sheet.getRange(i + 1, 13).setValue(data.visitNotes || "");
      sheet.getRange(i + 1, 14).setValue(new Date().getTime());
      
      return data;
    }
  }
  throw new Error("Health record not found with ID: " + data.id);
}

function deleteHealthRecord(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("HealthRecords");
  var rows = sheet.getDataRange().getValues();
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][0] == data.id) {
      sheet.deleteRow(i + 1);
      return { success: true, id: data.id };
    }
  }
  throw new Error("Health record not found for deletion: " + data.id);
}

// ==========================================
// GROQ AI VISIT SUMMARIZER & CLOUD PROMPT
// ==========================================

function getAiSummaries() {
  return getSheetDataAsJson("AISummaries");
}

function generateSummary(data) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("AISummaries");
  var patientName = data.patientName;
  var details = data.visitDetails;
  
  // Retrieve API key from script property securely
  var apiKey = PropertiesService.getScriptProperties().getProperty("GROQ_API_KEY");

if (!apiKey) {
  throw new Error(
    "Groq API key is not configured. Please set GROQ_API_KEY in Google Apps Script > Project Settings > Script Properties."
  );
}
  
  // Prepare Contextual Prompt Engineering
  var systemPrompt = "You are a professional medical assistant. Translate clinical notes into structured, patient-friendly information. You MUST answer strictly in JSON format. Do not write any HTML. Output JSON must have exactly these keys: \n" +
      "{\n" +
      "  \"visitSummary\": \"patient friendly summary in 2 sentences max\",\n" +
      "  \"diagnosisExpl\": \"explain the diagnosis in very simple layman terms\",\n" +
      "  \"medInstructions\": \"detailed prescription instructions with timing warnings\",\n" +
      "  \"lifestyleSuggestions\": \"dietary, hydration and light physical exercise guidelines\",\n" +
      "  \"risks\": \"red flag emergency symptoms to look out for\",\n" +
      "  \"followUp\": \"follow up consultation details\"\n" +
      "}";
      
  var userPrompt = "Patient Name: " + patientName + "\n" +
      "Age: " + details.age + " / Gender: " + details.gender + "\n" +
      "Diagnosis: " + details.diagnosis + "\n" +
      "Prescription Instructions: " + details.prescription + "\n" +
      "Allergies: " + details.allergies + "\n" +
      "Doctor: " + details.doctor + "\n" +
      "Follow-up Date: " + details.followUpDate + "\n" +
      "Doctor Notes: " + details.visitNotes;

  var payload = {
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    response_format: { type: "json_object" },
    temperature: 0.2
  };
  
  var options = {
    method: "post",
    contentType: "application/json",
    headers: {
      Authorization: "Bearer " + apiKey
    },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  var response = UrlFetchApp.fetch("https://api.groq.com/openai/v1/chat/completions", options);
  var resCode = response.getResponseCode();
  var resContent = response.getContentText();
  
  if (resCode !== 200) {
    throw new Error("Groq API error (" + resCode + "): " + resContent);
  }
  
  var jsonResponse = JSON.parse(resContent);
  var aiResponseText = jsonResponse.choices[0].message.content;
  
  // Save record in Sheets
  var id = "AIS-" + Math.floor(1000 + Math.random() * 9000);
  var timestamp = new Date().getTime();
  
  // Check if summary already exists, override or append
  var rows = sheet.getDataRange().getValues();
  var exists = false;
  
  for (var i = 1; i < rows.length; i++) {
    if (rows[i][1] === patientName) {
      sheet.getRange(i + 1, 3).setValue(aiResponseText);
      sheet.getRange(i + 1, 4).setValue(timestamp);
      exists = true;
      id = rows[i][0];
      break;
    }
  }
  
  if (!exists) {
    sheet.appendRow([id, patientName, aiResponseText, timestamp]);
  }
  
  return {
    id: id,
    patientName: patientName,
    summaryText: aiResponseText,
    timestamp: timestamp
  };
}

// ==========================================
// SECURE CLOUD INTEGRATION WRAPPERS (TWILIO & CALENDAR)
// ==========================================

function sendTwilioSms(to, body) {
  var props = PropertiesService.getScriptProperties();
  var sid = props.getProperty("TWILIO_ACCOUNT_SID");
  var authToken = props.getProperty("TWILIO_AUTH_TOKEN");
  var fromPhone = props.getProperty("TWILIO_NUMBER");
  
  if (!sid || !authToken || !fromPhone) {
    Logger.log("Twilio properties missing. Skipping live SMS alert triggers.");
    return false;
  }
  
  var url = "https://api.twilio.com/2010-04-01/Accounts/" + sid + "/Messages.json";
  
  var payload = {
    To: to,
    From: fromPhone,
    Body: body
  };
  
  var options = {
    method: "post",
    payload: payload,
    headers: {
      Authorization: "Basic " + Utilities.base64Encode(sid + ":" + authToken)
    },
    muteHttpExceptions: true
  };
  
  var response = UrlFetchApp.fetch(url, options);
  var code = response.getResponseCode();
  var text = response.getContentText();
  
  if (code === 201 || code === 200) {
    var resData = JSON.parse(text);
    return resData.sid;
  } else {
    Logger.log("Twilio post failed (" + code + "): " + text);
    return false;
  }
}

function createGoogleCalendarLink(title, date, time, location, details) {
  // ISO Date conversions for calendar template URLs (Format: YYYYMMDDTHHMMSSZ)
  var startStr = date.replace(/-/g, "") + "T" + time.replace(/:/g, "") + "00";
  // Add 30 mins for end date
  var timeParts = time.split(":");
  var hour = parseInt(timeParts[0]);
  var min = parseInt(timeParts[1]) + 30;
  if (min >= 60) {
    min = min - 60;
    hour++;
  }
  var hourStr = (hour < 10) ? "0" + hour : hour.toString();
  var minStr = (min < 10) ? "0" + min : min.toString();
  var endStr = date.replace(/-/g, "") + "T" + hourStr + minStr + "00";
  
  return "https://calendar.google.com/calendar/render?action=TEMPLATE" + 
    "&text=" + encodeURIComponent(title) + 
    "&dates=" + startStr + "/" + endStr + 
    "&location=" + encodeURIComponent(location) + 
    "&details=" + encodeURIComponent(details);
}

// ==========================================
// DATABASE HELPERS
// ==========================================

function getSheetDataAsJson(sheetName) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];
  var data = [];
  
  for (var i = 1; i < rows.length; i++) {
    var item = {};
    for (var j = 0; j < headers.length; j++) {
      var val = rows[i][j];
      
      // Parse specific Boolean types from Sheet text
      if (val === "TRUE") val = true;
      if (val === "FALSE") val = false;
      
      item[headers[j]] = val;
    }
    data.push(item);
  }
  return data;
}
