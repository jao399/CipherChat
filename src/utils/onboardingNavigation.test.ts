import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  getNextOnboardingIndex,
  getOnboardingCtaLabel,
  isFinalOnboardingSlide,
} from './onboardingNavigation';

describe('onboarding navigation', () => {
  it('shows NEXT until the final tutorial section', () => {
    assert.equal(getOnboardingCtaLabel(0, 4), 'NEXT');
    assert.equal(getOnboardingCtaLabel(1, 4), 'NEXT');
    assert.equal(getOnboardingCtaLabel(2, 4), 'NEXT');
  });

  it('shows LETS GET STARTED only on the final tutorial section', () => {
    assert.equal(isFinalOnboardingSlide(3, 4), true);
    assert.equal(getOnboardingCtaLabel(3, 4), "LET'S GET STARTED");
  });

  it('advances through all four tutorial sections before finishing', () => {
    assert.equal(getNextOnboardingIndex(0, 4), 1);
    assert.equal(getNextOnboardingIndex(1, 4), 2);
    assert.equal(getNextOnboardingIndex(2, 4), 3);
    assert.equal(getNextOnboardingIndex(3, 4), 3);
  });
});
