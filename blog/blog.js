try { localStorage.setItem('siteLang', document.documentElement.lang); } catch (_) {}
const languageSwitcher = document.getElementById('language-switcher');
languageSwitcher?.addEventListener('change', () => {
  const option = languageSwitcher.selectedOptions[0];
  try { localStorage.setItem('siteLang', option.dataset.lang); } catch (_) {}
  window.location.assign(option.value);
});
