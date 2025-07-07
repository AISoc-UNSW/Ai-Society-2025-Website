# 🤖 AI Society 2025 Website

A comprehensive task management system with Discord integration, featuring automated meeting transcription, task generation, and real-time collaboration tools.

## 🌟 Features

### 🎯 Task Management

- **Hierarchical Task System**: Parent tasks with subtasks
- **Portfolio Organization**: Tasks organized by departments (EDU, IT Portfolio, Marketing)
- **Role-Based Access**: Director, Admin, and User permissions
- **Real-time Updates**: Live task status synchronization
- **Assignment Management**: Multi-user task assignments with notifications

### 🤖 Discord Bot Integration

- **Voice Meeting Recording**: Automatic transcription of Discord voice channels
- **Task Automation**: Generate tasks from meeting transcripts
- **Smart Reminders**: Deadline notifications and progress updates
- **Slash Commands**: Interactive task management directly in Discord

### 📊 Dashboard & Analytics

- **Task Dashboard**: Comprehensive view of all tasks and assignments
- **Progress Tracking**: Visual indicators for task completion
- **Portfolio Overview**: Department-specific task insights
- **User Management**: Role assignments and user search functionality

## 🏗️ Architecture

```mermaid
graph TB
    A[Discord Bot] --> B[FastAPI Backend]
    C[Next.js Frontend] --> B
    B --> D[PostgreSQL Database]
    A --> E[Voice Recording]
    A --> F[Task Notifications]
    C --> G[Task Dashboard]
    C --> H[User Management]
```

## 🚀 Quick Start

### Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **PostgreSQL 14+**
- **Discord Bot Token** (for bot functionality)

### 🤖 Discord Bot Setup

1. **Create and configure the bot environment:**

```bash
cd taskbot
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure Discord bot settings:**

```bash
cp .env.example .env
```

Update `taskbot/.env` with your Discord bot configuration:

```env
DISCORD_TOKEN=your_discord_bot_token
API_USERNAME=your_api_username
API_PASSWORD=your_api_password
API_BASE_URL=http://localhost:8000
```

3. **Start the Discord bot:**

```bash
python bot.py
```

For background operation (recommended):

```bash
nohup python bot.py > taskbot.log 2>&1 &
```

### 🔧 Backend API Setup

1. **Prepare the backend environment:**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Configure backend settings:**

```bash
cp .env.example .env
```

Update `backend/.env` with your configuration:

```env
POSTGRES_PASSWORD=your_database_password
SECRET_KEY=your_secure_random_string
DATABASE_URL=postgresql://user:password@localhost/ai_society_db
```

3. **Run database migrations:**

```bash
alembic upgrade head
```

4. **Start the FastAPI server:**

```bash
python run.py
```

🔗 **API Documentation**: http://localhost:8000/docs

5. **Run API tests (optional):**

```bash
python test_apis.py
```

### 🎨 Frontend Dashboard Setup

1. **Install frontend dependencies:**

```bash
cd frontend
npm install
```

2. **Start the development server:**

```bash
npm run dev
```

🌐 **Frontend Dashboard**: http://localhost:3000

## 🛠️ Development Environment

### 🎯 VS Code Configuration

For optimal development experience, configure your VS Code settings:

1. **Select Python interpreter** from the virtual environment:

   - `Ctrl/Cmd + Shift + P`
   - Search "Python: Select Interpreter"
   - Choose the interpreter from your `venv` folder

2. **Auto-formatting setup** (`.vscode/settings.json`):

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": "explicit"
  },
  "python.defaultInterpreterPath": "./backend/venv/bin/python"
}
```

3. **Install recommended extensions:**
   - **Black Formatter** (Python formatting)
   - **Prettier** (TypeScript/React formatting)
   - **Python** (Python language support)
   - **ES7+ React/Redux/React-Native snippets**

## 📁 Project Structure

```
Ai-Society-2025-Website/
├── 🤖 taskbot/              # Discord bot with voice recording
│   ├── cogs/                # Bot command modules
│   │   ├── meeting_record.py    # Voice recording & transcription
│   │   ├── reminder.py          # Task reminders & notifications
│   │   └── task_cog.py          # Task management commands
│   ├── utils/               # Bot utilities and configuration
│   └── bot.py              # Main bot entry point
│
├── 🔧 backend/              # FastAPI backend server
│   ├── app/
│   │   ├── api/v1/endpoints/    # API route handlers
│   │   │   ├── tasks.py         # Task CRUD operations
│   │   │   ├── users.py         # User management
│   │   │   ├── portfolios.py    # Portfolio management
│   │   │   ├── task_assignments.py # Assignment operations
│   │   │   └── meeting_records.py  # Meeting data
│   │   ├── core/            # Configuration & security
│   │   ├── models/          # SQLAlchemy database models
│   │   ├── schemas/         # Pydantic validation schemas
│   │   └── crud/            # Database operations
│   ├── alembic/             # Database migrations
│   └── run.py              # Server entry point
│
└── 🎨 frontend/             # Next.js React dashboard
    ├── src/
    │   ├── app/             # Next.js App Router pages
    │   │   ├── (internal)/taskbot/  # Protected task dashboard
    │   │   └── auth/        # Authentication pages
    │   ├── components/joyui/    # MUI Joy UI components
    │   ├── lib/
    │   │   ├── api/         # API client functions
    │   │   └── types.ts     # Shared TypeScript types
    │   └── styles/          # Global styling
    └── public/              # Static assets
```

## 🔧 Technology Stack

### Frontend

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **UI Library**: MUI Joy UI
- **Styling**: TailwindCSS
- **State Management**: Zustand
- **HTTP Client**: Fetch API with custom wrapper

### Backend

- **Framework**: FastAPI
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Migrations**: Alembic
- **Authentication**: JWT tokens
- **Validation**: Pydantic schemas
- **Formatting**: Black + isort

### Discord Bot

- **Library**: discord.py
- **Architecture**: Cogs (modular commands)
- **Features**: Voice recording, slash commands, task automation
- **Audio Processing**: FFmpeg for voice transcription

## 🔑 Key Features Deep Dive

### 📋 Task Management System

- **Hierarchical Structure**: Support for parent tasks and subtasks
- **Portfolio-based Organization**: Tasks categorized by department
- **Multi-user Assignments**: Tasks can be assigned to multiple users
- **Status Tracking**: Not Started → In Progress → Completed → Cancelled
- **Priority Levels**: Low, Medium, High, Critical

### 🎙️ Meeting Integration

- **Automatic Recording**: Discord voice channel recording
- **AI Transcription**: Convert speech to text
- **Task Generation**: Create actionable tasks from meeting discussions
- **Meeting History**: Searchable archive of all recorded sessions

### 👥 User & Role Management

- **Role-based Access Control**: Director, Admin, User roles
- **Portfolio Assignments**: Users belong to specific portfolios
- **User Search**: Quick user lookup for task assignments
- **Profile Management**: Avatar, email, and preference settings

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Permissions**: Different access levels per user role
- **Environment Variables**: Sensitive data stored securely
- **CORS Configuration**: Proper cross-origin request handling
- **SQL Injection Protection**: Parameterized queries with SQLAlchemy

## 🧪 Testing

### Backend API Testing

```bash
cd backend
python test_apis.py
```

### Frontend Development

```bash
cd frontend
npm run lint          # ESLint checking
npm run format        # Prettier formatting
npm run format:check  # Check formatting
```

## 📚 API Documentation

Once the backend is running, comprehensive API documentation is available at:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Key API Endpoints

- `POST /api/v1/login/access-token` - User authentication
- `GET /api/v1/tasks/` - Retrieve tasks with filtering
- `POST /api/v1/tasks/` - Create new tasks
- `GET /api/v1/portfolios/` - List portfolios
- `GET /api/v1/users/search` - Search users

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**: Ensure all sensitive data is properly configured
2. **Database**: Use production PostgreSQL instance
3. **Discord Bot**: Deploy on reliable server for 24/7 availability
4. **SSL/TLS**: Configure HTTPS for all web endpoints
5. **Load Balancing**: Consider multiple backend instances for scale

### Recommended Deployment Stack

- **Frontend**: Vercel or Netlify
- **Backend**: DigitalOcean, AWS, or similar VPS
- **Database**: Managed PostgreSQL (AWS RDS, DigitalOcean)
- **Bot**: VPS with tmux/screen for persistence

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Follow the coding standards** defined in `.cursorrules`
4. **Test your changes** thoroughly
5. **Submit a pull request**

### Development Guidelines

- Use the established TypeScript types system
- Follow MUI Joy UI component patterns
- Maintain API consistency between backend and frontend
- Test Discord bot features in a development server
- Document any new features or API changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ by the AI Society Team**
