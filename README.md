# AI Canvas — Real-Time Collaborative AI Layout Builder

AI Canvas is a real-time collaborative web app where users describe layouts in natural language and instantly see them rendered as draggable shapes on a shared canvas.

---

## 🚀 Overview

This project combines:
- **AI-powered layout generation**
- **Real-time synchronization**
- **Interactive canvas editing**

Users can type prompts like:
> "Create a 3x4 grid of circles labeled A–L"

…and instantly see a structured layout generated and synced across all connected clients.

---

## 🧠 Core Features

- ✨ Natural language → visual layout (AI + fallback logic)
- 🎯 Draggable shapes (circle & rectangle)
- ⚡ Real-time sync via WebSockets
- 💾 Persistent canvas (localStorage)
- 🔁 Multi-client collaboration
- 🧩 Prebuilt prompt suggestions
- 🚫 Smart validation (node limits, bounds, labels)

---

## 🏗️ Tech Stack

### Frontend
- React + TypeScript
- React Konva (canvas rendering)
- Zustand (state management)

### Backend
- Node.js + Express
- Socket.io (real-time communication)

### AI Layer
- Gemini API
- Structured fallback (no API key required)

---

## 📁 Project Structure

```
canvas-app/
├── backend/
│   ├── src/
│   │   ├── index.ts      # Server + socket handlers
│   │   ├── ai.ts         # AI + fallback logic
│   │   └── types.ts
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/   # Canvas + UI
│   │   ├── hooks/        # Socket logic
│   │   ├── store/        # Zustand store
│   │   └── types/
│   └── package.json
│
└── README.md
```

---

## ⚙️ Setup Instructions

### 1. Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

---

### 2. Configure Environment

Create `.env` inside `/backend`:

```
PORT=3001
<<<<<<< HEAD
Gemini_API_KEY=your_api_key_here
=======
GROQ_API_KEY=your_api_key_here
>>>>>>> e45cd93 (Added full AI Canvas project (frontend + backend))
```

> Optional — app works without API key using fallback logic.

---

### 3. Run the App

#### Start Backend
```bash
cd backend
npm run dev
```

#### Start Frontend
```bash
cd frontend
npm start
```

Open:
👉 http://localhost:3000

---

## 🔄 Real-Time Behavior

- Open multiple tabs
- Generate layout in one tab
- Watch all tabs update instantly
- Drag shapes → synced across all clients

---

## 📡 Socket Events

| Event | Direction | Description |
|------|----------|------------|
| canvas:generate | Client → Server | Send prompt |
| canvas:generated | Server → All | Broadcast layout |
| node:move | Client → Server | Move shape |
| node:moved | Server → Others | Sync movement |

---

## 🧾 AI Response Format

```json
{
  "nodes": [
    {
      "type": "circle",
      "x": 400,
      "y": 200,
      "radius": 25,
      "label": "A"
    }
  ]
}
```

### Constraints
- Max 12 nodes
- Labels ≤ 2 characters
- Shapes: circle / rectangle
- Coordinates clamped within canvas

---

## 🧪 Example Prompts

- Create a 3x4 grid of circles labeled A–L  
- Create a star layout with 1 center node and 6 surrounding nodes  
- Create 4 rectangles in a row and 1 circle above center  
- Create 5 circles in a pentagon layout  

---

## 🔧 Future Improvements

- Undo / Redo system
- Multi-room collaboration
- Shape selection & deletion
- Export canvas as PNG
- Color customization
- Backend scaling with Redis

---

## 🐞 Troubleshooting

### Backend not running
Check port:
```bash
lsof -i :3001
```

### No real-time sync
- Ensure backend is running
- Check WebSocket connection in console

### npm install issues
- Use Node.js v18+
- Delete node_modules and reinstall

---

## 📌 Summary

AI Canvas demonstrates how AI + real-time systems can create interactive, collaborative visual tools with minimal user input.

---

## 🧑‍💻 Author

Raja Faraz Tariq
