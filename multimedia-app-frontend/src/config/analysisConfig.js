export const ANALYSIS_CONFIG = {
  enabled: true,
  confirmBeforeRun: true,
  maxItemsPerRun: 5,      // can be increased   
  allowedTypes: ['image'], // video and audio excluded for now because tokens are expensive

  providersByType: {
    image: 'imagga',
    audio: 'cyanite',
  },

  skipIfAlreadyAnalyzed: true,
}
