# Paper Balls Poker 🃏

A real-time poker planning web application for agile teams. No registration required - create a session, share the link, and start estimating!

## Features

- **No Authentication Required** - Users join with just their name
- **Real-time Collaboration** - See participants and votes update live
- **Shareable Sessions** - Create a session and share the link with your team
- **Automatic Cleanup** - Sessions disappear when no one is connected
- **Multiple Concurrent Sessions** - Support for multiple teams/sessions
- **Mobile Responsive** - Works on desktop, tablet, and mobile devices

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/scuciatto/paperballspoker.git
cd paperballspoker
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

### Development

To run in development mode with auto-restart:
```bash
npm run dev
```

## How to Use

1. **Create a Session**: Enter a session name and your name, then click "Create Session"
2. **Share the Link**: Copy the session link and share it with your team members
3. **Join a Session**: Team members can enter the session ID and their name to join
4. **Vote**: Select a card value (0, 1, 2, 3, 5, 8, 13, 21, ?, ☕)
5. **Reveal Results**: Click "Reveal Votes" to see everyone's estimates
6. **Reset**: Click "Reset Votes" to start a new round

## Voting Cards

The application includes standard Fibonacci sequence cards plus special values:
- **Numbers**: 0, 1, 2, 3, 5, 8, 13, 21
- **Unknown**: ? (when you're unsure)
- **Break**: ☕ (when you need a break)

## Technology Stack

- **Backend**: Node.js, Express.js, Socket.io
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Real-time Communication**: WebSockets via Socket.io
- **Styling**: Custom CSS with responsive design

## API Endpoints

- `GET /` - Landing page
- `GET /room/:roomId` - Poker planning room
- `POST /api/create-session` - Create a new session

## Socket Events

- `join-session` - Join a poker session
- `cast-vote` - Submit a vote
- `reveal-votes` - Reveal all votes
- `reset-votes` - Reset votes for new round

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.
