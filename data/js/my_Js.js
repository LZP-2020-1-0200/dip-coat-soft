// Every 10 seconds
const interval = 10 * 1000;
// 33 ms on frame
const frames_per_second = (1 / 30) * 1e3;

let sendToTopRequest = () => fetch("go_to_top", { method: 'POST', }).then(response => response.text()).then(response => alert(response));

let sendStopRequest = () => fetch("stop", { method: 'POST' }).then(response => response.text()).then(response => {
    alert(response);
    sessionStorage.pause_btn = true;
    sessionStorage.stop_btn = true;
    sessionStorage.add_row_btn = false;
    sessionStorage.hide_row_btn = false;
    sessionStorage.go_to_top_btn = false;
    sessionStorage.submit_btn = false;
    sessionStorage.progress_percentage = 0;
    updateButtonStates();
    updateProgressBarValues(sessionStorage.progress_percentage);
});

let sendPauseRequest = () => fetch("pause", { method: "POST", }).then(response => response.text()).then(response => {
    alert(response);
    sessionStorage.paused = sessionStorage.paused === "true" ? "false" : "true";
    updateButtonStates();
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
            update_input_count(-1);
        }
    });
    getFormattedTimeStringFromInputs();

    console.log("number of inputs", sessionStorage.inputCount);
    updateProgressBarValues(0);
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
            update_input_count(1);
        }
    });
    getFormattedTimeStringFromInputs();

    console.log("number of inputs", sessionStorage.inputCount);
    updateProgressBarValues(0);
}

function updateProgressBar() {
    const percentage_per_millisecond = (1 / (Number(sessionStorage.time_needed) * 1e3)) * 100;

    if ((Number(sessionStorage.progress_percentage) >= 100)) {
        sessionStorage.pause_btn = true;
        sessionStorage.stop_btn = true;
        sessionStorage.add_row_btn = false;
        sessionStorage.hide_row_btn = false;
        sessionStorage.go_to_top_btn = false;
        sessionStorage.submit_btn = false;
        updateButtonStates();
        return;
    }

    if (sessionStorage.getItem("paused") === "true") {
        return;
    }

    let previousTime = performance.now();

    if (previousTime - Number(sessionStorage.startTime) >= interval) {
        sessionStorage.startTime = performance.now();
        fetch("get_passed_time", { method: 'POST', })
            .then(response_time => response_time.text())
            .then(response_time => {
                let passed_time = parseInt(response_time) / 1e3;
                sessionStorage.progress_percentage = (passed_time / Number(sessionStorage.time_needed) * 100);
                console.log("Post request: ", sessionStorage.progress_percentage);
            });

    } else {

        if (sessionStorage.progress_percentage === "0") {
            return;
        }
        sessionStorage.progress_percentage = Number(sessionStorage.progress_percentage) + percentage_per_millisecond * (frames_per_second);
    }

    let remaining_time_string = getRemainingTime(sessionStorage.progress_percentage, sessionStorage.time_needed);
    updateProgressBarValues(sessionStorage.progress_percentage);
    changeInnerHTMLbyID('remaining_time', remaining_time_string);
}

function updateButtonStates() {
    document.getElementById('pause').disabled = (sessionStorage.pause_btn) === "true";
    document.getElementById('stop').disabled = (sessionStorage.stop_btn) === "true";
    document.getElementById('add_row').disabled = (sessionStorage.add_row_btn) === "true";
    document.getElementById('hide_row').disabled = (sessionStorage.hide_row_btn) === "true";
    document.getElementById('go_to_top').disabled = (sessionStorage.go_to_top_btn) === "true";
    document.getElementById('submit').disabled = (sessionStorage.submit_btn) === "true";

    if (sessionStorage.submit_btn === "true") {
        document.getElementById('percentage').style.display = "block";
        document.getElementById('remaining_time').style.display = "inline";
        document.getElementById('hetyo').style.display = 'block';
    } else {
        document.getElementById('percentage').style.display = "none";
        document.getElementById('remaining_time').style.display = "none";
        document.getElementById('hetyo').style.display = 'none';
    }
}

function preserveInputs() {
    let array = [];
    let inputs = document.getElementsByClassName('kekw');
    for (let i = 0; i < inputs.length; i += 4) {
        array.push(parseInt(inputs[i].value));
        array.push(parseInt(inputs[i + 1].value));
        array.push(inputs[i + 2].checked ? 1 : -1);
        array.push(inputs[i + 3].checked ? 1 : -1);
    }
    sessionStorage.inputArray = JSON.stringify(array);
    console.log(sessionStorage.inputArray);
}

documentReady(() => {
    fetch("get_passed_time", { method: "POST", }).then(response => response.text()).then(response => {
        let passed_time = parseInt(response);
        sessionStorage.progress_percentage = (passed_time / Number(sessionStorage.time_needed) * 100);
        sessionStorage.startTime = performance.now();
        console.log("On document load: ", passed_time);
    });

    test();

    if (sessionStorage.inputArray) {
        let inputs = document.getElementsByClassName('kekw');
        let array = JSON.parse(sessionStorage.inputArray);

        for (let i = 0; i < inputs.length; i += 4) {
            inputs[i].value = array[i];
            inputs[i + 1].value = array[i + 1];
            inputs[i + 2].checked = array[i + 2] === 1;
            inputs[i + 3].checked = array[i + 3] === 1;
        }
    }

    if (sessionStorage.pause_btn) {
        updateButtonStates();
    }

    if (!sessionStorage.inputCount) {

        sessionStorage.inputCount = 10;
        console.log("inside localstorage inputcount", sessionStorage.inputCount);
    }

    if (sessionStorage.inputCount) {
        console.log(sessionStorage.inputCount);
        let row_difference = Number(sessionStorage.inputCount) - 10;
        while (row_difference !== 0) {

            console.log(row_difference);

            if (row_difference < 0) {
                hideRow();
                update_input_count(1);
                row_difference++;
            }

            if (row_difference > 0) {
                addRow();
                update_input_count(-1);
                row_difference--;
            }
        }
    }

    getFormattedTimeStringFromInputs();
    updateProgressBar = setInterval(updateProgressBar, frames_per_second);
});

let update_input_count = number => sessionStorage.inputCount = Number(sessionStorage.inputCount) + number;

function submitForm() {
    let fd = new FormData(document.getElementById('myform'));
    let data = convertInputsToJSON(fd);



    fetch("submit",
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, // this line is important, if this content-type is not set it wont work
            body: data,
        }).then((response) => response.text()).then((response => {
            sessionStorage.time_needed = calculateSecondsNeededFromInputs();
            sessionStorage.time_passed = 0;
            sessionStorage.pause_btn = false;
            sessionStorage.stop_btn = false;
            sessionStorage.add_row_btn = true;
            sessionStorage.hide_row_btn = true;
            sessionStorage.go_to_top_btn = true;
            sessionStorage.submit_btn = true;
            sessionStorage.progress_percentage = 0;


            document.getElementById('percentage').style.display = "block";
            document.getElementById('hetyo').style.display = "block";
            document.getElementById('remaining_time').style.display = 'inline';
            document.getElementById('remaining_time').innerHTML = secondsToTimeString(sessionStorage.time_needed || calculateSecondsNeededFromInputs());


            updateButtonStates();
            preserveInputs();
            alert(response);
        }));

}


function test() {
    changeInnerHTMLbyID('remaining_time', getRemainingTime(97.5, 5600));
    fetch("recieve_inputs",{method: 'POST'}).then(response => response.json()).then(response => {
        console.log(response);
        
        if (typeof response === "string") {
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