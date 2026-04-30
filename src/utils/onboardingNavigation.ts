export function isFinalOnboardingSlide(index: number, slideCount: number) {
  return index >= slideCount - 1;
}

export function getOnboardingCtaLabel(index: number, slideCount: number) {
  return isFinalOnboardingSlide(index, slideCount) ? "LET'S GET STARTED" : 'NEXT';
}

export function getNextOnboardingIndex(index: number, slideCount: number) {
  if (isFinalOnboardingSlide(index, slideCount)) {
    return index;
  }

  return Math.min(index + 1, slideCount - 1);
}
