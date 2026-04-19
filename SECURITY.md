# Security Policy

## Supported Versions

We actively maintain security fixes for the latest release. Older versions do not receive backported patches.

| Version | Supported |
| ------- | --------- |
| latest  | ✓         |

## Reporting a Vulnerability

If you discover a security vulnerability in `react-native-accessibility-controller`, **please do not open a public GitHub issue.**

Instead, email **security@bedda.tech** with:

- A description of the vulnerability and its potential impact
- Steps to reproduce (proof-of-concept code is welcome)
- The versions you have tested against

We will acknowledge your report within **48 hours** and aim to release a fix within **14 days** of confirmation.

We do not currently offer a bug bounty program, but we will credit researchers in the release notes unless they request anonymity.

## Security Considerations

`react-native-accessibility-controller` bridges Android's `AccessibilityService` to React Native. Because this service has elevated system privileges (it can read and interact with any app on the screen), integrators should:

- Only request permissions that your feature actually requires
- Clearly disclose to users what data the service reads and why
- Never transmit screen data or accessibility tree contents off-device without explicit user consent
- Follow Google Play's [Accessibility Services Policy](https://support.google.com/googleplay/android-developer/answer/10964491) when publishing apps that use this library
