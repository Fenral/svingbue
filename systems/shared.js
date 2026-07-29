const goalData = {
  "direction-control": {
    title: "Start with Start Line",
    reason: "See how face angle and club path decide where every shot begins.",
    ids: ["start-line","shape","shot-pattern","wind"]
  },
  "strike-contact": {
    title: "Start with Up or Down at Impact",
    reason: "Build a clear picture of attack angle before connecting it to low point and contact height.",
    ids: ["attack-at-impact","low-point","strike-depth"]
  },
  "launch-flight": {
    title: "Start with Delivered Loft & Launch",
    reason: "Connect delivered loft to launch, spin and the shape of the full flight.",
    ids: ["attack-at-impact","delivered-loft-launch","backspin","flight-height-descent"]
  },
  "distance": {
    title: "Start with Speed Transfer",
    reason: "Follow energy from club speed to ball speed, carry and real playing conditions.",
    ids: ["speed-transfer","carry","air-density","wind"]
  }
};

const applyGoal = id => {
  const goal = goalData[id] || goalData["direction-control"];
  document.querySelectorAll("[data-goal]").forEach(button => {
    const selected = button.dataset.goal === id;
    button.setAttribute("aria-checked", String(selected));
    button.classList.toggle("is-selected", selected);
  });
  document.querySelectorAll("[data-recommendation-title]").forEach(el => { el.textContent = goal.title; });
  document.querySelectorAll("[data-recommendation-reason]").forEach(el => { el.textContent = goal.reason; });
  document.querySelectorAll("[data-lesson-id]").forEach(el => {
    el.classList.toggle("is-relevant", goal.ids.includes(el.dataset.lessonId));
  });
  try { localStorage.setItem("flightglass-academy-goal", id); } catch {}
};

document.querySelectorAll("[data-goal]").forEach(button => {
  button.addEventListener("click", () => applyGoal(button.dataset.goal));
  button.addEventListener("keydown", event => {
    if (!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key)) return;
    event.preventDefault();
    const buttons = [...document.querySelectorAll("[data-goal]")];
    const current = buttons.indexOf(button);
    const next = buttons[(current + (["ArrowRight","ArrowDown"].includes(event.key) ? 1 : -1) + buttons.length) % buttons.length];
    next.focus();
    next.click();
  });
});

const progressDialog = document.querySelector("#progress-dialog");
document.querySelectorAll("[data-open-progress]").forEach(button => {
  button.addEventListener("click", () => progressDialog?.showModal());
});
document.querySelectorAll("[data-close-progress]").forEach(button => {
  button.addEventListener("click", () => progressDialog?.close());
});
progressDialog?.addEventListener("click", event => {
  if (event.target === progressDialog) progressDialog.close();
});

const query = new URLSearchParams(location.search);
const requestedState = query.get("state");
if (["loading","empty","error"].includes(requestedState)) document.body.dataset.state = requestedState;
if (requestedState === "empty") {
  document.querySelectorAll("[data-progress-copy]").forEach(el => { el.textContent = "Your first evidence appears after Start Line."; });
  document.querySelectorAll(".progress-line > span").forEach(el => { el.style.width = "0"; });
}

let savedGoal = "direction-control";
try { savedGoal = localStorage.getItem("flightglass-academy-goal") || savedGoal; } catch {}
applyGoal(savedGoal);

document.querySelectorAll("[data-experience-action]").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    const original = link.textContent;
    link.textContent = "Module ready";
    link.setAttribute("aria-live","polite");
    setTimeout(() => { link.textContent = original; }, 1300);
  });
});

document.fonts.ready.then(async () => {
  try {
    const { prepare, layout } = await import("./pretext.js");
    const prepared = new Map();
    document.querySelectorAll("[data-pretext]").forEach(el => {
      prepared.set(el, prepare(el.textContent, getComputedStyle(el).font));
    });
    const relayout = () => {
      prepared.forEach((handle, el) => {
        const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
        const result = layout(handle, el.clientWidth, Number.isFinite(lineHeight) ? lineHeight : 20);
        if (result?.height) el.style.minHeight = `${Math.ceil(result.height)}px`;
      });
    };
    new ResizeObserver(relayout).observe(document.body);
    relayout();
  } catch {}
});
