/*
  Program name: homework4.js
  Author: Aabid Kazia
  Date created: April 20, 2026
  Date last edited: April 28, 2026
  Version: 4.0
  Description: New JavaScript file for homework 4 features.
  This file handles everything new that wasn't in hw3:
    - Fetch API to load states.html into the dropdown
    - Cookie functions (set, get, delete)
    - checkCookie() to show welcome message and pre-fill form
    - saveToStorage() to save field values to localStorage on blur
    - loadFromStorage() to restore saved data for returning users
    - saveCheckboxes() / loadCheckboxes() for the checkbox group
    - handleRememberMe() for the remember me checkbox
    - startAsNewUser() when they click "Not [name]? Start over"
    - doSubmit() which saves the cookie before going to thankyou.html
  All the field validators are still in validation.js from hw3.
*/


// =====================================================
// PAGE INIT
// called onload - runs everything in the right order
// =====================================================

function initPage() {

  // set the banner date first so it shows right away
  var days   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var months = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];
  var now = new Date();
  var d   = now.getDate();
  var sfx = (d===1||d===21||d===31)?"st":(d===2||d===22)?"nd":(d===3||d===23)?"rd":"th";
  document.getElementById("dynamic-date").innerHTML =
    "Today is: <strong>" + days[now.getDay()] + ", " +
    months[now.getMonth()] + " " + d + sfx + ", " + now.getFullYear() + "</strong>";
  document.getElementById("footer-year").textContent = now.getFullYear();

  // DOB limits
  var yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  var maxDate = yesterday.toISOString().split("T")[0];
  var minYear = new Date();
  minYear.setFullYear(now.getFullYear() - 120);
  var minDate = minYear.toISOString().split("T")[0];
  document.getElementById("dob").setAttribute("max", maxDate);
  document.getElementById("dob").setAttribute("min", minDate);

  // make sure submit button starts hidden
  document.getElementById("btn-submit").style.display = "none";

  // load the state dropdown using Fetch API
  loadStates();

  // check the cookie and set up the welcome message
  // this also loads localStorage data if returning user
  checkCookie();
}


// =====================================================
// FETCH API - load state options from external file
// This is the Fetch API requirement for homework 4.
// Instead of having 50+ options hardcoded in the HTML,
// we load them from a separate states.html file.
// =====================================================

function loadStates() {
  var dropdown = document.getElementById("state");

  // fetch() is the modern way to load external content
  fetch("states.html")
    .then(function(response) {
      // check that the request actually worked
      if (!response.ok) {
        throw new Error("Could not load states file. Status: " + response.status);
      }
      return response.text(); // get the response as plain text
    })
    .then(function(html) {
      // inject the option tags we got from the file into the dropdown
      dropdown.innerHTML = html;

      // if we already have a state saved in localStorage, restore it
      var saved = localStorage.getItem("amc_state");
      if (saved) {
        dropdown.value = saved;
      }

      console.log("States loaded successfully via Fetch API");
    })
    .catch(function(error) {
      // if the fetch fails for any reason, fall back to a basic message
      console.error("Fetch error loading states:", error);
      dropdown.innerHTML = '<option value="">(Could not load states - please try refreshing)</option>';
    });
}


// =====================================================
// COOKIE FUNCTIONS
// Set cookie with an expiry time (default 48 hours).
// Get cookie by name, returns "" if not found.
// Delete cookie by setting it to expire in the past.
// =====================================================

// set a cookie that expires in 'hours' hours (default 48)
function setCookie(name, value, hours) {
  hours = hours || 48; // default to 48 hours per assignment requirement
  var expires = new Date();
  expires.setTime(expires.getTime() + (hours * 60 * 60 * 1000));
  document.cookie = name + "=" + encodeURIComponent(value)
    + "; expires=" + expires.toUTCString()
    + "; path=/";
}

// get the value of a named cookie, returns "" if not found
function getCookie(name) {
  var nameEQ  = name + "=";
  var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var c = cookies[i].trim();
    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }
  return ""; // cookie not found
}

// expire a cookie by setting it to a past date
function deleteCookie(name) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
}


// =====================================================
// CHECK COOKIE ON PAGE LOAD
// This runs in initPage() to see if the user has been
// here before. If they have:
//   - show "Welcome back, [name]!" in the banner
//   - pre-fill the first name field
//   - show the "Not [name]?" link
//   - restore all their localStorage data
// If they haven't:
//   - show "Welcome, new patient!"
// =====================================================

function checkCookie() {
  var firstName = getCookie("amc_firstname");
  var welcomeEl = document.getElementById("welcome-msg");
  var notYouBox = document.getElementById("not-you-box");
  var notYouMsg = document.getElementById("not-you-msg");

  if (firstName && firstName.length > 0) {
    // returning user - show welcome back message
    if (welcomeEl) {
      welcomeEl.innerHTML = "Welcome back, <strong>" + firstName + "</strong>! &#128075;";
      welcomeEl.style.color = "#0ea47a";
    }

    // pre-fill the first name field
    var fnameField = document.getElementById("fname");
    if (fnameField) {
      fnameField.value = firstName;
    }

    // show the "Not [name]?" box
    if (notYouBox) { notYouBox.style.display = "flex"; }
    if (notYouMsg) {
      notYouMsg.textContent = "Not " + firstName + "?";
    }

    // restore all the other saved data from localStorage
    loadFromStorage();

  } else {
    // new user - show welcome message
    if (welcomeEl) {
      welcomeEl.textContent = "Welcome, new patient! Please fill in the form below.";
      welcomeEl.style.color = "rgba(255,255,255,0.8)";
    }
    if (notYouBox) { notYouBox.style.display = "none"; }
  }
}


// =====================================================
// START AS NEW USER
// Called when the user clicks "Not [name]? Click here"
// Expires the cookie, clears localStorage, resets form.
// =====================================================

function startAsNewUser() {
  // expire the name cookie
  deleteCookie("amc_firstname");

  // clear all our localStorage keys
  clearAllStorage();

  // reset the form
  document.getElementById("patientForm").reset();
  resetForm(); // this one is in validation.js - clears errors and review panel

  // update the welcome message to new user
  var welcomeEl = document.getElementById("welcome-msg");
  if (welcomeEl) {
    welcomeEl.textContent = "Welcome, new patient! Please fill in the form below.";
    welcomeEl.style.color = "rgba(255,255,255,0.8)";
  }

  // hide the "not you?" box
  document.getElementById("not-you-box").style.display = "none";
}


// =====================================================
// LOCAL STORAGE - SAVE
// Saves an individual form field value to localStorage.
// Called onblur on most fields.
// Key format: "amc_fieldId" so we don't collide with
// other sites' localStorage data.
// NOTE: passwords and SSN are NOT saved (sensitive data).
// =====================================================

function saveToStorage(fieldId) {
  // don't save if rememberMe is unchecked
  var rememberMe = document.getElementById("rememberMe");
  if (rememberMe && !rememberMe.checked) { return; }

  var field = document.getElementById(fieldId);
  if (!field) { return; }

  var val = field.value;

  // for radio buttons we need to get the selected value differently
  if (field.type === "radio") {
    val = getRadioValue(fieldId) || "";
  }

  localStorage.setItem("amc_" + fieldId, val);
}

// save all the checkbox states at once (called onchange for any checkbox)
function saveCheckboxes() {
  var rememberMe = document.getElementById("rememberMe");
  if (rememberMe && !rememberMe.checked) { return; }

  var names = ["hx_chickenpox","hx_measles","hx_covid","hx_smallpox",
               "hx_tetanus","hx_flu","hx_hepb"];
  var checked = [];
  for (var i = 0; i < names.length; i++) {
    var cb = document.querySelector('input[name="' + names[i] + '"]');
    if (cb && cb.checked) { checked.push(names[i]); }
  }
  localStorage.setItem("amc_checkboxes", JSON.stringify(checked));
}


// =====================================================
// LOCAL STORAGE - LOAD
// Restores all saved form data for a returning user.
// Called by checkCookie() when a cookie match is found.
// =====================================================

function loadFromStorage() {
  // list of simple text/date/select fields to restore
  var textFields = ["lname","mi","dob","email","phone",
                    "addr1","addr2","city","zip",
                    "userid","healthScore","salaryBar","symptoms"];

  for (var i = 0; i < textFields.length; i++) {
    var saved = localStorage.getItem("amc_" + textFields[i]);
    if (saved !== null && saved !== "") {
      var field = document.getElementById(textFields[i]);
      if (field) { field.value = saved; }
    }
  }

  // update slider displays after restoring their values
  updateSlider("healthScore","healthVal","","");
  updateSalarySlider();

  // state dropdown is handled in loadStates() after fetch completes
  var savedState = localStorage.getItem("amc_state");
  if (savedState) {
    // try to set it now, loadStates will also try after fetch
    var stateEl = document.getElementById("state");
    if (stateEl && stateEl.options.length > 1) {
      stateEl.value = savedState;
    }
  }

  // restore radio buttons
  var radioGroups = ["gender","vaccinated","insurance"];
  for (var j = 0; j < radioGroups.length; j++) {
    var savedVal = localStorage.getItem("amc_" + radioGroups[j]);
    if (savedVal) {
      var radios = document.getElementsByName(radioGroups[j]);
      for (var k = 0; k < radios.length; k++) {
        if (radios[k].value === savedVal) {
          radios[k].checked = true;
          break;
        }
      }
    }
  }

  // restore checkboxes
  var savedCbs = localStorage.getItem("amc_checkboxes");
  if (savedCbs) {
    try {
      var cbList = JSON.parse(savedCbs);
      for (var m = 0; m < cbList.length; m++) {
        var cb = document.querySelector('input[name="' + cbList[m] + '"]');
        if (cb) { cb.checked = true; }
      }
    } catch(e) {
      console.log("Could not parse saved checkboxes:", e);
    }
  }
}


// =====================================================
// CLEAR ALL STORAGE
// Removes all the "amc_" keys we saved to localStorage.
// Called when user unchecks Remember Me or starts over.
// =====================================================

function clearAllStorage() {
  var keys = ["fname","lname","mi","dob","email","phone",
              "addr1","addr2","city","state","zip",
              "gender","vaccinated","insurance",
              "healthScore","salaryBar","symptoms",
              "userid","checkboxes"];
  for (var i = 0; i < keys.length; i++) {
    localStorage.removeItem("amc_" + keys[i]);
  }
}


// =====================================================
// REMEMBER ME CHECKBOX HANDLER
// If unchecked: immediately expire cookie and clear storage.
// If rechecked: save current data back to storage.
// =====================================================

function handleRememberMe() {
  var cb = document.getElementById("rememberMe");
  if (!cb) { return; }

  if (!cb.checked) {
    // user unchecked it - remove everything right now
    deleteCookie("amc_firstname");
    clearAllStorage();

    // hide the "not you?" box
    document.getElementById("not-you-box").style.display = "none";

    // update welcome message
    var welcomeEl = document.getElementById("welcome-msg");
    if (welcomeEl) {
      welcomeEl.textContent = "Remember Me is off. Your data will not be saved.";
      welcomeEl.style.color = "rgba(255,200,100,0.9)";
    }
  } else {
    // user re-checked it - save the first name cookie again
    var fname = document.getElementById("fname").value.trim();
    if (fname) { setCookie("amc_firstname", fname, 48); }

    var welcomeEl = document.getElementById("welcome-msg");
    if (welcomeEl) {
      welcomeEl.textContent = "Remember Me is on. Your info will be saved for next time.";
      welcomeEl.style.color = "#0ea47a";
    }
  }
}


// =====================================================
// SUBMIT
// Saves the cookie and all localStorage data before
// redirecting to thankyou.html.
// Only called when btn-submit is clicked (which only
// shows up when errorFlags is empty).
// =====================================================

function doSubmit() {
  // run all validators one final time using the shared helper in validation.js
  var allGood = runAllValidators();

  if (!allGood || Object.keys(errorFlags).length > 0) {
    document.getElementById("btn-submit").style.display = "none";
    alert("Please fix the remaining errors before submitting.");
    return;
  }

  // check remember me checkbox
  var rememberMe = document.getElementById("rememberMe");
  if (rememberMe && rememberMe.checked) {
    // save the first name cookie for 48 hours
    var fname = document.getElementById("fname").value.trim();
    if (fname) { setCookie("amc_firstname", fname, 48); }

    // save all non-sensitive fields to localStorage
    var fieldsToSave = ["fname","lname","mi","dob","email","phone",
                        "addr1","addr2","city","state","zip",
                        "userid","healthScore","salaryBar","symptoms"];
    for (var i = 0; i < fieldsToSave.length; i++) {
      saveToStorage(fieldsToSave[i]);
    }
    saveCheckboxes();

    // save radio values
    ["gender","vaccinated","insurance"].forEach(function(g) {
      var val = getRadioValue(g);
      if (val) { localStorage.setItem("amc_" + g, val); }
    });
  } else {
    // remember me was unchecked - clear everything
    deleteCookie("amc_firstname");
    clearAllStorage();
  }

  // all good - go to thank you page
  window.location.href = "thankyou.html";
}


// getRadioValue() is defined in validation.js


// end of homework4.js
