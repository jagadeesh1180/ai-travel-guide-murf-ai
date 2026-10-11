const form = document.querySelector("#plan-form");
const planButton = document.querySelector("#plan-button");
const emptyState = document.querySelector("#empty-state");
const loading = document.querySelector("#loading");
const planOutput = document.querySelector("#plan-output");
const resultActions = document.querySelector("#result-actions");
const caption = document.querySelector("#result-caption");
const speakButton = document.querySelector("#speak-button");
const stopButton = document.querySelector("#stop-button");
const audioPlayer = document.querySelector("#audio-player");
const speechStatus = document.querySelector("#speech-status");

let currentPlan = "";

function showError(message) {
  planOutput.classList.remove("hidden");
  planOutput.replaceChildren();
  const box = document.createElement("p");
  box.textContent = message;
  box.setAttribute("role", "alert");
  planOutput.appendChild(box);
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[character]));
}

// All model-generated text is HTML-escaped before limited Markdown formatting.
function renderMarkdown(markdown) {
  const lines = escapeHtml(markdown).replace(/\r/g, "").split("\n");
  let html = "";
  let paragraph = [];
  let listType = null;

  const closeParagraph = () => {
    if (paragraph.length) {
      html += "<p>" + paragraph.join("<br>") + "</p>";
      paragraph = [];
    }
  };
  const closeList = () => {
    if (listType) {
      html += listType === "ul" ? "</ul>" : "</ol>";
      listType = null;
    }
  };
  const inline = text => text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");

  for (const line of lines) {
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const bullet = line.match(/^\s*[-*]\s+(.+)$/);
    const ordered = line.match(/^\s*\d+[.)]\s+(.+)$/);
    if (!line.trim()) {
      closeParagraph(); closeList(); continue;
    }
    if (heading) {
      closeParagraph(); closeList();
      const level = heading[1].length;
      html += `<h${level}>${inline(heading[2])}</h${level}>`;
    } else if (bullet || ordered) {
      closeParagraph();
      const kind = bullet ? "ul" : "ol";
      if (listType !== kind) { closeList(); html += `<${kind}>`; listType = kind; }
      html += `<li>${inline((bullet || ordered)[1])}</li>`;
    } else {
      closeList();
      paragraph.push(inline(line));
    }
  }
  closeParagraph(); closeList();
  return html;
}

form.addEventListener("submit", async event => {
  event.preventDefault();
  const payload = {
    destination: document.querySelector("#destination").value.trim(),
    days: Number(document.querySelector("#days").value),
    budget: document.querySelector("#budget").value,
    interests: document.querySelector("#interests").value.trim()
  };

  currentPlan = "";
  audioPlayer.pause();
  audioPlayer.removeAttribute("src");
  audioPlayer.classList.add("hidden");
  resultActions.classList.add("hidden");
  planOutput.classList.add("hidden");
  emptyState.classList.add("hidden");
  loading.classList.remove("hidden");
  planButton.disabled = true;
  caption.textContent = "Creating a plan…";

  try {
    const response = await fetch("/api/plan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not create the itinerary.");
    currentPlan = String(data.plan || "");
    planOutput.innerHTML = renderMarkdown(currentPlan);
    planOutput.classList.remove("hidden");
    resultActions.classList.remove("hidden");
    caption.textContent = `${payload.days}-day itinerary for ${payload.destination}`;
  } catch (error) {
    showError(error.message || "Something went wrong. Please try again.");
    caption.textContent = "Couldn't create itinerary";
  } finally {
    loading.classList.add("hidden");
    planButton.disabled = false;
  }
});

speakButton.addEventListener("click", async () => {
  if (!currentPlan) return;
  speakButton.disabled = true;
  stopButton.disabled = false;
  speechStatus.textContent = "Creating your voice guide with Murf…";
  audioPlayer.classList.add("hidden");
  try {
    const plainText = currentPlan
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/[\*_#`]/g, "")
      .slice(0, 3000);
    const response = await fetch("/api/speech", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: plainText, voiceId: "en-US-natalie" })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not create speech.");
    audioPlayer.src = data.audioUrl;
    audioPlayer.classList.remove("hidden");
    await audioPlayer.play();
    speechStatus.textContent = "Your voice guide is ready.";
  } catch (error) {
    speechStatus.textContent = error.message || "Speech generation failed.";
  } finally {
    speakButton.disabled = false;
    stopButton.disabled = true;
  }
});

stopButton.addEventListener("click", () => {
  audioPlayer.pause();
  audioPlayer.currentTime = 0;
  stopButton.disabled = true;
  speechStatus.textContent = "Playback stopped.";
});
audioPlayer.addEventListener("ended", () => { stopButton.disabled = true; });
