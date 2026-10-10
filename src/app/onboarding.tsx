import React from 'react';
import { router } from 'expo-router';
import { OnboardingFlow } from '../components/onboarding/OnboardingFlow';

/** The welcome guide opened again from the Saved tab. Finishing or skipping returns to the app. */
export default function OnboardingReplay() {
  return (
    <OnboardingFlow
      onFinish={(target) => {
        if (target === 'map') router.replace('/map');
        else if (router.canGoBack()) router.back();
        else router.replace('/');
      }}
    />
  );
}
