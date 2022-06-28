// Every 8 seconds
let interval = 8 * 1e3;
// 33 ms on frame
const frames_per_second = (1 / 30) * 1e3;

let progress_percentage = 0;
let time_needed = 0;

let is_working = false;
let is_paused = false;
let startTime;

let check_top_interval;
let check_bottom_interval;

function objectEmpty(object) {
    return Object.keys(object).length === 0 && object.constructor === Object;
}

documentReady(() => {
    sessionStorage.inputArray && restoreInputsAfterRefresh();
    getFormattedTimeStringFromInputs();
    // check_top_interval = setInterval(checkIfReachedTop,5000);
    // check_bottom_interval = setInterval(checkIfReachedBottom,5000);

    fetch("recieve_inputs", { method: 'POST' }).then(response => response.json()).then(response => {

        if (Object.keys(response).length === 0 && response.constructor === Object) {
            console.log("Not working");
            is_working = false;
            return;
        }
        is_working = true;
        restoreInputsFromServer(response);


    }).then(() => {
        fetch("check_if_paused", { method: 'POST' }).then(response => response.text()).then(response => {
            // console.log("response is " + response);
            console.log("Is paused:", response === "true");
            is_paused = response === "true";
            changeInnerHTMLbyID("pause", is_paused ? "Unpause" : "Pause");

            if (is_paused) {
                document.getElementById('pause').disabled = false;
                document.getElementById('stop').disabled = true;
            }

        }).then(() => {
            fetch("get_passed_time", { method: "POST", }).then(response => response.text()).then(response => {
                let passed_time = parseInt(response) / 1e3;
                progress_percentage = (passed_time / time_needed * 100) || 0;
                console.log("time needed : ", time_needed);
                console.log("Percentage from response ", progress_percentage);
                startTime = performance.now();
                let remaining_time_string = getRemainingTime(progress_percentage, time_needed);
                updateProgressBarValues(progress_percentage);
                changeInnerHTMLbyID('remaining_time', remaining_time_string);
                setInterval(updateProgressBar, frames_per_second);
            });
        });

    })
        .then(() => fetch("check_if_reached_top", { method: 'POST' })).then(response => response.text()).then(response => {
            if (response === "true") {
                alert("Reached Top");
                is_working = false;
                updateButtonStates();
                progress_percentage = 0;
                updateProgressBarValues(progress_percentage);
            }
        }).then(() => fetch("check_if_reached_bottom", { method: 'POST' })).then(response => response.text()).then(response => {
            if (response === "true") {
                alert("Reached Bottom");
                is_working = false;
                updateButtonStates();
                progress_percentage = 0;
                updateProgressBarValues(progress_percentage);
            }
        })
        .then(() => {
            fetch("send_saved_programms", { method: 'POST' }).then(response => response.json()).then(response => console.log(response));
            fillModalWithProgramms();
        });
});

let sendToTopRequest = () => fetch("go_to_top", { method: 'POST', }).then(response => response.text()).then(response => {
    alert(response);
    check_top_interval = setInterval(checkIfReachedTop, 5000);
});

let sendToBtmRequest = () => fetch("go_to_btm", { method: 'POST', }).then(response => response.text()).then(response => {
    alert(response);
    check_btm_interval = setInterval(checkIfReachedBottom, 5000);
});

let sendStopRequest = () => {
    is_working = false;
    progress_percentage = 0;
    updateButtonStates();
    updateProgressBarValues(progress_percentage);
    fetch("stop", { method: 'POST' });
};

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
    changeInnerHTMLbyID("calculated_time", "Calculated time: " + time_string);
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

    if (!is_working) {
        return;
    }

    if (is_paused) {
        return;
    }

    if (progress_percentage <= 0) {
        is_working = false;
        updateButtonStates();
        progress_percentage = 0;
        updateProgressBarValues(progress_percentage);
        return;
    }

    let previousTime = performance.now();

    if (previousTime - startTime >= interval) {
        startTime = performance.now();
        fetch("get_passed_time", { method: 'POST', })
            .then(response_time => response_time.text())
            .then(response_time => {
                let passed_time = parseInt(response_time) / 1e3;
                progress_percentage = (passed_time / time_needed * 100) || 0;
                console.log("Post request percentage: ", progress_percentage);
                if (time_needed - passed_time <= 11) {
                    interval = 1 * 1e3;

                    if (time_needed - passed_time < 2) {
                        is_working = false;
                        interval = 5 * 1e3;
                        updateButtonStates();
                        progress_percentage = 0;
                        updateProgressBarValues(progress_percentage);

                    }
                }
            })
            .then(() => fetch("check_if_reached_top", { method: 'POST' })).then(response => response.text()).then(response => {
                if (response === "true") {
                    alert("Reached Top");
                    is_working = false;
                    updateButtonStates();
                    progress_percentage = 0;
                    updateProgressBarValues(progress_percentage);
                }
            }).then(() => fetch("check_if_reached_bottom", { method: 'POST' })).then(response => response.text()).then(response => {
                if (response === "true") {
                    alert("Reached Bottom");
                    is_working = false;
                    updateButtonStates();
                    progress_percentage = 0;
                    updateProgressBarValues(progress_percentage);
                }
            });

    } else {
        progress_percentage = Number(progress_percentage) + percentage_per_millisecond * (frames_per_second);
    }

    let remaining_time_string = getRemainingTime(progress_percentage, time_needed);
    updateProgressBarValues(progress_percentage);
    changeInnerHTMLbyID('remaining_time', remaining_time_string);
}

async function updateButtonStates() {
    response = await fetch("recieve_inputs", { method: 'POST' });
    elements = await response.json();

    console.log(elements);
    document.getElementById('pause').disabled = !is_working;
    // document.getElementById('stop').disabled = !is_working;
    document.getElementById('add_row').disabled = is_working;
    document.getElementById('hide_row').disabled = is_working;
    document.getElementById('go_to_top').disabled = is_working;
    document.getElementById('submit').disabled = is_working;
    document.getElementById('save_modal_btn').disabled = is_working;
    document.getElementById('send_modal_btn').disabled = is_working;

    document.getElementById('percentage').style.display = is_working ? "block" : "none";
    document.getElementById('remaining_time').style.display = is_working ? "inline" : "none";
    document.getElementById('remaining_time_wrapper').style.display = is_working ? "block" : "none";
    let i = 0;
    const all_rows = document.getElementsByClassName("row gx-3 gy-1 justify-content-center");


    for (const row of Object.keys(elements)) {
        const row_inputs = all_rows[i].getElementsByClassName("kekw");


        if (is_working) {
            Array.from(row_inputs).forEach(row2 => row2.disabled = true);
        }

        else {
            row_inputs[0].disabled = elements[row]["hidden"] === 1;
            row_inputs[1].disabled = elements[row]["hidden"] === 1;
            row_inputs[2].disabled = elements[row]["hidden"] === 1;
            row_inputs[3].disabled = elements[row]["hidden"] === 1;
        }
        i++;
    }
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
    // console.log(array);
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
    getFormattedTimeStringFromInputs();
}

function submitForm() {
    let data = convertInputsToJSON();
    console.log(data);

    fetch("submit",
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, // this line is important, if this content-type is not set it wont work
            body: data,
        }).then((response) => response.text()).then((response => {
            progress_percentage = 0.001;
            time_passed = 0;
            time_needed = calculateSecondsNeededFromInputs();
            is_working = true;
            startTime = performance.now();
            changeInnerHTMLbyID("remaining_time", secondsToTimeString(time_needed || calculateSecondsNeededFromInputs()));
            updateButtonStates();

        }));
}

async function recieveFromESP8266() {
    let response = await fetch("get_programms", { method: "POST", });
    let answer = await response.text();
    console.log(answer);
}

async function saveForm(filename) {
    // let fd = new FormData(document.getElementById('stepper_form'));
    let data = convertInputsToJSON(filename + ".txt");

    response = await fetch("save_programm",
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, // this line is important, if this content-type is not set it wont work
            body: data,
        });

    if (!response.ok) {
        changeInnerHTMLbyID("save_response_text", "Something went wrong");
        document.getElementById("save_response_text").style.display = "block";
        return;
    }

    response_text = await response.text();
    changeInnerHTMLbyID("save_response_text", response_text);
    document.getElementById("save_response_text").classList.toggle('hide');
    setTimeout(() => document.getElementById("save_response_text").classList.toggle('hide'), 2500);

    // document.getElementById("save_response_text").style.display = "block";
    fillModalWithProgramms();
}


async function sendFormESP8266(filename) {

    response = await fetch("send_saved", {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: filename + ".txt",
    });
    recieved_json = await response.json();
    restoreInputsFromServer(recieved_json);

}

function restoreInputsFromServer(object) {
    console.log(object);
    let i = 0;
    const all_rows = document.getElementsByClassName("row gx-3 gy-1 justify-content-center");
    time_needed = 0;

    for (const row of Object.keys(object)) {
        const row_inputs = all_rows[i].getElementsByClassName("kekw");
        row_inputs[0].value = object[row]["speed"];
        row_inputs[1].value = object[row]["distance"];
        object[row]["direction"] == 1 ? row_inputs[2].checked = true : row_inputs[3].checked = true;

        object[row]["hidden"] === 1 ? all_rows[i].style.display = "none" : all_rows[i].style.display = "";

        if (object[row]["hidden"] !== 1)
            time_needed += (object[row]["distance"] * 1000) / object[row]["speed"];

        row_inputs[0].disabled = object[row]["hidden"] === 1;
        row_inputs[1].disabled = object[row]["hidden"] === 1;
        row_inputs[2].disabled = object[row]["hidden"] === 1;
        row_inputs[3].disabled = object[row]["hidden"] === 1;
        i++;
    }

    updateButtonStates();
    changeInnerHTMLbyID("calculated_time", "Calculated time: " + secondsToTimeString(time_needed));
    console.log(time_needed);
}

async function fillModalWithProgramms() {
    let repsone = await fetch("/send_saved_programms", { method: 'POST' });
    let programms = await repsone.json();

    let full_text = '';

    if (!programms) {
        changeInnerHTMLbyID("send_body_modal", '');
        return;
    }

    programms["names"].forEach(programm_name => {

        let programm_name_without_extension = programm_name.slice(0, -4);
        console.log(programm_name_without_extension);
        let text = `
 
        <div class="row mt-1 justify-content-between align-items-center">
        <div class="col-4">
            ${programm_name_without_extension}
        </div>
        <div class="col-4">
                <button class="btn btn-primary me-1" onclick="sendFormESP8266('${programm_name_without_extension}');"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-check-circle" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M10.97 4.97a.235.235 0 0 0-.02.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-1.071-1.05z"/>
              </svg></button>
                <button class="btn btn-danger ms-1" onclick="deleteProgramm('${programm_name}');"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
              </svg></button>
        </div>
    </div>
                    `;
        full_text += text;

    });

    changeInnerHTMLbyID("send_body_modal", full_text);
}

async function deleteProgramm(programm_to_delete) {
    let promise = await fetch("delete_programm", {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: programm_to_delete,
    });

    let response = await promise.text();
    alert(response);
    fillModalWithProgramms();
}

async function checkIfReachedTop() {
    let responest = await fetch("check_if_reached_top", { method: 'POST' });
    let response_text = await responest.text();

    if (response_text === "true") {
        alert("Reached Top");
        clearInterval(check_top_interval);
        is_working = false;
        updateButtonStates();
        progress_percentage = 0;
        updateProgressBarValues(progress_percentage);
    }
}

async function checkIfReachedBottom() {
    let responest = await fetch("check_if_reached_bottom", { method: 'POST' });
    let response_text = await responest.text();

    if (response_text === "true") {
        alert("Reached Bottom");
        clearInterval(check_btm_interval);
        is_working = false;
        updateButtonStates();
        progress_percentage = 0;
        updateProgressBarValues(progress_percentage);
    }
}
