document.querySelectorAll("[data-confirm]").forEach((element) => {
  element.addEventListener("click", (event) => {
    if (!confirm(element.dataset.confirm)) {
      event.preventDefault();
    }
  });
});
