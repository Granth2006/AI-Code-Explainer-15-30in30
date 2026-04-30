document.addEventListener('DOMContentLoaded', () => {
    const codeInput = document.getElementById('codeInput');
    const apiKeyInput = document.getElementById('apiKey');
    const explainBtn = document.getElementById('explainBtn');
    const btnText = explainBtn.querySelector('.btn-text');
    const loader = explainBtn.querySelector('.loader');
    const errorMsg = document.getElementById('errorMsg');
    const outputContainer = document.getElementById('outputContainer');
    const explanationOutput = document.getElementById('explanationOutput');
    const copyBtn = document.getElementById('copyBtn');

    explainBtn.addEventListener('click', async () => {
        const code = codeInput.value.trim();
        const apiKey = apiKeyInput.value.trim();

        if (!apiKey) {
            errorMsg.textContent = 'Please enter your Groq API key.';
            errorMsg.classList.remove('hidden');
            return;
        }

        // Handle empty input
        if (!code) {
            errorMsg.textContent = 'Please enter some code to explain.';
            errorMsg.classList.remove('hidden');
            return;
        }

        errorMsg.classList.add('hidden');
        
        // Show loading state
        setLoadingState(true);
        outputContainer.classList.add('hidden');

        try {
            // Groq API call
            const explanation = await explainCodeWithGroq(code, apiKey);
            
            // Display result
            explanationOutput.textContent = explanation;
            outputContainer.classList.remove('hidden');
            
            // Scroll to output after a small delay to allow DOM to render
            setTimeout(() => {
                outputContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 50);
        } catch (error) {
            explanationOutput.textContent = `Error: ${error.message}`;
            outputContainer.classList.remove('hidden');
        } finally {
            setLoadingState(false);
        }
    });

    copyBtn.addEventListener('click', () => {
        const textToCopy = explanationOutput.textContent;
        if (!textToCopy) return;

        navigator.clipboard.writeText(textToCopy).then(() => {
            // Visual feedback for copy
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });

    // Remove error message when user starts typing code or api key
    codeInput.addEventListener('input', () => {
        if (!errorMsg.classList.contains('hidden')) {
            errorMsg.classList.add('hidden');
        }
    });

    apiKeyInput.addEventListener('input', () => {
        if (!errorMsg.classList.contains('hidden')) {
            errorMsg.classList.add('hidden');
        }
    });

    function setLoadingState(isLoading) {
        if (isLoading) {
            explainBtn.disabled = true;
            btnText.textContent = 'Thinking...';
            loader.classList.remove('hidden');
        } else {
            explainBtn.disabled = false;
            btnText.textContent = 'Explain Code';
            loader.classList.add('hidden');
        }
    }

    // Groq API Function
    async function explainCodeWithGroq(userCode, apiKey) {
        const prompt = `You are an expert programming teacher.
Explain the following code in a simple, human-readable way.
Assume the user is a beginner.
Break explanation into steps.
Keep it concise.

Code:
${userCode}`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant', // Fast model suitable for explanations
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.5,
                max_tokens: 1024,
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => null);
            throw new Error(errorData?.error?.message || 'Failed to communicate with Groq API');
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }
});
