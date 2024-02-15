document.addEventListener("DOMContentLoaded", function () {
    // const url = 'http://192.168.0.22:5000/';
    const url = 'http://4.242.50.139:8000/';
    const rephraseButton = document.getElementById('rephraseButton');
    const responseDisplay = document.getElementById('ResponseDisplay');
    const addSliderButton = document.getElementById('addSliderButton');
    const bubblesContainer = document.getElementById('bubblesContainer');
    const slidersContainer = document.getElementById('slidersContainer');

    let curDraft = '';
    let curInstruction = {};

    chrome.runtime.sendMessage({ request: "getSelectedText" }, function (response) {
        if (response && response.selectedText) {
            message = response.selectedText;
            fetch(url + 'detect_dials', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            })
                .then(response => response.json())
                .then(data => {
                    curDraft = ''
                    curInstruction = {}
                    bubblesContainer.innerHTML = '';
                    slidersContainer.innerHTML = '';
                    responseDisplay.innerText = '';
                    rephraseButton.style.display = 'none';

                    for (var key in data) {
                        createBubble(key, data[key]);
                    }
                    curDraft = message;
                })
                .catch(error => {
                    console.log(url + 'detect_dials');
                    console.error('Error:', error);
                });
        }
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
        if (valueList.length !== 5) {
            alert("Please enter exactly five levels.");
            return;
        }
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
        sliderInput.max = '4';
        sliderInput.value = valueList[parseInt(valueList.length - 1)];
        sliderInput.width = '60%';
        sliderInput.classList.add('slider');
        sliderInput.style.display = 'inline-block';

        sliderInput.addEventListener('input', function () {
            const selectedValue = valueList[parseInt(this.value)];
            sliderValueDisplay.textContent = selectedValue;
            curInstruction[trait] = selectedValue;
        });

        sliderContainer.appendChild(sliderInput);
        const sliderValueDisplay = document.createElement('span');
        sliderValueDisplay.textContent = valueList[parseInt(sliderInput.value)];
        sliderValueDisplay.classList.add('slider-value-display');
        sliderContainer.appendChild(sliderValueDisplay);
        slidersContainer.appendChild(sliderContainer);

        rephraseButton.style.display = 'block';
    }

    rephraseButton.addEventListener('click', function () {
        const LastRephrasing = responseDisplay.innerText;
        responseDisplay.innerText = '';
        const message = curDraft;

        let curInstructionMsg = '';
        for (var key in curInstruction) {
            curInstructionMsg += curInstruction[key] + ' ' + key + ' ,';
        }
        curInstruction = {};

        fetch(url + 'rephrase_draft', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ message: message, instruction: curInstructionMsg, last_rephrasing: LastRephrasing })
        })
            .then(response => streamResponse(response, responseDisplay))
            .catch(error => {
                console.error('Error:', error);
            });
    });

    function streamResponse(response, displayElement) {
        const reader = response.body.getReader();
        function read() {
            reader.read().then(({ done, value }) => {
                if (done) {
                    return;
                }
                const chunk = new TextDecoder("utf-8").decode(value);
                displayElement.innerText = displayElement.innerText + ' ' + chunk;
                read();
            }).catch(error => {
                console.error('Error reading response stream:', error);
            });
        }
        read();
    }
});