// Käyntikortit onboarding on the course list (Figma Onboarding 1–4).
// - Opens automatically once per browser session: after the user saves,
//   skips or closes it, it stays closed until the browser is restarted.
// - Intro step first ("Täytä tietosi" / "Jatka suoraan palveluun"),
//   then three questions.
// - "Jatka" stays disabled until the question has an answer.
// - The back arrow returns to the previous step and keeps the answers.
// - Closing (X, Esc, browser back) needs no confirmation and clears the form.
// - "Tallenna tiedot" closes the modal and shows a toast.
// Relies on openModal/closeModal/showToast from main.js.

{
  const SEEN_KEY = "campusconnect-onboarding-seen";

  const dialog = document.getElementById("onboarding");
  const form = document.getElementById("onboarding-form");
  const steps = Array.from(form.querySelectorAll(".onboarding__step"));
  const backButton = dialog.querySelector(".modal__back");
  const title = dialog.querySelector(".onboarding__title");
  const progress = dialog.querySelector(".onboarding__progress");
  const questionCount = form.querySelectorAll("[data-question]").length;
  const lastStep = steps.length - 1;
  const description = form.querySelector('textarea[name="kuvaus"]');
  const counter = form.querySelector(".textarea-counter");
  const counterNumber = form.querySelector(".textarea-counter__count");
  const counterAlert = form.querySelector(".textarea-counter__alert");
  let current = 0;

  function focusHeading() {
    steps[current].querySelector(".modal__heading").focus();
  }

  function showStep(index) {
    current = index;
    steps.forEach((step, i) => {
      step.hidden = i !== index;
    });
    const step = steps[index];
    backButton.hidden = index === 0;
    title.textContent = step.dataset.title;
    // Screen readers hear e.g. "Oma käyntikorttisi, vaihe 1/3".
    progress.textContent = step.dataset.question
      ? `, vaihe ${step.dataset.question}/${questionCount}`
      : "";
  }

  // A question's "Jatka" needs an answer; the intro's button is always on.
  function updateNextButtons() {
    steps.forEach((step) => {
      const next = step.querySelector("[data-next]");
      if (next && step.querySelector("input")) {
        next.disabled = !step.querySelector("input:checked");
      }
    });
  }

  // "0/200 merkkiä" under the description. maxlength stops typing at the
  // limit; screen readers hear once that the limit has been reached.
  function updateCounter() {
    const length = description.value.length;
    const full = length >= description.maxLength;
    counterNumber.textContent = String(length);
    counter.classList.toggle("is-full", full);
    counterAlert.textContent = full
      ? `Enimmäispituus ${description.maxLength} merkkiä on täynnä.`
      : "";
  }

  function markSeen() {
    try {
      sessionStorage.setItem(SEEN_KEY, "1");
    } catch (error) {
      // Storage blocked: the modal may open again on the next visit.
    }
  }

  function hasBeenSeen() {
    try {
      return sessionStorage.getItem(SEEN_KEY) === "1";
    } catch (error) {
      return false;
    }
  }

  form.addEventListener("change", updateNextButtons);
  description.addEventListener("input", updateCounter);

  form.querySelectorAll("[data-next]").forEach((button) => {
    button.addEventListener("click", () => {
      showStep(current + 1);
      focusHeading();
    });
  });

  backButton.addEventListener("click", () => {
    showStep(current - 1);
    focusHeading();
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    // Enter on an earlier step moves forward instead of saving.
    if (current < lastStep) {
      const next = steps[current].querySelector("[data-next]");
      if (next && !next.disabled) next.click();
      return;
    }

    closeModal(dialog);
    showToast("Käyntikorttisi on tallennettu.");
  });

  // Every way of closing counts as "seen" and resets the form.
  dialog.addEventListener("modal-closed", () => {
    markSeen();
    form.reset();
    updateNextButtons();
    updateCounter();
    showStep(0);
  });

  // Match the counter and buttons to any form values the browser restored.
  updateCounter();
  updateNextButtons();
  showStep(0);

  // Open after a short pause, so the course list shows first and the modal
  // then animates in on top of it.
  const OPEN_DELAY = 400;
  if (!hasBeenSeen()) {
    setTimeout(() => {
      openModal(dialog);
      focusHeading();
    }, OPEN_DELAY);
  }
}
