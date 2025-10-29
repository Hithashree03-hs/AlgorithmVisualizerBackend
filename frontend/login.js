document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault(); 

   
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const messageDisplay = document.getElementById('message');

     
    if (!email && !phone) {
        messageDisplay.textContent = 'Please enter either your Email/Gmail or your Phone Number to proceed.';
        return;
    }

    messageDisplay.textContent = '';
    
   
    localStorage.setItem('isLoggedIn', 'true');
    
   
    messageDisplay.textContent = 'Login successful! Redirecting to Visualizer...';
    messageDisplay.style.color = '#00010bf1'; 

    setTimeout(() => {
        
        window.location.href = 'index.html'; 
    }, 700); 
});