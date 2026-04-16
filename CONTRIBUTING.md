# Contributing to react-native-accessibility-controller

`react-native-accessibility-controller` is a React Native TurboModule that exposes Android's AccessibilityService APIs — screen reading, gestures, global actions, and screenshots — to JavaScript.

Contributions of all kinds are welcome.

## Ways to Contribute

- **Report bugs** — open a GitHub issue with steps to reproduce and your Android API level
- **Request features** — open a GitHub issue describing what you need and why
- **Fix issues** — look for `good first issue` labels to find beginner-friendly tasks
- **Improve docs** — fix typos, add examples, document edge cases
- **Test on devices** — AccessibilityService behavior varies across Android versions and OEM skins

## Community

- [Discord](https://discord.gg/deft) — chat with maintainers and contributors
- [GitHub Discussions](https://github.com/bedda-tech/react-native-accessibility-controller/discussions) — design proposals and Q&A

## Development Setup

Requirements:
- Node.js 20+, npm
- Android device or emulator (API 30+ recommended; API 26+ minimum)
- Android Studio with NDK configured for native builds

```bash
git clone https://github.com/bedda-tech/react-native-accessibility-controller.git
cd react-native-accessibility-controller
npm install
cd example && npm install
npx expo run:android
```

## Code Guidelines

### TypeScript
- All new APIs must have TypeScript types exported from `src/index.ts`
- Run `npm run typecheck` before opening a PR — must exit 0

### Kotlin / Android
- Follow the existing singleton pattern (`ActionDispatcher`, `GestureDispatcher`)
- `GestureDescription.StrokeDescription` requires duration >= 1ms — coerce any zero values
- Screenshot APIs require API 30+; guard with `Build.VERSION.SDK_INT >= Build.VERSION_CODES.R` and delegate to a `@RequiresApi(Build.VERSION_CODES.R)` private method
- Hardware bitmaps must be copied to `ARGB_8888` before compression
- Explicitly declare `androidx.annotation:annotation` in `build.gradle` when using `@RequiresApi`

## Pull Request Process

1. Fork the repo and create a branch from `main`:
   ```bash
   git checkout -b fix/issue-123-describe-your-change
   ```
2. Make your changes
3. Run `npm run typecheck` — must pass
4. Test on a real Android device if possible (API 30+ for screenshot APIs)
5. Push and open a PR against `main`
6. Describe what changed and why; link the related issue

Please open an issue before starting large features to avoid duplicate work.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
