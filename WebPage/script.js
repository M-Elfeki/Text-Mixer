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
    copyButton.style.display = 'block'; 
    rephraseButton.style.display = 'none';

    analyzeButton.addEventListener('click', analyzeText);
    copyButton.addEventListener('click', copyText);
    addSliderButton.addEventListener('click', addCustomSlider);
    rephraseButton.addEventListener('click', rephraseText);

    function analyzeText() {
        const message = textInput.value;
        fetch(`${url}detect_dials`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ session_id: sessionId, message: message })
        })
        .then(response => response.json())
        .then(updateUIWithDials)
        .catch(console.error);
    }

    function updateUIWithDials(data) {
        resetUI();
        Object.entries(data).forEach(([trait, valueList]) => {
            createBubble(trait, valueList);
        });
    }

    function resetUI() {
        curDials = {};
        bubblesContainer.innerHTML = '';
        slidersContainer.innerHTML = '';
        responseDisplay.innerText = '';
        rephraseButton.style.display = 'none';
    }

    function createBubble(trait, valueList) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        bubble.textContent = trait;
        bubble.onclick = () => {
            createSlider(trait, valueList);
            bubble.style.display = 'none';
        };
        bubblesContainer.appendChild(bubble);
    }

    function addCustomSlider() {
        const traitName = prompt("Enter the name for the new slidebar:");
        if (!traitName) return;
        const levels = prompt("Enter the five levels separated by commas (e.g., Low, Below Average, Average, Above Average, High):");
        if (!levels) return;
        const valueList = levels.split(',').map(level => level.trim());
        valueList.push(Math.ceil(valueList.length/2).toString());
        createSlider(traitName, valueList); 
    }

    function createSlider(trait, valueList) {
        const index = valueList.length - 1;
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'slider-container';
        const label = createSliderLabel(trait);
        const [slider, display] = createSliderWithDisplay(trait, valueList, index);
        sliderContainer.append(label, slider, display);
        slidersContainer.appendChild(sliderContainer);
        
        if (textInput.value.length > 0) {
            rephraseButton.style.display = 'block';
        }
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
        slider.max = valueList.length - 2;
        slider.value = index;
        const display = document.createElement('span');
        display.textContent = valueList[index];
        display.className = 'slider-value-display';
        slider.oninput = () => updateSliderValue(trait, valueList, slider, display);
        return [slider, display];
    }

    function updateSliderValue(trait, valueList, slider, display) {
        const value = valueList[slider.value];
        display.textContent = value;
        curDials[trait] = value;
    }

    function rephraseText() {
        const message = textInput.value;
        const {curInstructionMsg, lastRephrasing} = constructRephraseParams();
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
    
        return { curInstructionMsg, lastRephrasing };
    }

    function streamResponse(response, displayElement) {
        const reader = response.body.getReader();
        displayElement.innerText = '';
        copyButton.style.display = 'none';
        function read() {
            reader.read().then(({done, value}) => {
                if (done) {
                    copyButton.style.display = 'block'; 
                    console.log('Stream finished.');
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
