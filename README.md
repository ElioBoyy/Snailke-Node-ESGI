# 🐌 Snailke

A modern, real-time Snake game built with Vue 3 and AdonisJS, featuring snails collecting lettuce in a garden setting!

## 🎮 Features

- **Classic Snake Gameplay** with a snail theme
- **Real-time Multiplayer** - See other players' scores live
- **Achievement System** - Unlock rewards for your accomplishments
- **Global Leaderboard** - Compete with players worldwide
- **User Authentication** - Save your progress and compete
- **Speed Controls** - Adjust game difficulty from 1-10

## 🏗️ Architecture

This is a full-stack monorepo containing:

- **`snailke-api/`** - AdonisJS backend API with WebSocket
- **`snailke-web/`** - Vue 3 frontend application

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- SQLite

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ElioBoyy/Snailke-ESGI
   cd snailke
   ```

2. **Install dependencies**

   ```bash
   cd snailke-api
   npm install
   mkdir tmp && node ace migration:run && node ace db:seed

   cd ../snailke-web
   npm install
   ```

3. **Start the development servers**

   **Backend (Terminal 1):**

   ```bash
   cd snailke-api
   npm run dev
   ```

   **Frontend (Terminal 2):**

   ```bash
   cd snailke-web
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3333

## 🎯 How to Play

1. **Register/Login** to save your scores and unlock achievements
2. **Use arrow keys** or WASD to control your snail
3. **Collect lettuce** 🥬 to grow your snail slime and increase your score
4. **Avoid walls** and don't let your snail bite itself
5. **Adjust speed** for different difficulty levels
6. **Compete** on the global leaderboard

### Controls

- **Movement**: Arrow keys or WASD
- **Pause**: Spacebar
- **Start Game**: Click "Start Adventure" or press Spacebar on menu

## 🏆 Achievement System

Unlock achievements by:

- **First Game** - Complete your first game
- **Score Milestones** - Reach specific score targets
- **Speed Challenges** - Play at maximum speed
- **Consistency** - Play multiple games

## 🛠️ Development

### Backend (AdonisJS)

```bash
cd snailke-api

npm run dev

npm run build

npm run test

node ace migration:run

node ace db:seed
```

### Frontend (Vue 3)

```bash
cd snailke-web

npm run dev

npm run build

npm run test:unit

npm run test:e2e
```

## 🌐 Real-time Features

- **Live Leaderboard** - See new scores appear instantly
- **Achievement Notifications** - Get notified when you unlock achievements
- **Connection Status** - Real-time connection indicator
- **Personal Notifications** - Score submissions and personal bests

## 🔧 Technology Stack

### Backend

- **AdonisJS 6** - Node.js framework
- **TypeScript** - Type-safe development
- **SQLite** - Lightweight database
- **Lucid ORM** - Database abstraction
- **WebSocket** - Real-time communication via @adonisjs/transmit

### Frontend

- **Vue 3** - Reactive JavaScript framework
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **TanStack Query** - Data fetching and caching
- **Pinia** - State management

## 📊 Database Schema

- **Users** - Authentication and profile data
- **Scores** - Game results with timestamps
- **Achievements** - Available achievements and conditions
- **UserAchievements** - Player progress and unlocked achievements

## 🚀 Deployment

### Backend Deployment

```bash
cd snailke-api
npm run build
npm run start
```

### Frontend Deployment

```bash
cd snailke-web
npm run build
```
