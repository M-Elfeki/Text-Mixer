const url = 'https://api.text-mixer.com/'; // Use HTTPS and the domain name
const sessionId = generateSessionId();
console.log("Session ID:", sessionId);

function detectDials() {
    const message = document.getElementById('message').value;
    fetch(url + 'detect_dials', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id: sessionId, message: message })
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
    const instruction = 'funnier';
    const lastRephrasing = 'more positive';
    const responseDisplay = document.getElementById('rephrase');
    responseDisplay.innerText = '';
    fetch(url + 'rephrase_draft', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ session_id: sessionId, message: message, instruction: instruction, last_rephrasing: lastRephrasing })
    })
    .then(response => streamResponse(response, responseDisplay))
    .catch(error => {
        console.error('Error:', error);
    });
    // check if instruction is in lastRephrasing, otherwise incorporate it
    // lastRephrasing = lastRephrasing + ' and ' + instruction;
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
            displayElement.innerText += ' ' + chunk;
            console.log(chunk);
            read();
        });
    }
    read();
}

function generateSessionId() {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
}
