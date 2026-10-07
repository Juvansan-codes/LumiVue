# Contributing to LumiVue

Welcome! We are excited to have you contribute to LumiVue, our open-source, evidence-grounded multimodal pneumonia intelligence assistant.

## Code of Conduct
Please ensure you respect your fellow developers and follow standard open-source collaborative etiquette. Our goal is to build safe, effective, and transparent medical AI.

## Getting Started
Please read the following documents to understand the architecture and development environment:
1. `README.md` - Core project setup.
2. `docs/architecture.md` - System layout and communication.
3. `docs/TEAM_WORKFLOW.md` - Details on our branching strategy and role-based file ownership.

## Development Setup
### Frontend
1. Navigate to the `frontend/` directory.
2. Run `npm install`.
3. Copy `.env.example` to `.env.local` and configure your Supabase variables.
4. Run `npm run dev`.

### Backend
1. Navigate to the `backend/` directory.
2. Set up a Python 3.11 virtual environment.
3. Run `pip install -r requirements.txt`.
4. Copy `.env.example` to `.env` and configure.
5. Run `uvicorn app.main:app --reload`.

### MedGemma vLLM Server
1. Navigate to `backend/medgemma_server/`.
2. Install requirements and run `python app.py` to start the local LLM server on port 8080.

## Branching Strategy
We use a feature-branch workflow.
1. Create a branch: `git checkout -b feature/your-feature-name`
2. Commit your changes with descriptive messages: `git commit -m "feat: add new feature"`
3. Push to your fork/branch: `git push origin feature/your-feature-name`
4. Open a Pull Request against the `main` branch.

## Code Style
- **Frontend:** We use Prettier and ESLint. Please ensure your code passes `npm run lint` and `npm run typecheck` before submitting a PR.
- **Backend:** We follow standard PEP 8 guidelines. Use `black` for formatting and `mypy` for static typing.

## AI & Medical Disclaimer
All contributions to the AI models (`backend/models/`, `backend/vision/`, `backend/medgemma_server/`) must include explicit testing and validation logic to prevent data leakage and hallucination. 

Thank you for helping us build LumiVue!
