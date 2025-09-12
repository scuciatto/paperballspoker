// Room JavaScript
class PokerRoom {
    constructor() {
        this.socket = null;
        this.sessionId = null;
        this.userName = null;
        this.participants = new Map();
        this.votes = new Map();
        this.isRevealed = false;
        this.selectedVote = null;
        
        this.init();
    }
    
    init() {
        // Get session ID from URL
        const pathParts = window.location.pathname.split('/');
        this.sessionId = pathParts[pathParts.length - 1];
        
        // Get user name from sessionStorage or show modal
        this.userName = sessionStorage.getItem('userName');
        
        this.setupEventListeners();
        this.updateSessionDisplay();
        
        if (!this.userName) {
            this.showJoinModal();
        } else {
            this.hideJoinModal();
            this.initializeSocket();
        }
    }
    
    showJoinModal() {
        const modal = document.getElementById('join-modal');
        const form = document.getElementById('join-form');
        
        modal.style.display = 'flex';
        
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('modal-name').value.trim();
            
            if (name) {
                this.userName = name;
                sessionStorage.setItem('userName', name);
                this.hideJoinModal();
                this.initializeSocket();
            }
        });
    }
    
    hideJoinModal() {
        const modal = document.getElementById('join-modal');
        modal.style.display = 'none';
    }
    
    initializeSocket() {
        this.socket = io();
        
        // Connection status
        this.socket.on('connect', () => {
            this.updateConnectionStatus('connected');
            this.joinSession();
        });
        
        this.socket.on('disconnect', () => {
            this.updateConnectionStatus('disconnected');
        });
        
        this.socket.on('reconnect', () => {
            this.updateConnectionStatus('connected');
            this.joinSession();
        });
        
        // Session events
        this.socket.on('session-state', (data) => {
            this.handleSessionState(data);
        });
        
        this.socket.on('participant-joined', (data) => {
            this.addParticipant(data.participant);
        });
        
        this.socket.on('participant-left', (data) => {
            this.removeParticipant(data.participantId);
        });
        
        this.socket.on('vote-cast', (data) => {
            this.handleVoteCast(data);
        });
        
        this.socket.on('votes-revealed', (data) => {
            this.handleVotesRevealed(data);
        });
        
        this.socket.on('votes-reset', () => {
            this.handleVotesReset();
        });
        
        this.socket.on('error', (data) => {
            alert('Error: ' + data.message);
            window.location.href = '/';
        });
    }
    
    joinSession() {
        this.socket.emit('join-session', {
            sessionId: this.sessionId,
            userName: this.userName
        });
    }
    
    setupEventListeners() {
        // Voting cards
        document.querySelectorAll('.card-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.castVote(btn.dataset.value);
            });
        });
        
        // Control buttons
        document.getElementById('reveal-btn').addEventListener('click', () => {
            this.revealVotes();
        });
        
        document.getElementById('reset-btn').addEventListener('click', () => {
            this.resetVotes();
        });
        
        // Copy link button
        document.getElementById('copy-link-btn').addEventListener('click', () => {
            this.copySessionLink();
        });
    }
    
    updateSessionDisplay() {
        document.getElementById('session-id-display').textContent = `Session ID: ${this.sessionId}`;
    }
    
    updateConnectionStatus(status) {
        const indicator = document.querySelector('.status-indicator');
        const text = document.querySelector('.status-text');
        
        indicator.className = `status-indicator ${status}`;
        
        switch (status) {
            case 'connected':
                text.textContent = 'Connected';
                break;
            case 'connecting':
                text.textContent = 'Connecting...';
                break;
            case 'disconnected':
                text.textContent = 'Disconnected';
                break;
        }
    }
    
    handleSessionState(data) {
        const session = data.session;
        
        // Update session name
        document.getElementById('session-name').textContent = session.name;
        
        // Update participants
        this.participants.clear();
        session.participants.forEach(participant => {
            this.participants.set(participant.id, participant);
        });
        
        // Update votes
        this.votes.clear();
        session.votes.forEach(([participantId, voteData]) => {
            this.votes.set(participantId, voteData);
        });
        
        this.isRevealed = session.isRevealed;
        
        this.renderParticipants();
        this.updateVoteDisplay();
        
        if (this.isRevealed) {
            this.showResults();
        }
    }
    
    addParticipant(participant) {
        this.participants.set(participant.id, participant);
        this.renderParticipants();
    }
    
    removeParticipant(participantId) {
        this.participants.delete(participantId);
        this.votes.delete(participantId);
        this.renderParticipants();
    }
    
    renderParticipants() {
        const container = document.getElementById('participants-list');
        container.innerHTML = '';
        
        this.participants.forEach(participant => {
            const hasVoted = this.votes.has(participant.id);
            const vote = this.votes.get(participant.id);
            
            const participantEl = document.createElement('div');
            participantEl.className = `participant-card ${hasVoted ? 'voted' : ''}`;
            
            participantEl.innerHTML = `
                <div class="participant-name">${participant.name}</div>
                <div class="participant-status">
                    ${hasVoted ? (this.isRevealed ? '' : 'Voted') : 'Waiting...'}
                </div>
                ${this.isRevealed && vote ? `<div class="participant-vote">${vote.vote}</div>` : ''}
            `;
            
            container.appendChild(participantEl);
        });
    }
    
    castVote(value) {
        if (this.isRevealed) {
            return; // Cannot vote after reveal
        }
        
        this.selectedVote = value;
        
        // Update UI
        document.querySelectorAll('.card-btn').forEach(btn => {
            btn.classList.toggle('selected', btn.dataset.value === value);
        });
        
        this.updateVoteDisplay();
        
        // Send vote to server
        this.socket.emit('cast-vote', { vote: value });
    }
    
    updateVoteDisplay() {
        const display = document.getElementById('your-vote-display');
        
        if (this.selectedVote) {
            display.innerHTML = `<span>Your vote: <strong>${this.selectedVote}</strong></span>`;
            display.classList.add('has-vote');
        } else {
            display.innerHTML = '<span>Select a card to vote</span>';
            display.classList.remove('has-vote');
        }
    }
    
    handleVoteCast(data) {
        // This is handled in renderParticipants via the participants update
        this.renderParticipants();
    }
    
    revealVotes() {
        this.socket.emit('reveal-votes');
    }
    
    resetVotes() {
        this.socket.emit('reset-votes');
    }
    
    handleVotesRevealed(data) {
        this.isRevealed = true;
        
        // Store vote data for results
        data.votes.forEach(voteData => {
            this.votes.set(voteData.participantId, {
                vote: voteData.vote,
                participantName: voteData.participantName
            });
        });
        
        this.renderParticipants();
        this.showResults();
    }
    
    handleVotesReset() {
        this.isRevealed = false;
        this.selectedVote = null;
        this.votes.clear();
        
        // Reset UI
        document.querySelectorAll('.card-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        this.updateVoteDisplay();
        this.renderParticipants();
        this.hideResults();
    }
    
    showResults() {
        const resultsSection = document.getElementById('results-section');
        resultsSection.style.display = 'block';
        
        this.calculateAndDisplayResults();
    }
    
    hideResults() {
        const resultsSection = document.getElementById('results-section');
        resultsSection.style.display = 'none';
    }
    
    calculateAndDisplayResults() {
        const votes = Array.from(this.votes.values()).map(v => v.vote);
        const numericVotes = votes.filter(vote => !isNaN(parseFloat(vote))).map(vote => parseFloat(vote));
        
        // Calculate statistics
        let average = 0;
        let median = 0;
        let mode = '';
        
        if (numericVotes.length > 0) {
            average = numericVotes.reduce((sum, vote) => sum + vote, 0) / numericVotes.length;
            
            const sorted = [...numericVotes].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
            
            // Calculate mode
            const frequency = {};
            votes.forEach(vote => {
                frequency[vote] = (frequency[vote] || 0) + 1;
            });
            mode = Object.keys(frequency).reduce((a, b) => frequency[a] > frequency[b] ? a : b);
        }
        
        // Display summary
        const summaryEl = document.getElementById('results-summary');
        summaryEl.innerHTML = `
            <div class="result-stat">
                <div class="result-stat-value">${average.toFixed(1)}</div>
                <div class="result-stat-label">Average</div>
            </div>
            <div class="result-stat">
                <div class="result-stat-value">${median}</div>
                <div class="result-stat-label">Median</div>
            </div>
            <div class="result-stat">
                <div class="result-stat-value">${mode}</div>
                <div class="result-stat-label">Most Common</div>
            </div>
            <div class="result-stat">
                <div class="result-stat-value">${votes.length}</div>
                <div class="result-stat-label">Total Votes</div>
            </div>
        `;
        
        // Display individual results
        const detailsEl = document.getElementById('results-details');
        detailsEl.innerHTML = '';
        
        this.votes.forEach((voteData, participantId) => {
            const participant = this.participants.get(participantId);
            if (participant) {
                const resultEl = document.createElement('div');
                resultEl.className = 'result-participant';
                resultEl.innerHTML = `
                    <span>${participant.name}</span>
                    <span class="result-vote">${voteData.vote}</span>
                `;
                detailsEl.appendChild(resultEl);
            }
        });
    }
    
    copySessionLink() {
        const link = window.location.href;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(link).then(() => {
                this.showCopyFeedback();
            });
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = link;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            this.showCopyFeedback();
        }
    }
    
    showCopyFeedback() {
        const btn = document.getElementById('copy-link-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.background = '#38a169';
        
        setTimeout(() => {
            btn.textContent = originalText;
            btn.style.background = '';
        }, 2000);
    }
}

// Initialize the room when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new PokerRoom();
});