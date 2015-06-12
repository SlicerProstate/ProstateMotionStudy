/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var patientId = 11;
var db = null;

setupDatabaseConnection();


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
     
     // setPatientId(firstPatientId);
}

function setPatientId(selectedPatientID) {
    patientId = selectedPatientID;
    var contents = db.exec("SELECT imageId FROM images where caseId="+patientId);
    var dropdown = document.getElementById('needleDropDown');
    setupDropDown(dropdown, contents[0].values);
    updateView();
    var src = $('#imageToSwap').attr('src');
    src = src.replace(/Case[0-9]*_/, "Case"+patientId+"_");
    $('#imageToSwap').attr('src', src);
}

function updateView() {
    var dropdown = $('#needleDropDown')[0];
    var option = dropdown.options[dropdown.selectedIndex];
    setNeedleImage(option.value)
    $("#registrationMode option:eq(0)").attr("selected", "selected");
    setRegistrationMode(false);
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
            console.log(useRegistration);

    } else {
        src = src.replace('after','before');
    }
    $('#imageToSwap').attr('src', src);
}

function setNeedleImage(imageId) {
    var src = $('#imageToSwap').attr('src');
    src = src.replace(/_[0-9]*_/, "_"+imageId+"_");
    $('#imageToSwap').attr('src', src);
}


