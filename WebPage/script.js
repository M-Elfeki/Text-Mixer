// const url = 'http://192.168.0.22:5000/';
const url = 'https://4.242.50.139:8000/';
function detectDials() {
    const message = document.getElementById('message').value;
    fetch(url + 'detect_dials', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message })
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        const dialsDisplay = document.getElementById('dials');
        dialsDisplay.innerHTML = '';
        for (const key in data) {
            const dial = document.createElement('div');
            dial.innerText = `${key}: ${data[key]}`;
            dialsDisplay.appendChild(dial);
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

function rephraseDraft() {
    const message = document.getElementById('message').value;
    const responseDisplay = document.getElementById('rephrase');
    const instruction = 'funnier and more positive';
    responseDisplay.innerText = '';
    fetch(url + 'rephrase_draft', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message, instruction: instruction, last_rephrasing: '' })
    })
    .then(response => streamResponse(response, responseDisplay))
    // .then(response => response.json())
    // .then(data => {
    //     console.log(data);
    //     responseDisplay.innerText = data.rephrased_draft;
    // })
    .catch(error => {
        console.error('Error:', error);
    });
}

function streamResponse(response, displayElement) {
    const reader = response.body.getReader();
    function read() {
        reader.read().then(({done, value}) => {
            if (done) {
                console.log('Stream finished.');
                return;
            }
            const chunk = new TextDecoder("utf-8").decode(value);
            displayElement.innerText = displayElement.innerText + ' ' + chunk;
            console.log(chunk);
            read();
        });
    }
    read();
}