function secondsToTimeString(seconds) {
    let h = Math.floor(seconds / 3600);
    let m = Math.floor(seconds % 3600 / 60);
    let s = Math.floor(seconds % 3600 % 60);

    h = h === 0 ? "00:" : h <= 9 ? "0" + h.toString() + ":" : h.toString() + ":";
    m = m === 0 ? "00:" : m <= 9 ? "0" + m.toString() + ":" : m.toString() + ":";
    s = s === 0 ? "00" : s <= 9 ? "0" + s.toString() : s.toString();

    return h + m + s;
}

function StringToSeconds(string) {
    let a = string.split(':');
    return (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);
}

function convertInputsToJSON(){
    let data_to_send = {};
    const all_rows = document.getElementsByClassName("row gx-3 gy-1 justify-content-center");

    Array.from(all_rows).forEach(row => {

        const all_inputs = row.getElementsByTagName("input");
        let hidden = row.style.display === "none" ? 1 : 0;
        let speed = Number(all_inputs[0].value);
        let distance = Number(all_inputs[1].value);
        let direction = all_inputs[2].checked ? 1 :-1;

        data_to_send[row.id] = {hidden, speed, distance, direction};
    });

    console.log("Data sent: ",data_to_send);
    return JSON.stringify(data_to_send);
}

function updateProgressBarValues(percentage){
    const stringPercentage = Number(percentage).toFixed(2)+"%";
    document.getElementById("progress_bar").style.width = stringPercentage;
    document.getElementById('percentage').innerHTML = stringPercentage;
}

function getRemainingTime(current_percentage,needed_time){
    const number_current_percentage = Number(current_percentage);
    const number_time_needed = Number(needed_time);

    let nearest_seconds = (number_current_percentage / 100) * number_time_needed;
    nearest_seconds = Math.round(number_time_needed - nearest_seconds)
    return secondsToTimeString(nearest_seconds)
}

function changeInnerHTMLbyID(element_id,value){
    if (value !== document.getElementById(element_id).innerHTML) {
        document.getElementById(element_id).innerHTML = value;
    }
}

function documentReady(fn) {
    if (document.readyState !== 'loading'){
        fn();
    } else {
        document.addEventListener('DOMContentLoaded', fn);
    }
}

function randomNumber(min, max) { 
    return Math.round(Math.random() * (max - min) + min);
} 

function allInputWrapper(fun){
    const all_rows = document.getElementsByClassName("row gx-3 gy-1 justify-content-center");
    Array.from(all_rows).forEach(row => {
        Array.from(row.getElementsByTagName("input")).forEach(input => {
            fun(input);
        })
    });
}

function isNumeric(str) {
    if (typeof str != "string") return false // we only process strings!  
    return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
           !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
  }