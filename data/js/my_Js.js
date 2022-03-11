// Every 10 seconds
const interval = 10 * 1000;
// 33 ms on frame
const frames_per_second = (1 / 30) * 1e3;

let progress_percentage = 0;
let time_needed = 0;

let is_working = false;
let is_paused = false;

let startTime;

let sendToTopRequest = () => fetch("go_to_top", { method: 'POST', }).then(response => response.text()).then(response => alert(response));

let sendStopRequest = () => fetch("stop", { method: 'POST' }).then(response => response.text()).then(() => {
    is_working = false;
    progress_percentage = 0;
    updateButtonStates();
    updateProgressBarValues(progress_percentage);
});

let sendPauseRequest = () => fetch("pause", { method: "POST", }).then(response => response.text()).then(() => {
    is_paused = !is_paused;
    changeInnerHTMLbyID("pause", is_paused ? "Unpause" : "Pause");
    document.getElementById('stop').disabled = is_paused;
});

function calculateSecondsNeededFromInputs() {
    let inputs = document.getElementsByClassName('myinput');
    let seconds = 0;
    for (let i = 0; i < inputs.length; i += 2) {
        if (inputs[i].value && inputs[i + 1].value && !inputs[i].disabled) {
            let distance = parseInt(inputs[i + 1].value) * 1000;
            let speed = parseInt(inputs[i].value);
            seconds += distance / speed;
        }
    }
    return seconds;
}

function getFormattedTimeStringFromInputs() {
    let seconds = calculateSecondsNeededFromInputs();
    let time_string = secondsToTimeString(seconds);
    preserveInputs();
    changeInnerHTMLbyID("ajaxtest", "Calculated time: " + time_string);
}

function hideRow() {
    const all_rows = document.getElementsByClassName("row gx-3 gy-1 justify-content-center");
    let already_hidden = false;
    Array.from(all_rows).reverse().forEach(row => {
        if (row.offsetParent !== null && !already_hidden) {
            already_hidden = true;
            row.style.display = "none";
            const all_inputs = row.getElementsByTagName("input");
            Array.from(all_inputs).forEach(input => input.disabled = true);
        }
    });
    getFormattedTimeStringFromInputs();
}

function addRow() {
    const all_rows = document.getElementsByClassName("row gx-3 gy-1 justify-content-center");
    let already_added = false;
    Array.from(all_rows).forEach(row => {
        if (row.offsetParent === null && !already_added) {
            already_added = true;
            row.style.display = "";
            const all_inputs = row.getElementsByTagName("input");
            Array.from(all_inputs).forEach(input => input.disabled = false);
        }
    });
    getFormattedTimeStringFromInputs();
}

function updateProgressBar() {
    const percentage_per_millisecond = (1 / (time_needed * 1e3)) * 100;

    if (progress_percentage >= 100) {
        is_working = false;
        updateButtonStates();
        return;
    }

    if (!is_working) {
        return;
    }

    if (is_paused) {
        return;
    }

    let previousTime = performance.now();

    if (previousTime - startTime >= interval) {
        startTime = performance.now();
        fetch("get_passed_time", { method: 'POST', })
            .then(response_time => response_time.text())
            .then(response_time => {
                let passed_time = parseInt(response_time) / 1e3;
                progress_percentage = (passed_time / Number(time_needed) * 100) || 0;
                console.log("Post request percentage: ", progress_percentage);
            });

    } else {
        progress_percentage = Number(progress_percentage) + percentage_per_millisecond * (frames_per_second);
    }

    let remaining_time_string = getRemainingTime(progress_percentage, time_needed);
    updateProgressBarValues(progress_percentage);
    changeInnerHTMLbyID('remaining_time', remaining_time_string);
}

function updateButtonStates() {
    document.getElementById('pause').disabled = !is_working;
    document.getElementById('stop').disabled = !is_working;
    document.getElementById('add_row').disabled = is_working;
    document.getElementById('hide_row').disabled = is_working;
    document.getElementById('go_to_top').disabled = is_working;
    document.getElementById('submit').disabled = is_working;

    document.getElementById('percentage').style.display = is_working ? "block" : "none";
    document.getElementById('remaining_time').style.display = is_working ? "inline" : "none";
    document.getElementById('hetyo').style.display = is_working ? "block" : "none";

    Array.from(document.getElementsByTagName("input")).forEach(row => row.disabled = is_working);
}

function preserveInputs() {
    let array = [];
    let inputs = document.getElementsByClassName('kekw');
    for (let i = 0; i < inputs.length; i += 4) {
        // Speed
        array.push(parseInt(inputs[i].value));
        // Distance
        array.push(parseInt(inputs[i + 1].value));
        // Up (1) or Down(-1)
        array.push(inputs[i + 2].checked ? 1 : -1);
        // Disabled (1) or Enabled (-1)
        array.push(inputs[i].disabled ? 1 : -1);

    }
    sessionStorage.inputArray = JSON.stringify(array);
}

function restoreInputsAfterRefresh() {
    const all_rows = document.getElementsByClassName("row gx-3 gy-1 justify-content-center");
    const inputs = document.getElementsByClassName('kekw');
    const array = JSON.parse(sessionStorage.inputArray);

    for (let i = 0; i < inputs.length; i += 4) {
        inputs[i].value = array[i];
        inputs[i + 1].value = array[i + 1];
        array[i + 2] === 1 ? inputs[i + 2].checked = true : inputs[i + 3].checked = true;

        // inputs[i + 2].checked = array[i + 2] === 1;

    }

    let counter = 3;

    Array.from(all_rows).forEach(row => {

        if (array[counter] === 1) {
            row.style.display = "none";
            Array.from(row.getElementsByTagName("input")).forEach(input => input.disabled = true);


        }

        else {
            Array.from(row.getElementsByTagName("input")).forEach(input => input.disabled = false);
            row.style.display = "";

        }
        counter += 4;
    });



}

documentReady(() => {

    sessionStorage.inputArray && restoreInputsAfterRefresh();

    fetch("get_passed_time", { method: "POST", }).then(response => response.text()).then(response => {
        let passed_time = parseInt(response);
        progress_percentage = (passed_time / Number(time_needed) * 100) || 0;
        startTime = performance.now();
        console.log("On document load passed time: ", passed_time);
    });

    getFormattedTimeStringFromInputs();
    updateProgressBar = setInterval(updateProgressBar, frames_per_second);
});

function submitForm() {
    let fd = new FormData(document.getElementById('myform'));
    let data = convertInputsToJSON(fd);

    fetch("submit",
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, // this line is important, if this content-type is not set it wont work
            body: data,
        }).then((response) => response.text()).then((response => {
            progress_percentage = 0;
            time_needed = calculateSecondsNeededFromInputs();
            is_working = true;

            changeInnerHTMLbyID("remaining_time", secondsToTimeString(time_needed || calculateSecondsNeededFromInputs()));

            updateButtonStates();
            alert(response);
        }));

}


function test() {
    changeInnerHTMLbyID('remaining_time', getRemainingTime(97.5, 5600));
    fetch("recieve_inputs", { method: 'POST' }).then(response => response.json()).then(response => {


        if (Object.keys(response).length === 0 && response.constructor === Object) {
            return;
        }

        let inputs = document.getElementsByClassName('kekw');
        let i = 0;
        hidden_counter = 10;
        added_counter = 10;
        for (const row of Object.keys(response)) {
            inputs[i].value = response[row]["speed"];
            inputs[i + 1].value = response[row]["distance"];
            inputs[i + 2].checked = response[row]["direction"] == 1 ? true : false;
            response[row]["hidden"] == 1 ? hideRow() : addRow();
        }
    });
}