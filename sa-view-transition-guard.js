(() => {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    if (reason?.name === 'AbortError' && reason?.message === 'Transition was skipped') {
      event.preventDefault();
    }
  });
})();
