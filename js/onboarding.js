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
    showStep(0);
  });

  showStep(0);

  if (!hasBeenSeen()) {
    openModal(dialog);
    focusHeading();
  }
}
