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
    copyButton.style.display = 'none'; 
    rephraseButton.style.display = 'none';
    addSliderButton.style.display = 'none';

    analyzeButton.addEventListener('click', analyzeText);
    copyButton.addEventListener('click', copyText);
    addSliderButton.addEventListener('click', addCustomSlider);
    rephraseButton.addEventListener('click', rephraseText);

    function analyzeText() {
        const message = textInput.value;
        if (message.length === 0) return;
        fetch(`${url}detect_dials`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ session_id: sessionId, message: message })
        })
        .then(response => response.json())
        .then(updateUIWithDials)
        .catch(console.error);
        addSliderButton.style.display = 'block';
    }

    function updateUIWithDials(data) {
        resetUI();
        Object.entries(data).forEach(([trait, valueList], index) => {
            setTimeout(() => {
                createBubble(trait, valueList);
            }, index * 100);
        });
    }
    

    function resetUI() {
        curDials = {};
        bubblesContainer.innerHTML = '';
        slidersContainer.innerHTML = '';
        responseDisplay.innerText = '';
        rephraseButton.style.display = 'none';
    }


    function randomInRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    function createBubble(trait, valueList) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.textContent = trait;

        let hue = randomInRange(120, 240); 
        let saturation = randomInRange(60, 150);
        let lightness = randomInRange(40, 100);
        bubble.style.backgroundColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;

        bubble.onclick = () => {
            createSlider(trait, valueList);
            bubble.style.display = 'none';
        };
        bubblesContainer.appendChild(bubble);
    }

    function addCustomSlider() {
        const traitName = prompt("Enter the new dial's name:");
        if (!traitName) return;
        const levels = prompt("Enter the dial's levels separated by commas:", "Low, Average, High");
        if (!levels) return;
        const valueList = levels.split(',').map(level => level.trim());
        valueList.push(Math.ceil(valueList.length/2).toString());
        createSlider(traitName, valueList); 
    }

    function createSlider(trait, valueList) {
        const index = valueList[parseInt(valueList.length - 1)];
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';
        const label = createSliderLabel(trait);
        const [slider, display] = createSliderWithDisplay(trait, valueList, index);

        const closeButton = document.createElement('button');
        closeButton.innerHTML = '&times;';
        closeButton.className = 'close-button';
        closeButton.addEventListener('click', function() {
            sliderContainer.remove();
            const bubbles = Array.from(bubblesContainer.children);
            const matchingBubble = bubbles.find(bubble => bubble.textContent === trait);
            if (matchingBubble) {
                matchingBubble.style.display = 'flex';
            }
            delete curDials[trait];
        });
        sliderContainer.append(label, slider, display, closeButton);
        slidersContainer.appendChild(sliderContainer);

        if (textInput.value.length > 0) {
            rephraseButton.style.display = 'block';
        }
        curDials[trait] = valueList[index];
    }

    function createSliderLabel(text) {
        const label = document.createElement('label');
        label.textContent = text;
        return label;
    }

    function createSliderWithDisplay(trait, valueList, index) {
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.className = 'slider';
        slider.min = '0';
        slider.max = (valueList.length - 2).toString();
        slider.value = (index).toString();
        const display = document.createElement('span');
        display.textContent = valueList[index];
        display.className = 'slider-value-display';
        slider.oninput = () => updateSliderValue(trait, valueList, slider, display);
        return [slider, display];
    }

    function updateSliderValue(trait, valueList, slider, display) {
        const value = valueList[slider.value];
        display.textContent = value;
    }

    function rephraseText() {
        const message = textInput.value;
        const {curInstructionMsg, lastRephrasing} = constructRephraseParams();
        if (curInstructionMsg.length === 0) return;
        fetch(`${url}rephrase_draft`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ session_id: sessionId, message: message, instruction: curInstructionMsg, last_rephrasing: lastRephrasing })
        })
        .then(response => streamResponse(response, responseDisplay))
        .catch(console.error);
    }

    function constructRephraseParams() {
        let curInstructionMsg = '';
        let lastRephrasing = '';
        const newDials = {}; 
        slidersContainer.querySelectorAll('.slider-container').forEach(container => {
            const trait = container.querySelector('label').textContent;
            const value = container.querySelector('.slider-value-display').textContent;
            
            if (curDials[trait] !== value) {
                curInstructionMsg += `${trait}:${value};`;
            } else {
                lastRephrasing += `${trait}:${value};`;
            }
    
            newDials[trait] = value;
        });
        curDials = {...newDials};
        if (curInstructionMsg.length == 0) {
            curInstructionMsg = lastRephrasing;
            lastRephrasing = '';
        }
        return { curInstructionMsg, lastRephrasing };
    }

    function streamResponse(response, displayElement) {
        const reader = response.body.getReader();
        displayElement.innerText = '';
        copyButton.style.display = 'none';
        function read() {
            reader.read().then(({done, value}) => {
                if (done) {
                    responseDisplay.innerText = responseDisplay.innerText.replace(/^\s+|\s+$/g, '');

                    copyButton.style.display = 'block'; 
                    return;
                }
                const chunk = new TextDecoder("utf-8").decode(value);
                displayElement.innerText = displayElement.innerText +' ' +chunk;
                read();
            });
        }
        read();
    }

    function copyText(event) {
        event.preventDefault();
        navigator.clipboard.writeText(responseDisplay.innerText)
            .then(() => {
                copyButton.textContent = 'Copied!';
                setTimeout(() => copyButton.textContent = 'Copy', 2000);
            })
            .catch(console.error);
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
