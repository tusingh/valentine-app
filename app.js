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
  if (window.firebaseTrack) window.firebaseTrack(eventName, data);
}

/* ✅ ADDED: showModal() helper (replaces browser alert()) */
function showModal(message){
  const modal = document.getElementById("modal");
  const text = document.getElementById("modalText");
  const ok = document.getElementById("modalOk");
  if (!modal || !text || !ok) return;

  text.textContent = message;
  modal.classList.remove("hidden");

  const close = () => {
    modal.classList.add("hidden");
    ok.removeEventListener("click", close);
  };
  ok.addEventListener("click", close);
}
/* ✅ END ADDED */

/* ================= MUSIC ================= */
async function startMusic(){
  try{
    bgm.volume = 0.85;
    await bgm.play();
  }catch(e){}
}
function stopMusic(){
  if (!bgm) return;
  bgm.pause();
  bgm.currentTime = 0;
}

/* ================= SCREEN CONTROL ================= */
function setStep(n){
  step = Math.max(0, Math.min(lastStep, n));
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

  if (bar) bar.style.width = ((step / lastStep) * 100) + "%";

  if (stepPill){
    const shown = Math.min(step + 1, 6);
    stepPill.textContent = `LOVE MATCH SYSTEM v2.14 · Step ${shown}/6`;
  }

  track("step_view", { step_number: step });
}

/* ================= SCAN ANIMATION ================= */
const delay = (ms) => new Promise(r => setTimeout(r, ms));

async function runScan(){
  const c1 = qs("#c1"), c2 = qs("#c2"), c3 = qs("#c3"), c4 = qs("#c4");
  const scoreBox = qs("#scoreBox");
  if (!c1 || !scoreBox) return;

  c1.textContent="…"; c2.textContent="…"; c3.textContent="…"; c4.textContent="…";
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

    return { x: pad + Math.random()*maxX, y: pad + Math.random()*maxY };
  }

  function moveAway(){
    const {x, y} = targetPos();
    noBtn.style.transition = "left 160ms ease, top 160ms ease";
    noBtn.style.left = `${x}px`;
    noBtn.style.top  = `${y}px`;
    track("no_button_evaded", { step_number: step });
  }

  noBtn.addEventListener("mouseenter", moveAway);

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

  choiceArea.addEventListener("mousemove", (e)=>{
    const r = noBtn.getBoundingClientRect();
    const cx = r.left + r.width/2;
    const cy = r.top + r.height/2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    if (Math.sqrt(dx*dx + dy*dy) < 120) moveAway();
  });
}

/* ================= PLANNER + MESSAGE ================= */
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
  if (!box || !text) return;

  finalMessage = buildFinalMessage(planLine);
  box.hidden = false;
  text.textContent = finalMessage;
}

/* ================= COPY ================= */
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

  const confirmText = qs("#confirmText");
  if (confirmText) confirmText.textContent = "";
}

/* ================= MAIN ================= */
function main(){
  wireNav();
  noButtonPlayful();
  setStep(0);

  qs("#startBtn")?.addEventListener("click", async ()=>{
    track("start_scan_clicked");
    await startMusic();
    setStep(1);
    runScan();
  });

  qs("#toQBtn")?.addEventListener("click", ()=>{
    track("scan_complete_proceed");
    setStep(2);
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
      track("date_selected", { date: selectedDate });
    });
  });

  // Place selection
  qsa(".placeBtn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      qsa(".placeBtn").forEach(b=>b.classList.remove("selected"));
      btn.classList.add("selected");
      selectedPlace = btn.dataset.place || "";
      track("place_selected", { place: selectedPlace });
    });
  });

  /* ========= PLAYFUL SKIP (2 blocked, 3rd allowed) ========= */
  const skipMessages = [
    "Hehe 😌 You really want to skip this? I’ll be a little sad 🥺",
    "Okay okay… last chance 💗 Are you *sure* you want to skip?",
    "Alright 😤 skipping approved… but you owe me an extra hug."
  ];

  qs("#skipPlan")?.addEventListener("click", ()=>{
    skipAttempts++;
    track("skip_attempt", { attempt: skipAttempts });

    // ✅ CHANGED: alert -> showModal
    if (skipAttempts < 3){
      showModal(skipMessages[skipAttempts - 1]);
      return;
    }

    track("skip_confirmed");
    showModal(skipMessages[2]);
    setStep(6);
    showConfirmation("");
  });

  qs("#confirmPlan")?.addEventListener("click", ()=>{
    const timeVal = qs("#timePick")?.value || "";

    // ✅ CHANGED: alert -> showModal
    if (!selectedDate) return showModal("Pick one of the dates first 😌");
    if (!selectedPlace) return showModal("Pick the vibe first 😌");

    track("date_confirmed", { date: selectedDate, place: selectedPlace, time: timeVal });

    setStep(6);
    showConfirmation(formatPlan(selectedDate, timeVal, selectedPlace));
  });

  qs("#copyMsg")?.addEventListener("click", async ()=>{
    const ok = await copyToClipboard(finalMessage);
    track("message_copied", { success: !!ok });

    const btn = qs("#copyMsg");
    if (btn){
      btn.textContent = ok ? "Copied ✅" : "Copy failed ❌";
      setTimeout(()=> btn.textContent="Copy message 📋", 1500);
    }
  });

  qs("#replayBtn")?.addEventListener("click", ()=>{
    track("replay_clicked");
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
