let popupAutoTimer;
let popupCloseTimer;
let popupPreviousFocus;
let popupBackground = [];

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

function readForm(form) {
  return Object.fromEntries(new FormData(form).entries());
}

function createQuestionnaireReview(form, answers, recipient) {
  const labels = {
    name: "Name", email: "Email", company: "Company", businessType: "Business type",
    phone: "Phone", market: "Primary market", demographics: "Target customers",
    radius: "Campaign radius (miles)", message: "Business priorities"
  };
  const fields = Object.entries(labels).filter(([key]) => String(answers[key] || "").trim());
  const subject = `NearWell questionnaire — ${answers.company || answers.name || "New inquiry"}`.replace(/[\r\n]/g, " ").slice(0, 150);
  const body = ["Hello Daniel,", "", "I would like to discuss my business with NearWell.", "",
    ...fields.map(([key, label]) => `${label}: ${answers[key]}`), "", "Thank you,", answers.name || ""
  ].join("\r\n");

  const review = document.createElement("section");
  review.className = "questionnaire-review";
  review.tabIndex = -1;
  review.setAttribute("aria-label", "Review and email your questionnaire");

  const heading = document.createElement("h3");
  heading.textContent = "Your questionnaire is ready to email.";
  const notice = document.createElement("p");
  notice.className = "questionnaire-volume";
  notice.textContent = "Volume is high at the moment. We will reach out as soon as possible!";
  const instruction = document.createElement("p");
  instruction.textContent = "Send your questionnaire using the button below so Daniel can respond. Your email app will open with your answers ready; please press Send there to deliver your message.";
  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Review your answers";
  const list = document.createElement("dl");
  fields.forEach(([key, label]) => {
    const term = document.createElement("dt");
    term.textContent = label;
    const value = document.createElement("dd");
    value.textContent = answers[key];
    list.append(term, value);
  });
  details.append(summary, list);
  const actions = document.createElement("div");
  actions.className = "questionnaire-review-actions";
  const email = document.createElement("a");
  email.className = "button questionnaire-email";
  email.href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  email.textContent = "Email my questionnaire ↗";
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "questionnaire-edit";
  edit.textContent = "Edit answers";
  edit.addEventListener("click", () => {
    review.remove();
    form.hidden = false;
    form.querySelector('input:not([type="hidden"]), textarea')?.focus();
  });
  actions.append(email, edit);
  const fallback = document.createElement("p");
  fallback.className = "questionnaire-email-help";
  fallback.append("No email app connected? Copy the address and your answers into your email service: ");
  const address = document.createElement("a");
  address.href = `mailto:${recipient}`;
  address.textContent = recipient;
  fallback.append(address);
  review.append(heading, notice, instruction, details, actions, fallback);
  return review;
}

function attachFormHandlers() {
  $all(".capture-form").forEach((form) => {
    const status = form.querySelector(".form-status");
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.querySelectorAll('input[type="text"], input[type="email"], textarea').forEach(field => {
        field.value = field.value.trim();
      });
      if (!form.reportValidity()) return;
      const recipient = document.body.dataset.inquiryEmail;
      if (!recipient) {
        if (status) status.textContent = "The email destination is being configured. Please keep your answers here for now.";
        return;
      }
      const review = createQuestionnaireReview(form, readForm(form), recipient);
      form.hidden = true;
      form.after(review);
      review.focus({ preventScroll: true });
      review.scrollIntoView({ behavior: "instant", block: "nearest" });
    });
  });
}

function openModal(launcher) {
  const modal = $("#leadModal");
  if (!modal) {
    return;
  }

  window.clearTimeout(popupAutoTimer);
  window.clearTimeout(popupCloseTimer);
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

  // Each page load gets one automatic invitation; dismissal cancels it for this visit.
  if (document.body.dataset.autoPopup === "true") {
    popupAutoTimer = window.setTimeout(() => openModal(), 5000);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initializeMobileMenu();
  initializeAudienceTabs();
  initializeGeoMap();
  initializeDemographicChips();
  attachFormHandlers();
  initializePopup();
});
