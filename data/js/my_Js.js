let i = 2;
function addrows() {
    var speed2 = ''.concat('%', "SPEED", i, '%');
    console.log(speed2);
    console.log("%SPEED0%");
    let speed_placeholder = `%${speed2}%`;

    let speed = document.createElement("input");
    let distance = document.createElement("input");
    let up = document.createElement("input");
    let up_label = document.createElement("label");
    let down = document.createElement("input");
    let down_label = document.createElement("label");
    let container = document.getElementById("input_container");

    speed.className = "myinput";
    speed.type = "number";
    speed.id = "speed" + i;
    speed.name = "speed" + i;
    speed.placeholder = "Ātrums";
    speed.value = speed_placeholder;
    console.log(speed_placeholder);
    //speed.value = '%SPEED0%';

    distance.className = "myinput";
    distance.type = "number";
    distance.id = "distance" + i;
    distance.name = "distance" + i;
    distance.placeholder = "Attālums";
    distance.value = "%DISTANCE" + i + "%";

    container.append(speed);
    container.append(distance);

    up.type = "radio";
    up.id = "direction" + i;
    up.name = "direction" + i;
    up.value = '1';
    up.checked = true;

    down.type = "radio";
    down.id = "direction" + i;
    down.name = "direction" + i;
    down.value = '0';


    up_label.appendChild(up);
    up_label.appendChild(document.createTextNode("Up"));

    down_label.appendChild(down);
    down_label.appendChild(document.createTextNode("Down"));


    container.append(up_label);
    container.append(down_label);

}

function convertFormToJSON(form) {
    var object = {};
    for (const [key, value] of form.entries()) {
        if (!value)
            break;
        object[key] = value;

    }
    console.log(JSON.stringify(object));
    return JSON.stringify(object);
}

function sendRequestButton(formID) {
    $(document).ready(function () {
        $.post(formID, function (response) {
            alert(response);
        });
    });
}

$(document).ready(function () {
    $('#myform').submit(function (event) {
        event.preventDefault();
        let fd = new FormData(document.getElementById('myform'));

        $.ajax({
            url: "/submit",
            data: convertFormToJSON(fd),
            type: 'POST',

            success: function (dataofconfirmation) {
                alert(dataofconfirmation);
            },

            error: function (error) {
                alert(error);
            }
        });
    });
});

function get_values_from_input() {
    let inputs = document.getElementsByClassName('myinput');
    let seconds = 0;
    for (var i = 0; i < inputs.length; i += 2) {
        if (inputs[i].value && inputs[i + 1].value) {
            let distance = parseInt(inputs[i + 1].value) * 1000;
            let speed = parseInt(inputs[i].value);
            seconds += distance / speed;
        }
    };
    let h = Math.floor(seconds / 3600);
    let m = Math.floor(seconds % 3600 / 60);
    let s = Math.floor(seconds % 3600 % 60);

    h = h == 0 ? "00:" : h <= 9 ? "0" + h.toString() + ":" : h.toString() + ":";
    m = m == 0 ? "00:" : m <= 9 ? "0" + m.toString() + ":" : m.toString() + ":";
    s = s == 0 ? "00" : s <= 9 ? "0" + s.toString() : s.toString();
    // time_string = new Date(seconds * 1000).toISOString().substring(11, 19);
    document.getElementById('ajaxtest').innerHTML = "Calculated time: " + h + m + s;
}

// (function get_passed_time() {
//     $.ajax({
//         url: "/get_passed_time",
//         type: 'POST',

//         success: function (response_seconds) {
//             let h = Math.floor(response_seconds / 3600);
//             let m = Math.floor(response_seconds % 3600 / 60);
//             let s = Math.floor(response_seconds % 3600 % 60);

//             h = h == 0 ? "00:" : h <= 9 ? "0" + h.toString() + ":" : h.toString() + ":";
//             m = m == 0 ? "00:" : m <= 9 ? "0" + m.toString() + ":" : m.toString() + ":";
//             s = s == 0 ? "00" : s <= 9 ? "0" + s.toString() : s.toString();

//             document.getElementById('uptime').innerHTML = h + m + s;
//         },

//     }).then(function () {
//         setTimeout(get_passed_time, 1000);

//     });
// })();

function hide_row() {
    const all_rows = document.getElementsByClassName("mydiv");
    already_hidden = false;

    Array.from(all_rows).reverse().forEach(function (row) {

        if (row.offsetParent !== null && !already_hidden) {
            already_hidden = true;
            row.style.display = "none";
            const all_inputs = row.getElementsByTagName("input");
            Array.from(all_inputs).forEach(function (input) {
                input.disabled = true;
            });
        }
    });
}

function add_row() {
    const all_rows = document.getElementsByClassName("mydiv");
    already_added = false;
    Array.from(all_rows).reverse().forEach(function (row) {

        if (row.offsetParent === null && !already_added) {
            already_added = true;
            row.style.display = "block";
            const all_inputs = row.getElementsByTagName("input");
            Array.from(all_inputs).forEach(function (input) {
                input.disabled = false;
            });
        }
    });
}
