document.addEventListener("DOMContentLoaded", function () {
    const url = 'https://api.text-mixer.com/';
    const sessionId = generateSessionId();
    const analyzeButton = document.getElementById('analyzeButton');
    const textInput = document.getElementById('message');
    const rephraseButton = document.getElementById('rephraseButton');
    const responseDisplay = document.getElementById('ResponseDisplay');
    const addSliderButton = document.getElementById('addSliderButton');
    const bubblesContainer = document.getElementById('bubblesContainer');
    const slidersContainer = document.getElementById('slidersContainer');
    const copyButton = document.getElementById('copyButton');

    let curDials = {};
    let lastRephrasing = '';
    rephraseButton.style.display = 'none';

    analyzeButton.addEventListener('click', function ()  {
        const message = textInput.value;
        fetch(url + 'detect_dials', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session_id: sessionId, message: message })
        })
        .then(response => response.json())
        .then(data => {
            curDials = {};
            historyDials = '';
            bubblesContainer.innerHTML = '';
            slidersContainer.innerHTML = '';
            responseDisplay.innerText = '';
            for (var key in data) {
                createBubble(key, data[key]);
            }

        })
        .catch(error => {
            console.error('Error:', error);
        });
    });

    copyButton.addEventListener('click', (event) => {
        event.preventDefault();
        navigator.clipboard.writeText(responseDisplay.innerText).then(() => {
            /* Optional: Display a message that the text was copied */
            copyButton.textContent = 'Copied!';
            setTimeout(() => copyButton.textContent = 'Copy', 2000); // Reset text after 2 seconds
        }).catch(err => {
            console.error('Could not copy text: ', err);
        });
    });
    

    function createBubble(trait, valueList) {
        const bubble = document.createElement('div');
        bubble.classList.add('bubble');
        bubble.textContent = trait;
        bubble.addEventListener('click', () => {
            createSlider(trait, valueList);
            bubble.style.display = 'none';
        });
        bubblesContainer.appendChild(bubble);
    }

    addSliderButton.addEventListener('click', function () {
        const traitName = prompt("Enter the name for the new slidebar:");
        if (!traitName) return;

        const levels = prompt("Enter the five levels separated by commas (e.g., Low, Below Average, Average, Above Average, High):");
        const valueList = levels ? levels.split(',').map(level => level.trim()) : [];
        valueList.push(Math.ceil(valueList.length/2).toString());
        
        createSlider(traitName, valueList);
    });

    function createSlider(trait, valueList) {
        const sliderContainer = document.createElement('div');
        sliderContainer.classList.add('slider-container');
        const sliderLabel = document.createElement('label');
        sliderLabel.textContent = trait;
        sliderContainer.appendChild(sliderLabel);

        const sliderInput = document.createElement('input');
        sliderInput.type = 'range';
        sliderInput.min = '0';
        sliderInput.max = (valueList.length - 2).toString();
        sliderInput.value = valueList[parseInt(valueList.length - 1)];
        sliderInput.width = '60%';
        sliderInput.classList.add('slider');
        sliderInput.style.display = 'inline-block';

        sliderInput.addEventListener('input', function () {
            const selectedValue = valueList[parseInt(this.value)];
            sliderValueDisplay.textContent = selectedValue;
            curDials[trait] = selectedValue;
        });

        sliderContainer.appendChild(sliderInput);
        const sliderValueDisplay = document.createElement('span');
        sliderValueDisplay.textContent = valueList[parseInt(sliderInput.value)];
        sliderValueDisplay.classList.add('slider-value-display');
        sliderContainer.appendChild(sliderValueDisplay);
        slidersContainer.appendChild(sliderContainer);

        if (textInput.value.length > 0) {
            rephraseButton.style.display = 'block';
        }
    }

    rephraseButton.addEventListener('click', function ()  {
        const message = textInput.value;
        responseDisplay.innerText = '';
        let curInstructionMsg = '';


        // To-add: construct instruction by comparing current values of sliders against curDials, then change curDials to current values.
        for (var key in curDials) {
            curInstructionMsg += curDials[key] + ' ' + key + ' ,';
        }
        console.log(curInstructionMsg);
        
        fetch(url + 'rephrase_draft', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ session_id: sessionId, message: message, instruction: curInstructionMsg, last_rephrasing: lastRephrasing })
        })
        .then(response => streamResponse(response, responseDisplay))
        .catch(error => {
            console.error('Error:', error);
        });
        // To-add: check if instruction is in lastRephrasing, otherwise incorporate it
        lastRephrasing = lastRephrasing + ', ' + curInstructionMsg;
        console.log(curInstructionMsg);
    });

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

});