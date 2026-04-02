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

    // --- Scroll-triggered fade-in animations with stagger ---
    const fadeElements = document.querySelectorAll(
        '.problem-card, .step, .feature-card, .use-case-card, .sus-point, .carbon-compare, .sensor-detail, .specs-table-wrapper, .proof-item, .section-cta, .compare-takeaway, .preorder-card, .faq-item, .testimonial-card'
    );

    fadeElements.forEach(el => el.classList.add('fade-in'));

    // Assign stagger indices within each parent container
    const staggerGroups = new Map();
    fadeElements.forEach(el => {
        const parent = el.parentElement;
        if (!staggerGroups.has(parent)) staggerGroups.set(parent, []);
        staggerGroups.get(parent).push(el);
    });
    staggerGroups.forEach(group => {
        group.forEach((el, i) => el.style.setProperty('--stagger-index', i));
    });

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
                item.style.color = 'var(--green-500)';
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
    const animateCounter = (el) => {
        const text = el.textContent.trim();
        // Handle range format like "7–14"
        const rangeMatch = text.match(/^(\d+)\s*[\u2013\u2014-]\s*(\d+)$/);
        if (rangeMatch) {
            const t1 = parseInt(rangeMatch[1]);
            const t2 = parseInt(rangeMatch[2]);
            const duration = 1200;
            const start = performance.now();
            const step = (now) => {
                const p = Math.min((now - start) / duration, 1);
                const ease = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(t1 * ease) + '\u2013' + Math.round(t2 * ease);
                if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
            return;
        }
        // Handle "90%", "~12%", etc.
        const match = text.match(/^([~]?)(\d+)(.*)$/);
        if (!match) return;
        const prefix = match[1];
        const target = parseInt(match[2]);
        const suffix = match[3];
        const duration = 1500;
        const start = performance.now();
        const step = (now) => {
            const p = Math.min((now - start) / duration, 1);
            const ease = 1 - Math.pow(1 - p, 3);
            el.textContent = prefix + Math.round(target * ease) + suffix;
            if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    };

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
                        animateCounter(stat);
                    }, 200);
                });
                heroObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    const heroStats = document.querySelector('.hero-stats');
    if (heroStats) heroObserver.observe(heroStats);

    // --- FAQ accordion ---
    document.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item');
            const isOpen = item.classList.contains('open');
            document.querySelectorAll('.faq-item.open').forEach(i => {
                i.classList.remove('open');
                i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            });
            if (!isOpen) {
                item.classList.add('open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });
    });

    // --- Testimonial carousel ---
    const track = document.getElementById('testimonialTrack');
    const cards = track ? track.querySelectorAll('.testimonial-card') : [];
    const dotsContainer = document.getElementById('testimonialDots');

    if (track && cards.length > 0) {
        let currentIndex = 0;
        let autoInterval;

        // Create dots
        cards.forEach((_, i) => {
            const dot = document.createElement('button');
            dot.className = 'testimonial-dot' + (i === 0 ? ' active' : '');
            dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
            dot.addEventListener('click', () => goTo(i));
            dotsContainer.appendChild(dot);
        });

        const dots = dotsContainer.querySelectorAll('.testimonial-dot');

        const goTo = (index) => {
            currentIndex = index;
            track.style.transform = 'translateX(-' + (currentIndex * 100) + '%)';
            dots.forEach((d, i) => d.classList.toggle('active', i === currentIndex));
            resetAuto();
        };

        const resetAuto = () => {
            clearInterval(autoInterval);
            autoInterval = setInterval(() => {
                goTo((currentIndex + 1) % cards.length);
            }, 5000);
        };

        document.getElementById('testimonialNext')?.addEventListener('click', () => {
            goTo((currentIndex + 1) % cards.length);
        });
        document.getElementById('testimonialPrev')?.addEventListener('click', () => {
            goTo((currentIndex - 1 + cards.length) % cards.length);
        });

        resetAuto();
    }
};

init();
