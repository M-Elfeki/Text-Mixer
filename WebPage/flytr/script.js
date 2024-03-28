document.addEventListener("DOMContentLoaded", function () {

    const server_url = 'http://4.242.50.139:8000/';
    let questions = [
        "What is the field your company operates in?",
        "What company do you work for?",
        "What are the competing companies (seperated by semicolon)?",
        "What are the largest companies in your field (seperated by semicolon)?"
    ];

    let questionDiv = document.getElementById('question');
    let optionsDiv = document.getElementById('options');
    let answersDiv = document.getElementById('answers');
    let currentQuestion = 0;
    let answers = [];

    window.onload = function() {
        document.getElementById('back').disabled = false;
        document.getElementById('next').disabled = false;
        document.getElementById('options').disabled = false;
        answersDiv.innerHTML = "";
        // div results hidden
        document.getElementById("results").style.display = "none";
        showQuestion();
    }


    function showQuestion() {
        questionDiv.innerHTML = questions[currentQuestion];
        optionsDiv.innerHTML = '<input type="text" id="answer">';

        if (currentQuestion === 0) {
            document.getElementById('back').style.display = 'none';
        } else {
            document.getElementById('back').style.display = 'inline-block';
        }

        if (currentQuestion === questions.length - 1) {
            document.getElementById('next').innerText = 'Submit';
        } else {
            document.getElementById('next').innerText = 'Next';
        }

        let inputElement = document.getElementById('answer');
        document.getElementById('answer').disabled = false;
        inputElement.addEventListener("keyup", function(event) {
            if (event.key === "Enter") {
                event.preventDefault();
                next();
            }
        });
    }

    function back() {
        currentQuestion--;
        showQuestion();
    }

    function next() {
        let answer = document.getElementById('answer').value;
        answers.push(answer);

        if (currentQuestion < questions.length - 1) {
            currentQuestion++;
            showQuestion();
        } else {
            submitForm();
        }
        document.getElementById('answer').value = "";
        document.getElementById('answer').focus();
    }

    function submitForm() {
        document.getElementById('back').disabled = true;
        document.getElementById('next').disabled = true;
        document.getElementById('answer').disabled = true;
        document.getElementById("loader").style.display = "block";
        answersDiv.innerHTML = "<h3>Indexing...</h3>";

        fetchData()
    }

    async function fetchData() {
        const response = await fetch(server_url + 'analyze_data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "field": answers[0], 'company': answers[1], "competition": answers[2], "largest_companies": answers[3] })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            buffer += chunk;
            document.getElementById("results").style.display = "block";

            let boundary = buffer.indexOf('\n');
            while (boundary !== -1) { 
                const line = buffer.substring(0, boundary);
                buffer = buffer.substring(boundary + 1); 
                if (line) { 
                    processLine(line);
                }
                boundary = buffer.indexOf('\n');
            }
        }
        if (buffer.trim()) {
            processLine(buffer);
        }
        document.getElementById("questions").style.display = "block";
        document.getElementById("loader").style.display = "none";
        answersDiv.innerHTML = "<h3>Indexed and Ready to question!!</h3>";
        try{
            document.getElementById("questions").scrollIntoView({ behavior: 'smooth', block: 'end' });

            document.getElementById('questionInput').addEventListener("keyup", function(event) {
                if (event.key === "Enter") {
                    event.preventDefault();
                    document.getElementById('submitButton').click();
                }
            });
        } catch(e){
            console.log(e);
        }
    }

    let last_index = 0;
    let last_type = '';
    let title_dict = {"headline": "Headlines:", "company": "Articles Relevant to your company:", "competition": "Articles Relevant to your competition:", "largest_company": "Articles Relevant to the largest companies in your field:", "summary": "Summary Metrics:"};

    function processLine(line) {
        const data = JSON.parse(line);
        console.log(data);
        let div = document.getElementById(data['article_type']);
        if (data['article_type'] !== last_type) {
            last_index = 1;
            last_type = data['article_type'];
            div.innerHTML = "<hr><h2>" + title_dict[data['article_type']] + "</h2>";
        } else {
            last_index++;
        }

        if (data['cur_title']) {
            let curTitle = data['cur_title'];
            let curUrl = data['cur_url'];

            div.innerHTML += "<h3>" + last_index.toString() + ") <a href='" + curUrl + "'>" + curTitle + "</a></h3>";

            if (data['cur_kw'] && data['cur_kw'].length > 0){
                curKeyWords = data['cur_kw'];
                div.innerHTML += "<h4>Keywords:</h4><p> " + curKeyWords + "</p>";
            }
            if (data['cur_topics'] && data['cur_topics'].length > 0){
                curTopics = data['cur_topics'];
                div.innerHTML += "<h4>Key Topics:</h4><p> " + curTopics + "</p>";
            }
            if (data['cur_nm'] && data['cur_nm'].length > 0){
                curNm = data['cur_nm'];
                div.innerHTML += "<h4>Relevant Names:</h4><p> " + curNm + "</p>";
            }
            if (data['cur_stats'] && data['cur_stats'].length > 0){
                curStats = data['cur_stats'];
                div.innerHTML += "<h4>Key Statistics:</h4><p> " + curStats + "</p>";
            }
            if (data['cur_assert'] && data['cur_assert'].length > 0){
                curAsserts = data['cur_assert'];
                div.innerHTML += "<h4>Key Assertions:</h4><p> " + curAsserts + "</p>";
            }
        }

        if (data['article_type'] === 'summary') {
            topKeyWords = data['top_keywords'];
            topTopics = data['top_topics'];
            topNm = data['top_article_names'];
            topStats = data['top_article_statistics'];
            topAsserts = data['top_article_assertions'];
            div.innerHTML += "<h4>Top Keywords:</h4><p> " + topKeyWords + "</p>";
            div.innerHTML += "<h4>Top Topics:</h4><p> " + topTopics + "</p>";
            div.innerHTML += "<h4>Top Relevant Names:</h4><p> " + topNm + "</p>";
            div.innerHTML += "<h4>Top Key Statistics:</h4><p> " + topStats + "</p>";
            div.innerHTML += "<h4>Top Key Assertions:</h4><p> " + topAsserts + "</p>";
        }

        try{
            results.appendChild(div);
            div.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } catch(e){
            console.log(e);
        }
    }


    document.getElementById('submitButton').addEventListener('click', async () => {
        const question = document.getElementById('questionInput').value;
        if (!question) {
            alert('Please enter a question.');
            return;
        }

        const responseContainer = document.getElementById('responseContainer');
        const responseText = document.getElementById('responseText');
        const referenceList = document.getElementById('referenceList');

        try {
            const response = await fetch(server_url + 'answer_question', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ query_str: question })
            });
            const responseData = await response.json();
            
            responseText.innerText = responseData.response;

            referenceList.innerHTML = '';
            responseData.references.forEach((reference, index) => {
                const [probability, url, title, content] = reference;
                const listItem = document.createElement('li');
                listItem.className = 'reference-item';
                listItem.innerHTML = `
                    <p>${index + 1}) <a href="${url}" class="reference-link">${title}</a> - ${content}</p>
                `;
                referenceList.appendChild(listItem);
            });

            responseContainer.style.display = 'block';
        } catch (error) {
            console.error('Error fetching data:', error);
            alert('An error occurred while fetching data. Please try again later.');
        }
        try{
            responseContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
        } catch(e){
            console.log(e);
        }
    });

    
});