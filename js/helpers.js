/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

var db = null;
var prostateImageRoot = "gifs/Prostate/";
var pelvisImageRoot = "gifs/Pelvis/";
var csvFile = "patient_summary.csv";


$(document).ready(function() {

    $('.fancybox').fancybox();
    var dropdown = $('#prostatePelvisDropDown')[0];
    setupDropDown(dropdown, ['Prostate', 'Pelvis']);

    setupDatabaseConnection('Prostate.sqlite');
});

function setupDatabaseConnection(name) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', name, true);
    xhr.responseType = 'arraybuffer';

    xhr.onload = function(e) {
      var uInt8Array = new Uint8Array(this.response);
      db = new SQL.Database(uInt8Array);
      setupPatients();
    };
    xhr.send();
}

function readTextFile(file) {
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.send();
    return rawFile.responseText;
}

function setupPatients() {
    var csv = readTextFile(csvFile);
    var data = $.csv.toObjects(csv);

    var validCaseIDs = [];
    data.forEach(function(caseId) {
        validCaseIDs.push(parseInt(caseId["caseId"]));
    });

    var contents = db.exec("SELECT distinct caseID FROM Images ORDER BY caseID ASC");
    var dbCases = [];
    contents[0].values.forEach(function(entry) {
        dbCases.push(entry[0]);
    });

    caseIds = dbCases.filter((n) => validCaseIDs.includes(n));

    var dropdown = $('#patientDropDown')[0];
    setupDropDown(dropdown, caseIds);
    var patientId = dropdown.options[dropdown.selectedIndex];
    setPatientId(patientId.value);
}

function setSubDirectory(selectedSubDirectory) {
  setupDatabaseConnection(selectedSubDirectory+'.sqlite');
}

function setPatientId(selectedPatientId) {
    var contents = db.exec("SELECT imageId FROM images where caseId="+selectedPatientId+" ORDER BY imageId ASC");
    var dropdown = document.getElementById('needleDropDown');
    setupDropDown(dropdown, contents[0].values);
    document.getElementById("registrationMode").selectedIndex = 1;
    updateView();
}

function updateView() {
    $("#imageToSwap").css("visibility", "visible");
    var imageToSwap = $('#imageToSwap');
    var root = getSelectedSubDirectory() === 'Prostate' ? prostateImageRoot : pelvisImageRoot;
    var regType = isRegistrationON() ? "after" : "before";
    src = root + "Case" + getCurrentCaseID() + "_" + getCurrentNeedleImageID() + "_" + regType + ".gif";
    imageToSwap.attr('src', src);
}

function getSelectedSubDirectory() {
    var dropdown = $('#prostatePelvisDropDown')[0];
    return dropdown.options[dropdown.selectedIndex].value;
}

function isRegistrationON() {
    var dropdown = $('#registrationMode')[0];
    var useRegistration = dropdown.options[dropdown.selectedIndex].value;
    return useRegistration == true || useRegistration == "true";
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
        dropdown.remove(i);
}

function addOption(element, value) {
    var option = document.createElement("option");
    option.text = value;
    option.value = value;
    element.add(option);
}

function getCurrentCaseID() {
    return document.getElementById('patientDropDown').value
}

function getCurrentNeedleImageID() {
    return document.getElementById('needleDropDown').value
}

function onNeedleImageSelected() {
    document.getElementById("registrationMode").selectedIndex = 1;
    updateView();
}

