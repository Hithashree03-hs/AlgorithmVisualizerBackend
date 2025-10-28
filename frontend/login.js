document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevents the page from reloading on form submission

    // Get the trimmed values from the input fields
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const messageDisplay = document.getElementById('message');

    // --- EITHER/OR VALIDATION ---
    
    // Check if the user has provided NEITHER an email NOR a phone number
    if (!email && !phone) {
        messageDisplay.textContent = 'Please enter either your Email/Gmail or your Phone Number to proceed.';
        return;
    }
    
    // Clear any previous error message
    messageDisplay.textContent = '';
    
    // --- SIMULATED AUTHENTICATION ---
    
    // 1. Set a flag in local storage to indicate the user is "logged in".
    localStorage.setItem('isLoggedIn', 'true');
    
    // 2. Display success message briefly before redirecting.
    messageDisplay.textContent = 'Login successful! Redirecting to Visualizer...';
    messageDisplay.style.color = '#00010bf1'; // Green success message

    setTimeout(() => {
        // 3. Redirect the user to the main application page.
        window.location.href = 'index.html'; 
    }, 700); // 0.7 second delay for the user to see the success message
});