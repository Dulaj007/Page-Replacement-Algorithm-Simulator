/**************************************
 * DOM Element References
 * Description:
 *   These variables store references to key HTML elements in the UI:
 *     - framesRange: Slider input to select number of RAM frames
 *     - framesValue: Display the current value of framesRange
 *     - refInput: Text input for reference string (pages to access)
 *     - requiredInput: Text input for required pages (special pages to track)
 *     - ramDisplay: Container to visually show current RAM content
 *     - startBtn: Button to start the FIFO simulation
 *     - historyTableBody: Table body to log step-by-step simulation results
 *     - tableHeader: Table header element to dynamically display columns
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
 * Description:
 *   framesCount: Stores the current number of RAM frames selected by the user.
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

  // 1. Frame size must be 3–5
  if (framesCount < 3 || framesCount > 5) {
    alert("Frame size must be between 3 and 5!");
    return;
  }

  // 2. Reference string must have fewer than 10 elements
  if (pages.length > 10) {
    alert("Reference string must have fewer than 10 elements!");
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
 * Description:
 *   Renders empty RAM shells according to the current number of frames.
 *   Each shell represents a memory slot and initially displays a dash ("-").
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
 * Description:
 *   Executes the FIFO page replacement simulation.
 *   Handles page faults and required page tracking.
 *
 * Parameters:
 *   referenceString - array of page numbers to process
 *   requiredPagesInput - array of pages that must be loaded before simulation stops
 *   showPageFault - boolean indicating whether to display the Page Fault column
 **************************************/
function runSimulation(referenceString, requiredPagesInput, showPageFault) {
    // Reset RAM display and history table
    renderRamShells();
    historyTableBody.innerHTML = "";

    // Update table header dynamically
    tableHeader.innerHTML = showPageFault
        ? "<th>Step</th><th>Page</th><th>Frames</th><th>Page Fault</th>"
        : "<th>Step</th><th>Page</th><th>Frames</th>";

    const frames = Array(framesCount).fill(null); // Initialize empty frames
    const queue = []; // FIFO queue to track replacement order
    let step = 0;

    // Clone required pages array to remove pages as they are loaded
    const requiredPages = [...requiredPagesInput];

    /**************************************
     * Function: nextStep
     * Description:
     *   Processes one page at a time in the reference string.
     *   Updates RAM display, page fault status, and history table.
     *   Stops simulation once all required pages are loaded.
     **************************************/
    function nextStep() {
        if (step >= referenceString.length) return;

        const page = referenceString[step];
        let fault = false;

        const isPageInRAM = frames.includes(page);

        if (!isPageInRAM) {
            // Only mark a page fault if there are required pages to track
            if (showPageFault && requiredPages.length > 0) {
                fault = true;
            }

            // Insert page using FIFO algorithm
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

        // Remove pages from requiredPages if they are now loaded in RAM
        if (requiredPages.length > 0) {
            for (let i = requiredPages.length - 1; i >= 0; i--) {
                if (frames.includes(requiredPages[i])) {
                    requiredPages.splice(i, 1);
                }
            }

            // If all required pages are loaded, mark fault as NO
            if (requiredPages.length === 0) fault = false;
        }

        // Update RAM display visually
        ramDisplay.querySelectorAll(".shell").forEach((shell, idx) => {
            shell.textContent = frames[idx] !== null ? frames[idx] : "-";
            if (showPageFault) {
                shell.classList.toggle("fault", fault && frames[idx] === page);
            }
        });

        // Add step info to the history table
        const framesText = frames.map(f => (f !== null ? f : "-")).join(" | ");
        const rowHTML = showPageFault
            ? `<td>${step + 1}</td><td>${page}</td><td>${framesText}</td><td>${fault ? "YES" : "NO"}</td>`
            : `<td>${step + 1}</td><td>${page}</td><td>${framesText}</td>`;
        historyTableBody.insertAdjacentHTML("beforeend", `<tr>${rowHTML}</tr>`);

        step++;

        // Stop simulation immediately if all required pages are loaded
        if (requiredPages.length === 0 && showPageFault) return;

        // Continue to next step after 1 second
        setTimeout(nextStep, 1000);
    }


    // Start the first step of the simulation
    nextStep();
}
