let deferredPrompt = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    deferredPrompt = e;
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
  });
}

export const canInstall = () => Boolean(deferredPrompt);

export const promptInstall = async () => {
  if (!deferredPrompt) {
    return {
      ok: false,
      message:
        'To install Fortis Wallet, open your browser menu and tap "Install App" or "Add to Home Screen". ' +
        'If the option is missing, visit the site once more, make sure you are on HTTPS (or localhost), ' +
        'and that your browser supports PWA installs (Chrome, Edge, Brave, Samsung Internet).',
    };
  }
  deferredPrompt.prompt();
  const choice = await deferredPrompt.userChoice;
  deferredPrompt = null;
  return {
    ok: choice.outcome === 'accepted',
    message: choice.outcome === 'accepted' ? 'Installing Fortis Wallet...' : 'Install dismissed.',
  };
};