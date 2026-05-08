/*
  Program name: homework4.js
  Author: Aabid Kazia
  Date created: April 20, 2026
  Date last edited: April 28, 2026
  Version: 4.0

  Description:
  This JS file basically handles all the newer stuff added in HW4 that wasn't in HW3.
  Tried to keep things somewhat organized but yeah... it's doing quite a bit now.

  Stuff included:
    - Fetch API for loading states dynamically (so we don't hardcode all 50 states... thank god)
    - Cookie helpers (set/get/delete)
    - checkCookie() → decides if user is returning or new
    - localStorage save/load helpers
    - checkbox + radio persistence
    - Remember Me logic
    - submit handler that saves everything before redirect

  NOTE:
  Validation is still in validation.js (didn't want to touch that again lol)
*/


// =====================================================
// PAGE INIT
// Runs when page loads. Order kinda matters here.
// =====================================================

function initPage() {

  // setting up date banner first so user sees *something* immediately
  var days   = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  var months = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

  var now = new Date();
  var d   = now.getDate();

  // suffix logic... probably overkill but assignment wanted it
  var sfx = (d===1||d===21||d===31)?"st":(d===2||d===22)?"nd":(d===3||d===23)?"rd":"th";

  document.getElementById("dynamic-date").innerHTML =
    "Today is: <strong>" + days[now.getDay()] + ", " +
    months[now.getMonth()] + " " + d + sfx + ", " + now.getFullYear() + "</strong>";

  // footer year (kept simple)
  document.getElementById("footer-year").textContent = now.getFullYear();

  // ---- DOB limits ----
  var yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);

  var maxDate = yesterday.toISOString().split("T")[0];

  var minYear = new Date();
  minYear.setFullYear(now.getFullYear() - 120); // 120 yrs max age... seems reasonable

  var minDate = minYear.toISOString().split("T")[0];

  document.getElementById("dob").setAttribute("max", maxDate);
  document.getElementById("dob").setAttribute("min", minDate);

  // hide submit button initially (it only shows when validation passes)
  document.getElementById("btn-submit").style.display = "none";

  // load states dropdown (async)
  loadStates();

  // check cookies + restore user data if available
  checkCookie();
}


// =====================================================
// FETCH API - loads states into dropdown
// honestly way better than hardcoding all options
// =====================================================

function loadStates() {

  var dropdown = document.getElementById("state");

  fetch("states.html")
    .then(function(response) {

      // quick sanity check
      if (!response.ok) {
        // might want better error handling later...
        throw new Error("Could not load states file. Status: " + response.status);
      }

      return response.text();
    })
    .then(function(html) {

      // dump HTML straight into select (kinda hacky but works fine)
      dropdown.innerHTML = html;

      // restore saved state if exists
      var saved = localStorage.getItem("amc_state");

      if (saved) {
        dropdown.value = saved;
      }

      console.log("States loaded successfully via Fetch API");
    })
    .catch(function(error) {

      console.error("Fetch error loading states:", error);

      // fallback message
      dropdown.innerHTML = '<option value="">(Could not load states - try refreshing maybe)</option>';
    });
}


// =====================================================
// COOKIE FUNCTIONS
// Pretty standard stuff, nothing fancy here
// =====================================================

// sets cookie (default 48 hrs)
function setCookie(name, value, hours) {

  // fallback if hours not passed in
  hours = hours || 48;

  var expires = new Date();
  expires.setTime(expires.getTime() + (hours * 60 * 60 * 1000));

  document.cookie = name + "=" + encodeURIComponent(value)
    + "; expires=" + expires.toUTCString()
    + "; path=/";
}


// gets cookie value (returns empty string if not found)
function getCookie(name) {

  var nameEQ  = name + "=";
  var cookies = document.cookie.split(";");

  for (var i = 0; i < cookies.length; i++) {

    var c = cookies[i].trim();

    if (c.indexOf(nameEQ) === 0) {
      return decodeURIComponent(c.substring(nameEQ.length));
    }
  }

  return ""; // nothing found
}


// deletes cookie by expiring it
function deleteCookie(name) {

  // old date trick
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/";
}


// =====================================================
// CHECK COOKIE
// Determines if returning user or not
// =====================================================

function checkCookie() {

  var firstName = getCookie("amc_firstname");

  var welcomeEl = document.getElementById("welcome-msg");
  var notYouBox = document.getElementById("not-you-box");
  var notYouMsg = document.getElementById("not-you-msg");

  if (firstName && firstName.length > 0) {

    // returning user
    if (welcomeEl) {
      welcomeEl.innerHTML = "Welcome back, <strong>" + firstName + "</strong>! 👋";
      welcomeEl.style.color = "#0ea47a";
    }

    // prefill fname (nice UX touch)
    var fnameField = document.getElementById("fname");
    if (fnameField) {
      fnameField.value = firstName;
    }

    // show "not you?" section
    if (notYouBox) { notYouBox.style.display = "flex"; }

    if (notYouMsg) {
      notYouMsg.textContent = "Not " + firstName + "?";
    }

    // restore rest of data
    loadFromStorage();

  } else {

    // new user case
    if (welcomeEl) {
      welcomeEl.textContent = "Welcome, new patient! Please fill in the form below.";
      welcomeEl.style.color = "rgba(255,255,255,0.8)";
    }

    if (notYouBox) { notYouBox.style.display = "none"; }
  }
}


// =====================================================
// START AS NEW USER
// clears everything and resets form
// =====================================================

function startAsNewUser() {

  deleteCookie("amc_firstname");

  // wipe localStorage keys
  clearAllStorage();

  // reset form UI
  document.getElementById("patientForm").reset();

  // also reset validation stuff (from other file)
  resetForm();

  var welcomeEl = document.getElementById("welcome-msg");

  if (welcomeEl) {
    welcomeEl.textContent = "Welcome, new patient! Please fill in the form below.";
    welcomeEl.style.color = "rgba(255,255,255,0.8)";
  }

  // hide "not you"
  document.getElementById("not-you-box").style.display = "none";
}


// =====================================================
// LOCAL STORAGE SAVE
// saves single field on blur
// =====================================================

function saveToStorage(fieldId) {

  var rememberMe = document.getElementById("rememberMe");

  // don't save anything if user opted out
  if (rememberMe && !rememberMe.checked) { return; }

  var field = document.getElementById(fieldId);

  if (!field) { return; } // safety check

  var val = field.value;

  // radios handled differently
  if (field.type === "radio") {
    val = getRadioValue(fieldId) || "";
  }

  // NOTE: might be redundant but keeping key format consistent
  localStorage.setItem("amc_" + fieldId, val);
}


// saves all checkboxes
function saveCheckboxes() {

  var rememberMe = document.getElementById("rememberMe");
  if (rememberMe && !rememberMe.checked) { return; }

  var names = ["hx_chickenpox","hx_measles","hx_covid","hx_smallpox",
               "hx_tetanus","hx_flu","hx_hepb"];

  var checked = [];

  for (var i = 0; i < names.length; i++) {

    var cb = document.querySelector('input[name="' + names[i] + '"]');

    if (cb && cb.checked) {
      checked.push(names[i]);
    }
  }

  localStorage.setItem("amc_checkboxes", JSON.stringify(checked));
}


// =====================================================
// LOAD FROM STORAGE
// restores user data
// =====================================================

function loadFromStorage() {

  var textFields = ["lname","mi","dob","email","phone",
                    "addr1","addr2","city","zip",
                    "userid","healthScore","salaryBar","symptoms"];

  for (var i = 0; i < textFields.length; i++) {

    var saved = localStorage.getItem("amc_" + textFields[i]);

    if (saved !== null && saved !== "") {

      var field = document.getElementById(textFields[i]);

      if (field) {
        field.value = saved;
      }
    }
  }

  // sliders need manual UI update after restoring values
  updateSlider("healthScore","healthVal","","");
  updateSalarySlider();

  // state dropdown handled in fetch too
  var savedState = localStorage.getItem("amc_state");

  if (savedState) {

    var stateEl = document.getElementById("state");

    if (stateEl && stateEl.options.length > 1) {
      stateEl.value = savedState;
    }
  }

  // radios
  var radioGroups = ["gender","vaccinated","insurance"];

  for (var j = 0; j < radioGroups.length; j++) {

    var savedVal = localStorage.getItem("amc_" + radioGroups[j]);

    if (savedVal) {

      var radios = document.getElementsByName(radioGroups[j]);

      for (var k = 0; k < radios.length; k++) {

        if (radios[k].value === savedVal) {
          radios[k].checked = true;
          break; // stop once found
        }
      }
    }
  }

  // checkboxes
  var savedCbs = localStorage.getItem("amc_checkboxes");

  if (savedCbs) {
    try {

      var cbList = JSON.parse(savedCbs);

      for (var m = 0; m < cbList.length; m++) {

        var cb = document.querySelector('input[name="' + cbList[m] + '"]');

        if (cb) {
          cb.checked = true;
        }
      }

    } catch(e) {
      console.log("Could not parse saved checkboxes:", e);
    }
  }
}


// =====================================================
// CLEAR STORAGE
// removes all saved keys
// =====================================================

function clearAllStorage() {

  var keys = ["fname","lname","mi","dob","email","phone",
              "addr1","addr2","city","state","zip",
              "gender","vaccinated","insurance",
              "healthScore","salaryBar","symptoms",
              "userid","checkboxes"];

  for (var i = 0; i < keys.length; i++) {

    // could maybe loop through localStorage directly... but this is clearer IMO
    localStorage.removeItem("amc_" + keys[i]);
  }
}


// =====================================================
// REMEMBER ME HANDLER
// toggles persistence
// =====================================================

function handleRememberMe() {

  var cb = document.getElementById("rememberMe");

  if (!cb) { return; }

  if (!cb.checked) {

    // user turned it OFF
    deleteCookie("amc_firstname");
    clearAllStorage();

    document.getElementById("not-you-box").style.display = "none";

    var welcomeEl = document.getElementById("welcome-msg");

    if (welcomeEl) {
      welcomeEl.textContent = "Remember Me is off. Your data will not be saved.";
      welcomeEl.style.color = "rgba(255,200,100,0.9)";
    }

  } else {

    // user turned it ON again
    var fname = document.getElementById("fname").value.trim();

    if (fname) {
      setCookie("amc_firstname", fname, 48);
    }

    var welcomeEl = document.getElementById("welcome-msg");

    if (welcomeEl) {
      welcomeEl.textContent = "Remember Me is on. Your info will be saved for next time.";
      welcomeEl.style.color = "#0ea47a";
    }
  }
}


// =====================================================
// SUBMIT HANDLER
// final validation + save + redirect
// =====================================================

function doSubmit() {

  var allGood = runAllValidators();

  // double-check errors (just in case something slipped)
  if (!allGood || Object.keys(errorFlags).length > 0) {

    document.getElementById("btn-submit").style.display = "none";

    alert("Please fix the remaining errors before submitting.");

    return;
  }

  var rememberMe = document.getElementById("rememberMe");

  if (rememberMe && rememberMe.checked) {

    var fname = document.getElementById("fname").value.trim();

    if (fname) {
      setCookie("amc_firstname", fname, 48);
    }

    // save fields
    var fieldsToSave = ["fname","lname","mi","dob","email","phone",
                        "addr1","addr2","city","state","zip",
                        "userid","healthScore","salaryBar","symptoms"];

    for (var i = 0; i < fieldsToSave.length; i++) {

      saveToStorage(fieldsToSave[i]);
    }

    saveCheckboxes();

    // radios
    ["gender","vaccinated","insurance"].forEach(function(g) {

      var val = getRadioValue(g);

      if (val) {
        localStorage.setItem("amc_" + g, val);
      }
    });

  } else {

    // user opted out
    deleteCookie("amc_firstname");
    clearAllStorage();
  }

  // redirect (finally lol)
  window.location.href = "thankyou.html";
}


// getRadioValue() still lives in validation.js


// end of homework4.js
