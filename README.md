# E-Pragati: Employee Updates and Analytics Platform

A modern web application for tracking employee updates, analyzing team performance, and providing AI-powered insights.

## Features

- **Team Updates**: Track and manage employee updates and status reports
- **Analytics Dashboard**: Visualize team performance and productivity metrics
- **AI Copilot**: Intelligent assistant for querying team data and generating insights
- **Real-time Analysis**: Monitor team engagement and identify potential blockers

## Tech Stack

### Backend
- Python 3.x
- FastAPI
- SQLAlchemy
- OpenAI API
- Alembic (Database migrations)

### Frontend
- React
- TypeScript
- Material-UI
- Vite

## Getting Started

### Prerequisites
- Python 3.x
- Node.js 16+
- OpenAI API key

### Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd e-pragati
```

2. Set up the backend:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```

3. Set up the frontend:
```bash
cd frontend
npm install
```

4. Configure environment variables:
```bash
cp .env.example .env
# Edit .env with your OpenAI API key and other configurations
```

5. Initialize the database:
```bash
python src/init_db.py
```

### Running the Application

1. Start the backend server:
```bash
uvicorn src.main:app --reload --port 8001
```

2. Start the frontend development server:
```bash
cd frontend
npm run dev
```

## Project Structure

```
├── frontend/               # React frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── types/        # TypeScript type definitions
│   │   └── ...
├── src/                   # Python backend application
│   ├── routers/          # API route handlers
│   ├── models.py         # Database models
│   ├── schemas.py        # Pydantic schemas
│   └── main.py          # Application entry point
├── migrations/           # Database migrations
└── scripts/             # Utility scripts
```

## Development

### Branch Strategy
- `main`: Production-ready code
- `develop`: Development branch
- `feature/*`: Feature branches
- `bugfix/*`: Bug fix branches

### Contributing
1. Create a new feature branch from `develop`
2. Make your changes
3. Submit a pull request to `develop`

## License

This project is licensed under the MIT License - see the LICENSE file for details. 