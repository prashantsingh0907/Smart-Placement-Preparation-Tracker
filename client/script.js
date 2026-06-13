const API_URL =
  "http://localhost:5000/api/problems";

/* =========================
   GLOBAL STATE
========================= */

let problems = [];

let dataset = [];

let currentSearchQuery = "";

let currentDifficultyFilter =
  "all";

let currentStatusFilter =
  "all";

let currentSort = "id";

/* =========================
   LOAD DATASET
========================= */

async function loadDataset() {

  try {

    const response =
      await fetch(
        "./data/problems.json"
      );

    dataset =
      await response.json();

  }

  catch (error) {

    console.error(
      "Failed to load dataset:",
      error
    );

  }

}

/* =========================
   FETCH PROBLEMS
========================= */

async function fetchProblems() {

  try {

    const response =
      await fetch(API_URL);

    if (!response.ok) {

      throw new Error(
        "Failed to fetch problems"
      );

    }

    problems =
      await response.json();

    applyFilters();

    updateAnalytics();

    updateActiveFilters();

  }

  catch (error) {

    console.error(
      "Failed to fetch problems:",
      error
    );

  }

}

/* =========================
   SEARCH
========================= */

const searchInput =
  document.getElementById(
    "searchInput"
  );

const suggestionsBox =
  document.getElementById(
    "suggestions"
  );

searchInput.addEventListener(
  "input",
  () => {

    currentSearchQuery =
      searchInput.value
        .toLowerCase()
        .trim();

    renderSuggestions();

    applyFilters();

  }
);

/* =========================
   RENDER SUGGESTIONS
========================= */

function renderSuggestions() {

  suggestionsBox.innerHTML = "";

  if (
    currentSearchQuery === ""
  ) {

    return;

  }

  const matches =
    dataset.filter(problem => {

      const title =
        problem.title
          .toLowerCase();

      const id =
        problem.leetcodeId
          .toString();

      return (

        title.includes(
          currentSearchQuery
        )

        ||

        id.includes(
          currentSearchQuery
        )

      );

    });

  const limited =
    matches.slice(0, 6);

  if (limited.length === 0) {

    suggestionsBox.innerHTML = `

      <div class="suggestion-item">

        No problems found

      </div>

    `;

    return;

  }

  limited.forEach(problem => {

    const div =
      document.createElement("div");

    div.classList.add(
      "suggestion-item"
    );

    div.innerHTML = `

      <div>

        <strong>

          ${problem.leetcodeId}.
          ${problem.title}

        </strong>

      </div>

      <div>

        <span class="badge ${problem.difficulty.toLowerCase()}">

          ${problem.difficulty}

        </span>

      </div>

    `;

    div.onclick = () =>
      addProblem(problem);

    suggestionsBox.appendChild(div);

  });

}

/* =========================
   ADD PROBLEM
========================= */

async function addProblem(problem) {

  try {

    const alreadyExists =
      problems.some(
        p =>
          p.leetcodeId ===
          problem.leetcodeId
      );

    if (alreadyExists) {

      alert(
        "Problem already added!"
      );

      return;

    }

    const newProblem = {

      leetcodeId:
        problem.leetcodeId,

      title:
        problem.title,

      difficulty:
        problem.difficulty,

      topics:
        problem.topics,

      platform:
        problem.platform,

      solved: false,

      revisionCount: 0,

      lastSolved: null,

      notes: ""

    };

    await fetch(API_URL, {

      method: "POST",

      headers: {
        "Content-Type":
          "application/json"
      },

      body:
        JSON.stringify(
          newProblem
        )

    });

    searchInput.value = "";

    currentSearchQuery = "";

    suggestionsBox.innerHTML = "";

    fetchProblems();

  }

  catch (error) {

    console.error(
      "Failed to add problem:",
      error
    );

  }

}

/* =========================
   DISPLAY PROBLEMS
========================= */

function displayProblems(
  filteredProblems = problems
) {

  const list =
    document.getElementById(
      "problemList"
    );

  list.innerHTML = "";

  if (
    filteredProblems.length === 0
  ) {

    list.innerHTML = `

      <tr class="empty-row">

        <td colspan="8">

          No matching problems found

        </td>

      </tr>

    `;

    return;

  }

  filteredProblems.forEach((p) => {

    const row =
      document.createElement("tr");

    let badgeClass = "";

    if (
      p.difficulty === "Easy"
    ) {

      badgeClass = "easy";

    }

    else if (
      p.difficulty === "Medium"
    ) {

      badgeClass = "medium";

    }

    else {

      badgeClass = "hard";

    }

    const topicTags =
      p.topics.map(topic => `

        <span class="tag">

          ${topic}

        </span>

      `).join("");

    row.innerHTML = `

      <td class="status-cell">

        ${
          p.solved
            ? "✅"
            : "❌"
        }

      </td>

      <td>
        ${p.leetcodeId}
      </td>

      <td class="problem-title">
        ${p.title}
      </td>

      <td>

        <span class="badge ${badgeClass}">

          ${p.difficulty}

        </span>

      </td>

      <td>

        <div class="tags">

          ${topicTags}

        </div>

      </td>

      <td>
        ${p.revisionCount || 0}
      </td>

      <td>

        ${
          p.lastSolved
            ? new Date(
                p.lastSolved
              ).toLocaleDateString()
            : "-"
        }

      </td>

      <td>

        <div class="problem-actions">

          <button
            class="solve-btn"
            onclick="toggleSolved('${p._id}')"
          >

            ${
              p.solved
                ? "Unsolve"
                : "Solve"
            }

          </button>

          <button
            class="solve-btn"
            onclick="increaseRevision('${p._id}')"
          >

            Revise

          </button>

          <button
            class="delete-btn"
            onclick="deleteProblem('${p._id}')"
          >

            Delete

          </button>

        </div>

      </td>

    `;

    list.appendChild(row);

  });

}

/* =========================
   APPLY FILTERS
========================= */

function applyFilters() {

  let filtered = [...problems];

  if (
    currentSearchQuery !== ""
  ) {

    filtered =
      filtered.filter((p) => {

        const title =
          p.title.toLowerCase();

        const difficulty =
          p.difficulty.toLowerCase();

        const id =
          p.leetcodeId.toString();

        const topics =
          p.topics
            .join(" ")
            .toLowerCase();

        return (

          title.includes(
            currentSearchQuery
          )

          ||

          difficulty.includes(
            currentSearchQuery
          )

          ||

          id.includes(
            currentSearchQuery
          )

          ||

          topics.includes(
            currentSearchQuery
          )

        );

      });

  }

  if (
    currentDifficultyFilter !==
    "all"
  ) {

    filtered =
      filtered.filter(
        p =>

          p.difficulty
            .toLowerCase()

          ===

          currentDifficultyFilter
      );

  }

  if (
    currentStatusFilter !==
    "all"
  ) {

    filtered =
      filtered.filter(
        p => {

          if (
            currentStatusFilter
            === "solved"
          ) {

            return p.solved;

          }

          return !p.solved;

        }
      );

  }

  displayProblems(filtered);

}

/* =========================
   FILTER BUTTONS
========================= */

function setDifficultyFilter(
  value
) {

  currentDifficultyFilter =
    currentDifficultyFilter === value
      ? "all"
      : value;

  updateActiveFilters();

  applyFilters();

}

function clearDifficultyFilter() {

  currentDifficultyFilter =
    "all";

  updateActiveFilters();

  applyFilters();

}

function setStatusFilter(
  value
) {

  currentStatusFilter =
    currentStatusFilter === value
      ? "all"
      : value;

  updateActiveFilters();

  applyFilters();

}

function updateActiveFilters() {

  document
    .querySelectorAll(
      ".filter-btn"
    )
    .forEach(btn => {

      btn.classList.remove(
        "active"
      );

    });

  if (
    currentStatusFilter ===
    "all"
  ) {

    document
      .getElementById(
        "allFilter"
      )
      .classList.add(
        "active"
      );

  }

  if (
    currentStatusFilter ===
    "solved"
  ) {

    document
      .getElementById(
        "solvedFilter"
      )
      .classList.add(
        "active"
      );

  }

  if (
    currentStatusFilter ===
    "unsolved"
  ) {

    document
      .getElementById(
        "unsolvedFilter"
      )
      .classList.add(
        "active"
      );

  }

  if (
    currentDifficultyFilter ===
    "easy"
  ) {

    document
      .getElementById(
        "easyFilter"
      )
      .classList.add(
        "active"
      );

  }

  if (
    currentDifficultyFilter ===
    "medium"
  ) {

    document
      .getElementById(
        "mediumFilter"
      )
      .classList.add(
        "active"
      );

  }

  if (
    currentDifficultyFilter ===
    "hard"
  ) {

    document
      .getElementById(
        "hardFilter"
      )
      .classList.add(
        "active"
      );

  }

}

/* =========================
   TOGGLE SOLVED
========================= */

async function toggleSolved(id) {

  try {

    await fetch(
      `${API_URL}/${id}`,
      {
        method: "PUT"
      }
    );

    fetchProblems();

  }

  catch (error) {

    console.error(
      "Failed to update:",
      error
    );

  }

}

/* =========================
   INCREASE REVISION
========================= */

async function increaseRevision(id) {

  try {

    await fetch(
      `${API_URL}/revision/${id}`,
      {
        method: "PUT"
      }
    );

    fetchProblems();

  }

  catch (error) {

    console.error(
      "Failed revision update:",
      error
    );

  }

}

/* =========================
   DELETE PROBLEM
========================= */

async function deleteProblem(id) {

  try {

    await fetch(
      `${API_URL}/${id}`,
      {
        method: "DELETE"
      }
    );

    fetchProblems();

  }

  catch (error) {

    console.error(
      "Failed to delete:",
      error
    );

  }

}

/* =========================
   ANALYTICS
========================= */

function updateAnalytics() {

  const total =
    problems.length;

  const solved =
    problems.filter(
      p => p.solved
    ).length;

  document.getElementById(
    "total"
  ).textContent = total;

  document.getElementById(
    "solved"
  ).textContent = solved;

  const percent =
    total === 0
      ? 0
      : (solved / total) * 100;

  updateProgressBar(percent);

}

/* =========================
   PROGRESS BAR
========================= */

function updateProgressBar(
  percent
) {

  document.getElementById(
    "progressBar"
  ).style.width =
    percent + "%";

}

/* =========================
   DARK MODE
========================= */

function toggleDarkMode() {

  document.body.classList.toggle(
    "dark"
  );

  if (
    document.body.classList.contains(
      "dark"
    )
  ) {

    localStorage.setItem(
      "theme",
      "dark"
    );

  }

  else {

    localStorage.setItem(
      "theme",
      "light"
    );

  }

}

/* =========================
   LOAD THEME
========================= */

if (
  localStorage.getItem(
    "theme"
  ) === "dark"
) {

  document.body.classList.add(
    "dark"
  );

}

/* =========================
   INITIAL LOAD
========================= */

loadDataset();

fetchProblems();