let cart = JSON.parse(localStorage.getItem('cart')) || [];
let hires = JSON.parse(localStorage.getItem('hires')) || [];
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let viewedStates = JSON.parse(localStorage.getItem('viewedStates')) || {
    cartViewed: true,
    hiresViewed: true,
    ordersViewed: true
};
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    updateCartUI();
    updateHireUI();
    updateOrdersUI();
    setupEventListeners();
    setupPaymentListeners();
    setupHirePaymentListeners();
    updateNotificationIndicators();
    checkAuthState(); 
}
function isUserLoggedIn() {
    return localStorage.getItem('currentUser') !== null;
}
function requireAuth(action, callback) {
    if (!isUserLoggedIn()) {
        showNotification(`Please login or register to ${action}`, 'error');
        localStorage.setItem('pendingAction', JSON.stringify({
            action: action,
            callback: callback.toString()
        }));
        openPanel('loginPanel');
        return false;
    }
    return true;
}

function setupEventListeners() {
    document.getElementById('exploreBtn').addEventListener('click', function() {
        document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('exploreProfessions').addEventListener('click', function() {
        document.getElementById('profession').scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('cartBtn').addEventListener('click', function() {
        openPanel('cartPanel');
        collapseFloatingButtons();
        markAsViewed('cart');
    });

    document.getElementById('hireBtn').addEventListener('click', function() {
        openPanel('hirePanel');
        collapseFloatingButtons();
        markAsViewed('hires');
    });
    document.getElementById('ordersBtn').addEventListener('click', function() {
        openPanel('ordersPanel');
        collapseFloatingButtons();
        markAsViewed('orders');
    });

    document.getElementById('loginBtn').addEventListener('click', function() {
        openPanel('loginPanel');
        collapseFloatingButtons();
    });

    document.getElementById('registerBtn').addEventListener('click', function() {
        openPanel('registerPanel');
        collapseFloatingButtons();
    });

    document.getElementById('profileBtn').addEventListener('click', function(e) {
        e.preventDefault();
        openProfilePanel();
        collapseFloatingButtons();
    });

    document.getElementById('logoutBtn').addEventListener('click', function(e) {
        e.preventDefault();
        logout();
    });

    document.getElementById('loginForm').addEventListener('submit', function(e) {
        e.preventDefault();
        login();
    });

    document.getElementById('registerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        register();
    });
    document.getElementById('contactForm').addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (!requireAuth('send messages', function() {
            document.getElementById('contactForm').dispatchEvent(new Event('submit'));
        })) {
            return;
        }
        
        const submitBtn = this.querySelector('.btn-send');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Sending...';
        submitBtn.disabled = true;
        const formData = new FormData(this);
        
        fetch('https://formspree.io/f/mblzpnqp', {
            method: 'POST',
            body: formData,
            headers: {
                'Accept': 'application/json'
            }
        })
        .then(response => {
            if (response.ok) {
                showNotification('Thank you! Your message has been sent successfully.', 'success');
                this.reset();
            } else {
                showNotification('There was a problem sending your message. Please try again.', 'error');
            }
        })
        .catch(error => {
            showNotification('There was a problem sending your message. Please try again.', 'error');
        })
        .finally(() => {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        });
    });

    document.querySelector('.mobile-menu-btn').addEventListener('click', function() {
        const nav = document.querySelector('nav ul');
        nav.classList.toggle('show');
    });
    document.querySelectorAll('.btn-buy').forEach(button => {
        button.addEventListener('click', function() {
            const panelId = this.getAttribute('data-panel');
            if (panelId) {
                openPanel(panelId);
                collapseFloatingButtons();
            }
        });
    });
    document.querySelectorAll('.btn-overlay').forEach(button => {
        button.addEventListener('click', function() {
            const panelId = this.getAttribute('data-panel');
            if (panelId) {
                openPanel(panelId);
                collapseFloatingButtons();
            }
        });
    });
    document.querySelectorAll('.product-item[data-subslide]').forEach(item => {
        item.addEventListener('click', function() {
            const subslideId = this.getAttribute('data-subslide');
            if (subslideId) {
                openPanel(subslideId);
                collapseFloatingButtons();
            }
        });
    });
    document.querySelectorAll('.btn-hire').forEach(button => {
        button.addEventListener('click', function() {
            const panelId = this.getAttribute('data-panel');
            if (panelId) {
                openPanel(panelId);
                collapseFloatingButtons();
            }
        });
    });
    document.querySelectorAll('.close-btn').forEach(button => {
        button.addEventListener('click', function() {
            const panel = this.closest('.slide-panel');
            if (panel) {
                closePanel(panel.id);
            }
        });
    });
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('slide-panel')) {
            closePanel(e.target.id);
        }
    });
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-rate') || e.target.closest('.btn-rate')) {
            const button = e.target.classList.contains('btn-rate') ? e.target : e.target.closest('.btn-rate');
            const professionalId = button.getAttribute('data-professional-id');
            if (professionalId) {
                openRatingPanel(professionalId);
            }
        }
    });
}
function saveUserAddress(address, addressType = 'delivery') {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        if (!user.addresses) {
            user.addresses = {};
        }
        user.addresses[addressType] = address;
        if (addressType === 'delivery') {
            user.addresses.hiring = address;
        } else if (addressType === 'hiring') {
            user.addresses.delivery = address;
        }
        
        localStorage.setItem('currentUser', JSON.stringify(user));
    }
    return address;
}

function getUserAddress(addressType = 'delivery') {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    return user && user.addresses ? user.addresses[addressType] : null;
}

function showDeliveryAddressForm(callback) {
    const existingAddress = getUserAddress('delivery');
    
    const addressContent = `
        <div class="address-selection">
            <h3>Choose Delivery Address</h3>
            ${existingAddress ? `
            <div class="address-option" onclick="selectAddressOption('delivery', 'existing')">
                <div class="address-option-header">
                    <input type="radio" name="deliveryAddress" id="existingDeliveryAddress" checked>
                    <strong>Use Existing Address</strong>
                </div>
                <div class="address-details">
                    <p>${existingAddress.fullName}</p>
                    <p>${existingAddress.line1}, ${existingAddress.line2 ? existingAddress.line2 + ', ' : ''}${existingAddress.city}, ${existingAddress.state} - ${existingAddress.pincode}</p>
                    <p>Phone: ${existingAddress.phone}</p>
                </div>
            </div>
            ` : ''}
            <div class="address-option" onclick="selectAddressOption('delivery', 'new')">
                <div class="address-option-header">
                    <input type="radio" name="deliveryAddress" id="newDeliveryAddress" ${!existingAddress ? 'checked' : ''}>
                    <strong>${existingAddress ? 'Add New Address' : 'Add Address'}</strong>
                </div>
                <p>${existingAddress ? 'Enter a new delivery address' : 'Enter your delivery address'}</p>
            </div>
            <div class="address-actions">
                <button class="btn-save-address" onclick="processDeliveryAddressSelection()">Continue</button>
                <button class="btn-cancel-address" onclick="closePanel('deliveryAddressPanel')">Cancel</button>
            </div>
        </div>
    `;
    
    document.getElementById('deliveryAddressContent').innerHTML = addressContent;
    window.deliveryAddressCallback = callback;
    window.selectedDeliveryAddressOption = existingAddress ? 'existing' : 'new';
    openPanel('deliveryAddressPanel');
}

function selectAddressOption(addressType, option) {
    if (addressType === 'delivery') {
        window.selectedDeliveryAddressOption = option;
        document.getElementById('existingDeliveryAddress').checked = option === 'existing';
        document.getElementById('newDeliveryAddress').checked = option === 'new';
    } else {
        window.selectedHiringAddressOption = option;
        document.getElementById('existingHiringAddress').checked = option === 'existing';
        document.getElementById('newHiringAddress').checked = option === 'new';
    }
}

function processDeliveryAddressSelection() {
    if (window.selectedDeliveryAddressOption === 'existing') {
        closePanel('deliveryAddressPanel');
        if (typeof window.deliveryAddressCallback === 'function') {
            window.deliveryAddressCallback();
        }
    } else {
        showNewDeliveryAddressForm();
    }
}

function showNewDeliveryAddressForm() {
    const existingAddress = getUserAddress('delivery');
    
    const addressContent = `
        <div class="address-form">
            <h3>${existingAddress ? 'Add New Delivery Address' : 'Enter Delivery Address'}</h3>
            <p class="form-description">This address will be saved for both deliveries and service bookings</p>
            <div class="form-group">
                <label for="deliveryFullName">Full Name *</label>
                <input type="text" id="deliveryFullName" placeholder="Enter your full name" value="" required>
            </div>
            <div class="form-group">
                <label for="deliveryPhone">Phone Number *</label>
                <input type="tel" id="deliveryPhone" placeholder="Enter your phone number" value="" required>
            </div>
            <div class="form-group">
                <label for="deliveryLine1">Address Line 1 *</label>
                <input type="text" id="deliveryLine1" placeholder="House/Flat No., Building Name" value="" required>
            </div>
            <div class="form-group">
                <label for="deliveryLine2">Address Line 2 (Optional)</label>
                <input type="text" id="deliveryLine2" placeholder="Street Name, Area" value="">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="deliveryCity">City *</label>
                    <input type="text" id="deliveryCity" placeholder="City" value="" required>
                </div>
                <div class="form-group">
                    <label for="deliveryState">State *</label>
                    <input type="text" id="deliveryState" placeholder="State" value="" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="deliveryPincode">Pincode *</label>
                    <input type="text" id="deliveryPincode" placeholder="Pincode" value="" required>
                </div>
                <div class="form-group">
                    <label for="deliveryLandmark">Landmark (Optional)</label>
                    <input type="text" id="deliveryLandmark" placeholder="Nearby landmark" value="">
                </div>
            </div>
            <div class="form-group">
                <label for="deliveryType">Address Type</label>
                <select id="deliveryType">
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div class="address-actions">
                <button class="btn-save-address" onclick="saveNewDeliveryAddress()">Save & Continue</button>
                <button class="btn-cancel-address" onclick="showDeliveryAddressForm(window.deliveryAddressCallback)">Back to Selection</button>
            </div>
        </div>
    `;
    
    document.getElementById('deliveryAddressContent').innerHTML = addressContent;
}

function saveNewDeliveryAddress() {
    const address = {
        fullName: document.getElementById('deliveryFullName').value,
        phone: document.getElementById('deliveryPhone').value,
        line1: document.getElementById('deliveryLine1').value,
        line2: document.getElementById('deliveryLine2').value,
        city: document.getElementById('deliveryCity').value,
        state: document.getElementById('deliveryState').value,
        pincode: document.getElementById('deliveryPincode').value,
        landmark: document.getElementById('deliveryLandmark').value,
        type: document.getElementById('deliveryType').value
    };
    
    if (!address.fullName || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    if (address.phone.length !== 10 || !/^\d+$/.test(address.phone)) {
        showNotification('Please enter a valid 10-digit phone number', 'error');
        return;
    }
    if (address.pincode.length !== 6 || !/^\d+$/.test(address.pincode)) {
        showNotification('Please enter a valid 6-digit pincode', 'error');
        return;
    }
    saveUserAddress(address, 'delivery');
    showNotification('New address saved successfully for both deliveries and service bookings!', 'success');
    
    closePanel('deliveryAddressPanel');
    
    if (typeof window.deliveryAddressCallback === 'function') {
        window.deliveryAddressCallback();
    }
}

function showHiringAddressForm(callback) {
    const existingAddress = getUserAddress('hiring');
    
    const addressContent = `
        <div class="address-selection">
            <h3>Choose Service Address</h3>
            ${existingAddress ? `
            <div class="address-option" onclick="selectAddressOption('hiring', 'existing')">
                <div class="address-option-header">
                    <input type="radio" name="hiringAddress" id="existingHiringAddress" checked>
                    <strong>Use Existing Address</strong>
                </div>
                <div class="address-details">
                    <p>${existingAddress.fullName}</p>
                    <p>${existingAddress.line1}, ${existingAddress.line2 ? existingAddress.line2 + ', ' : ''}${existingAddress.city}, ${existingAddress.state} - ${existingAddress.pincode}</p>
                    <p>Phone: ${existingAddress.phone}</p>
                </div>
            </div>
            ` : ''}
            <div class="address-option" onclick="selectAddressOption('hiring', 'new')">
                <div class="address-option-header">
                    <input type="radio" name="hiringAddress" id="newHiringAddress" ${!existingAddress ? 'checked' : ''}>
                    <strong>${existingAddress ? 'Add New Address' : 'Add Address'}</strong>
                </div>
                <p>${existingAddress ? 'Enter a new service address' : 'Enter your service address'}</p>
            </div>
            <div class="address-actions">
                <button class="btn-save-address" onclick="processHiringAddressSelection()">Continue</button>
                <button class="btn-cancel-address" onclick="closePanel('hiringAddressPanel')">Cancel</button>
            </div>
        </div>
    `;
    
    document.getElementById('hiringAddressContent').innerHTML = addressContent;
    window.hiringAddressCallback = callback;
    window.selectedHiringAddressOption = existingAddress ? 'existing' : 'new';
    openPanel('hiringAddressPanel');
}

function processHiringAddressSelection() {
    if (window.selectedHiringAddressOption === 'existing') {
        closePanel('hiringAddressPanel');
        if (typeof window.hiringAddressCallback === 'function') {
            window.hiringAddressCallback();
        }
    } else {
        showNewHiringAddressForm();
    }
}

function showNewHiringAddressForm() {
    const existingAddress = getUserAddress('hiring');
    
    const addressContent = `
        <div class="address-form">
            <h3>${existingAddress ? 'Add New Service Address' : 'Enter Service Address'}</h3>
            <p class="form-description">This address will be saved for both service bookings and deliveries</p>
            <div class="form-group">
                <label for="hiringFullName">Full Name *</label>
                <input type="text" id="hiringFullName" placeholder="Enter your full name" value="" required>
            </div>
            <div class="form-group">
                <label for="hiringPhone">Phone Number *</label>
                <input type="tel" id="hiringPhone" placeholder="Enter your phone number" value="" required>
            </div>
            <div class="form-group">
                <label for="hiringLine1">Service Address Line 1 *</label>
                <input type="text" id="hiringLine1" placeholder="House/Flat No., Building Name" value="" required>
            </div>
            <div class="form-group">
                <label for="hiringLine2">Service Address Line 2</label>
                <input type="text" id="hiringLine2" placeholder="Street Name, Area" value="">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="hiringCity">City *</label>
                    <input type="text" id="hiringCity" placeholder="City" value="" required>
                </div>
                <div class="form-group">
                    <label for="hiringState">State *</label>
                    <input type="text" id="hiringState" placeholder="State" value="" required>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label for="hiringPincode">Pincode *</label>
                    <input type="text" id="hiringPincode" placeholder="Pincode" value="" required>
                </div>
                <div class="form-group">
                    <label for="hiringLandmark">Landmark (Optional)</label>
                    <input type="text" id="hiringLandmark" placeholder="Nearby landmark" value="">
                </div>
            </div>
            <div class="form-group">
                <label for="hiringType">Service Address Type</label>
                <select id="hiringType">
                    <option value="home">Home</option>
                    <option value="work">Work</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div class="address-actions">
                <button class="btn-save-address" onclick="saveNewHiringAddress()">Save & Continue</button>
                <button class="btn-cancel-address" onclick="showHiringAddressForm(window.hiringAddressCallback)">Back to Selection</button>
            </div>
        </div>
    `;
    
    document.getElementById('hiringAddressContent').innerHTML = addressContent;
}

function saveNewHiringAddress() {
    const address = {
        fullName: document.getElementById('hiringFullName').value,
        phone: document.getElementById('hiringPhone').value,
        line1: document.getElementById('hiringLine1').value,
        line2: document.getElementById('hiringLine2').value,
        city: document.getElementById('hiringCity').value,
        state: document.getElementById('hiringState').value,
        pincode: document.getElementById('hiringPincode').value,
        landmark: document.getElementById('hiringLandmark').value,
        type: document.getElementById('hiringType').value
    };
    if (!address.fullName || !address.phone || !address.line1 || !address.city || !address.state || !address.pincode) {
        showNotification('Please fill all required fields', 'error');
        return;
    }
    
    if (address.phone.length !== 10 || !/^\d+$/.test(address.phone)) {
        showNotification('Please enter a valid 10-digit phone number', 'error');
        return;
    }
    if (address.pincode.length !== 6 || !/^\d+$/.test(address.pincode)) {
        showNotification('Please enter a valid 6-digit pincode', 'error');
        return;
    }
    saveUserAddress(address, 'hiring');
    showNotification('New address saved successfully for both service bookings and deliveries!', 'success');
    
    closePanel('hiringAddressPanel');
    if (typeof window.hiringAddressCallback === 'function') {
        window.hiringAddressCallback();
    }
}
function checkAuthState() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        showUserMenu(user);
        showWelcomeMessage();
        const pendingAction = localStorage.getItem('pendingAction');
        if (pendingAction) {
            try {
                const actionData = JSON.parse(pendingAction);
                showNotification(`Welcome back! You can now ${actionData.action}.`, 'success');
                localStorage.removeItem('pendingAction');
            } catch (e) {
                console.error('Error processing pending action:', e);
            }
        }
    } else {
        showAuthButtons();
    }
}

function showUserMenu(user) {
    document.getElementById('loginBtn').style.display = 'none';
    document.getElementById('registerBtn').style.display = 'none';
    document.getElementById('userMenu').style.display = 'flex';
    const capitalizedName = user.name.split(' ')[0].charAt(0).toUpperCase() + 
                           user.name.split(' ')[0].slice(1).toLowerCase();
    
    document.getElementById('userName').textContent = capitalizedName;
}

function showAuthButtons() {
    document.getElementById('loginBtn').style.display = 'block';
    document.getElementById('registerBtn').style.display = 'block';
    document.getElementById('userMenu').style.display = 'none';
}

function showWelcomeMessage() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
        const logo = document.querySelector('.logo');
        const logoText = document.getElementById('logoText');
        const originalContent = logoText.textContent;
        const capitalizedName = user.name.split(' ')[0].charAt(0).toUpperCase() + 
                               user.name.split(' ')[0].slice(1).toLowerCase();
        logoText.textContent = `Welcome, ${capitalizedName}`;
        logo.classList.add('welcome-mode');
        setTimeout(() => {
            logo.classList.remove('welcome-mode');
            logo.classList.add('final-mode');
            setTimeout(() => {
                logoText.textContent = originalContent;
                logo.classList.remove('final-mode');
            }, 500);
        }, 5000); 
    }
}

function login() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.email === email && u.password === password);
    
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
        showUserMenu(user);
        closePanel('loginPanel');
        showNotification(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
        showWelcomeMessage();
        document.getElementById('loginForm').reset();
        checkAuthState();
    } else {
        showNotification('Invalid email or password. Please try again.', 'error');
    }
}

function register() {
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const phone = document.getElementById('registerPhone').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('Password must be at least 6 characters long!', 'error');
        return;
    }
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.find(u => u.email === email)) {
        showNotification('User with this email already exists!', 'error');
        return;
    }
    const newUser = {
        id: 'user_' + Date.now(),
        name: name,
        email: email,
        phone: phone,
        password: password,
        joinDate: new Date().toLocaleDateString('en-IN'),
        orders: [],
        hires: []
    };
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    showUserMenu(newUser);
    closePanel('registerPanel');
    const capitalizedName = name.split(' ')[0].charAt(0).toUpperCase() + 
                           name.split(' ')[0].slice(1).toLowerCase();
    
    showNotification(`Account created successfully! Welcome to Atmanirbhar Store, ${capitalizedName}!`, 'success');
    showWelcomeMessage();
    document.getElementById('registerForm').reset();
    checkAuthState();
}

function logout() {
    localStorage.removeItem('currentUser');
    showAuthButtons();
    showNotification('You have been logged out successfully.', 'success');
    closeAllPanels();
}

function openProfilePanel() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        showNotification('Please login to view your profile.', 'error');
        return;
    }
    
    const profileContent = document.getElementById('profileContent');
    profileContent.innerHTML = `
        <div class="profile-info">
            <h3>Personal Information</h3>
            <div class="profile-detail">
                <span>Full Name:</span>
                <strong>${user.name}</strong>
            </div>
            <div class="profile-detail">
                <span>Email:</span>
                <strong>${user.email}</strong>
            </div>
            <div class="profile-detail">
                <span>Phone:</span>
                <strong>${user.phone}</strong>
            </div>
            <div class="profile-detail">
                <span>Member Since:</span>
                <strong>${user.joinDate}</strong>
            </div>
        </div>
        <div class="profile-info">
            <h3>Account Statistics</h3>
            <div class="profile-detail">
                <span>Total Orders:</span>
                <strong>${orders.length}</strong>
            </div>
            <div class="profile-detail">
                <span>Active Hires:</span>
                <strong>${hires.filter(h => h.status === 'hired').length}</strong>
            </div>
            <div class="profile-detail">
                <span>Cart Items:</span>
                <strong>${cart.reduce((sum, item) => sum + item.quantity, 0)}</strong>
            </div>
        </div>
        ${user.addresses && user.addresses.delivery ? `
        <div class="profile-info">
            <h3>Delivery Address</h3>
            <div class="profile-detail">
                <span>Address:</span>
                <strong>${user.addresses.delivery.line1}, ${user.addresses.delivery.line2 ? user.addresses.delivery.line2 + ', ' : ''}${user.addresses.delivery.city}, ${user.addresses.delivery.state} - ${user.addresses.delivery.pincode}</strong>
            </div>
            <div class="profile-detail">
                <span>Phone:</span>
                <strong>${user.addresses.delivery.phone}</strong>
            </div>
        </div>
        ` : ''}
        ${user.addresses && user.addresses.hiring ? `
        <div class="profile-info">
            <h3>Hiring Address</h3>
            <div class="profile-detail">
                <span>Service Address:</span>
                <strong>${user.addresses.hiring.line1}, ${user.addresses.hiring.line2 ? user.addresses.hiring.line2 + ', ' : ''}${user.addresses.hiring.city}, ${user.addresses.hiring.state} - ${user.addresses.hiring.pincode}</strong>
            </div>
            <div class="profile-detail">
                <span>Phone:</span>
                <strong>${user.addresses.hiring.phone}</strong>
            </div>
        </div>
        ` : ''}
    `;
    
    openPanel('profilePanel');
}
function markAsViewed(panelType) {
    switch(panelType) {
        case 'cart':
            viewedStates.cartViewed = true;
            break;
        case 'hires':
            viewedStates.hiresViewed = true;
            break;
        case 'orders':
            viewedStates.ordersViewed = true;
            break;
    }
    localStorage.setItem('viewedStates', JSON.stringify(viewedStates));
    updateNotificationIndicators();
}
function resetNotifications(panelType) {
    switch(panelType) {
        case 'cart':
            viewedStates.cartViewed = false;
            break;
        case 'hires':
            viewedStates.hiresViewed = false;
            break;
        case 'orders':
            viewedStates.ordersViewed = false;
            break;
    }
    localStorage.setItem('viewedStates', JSON.stringify(viewedStates));
    updateNotificationIndicators();
}
function updateNotificationIndicators() {
    const cartCount = document.getElementById('cartIndicator');
    const hireCount = document.getElementById('hireIndicator');
    const ordersCount = document.getElementById('ordersIndicator');
    const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartCount) {
        if (totalCartItems > 0 && !viewedStates.cartViewed) {
            cartCount.textContent = totalCartItems;
            cartCount.style.display = 'flex';
        } else {
            cartCount.style.display = 'none';
        }
    }
    const totalHires = hires.reduce((sum, hire) => sum + hire.days, 0);
    if (hireCount) {
        if (totalHires > 0 && !viewedStates.hiresViewed) {
            hireCount.textContent = totalHires;
            hireCount.style.display = 'flex';
        } else {
            hireCount.style.display = 'none';
        }
    }
    if (ordersCount) {
        if (orders.length > 0 && !viewedStates.ordersViewed) {
            ordersCount.textContent = orders.length;
            ordersCount.style.display = 'flex';
        } else {
            ordersCount.style.display = 'none';
        }
    }
}
function setupPaymentListeners() {
    const paymentMethods = document.querySelectorAll('input[name="payment"]');
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            updatePaymentForm(this.value);
        });
    });
}
function setupHirePaymentListeners() {
    const paymentMethods = document.querySelectorAll('input[name="hirePayment"]');
    
    paymentMethods.forEach(method => {
        method.addEventListener('change', function() {
            updateHirePaymentForm(this.value);
        });
    });
}
function updatePaymentForm(method) {
    document.getElementById('cardForm').style.display = 'none';
    document.getElementById('upiForm').style.display = 'none';
    document.getElementById('codMessage').style.display = 'none';
    switch(method) {
        case 'card':
            document.getElementById('cardForm').style.display = 'block';
            break;
        case 'upi':
            document.getElementById('upiForm').style.display = 'block';
            break;
        case 'cod':
            document.getElementById('codMessage').style.display = 'block';
            break;
    }
}
function updateHirePaymentForm(method) {
    document.getElementById('hireCardForm').style.display = 'none';
    document.getElementById('hireUpiForm').style.display = 'none';
    document.getElementById('hireCodMessage').style.display = 'none';
    
    switch(method) {
        case 'card':
            document.getElementById('hireCardForm').style.display = 'block';
            break;
        case 'upi':
            document.getElementById('hireUpiForm').style.display = 'block';
            break;
        case 'cod':
            document.getElementById('hireCodMessage').style.display = 'block';
            break;
    }
}
function collapseFloatingButtons() {
    const floatingButtons = document.querySelector('.floating-buttons');
    floatingButtons.classList.add('collapsed');
}

function expandFloatingButtons() {
    const floatingButtons = document.querySelector('.floating-buttons');
    floatingButtons.classList.remove('collapsed');
}
function openPanel(panelId) {
    closeAllPanels();
    
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.classList.add('open');
        document.body.style.overflow = 'hidden';
        collapseFloatingButtons();
    }
}

function closePanel(panelId) {
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.classList.remove('open');
        
        const openPanels = document.querySelectorAll('.slide-panel.open');
        if (openPanels.length === 0) {
            document.body.style.overflow = 'auto';
            expandFloatingButtons();
        }
    }
}

function closeAllPanels() {
    document.querySelectorAll('.slide-panel').forEach(panel => {
        panel.classList.remove('open');
    });
    document.body.style.overflow = 'auto';
    expandFloatingButtons();
}

function addToCart(product) {
    if (!requireAuth('add items to cart', function() {
        addToCart(product);
    })) {
        return;
    }
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    resetNotifications('cart');
    showNotification(`${product.name} added to cart!`, 'success');
    const currentSubSlide = document.querySelector('.sub-slide.open');
    if (currentSubSlide) {
        closePanel(currentSubSlide.id);
    }
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartUI();
    showNotification('Item removed from cart', 'success');
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity += change;
        
        if (item.quantity <= 0) {
            removeFromCart(productId);
            return;
        }
        
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartUI();
    }
}

function clearCart() {
    cart = [];
    localStorage.removeItem('cart');
    updateCartUI();
    showNotification('Cart cleared', 'success');
}

function updateCartUI() {
    const cartItems = document.getElementById('cartItems');
    const cartTotal = document.getElementById('cartTotal');
    if (cartItems) {
        cartItems.innerHTML = '';
        
        if (cart.length === 0) {
            cartItems.innerHTML = '<p class="empty-cart">Your cart is empty</p>';
            if (cartTotal) cartTotal.textContent = '0';
            viewedStates.cartViewed = true;
            localStorage.setItem('viewedStates', JSON.stringify(viewedStates));
            updateNotificationIndicators();
            return;
        }

        let total = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const cartItem = document.createElement('div');
            cartItem.className = 'cart-item';
            cartItem.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>₹${item.price} × ${item.quantity}</p>
                </div>
                <div class="cart-item-controls">
                    <button onclick="updateQuantity('${item.id}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="updateQuantity('${item.id}', 1)">+</button>
                    <button class="remove-btn" onclick="removeFromCart('${item.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="cart-item-total">₹${itemTotal}</div>
            `;
            
            cartItems.appendChild(cartItem);
        });
        
        if (cartTotal) cartTotal.textContent = total;
    }
    
    updateNotificationIndicators();
}

function hireProfessional(professional) {
    if (!requireAuth('hire professionals', function() {
        hireProfessional(professional);
    })) {
        return;
    }
    const existingHire = hires.find(hire => hire.id === professional.id);
    
    if (existingHire) {
        existingHire.days += 1;
    } else {
        hires.push({
            id: professional.id,
            name: professional.name,
            profession: professional.profession,
            price: professional.price,
            days: 1,
            phone: professional.phone,
            image: professional.image,
            status: 'hired', 
            userRating: 0
        });
    }
    localStorage.setItem('hires', JSON.stringify(hires));
    updateHireUI();
    resetNotifications('hires');
    showNotification(`${professional.name} hired successfully!`, 'success');
    const currentSubSlide = document.querySelector('.sub-slide.open');
    if (currentSubSlide) {
        closePanel(currentSubSlide.id);
    }
}

function removeFromHires(professionalId) {
    hires = hires.filter(hire => hire.id !== professionalId);
    localStorage.setItem('hires', JSON.stringify(hires));
    updateHireUI();
    showNotification('Professional removed from hires', 'success');
}

function updateHireDays(professionalId, change) {
    const hire = hires.find(hire => hire.id === professionalId);
    if (hire) {
        hire.days += change;
        
        if (hire.days <= 0) {
            removeFromHires(professionalId);
            return;
        }
        
        localStorage.setItem('hires', JSON.stringify(hires));
        updateHireUI();
    }
}

function clearHires() {
    hires = [];
    localStorage.removeItem('hires');
    updateHireUI();
    showNotification('All hires cleared', 'success');
}

function updateHireUI() {
    const hireItems = document.getElementById('hireItems');
    const hireTotal = document.getElementById('hireTotal');

    if (hireItems) {
        hireItems.innerHTML = '';
        
        if (hires.length === 0) {
            hireItems.innerHTML = '<p class="empty-hire">You haven\'t hired any professionals yet</p>';
            if (hireTotal) hireTotal.textContent = '0';
            viewedStates.hiresViewed = true;
            localStorage.setItem('viewedStates', JSON.stringify(viewedStates));
            updateNotificationIndicators();
            return;
        }

        let total = 0;
        
        hires.forEach(hire => {
            const hireTotal = hire.price * hire.days;
            total += hireTotal;
            
            const hireItem = document.createElement('div');
            hireItem.className = 'hire-item';
            let statusBadge = '';
            if (hire.status === 'completed') {
                statusBadge = '<span class="status-badge status-completed">Completed</span>';
            } else if (hire.status === 'rated') {
                statusBadge = '<span class="status-badge status-rated">Rated</span>';
            } else {
                statusBadge = '<span class="status-badge status-hired">Hired</span>';
            }
            
            hireItem.innerHTML = `
                <div class="hire-item-info">
                    <div class="hire-item-image">
                        <img src="${hire.image}" alt="${hire.name}">
                    </div>
                    <div class="hire-item-details">
                        <h4>${hire.name} ${statusBadge}</h4>
                        <p>${hire.profession} - ₹${hire.price}/day × ${hire.days} days</p>
                        <div class="professional-status">
                            ${hire.status === 'hired' ? '<span class="status-connected"><i class="fas fa-circle"></i> Connected</span>' : ''}
                            ${hire.status === 'completed' ? `<button class="btn-rate" data-professional-id="${hire.id}">Rate Experience</button>` : ''}
                        </div>
                    </div>
                </div>
                <div class="hire-item-controls">
                    <button onclick="updateHireDays('${hire.id}', -1)">-</button>
                    <span>${hire.days}</span>
                    <button onclick="updateHireDays('${hire.id}', 1)">+</button>
                    <button class="hire-remove-btn" onclick="removeFromHires('${hire.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
                <div class="hire-item-total">₹${hireTotal}</div>
            `;
            
            hireItems.appendChild(hireItem);
        });
        
        if (hireTotal) hireTotal.textContent = total;
    }
    
    updateNotificationIndicators();
}
function addToOrders(orderData) {
    const order = {
        id: 'ORD' + Date.now().toString().slice(-6),
        date: new Date().toLocaleDateString('en-IN'),
        items: orderData.items,
        total: orderData.total,
        status: 'pending', 
        address: orderData.address,
        type: orderData.type || 'product' 
    };
    
    orders.unshift(order); 
    localStorage.setItem('orders', JSON.stringify(orders));
    updateOrdersUI();
    
    resetNotifications('orders');
    
    return order.id;
}

function cancelOrder(orderId) {
    const order = orders.find(order => order.id === orderId);
    if (order) {
        order.status = 'cancelled';
        localStorage.setItem('orders', JSON.stringify(orders));
        updateOrdersUI();
        showNotification(`Order #${orderId} has been cancelled successfully!`, 'success');
    }
}

function removeOrder(orderId) {
    orders = orders.filter(order => order.id !== orderId);
    localStorage.setItem('orders', JSON.stringify(orders));
    updateOrdersUI();
    showNotification(`Order #${orderId} has been removed from your history!`, 'success');
    
    if (orders.length === 0) {
        setTimeout(() => {
            closePanel('ordersPanel');
        }, 1500);
    }
}

function clearOrderHistory() {
    orders = [];
    localStorage.removeItem('orders');
    updateOrdersUI();
    showNotification('All orders have been removed from your history!', 'success');
    closePanel('ordersPanel');
}

function updateOrdersUI() {
    const ordersItems = document.getElementById('ordersItems');
    if (ordersItems) {
        ordersItems.innerHTML = '';
        
        if (orders.length === 0) {
            ordersItems.innerHTML = `
                <div class="empty-orders">
                    <i class="fas fa-box-open" style="font-size: 3rem; color: var(--primary-light); margin-bottom: 15px;"></i>
                    <p>You haven't placed any orders yet</p>
                    <button class="btn-continue" onclick="closePanel('ordersPanel')">Start Shopping</button>
                </div>
            `;
            viewedStates.ordersViewed = true;
            localStorage.setItem('viewedStates', JSON.stringify(viewedStates));
            updateNotificationIndicators();
            return;
        }

        orders.forEach(order => {
            let statusClass = '';
            let statusText = '';
            
            switch(order.status) {
                case 'delivered':
                    statusClass = 'status-delivered';
                    statusText = 'Delivered';
                    break;
                case 'shipped':
                    statusClass = 'status-shipped';
                    statusText = 'Shipped';
                    break;
                case 'cancelled':
                    statusClass = 'status-cancelled';
                    statusText = 'Cancelled';
                    break;
                default:
                    statusClass = 'status-pending';
                    statusText = 'Pending';
            }
            
            const orderItem = document.createElement('div');
            orderItem.className = 'order-item';
            orderItem.innerHTML = `
                <div class="order-header">
                    <div>
                        <div class="order-number">${order.type === 'service' ? 'Service' : 'Order'} #${order.id}</div>
                        <div class="order-date">Placed on ${order.date}</div>
                        ${order.address ? `
                        <div class="order-address">
                            <small>${order.type === 'service' ? 'Service at' : 'Delivered to'}: ${order.address.fullName}, ${order.address.line1}, ${order.address.city}</small>
                        </div>
                        ` : ''}
                    </div>
                    <span class="order-status ${statusClass}">${statusText}</span>
                </div>
                <div class="order-products">
                    ${order.items.map(item => `
                        <div class="order-product">
                            <div class="order-product-info">
                                <h4>${item.name}</h4>
                                <p>₹${item.price} ${order.type === 'service' ? '/day × ' + item.days + ' days' : '× ' + item.quantity}</p>
                            </div>
                            <div class="order-product-total">₹${order.type === 'service' ? item.price * item.days : item.price * item.quantity}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="order-total">Total: ₹${order.total}</div>
                <div class="order-actions">
                    ${order.status === 'pending' ? `
                        <button class="btn-cancel-order" onclick="cancelOrder('${order.id}')">Cancel ${order.type === 'service' ? 'Service' : 'Order'}</button>
                    ` : ''}
                    ${order.status === 'cancelled' ? `
                        <button class="btn-remove-order" onclick="removeOrder('${order.id}')">
                            <i class="fas fa-trash"></i> Remove from History
                        </button>
                    ` : ''}
                </div>
            `;
            
            ordersItems.appendChild(orderItem);
        });

        const clearAllButton = document.createElement('div');
        clearAllButton.className = 'clear-all-orders';
        clearAllButton.innerHTML = `
            <button class="btn-clear-all" onclick="clearOrderHistory()">
                <i class="fas fa-trash-alt"></i> Clear All Order History
            </button>
        `;
        ordersItems.appendChild(clearAllButton);
    }
    
    updateNotificationIndicators();
}

function contactProfessional(name, phone) {
    if (!requireAuth('contact professionals', function() {
        contactProfessional(name, phone);
    })) {
        return;
    }
    
    showNotification(`Contacting ${name} at ${phone}...`, 'info');
    setTimeout(() => {
        showNotification(`${name} has been notified and will contact you shortly!`, 'success');
    }, 1500);
}

function proceedToPayment() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'error');
        return;
    }
    
    if (!requireAuth('place orders', function() {
        proceedToPayment();
    })) {
        return;
    }
    showDeliveryAddressForm(proceedToPaymentAfterAddress);
}

function proceedToPaymentAfterAddress() {
    const paymentItems = document.getElementById('paymentItems');
    const paymentTotal = document.getElementById('paymentTotal');
    
    if (paymentItems) {
        paymentItems.innerHTML = '';
        let total = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            const paymentItem = document.createElement('div');
            paymentItem.className = 'cart-item';
            paymentItem.innerHTML = `
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>₹${item.price} × ${item.quantity}</p>
                </div>
                <div class="cart-item-total">₹${itemTotal}</div>
            `;
            
            paymentItems.appendChild(paymentItem);
        });
        
        if (paymentTotal) paymentTotal.textContent = total;
    }
    document.getElementById('cod').checked = true;
    updatePaymentForm('cod');
    
    closePanel('cartPanel');
    openPanel('paymentPanel');
}

function processPayment() {
    const selectedPayment = document.querySelector('input[name="payment"]:checked').value;
    let isValid = true;
    let message = '';
    
    switch(selectedPayment) {
        case 'card':
            const cardNumber = document.getElementById('cardNumber').value;
            const expiry = document.getElementById('expiry').value;
            const cvv = document.getElementById('cvv').value;
            const name = document.getElementById('name').value;
            
            if (!cardNumber || !expiry || !cvv || !name) {
                isValid = false;
                message = 'Please fill all card details';
            } else if (cardNumber.replace(/\s/g, '').length !== 16) {
                isValid = false;
                message = 'Please enter a valid 16-digit card number';
            }
            break;
            
        case 'upi':
            const upiId = document.getElementById('upiId').value;
            if (!upiId) {
                isValid = false;
                message = 'Please enter your UPI ID';
            } else if (!upiId.includes('@')) {
                isValid = false;
                message = 'Please enter a valid UPI ID';
            }
            break;
            
        case 'cod':
            isValid = true;
            break;
    }
    
    if (!isValid) {
        showNotification(message, 'error');
        return;
    }
    
    showNotification('Processing your order...', 'info');
    
    setTimeout(() => {
        const deliveryAddress = getUserAddress('delivery');
        const orderId = addToOrders({
            items: [...cart],
            total: document.getElementById('paymentTotal').textContent,
            address: deliveryAddress,
            type: 'product'
        });
        
        cart = [];
        localStorage.removeItem('cart');
        updateCartUI();
        closePanel('paymentPanel');
        showNotification(`Order successful! Your order number is ${orderId}. Thank you!`, 'success');
        resetPaymentForms();
    }, 2000);
}

function resetPaymentForms() {
    document.getElementById('cardNumber').value = '';
    document.getElementById('expiry').value = '';
    document.getElementById('cvv').value = '';
    document.getElementById('name').value = '';
    document.getElementById('upiId').value = '';
    document.getElementById('cod').checked = true;
    updatePaymentForm('cod');
}

function proceedToHirePayment() {
    if (hires.length === 0) {
        showNotification('You haven\'t hired any professionals!', 'error');
        return;
    }
    if (!requireAuth('pay for services', function() {
        proceedToHirePayment();
    })) {
        return;
    }
    showHiringAddressForm(proceedToHirePaymentAfterAddress);
}

function proceedToHirePaymentAfterAddress() {
    const paymentItems = document.getElementById('hirePaymentItems');
    const paymentTotal = document.getElementById('hirePaymentTotal');
    
    if (paymentItems) {
        paymentItems.innerHTML = '';
        let total = 0;
        
        hires.forEach(hire => {
            const hireTotal = hire.price * hire.days;
            total += hireTotal;
            
            const paymentItem = document.createElement('div');
            paymentItem.className = 'hire-item';
            paymentItem.innerHTML = `
                <div class="hire-item-info">
                    <div class="hire-item-image">
                        <img src="${hire.image}" alt="${hire.name}">
                    </div>
                    <div class="hire-item-details">
                        <h4>${hire.name}</h4>
                        <p>${hire.profession} - ₹${hire.price}/day × ${hire.days} days</p>
                    </div>
                </div>
                <div class="hire-item-total">₹${hireTotal}</div>
            `;
            
            paymentItems.appendChild(paymentItem);
        });
        
        if (paymentTotal) paymentTotal.textContent = total;
    }
    document.getElementById('hireCod').checked = true;
    updateHirePaymentForm('cod');
    closePanel('hirePanel');
    openPanel('hirePaymentPanel');
}

function processHirePayment() {
    const selectedPayment = document.querySelector('input[name="hirePayment"]:checked').value;
    let isValid = true;
    let message = '';
    
    switch(selectedPayment) {
        case 'card':
            const cardNumber = document.getElementById('hireCardNumber').value;
            const expiry = document.getElementById('hireExpiry').value;
            const cvv = document.getElementById('hireCvv').value;
            const name = document.getElementById('hireName').value;
            
            if (!cardNumber || !expiry || !cvv || !name) {
                isValid = false;
                message = 'Please fill all card details';
            } else if (cardNumber.replace(/\s/g, '').length !== 16) {
                isValid = false;
                message = 'Please enter a valid 16-digit card number';
            }
            break;
            
        case 'upi':
            const upiId = document.getElementById('hireUpiId').value;
            if (!upiId) {
                isValid = false;
                message = 'Please enter your UPI ID';
            } else if (!upiId.includes('@')) {
                isValid = false;
                message = 'Please enter a valid UPI ID';
            }
            break;
            
        case 'cod':
            isValid = true;
            break;
    }
    
    if (!isValid) {
        showNotification(message, 'error');
        return;
    }
    showNotification('Processing your payment...', 'info');
    
    setTimeout(() => {
        hires.forEach(hire => {
            hire.status = 'completed';
        });
        
        localStorage.setItem('hires', JSON.stringify(hires));
        updateHireUI();
        
        const paymentNumber = 'PAY' + Date.now().toString().slice(-6);
        closePanel('hirePaymentPanel');
        showNotification(`Payment successful! Your payment ID is ${paymentNumber}. Professionals have been notified and will contact you shortly.`, 'success');
        resetHirePaymentForms();
    }, 2000);
}

function resetHirePaymentForms() {
    document.getElementById('hireCardNumber').value = '';
    document.getElementById('hireExpiry').value = '';
    document.getElementById('hireCvv').value = '';
    document.getElementById('hireName').value = '';
    document.getElementById('hireUpiId').value = '';
    document.getElementById('hireCod').checked = true;
    updateHirePaymentForm('cod');
}
function openRatingPanel(professionalId) {
    const professional = hires.find(hire => hire.id === professionalId);
    if (!professional) {
        showNotification('Professional not found!', 'error');
        return;
    }
    
    const ratingContent = document.getElementById('ratingContent');
    if (!ratingContent) {
        showNotification('Rating panel not found!', 'error');
        return;
    }
    
    ratingContent.innerHTML = `
        <div class="rating-professional">
            <div class="professional-header">
                <div class="professional-image">
                    <img src="${professional.image}" alt="${professional.name}">
                </div>
                <div class="professional-info">
                    <h3>${professional.name}</h3>
                    <p>${professional.profession}</p>
                </div>
            </div>
        </div>
        <div class="rating-form">
            <h3>How was your experience?</h3>
            <div class="rating-stars" id="ratingStars">
                <i class="far fa-star" data-rating="1"></i>
                <i class="far fa-star" data-rating="2"></i>
                <i class="far fa-star" data-rating="3"></i>
                <i class="far fa-star" data-rating="4"></i>
                <i class="far fa-star" data-rating="5"></i>
            </div>
            <textarea class="rating-comment" placeholder="Share your experience (optional)" id="ratingComment"></textarea>
            <button class="btn-submit-rating" onclick="submitRating('${professionalId}')">Submit Rating</button>
        </div>
    `;
    
    const stars = document.querySelectorAll('#ratingStars i');
    stars.forEach(star => {
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.className = 'fas fa-star active';
                } else {
                    s.className = 'far fa-star';
                }
            });
            document.getElementById('ratingStars').setAttribute('data-current-rating', rating);
        });
    });
    
    openPanel('ratingPanel');
    collapseFloatingButtons();
}

function submitRating(professionalId) {
    const professional = hires.find(hire => hire.id === professionalId);
    if (!professional) {
        showNotification('Professional not found!', 'error');
        return;
    }
    
    const ratingElement = document.getElementById('ratingStars');
    if (!ratingElement) {
        showNotification('Rating system error!', 'error');
        return;
    }
    
    const rating = parseInt(ratingElement.getAttribute('data-current-rating') || '0');
    const comment = document.getElementById('ratingComment') ? document.getElementById('ratingComment').value : '';
    
    if (rating === 0) {
        showNotification('Please select a rating', 'error');
        return;
    }
    professional.userRating = rating;
    professional.status = 'rated';
    professional.userComment = comment;
    
    localStorage.setItem('hires', JSON.stringify(hires));
    updateHireUI();
    const ratingContent = document.getElementById('ratingContent');
    if (ratingContent) {
        ratingContent.innerHTML = `
            <div class="rating-success">
                <i class="fas fa-check-circle"></i>
                <h3>Thank You!</h3>
                <p>Your rating has been submitted successfully.</p>
                <button class="btn-continue" onclick="closePanel('ratingPanel')">Continue</button>
            </div>
        `;
    }
    
    showNotification('Rating submitted successfully!', 'success');
}
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
updateCartUI();
updateHireUI();
updateOrdersUI();
