const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = process.env.PORT || 3000;

// Store active sessions in memory
const sessions = new Map();

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/room/:roomId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'room.html'));
});

// API to create a new session
app.post('/api/create-session', (req, res) => {
    const { sessionName } = req.body;
    const sessionId = uuidv4();
    
    sessions.set(sessionId, {
        id: sessionId,
        name: sessionName || 'Poker Planning Session',
        participants: new Map(),
        votes: new Map(),
        isRevealed: false,
        createdAt: new Date()
    });
    
    res.json({ sessionId, name: sessionName });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('join-session', (data) => {
        const { sessionId, userName } = data;
        const session = sessions.get(sessionId);
        
        if (!session) {
            socket.emit('error', { message: 'Session not found' });
            return;
        }
        
        // Join the room
        socket.join(sessionId);
        socket.sessionId = sessionId;
        socket.userName = userName;
        
        // Add participant to session
        session.participants.set(socket.id, {
            id: socket.id,
            name: userName,
            connected: true
        });
        
        // Send current session state to the new participant
        socket.emit('session-state', {
            session: {
                id: session.id,
                name: session.name,
                participants: Array.from(session.participants.values()),
                votes: Array.from(session.votes.entries()),
                isRevealed: session.isRevealed
            }
        });
        
        // Notify others about new participant
        socket.to(sessionId).emit('participant-joined', {
            participant: { id: socket.id, name: userName, connected: true }
        });
        
        console.log(`${userName} joined session ${sessionId}`);
    });
    
    socket.on('cast-vote', (data) => {
        const { vote } = data;
        const sessionId = socket.sessionId;
        const session = sessions.get(sessionId);
        
        if (!session) {
            socket.emit('error', { message: 'Session not found' });
            return;
        }
        
        // Store the vote
        session.votes.set(socket.id, {
            participantId: socket.id,
            vote: vote,
            timestamp: new Date()
        });
        
        // Notify all participants about the vote (without revealing the actual vote)
        io.to(sessionId).emit('vote-cast', {
            participantId: socket.id,
            hasVoted: true
        });
        
        console.log(`${socket.userName} voted in session ${sessionId}`);
    });
    
    socket.on('reveal-votes', () => {
        const sessionId = socket.sessionId;
        const session = sessions.get(sessionId);
        
        if (!session) {
            socket.emit('error', { message: 'Session not found' });
            return;
        }
        
        session.isRevealed = true;
        
        // Send all votes to all participants
        io.to(sessionId).emit('votes-revealed', {
            votes: Array.from(session.votes.entries()).map(([participantId, voteData]) => ({
                participantId,
                participantName: session.participants.get(participantId)?.name || 'Unknown',
                vote: voteData.vote
            }))
        });
        
        console.log(`Votes revealed in session ${sessionId}`);
    });
    
    socket.on('reset-votes', () => {
        const sessionId = socket.sessionId;
        const session = sessions.get(sessionId);
        
        if (!session) {
            socket.emit('error', { message: 'Session not found' });
            return;
        }
        
        session.votes.clear();
        session.isRevealed = false;
        
        // Notify all participants about the reset
        io.to(sessionId).emit('votes-reset');
        
        console.log(`Votes reset in session ${sessionId}`);
    });
    
    socket.on('disconnect', () => {
        const sessionId = socket.sessionId;
        const userName = socket.userName;
        
        if (sessionId && sessions.has(sessionId)) {
            const session = sessions.get(sessionId);
            
            // Remove participant from session
            session.participants.delete(socket.id);
            session.votes.delete(socket.id);
            
            // Notify others about participant leaving
            socket.to(sessionId).emit('participant-left', {
                participantId: socket.id
            });
            
            // Clean up empty sessions
            if (session.participants.size === 0) {
                sessions.delete(sessionId);
                console.log(`Session ${sessionId} deleted (no participants)`);
            }
            
            console.log(`${userName} left session ${sessionId}`);
        }
        
        console.log('User disconnected:', socket.id);
    });
});

server.listen(PORT, () => {
    console.log(`Poker Planning server running on port ${PORT}`);
});