/* ==========================================
   PROJECT GALLERY LOGIC
   ========================================== */

const galleryGrid = document.getElementById("gallery-grid");
const loader = document.getElementById("loader");
const errorMessage = document.getElementById("error-message");

// Credentials (Retrieved from session storage if they exist)
let GITHUB_PAT = sessionStorage.getItem("github_pat") || "";
let GITHUB_REPO_OWNER = sessionStorage.getItem("github_owner") || "LukasPresti";
let GITHUB_REPO_NAME = sessionStorage.getItem("github_repo") || "IS322midterm-2";
const GITHUB_TARGET_FOLDER = "projects";

window.addEventListener('DOMContentLoaded', async () => {
    if (!GITHUB_PAT) {
        showError("Missing GitHub PAT. Please configure your API keys in the Builder App first.");
        return;
    }
    await loadProjects();
});

async function loadProjects() {
    try {
        const apiUrl = `https://api.github.com/repos/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/contents/${GITHUB_TARGET_FOLDER}`;

        const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
                "Authorization": `token ${GITHUB_PAT}`,
                "Accept": "application/vnd.github.v3+json"
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                // Folder doesn't exist yet, which means no projects
                hideLoader();
                showError("No projects found yet. Go build something!");
                return;
            }
            throw new Error(`GitHub API Error: ${response.statusText}`);
        }

        const files = await response.json();

        // Filter for HTML files only and sort by newest first (assuming timestamp filenames)
        const htmlFiles = files
            .filter(file => file.name.endsWith('.html'))
            .sort((a, b) => b.name.localeCompare(a.name));

        if (htmlFiles.length === 0) {
            hideLoader();
            showError("No generated websites found in the projects folder.");
            return;
        }

        renderGallery(htmlFiles);

    } catch (error) {
        hideLoader();
        showError(`Failed to load projects: ${error.message}`);
    }
}

function renderGallery(files) {
    hideLoader();
    galleryGrid.style.display = "grid";
    galleryGrid.innerHTML = "";

    files.forEach(file => {
        // Extract a readable date from our timestamp format: project-1748293.html
        let dateDisplay = "Generated via AI Builder";
        const timeMatch = file.name.match(/project-(\d+)\.html/);
        if (timeMatch && timeMatch[1]) {
            const date = new Date(parseInt(timeMatch[1]) * 1000);
            dateDisplay = date.toLocaleString();
        }

        const liveUrl = `https://${GITHUB_REPO_OWNER}.github.io/${GITHUB_REPO_NAME}/${file.path}`;
        const editUrl = `builder.html?edit=${encodeURIComponent(file.name)}`;

        const card = document.createElement("div");
        card.className = "gallery-card fade-in visible";

        card.innerHTML = `
            <div class="card-header">
                <div class="card-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>
                </div>
                <span class="card-badge">Live</span>
            </div>
            <div class="card-body">
                <h3 class="card-title">${file.name}</h3>
                <p class="card-date">${dateDisplay}</p>
            </div>
            <div class="card-actions">
                <a href="${editUrl}" class="card-btn btn-update">Update with AI</a>
                <a href="${liveUrl}" target="_blank" class="card-btn btn-view">View Live</a>
            </div>
        `;

        galleryGrid.appendChild(card);
    });
}

function hideLoader() {
    loader.style.display = "none";
}

function showError(msg) {
    errorMessage.textContent = msg;
    errorMessage.style.display = "block";
}
