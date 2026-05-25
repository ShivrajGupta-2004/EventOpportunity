// adminEvents.js - Event Management

class AdminEvents {
    constructor(adminAuth) {
        this.adminAuth = adminAuth;
        this.events = [];
        this.currentEditingEventId = null;
        this.modal = null;
        this.eventForm = null;
    }

    /* ---------- API FUNCTIONS ---------- */

    // Fetch events from MongoDB
    async fetchEvents() {
        try {
            console.log('Fetching events from server...');
            const response = await fetch('http://localhost:5000/api/events', {
                credentials: 'include'
            });

            console.log('Response status:', response.status);

            if (response.ok) {
                const responseText = await response.text();
                console.log('Raw response:', responseText);

                if (responseText.trim() === '') {
                    console.log('Empty response received');
                    this.events = [];
                } else {
                    try {
                        this.events = JSON.parse(responseText);
                        console.log('Parsed events:', this.events);
                    } catch (parseError) {
                        console.error('JSON parse error:', parseError);
                        this.events = [];
                    }
                }
                this.renderEventsTable();
            } else {
                console.error('Failed to fetch events. Status:', response.status);
                const errorText = await response.text();
                console.error('Error response:', errorText);
            }
        } catch (error) {
            console.error('Network error fetching events:', error);
            alert('Failed to connect to server. Make sure server is running on port 5000.');
        }
    }

    // Save event to MongoDB
    async saveEvent(eventData) {
        try {
            console.log('Saving event:', eventData);
            const response = await fetch('http://localhost:5000/api/events', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(eventData)
            });

            console.log('Save response status:', response.status);
            const responseText = await response.text();

            if (response.ok) {
                console.log('Event saved successfully');
                this.adminAuth.showMessage('Event saved successfully!', 'success');
                await this.fetchEvents(); // Refresh the events list
                return true;
            } else {
                let errorMessage = 'Failed to save event';
                if (responseText.trim() !== '') {
                    try {
                        const error = JSON.parse(responseText);
                        errorMessage = error.error || errorMessage;
                    } catch (parseError) {
                        errorMessage = responseText;
                    }
                }
                console.error('Failed to save event:', errorMessage);
                this.adminAuth.showMessage('Failed to save event: ' + errorMessage, 'error');
                return false;
            }
        } catch (error) {
            console.error('Network error saving event:', error);
            this.adminAuth.showMessage('Network error saving event: ' + error.message, 'error');
            return false;
        }
    }

    // Delete event from MongoDB
    async deleteEventFromDB(eventId) {
        try {
            console.log('Deleting event:', eventId);
            const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                console.log('Event deleted successfully');
                this.adminAuth.showMessage('Event deleted successfully!', 'success');
                await this.fetchEvents(); // Refresh the events list
                return true;
            } else {
                const errorText = await response.text();
                console.error('Failed to delete event:', errorText);
                this.adminAuth.showMessage('Failed to delete event: ' + errorText, 'error');
                return false;
            }
        } catch (error) {
            console.error('Network error deleting event:', error);
            this.adminAuth.showMessage('Network error deleting event: ' + error.message, 'error');
            return false;
        }
    }

    /* ---------- EVENT MODAL ---------- */

    initializeModal() {
        this.modal = document.getElementById('eventModal');
        const postEventBtn = document.getElementById('postEventBtn');
        const closeBtn = document.querySelector('.close-btn');
        const cancelBtn = document.getElementById('cancelBtn');
        this.eventForm = document.getElementById('eventForm');
        const modalTitle = document.getElementById('modalTitle');

        postEventBtn.addEventListener('click', () => this.openModal());
        closeBtn.addEventListener('click', () => this.closeModal());
        cancelBtn.addEventListener('click', () => this.closeModal());
        window.addEventListener('click', e => { 
            if (e.target === this.modal) this.closeModal(); 
        });

        // Form submit handler
        // Form submit handler
this.eventForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submitted');

    const formData = new FormData(this.eventForm);

    // 🔥 FIX: Manual ID extraction
    const eventIdInput = document.getElementById('eventId');
    const eventId = eventIdInput ? eventIdInput.value : null;

    const eventData = {
        id: eventId || this.generateEventId(), // ⬅️ FALLBACK IF MISSING
        name: formData.get('eventName'),
        date: formData.get('eventDate'),
        location: formData.get('eventLocation'),
        description: formData.get('eventDescription'),
        type: formData.get('eventType'),
        payment: parseInt(formData.get('eventPayment'), 10),
        timing: formData.get('eventTiming'),
        dressCode: formData.get('dressCode'),
        participants: formData.get('participants')
    };

    console.log('Event data to save:', eventData);
    console.log('Event ID being sent:', eventData.id); // ⬅️ DEBUG

    const success = await this.saveEvent(eventData);
    if (success) {
        this.closeModal();
    }
});
    }

    /* ---------- EVENT ID AUTO GENERATOR ---------- */

generateEventId() {
    // Generate 3 random uppercase letters
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let eventId = '';
    
    for (let i = 0; i < 3; i++) {
        eventId += letters.charAt(Math.floor(Math.random() * letters.length));
    }
    
    // Generate 3 random numbers
    for (let i = 0; i < 3; i++) {
        eventId += Math.floor(Math.random() * 10);
    }
    
    // Check if ID already exists
    const existingEvent = this.events.find(e => e.id === eventId);
    if (existingEvent) {
        // If exists, generate again (recursive)
        return this.generateEventId();
    }
    
    return eventId;
}

    openModal(eventId = null) {
    const modalTitle = document.getElementById('modalTitle');
    const modalSubtitle = document.querySelector('.modal-subtitle');
    this.modal.style.display = 'block';
    this.currentEditingEventId = eventId;
    
    if (eventId) {
        // EDIT MODE
        modalTitle.textContent = 'Edit Event';
        if (modalSubtitle) {
            modalSubtitle.textContent = 'Update event details';
        }
        const event = this.events.find(e => e.id === eventId);
        if (event) {
            this.populateForm(event);
        }
    } else {
        // NEW EVENT MODE
        modalTitle.textContent = 'Post New Event';
        if (modalSubtitle) {
            modalSubtitle.textContent = 'Fill in the details to create an amazing event';
        }
        this.eventForm.reset();
        
        // 🔥 AUTO-GENERATE EVENT ID
        const eventIdInput = document.getElementById('eventId');
        if (eventIdInput) {
            eventIdInput.value = this.generateEventId();
            console.log('Generated Event ID:', eventIdInput.value);
        }
    }
}

    closeModal() {
        this.modal.style.display = 'none';
        this.currentEditingEventId = null;
        this.eventForm.reset();
    }

    populateForm(event) {
        document.getElementById('eventId').value = event.id;
        document.getElementById('eventName').value = event.name;
        document.getElementById('eventDate').value = event.date.split('T')[0];
        document.getElementById('eventLocation').value = event.location;
        document.getElementById('eventType').value = event.type;
        document.getElementById('eventPayment').value = event.payment;
        document.getElementById('eventTiming').value = event.timing;
        document.getElementById('dressCode').value = event.dressCode;
        document.getElementById('participants').value = event.participants;
        document.getElementById('eventDescription').value = event.description;
    }

    /* ---------- TABLE RENDERING ---------- */

    renderEventsTable() {
    const tbody = document.getElementById('eventsTableBody');
    if (!tbody) {
        console.error('Events table body not found');
        return;
    }

    tbody.innerHTML = '';
    console.log('Rendering events table with', this.events.length, 'events');

    this.events.forEach(ev => {
        const tr = document.createElement('tr');
        const eventDate = new Date(ev.date);
        tr.innerHTML = `
    <td>${ev.name}</td>
    <td><span style="font-family: monospace;">${ev.id}</span></td>
    <td>${eventDate.toLocaleDateString()}</td>
    <td>${ev.location}</td>
    <td>${ev.description || 'N/A'}</td>
    <td class="table-actions">
        <button class="btn btn-small btn-edit" onclick="adminEvents.editEvent('${ev.id}')">Edit</button>
        <button class="btn btn-small btn-delete" onclick="adminEvents.deleteEvent('${ev.id}')">Delete</button>
    </td>`;
        tbody.appendChild(tr);
    });
}
    

    /* ---------- EVENT ACTIONS ---------- */

    editEvent(id) {
        this.openModal(id);
    }

    async deleteEvent(id) {
        if (confirm('Are you sure you want to delete this event?')) {
            await this.deleteEventFromDB(id);
        }
    }

    /* ---------- SERVER CONNECTION TEST ---------- */

    testServerConnection() {
        setTimeout(() => {
            console.log('Testing server connection...');
            fetch('http://localhost:5000/api/events', {
                credentials: 'include'
            })
                .then(response => {
                    console.log('Server connection test - Status:', response.status);
                    return response.text();
                })
                .then(text => {
                    console.log('Server connection test - Response:', text);
                })
                .catch(error => {
                    console.error('Server connection test failed:', error);
                    alert('Cannot connect to server. Please make sure:\n1. Server is running (node server.js)\n2. Server is running on port 5000\n3. MongoDB is running');
                });
        }, 1000);
    }

    /* ---------- INITIALIZATION ---------- */

    async initialize() {
        this.initializeModal();
        await this.fetchEvents();
        this.testServerConnection();
        this.initializeSearch();
    }

    // Get events array
    getEvents() {
        return this.events;
    }

    // Set events array
    setEvents(events) {
        this.events = events;
    }
    initializeSearch() {
    const searchInput = document.getElementById('eventsSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            this.filterEvents(e.target.value);
        });
    }
}

filterEvents(searchTerm) {
    const tbody = document.getElementById('eventsTableBody');
    if (!tbody) return;

    const rows = tbody.querySelectorAll('tr');
    const term = searchTerm.toLowerCase().trim();

    rows.forEach(row => {
        const eventName = row.cells[0]?.textContent.toLowerCase() || '';
        const eventId = row.cells[1]?.textContent.toLowerCase() || '';
        
        const isVisible = eventName.includes(term) || eventId.includes(term);
        row.style.display = isVisible ? '' : 'none';
    });
}

}