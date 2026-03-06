// ==========================================
// CONFIGURATION & API KEYS
// ==========================================
// Variables will be populated from the UI Modal to avoid hardcoding secrets.

let OPENAI_API_KEY = "";
let GITHUB_PAT = "";
let GITHUB_REPO_OWNER = "";
let GITHUB_REPO_NAME = "";
// The specific folder where the generated websites will be pushed. 
const GITHUB_TARGET_FOLDER = "projects";


// ==========================================
// UI ELEMENTS
// ==========================================
const recordBtn = document.getElementById("record-btn");
const stopBtn = document.getElementById("stop-btn");
const statusLog = document.getElementById("status-log");
const recordingPulse = document.getElementById("recording-pulse");
const successLinkContainer = document.getElementById("success-link-container");

// Modal Elements
const configModal = document.getElementById("config-modal");
const saveConfigBtn = document.getElementById("save-config-btn");

let mediaRecorder;
let audioChunks = [];


// ==========================================
// APP INITIALIZATION & CONFIGURATION
// ==========================================
// Ensure this script only runs if we are on the builder page
if (configModal) {
    window.addEventListener('DOMContentLoaded', () => {
        configModal.classList.add('active');
    });

    saveConfigBtn.addEventListener('click', () => {
        OPENAI_API_KEY = document.getElementById('openai-key').value.trim();
        GITHUB_PAT = document.getElementById('github-pat').value.trim();
        GITHUB_REPO_OWNER = document.getElementById('github-owner').value.trim();
        GITHUB_REPO_NAME = document.getElementById('github-repo').value.trim();

        if (!OPENAI_API_KEY || !GITHUB_PAT || !GITHUB_REPO_OWNER || !GITHUB_REPO_NAME) {
            alert("Please fill in all configuration fields to proceed.");
            return;
        }

        configModal.classList.remove('active');
        logStatus("System ready. Waiting for instructions...");
    });
}


// ==========================================
// UTILITY: LOGGING
// ==========================================
function logStatus(message) {
    if (!statusLog) return;
    const timestamp = new Date().toLocaleTimeString();
    statusLog.value += `[${timestamp}] ${message}\n`;
    statusLog.scrollTop = statusLog.scrollHeight;
    console.log(`[${timestamp}] ${message}`);
}


// ==========================================
// PIPELINE 1: AUDIO CAPTURE
// ==========================================
async function initAudioCapture() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = async () => {
            const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
            audioChunks = []; // Clear chunks
            recordingPulse.style.display = "none";
            successLinkContainer.style.display = "none";

            logStatus("Recording received. Engaging AI Architect...");
            await processAudioPipeline(audioBlob);
        };

    } catch (err) {
        logStatus(`Error: Microphone access denied. ${err.message}`);
    }
}

if (recordBtn) {
    recordBtn.addEventListener("click", async () => {
        if (!mediaRecorder) await initAudioCapture();

        if (mediaRecorder && mediaRecorder.state === "inactive") {
            mediaRecorder.start();
            recordBtn.disabled = true;
            stopBtn.disabled = false;
            recordingPulse.style.display = "flex";
            logStatus("Listening to your instructions...");
        }
    });
}

if (stopBtn) {
    stopBtn.addEventListener("click", () => {
        if (mediaRecorder && mediaRecorder.state === "recording") {
            mediaRecorder.stop();
            recordBtn.disabled = false;
            stopBtn.disabled = true;
        }
    });
}

// ==========================================
// MAIN PROCESSING PIPELINE
// ==========================================
async function processAudioPipeline(audioBlob) {
    try {
        // 1. Transcription 
        logStatus("Step 1: Transcribing instructions via Whisper...");
        const transcript = await transcribeAudio(audioBlob);
        logStatus(`Instructions heard: "${transcript}"`);

        // 2. Content Structuring - Building the Website
        logStatus("Step 2: AI is writing the HTML, CSS, and JS...");
        const htmlContent = await buildWebsiteHTML(transcript);
        logStatus("Website coded successfully! Rendering live preview...");

        // Render preview
        const previewFrame = document.getElementById("preview-frame");
        previewFrame.srcdoc = htmlContent;

        // 3. Publishing to GitHub
        logStatus(`Step 3: Pushing live to repository (${GITHUB_REPO_NAME})...`);
        const response = await publishToGitHub(htmlContent);

        // Expose Live Link
        const pagesUrl = `https://${GITHUB_REPO_OWNER}.github.io/${GITHUB_REPO_NAME}/${response.content.path}`;

        successLinkContainer.innerHTML = `
            <h3>✅ Deployment Complete</h3>
            <p>Your website is currently building on GitHub Pages.</p>
            <a href="${pagesUrl}" target="_blank" class="btn primary-btn mt-4">
                Open Live Website
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-left:5px"><path d="M10 6H6C4.89543 6 4 6.89543 4 8V18C4 19.1046 4.89543 20 6 20H16C17.1046 20 18 19.1046 18 18V14M14 4H20M20 4V10M20 4L10 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </a>
            <p style="font-size:0.8rem; margin-top:10px; color:var(--text-muted);">(Note: It may take 30-60 seconds for GitHub to deploy the URL)</p>
        `;
        successLinkContainer.style.display = "block";

        logStatus(`Done! Live URL: ${pagesUrl}`);

    } catch (error) {
        logStatus(`Build Failed: ${error.message}`);
    }
}


// ==========================================
// PIPELINE 2: TRANSCRIPTION (OpenAI Whisper)
// ==========================================
async function transcribeAudio(audioBlob) {
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");
    formData.append("model", "whisper-1");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${OPENAI_API_KEY}` },
        body: formData
    });

    if (!response.ok) throw new Error(`Whisper API Error: ${response.statusText}`);
    const data = await response.json();
    return data.text;
}


// ==========================================
// PIPELINE 3: AI WEB BUILDER (OpenAI GPT-4o)
// ==========================================
async function buildWebsiteHTML(transcriptText) {
    const systemPrompt = `You are an Expert Full-Stack Web Developer. 
Your objective is to take the user's spoken instructions and build a complete, fully functional, beautifully styled, single-file HTML website.

Requirements for your output:
1. It MUST be a complete HTML5 document starting with <!DOCTYPE html>.
2. It MUST include embedded <style> CSS that makes the site look incredibly modern, sleek, and premium. Use custom Google Fonts, nice box shadows, responsive flexbox/grid layouts, hover states, and smooth transitions. Give it a high-quality UI.
3. It MUST include embedded <script> tags for any javascript functionality requested (e.g. if they ask for a calculator, write the logic).
4. Do not just outline the code, actually BUILD out the fully functional elements requested.
5. IMPORTANT: Output ONLY the raw HTML string. Do NOT wrap your output in markdown code block formatting (NO \`\`\`html and NO \`\`\`). The very first character of your response must be <`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
            model: "gpt-4o",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Build a website based on these instructions:\n\n${transcriptText}` }
            ],
            temperature: 0.7
        })
    });

    if (!response.ok) throw new Error(`LLM API Error: ${response.statusText}`);

    const data = await response.json();
    let content = data.choices[0].message.content.trim();

    if (content.startsWith("```html")) content = content.replace(/^```html\n/, "").replace(/\n```$/, "");
    else if (content.startsWith("```")) content = content.replace(/^```\n/, "").replace(/\n```$/, "");

    return content;
}


// ==========================================
// PIPELINE 4: PUBLISHING (GitHub REST API)
// ==========================================
async function publishToGitHub(fileContent) {
    // Scaffold file name dynamically (e.g., project-1234.html)
    const timestampId = Math.floor(Date.now() / 1000);
    const filename = `project-${timestampId}.html`;

    const path = GITHUB_TARGET_FOLDER ? `${GITHUB_TARGET_FOLDER}/${filename}` : filename;
    const apiUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${path}`;

    // Base64 encode preserving UTF-8
    const encodedContent = btoa(unescape(encodeURIComponent(fileContent)));

    const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
            "Authorization": `token ${GITHUB_PAT}`,
            "Content-Type": "application/json",
            "Accept": "application/vnd.github.v3+json"
        },
        body: JSON.stringify({
            message: `feat: autonomous AI deployment of ${filename}`,
            content: encodedContent
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API Error: ${errorData.message || response.statusText}`);
    }

    return await response.json();
}
