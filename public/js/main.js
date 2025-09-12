// Landing page JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const createSessionForm = document.getElementById('create-session-form');
    const joinSessionForm = document.getElementById('join-session-form');
    
    // Handle create session form
    createSessionForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const sessionName = document.getElementById('session-name').value.trim();
        const userName = document.getElementById('your-name').value.trim();
        
        if (!sessionName || !userName) {
            alert('Please fill in all fields');
            return;
        }
        
        try {
            const response = await fetch('/api/create-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sessionName })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Store user name in sessionStorage for the room
                sessionStorage.setItem('userName', userName);
                
                // Redirect to the new session
                window.location.href = `/room/${data.sessionId}`;
            } else {
                alert('Failed to create session: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error creating session:', error);
            alert('Failed to create session. Please try again.');
        }
    });
    
    // Handle join session form
    joinSessionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const sessionId = document.getElementById('session-id').value.trim();
        const userName = document.getElementById('join-name').value.trim();
        
        if (!sessionId || !userName) {
            alert('Please fill in all fields');
            return;
        }
        
        // Store user name in sessionStorage for the room
        sessionStorage.setItem('userName', userName);
        
        // Redirect to the session
        window.location.href = `/room/${sessionId}`;
    });
    
    // Auto-fill session ID if it's in the URL hash
    const urlHash = window.location.hash.substring(1);
    if (urlHash) {
        document.getElementById('session-id').value = urlHash;
    }
});