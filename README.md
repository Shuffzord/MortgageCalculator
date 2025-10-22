# MortgageCalc

![License: CC BY-NC 4.0](https://img.shields.io/badge/License-CC%20BY--NC%204.0-lightgrey.svg)
![Status: Early Development](https://img.shields.io/badge/Status-Early%20Development-yellow)
![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)
![Vibe Coded](https://img.shields.io/badge/Vibe%20Coded-AI%20Assisted-purple)

A beautiful, client-side mortgage calculator that empowers users to make informed financial decisions through advanced visualization and powerful calculation features.

## 🌟 [Live Demo](https://mortgagecalc-demo.example.com)

Try the latest stable version of MortgageCalc. The demo site is automatically updated with each release.

![MortgageCalc Screenshot](https://via.placeholder.com/800x450?text=MortgageCalc+Screenshot)

## 🚀 Features

### Core Features (Free)
- 📊 Calculate mortgage payments with visualizations of principal vs. interest
- 📈 Support for various repayment models (equal installments, decreasing installments)
- 💰 Define one-time or recurring overpayments with visual impact
- 📝 Interactive educational tooltips explaining financial concepts
- 🔒 100% client-side with no data sent to servers

### Premium Features (Coming Soon)
- 📑 Export calculations to various formats (PDF, CSV, JSON)
- 🔄 Compare multiple scenarios side-by-side
- 🧠 Intelligent overpayment optimization algorithm
- More to be announced...

## 💭 Vibe Coded Project

MortgageCalc is proudly "Vibe Coded" - developed using AI-assisted programming techniques. We embrace AI as a collaborative tool in our development process:

- **AI-Enhanced Development:** We use various AI tools to assist with code generation, problem-solving, and design ideation
- **Human Review:** All AI contributions are reviewed and refined by human developers
- **Collaborative Intelligence:** We believe in combining human creativity with AI capabilities

Contributors are encouraged to leverage AI assistants in their work on this project. Consider documenting how AI was used in PR descriptions to help other contributors learn from your approach.

## 🛠️ Technology Stack

- **Frontend:** React with TypeScript
- **State Management:** React Context API
- **Data Visualization:** Chart.js
- **Styling:** Tailwind CSS
- **Testing:** Jest + React Testing Library
- **Build Tools:** Vite

## 📋 Usage License

This project is licensed under the [Creative Commons Attribution-NonCommercial 4.0 International License](https://creativecommons.org/licenses/by-nc/4.0/).

**What this means:**
- ✅ You can use this calculator for your personal mortgage planning
- ✅ You can host it privately for yourself or your organization
- ✅ You can modify and adapt the code
- ✅ You can share your modifications with proper attribution
- ❌ You cannot use it for commercial purposes (selling access or premium features to others)
- ❌ You cannot sublicense or redistribute it under different terms

## 💝 Support This Project

If you find MortgageCalc useful, please consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor-GitHub-ea4aaa)](https://github.com/sponsors/your-username)

Your support helps ensure continued development and maintenance of this tool. Every contribution makes a difference!

## 🏗️ Project Structure

```
src/
├── components/        # UI components
├── contexts/          # React context providers
├── hooks/             # Custom React hooks
├── models/            # TypeScript interfaces/types
├── services/          # Core calculation services
├── utils/             # Helper functions
├── App.tsx            # Main application component
└── main.tsx           # Application entry point
```

## 🚀 Getting Started

### Development Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Setup Instructions

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/mortgagecalc.git
   cd mortgagecalc
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open your browser to `http://localhost:3000`

## 🤝 Contributing

We welcome contributions from everyone! Please read our [Contributing Guidelines](CONTRIBUTING.md) before submitting a pull request.

### AI-Assisted Contributions

We encourage the responsible use of AI tools (Claude, GitHub Copilot, etc.) to enhance your contributions. When using AI:

- Verify the accuracy of AI-generated code
- Understand how the code works before submitting
- Mention AI assistance in your PR description
- Use AI to help with documentation and tests

### Code of Conduct

This project adheres to our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Good First Issues

Looking to make your first contribution? Check out our [good first issues](https://github.com/your-username/mortgagecalc/labels/good%20first%20issue) that are specifically tagged for new contributors.

## 📐 Design Guidelines

MortgageCalc follows specific design principles to ensure the application is both functional and beautiful. Please refer to our [Design Guidelines](DESIGN_GUIDELINES.md) document when contributing UI components or visualizations.

## 🏛️ Architecture

The MortgageCalc application follows a modular architecture that separates concerns and establishes clear dependencies between components.

### Module Structure

The calculation logic is organized into the following modules:

- **calculationCore.ts** - Core calculation functions shared between modules
  - Contains fundamental mortgage math functions
  - Provides utility functions like `roundToCents` and `calculateBaseMonthlyPayment`
  - Helps break circular dependencies between calculation modules

- **formatters.ts** - Formatting functions for display
  - Handles currency formatting with internationalization support
  - Provides date and time period formatting
  - Keeps presentation logic separate from calculation logic

- **overpaymentCalculator.ts** - Overpayment-specific logic
  - Manages one-time and recurring overpayments
  - Calculates impact of overpayments on loan term or payment amount
  - Provides specialized overpayment functions

- **calculationService.ts** - Service layer for UI components
  - Mediates between UI components and calculation logic
  - Provides a unified API for all calculation operations
  - Handles parameter validation and transformation

### Dependency Flow

```
┌─────────────────┐
│  UI Components  │
└────────┬────────┘
         │ uses
         ▼
┌─────────────────┐
│calculationService│
└────┬──────┬─────┘
     │      │
     ▼      ▼
┌────────┐ ┌────────────┐     ┌───────────┐
│formatters│ │calculationEngine│◄────│optimizationEngine│
└────────┘ └───────┬────┘     └───────────┘
                   │
                   ▼
          ┌─────────────────┐
          │overpaymentCalculator│
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │ calculationCore │
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │     types.ts    │
          └─────────────────┘
```

### Best Practices

When working with the MortgageCalc codebase, follow these guidelines:

1. **UI Component Integration**
   - Always use `calculationService` in UI components
   - Never import calculation modules directly into UI components
   - Use the service's formatting methods for consistent display

2. **Parameter Handling**
   - Use parameter objects for function calls
   - Follow the established parameter object patterns in each module
   - Leverage TypeScript interfaces for type safety

3. **Separation of Concerns**
   - Keep formatting logic separate from calculation logic
   - Maintain clear boundaries between modules
   - Follow the dependency flow shown in the diagram

4. **Testing**
   - Test each module in isolation
   - Use the service layer for integration tests
   - Ensure comprehensive test coverage for all calculation paths

## 📚 Documentation

- [API Documentation](docs/API.md)
- [Calculation Methods](docs/CALCULATIONS.md)
- [Component Library](docs/COMPONENTS.md)
- [Financial Terms Glossary](docs/GLOSSARY.md)

## 🧪 Testing

The MortgageCalc project uses a comprehensive testing approach with two main types of tests:

### Unit Tests

Unit tests focus on testing individual components and functions in isolation:

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run only failed tests
npm run test:failed

# Generate coverage report
npm run test:coverage
```

### End-to-End (E2E) Tests

E2E tests use Puppeteer to simulate real user interactions with the application:

```bash
# Run all E2E tests
npm run test:e2e

# Run E2E tests with HTML report generation
npm run test:e2e:report
```

### Full Test Suite

```bash
# Run both unit and E2E tests
npm run fulltest
```

For detailed information about our testing approach, see [Testing Documentation](testing-documentation-update.md) and [Future Testing Plans](future-testing-adjustments.md).

We aim for high test coverage. Please include appropriate tests with your contributions.

## 📋 Roadmap

### Phase 1 (Current)
- Basic loan calculator functionality
- Visualization of principal vs. interest
- Simple overpayment scenarios
- Local storage of calculations

### Phase 2 (Upcoming)
- Multiple repayment models
- Extended visualization capabilities
- Interest rate change scenarios
- Educational mode enhancements

### Phase 3 (Future)
- Premium features implementation
- Advanced overpayment capabilities
- Scenario comparison tools
- Data export functionality

## 👏 Acknowledgments

- Thanks to all contributors who have helped shape this project
- Special thanks to our early adopters and testers
- Appreciation to the AI tools that helped enhance our development process

## 💬 Community

- [Discord Server](https://discord.gg/your-invite-link)
- [Discussions on GitHub](https://github.com/your-username/mortgagecalc/discussions)
- [Twitter](https://twitter.com/mortgagecalc)

---

<p align="center">
  Created with ❤️ by Marvelous Mateusz Wozniak and the mortgage calculator community
</p>
