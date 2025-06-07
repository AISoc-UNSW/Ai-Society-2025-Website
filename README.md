This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

### Taskbot

1. Activate the virtual environment and install dependencies:

```bash
cd taskbot
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. Run the taskbot:

```bash
python bot.py
```

Or run the taskbot in the background (Recommended):

```bash
nohup python bot.py > taskbot.log 2>&1 &
```

### Backend and Frontend
1. Activate the virtual environment and install dependencies:

```bash
cd backend (Best option is to directly open the backend folder in your IDE)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

If you are using Code Editor like VSCode, choose the python interpreter to be the one in the venv folder by:

```bash
Ctrl(Cmd) + Shift + P
```

and then search for "Python: Select Interpreter" and select the one in the venv folder.

Also, to format the code on save, install the **Black formatter**. Once installed, you can configure your settings in .vscode/settings.json as follows:

```json
{
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.organizeImports": "explicit"
    }
}
```

The file backend/pyproject.toml is already configured to format the code

2. Configure environment variables:

Copy the example environment file and update it with your settings:

```bash
cd backend
cp .env.example .env  # On Windows: copy .env.example .env
```

Update the `backend/.env` file with your specific settings, especially:

- `POSTGRES_PASSWORD`: Your PostgreSQL password
- `SECRET_KEY`: A secure random string for production
- Other values as needed

3. Set up the database (If not already done):

- Make sure you have PostgreSQL installed and running.
- Create a database: `createdb ai_society_2025_website_db` (If not created)
- Run the following commands to create the initial migration: (If not already done)

```bash
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

4. Start the development server:

```bash
python run.py
```

The API will run on http://localhost:8000, you can visit http://localhost:8000/docs or http://localhost:8000/redoc to view the API documentation.

5. Run the API tests:

```bash
cd backend
python test_apis.py
```

6. Start the Next.js development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
