/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var db = null;
var expanded = false;
var rating = null;

$(document).ready(function() {


    $('input[name="rating"]').change(function(){
        $("#ratingResultDisplay").text($(this).next('label').attr("title"));
        rating = $(this).val()
    });

    $("#HematomaCheckbox").change(function() {
        if (!this.checked) {
            closeLocationDropdown();
        } else {
            clearLocationCheckboxes();
        }
    });

    $("#submitForm").submit(function() {
        var locations = [];
        var hematoma = $("#HematomaCheckbox")[0].checked;
        if (hematoma)
            locations = getCheckedLocations();

        // check for valid data
        // create json data from form
        if (rating == null) {
            alert("Please rate the registration result!")
        } else {
            $.post($(this).attr('action'), $(this).serialize(), function (response) {
                // do something here on success
            }, 'json');
            rating = null;
            document.getElementById("submitForm").reset();
            closeLocationDropdown();
        }
        return false;
    });
    setupDatabaseConnection();
});

function closeLocationDropdown() {
    expanded = false;
    showCheckboxes();
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

function clearLocationCheckboxes() {
    var checkboxes = $("#checkboxes");
    var locations = checkboxes.find("input");
    locations.each(function(index, checkbox) {
        checkbox.checked = false;
    });
}

function showCheckboxes() {
    var checkboxes = document.getElementById("checkboxes");
    var hematoma = document.getElementById("HematomaCheckbox").checked;
    var width = $("#locations").width();
    if (!expanded && hematoma) {
        checkboxes.style.display = "block";
        checkboxes.style.width = width-2+"px";
        expanded = true;
    } else {
        checkboxes.style.display = "none";
        expanded = false;
    }
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
    var contents = db.exec("SELECT id FROM Cases");
    var dropdown = $('#patientDropDown')[0];
    setupDropDown(dropdown, contents[0].values);
    var patientId = dropdown.options[dropdown.selectedIndex];
    setPatientId(patientId.value);
}

function setPatientId(selectedPatientId) {
    var contents = db.exec("SELECT imageId FROM images where caseId="+selectedPatientId);
    var dropdown = document.getElementById('needleDropDown');
    setupDropDown(dropdown, contents[0].values);
    updateView();
    var src = $('#imageToSwap').attr('src');
    src = src.replace(/Case[0-9]*_/, "Case"+selectedPatientId+"_");
    $('#imageToSwap').attr('src', src);
    updateDSCForPatientId(selectedPatientId);
}

function updateDSCForPatientId(patientId) {
    var contents = db.exec("SELECT before, after FROM DSC where caseId="+patientId);
    contents = contents[0].values[0];
    var before = contents[0];
    var after = contents[1];
    $('#before').text("DSC before registration: " + before);
    $('#after').text("DSC after registration: " + after);
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
    var src = $('#imageToSwap').attr('src');
    if(useRegistration == "true") {
        src = src.replace('before','after');         
    } else {
        src = src.replace('after','before');
    }
    $('#imageToSwap').attr('src', src);
}

function setNeedleImage(imageId) {
    var src = $('#imageToSwap').attr('src');
    if(src == "")
        src = "imgs/Case11_15_before.gif"
    src = src.replace(/_[0-9]*_/, "_"+imageId+"_");
    $('#imageToSwap').attr('src', src);
    $("#registrationMode option:eq(0)").attr("selected", "selected");
    setRegistrationMode(false);
}


// 1. when other resluts are displayed, check if assessment if evaluation has already be done and disable if so
// 2. checking hematoma activates widget for checking locations

