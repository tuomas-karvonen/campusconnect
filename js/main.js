// CampusConnect – shared scripts: modals and toast.

// ---------------------------------------------------------------------------
// Modals
// Open:   <button data-modal-open="dialog-id">
// Close:  <button data-modal-close> inside the <dialog>
// Swap:   <button data-modal-switch="dialog-id"> inside the <dialog>
// The browser back button closes an open modal instead of leaving the page:
// opening a modal adds a history entry, closing it removes that entry.
// Every close goes through hideDialog(), which fires a "modal-closed"
// event on the dialog. Page scripts listen to that instead of the native
// "close" event, which Chromium does not always fire after history.back().
// ---------------------------------------------------------------------------

function hideDialog(dialog) {
  if (!dialog.open) return;
  dialog.closedByScript = true;
  dialog.close();
  dialog.dispatchEvent(new Event("modal-closed"));
}

function hideOpenDialogs() {
  document.querySelectorAll("dialog[open]").forEach(hideDialog);
}

function openModal(dialog) {
  if (dialog.open) return;
  dialog.closedByScript = false;
  dialog.showModal();
  history.pushState({ modal: dialog.id }, "");
}

function closeModal(dialog) {
  if (!dialog.open) return;
  if (history.state && history.state.modal === dialog.id) {
    history.back(); // the popstate handler closes the dialog
  } else {
    hideDialog(dialog);
  }
}

// Swap one open modal for another (e.g. business card → chat) without
// adding a second history entry.
function switchModal(fromDialog, toDialog) {
  hideDialog(fromDialog);
  toDialog.closedByScript = false;
  toDialog.showModal();
  history.replaceState({ modal: toDialog.id }, "");
}

window.addEventListener("popstate", hideOpenDialogs);

// Coming back to a page from the browser cache: don't show a modal that
// was open when the user left.
window.addEventListener("pageshow", (event) => {
  if (event.persisted) hideOpenDialogs();
});

document.querySelectorAll("[data-modal-open]").forEach((button) => {
  button.addEventListener("click", () => {
    const dialog = document.getElementById(button.dataset.modalOpen);
    if (dialog) openModal(dialog);
  });
});

document.querySelectorAll("dialog.modal").forEach((dialog) => {
  dialog.querySelectorAll("[data-modal-close]").forEach((button) => {
    button.addEventListener("click", () => closeModal(dialog));
  });

  // <button data-modal-switch="other-dialog-id"> replaces this modal.
  dialog.querySelectorAll("[data-modal-switch]").forEach((button) => {
    button.addEventListener("click", () => {
      const target = document.getElementById(button.dataset.modalSwitch);
      if (target) switchModal(dialog, target);
    });
  });

  // Esc key
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeModal(dialog);
  });

  // The browser can still close a dialog itself (e.g. a repeated Esc).
  // Treat that like a normal close and drop the modal's history entry.
  dialog.addEventListener("close", () => {
    if (dialog.closedByScript) return;
    dialog.closedByScript = true;
    dialog.dispatchEvent(new Event("modal-closed"));
    if (history.state && history.state.modal === dialog.id) history.back();
  });

  // Click on the dimmed backdrop (outside the dialog box)
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) closeModal(dialog);
  });
});

// ---------------------------------------------------------------------------
// Toast
// showToast(message) fills the page's empty
// <div class="toast" role="status"></div>. The element stays in the page
// so screen readers announce the message.
// ---------------------------------------------------------------------------

const TOAST_DURATION = 4000;

function showToast(message) {
  const toast = document.querySelector(".toast");
  if (!toast) return;
  clearTimeout(showToast.timer);
  // Short delay so the live region is registered before its text changes.
  setTimeout(() => {
    toast.textContent = message;
    toast.classList.add("is-visible");
  }, 100);
  showToast.timer = setTimeout(() => {
    toast.classList.remove("is-visible");
    // Clear the text after the fade-out.
    setTimeout(() => {
      toast.textContent = "";
    }, 250);
  }, TOAST_DURATION);
}
