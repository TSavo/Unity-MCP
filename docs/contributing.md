# Contributing to Unity-MCP

Thank you for your interest in contributing to Unity-MCP! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to foster an inclusive and respectful community.

## Getting Started

1. Fork the repository on GitHub.
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR-USERNAME/Unity-MCP.git
   cd Unity-MCP
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a new branch for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development Workflow

1. Make your changes.
2. Write or update tests for your changes.
3. Run the tests to ensure they pass:
   ```bash
   npm test
   ```
4. Run the linter to ensure your code follows the project's style guidelines:
   ```bash
   npm run lint
   ```
5. Commit your changes with a descriptive commit message:
   ```bash
   git commit -m "Add feature: your feature description"
   ```
6. Push your changes to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. Create a pull request on GitHub.

## Pull Request Guidelines

- Fill out the pull request template completely.
- Include tests for new features or bug fixes.
- Update documentation if necessary.
- Ensure all tests pass and there are no linting errors.
- Keep pull requests focused on a single issue or feature.
- Reference any related issues in your pull request.

## Coding Standards

- Follow the TypeScript coding style used in the project.
- Use meaningful variable and function names.
- Write clear and concise comments.
- Follow the principle of single responsibility.
- Write unit tests for your code.

## Testing

- Write unit tests for all new features and bug fixes.
- Ensure all tests pass before submitting a pull request.
- Follow the test-driven development (TDD) approach when possible.

## Documentation

- Update documentation for any changes to the API or functionality.
- Use clear and concise language in documentation.
- Include examples where appropriate.
- Check for spelling and grammar errors.

## Issue Reporting

- Use the issue tracker to report bugs or request features.
- Check if the issue already exists before creating a new one.
- Provide a clear and descriptive title.
- Include steps to reproduce the issue.
- Include any relevant logs or error messages.
- Specify the version of Unity-MCP you're using.

## Feature Requests

- Use the issue tracker to request new features.
- Clearly describe the feature and its use case.
- Explain how the feature would benefit the project.
- Be open to discussion and feedback.

## Code Review

- All pull requests will be reviewed by at least one maintainer.
- Address all review comments before your pull request can be merged.
- Be respectful and constructive in code review discussions.
- Ask for clarification if you don't understand a review comment.

## License

By contributing to Unity-MCP, you agree that your contributions will be licensed under the project's [MIT License](../LICENSE).
