const SECTION_IDS = ["home", "about", "services", "contact"];

function getTargetSection(trigger) {
  return (
    trigger.dataset.section ||
    trigger.dataset.sectionLink ||
    trigger.dataset.sectionButton ||
    ""
  );
}

function initReveal() {
  document.querySelectorAll("section.active .reveal").forEach((element) => {
    const rect = element.getBoundingClientRect();
    if (rect.top < window.innerHeight - 60) {
      element.classList.add("visible");
    }
  });
}

function handleScroll() {
  document
    .getElementById("navbar")
    .classList.toggle("scrolled", window.scrollY > 20);
  initReveal();
}

function showSection(id, options = {}) {
  if (!SECTION_IDS.includes(id)) {
    return;
  }

  const { updateHash = true, smoothScroll = true } = options;

  document.querySelectorAll("section").forEach((section) => {
    const isActive = section.id === id;
    section.classList.toggle("active", isActive);

    if (!isActive) {
      section.querySelectorAll(".reveal").forEach((element) => {
        element.classList.remove("visible");
      });
    }
  });

  document.querySelectorAll(".nav-link").forEach((link) => {
    const isActive = link.dataset.section === id;
    link.classList.toggle("active", isActive);
    link.setAttribute("aria-current", isActive ? "page" : "false");
  });

  if (updateHash) {
    history.replaceState(null, "", `#${id}`);
  }

  if (smoothScroll) {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    window.scrollTo(0, 0);
  }

  window.setTimeout(initReveal, 100);
}

function handleSectionTrigger(event) {
  const trigger = event.target.closest(
    "[data-section], [data-section-link], [data-section-button]",
  );
  if (!trigger) {
    return;
  }

  const targetSection = getTargetSection(trigger);
  if (!SECTION_IDS.includes(targetSection)) {
    return;
  }

  event.preventDefault();
  showSection(targetSection);
}

function handleHashChange() {
  const id = window.location.hash.slice(1);
  if (SECTION_IDS.includes(id)) {
    showSection(id, { updateHash: false, smoothScroll: false });
  }
}

function handleFormSubmit(event) {
  event.preventDefault();

  const name = document.getElementById("fname").value.trim();
  const email = document.getElementById("email").value.trim();
  if (!name || !email) {
    window.alert("Please fill in your name and email address.");
    return;
  }

  const form = event.currentTarget;
  const successMessage = document.getElementById("successMsg");
  const submitButton = form.querySelector(".form-submit");

  successMessage.style.display = "block";
  submitButton.disabled = true;
  submitButton.textContent = "Enquiry Sent";
  form.reset();
}

function enableLiveReload() {
  const isDevServer =
    ["localhost", "127.0.0.1"].includes(window.location.hostname) &&
    window.location.port === "3000";
  if (!isDevServer || typeof window.EventSource === "undefined") {
    return;
  }

  const source = new window.EventSource("/__livereload");
  source.onmessage = (event) => {
    if (event.data === "reload") {
      window.location.reload();
    }
  };
}

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", handleSectionTrigger);
  window.addEventListener("scroll", handleScroll);
  window.addEventListener("hashchange", handleHashChange);

  document
    .getElementById("contactForm")
    .addEventListener("submit", handleFormSubmit);

  const initialSection = SECTION_IDS.includes(window.location.hash.slice(1))
    ? window.location.hash.slice(1)
    : "home";

  showSection(initialSection, { updateHash: false, smoothScroll: false });
  handleScroll();
  enableLiveReload();
});
