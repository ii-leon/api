// Dashboard App Logic
document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const balanceEl = document.getElementById('balance');
    const depositBtn = document.getElementById('depositBtn');
    const transferBtn = document.getElementById('transferBtn');
    const depositModal = document.getElementById('depositModal');
    const transferModal = document.getElementById('transferModal');
    const closeDepositModal = document.getElementById('closeDepositModal');
    const closeTransferModal = document.getElementById('closeTransferModal');
    const depositAmount = document.getElementById('depositAmount');
    const transferAmount = document.getElementById('transferAmount');
    const summaryAmount = document.getElementById('summaryAmount');
    const summaryTotal = document.getElementById('summaryTotal');

    // Format number with commas
    function formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    // Parse formatted number
    function parseFormattedNumber(str) {
        return parseInt(str.replace(/,/g, ''), 10) || 0;
    }

    // Update summary when transfer amount changes
    if (transferAmount) {
        transferAmount.addEventListener('input', () => {
            const amount = parseFormattedNumber(transferAmount.value);
            summaryAmount.textContent = formatNumber(amount) + ' IQD';
            summaryTotal.textContent = formatNumber(amount) + ' IQD';
        });
    }

    // Modal functions
    function openModal(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Event listeners for buttons
    if (depositBtn) {
        depositBtn.addEventListener('click', () => openModal(depositModal));
    }

    if (transferBtn) {
        transferBtn.addEventListener('click', () => openModal(transferModal));
    }

    // Close modals
    if (closeDepositModal) {
        closeDepositModal.addEventListener('click', () => closeModal(depositModal));
    }

    if (closeTransferModal) {
        closeTransferModal.addEventListener('click', () => closeModal(transferModal));
    }

    // Close modal on backdrop click
    [depositModal, transferModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    closeModal(modal);
                }
            });
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal(depositModal);
            closeModal(transferModal);
        }
    });

    // Form submissions
    document.querySelectorAll('.modal-form').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<svg class="spinner" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" fill="none" stroke-dasharray="31.4" stroke-dashoffset="10"/></svg> جاري المعالجة...';

            try {
                // Simulate API call
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Show success
                submitBtn.innerHTML = '✓ تم بنجاح';
                submitBtn.style.background = '#27AE60';
                submitBtn.style.color = 'white';
                
                // Close modal after success
                setTimeout(() => {
                    closeModal(form.closest('.modal'));
                    form.reset();
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.background = '';
                    submitBtn.style.color = '';
                    submitBtn.disabled = false;
                    
                    // Update balance animation
                    updateBalance();
                }, 1000);
                
            } catch (error) {
                submitBtn.innerHTML = '✗ خطأ، حاول مرة أخرى';
                submitBtn.style.background = '#E74C3C';
                submitBtn.style.color = 'white';
                
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                    submitBtn.style.background = '';
                    submitBtn.style.color = '';
                    submitBtn.disabled = false;
                }, 2000);
            }
        });
    });

    // Simulate balance update
    function updateBalance() {
        const currentBalance = parseFormattedNumber(balanceEl.textContent);
        const newBalance = currentBalance + Math.floor(Math.random() * 1000000);
        
        // Animate balance change
        balanceEl.style.transition = 'all 0.3s ease';
        balanceEl.style.transform = 'scale(1.05)';
        balanceEl.textContent = formatNumber(newBalance);
        
        setTimeout(() => {
            balanceEl.style.transform = 'scale(1)';
        }, 300);
    }

    // Animate numbers on load
    function animateValue(element, start, end, duration) {
        const startTimestamp = performance.now();
        
        const step = (timestamp) => {
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(easeOut * (end - start) + start);
            element.textContent = formatNumber(current);
            
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };
        
        requestAnimationFrame(step);
    }

    // Animate balance on page load
    const initialBalance = parseFormattedNumber(balanceEl.textContent);
    animateValue(balanceEl, 0, initialBalance, 1000);

    // Animate stat values
    document.querySelectorAll('.stat-value').forEach((stat, index) => {
        const text = stat.textContent;
        const value = parseInt(text);
        
        if (!isNaN(value)) {
            stat.textContent = '0';
            setTimeout(() => {
                animateValue(stat, 0, value, 800 + (index * 200));
            }, 500);
        }
    });

    // Transaction hover effects
    document.querySelectorAll('.transaction-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.background = 'var(--surface-hover)';
            item.style.transition = 'background 0.2s ease';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.background = 'transparent';
        });
    });

    // Notification button
    const notificationBtn = document.querySelector('.notification-btn');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            // Toggle notification panel (placeholder)
            alert('bpayit IRAQ - إشعارات جديدة');
        });
    }

    // Nav items active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
        });
    });

    // Withdraw button (placeholder)
    const withdrawBtn = document.getElementById('withdrawBtn');
    if (withdrawBtn) {
        withdrawBtn.addEventListener('click', () => {
            alert('bpayit IRAQ - نافذة السحب قيد التطوير');
        });
    }

    // View all transactions link
    const viewAllLink = document.querySelector('.view-all');
    if (viewAllLink) {
        viewAllLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert('bpayit IRAQ - صفحة جميع المعاملات قيد التطوير');
        });
    }
});
