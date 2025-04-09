// Add these variables to your existing JavaScript
let selectedDeliveryOption = 'pickup';
let selectedBranch = 1;
let branches = [
    {
        id: 1,
        name: "Downtown Branch",
        address: "123 Main Street, Downtown",
        deliveryZones: [
            { min: 0, max: 5, fee: 0 },
            { min: 5, max: 10, fee: 0 },
            { min: 10, max: 15, fee: 50 },
            { min: 15, max: 20, fee: 80 }
        ]
    },
    {
        id: 2,
        name: "Uptown Branch",
        address: "456 Central Avenue, Uptown",
        deliveryZones: [
            { min: 0, max: 5, fee: 0 },
            { min: 5, max: 10, fee: 0 },
            { min: 10, max: 15, fee: 50 }
        ]
    },
    {
        id: 3,
        name: "Westside Branch",
        address: "789 Riverside Drive, Westside",
        deliveryZones: [
            { min: 0, max: 5, fee: 0 },
            { min: 5, max: 10, fee: 0 },
            { min: 10, max: 15, fee: 40 },
            { min: 15, max: 20, fee: 70 }
        ]
    }
];

// Add these functions to your existing JavaScript
function selectDeliveryOption(option) {
    selectedDeliveryOption = option;
    
    // Update UI
    document.querySelectorAll('.delivery-option-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.currentTarget.classList.add('active');
    
    document.querySelectorAll('.delivery-details').forEach(detail => {
        detail.classList.remove('active');
    });
    document.getElementById(`${option}-details`).classList.add('active');
    
    // Update delivery fee display
    calculateDeliveryFee();
}

function selectBranch(branchId) {
    selectedBranch = branchId;
    
    // Update UI
    document.querySelectorAll('.branch-option').forEach(option => {
        option.classList.remove('selected');
    });
    event.currentTarget.classList.add('selected');
    
    // Update delivery fee display
    calculateDeliveryFee();
}

function calculateDeliveryFee() {
    const distanceInput = document.getElementById('delivery-distance');
    const distance = parseFloat(distanceInput.value) || 0;
    const branch = branches.find(b => b.id === selectedBranch);
    
    let deliveryFee = 0;
    let isFreeDelivery = false;
    
    if (selectedDeliveryOption === 'delivery') {
        // Find the appropriate delivery zone
        const zone = branch.deliveryZones.find(z => distance >= z.min && distance <= z.max);
        deliveryFee = zone ? zone.fee : 100; // Default fee if beyond all zones
        
        // Check if free delivery applies
        isFreeDelivery = deliveryFee === 0 && distance <= 10;
    }
    
    // Update UI
    document.getElementById('delivery-fee-amount').textContent = deliveryFee;
    document.getElementById('free-delivery-text').style.display = isFreeDelivery ? 'inline' : 'none';
    
    // Update estimated delivery time
    const baseTime = 10;
    const additionalTime = Math.floor(distance / 5) * 5;
    document.getElementById('delivery-time').textContent = `${baseTime + additionalTime}-${baseTime + additionalTime + 5} minutes`;
    
    return deliveryFee;
}

// Update the proceedToCheckout function to include delivery info
function proceedToCheckout() {
    if (cart.length === 0) return;
    if (!selectedPaymentMethod) {
        showNotification('warning', 'Please select a payment method');
        return;
    }
    
    // Validate delivery details if delivery option selected
    if (selectedDeliveryOption === 'delivery') {
        const address = document.getElementById('delivery-address').value;
        const distance = document.getElementById('delivery-distance').value;
        
        if (!address || !distance) {
            showNotification('warning', 'Please enter your delivery address and distance');
            return;
        }
    }
    
    // Calculate delivery fee
    const deliveryFee = selectedDeliveryOption === 'delivery' ? calculateDeliveryFee() : 0;
    
    // Create order
    const orderId = Math.floor(1000 + Math.random() * 9000);
    const orderTotal = cart.reduce((total, item) => total + (item.price * item.quantity), 0) + deliveryFee;
    const orderDate = new Date();
    
    const order = {
        id: orderId,
        date: orderDate,
        items: [...cart],
        total: orderTotal,
        paymentMethod: selectedPaymentMethod,
        status: 'pending',
        customerId: currentUser ? currentUser.id : null,
        deliveryOption: selectedDeliveryOption,
        branchId: selectedBranch,
        deliveryAddress: selectedDeliveryOption === 'delivery' ? document.getElementById('delivery-address').value : null,
        deliveryDistance: selectedDeliveryOption === 'delivery' ? parseFloat(document.getElementById('delivery-distance').value) : null,
        deliveryFee: deliveryFee,
        deliveryInstructions: selectedDeliveryOption === 'delivery' ? document.getElementById('delivery-instructions').value : null
    };
    
    orders.unshift(order); // Add to beginning of array
    
    // Update confirmation page
    document.getElementById('confirm-order-id').textContent = `#${orderId}`;
    document.getElementById('confirm-order-date').textContent = formatDate(orderDate) + ' at ' + formatTime(orderDate.toLocaleTimeString());
    document.getElementById('confirm-payment-method').textContent = formatPaymentMethod(selectedPaymentMethod);
    
    // Update order summary
    const orderSummary = document.getElementById('order-summary-items');
    let orderHTML = '';
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        
        orderHTML += `
            <div class="order-item">
                <span>₹{item.name} × ₹{item.quantity}</span>
                <span>₹{itemTotal.toFixed(2)}</span>
            </div>
        `;
    });
    
    // Add delivery fee if applicable
    if (deliveryFee > 0) {
        orderHTML += `
            <div class="order-item">
                <span>Delivery Fee</span>
                <span>₹{deliveryFee.toFixed(2)}</span>
            </div>
        `;
    }
    
    orderSummary.innerHTML = orderHTML;
    document.getElementById('order-total').textContent = orderTotal.toFixed(2);
    
    // Clear cart
    cart = [];
    updateCart();
    selectedPaymentMethod = null;
    
    // Show confirmation page
    showPage('confirmation-page');
    
    // Show success notification
    showNotification('success', `Order #${orderId} confirmed! Total: ${orderTotal.toFixed(2)}`);
}

function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show the selected page
    document.getElementById(pageId).classList.add('active');
    
    // If showing order page, initialize delivery functionality
    if (pageId === 'order-page') {
        initializeDeliveryOptions();
    }
    
    // Update UI elements based on the current page
    updatePageSpecificUI(pageId);
}

function initializeDeliveryOptions() {
    // Set up delivery distance input listener
    const distanceInput = document.getElementById('delivery-distance');
    if (distanceInput) {
        distanceInput.addEventListener('input', calculateDeliveryFee);
    }
    
    // Initialize delivery option to pickup
    selectDeliveryOption('pickup');
    selectBranch(1);
}

// Add event listener for distance input to auto-calculate fee
document.getElementById('delivery-distance')?.addEventListener('input', calculateDeliveryFee);
function scrollToContact() {
    const contactSection = document.getElementById('contact');
    contactSection.scrollIntoView({ behavior: 'smooth' });
}

// Health Assessment Variables
let currentAssessmentPage = 1;
const totalAssessmentPages = 4;
let selectedHealthConditions = [];
let selectedSkinType = null;
let selectedTastes = [];

// Show health assessment after successful login/registration
function showHealthAssessment() {
    showPage('health-assessment-page');
    updateProgressBar();
}

// Update progress bar
function updateProgressBar() {
    const progressPercentage = ((currentAssessmentPage - 1) / (totalAssessmentPages - 1)) * 100;
    document.getElementById('progress-bar').style.width = `${progressPercentage}%`;
    
    // Update step indicators
    for (let i = 1; i <= totalAssessmentPages; i++) {
        const step = document.getElementById(`step-${i}`);
        if (i < currentAssessmentPage) {
            step.classList.remove('active');
            step.classList.add('completed');
        } else if (i === currentAssessmentPage) {
            step.classList.add('active');
            step.classList.remove('completed');
        } else {
            step.classList.remove('active', 'completed');
        }
    }
}

// Navigate to next assessment page
function nextPage() {
    // Validate current page before proceeding
    if (!validateCurrentPage()) return;
    
    // Special handling for page 1 (calculate BMI)
    if (currentAssessmentPage === 1) {
        calculateBMI();
    }
    
    // Hide current page
    document.getElementById(`page-${currentAssessmentPage}`).classList.remove('active');
    
    // Show next page
    currentAssessmentPage++;
    document.getElementById(`page-${currentAssessmentPage}`).classList.add('active');
    
    // Update progress bar
    updateProgressBar();
    
    // Update button states
    updateButtonStates();
}

// Navigate to previous assessment page
function prevPage() {
    // Hide current page
    document.getElementById(`page-${currentAssessmentPage}`).classList.remove('active');
    
    // Show previous page
    currentAssessmentPage--;
    document.getElementById(`page-${currentAssessmentPage}`).classList.add('active');
    
    // Update progress bar
    updateProgressBar();
    
    // Update button states
    updateButtonStates();
}

// Update button states
function updateButtonStates() {
    const backButtons = document.querySelectorAll('.assessment-btn.back');
    const nextButtons = document.querySelectorAll('.assessment-btn.next');
    
    backButtons.forEach(btn => {
        if (currentAssessmentPage === 1) {
            btn.disabled = true;
        } else {
            btn.disabled = false;
        }
    });
    
    nextButtons.forEach(btn => {
        if (currentAssessmentPage === totalAssessmentPages) {
            btn.textContent = 'Complete';
            btn.innerHTML = '<i class="fas fa-check"></i> Complete';
        } else {
            btn.textContent = 'Next';
            btn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
        }
    });
}

// Validate current page before proceeding
function validateCurrentPage() {
    if (currentAssessmentPage === 1) {
        const name = document.getElementById('full-name').value;
        const age = document.getElementById('age').value;
        const gender = document.getElementById('gender').value;
        const height = document.getElementById('height').value;
        const weight = document.getElementById('weight').value;
        
        if (!name || !age || !gender || !height || !weight) {
            showNotification('warning', 'Please fill in all personal information');
            return false;
        }
    } else if (currentAssessmentPage === 3) {
        if (selectedHealthConditions.length > 2) {
            showNotification('warning', 'You can select a maximum of 2 health conditions');
            return false;
        }
    } else if (currentAssessmentPage === 4) {
        if (!selectedSkinType) {
            showNotification('warning', 'Please select your skin type');
            return false;
        }
        if (selectedTastes.length === 0) {
            showNotification('warning', 'Please select at least one taste preference');
            return false;
        }
    }
    return true;
}

// Calculate BMI
function calculateBMI() {
    const height = parseFloat(document.getElementById('height').value) / 100; // Convert cm to m
    const weight = parseFloat(document.getElementById('weight').value);
    
    if (height && weight) {
        const bmi = weight / (height * height);
        const roundedBMI = Math.round(bmi * 10) / 10;
        
        document.getElementById('bmi-value').textContent = roundedBMI;
        
        // Determine BMI category
        let category = '';
        if (bmi < 18.5) {
            category = 'Underweight';
        } else if (bmi >= 18.5 && bmi < 25) {
            category = 'Normal weight';
        } else if (bmi >= 25 && bmi < 30) {
            category = 'Overweight';
        } else {
            category = 'Obese';
        }
        document.getElementById('bmi-category').textContent = category;
        
        // Position the marker on the scale
        let markerPosition = 0;
        if (bmi < 18.5) {
            markerPosition = (bmi / 18.5) * 16.5;
        } else if (bmi < 25) {
            markerPosition = 16.5 + ((bmi - 18.5) / (25 - 18.5)) * (50 - 16.5);
        } else if (bmi < 30) {
            markerPosition = 50 + ((bmi - 25) / (30 - 25)) * (83.5 - 50);
        } else {
            markerPosition = 83.5 + ((Math.min(bmi, 40) - 30) / (40 - 30)) * (100 - 83.5);
        }
        
        document.getElementById('bmi-marker').style.left = `${markerPosition}%`;
    }
}

// Toggle health condition selection
function toggleHealthOption(element) {
    const checkbox = element.querySelector('input[type="checkbox"]');
    const value = checkbox.value;
    
    if (checkbox.checked) {
        // Already selected, unselect it
        checkbox.checked = false;
        element.classList.remove('selected');
        selectedHealthConditions = selectedHealthConditions.filter(item => item !== value);
    } else {
        // Check if we can select more
        if (selectedHealthConditions.length >= 2) {
            showNotification('warning', 'You can select a maximum of 2 health conditions');
            return;
        }
        
        // Select it
        checkbox.checked = true;
        element.classList.add('selected');
        selectedHealthConditions.push(value);
    }
}

// Select skin type
function selectSkinType(element, skinType) {
    document.querySelectorAll('.skin-type-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    element.classList.add('selected');
    selectedSkinType = skinType;
}

// Toggle taste preference
function toggleTastePreference(element, taste) {
    if (element.classList.contains('selected')) {
        element.classList.remove('selected');
        selectedTastes = selectedTastes.filter(item => item !== taste);
    } else {
        element.classList.add('selected');
        selectedTastes.push(taste);
    }
}

// Complete assessment
function completeAssessment() {
    if (!validateCurrentPage()) return;
    
    // Save all assessment data to user profile
    if (currentUser) {
        currentUser.healthProfile = {
            name: document.getElementById('full-name').value,
            age: document.getElementById('age').value,
            gender: document.getElementById('gender').value,
            height: document.getElementById('height').value,
            weight: document.getElementById('weight').value,
            bmi: document.getElementById('bmi-value').textContent,
            healthConditions: selectedHealthConditions,
            skinType: selectedSkinType,
            tastePreferences: selectedTastes
        };
        
        // Update localStorage
        localStorage.setItem('loggedInUser', JSON.stringify(currentUser));
        
        // Show success notification
        showNotification('success', 'Health assessment completed!');
        
        // Redirect to home page
        showPage('home-page');
    }
}