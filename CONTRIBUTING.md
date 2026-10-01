# Contributing to FAMS

Thank you for your interest in contributing to the **Forest Fire Monitoring & Surveillance System (FAMS)**!

---

## Code of Conduct

We are committed to providing a welcoming, inclusive, and harassment-free experience for everyone. Please be respectful and constructive in discussions, code reviews, and issue reports.

---

## Development Workflow

1. **Fork the Repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/fams.git
   cd fams
   ```
3. **Create a topic branch**:
   ```bash
   git checkout -b feature/my-new-feature
   ```
4. **Set up the local environment**:
   - Backend: Create virtualenv, `pip install -r backend/requirements.txt`, configure `backend/.env`.
   - Frontend: `npm install` in `frontend/`.
5. **Run tests & verification**:
   ```bash
   python run.py test
   ```
6. **Commit your changes**:
   ```bash
   git commit -m "feat(gis): add custom biome boundary polygon support"
   ```
7. **Push to your fork** and submit a Pull Request.

---

## Coding Standards

- **Python**: Follow PEP 8 guidelines. Use type annotations where applicable. Format code cleanly.
- **JavaScript/React**: Use modern React 18 functional components with hooks. Avoid unnecessary external dependencies.
- **Scientific Integrity**: Never introduce fabricated or mocked mock datasets in production pipelines without explicit testing disclaimers.
