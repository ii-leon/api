// Checkout Widget App Logic
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.payment-tab-content');
    const cardForm = document.getElementById('cardForm');
    const walletForm = document.getElementById('walletForm');
    const zaincashForm = document.getElementById('zaincashForm');
    const loadingOverlay = document.getElementById('loadingOverlay');
    const successModal = document.getElementById('successModal');
    const successBtn = document.getElementById('successBtn');
    const transactionDate = document.getElementById('transactionDate');

    // Tab switching
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const method = btn.dataset.method;
            
            // Update active tab
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show corresponding content
            tabContents.forEach(content => {
                content.classList.remove('active');
            });
            
            const targetTab = document.getElementById(`${method}Tab`);
            if (targetTab) {
                targetTab.classList.add('active');
            }
        });
    });

    // Card number formatting
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\s/g, '').replace(/\D/g, '');
            let formatted = '';
            
            for (let i = 0; i < value.length && i < 16; i++) {
                if (i > 0 && i % 4 === 0) {
                    formatted += ' ';
                }
                formatted += value[i];
            }
            
            e.target.value = formatted;
            
            // Detect card type
            detectCardType(value);
        });
    }

    // Card type detection
    function detectCardType(number) {
        const visaIcon = document.querySelector('.card-icon.visa');
        const mastercardIcon = document.querySelector('.card-icon.mastercard');
        
        // Reset
        visaIcon.style.opacity = '0.5';
        mastercardIcon.style.opacity = '0.5';
        
        if (number.startsWith('4')) {
            visaIcon.style.opacity = '1';
        } else if (number.startsWith('5') || number.startsWith('2')) {
            mastercardIcon.style.opacity = '1';
        }
    }

    // Expiry date formatting
    const expiryInput = document.getElementById('cardExpiry');
    if (expiryInput) {
        expiryInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length >= 2) {
                value = value.substring(0, 2) + '/' + value.substring(2, 4);
            }
            
            e.target.value = value;
        });
    }

    // CVV validation
    const cvvInput = document.getElementById('cardCvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '').substring(0, 4);
        });
    }

    // Phone number formatting
    const phoneInput = document.getElementById('zaincashPhone');
    if (phoneInput) {
        phoneInput.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');
            
            if (value.length > 10) {
                value = value.substring(0, 10);
            }
            
            // Format: 07XX XXX XXXX
            if (value.length > 4) {
                value = value.substring(0, 4) + ' ' + value.substring(4);
            }
            if (value.length > 8) {
                value = value.substring(0, 8) + ' ' + value.substring(8);
            }
            
            e.target.value = value;
        });
    }

    // Form submissions
    async function handlePayment(form, method) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        // Validate form
        if (!validateForm(form, method)) {
            return;
        }
        
        // Show loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10"/></svg> جاري المعالجة...';
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Hide loading, show success
            loadingOverlay.classList.remove('active');
            
            // Set transaction date
            const now = new Date();
            transactionDate.textContent = now.toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            successModal.classList.add('active');
            
        } catch (error) {
            alert('حدث خطأ أثناء معالجة الدفع. يرجى المحاولة مرة أخرى.');
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // Form validation
    function validateForm(form, method) {
        let isValid = true;
        
        // Remove previous error states
        form.querySelectorAll('input').forEach(input => {
            input.style.borderColor = '';
        });
        
        if (method === 'card') {
            const cardNumber = document.getElementById('cardNumber').value.replace(/\s/g, '');
            const expiry = document.getElementById('cardExpiry').value;
            const cvv = document.getElementById('cardCvv').value;
            const name = document.getElementById('cardName').value;
            const email = document.getElementById('email').value;
            
            if (cardNumber.length < 16) {
                highlightError('cardNumber');
                isValid = false;
            }
            
            if (!/^\d{2}\/\d{2}$/.test(expiry)) {
                highlightError('cardExpiry');
                isValid = false;
            }
            
            if (cvv.length < 3) {
                highlightError('cardCvv');
                isValid = false;
            }
            
            if (!name.trim()) {
                highlightError('cardName');
                isValid = false;
            }
            
            if (!email || !email.includes('@')) {
                highlightError('email');
                isValid = false;
            }
            
        } else if (method === 'wallet') {
            const password = document.getElementById('walletPassword').value;
            
            if (password.length < 6) {
                highlightError('walletPassword');
                isValid = false;
            }
            
        } else if (method === 'zaincash') {
            const phone = document.getElementById('zaincashPhone').value.replace(/\s/g, '');
            
            if (phone.length < 10) {
                highlightError('zaincashPhone');
                isValid = false;
            }
        }
        
        return isValid;
    }

    function highlightError(inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.style.borderColor = '#E74C3C';
            input.focus();
        }
    }

    // Attach form handlers
    if (cardForm) {
        cardForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handlePayment(cardForm, 'card');
        });
    }

    if (walletForm) {
        walletForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handlePayment(walletForm, 'wallet');
        });
    }

    if (zaincashForm) {
        zaincashForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handlePayment(zaincashForm, 'zaincash');
        });
    }

    // Success button
    if (successBtn) {
        successBtn.addEventListener('click', () => {
            successModal.classList.remove('active');
            // Redirect to merchant (placeholder)
            alert('شكراً لاشتراكك في bpayit IRAQ! سيتم توجيهك إلى المتجر.');
        });
    }

    // Close modals on backdrop click
    [successModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                }
            });
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            successModal.classList.remove('active');
        }
    });

    // Real-time input validation feedback
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('focus', () => {
            input.style.borderColor = '';
        });
    });

    // Luhn algorithm for card number validation
    function luhnCheck(num) {
        let arr = (num + '')
            .split('')
            .reverse()
            .map(x => parseInt(x));
        
        let sum = arr.reduce((acc, val, i) => {
            if (i % 2 !== 0) {
                val *= 2;
                if (val > 9) val -= 9;
            }
            return acc + val;
        }, 0);
        
        return sum % 10 === 0;
    }

    // Validate card number on blur
    if (cardNumberInput) {
        cardNumberInput.addEventListener('blur', () => {
            const number = cardNumberInput.value.replace(/\s/g, '');
            if (number.length === 16 && !luhnCheck(number)) {
                cardNumberInput.style.borderColor = '#F39C12';
                cardNumberInput.title = 'رقم البطاقة غير صحيح';
            }
        });
    }

    // Keyboard navigation for tabs
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
            const activeTab = document.querySelector('.tab-btn.active');
            const tabs = Array.from(tabBtns);
            const currentIndex = tabs.indexOf(activeTab);
            
            let newIndex;
            if (e.key === 'ArrowLeft') {
                newIndex = (currentIndex + 1) % tabs.length;
            } else {
                newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            }
            
            tabs[newIndex].click();
        }
    });
});
