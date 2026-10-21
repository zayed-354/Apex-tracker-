
(() => {
"use strict";

const KEY = "apex_tracker_v1";
const pages = [
  ["home","⌂","Dashboard"],["tasks","✓","Tasks"],["study","▤","Study"],
  ["habits","↗","Habits"],["goals","◎","Goals"],["time","◷","Time"],
  ["business","◇","Business"],["money","$","Money"],["health","♡","Health"],
  ["calendar","▦","Calendar"],["analytics","▥","Analytics"],
  ["ai","✦","APEX AI"],["settings","⚙","Settings"]
];

const blank = () => ({
  tasks:[],study:[],habits:[],goals:[],time:[],
  business:[],money:[],health:[],calendar:[],
  activity:[],theme:"dark"
});

function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    return saved && typeof saved==="object"
      ? {...blank(),...saved} : blank();
  } catch { return blank(); }
}

let db = load();
let current = "home";

function save() {
  try {
    localStorage.setItem(KEY,JSON.stringify(db));
    return true;
  } catch {
    alert("Could not save data. Browser storage may be full.");
    return false;
  }
}

function esc(v) {
  return String(v??"").replace(/[&<>"']/g,c=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",
    '"':"&quot;","'":"&#39;"
  })[c]);
}

function id() {
  return Date.now().toString(36)+Math.random().toString(36).slice(2,7);
}

function todayKey() {
  const d=new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function money(v) {
  return new Intl.NumberFormat("en-IN",{
    style:"currency",currency:"INR",maximumFractionDigits:0
  }).format(Number(v)||0);
}

function heading(t) { return `<h2>${esc(t)}</h2>`; }

function card(c) {
  return `<section class="card">${c}</section>`;
}

function empty(t="Nothing here yet. Add your first item.") {
  return `<div class="empty">${esc(t)}</div>`;
}

function field(label,name,placeholder="",type="text",required=true) {
  return `<label class="small">${esc(label)}
    <input name="${esc(name)}" type="${esc(type)}"
    placeholder="${esc(placeholder)}" ${required?"required":""}>
  </label>`;
}

function selectField(label,name,options) {
  return `<label class="small">${esc(label)}
    <select name="${esc(name)}">${options.map(x=>
      `<option value="${esc(x)}">${esc(x)}</option>`
    ).join("")}</select>
  </label>`;
}

function formBox(title,fields) {
  return card(`${heading(title)}
    <form data-form="record">${fields}
      <button class="btn primary" type="submit">Save item</button>
    </form>`);
}

function addActivity(message) {
  db.activity.unshift({id:id(),message,date:new Date().toISOString()});
  db.activity=db.activity.slice(0,30);
}

function recordList(key,toggle=false) {
  const records=db[key]||[];
  if(!records.length) return empty();

  return `<div class="list">${records.slice().reverse().map(r=>`
    <div class="item ${r.done?"done":""}">
      <div class="item-main">
        <div class="item-title"><strong>${esc(r.title||"Untitled")}</strong></div>
        <div class="small">${esc(r.detail||r.category||r.date||"")}</div>
        ${r.amount!=null?`<div class="small">${money(r.amount)}</div>`:""}
        ${r.progress!=null?`<div class="progress"><div style="width:${Math.max(0,Math.min(100,+r.progress||0))}%"></div></div>`:""}
      </div>
      <div class="row">
        ${toggle?`<button class="btn" data-toggle="${key}" data-id="${r.id}">${r.done?"Undo":"Done"}</button>`:""}
        <button class="btn danger" data-delete="${key}" data-id="${r.id}">×</button>
      </div>
    </div>`).join("")}</div>`;
}

function stat(title,value,note="") {
  return card(`<div class="stat-label">${esc(title)}</div>
    <div class="stat">${esc(value)}</div>
    <div class="small">${esc(note)}</div>`);
}

function dashboard() {
  const minutes=db.time.filter(x=>x.date===todayKey())
    .reduce((s,x)=>s+(+x.minutes||0),0);
  const income=db.money.filter(x=>x.category==="Income")
    .reduce((s,x)=>s+(+x.amount||0),0);
  const expenses=db.money.filter(x=>x.category==="Expense")
    .reduce((s,x)=>s+(+x.amount||0),0);

  return `<div class="grid">
    ${stat("Open tasks",db.tasks.filter(x=>!x.done).length)}
    ${stat("Study sessions",db.study.length)}
    ${stat("Habits logged",db.habits.filter(x=>x.date===todayKey()).length,"Today")}
    ${stat("Tracked time",`${Math.floor(minutes/60)}h ${minutes%60}m`,"Today")}
  </div>
  <div class="two section">
    ${card(`${heading("Quick activity")}
      <form id="activityForm">
        ${field("What did you work on?","message","e.g. Practised mathematics")}
        <button class="btn primary">Log activity</button>
      </form>`)}
    ${card(`${heading("Financial snapshot")}
      <p>Income: <strong>${money(income)}</strong></p>
      <p>Expenses: <strong>${money(expenses)}</strong></p>
      <p>Balance: <strong>${money(income-expenses)}</strong></p>`)}
  </div>
  <div class="two section">
    ${card(`${heading("Tasks")}${recordList("tasks",true)}
      <button class="btn" data-page="tasks">Open tasks →</button>`)}
    ${card(`${heading("Goals")}${recordList("goals")}
      <button class="btn" data-page="goals">Open goals →</button>`)}
  </div>
  <div class="section">${card(`${heading("Recent activity")}
    ${db.activity.length?db.activity.slice(0,6).map(a=>
      `<div class="item"><div><strong>${esc(a.message)}</strong>
      <div class="small">${esc(new Date(a.date).toLocaleString())}</div>
      </div></div>`).join(""):empty()}`)}</div>`;
}

const configs={
  tasks:{title:"Tasks",key:"tasks",fields:()=>field("Task name","title","What needs doing?")+field("Notes","detail","Optional notes","text",false)+field("Due date","date","","date",false),toggle:true},
  study:{title:"Study tracker",key:"study",fields:()=>field("Subject / topic","title","Physics — Motion")+field("Minutes studied","minutes","60","number")+field("Notes","detail","What did you learn?","text",false)},
  habits:{title:"Habits",key:"habits",fields:()=>field("Habit","title","Read for 20 minutes")+field("Date","date",todayKey(),"date")},
  goals:{title:"Goals",key:"goals",fields:()=>field("Goal","title","Your goal")+field("Target date","date","","date",false)+field("Progress (%)","progress","0","number")+field("Notes","detail","Next milestone","text",false)},
  time:{title:"Time tracker",key:"time",fields:()=>field("Activity","title","Video editing")+field("Minutes","minutes","30","number")+field("Date","date",todayKey(),"date")},
  business:{title:"Business tracker",key:"business",fields:()=>field("Project / idea","title","Project name")+field("Next action","detail","Next step")+field("Date","date",todayKey(),"date",false)},
  money:{title:"Money tracker",key:"money",fields:()=>field("Description","title","Transaction")+selectField("Type","category",["Income","Expense"])+field("Amount (INR)","amount","0","number")+field("Date","date",todayKey(),"date")},
  health:{title:"Health tracker",key:"health",fields:()=>field("Activity / note","title","Walk")+field("Minutes","minutes","20","number")+field("Date","date",todayKey(),"date",false)},
  calendar:{title:"Calendar",key:"calendar",fields:()=>field("Event","title","Event name")+field("Date","date",todayKey(),"date")+field("Details","detail","Optional details","text",false)}
};

function genericPage(key) {
  const c=configs[key];
  return `<div class="two">
    ${formBox("Add to "+c.title,c.fields())}
    ${card(`${heading("Your records")}
      <div class="small">${db[key].length} item(s)</div>
      ${recordList(key,c.toggle)}`)}
  </div>`;
}

function analytics() {
  const studyMins=db.study.reduce((s,x)=>s+(+x.minutes||0),0);
  const trackedMins=db.time.reduce((s,x)=>s+(+x.minutes||0),0);
  return `<div class="grid">
    ${stat("Total records",Object.values(configs).reduce((s,c)=>s+db[c.key].length,0))}
    ${stat("Tasks completed",`${db.tasks.filter(x=>x.done).length}/${db.tasks.length}`)}
    ${stat("Study time",`${Math.floor(studyMins/60)}h ${studyMins%60}m`)}
    ${stat("Tracked time",`${Math.floor(trackedMins/60)}h ${trackedMins%60}m`)}
  </div>`;
}

function aiPage() {
  const tips=[];
  const open=db.tasks.filter(x=>!x.done).length;
  const minutes=db.study.reduce((s,x)=>s+(+x.minutes||0),0);
  tips.push(open?`You have ${open} open tasks. Choose one priority.`:"Your task list is clear. Add your next priority.");
  tips.push(minutes?`You have recorded ${minutes} study minutes.`:"Record your next study session.");
  if(!db.goals.length) tips.push("Create a goal with a target date.");
  return card(`${heading("APEX AI — Productivity review")}
    <p>This is a local, rule-based review, not a connected AI model.</p>
    ${tips.map((t,i)=>`<div class="item"><div>${i+1}. ${esc(t)}</div></div>`).join("")}
    <button class="btn primary" id="refreshAdvice">Refresh review</button>`);
}

function settingsPage() {
  return `<div class="two">
    ${card(`${heading("Backup your data")}
      <p>Export your records to a JSON file.</p>
      <button class="btn primary" id="exportBtn">Export backup</button>
      <p class="small">Restore a previous JSON backup:</p>
      <input type="file" id="importFile" accept=".json,application/json">
      <button class="btn" id="importBtn">Restore backup</button>`)}
    ${card(`${heading("Appearance")}
      <button class="btn" id="settingsTheme">Toggle theme</button>
      <hr>
      ${heading("Danger zone")}
      <button class="btn danger" id="clearBtn">Delete all data</button>`)}
  </div>`;
}

function render() {
  document.body.classList.toggle("light",db.theme==="light");
  document.getElementById("today").textContent=new Date().toLocaleDateString(undefined,{
    weekday:"long",year:"numeric",month:"long",day:"numeric"
  });

  document.getElementById("nav").innerHTML=pages.map(([key,icon,label])=>
    `<button data-page="${key}" class="${current===key?"active":""}">${icon} ${label}</button>`
  ).join("");

  const page=pages.find(p=>p[0]===current);
  document.getElementById("pageTitle").textContent=page?page[2]:"Dashboard";

  let html="";
  if(current==="home") html=dashboard();
  else if(configs[current]) html=genericPage(current);
  else if(current==="analytics") html=analytics();
  else if(current==="ai") html=aiPage();
  else if(current==="settings") html=settingsPage();

  document.getElementById("content").innerHTML=html;
}

function go(page) { current=page;render(); }

function addRecord(key,data) {
  db[key].push({id:id(),createdAt:new Date().toISOString(),...data});
  addActivity("Added "+(data.title||"record")+" to "+key);
  save();render();
}

document.addEventListener("click",e=>{
  const pageBtn=e.target.closest("[data-page]");
  if(pageBtn){go(pageBtn.dataset.page);return;}

  const del=e.target.closest("[data-delete]");
  if(del){
    const key=del.dataset.delete;
    db[key]=db[key].filter(x=>x.id!==del.dataset.id);
    addActivity("Deleted a record");save();render();return;
  }

  const toggle=e.target.closest("[data-toggle]");
  if(toggle){
    const item=db[toggle.dataset.toggle].find(x=>x.id===toggle.dataset.id);
    if(item){item.done=!item.done;save();render();}
    return;
  }

  if(e.target.id==="themeBtn"||e.target.id==="settingsTheme"){
    db.theme=db.theme==="light"?"dark":"light";save();render();return;
  }

  if(e.target.id==="quickAdd"){
    const choice=prompt("Type: task, study, habit, goal, time, business, money, health, calendar");
    if(choice&&configs[choice.trim().toLowerCase()]) go(choice.trim().toLowerCase());
    else if(choice) alert("Use one of the listed names.");
    return;
  }

  if(e.target.id==="exportBtn"){
    const blob=new Blob([JSON.stringify(db,null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a");
    a.href=url;a.download="apex-tracker-backup.json";a.click();
    URL.revokeObjectURL(url);return;
  }

  if(e.target.id==="importBtn"){
    document.getElementById("importFile").click();return;
  }

  if(e.target.id==="clearBtn"&&confirm("Delete all tracker data?")){
    const theme=db.theme;db=blank();db.theme=theme;save();go("home");
  }
});

document.addEventListener("submit",e=>{
  if(e.target.id==="activityForm"){
    e.preventDefault();
    const message=new FormData(e.target).get("message")?.toString().trim();
    if(message){addActivity(message);save();render();}
    return;
  }

  if(e.target.matches('[data-form="record"]')){
    e.preventDefault();
    const key=current;
    const data=Object.fromEntries(new FormData(e.target).entries());

    ["minutes","amount","progress"].forEach(k=>{
      if(data[k]!==undefined&&data[k]!=="") data[k]=Number(data[k]);
    });

    if(key==="habits"){data.done=true;data.date=data.date||todayKey();}
    if(data.progress!==undefined)data.progress=Math.max(0,Math.min(100,data.progress));
    if(data.minutes!==undefined)data.minutes=Math.max(0,data.minutes||0);
    if(data.amount!==undefined)data.amount=Math.max(0,data.amount||0);

    addRecord(key,data);
  }
});

document.addEventListener("change",async e=>{
  if(e.target.id!=="importFile"||!e.target.files?.[0])return;
  try{
    const parsed=JSON.parse(await e.target.files[0].text());
    const keys=["tasks","study","habits","goals","time","business","money","health","calendar","activity"];
    if(!parsed||typeof parsed!=="object"||!keys.every(k=>parsed[k]===undefined||Array.isArray(parsed[k])))throw Error();
    if(!confirm("Restore backup and replace current data?"))return;
    const next=blank();
    keys.forEach(k=>{if(Array.isArray(parsed[k]))next[k]=parsed[k];});
    next.theme=parsed.theme==="light"?"light":"dark";
    db=next;save();go("home");alert("Backup restored.");
  }catch{alert("Please choose a valid APEX Tracker JSON backup.");}
  finally{e.target.value="";}
});

render();
})();
