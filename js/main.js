/* ============================================
   GrowPod - Main JavaScript
   ============================================ */

const init = () => {

    // --- Navbar scroll effect ---
    const navbar = document.getElementById('navbar');
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
    });

    // --- Mobile nav toggle ---
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    navToggle.addEventListener('click', () => {
        navLinks.classList.toggle('open');
        navToggle.classList.toggle('active');
    });

    // Close mobile nav on link click
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('open');
            navToggle.classList.remove('active');
        });
    });

    // --- Smooth scroll for anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(anchor.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // --- Scroll-triggered fade-in animations ---
    const fadeElements = document.querySelectorAll(
        '.problem-card, .step, .feature-card, .use-case-card, .sus-point, .carbon-compare, .sensor-detail, .specs-table-wrapper, .proof-item, .section-cta, .compare-takeaway, .preorder-card'
    );

    fadeElements.forEach(el => el.classList.add('fade-in'));

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: '0px 0px -40px 0px'
    });

    fadeElements.forEach(el => observer.observe(el));

    // --- Animated carbon bars ---
    const barSection = document.querySelector('.carbon-compare');
    if (barSection) {
        const barObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const bars = entry.target.querySelectorAll('.bar-fill');
                    bars.forEach(bar => bar.classList.add('animated'));
                    barObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });
        barObserver.observe(barSection);
    }

    // --- Pre-order form (sends to Fiach via FormSubmit.co) ---
    const sanitize = (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    };

    const form = document.getElementById('preorderForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const formData = new FormData(form);
            const data = Object.fromEntries(formData);
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            const body = new FormData();
            body.append('_subject', 'New GrowPod Waitlist Signup!');
            body.append('_template', 'box');
            body.append('_captcha', 'false');
            body.append('Message',
              "Hi handsome, looks like someone's interested in your grow pod!"
            );
            body.append('Name', data.name);
            body.append('Email', data.email);
            body.append('email', data.email);
            body.append('Interested As', data.interest || 'Not specified');
            body.append('_autoresponse',
              'Thanks for joining the GrowPod waitlist! We\'ll notify you as soon as pre-orders open. Stay tuned!'
            );

            const recipient = ['Fiachkeenan', 'gmail.com'].join('@');
            fetch('https://formsubmit.co/ajax/' + recipient, {
                method: 'POST',
                body: body,
            })
            .then(res => res.json())
            .then(result => {
                if (result.success) {
                    const safeName = sanitize(data.name || '');
                    const safeEmail = sanitize(data.email || '');
                    form.innerHTML = `
                        <div style="text-align: center; padding: 24px 0;">
                            <div style="font-size: 3rem; margin-bottom: 12px;">&#127881;</div>
                            <h3 style="margin-bottom: 8px;">You're on the list!</h3>
                            <p style="color: var(--gray-500);">
                                Thanks${safeName ? ', ' + safeName : ''}! We'll send updates to
                                <strong>${safeEmail}</strong> as soon as pre-orders open.
                            </p>
                        </div>
                    `;
                } else {
                    throw new Error('Submit failed');
                }
            })
            .catch(() => {
                submitBtn.textContent = 'Join the Waitlist';
                submitBtn.disabled = false;
                alert('Something went wrong. Please try again.');
            });
        });
    }

    // --- Obfuscated contact email ---
    const contactLink = document.getElementById('contactEmail');
    if (contactLink) {
        const user = 'Fiachkeenan';
        const domain = 'gmail.com';
        contactLink.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'mailto:' + user + '@' + domain;
        });
        contactLink.addEventListener('mouseenter', () => {
            contactLink.textContent = user + '@' + domain;
        });
        contactLink.addEventListener('mouseleave', () => {
            contactLink.textContent = 'Get in touch';
        });
    }

    // --- Active nav link highlighting ---
    const sections = document.querySelectorAll('section[id]');
    const navItems = document.querySelectorAll('.nav-links a:not(.btn)');

    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop - 100;
            if (window.scrollY >= sectionTop) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(item => {
            item.style.color = '';
            if (item.getAttribute('href') === '#' + current) {
                item.style.color = 'var(--green-600)';
            }
        });
    });

    // --- Sticky mobile CTA ---
    const stickyCta = document.getElementById('stickyCta');
    const preorderSection = document.getElementById('preorder');
    if (stickyCta && preorderSection) {
        window.addEventListener('scroll', () => {
            const heroBottom = document.querySelector('.hero').getBoundingClientRect().bottom;
            const preorderTop = preorderSection.getBoundingClientRect().top;
            const show = heroBottom < 0 && preorderTop > window.innerHeight;
            stickyCta.classList.toggle('visible', show);
        });
    }

    // --- Back to top button ---
    const backToTop = document.getElementById('backToTop');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            backToTop.classList.toggle('visible', window.scrollY > 600);
        });
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Counter animation for hero stats ---
    const statValues = document.querySelectorAll('.stat-value');
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                statValues.forEach(stat => {
                    stat.style.opacity = '0';
                    stat.style.transform = 'translateY(10px)';
                    stat.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
                    setTimeout(() => {
                        stat.style.opacity = '1';
                        stat.style.transform = 'translateY(0)';
                    }, 200);
                });
                heroObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) heroObserver.observe(heroStats);
};

init();
