# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

## Reporting a Vulnerability

We take the security and privacy of **AI Grammar Studio** users seriously. Because AI Grammar Studio is an offline-first application designed to operate with zero telemetry and zero external server communication, our primary security focus is:

1. Safe on-device execution of ONNX models without arbitrary code execution risks.
2. Secure IPC communication using Electron's `contextBridge` and isolated contexts.
3. Integrity of local file reading and storage mechanisms.

If you discover a security vulnerability or privacy flaw, please report it responsibly:

- **Do NOT open a public GitHub issue.**
- Instead, please contact the maintainer directly via GitHub or email.
- Provide a detailed description of the vulnerability, reproduction steps, and potential impact.

We will acknowledge receipt within 48 hours and work with you on a coordinated disclosure and patch.
