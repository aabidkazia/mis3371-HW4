/*
  Program name: validation.js
  Author: Aabid Kazia
  Date created: April 1, 2026
  Date last edited: April 14, 2026
  Version: 3.0
  Description: All the JavaScript for the Aabids Medical Clinic patient
  registration form (homework 3). This version does validation on the
  fly as the user types or leaves each field, not just on submit.
  Every field has its own validator function that gets called by
  oninput and/or onblur events in the HTML.

  The big new thing in hw3 is the error counting system. Every time
  a validator runs it either registers an error or clears it in the
  errorFlags object. The updateErrorBanner() function adds up all
  the errors and shows/hides the submit button accordingly.

  Functions in this file:
    initPage()              - sets date + DOB limits (called onload)
    showError()             - puts red text under a field
    clearError()            - removes the red text
    registerError()         - marks a field as having an error
    clearFieldError()       - marks a field as clean
    updateErrorBanner()     - counts errors, shows/hides submit button
    forceLowercase()        - lowercases a field value
    validateName()          - first and last name
    validateMI()            - middle initial
    validateDOB()           - date of birth range check
    formatSSN()             - auto-inserts dashes as user types
    validateSSN()           - checks SSN has 9 digits
    validateEmail()         - checks name@domain.tld format
    formatPhone()           - auto-inserts dashes as user types
    validatePhone()         - checks phone format if entered
    validateAddress()       - address lines 1 and 2
    validateCity()          - city field
    validateState()         - state dropdown
    validateZip()           - 5 digit zip
    validateRadio()         - radio button groups
    validateSymptoms()      - textarea (no double quotes)
    validateUserID()        - user id rules
    validatePassword()      - password strength check
    checkPasswordMatch()    - compares both password fields
    updateSlider()          - live health score display
    updateSalarySlider()    - live salary display with $ formatting
    handleValidate()        - the Validate button handler
    showReview()            - builds the review panel
    doSubmit()              - goes to thankyou.html
    resetForm()             - clears form + review + error state
    getRadioValue()         - helper to get selected radio
*/


// =====================================================
// ERROR TRACKING
// keeps track of which fields have errors so we know
// when it's safe to show the submit button
// =====================================================

// each key is a field ID, value is true if that field has an error
var errorFlags = {};

// mark a field as having an error
function registerError(fieldId) {
  errorFlags[fieldId] = true;
  updateErrorBanner();
}

// mark a field as being clean (no error)
function clearFieldError(fieldId) {
  delete errorFlags[fieldId];
  updateErrorBanner();
}

// count all errors and update the error banner + submit button visibility
function updateErrorBanner() {
  var count  = Object.keys(errorFlags).length;
  var banner = document.getElementById("error-banner");
  var msg    = document.getElementById("error-count-msg");
  var submit = document.getElementById("btn-submit");

  if (count === 0) {
    // no errors - hide banner, show submit
    if (banner) { banner.style.display = "none"; }
    if (submit) { submit.style.display = "inline-block"; }
  } else {
    // has errors - show banner with count, hide submit
    if (banner) { banner.style.display = "block"; }
    if (msg) {
      msg.textContent = count === 1
        ? "There is 1 error on the form. Please fix it before submitting."
        : "There are " + count + " errors on the form. Please fix them before submitting.";
    }
    if (submit) { submit.style.display = "none"; }
  }
}


// =====================================================
// ERROR MESSAGE DISPLAY HELPERS
// =====================================================

function showError(errId, message, fieldId) {
  var el = document.getElementById(errId);
  if (el) {
    el.textContent = "\u26a0 " + message; // ⚠ warning symbol
    el.style.display = "inline";
  }
  if (fieldId) { registerError(fieldId); }
}

function clearError(errId, fieldId) {
  var el = document.getElementById(errId);
  if (el) {
    el.textContent = "";
    el.style.display = "none";
  }
  if (fieldId) { clearFieldError(fieldId); }
}


// =====================================================
// FORCE LOWERCASE
// called onblur for email and userid fields
// =====================================================

function forceLowercase(fieldId) {
  var field = document.getElementById(fieldId);
  if (field) {
    field.value = field.value.toLowerCase();
  }
}


// =====================================================
// VALIDATE NAME (first name and last name)
// called oninput and onblur
// rules: 1-30 chars, letters/apostrophes/dashes only
// =====================================================

function validateName(fieldId, errId, label) {
  var field = document.getElementById(fieldId);
  if (!field) { return; }
  var val = field.value.trim();

  if (val.length === 0) {
    showError(errId, label + " is required.", fieldId);
    return false;
  }
  if (val.length > 30) {
    showError(errId, label + " cannot be longer than 30 characters.", fieldId);
    return false;
  }
  if (!/^[A-Za-z'\-]{1,30}$/.test(val)) {
    showError(errId, label + ": letters, apostrophes, and dashes only. No numbers.", fieldId);
    return false;
  }
  clearError(errId, fieldId);
  return true;
}


// =====================================================
// VALIDATE MIDDLE INITIAL
// optional - if blank that's fine. if filled in must be one letter.
// =====================================================

function validateMI() {
  var val = document.getElementById("mi").value;
  if (val.length === 0) {
    clearError("mi-err", "mi"); // blank is ok
    return true;
  }
  if (!/^[A-Za-z]$/.test(val)) {
    showError("mi-err", "Middle initial must be a single letter only.", "mi");
    return false;
  }
  clearError("mi-err", "mi");
  return true;
}


// =====================================================
// VALIDATE DATE OF BIRTH
// must be a real past date
// can't be in the future
// can't be more than 120 years ago
// =====================================================

function validateDOB() {
  var val = document.getElementById("dob").value;

  if (!val) {
    showError("dob-err", "Date of Birth is required.", "dob");
    return false;
  }

  var dobDate = new Date(val);
  var today   = new Date();
  var minDate = new Date();
  minDate.setFullYear(today.getFullYear() - 120);

  // note: using >= today because you can't be born today and register
  if (dobDate >= today) {
    showError("dob-err", "Date of Birth cannot be today or in the future.", "dob");
    return false;
  }
  if (dobDate < minDate) {
    showError("dob-err", "Date of Birth cannot be more than 120 years ago.", "dob");
    return false;
  }

  clearError("dob-err", "dob");
  return true;
}


// =====================================================
// SSN AUTO-FORMATTER
// called oninput - inserts dashes automatically
// after 3rd digit: XXX-
// after 5th digit: XXX-XX-
// result: XXX-XX-XXXX
// also strips any non-digit characters the user types
// =====================================================

function formatSSN() {
  var field = document.getElementById("ssn");
  if (!field) { return; }

  // grab just the digits from whatever they typed
  var digits = field.value.replace(/\D/g, "");

  // limit to 9 digits
  if (digits.length > 9) { digits = digits.substring(0, 9); }

  // rebuild with dashes in the right places
  var formatted = "";
  if (digits.length <= 3) {
    formatted = digits;
  } else if (digits.length <= 5) {
    formatted = digits.substring(0,3) + "-" + digits.substring(3);
  } else {
    formatted = digits.substring(0,3) + "-" + digits.substring(3,5) + "-" + digits.substring(5);
  }

  field.value = formatted;

  // clear the error while they're still typing if they've got 9 digits
  if (digits.length === 9) {
    clearError("ssn-err", "ssn");
  }
}

function validateSSN() {
  var val    = document.getElementById("ssn").value;
  var digits = val.replace(/\D/g, ""); // count digits only

  if (digits.length === 0) {
    showError("ssn-err", "Social Security Number is required.", "ssn");
    return false;
  }
  if (digits.length !== 9) {
    showError("ssn-err", "SSN must be exactly 9 digits (format: XXX-XX-XXXX).", "ssn");
    return false;
  }
  if (/[^0-9\-]/.test(val)) {
    showError("ssn-err", "SSN can only contain numbers.", "ssn");
    return false;
  }
  clearError("ssn-err", "ssn");
  return true;
}


// =====================================================
// VALIDATE EMAIL
// checks for the @ symbol and a dot in the right places
// also forces lowercase since email addresses are case-insensitive
// =====================================================

function validateEmail() {
  var field = document.getElementById("email");
  if (!field) { return; }
  var val = field.value.trim().toLowerCase();
  field.value = val; // force lowercase as they type

  if (val.length === 0) {
    showError("email-err", "Email address is required.", "email");
    return false;
  }
  // standard email regex: name@domain.tld
  if (!/^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(val)) {
    showError("email-err", "Email must be in the format name@domain.com", "email");
    return false;
  }
  clearError("email-err", "email");
  return true;
}


// =====================================================
// PHONE AUTO-FORMATTER
// called oninput - inserts dashes automatically
// after 3rd digit: NNN-
// after 6th digit: NNN-NNN-
// result: NNN-NNN-NNNN
// =====================================================

function formatPhone() {
  var field = document.getElementById("phone");
  if (!field) { return; }

  var digits = field.value.replace(/\D/g, "");
  if (digits.length > 10) { digits = digits.substring(0, 10); }

  var formatted = "";
  if (digits.length <= 3) {
    formatted = digits;
  } else if (digits.length <= 6) {
    formatted = digits.substring(0,3) + "-" + digits.substring(3);
  } else {
    formatted = digits.substring(0,3) + "-" + digits.substring(3,6) + "-" + digits.substring(6);
  }

  field.value = formatted;
}

function validatePhone() {
  var val = document.getElementById("phone").value.trim();

  // phone is optional - if blank, clear any error and move on
  if (val.length === 0) {
    clearError("phone-err", "phone");
    return true;
  }
  // if they filled something in it needs to be the right format
  if (!/^\d{3}-\d{3}-\d{4}$/.test(val)) {
    showError("phone-err", "Phone must be 10 digits in the format NNN-NNN-NNNN.", "phone");
    return false;
  }
  clearError("phone-err", "phone");
  return true;
}


// =====================================================
// VALIDATE ADDRESS
// addr1 is required, addr2 is optional
// both need 2-30 characters if filled in
// =====================================================

function validateAddress(fieldId, errId, isRequired) {
  var val = document.getElementById(fieldId).value.trim();

  if (val.length === 0) {
    if (isRequired) {
      showError(errId, "Address Line 1 is required.", fieldId);
      return false;
    } else {
      clearError(errId, fieldId); // addr2 blank is fine
      return true;
    }
  }
  if (val.length < 2) {
    showError(errId, "Address needs at least 2 characters.", fieldId);
    return false;
  }
  if (val.length > 30) {
    showError(errId, "Address cannot be longer than 30 characters.", fieldId);
    return false;
  }
  clearError(errId, fieldId);
  return true;
}


// =====================================================
// VALIDATE CITY
// =====================================================

function validateCity() {
  var val = document.getElementById("city").value.trim();

  if (val.length === 0) {
    showError("city-err", "City is required.", "city");
    return false;
  }
  if (val.length < 2 || val.length > 30) {
    showError("city-err", "City must be 2 to 30 characters.", "city");
    return false;
  }
  if (!/^[A-Za-z\s\-\.]+$/.test(val)) {
    showError("city-err", "City must contain letters only.", "city");
    return false;
  }
  clearError("city-err", "city");
  return true;
}


// =====================================================
// VALIDATE STATE
// =====================================================

function validateState() {
  var val = document.getElementById("state").value;
  if (!val) {
    showError("state-err", "Please select a state.", "state");
    return false;
  }
  clearError("state-err", "state");
  return true;
}


// =====================================================
// VALIDATE ZIP
// exactly 5 digits, nothing else
// =====================================================

function validateZip() {
  var val = document.getElementById("zip").value.trim();

  if (val.length === 0) {
    showError("zip-err", "ZIP Code is required.", "zip");
    return false;
  }
  if (!/^\d{5}$/.test(val)) {
    showError("zip-err", "ZIP Code must be exactly 5 digits (numbers only).", "zip");
    return false;
  }
  clearError("zip-err", "zip");
  return true;
}


// =====================================================
// VALIDATE RADIO GROUPS
// called onchange on each radio option
// =====================================================

function validateRadio(groupName, errId, message) {
  var val = getRadioValue(groupName);
  if (!val) {
    showError(errId, message, groupName);
    return false;
  }
  clearError(errId, groupName);
  return true;
}


// =====================================================
// VALIDATE SYMPTOMS TEXTAREA
// optional but blocks double quotes because they can
// mess up database queries if stored
// =====================================================

function validateSymptoms() {
  var val = document.getElementById("symptoms").value;
  if (/"/.test(val)) {
    showError("symptoms-err", "Please remove quotation marks from this field.", "symptoms");
    return false;
  }
  clearError("symptoms-err", "symptoms");
  return true;
}


// =====================================================
// VALIDATE USER ID
// rules from the assignment:
//   - 5 to 20 characters
//   - must NOT start with a number
//   - letters, numbers, dash, underscore only
//   - no spaces or other special characters
//   - auto-lowercased
// =====================================================

function validateUserID() {
  var field = document.getElementById("userid");
  if (!field) { return; }
  var val = field.value.toLowerCase(); // enforce lowercase
  field.value = val;

  if (val.length === 0) {
    showError("userid-err", "User ID is required.", "userid");
    return false;
  }
  if (val.length < 5) {
    showError("userid-err", "User ID must be at least 5 characters.", "userid");
    return false;
  }
  if (val.length > 20) {
    showError("userid-err", "User ID cannot be longer than 20 characters.", "userid");
    return false;
  }
  // check that first character is a letter (not a number)
  if (/^[0-9]/.test(val)) {
    showError("userid-err", "User ID cannot start with a number. Start with a letter.", "userid");
    return false;
  }
  // check for spaces
  if (/\s/.test(val)) {
    showError("userid-err", "User ID cannot contain spaces.", "userid");
    return false;
  }
  // only letters, numbers, dash, underscore allowed
  if (!/^[a-z0-9_\-]+$/.test(val)) {
    showError("userid-err", "User ID can only have letters, numbers, dashes, and underscores.", "userid");
    return false;
  }
  clearError("userid-err", "userid");
  return true;
}


// =====================================================
// VALIDATE PASSWORD
// rules:
//   - 8 to 30 characters
//   - at least 1 uppercase letter
//   - at least 1 lowercase letter
//   - at least 1 digit
//   - cannot equal the user ID
//   - no double quotes
// also updates the live strength bar
// =====================================================

function validatePassword() {
  var pwd    = document.getElementById("passid").value;
  var uid    = document.getElementById("userid").value.toLowerCase();
  var bar    = document.getElementById("strength-bar");
  var label  = document.getElementById("strength-label");

  // update strength bar even before we check for errors
  updateStrengthBar(pwd, bar, label);

  if (pwd.length === 0) {
    showError("passid-err", "Password is required.", "passid");
    return false;
  }
  if (pwd.length < 8) {
    showError("passid-err", "Password must be at least 8 characters long.", "passid");
    return false;
  }
  if (pwd.length > 30) {
    showError("passid-err", "Password cannot be longer than 30 characters.", "passid");
    return false;
  }
  if (!/[A-Z]/.test(pwd)) {
    showError("passid-err", "Password needs at least 1 uppercase letter.", "passid");
    return false;
  }
  if (!/[a-z]/.test(pwd)) {
    showError("passid-err", "Password needs at least 1 lowercase letter.", "passid");
    return false;
  }
  if (!/[0-9]/.test(pwd)) {
    showError("passid-err", "Password needs at least 1 number.", "passid");
    return false;
  }
  if (/"/.test(pwd)) {
    showError("passid-err", "Password cannot contain quotation marks.", "passid");
    return false;
  }
  // password can't just be the user ID
  if (uid.length > 0 && pwd.toLowerCase() === uid) {
    showError("passid-err", "Password cannot be the same as your User ID.", "passid");
    return false;
  }
  clearError("passid-err", "passid");
  return true;
}

// updates the visual strength bar under the password field
function updateStrengthBar(pwd, bar, label) {
  if (!bar || !label) { return; }

  if (pwd.length === 0) {
    bar.style.width = "0%";
    bar.style.backgroundColor = "#ccc";
    label.textContent = "";
    return;
  }

  var score = 0;
  if (pwd.length >= 8)                        { score++; }
  if (pwd.length >= 12)                       { score++; }
  if (/[A-Z]/.test(pwd))                     { score++; }
  if (/[a-z]/.test(pwd))                     { score++; }
  if (/[0-9]/.test(pwd))                     { score++; }
  if (/[!@#$%^&*()\-_+=]/.test(pwd))         { score++; }

  var pct   = Math.round((score / 6) * 100);
  var color = score <= 2 ? "#e74c3c" : score <= 4 ? "#f39c12" : "#27ae60";
  var text  = score <= 2 ? "Weak - needs uppercase, number, and special char"
            : score <= 4 ? "Fair - getting better!"
            :              "Strong \u2714";

  bar.style.width           = pct + "%";
  bar.style.backgroundColor = color;
  label.textContent         = text;
  label.style.color         = color;
}


// =====================================================
// CHECK PASSWORD MATCH
// called oninput on both password fields
// shows live green check or red X
// =====================================================

function checkPasswordMatch() {
  var p1    = document.getElementById("passid").value;
  var p2    = document.getElementById("passid2").value;
  var label = document.getElementById("match-label");

  if (p2.length === 0) {
    // don't show anything until they start typing the second field
    if (label) { label.textContent = ""; }
    clearError("passid2-err", "passid2");
    return;
  }

  if (p1 === p2) {
    if (label) {
      label.textContent = "\u2714 Passwords match";
      label.style.color = "#27ae60";
    }
    clearError("passid2-err", "passid2");
  } else {
    if (label) { label.textContent = ""; }
    showError("passid2-err", "Passwords do not match.", "passid2");
  }
}


// =====================================================
// SLIDER FUNCTIONS
// update the live value display next to each slider
// =====================================================

function updateSlider(sliderId, displayId, prefix, suffix) {
  var slider  = document.getElementById(sliderId);
  var display = document.getElementById(displayId);
  if (slider && display) {
    display.textContent = prefix + slider.value + suffix;
  }
}

function updateSalarySlider() {
  var slider  = document.getElementById("salaryBar");
  var display = document.getElementById("salaryVal");
  if (slider && display) {
    var val = parseInt(slider.value, 10);
    display.textContent = "$" + val.toLocaleString("en-US");
  }
}


// =====================================================
// VALIDATE BUTTON HANDLER
// this is the main one the professor asked for.
// runs EVERY validator on every field, collects all errors,
// then shows the submit button only if everything passes.
// also builds the review panel at the same time.
// =====================================================

function handleValidate() {

  // run all validators in order
  // these each update errorFlags internally
  validateName("fname", "fname-err", "First Name");
  validateMI();
  validateName("lname", "lname-err", "Last Name");
  validateDOB();
  validateSSN();
  validateEmail();
  validatePhone();
  validateAddress("addr1", "addr1-err", true);
  validateAddress("addr2", "addr2-err", false);
  validateCity();
  validateState();
  validateZip();
  validateRadio("gender",    "gender-err",    "Please select a gender.");
  validateRadio("vaccinated","vaccinated-err", "Please indicate vaccination status.");
  validateRadio("insurance", "insurance-err",  "Please indicate insurance status.");
  validateSymptoms();
  validateUserID();
  validatePassword();
  checkPasswordMatch();

  // show the review panel with all results
  showReview();

  // count errors
  var count = Object.keys(errorFlags).length;
  if (count === 0) {
    // all clean - show submit button
    document.getElementById("btn-submit").style.display = "inline-block";
    // scroll to top of review panel
    document.getElementById("review-panel").scrollIntoView({behavior:"smooth", block:"start"});
  } else {
    // still errors - make sure submit stays hidden
    document.getElementById("btn-submit").style.display = "none";
    // scroll to the first visible error message
    var firstErr = document.querySelector(".err-msg:not(:empty)");
    if (firstErr) {
      firstErr.scrollIntoView({behavior:"smooth", block:"center"});
    }
  }
}


// =====================================================
// REVIEW PANEL BUILDER
// shows all entered data with pass/error status
// does NOT reload the page - just updates the div innerHTML
// =====================================================

function showReview() {
  var frm  = document.patientForm;
  var body = document.getElementById("review-body");
  if (!body) { return; }

  // builds one review row
  function makeRow(label, value, fieldId, note) {
    var hasErr      = errorFlags[fieldId] ? true : false;
    var statusClass = hasErr ? "rv-error" : "rv-pass";
    var statusText  = hasErr ? "\u2718 ERROR" : "\u2714 OK";
    var noteHtml    = note ? '<span class="rv-note">' + note + '</span>' : "";
    return '<div class="rv-row">'
         + '<span class="rv-label">' + label + '</span>'
         + '<span class="rv-value">' + (value || "<em>not entered</em>") + '</span>'
         + '<span class="rv-status ' + statusClass + '">' + statusText + '</span>'
         + noteHtml
         + '</div>';
  }

  // read all values
  var fname    = frm.fname.value.trim();
  var mi       = frm.mi.value.trim();
  var lname    = frm.lname.value.trim();
  var dob      = frm.dob.value;
  var ssn      = frm.ssn.value.trim();
  var email    = frm.email.value.trim();
  var phone    = frm.phone.value.trim();
  var addr1    = frm.addr1.value.trim();
  var addr2    = frm.addr2.value.trim();
  var city     = frm.city.value.trim();
  var state    = frm.state.value;
  var zip      = frm.zip.value.trim();
  var gender   = getRadioValue("gender");
  var vaccin   = getRadioValue("vaccinated");
  var insur    = getRadioValue("insurance");
  var health   = frm.healthScore.value;
  var salary   = parseInt(frm.salaryBar.value, 10);
  var symptoms = frm.symptoms.value.trim();
  var userid   = frm.userid.value.trim().toLowerCase();
  var pwd      = frm.passid.value;
  var pwd2     = frm.passid2.value;

  // collect checked checkboxes
  var cbMap = [
    {name:"hx_chickenpox",label:"Chicken Pox"},
    {name:"hx_measles",   label:"Measles"},
    {name:"hx_covid",     label:"COVID-19"},
    {name:"hx_smallpox",  label:"Small Pox"},
    {name:"hx_tetanus",   label:"Tetanus Shot"},
    {name:"hx_flu",       label:"Flu Shot"},
    {name:"hx_hepb",      label:"Hepatitis B"}
  ];
  var cbChecked = [];
  for (var i = 0; i < cbMap.length; i++) {
    var cb = document.querySelector('input[name="' + cbMap[i].name + '"]');
    if (cb && cb.checked) { cbChecked.push(cbMap[i].label); }
  }

  // format dob for display (YYYY-MM-DD to MM/DD/YYYY)
  var dobDisplay = dob;
  if (dob) {
    var parts = dob.split("-");
    if (parts.length === 3) { dobDisplay = parts[1]+"/"+parts[2]+"/"+parts[0]; }
  }

  // build the HTML
  var html = "";

  html += '<div class="rv-section-title">Personal Information</div>';
  html += makeRow("Full Name",      fname + (mi?" "+mi+".":"") + " " + lname, "fname",  "");
  html += makeRow("Date of Birth",  dobDisplay,          "dob",    "");
  html += makeRow("Social Security","***-**-****",        "ssn",    "SSN hidden for security");

  html += '<div class="rv-section-title">Contact Information</div>';
  html += makeRow("Email",  email, "email", "");
  html += makeRow("Phone",  phone || "not provided", "phone", "");

  html += '<div class="rv-section-title">Address</div>';
  var addrFull = addr1 + (addr2?"<br>"+addr2:"") + "<br>" + city+", "+state+" "+zip;
  html += makeRow("Address", addrFull, "addr1", "");

  html += '<div class="rv-section-title">Health &amp; Preferences</div>';
  html += makeRow("Medical History", cbChecked.length>0?cbChecked.join(", "):"None selected", "_cb", "");
  html += makeRow("Gender",       gender||"", "gender",    "");
  html += makeRow("Vaccinated",   vaccin||"", "vaccinated","");
  html += makeRow("Insurance",    insur ||"", "insurance", "");
  html += makeRow("Health Score", health+" / 10", "_health", "");
  html += makeRow("Salary Goal",  "$"+salary.toLocaleString("en-US")+"/yr", "_salary", "");
  html += makeRow("Symptoms",     symptoms||"<em>none</em>", "symptoms", "");

  html += '<div class="rv-section-title">Account Credentials</div>';
  html += makeRow("User ID",   userid||"", "userid",  "");
  html += makeRow("Password",  pwd?"\u25cf\u25cf\u25cf\u25cf\u25cf\u25cf\u25cf\u25cf (hidden)":"", "passid", "");
  html += makeRow("Confirmed", pwd2?"\u2714 entered":"", "passid2", "");

  body.innerHTML = html;

  // scroll into view
  var panel = document.getElementById("review-panel");
  if (panel) { panel.scrollIntoView({behavior:"smooth", block:"start"}); }
}


// doSubmit is handled by homework4.js in hw4
// shared helper called by both handleValidate and doSubmit in hw4
function runAllValidators() {
  var allGood = true;
  allGood = validateName('fname','fname-err','First Name') && allGood;
  allGood = validateMI()                                   && allGood;
  allGood = validateName('lname','lname-err','Last Name')  && allGood;
  allGood = validateDOB()                                  && allGood;
  allGood = validateSSN()                                  && allGood;
  allGood = validateEmail()                                && allGood;
  allGood = validatePhone()                                && allGood;
  allGood = validateAddress('addr1','addr1-err',true)      && allGood;
  allGood = validateAddress('addr2','addr2-err',false)     && allGood;
  allGood = validateCity()                                 && allGood;
  allGood = validateState()                                && allGood;
  allGood = validateZip()                                  && allGood;
  allGood = validateUserID()                               && allGood;
  allGood = validatePassword()                             && allGood;
  var p1 = document.getElementById('passid').value;
  var p2 = document.getElementById('passid2').value;
  if (p1 !== p2) {
    showError('passid2-err','Passwords do not match.','passid2');
    allGood = false;
  }
  return allGood;
}

// end of validation.js
