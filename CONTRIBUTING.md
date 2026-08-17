# Contributing to AI Grammar Studio

Thank you for your interest in contributing to **AI Grammar Studio**! We welcome bug fixes, documentation improvements, UI enhancements, and new feature implementations.

---

## 🛠 Development Workflow

### 1. Fork & Clone
```bash
git clone https://github.com/sayandey021/AI-Grammar-Studio.git
cd AI-Grammar-Studio
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Run Locally
```bash
npm run dev
```

### 4. Code Standards
- **TypeScript**: Ensure strict typing is maintained across both `src/main` and `src/renderer`.
- **Styling**: Adhere to the established CSS token design system in `src/renderer/src/styles/index.css`.
- **Privacy Guarantee**: Any new feature must uphold our core pledge of 100% offline, local execution. No cloud network calls or telemetry should ever be added.

### 5. Running Tests & Compiling
Before submitting a pull request, ensure all TypeScript code compiles and tests pass:
```bash
npm run compile
npm test
```

---

## 🔀 Pull Request Process

1. Create a descriptive feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Commit your changes with clear, semantic commit messages:
   ```bash
   git commit -m "feat(editor): add new readability metric calculation"
   ```
3. Push to your fork and open a Pull Request against `main`.
4. Provide a clear description of your changes, including test steps or screenshots for UI modifications.

---

## 🐛 Reporting Bugs

If you find a bug, please check existing issues first. If it has not been reported, open a new issue using our [Bug Report Template](.github/ISSUE_TEMPLATE/bug_report.md). Include:
- Steps to reproduce the issue
- Expected vs actual behavior
- Operating system version & GPU details (if related to model inference)

---

## 💡 Proposing Features

Feature ideas and architectural enhancements are welcome! Please open an issue using the [Feature Request Template](.github/ISSUE_TEMPLATE/feature_request.md).
