# Equipment Sales Company Game

A landing page for Equipment Sales Company with email collection and a fun browser-based game.

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Database Connection
- Copy your Neon database connection string
- Open the `.env` file and paste it next to `NEON_DB_URL`
- Example: `NEON_DB_URL=postgres://user:password@ep-xyz.us-east-4.aws.neon.tech:5432/dbname`

### 3. Start the Server
```bash
npm start
```

Or for development with auto-reload:
```bash
npm run dev
```

### 4. Open in Browser
Navigate to `http://localhost:3000` in your browser.

## Features

- **Landing Page**: Collects visitor emails with a sleek design
- **Email Storage**: Saves emails to Neon PostgreSQL database
- **Game**: "Fireworks Street Run" - An entertaining browser game
- **High Scores**: Tracks and displays the best scores

## How It Works

1. User arrives at the landing page and sees "Equipment Sales Company" branding
2. User enters their email address and clicks "Enter Game"
3. Email is validated and saved to the database
4. User is redirected to the game title screen
5. User can play the game and view high scores

## Technologies Used

- **Frontend**: HTML5, CSS3, JavaScript Canvas
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (via Neon)
