const STORAGE_KEY = "nearwellLeads";
const POPUP_SESSION_KEY = "nearwell:lead-popup:session:v2";
let popupAutoTimer;
let popupCloseTimer;
let popupPreviousFocus;
let popupBackground = [];
let popupSeenThisSession = false;

const audienceContent = {
  commuters: {
    label: "Morning rush audience",
    headline: "Order before the train pulls in.",
    description:
      "Target early commuters with quick pickup language, pre-9 AM bundles, and a CTA centered on saving time.",
    offer: "Coffee + croissant ready in 8 minutes",
    cta: "Reserve pickup",
    kicker: "Commuter-ready in Greenwich",
    title: "The fastest better-coffee stop before the platform.",
    copy: "Warm breakfast, quick pickup, and zero wasted minutes during the morning rush.",
    insight: "AI insight: focus ad spend within a 2-mile morning commuter radius near the station."
  },
  professionals: {
    label: "Midday professional audience",
    headline: "Lunch worth stepping away for.",
    description:
      "Speak to professionals who want a short, polished break with pre-built bundles and easy order flows.",
    offer: "Cold brew + grain bowl lunch bundle",
    cta: "View the lunch offer",
    kicker: "Downtown Tarrytown lunch crowd",
    title: "A sharper midday stop for professionals on a clock.",
    copy: "Promote speed, quality, and a comfortable pause that still fits inside the workday.",
    insight: "AI insight: emphasize 11:30 AM to 1:30 PM messaging within walkable downtown blocks."
  },
  families: {
    label: "Weekend family audience",
    headline: "Turn one stop into an easy weekend tradition.",
    description:
      "Use family-friendly language, bundled pastry offers, and soft weekend imagery to increase group visits.",
    offer: "Family pastry box + two drinks for $18",
    cta: "See the weekend menu",
    kicker: "Family weekend traffic",
    title: "Make the neighborhood stop feel simple, warm, and worth repeating.",
    copy: "Lead with comfort, easy seating, and offers that make family visits feel effortless.",
    insight: "AI insight: shift creative on Thursday night to capture Friday-through-Sunday planning."
  }
};

const businessTypes = [
  "Coffee shop",
  "Restaurant",
  "Fitness studio",
  "Retail boutique",
  "Dental practice",
  "Medical office",
  "Home services business",
  "Salon",
  "Real estate office",
  "Law firm",
  "Day spa",
  "Bakery"
];

const demographics = [
  "Commuters",
  "Young professionals",
  "Families",
  "Empty nesters",
  "Weekend visitors",
  "Students",
  "Luxury shoppers",
  "Homeowners",
  "Renters",
  "Health-conscious buyers",
  "Remote workers",
  "Parents",
  "Tourists",
  "High-intent local searchers"
];

function $(selector) {
  return document.querySelector(selector);
}

function $all(selector) {
  return Array.from(document.querySelectorAll(selector));
}

function initializeMobileMenu() {
  const toggle = $(".menu-toggle");
  const mobileNav = $("#mobileNav");

  if (!toggle || !mobileNav) {
    return;
  }

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!isOpen));
    mobileNav.hidden = isOpen;
  });
}

function initializeAudienceTabs() {
  const tabs = $all(".audience-tab");
  if (!tabs.length) {
    return;
  }

  const nodes = {
    label: $("#audienceLabel"),
    headline: $("#audienceHeadline"),
    description: $("#audienceDescription"),
    offer: $("#audienceOffer"),
    cta: $("#audienceCta"),
    kicker: $("#previewKicker"),
    title: $("#previewTitle"),
    copy: $("#previewCopy"),
    insight: $("#insightNote")
  };

  function updateAudience(audience) {
    const data = audienceContent[audience];
    if (!data) {
      return;
    }

    nodes.label.textContent = data.label;
    nodes.headline.textContent = data.headline;
    nodes.description.textContent = data.description;
    nodes.offer.textContent = data.offer;
    nodes.cta.textContent = data.cta;
    nodes.kicker.textContent = data.kicker;
    nodes.title.textContent = data.title;
    nodes.copy.textContent = data.copy;
    nodes.insight.textContent = data.insight;

    tabs.forEach((tab) => {
      tab.classList.toggle("is-active", tab.dataset.audience === audience);
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => updateAudience(tab.dataset.audience));
  });
}

function initializeGeoMap() {
  const slider = $("#radiusSlider");
  const radiusValue = $("#radiusValue");
  const radiusMirror = $("#radiusMirror");
  if (!slider || !radiusValue) return;
  function updateRadius() {
    radiusValue.textContent = `${slider.value} miles`;
    if (radiusMirror) radiusMirror.value = slider.value;
  }
  slider.addEventListener("input", updateRadius);
  updateRadius();
}

function initializeDemographicChips() {
  const chipRoot = $("#demographicChips");
  const hiddenInput = $("#demographicsInput");

  if (!chipRoot || !hiddenInput) {
    return;
  }

  chipRoot.innerHTML = demographics.map((item) => {
    return `<button class="chip" type="button" data-value="${item}">${item}</button>`;
  }).join("");

  chipRoot.addEventListener("click", (event) => {
    const chip = event.target.closest(".chip");
    if (!chip) {
      return;
    }

    chip.classList.toggle("is-selected");
    const selected = $all(".chip.is-selected").map((node) => node.dataset.value);
    hiddenInput.value = selected.join(", ");
  });
}

function initializeBusinessSuggestions() {
  const input = $("#businessTypeInput");
  const suggestions = $("#businessSuggestions");

  if (!input || !suggestions) {
    return;
  }

  function renderSuggestions(value) {
    const query = value.trim().toLowerCase();
    if (!query) {
      suggestions.hidden = true;
      suggestions.innerHTML = "";
      return;
    }

    const matches = businessTypes.filter((item) => item.toLowerCase().includes(query)).slice(0, 5);
    if (!matches.length) {
      suggestions.hidden = true;
      suggestions.innerHTML = "";
      return;
    }

    suggestions.hidden = false;
    suggestions.innerHTML = matches.map((item) => {
      return `<button class="suggestion-button" type="button" data-value="${item}">${item}</button>`;
    }).join("");
  }

  input.addEventListener("input", () => renderSuggestions(input.value));

  suggestions.addEventListener("click", (event) => {
    const button = event.target.closest(".suggestion-button");
    if (!button) {
      return;
    }

    input.value = button.dataset.value;
    suggestions.hidden = true;
    suggestions.innerHTML = "";
  });

  document.addEventListener("click", (event) => {
    if (!suggestions.contains(event.target) && event.target !== input) {
      suggestions.hidden = true;
    }
  });
}

function persistLead(formData, source) {
  const existing = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  if (!Array.isArray(existing)) {
    throw new Error("Saved project briefs could not be read.");
  }
  existing.push({
    source,
    submittedAt: new Date().toISOString(),
    ...formData
  });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(existing));
}

function readForm(form) {
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}

function attachFormHandlers() {
  $all(".capture-form").forEach((form) => {
    const status = form.querySelector(".form-status");

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const formData = readForm(form);
      const source = form.dataset.formKind || "unknown";

      try {
        persistLead(formData, source);
      } catch (error) {
        if (status) {
          status.textContent = "Your brief could not be saved on this device. Please copy your answers before leaving, or allow browser storage and try again.";
        }
        return;
      }

      form.reset();

      if ($("#demographicsInput")) {
        $("#demographicsInput").value = "";
      }

      $all(".chip.is-selected").forEach((chip) => chip.classList.remove("is-selected"));

      if (status) {
        status.textContent = "Your brief was saved on this device. It has not been sent to NearWell.";
      }

      if (source === "popup") {
        window.clearTimeout(popupCloseTimer);
        popupCloseTimer = window.setTimeout(closeModal, 2400);
      }
    });
  });
}

function rememberPopupSession() {
  popupSeenThisSession = true;
  try {
    sessionStorage.setItem(POPUP_SESSION_KEY, "true");
  } catch (error) {
    // Closing and manual opening still work when browser storage is unavailable.
  }
}

function openModal(launcher) {
  const modal = $("#leadModal");
  if (!modal) {
    return;
  }

  window.clearTimeout(popupAutoTimer);
  window.clearTimeout(popupCloseTimer);
  rememberPopupSession();
  if (modal.classList.contains("is-visible")) {
    return;
  }

  popupPreviousFocus = launcher instanceof HTMLElement ? launcher : document.activeElement;
  popupBackground = Array.from(document.body.children)
    .filter((element) => element !== modal && !element.contains(modal))
    .map((element) => ({ element, wasInert: element.inert }));
  popupBackground.forEach(({ element }) => { element.inert = true; });
  modal.classList.add("is-visible");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  modal.querySelector(".lead-modal__content")?.scrollTo(0, 0);
  modal.querySelector(".modal-close")?.focus({ preventScroll: true });
}

function closeModal() {
  const modal = $("#leadModal");
  if (!modal) {
    return;
  }

  window.clearTimeout(popupAutoTimer);
  window.clearTimeout(popupCloseTimer);
  rememberPopupSession();
  if (!modal.classList.contains("is-visible")) {
    return;
  }

  popupBackground.forEach(({ element, wasInert }) => { element.inert = wasInert; });
  popupBackground = [];
  modal.classList.remove("is-visible");
  document.body.classList.remove("modal-open");
  if (popupPreviousFocus?.isConnected && typeof popupPreviousFocus.focus === "function") {
    popupPreviousFocus.focus({ preventScroll: true });
  }
  if (modal.contains(document.activeElement)) {
    document.activeElement.blur();
  }
  modal.setAttribute("aria-hidden", "true");
  popupPreviousFocus = null;
}

function initializePopup() {
  const modal = $("#leadModal");
  if (!modal) {
    return;
  }

  const panel = modal.querySelector(".lead-modal__panel");
  const closeButton = modal.querySelector(".modal-close");
  const launchers = $all(".open-popup");
  if (!panel || !closeButton) {
    return;
  }

  // Keep the close control stationary while long questionnaires scroll below it.
  if (!panel.querySelector(".lead-modal__content")) {
    const content = document.createElement("div");
    content.className = "lead-modal__content";
    Array.from(panel.childNodes).forEach((node) => {
      if (node !== closeButton) content.append(node);
    });
    panel.append(content);
  }
  panel.tabIndex = -1;

  closeButton.addEventListener("click", closeModal);
  modal.addEventListener("click", (event) => {
    if (!panel.contains(event.target)) closeModal();
  });

  function getFocusableElements() {
    return Array.from(panel.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'))
      .filter((element) => element.getClientRects().length > 0);
  }

  document.addEventListener("keydown", (event) => {
    if (!modal.classList.contains("is-visible")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeModal();
      return;
    }
    if (event.key !== "Tab") return;
    const focusable = getFocusableElements();
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first) {
      event.preventDefault();
      panel.focus();
    } else if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
      event.preventDefault();
      first.focus();
    }
  });

  document.addEventListener("focusin", (event) => {
    if (modal.classList.contains("is-visible") && !panel.contains(event.target)) {
      closeButton.focus({ preventScroll: true });
    }
  });

  launchers.forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      openModal(button);
    });
  });

  try {
    popupSeenThisSession = sessionStorage.getItem(POPUP_SESSION_KEY) === "true";
  } catch (error) {
    // A restricted browser can still show the questionnaire once on this page.
  }

  if (document.body.dataset.autoPopup === "true" && !popupSeenThisSession) {
    popupAutoTimer = window.setTimeout(() => openModal(), 5000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializeMobileMenu();
  initializeAudienceTabs();
  initializeGeoMap();
  initializeDemographicChips();
  initializeBusinessSuggestions();
  attachFormHandlers();
  initializePopup();
});
