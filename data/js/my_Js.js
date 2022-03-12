// Every 8 seconds
let interval = 8 * 1e3;
// 33 ms on frame
const frames_per_second = (1 / 30) * 1e3;

let progress_percentage = 0;
let time_needed = 0;

let is_working = false;
let is_paused = false;
let startTime;


documentReady(() => {
    sessionStorage.inputArray && restoreInputsAfterRefresh();
    getFormattedTimeStringFromInputs();

    fetch("recieve_inputs", { method: 'POST' }).then(response => response.json()).then(response => {

        if (Object.keys(response).length === 0 && response.constructor === Object) {
            console.log("Not working");
            is_working = false;
            return;
        }

        console.log(response);
        let i = 0;
        const all_rows = document.getElementsByClassName("row gx-3 gy-1 justify-content-center");
        let time1 = 0;

        for (const row of Object.keys(response)) {
            const row_inputs = all_rows[i].getElementsByClassName("kekw");
            row_inputs[0].value = response[row]["speed"];
            row_inputs[1].value = response[row]["distance"];
            response[row]["direction"] == 1 ? row_inputs[2].checked = true : row_inputs[3].checked = true;

            response[row]["hidden"] === 1 ? all_rows[i].style.display = "none" : all_rows[i].style.display = "";

            if (response[row]["hidden"] !== 1)
                time_needed += (response[row]["distance"] * 1000) / response[row]["speed"];

            console.log(response[row]["hidden"] === 1);
            row_inputs[0].disabled = response[row]["hidden"] === 1;
            row_inputs[1].disabled = response[row]["hidden"] === 1;
            row_inputs[2].disabled = response[row]["hidden"] === 1;
            row_inputs[3].disabled = response[row]["hidden"] === 1;
            i++;
        }
        is_working = true;
        updateButtonStates();
        changeInnerHTMLbyID("calculated_time", "Calculated time: " + secondsToTimeString(time1));
        console.log(time_needed);

    }).then(() => {
        fetch("get_passed_time", { method: "POST", }).then(response => response.text()).then(response => {
            let passed_time = parseInt(response) / 1e3;
            progress_percentage = (passed_time / time_needed * 100) || 0;
            console.log("time needed : ", time_needed);
            console.log("Percentage from response ", progress_percentage);
            startTime = performance.now();
            setInterval(updateProgressBar, frames_per_second);
        });
    });


});

let sendToTopRequest = () => fetch("go_to_top", { method: 'POST', }).then(response => response.text()).then(response => alert(response));

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
    document.getElementById('stop').disabled = !is_working;
    document.getElementById('add_row').disabled = is_working;
    document.getElementById('hide_row').disabled = is_working;
    document.getElementById('go_to_top').disabled = is_working;
    document.getElementById('submit').disabled = is_working;

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

function fillInputs() {
    const all_rows = document.getElementsByClassName("row gx-3 gy-1 justify-content-center");
    Array.from(all_rows).forEach(row => {
        const all_inputs = row.getElementsByTagName("input");
        all_inputs[0].value = randomNumber(5000, 20000);
        all_inputs[1].value = randomNumber(100, 500);

        randomNumber(0, 1) === 0 ? all_inputs[2].checked = true : all_inputs[3].checked = true;

    });
    getFormattedTimeStringFromInputs();
}

function submitForm() {
    let fd = new FormData(document.getElementById('stepper_form'));
    let data = convertInputsToJSON(fd);

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
            alert(response);
        }));


}

async function recieveFromESP8266() {
    let response = await fetch("get_programms", { method: "POST", });
    let answer = await response.text();
    console.log(answer);
}