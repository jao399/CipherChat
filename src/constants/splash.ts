export const encryptedSplash = {
  colors: {
    background: '#050509',
    surfaceDark: '#0A0A12',
    primaryPurple: '#7C2DFF',
    deepPurple: '#4C1D95',
    glowPurple: '#A855F7',
    secondaryPurple: '#9333EA',
    whiteText: '#F8FAFC',
    mutedText: '#9CA3AF',
    secureGreen: '#22C55E',
  },
  text: {
    title: 'CipherChat',
    tagline: 'Secure. Private. Yours Alone.',
    signature: 'Made by Amgad Alzomi',
    copyright: 'Copyright (c) 2026 Amgad Alzomi',
  },
  timing: {
    gridFadeIn: 360,
    particlesIn: 620,
    logoAssemble: 430,
    logoPulse: 360,
    textFadeIn: 330,
    holdBeforeExit: 950,
    fadeOut: 240,
  },
};

export const encryptedSplashTotalDuration =
  encryptedSplash.timing.gridFadeIn +
  encryptedSplash.timing.particlesIn +
  encryptedSplash.timing.logoAssemble +
  encryptedSplash.timing.logoPulse +
  encryptedSplash.timing.textFadeIn +
  encryptedSplash.timing.holdBeforeExit;
