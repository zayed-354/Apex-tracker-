
(() => {
  "use strict";

  const KEY = "apex_tracker_v1";
  const $ = (selector) => document.querySelector(selector);

  const pages = [
    "Dashboard", "Tasks", "Study", "Habits", "Goals",
    "Time", "Business", "Money", "Health", "Calendar",
    "Analytics", "APEX AI"
  ];

  const icons = {
    Dashboard: "⌂", Tasks: "✓", Study: "▤", Habits: "↻",
    Goals: "◎", Time: "◷", Business: "▣", Money: "₹",
    Health: "♡", Calendar: "▦", Analytics: "▥", "APEX AI": "✦"
  };

  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || {};
    } catch {
      return {};
    }
  };

  let data = {
    tasks: [],
    habits: [],
    goals: [],
    sessions: [],
    income: [],
    expenses: [],
    theme: "dark",
    ...load()
  };

  let page = "Dashboard";

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      alert("Could not save data. Check your browser storage.");
    }
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  function today() {
    return new Date().toLocaleDateString(undefined, {
      weekday: "long", year: "numeric",
      month: "long", day: "numeric"
    });
  }

  function button(label, action, primary = false) {
    return `<button type="button" class="btn ${primary ? "primary" : ""}"
      data-action="${escapeHTML(action)}">${escapeHTML(label)}</button>`;
  }

  function card(title, content) {
    return `<section class="card">
      <h3>${escapeHTML(title)}</h3>${content}
    </section>`;
  }

  function list(items, type) {
    if (!items.length) {
      return `<p class="small">Nothing here yet. Add your first item!</p>`;
    }

    return `<div class="item-list">${items.map((item, i) => `
      <div class="item">
        <label>
          ${type === "tasks" ? `
            <input type="checkbox" data-task="${i}"
              ${item.done ? "checked" : ""}>` : ""}
          <span style="${item.done ? "text-decoration:line-through;opacity:.6" : ""}">
            ${escapeHTML(item.title)}
          </span>
        </label>
        <button class="btn" type="button"
          data-delete="${type}:${i}" aria-label="Delete item">×</button>
      </div>
    `).join("")}</div>`;
  }

  function addForm(placeholder, type) {
    return `<form data-form="${type}" class="row">
      <input name="title" placeholder="${escapeHTML(placeholder)}"
        required maxlength="150" aria-label="${escapeHTML(placeholder)}">
      <button class="btn primary" type="submit">Add</button>
    </form>`;
  }

  function nav() {
    $("#nav").innerHTML = pages.map(name => `
      <button type="button" class="nav-item ${page === name ? "active" : ""}"
        data-page="${escapeHTML(name)}">
        <span>${icons[name]}</span> ${escapeHTML(name)}
      </button>
    `).join("");
  }

  function dashboard() {
    const pending = data.tasks.filter(t => !t.done).length;
    const done = data.tasks.filter(t => t.done).length;
    const habitsDone = data.habits.filter(h => h.doneDate === new Date().toDateString()).length;
    const income = data.income.reduce((s, n) => s + n.amount, 0);
    const expenses = data.expenses.reduce((s, n) => s + n.amount, 0);

    return `
      <div class="grid">
        ${card("Pending tasks", `<h2>${pending}</h2>`)}
        ${card("Completed tasks", `<h2>${done}</h2>`)}
        ${card("Habits completed today", `<h2>${habitsDone}/${data.habits.length}</h2>`)}
        ${card("Money balance", `<h2>₹${(income - expenses).toFixed(2)}</h2>`)}
      </div>
      ${card("Today's tasks", list(data.tasks.slice(0, 5), "tasks"))}
      ${card("Quick add task", addForm("What needs to be done?", "tasks"))}
    `;
  }

  function simplePage(title, type, placeholder) {
    return card(title, addForm(placeholder, type) + list(data[type], type));
  }

  function renderPage() {
    switch (page) {
      case "Dashboard":
        return dashboard();

      case "Tasks":
        return simplePage("My Tasks", "tasks", "Enter a task");

      case "Study":
        return card("Study Tracker",
          `<p>Track study subjects as tasks.</p>` +
          simplePage("Study tasks", "tasks", "Subject or study task"));

      case "Habits":
        return card("Daily Habits",
          addForm("Enter a habit", "habits") +
          `<div class="item-list">${data.habits.map((h, i) => `
            <div class="item">
              <label><input type="checkbox" data-habit="${i}"
                ${h.doneDate === new Date().toDateString() ? "checked" : ""}>
                ${escapeHTML(h.title)}
              </label>
              <button class="btn" data-delete="habits:${i}">×</button>
            </div>`).join("")}</div>`);
      
      case "Goals":
        return simplePage("My Goals", "goals", "Enter a goal");

      case "Time":
        return card("Time Tracker",
          `<p>Record a completed work or study session.</p>` +
          addForm("Session name", "sessions") +
          list(data.sessions, "sessions"));

      case "Business":
        return card("Business Workspace",
          `<p>Track ideas and business action items.</p>` +
          simplePage("Business tasks", "tasks", "Next business action"));

      case "Money":
        return card("Money Tracker",
          `<h3>Income: ₹${data.income.reduce((s,n)=>s+n.amount,0).toFixed(2)}</h3>
           <h3>Expenses: ₹${data.expenses.reduce((s,n)=>s+n.amount,0).toFixed(2)}</h3>
           <form data-form="money" class="row">
             <input name="title" placeholder="Description" required>
             <input name="amount" type="number" min="0.01" step="0.01"
               placeholder="Amount ₹" required>
             <select name="kind" aria-label="Transaction type">
               <option value="income">Income</option>
               <option value="expenses">Expense</option>
             </select>
             <button class="btn primary" type="submit">Save</button>
           </form>
           <p class="small">Income and expenses are saved on this device.</p>`);
      
      case "Health":
        return card("Health & Wellness",
          `<p>Record your daily wellness habits in the Habits section.</p>` +
          button("Track a health habit", "health-habit", true));

      case "Calendar":
        return card("Calendar",
          `<h3>${escapeHTML(today())}</h3>` +
          list(data.tasks.filter(t => !t.done), "tasks"));

      case "Analytics":
        return card("Your Analytics",
          `<p>Total tasks: ${data.tasks.length}</p>
           <p>Completed: ${data.tasks.filter(t=>t.done).length}</p>
           <p>Pending: ${data.tasks.filter(t=>!t.done).length}</p>
           <p>Goals: ${data.goals.length}</p>
           <p>Habits: ${data.habits.length}</p>`);

      case "APEX AI":
        return card("APEX AI Assistant",
          `<p>I can help you plan your next action using your saved tasks.</p>` +
          button("What should I do now?", "suggest", true) +
          `<div id="aiAnswer" aria-live="polite"></div>`);

      default:
        return dashboard();
    }
  }

  function render() {
    nav();
    $("#pageTitle").textContent = page;
    $("#today").textContent = today();
    document.body.dataset.theme = data.theme;
    $("#content").innerHTML = renderPage();
    $("#themeBtn").textContent =
      data.theme === "dark" ? "Light mode" : "Dark mode";
  }

  $("#nav").addEventListener("click", e => {
    const btn = e.target.closest("[data-page]");
    if (!btn) return;
    page = btn.dataset.page;
    render();
  });

  $("#themeBtn").addEventListener("click", () => {
    data.theme = data.theme === "dark" ? "light" : "dark";
    save();
    render();
  });

  $("#quickAdd").addEventListener("click", () => {
    page = "Tasks";
    render();
    $("#content input[name='title']")?.focus();
  });

  $("#content").addEventListener("submit", e => {
    const form = e.target.closest("form[data-form]");
    if (!form) return;
    e.preventDefault();

    const fd = new FormData(form);
    const title = String(fd.get("title") || "").trim();
    if (!title) return;

    const type = form.dataset.form;

    if (type === "money") {
      const amount = Number(fd.get("amount"));
      const kind = fd.get("kind");
      if (!Number.isFinite(amount) || amount <= 0) {
        alert("Enter a valid amount.");
        return;
      }
      data[kind].push({ title, amount, date: new Date().toISOString() });
    } else {
      data[type].push({
        title,
        done: false,
        created: new Date().toISOString()
      });
    }

    save();
    render();
  });

  $("#content").addEventListener("change", e => {
    if (e.target.matches("[data-task]")) {
      data.tasks[Number(e.target.dataset.task)].done = e.target.checked;
      save();
      render();
    }

    if (e.target.matches("[data-habit]")) {
      const habit = data.habits[Number(e.target.dataset.habit)];
      habit.doneDate = e.target.checked ? new Date().toDateString() : "";
      save();
      render();
    }
  });

  $("#content").addEventListener("click", e => {
    const del = e.target.closest("[data-delete]");
    if (del) {
      const [type, index] = del.dataset.delete.split(":");
      if (!confirm("Delete this item?")) return;
      data[type].splice(Number(index), 1);
      save();
      render();
      return;
    }

    const action = e.target.closest("[data-action]")?.dataset.action;

    if (action === "health-habit") {
      page = "Habits";
      render();
    }

    if (action === "suggest") {
      const next = data.tasks.find(t => !t.done);
      const answer = next
        ? `Your next task: ${next.title}`
        : "No pending tasks. Add a task or review your goals.";
      const target = $("#aiAnswer");
      if (target) target.textContent = answer;
    }
  });

  render();
})();
                    
