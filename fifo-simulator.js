/**************************************
 * DOM Element References
 **************************************/
const framesRange = document.getElementById("framesRange");
const framesValue = document.getElementById("framesValue");
const refInput = document.getElementById("refInput");
const requiredInput = document.getElementById("requiredInput");
const ramDisplay = document.getElementById("ramDisplay");
const startBtn = document.getElementById("startBtn");
const historyTableBody = document.querySelector("#historyTable tbody");
const tableHeader = document.getElementById("tableHeader");

/**************************************
 * Global Variables
 **************************************/
let framesCount = parseInt(framesRange.value); // Current number of frames




/**************************************
 * Event Listeners
 **************************************/
// Update frames count and re-render RAM shells when slider changes
framesRange.addEventListener("input", () => {
  framesCount = parseInt(framesRange.value);
  framesValue.textContent = framesCount;
  renderRamShells();
});

// Start simulation when the Start button is clicked
startBtn.addEventListener("click", () => {
  const refString = refInput.value.trim();

  // Validate reference string input
  if (!refString) {
    alert("Please enter a reference string!");
    return;
  }
  const pages = refString.split(/\s+/).map(Number);
  if (pages.some(isNaN)) {
    alert("Reference string must contain only numbers separated by spaces!");
    return;
  }

  // Process optional required pages input
  let requiredPages = [];
  const requiredStr = requiredInput.value.trim();
  let showPageFault = false;

  if (requiredStr) {
    requiredPages = requiredStr.split(/\s+/).map(Number);
    if (requiredPages.some(isNaN)) {
      alert("Required memory items must contain only numbers separated by spaces!");
      return;
    }
    showPageFault = true; // Enable page fault tracking if required items exist
  }

  // Run the FIFO page replacement simulation
  runSimulation(pages, requiredPages, showPageFault);
});




/**************************************
 * Function: renderRamShells
 * Description: Render empty RAM shells based on current frames count
 **************************************/
function renderRamShells() {
  ramDisplay.innerHTML = "";
  for (let i = 0; i < framesCount; i++) {
    const shell = document.createElement("div");
    shell.classList.add("shell");
    shell.textContent = "-";
    ramDisplay.appendChild(shell);
  }
}




// Initial render of RAM shells
renderRamShells();

/**************************************
 * Function: runSimulation
 * Description: Execute FIFO page replacement simulation
 * Parameters:
 *   referenceString - array of page numbers to process
 *   requiredPages   - array of pages to check for completion
 *   showPageFault   - boolean indicating if page fault column should be displayed
 **************************************/
function runSimulation(referenceString, requiredPages, showPageFault) {
  // Reset RAM display and history table
  renderRamShells();
  historyTableBody.innerHTML = "";

  // Update table header based on page fault tracking
  tableHeader.innerHTML = showPageFault
    ? "<th>Step</th><th>Page</th><th>Frames</th><th>Page Fault</th>"
    : "<th>Step</th><th>Page</th><th>Frames</th>";

  const frames = Array(framesCount).fill(null); // Initialize empty frames
  const queue = []; // FIFO queue to track frame replacement order
  let step = 0; // Current step index in reference string



  /**************************************
   * Function: nextStep
   * Description: Process one page at a time, update RAM, table, and handle page faults
   **************************************/
  function nextStep() {
    if (step >= referenceString.length) return; // Stop if end of reference string reached

    const page = referenceString[step];
    let fault = false;
    const isPageInRAM = frames.includes(page); // Check if page already exists in RAM

    if (!isPageInRAM) {
      // Determine if loading this page completes all required pages
      let willCompleteRequired = false;
      if (showPageFault && requiredPages.includes(page)) {
        const tempFrames = [...frames];
        if (tempFrames.includes(null)) {
          tempFrames[tempFrames.indexOf(null)] = page;
        } else {
          tempFrames[queue[0]] = page; // Replace oldest frame using FIFO
        }
        willCompleteRequired = requiredPages.every(r => tempFrames.includes(r));
      }

      // Mark page fault only if it doesn't complete all required pages
      fault = showPageFault && !willCompleteRequired;

      // Place page in RAM
      if (frames.includes(null)) {
        const emptyIndex = frames.indexOf(null);
        frames[emptyIndex] = page;
        queue.push(emptyIndex);
      } else {
        const removeIndex = queue.shift();
        frames[removeIndex] = page;
        queue.push(removeIndex);
      }
    }

    // Update RAM display
    ramDisplay.querySelectorAll(".shell").forEach((shell, idx) => {
      shell.textContent = frames[idx] !== null ? frames[idx] : "-";
      if (showPageFault) {
        shell.classList.toggle("fault", fault && frames[idx] === page);
      }
    });

    // Add a row to the history table
    const framesText = frames.map(f => (f !== null ? f : "-")).join(" | ");
    const rowHTML = showPageFault
      ? `<td>${step + 1}</td><td>${page}</td><td>${framesText}</td><td>${fault ? "YES" : "NO"}</td>`
      : `<td>${step + 1}</td><td>${page}</td><td>${framesText}</td>`;
    historyTableBody.insertAdjacentHTML("beforeend", `<tr>${rowHTML}</tr>`);

    step++;

    // Stop simulation if all required pages are loaded
    if (showPageFault && requiredPages.every(r => frames.includes(r))) return;

    // Continue to next step after 1 second
    setTimeout(nextStep, 1000);
  }

  // Start simulation
  nextStep();
}
