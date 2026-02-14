const qs = (s, el=document) => el.querySelector(s);
const qsa = (s, el=document) => [...el.querySelectorAll(s)];

const screens = qsa(".screen");
const bar = qs("#bar");
const stepPill = qs("#stepPill");
const bgm = qs("#bgm");

let step = 0;
const lastStep = 6;

let selectedDate = "";
let selectedPlace = "";
let finalMessage = "";
let skipAttempts = 0;

/* ================= TRACKING (SAFE) ================= */
function track(eventName, data = {}) {
  if (window.firebaseTrack) {
    window.firebaseTrack(eventName, data);
  }
}

/* ================= MUSIC ================= */

async function startMusic(){
  try{
    bgm.volume = 0.85;
    await bgm.play();
  }catch(e){
    // Mobile browsers require interaction — Start button handles that
  }
}

function stopMusic(){
  if (!bgm) return;
  bgm.pause();
  bgm.currentTime = 0;
}

/* ================= SCREEN CONTROL ================= */

function setStep(n){
  step = Math.max(0, Math.min(lastStep, n));

  // required for background switching
  document.body.dataset.step = String(step);

  screens.forEach(sc => {
    sc.classList.remove("active");
    sc.style.display = "none";
  });

  const current = screens.find(sc => Number(sc.dataset.step) === step);
  if (current){
    current.classList.add("active");
    current.style.display = "block";
  }

  if (bar){
    bar.style.width = ((step / lastStep) * 100) + "%";
  }

  if (stepPill){
    const shown = Math.min(step + 1, 6);
    stepPill.textContent = `LOVE MATCH SYSTEM v2.14 · Step ${shown}/6`;
  }
}

/* ================= SCAN ANIMATION ================= */

const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function runScan(){
  const c1 = qs("#c1"), c2 = qs("#c2"), c3 = qs("#c3"), c4 = qs("#c4");
  const scoreBox = qs("#scoreBox");

  if (!c1) return;

  c1.textContent="…"; c2.textContent="…";
  c3.textContent="…"; c4.textContent="…";
  scoreBox.hidden = true;

  await delay(500); c1.textContent="✔";
  await delay(400); c2.textContent="✔";
  await delay(400); c3.textContent="✔";
  await delay(400); c4.textContent="✔";

  await delay(350);
  scoreBox.hidden = false;
}

/* ================= NAVIGATION ================= */

function wireNav(){
  qsa("[data-next]").forEach(btn =>
    btn.addEventListener("click", () => setStep(step+1))
  );

  qsa("[data-back]").forEach(btn =>
    btn.addEventListener("click", () => setStep(step-1))
  );
}

/* ================= NO BUTTON (ANDROID SAFE) ================= */

function noButtonPlayful(){
  const noBtn = qs("#noBtn");
  const choiceArea = qs("#choiceArea");
  if (!noBtn || !choiceArea) return;

  function targetPos(){
    const area = choiceArea.getBoundingClientRect();
    const btn = noBtn.getBoundingClientRect();
    const pad = 12;

    const maxX = Math.max(0, area.width - btn.width - pad);
    const maxY = Math.max(0, area.height - btn.height - pad);

    return {
      x: pad + Math.random()*maxX,
      y: pad + Math.random()*maxY
    };
  }

  function moveAway(){
    const {x, y} = targetPos();
    noBtn.style.transition = "left 160ms ease, top 160ms ease";
    noBtn.style.left = `${x}px`;
    noBtn.style.top  = `${y}px`;
    track("no_button_evaded", { step_number: step });     /*tracking line added*/  
  }

  // Desktop
  noBtn.addEventListener("mouseenter", moveAway);

  // Android / iOS
  noBtn.addEventListener("pointerdown", (e)=>{
    e.preventDefault();
    e.stopPropagation();
    moveAway();
  });

  noBtn.addEventListener("touchstart", (e)=>{
    e.preventDefault();
    e.stopPropagation();
    moveAway();
  }, {passive:false});

  // Proximity tease
  choiceArea.addEventListener("mousemove", (e)=>{
    const r = noBtn.getBoundingClientRect();
    const cx = r.left + r.width/2;
    const cy = r.top + r.height/2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    if (Math.sqrt(dx*dx + dy*dy) < 120){
      moveAway();
    }
  });
}

/* ================= PLANNER ================= */

function formatPlan(dateStr, timeStr, placeStr){
  const parts = [];
  if (dateStr) parts.push(`Date: ${dateStr}`);
  if (timeStr) parts.push(`Time: ${timeStr}`);
  if (placeStr) parts.push(`Place: ${placeStr}`);
  return parts.join(" · ");
}

function buildFinalMessage(planLine){
  return planLine
    ? `Anjali 💗\nWe are officially booked! 💘\n${planLine}\n\nReply "Confirmed Puku ❤️" to seal it.`
    : `Anjali 💗\nWe are officially booked! 💘\n\nReply "Confirmed Puku ❤️" to seal it.`;
}

function showConfirmation(planLine){
  const box = qs("#confirmBox");
  const text = qs("#confirmText");
  if (!box) return;

  finalMessage = buildFinalMessage(planLine);
  box.hidden = false;
  text.textContent = finalMessage;
}

/* ================= COPY FUNCTION ================= */

async function copyToClipboard(text){
  try{
    if (navigator.clipboard && window.isSecureContext){
      await navigator.clipboard.writeText(text);
      return true;
    }
  }catch(e){}

  try{
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
    return true;
  }catch(e){
    return false;
  }
}

/* ================= RESET ================= */

function resetAll(){
  selectedDate = "";
  selectedPlace = "";
  finalMessage = "";
  skipAttempts = 0;

  qsa(".dateBtn").forEach(b => b.classList.remove("selected"));
  qsa(".placeBtn").forEach(b => b.classList.remove("selected"));

  const timePick = qs("#timePick");
  if (timePick) timePick.value = "";

  const confirmBox = qs("#confirmBox");
  if (confirmBox) confirmBox.hidden = true;
}

/* ================= MAIN ================= */

function main(){

  wireNav();
  noButtonPlayful();
  setStep(0);

  qs("#startBtn")?.addEventListener("click", async ()=>{
    track("start_scan_clicked");            /*tracking line added*/
    await startMusic();
    setStep(1);
    runScan();
  });

  qs("#toQBtn")?.addEventListener("click", ()=>{
        track("scan_complete_proceed");            /*tracking line added*/
        setStep(2)
});

  qs("#yesBtn")?.addEventListener("click", ()=>{
    track("valentine_yes_clicked");
    setStep(5);
  });

  // Date selection
  qsa(".dateBtn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      qsa(".dateBtn").forEach(b=>b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedDate = btn.dataset.date || "";
      track("date_selected", { date: selectedDate });       /*tracking line added*/
    });
  });

  // Place selection
  qsa(".placeBtn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      qsa(".placeBtn").forEach(b=>b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedPlace = btn.dataset.place || "";
      track("place_selected", { place: selectedPlace });        /*tracking line added*/
    });
  });

  /* ========= PLAYFUL SKIP ========= */

  const skipMessages = [
    "Hehe 😌 You really want to skip this? I’ll be a little sad 🥺",
    "Okay okay… last chance 💗 Are you *sure* you want to skip?",
    "Alright 😤 skipping approved… but you owe me an extra hug."
  ];

  qs("#skipPlan")?.addEventListener("click", ()=>{
    skipAttempts++;
    track("skip_attempt", { attempt: skipAttempts });           /*tracking line added*/

    if (skipAttempts < 3){
      alert(skipMessages[skipAttempts - 1]);
      return;
    }

    track("skip_confirmed");                                    /*tracking line added*/
    alert(skipMessages[2]);
    setStep(6);
    showConfirmation("");
  });

  qs("#confirmPlan")?.addEventListener("click", ()=>{
    const timeVal = qs("#timePick")?.value || "";

    if (!selectedDate) return alert("Pick one of the dates first 😌");
    if (!selectedPlace) return alert("Pick the vibe first 😌");

    track("date_confirmed", { date: selectedDate, place: selectedPlace, time: timeVal });       /*tracking line added*/

    setStep(6);
    showConfirmation(formatPlan(selectedDate, timeVal, selectedPlace));
  });

  qs("#copyMsg")?.addEventListener("click", async ()=>{
    const ok = await copyToClipboard(finalMessage);
    const btn = qs("#copyMsg");
    track("message_copied", { success: !!ok });                 /*tracking line added*/

    if (btn){
      btn.textContent = ok ? "Copied ✅" : "Copy failed ❌";
      setTimeout(()=> btn.textContent="Copy message 📋", 1500);
    }
  });

  qs("#replayBtn")?.addEventListener("click", ()=>{
    track("replay_clicked");                                    /*tracking line added*/
    stopMusic();

    const noBtn = qs("#noBtn");
    if (noBtn){
      noBtn.style.left = "60%";
      noBtn.style.top = "62%";
    }

    resetAll();
    setStep(0);
  });
}

document.addEventListener("DOMContentLoaded", main);
