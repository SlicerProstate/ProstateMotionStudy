/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var db = null;
var currentReader = "";

var baseURL = "http://spreadsheets.google.com/tq?key=1mSxSr0eM5W_24cDAnFNhsC9M7vtMan49vTMpRNhEY20";
var baseFormURL = "https://docs.google.com/forms/d/19oCKyz9vxRMOwQBB6PQwpKRfqeIqukcT_qH5oMYAFjs/formResponse?ifq&";
var concatenator = '&';
var readerIDKey = "entry.318415835=";
var caseIDKey = "entry.236657997=";
var needleImageKey = "entry.1146735077=";
var registrationFailureKey = "entry.1614988881=";
var brachytherapyKey = "entry.1945074577=";
var hematomaKey = "entry.1651056543=";
var locationsKey = "entry.928263532=";
var submitKey = "submit=Submit";

google.load('visualization', '1', {packages: []});

//https://docs.google.com/forms/d/19oCKyz9vxRMOwQBB6PQwpKRfqeIqukcT_qH5oMYAFjs/formResponse?ifq&entry.318415835=Fedorov&
// entry.236657997=11&entry.1146735077=2&entry.1353075101=4&entry.1945074577=yes&entry.1651056543=yes&
// entry.928263532=Apex&entry.928263532=Mid-gland&submit=Submit


$(document).ready(function() {

    $('.fancybox').fancybox();

    $("#HematomaCheckbox").change(function() {
        if (!this.checked) {
          disableLocationCheckboxes(true);
        } else {
          disableLocationCheckboxes(false);
        }
    });

    $("#assessmentForm").submit(function() {
        var locations = [];
        var hematoma = $("#HematomaCheckbox")[0].checked;
        if (hematoma)
            locations = getCheckedLocations();

        // check for valid data
        // create json data from form
        if (getCompleteFailureAnswer() == null) {
            alert("Please rate the registration result!")
        } else if (currentReader == "") {
            alert("Please select current reader!")
        } else if (hematoma && locations.length == 0) {
            alert("Please select hematoma locations!")
        } else {
            var url = buildURLFromForm();
            $("#submitLink").attr('href', url);
            $("#submitLink").click();
            clearAssessmentForm();
            setTimeout(function() {
                updateAssessmentStatus(getCurrentCaseID(), getCurrentNeedleImageID());
            }, 2000);
        }
        return false;
    });
    setupDatabaseConnection();
});

function disableLocationCheckboxes(disable) {
  $("#checkboxes :input").prop('disabled', disable);
}

function buildURLFromForm() {
    var url = baseFormURL + readerIDKey + currentReader + concatenator +
                            caseIDKey   + getCurrentCaseID() + concatenator +
                            needleImageKey + getCurrentNeedleImageID() + concatenator +
                            registrationFailureKey + getCompleteFailureAnswer() + concatenator +
                            brachytherapyKey + getCheckBoxStatus('BrachytherapyCheckbox') + concatenator +
                            hematomaKey + getCheckBoxStatus('HematomaCheckbox') + concatenator;
    if (getCheckBoxStatus('HematomaCheckbox') == "yes") {
        locations = getCheckedLocations();
        locations.forEach(function(location) {
            url += locationsKey + location + concatenator;
        })
    }

    url += concatenator + submitKey;

    return url;
}

function getCompleteFailureAnswer() {
  var value = null;
  try {
    value = document.querySelector('input[name="completeFailure"]:checked').value;
  } catch(err) {
    value = null;
  }
  return value;
}

function getCheckBoxStatus(id) {
    return ($("#" + id)[0].checked) ? "yes" : "no"
}

function updateAssessmentStatus(caseID, needleID) {
    var query = new google.visualization.Query(baseURL);
    //console.log('select A where C=' + caseID + ' and D=' + needleID);
    query.setQuery('select A where C=' + caseID + ' and D=' + needleID);

    query.send(function(response) {
        data = response.getDataTable();
        //console.log(data);
        var textToShow = "ASSESSMENT";
        var color = "white";
        if (data["Gf"].length == 1) {
            $("#assessmentForm :input").prop('disabled', true);
            color = 'green';
            textToShow = "ASSESSMENT: Already assessed!";
        } else {
            $("#assessmentForm :input").prop('disabled', false);
            disableLocationCheckboxes(true)
        }
        $('#assessmentStatus').text(textToShow);
        $('#assessmentStatus').css('color', color);
    });
}

function clearAssessmentForm() {
    document.getElementById("assessmentForm").reset();
    var element = document.getElementById('readerDropDown');
    element.value = currentReader;
    disableLocationCheckboxes(true);
    $("#completeFailureNo").prop("checked", true)
}

function getCheckedLocations() {
    var checkboxes = $("#checkboxes");
    var locations = checkboxes.find("input");
    var checkedLocations = [];
    locations.each(function(index, checkbox) {
        if(checkbox.checked) {
            checkedLocations.push(checkbox.value);
        }
    });
    return checkedLocations
}

function setupDatabaseConnection() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', 'database.sqlite', true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function(e) {
      var uInt8Array = new Uint8Array(this.response);
      db = new SQL.Database(uInt8Array);
      setupPatients();
    };
    xhr.send();
}

function setupPatients() {
    var contents = db.exec("SELECT distinct caseID FROM Images ORDER BY caseID ASC");
    var dropdown = $('#patientDropDown')[0];
    setupDropDown(dropdown, contents[0].values);
    var patientId = dropdown.options[dropdown.selectedIndex];
    setPatientId(patientId.value);
}

function setPatientId(selectedPatientId) {
    var contents = db.exec("SELECT imageId FROM images where caseId="+selectedPatientId+" ORDER BY imageId ASC");
    var dropdown = document.getElementById('needleDropDown');
    setupDropDown(dropdown, contents[0].values);
    updateView();
    var imageToSwap = $('#imageToSwap');
    var src = imageToSwap.attr('src');
    src = src.replace(/Case[0-9]*_/, "Case"+selectedPatientId+"_");
    imageToSwap.attr('src', src);
    clearAssessmentForm();
}

function updateView() {
    var dropdown = $('#needleDropDown')[0];
    var option = dropdown.options[dropdown.selectedIndex];
    setNeedleImage(option.value);
    $("#imageToSwap").css("visibility", "visible");
}

function setupDropDown(dropdown, ids) {
    removeOptions(dropdown);
    ids.forEach(function(entry) {
        addOption(dropdown, entry);
    });
}

function removeOptions(dropdown)
{
    for(var i=dropdown.options.length-1;i>=0;i--)
    {
        dropdown.remove(i);
    }
}

function addOption(element, value) {
    var option = document.createElement("option");
    option.text = value;
    option.value = value;
    element.add(option);
}

function setRegistrationMode(useRegistration) {
  var imageToSwap = $('#imageToSwap');
  var src = imageToSwap.attr('src');
    if(useRegistration == "true") {
        src = src.replace('before','after');         
    } else {
        src = src.replace('after','before');
    }
  imageToSwap.attr('src', src);
}

function getCurrentCaseID() {
    return document.getElementById('patientDropDown').value
}

function getCurrentNeedleImageID() {
    return document.getElementById('needleDropDown').value
}

function setNeedleImage(imageId) {
    var imageToSwap = $('#imageToSwap');
    var src = imageToSwap.attr('src');
    if(src == "")
        src = "gifs/Case11_15_before.gif"
    src = src.replace(/_[0-9]*_/, "_"+imageId+"_");
    imageToSwap.attr('src', src);
    $("#registrationMode option:eq(1)").attr("selected", "selected");
    setRegistrationMode(true);
    clearAssessmentForm();
    updateAssessmentStatus(getCurrentCaseID(), imageId);
}

function setCurrentReader(readerName) {
    currentReader = readerName;
}
