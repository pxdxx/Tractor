(function () {
    'use strict';

    const STORAGE_THEME = 'tractor-theme';
    const STORAGE_MUSIC = 'tractor-music';

    function resolveOgAbsoluteUrls() {
        if (!/^https?:/i.test(window.location.protocol)) return;
        const abs = new URL('favicon.ico', window.location.href).href;
        document.querySelectorAll('meta[property="og:image"], meta[name="twitter:image"]').forEach(function (m) {
            m.setAttribute('content', abs);
        });
        var ogUrl = document.querySelector('meta[property="og:url"]');
        if (!ogUrl) {
            ogUrl = document.createElement('meta');
            ogUrl.setAttribute('property', 'og:url');
            document.head.appendChild(ogUrl);
        }
        ogUrl.setAttribute('content', window.location.href.split('#')[0]);
    }

    /* --- Тема --- */
    function updateThemeIcons(isDark) {
        var sun = document.querySelector('.sun-icon');
        var moon = document.querySelector('.moon-icon');
        if (!sun || !moon) return;
        if (isDark) {
            sun.style.display = 'block';
            moon.style.display = 'none';
        } else {
            sun.style.display = 'none';
            moon.style.display = 'block';
        }
    }

    function applyThemeFromSystem() {
        var html = document.documentElement;
        var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark) {
            html.setAttribute('data-theme', 'dark');
            updateThemeIcons(true);
        } else {
            html.removeAttribute('data-theme');
            updateThemeIcons(false);
        }
    }

    function applySavedTheme() {
        var saved = localStorage.getItem(STORAGE_THEME);
        var html = document.documentElement;
        if (saved === 'dark') {
            html.setAttribute('data-theme', 'dark');
            updateThemeIcons(true);
        } else if (saved === 'light') {
            html.removeAttribute('data-theme');
            updateThemeIcons(false);
        } else {
            applyThemeFromSystem();
        }
    }

    window.toggleTheme = function toggleTheme() {
        var html = document.documentElement;
        var isDark = html.getAttribute('data-theme') === 'dark';
        if (isDark) {
            html.removeAttribute('data-theme');
            localStorage.setItem(STORAGE_THEME, 'light');
            updateThemeIcons(false);
        } else {
            html.setAttribute('data-theme', 'dark');
            localStorage.setItem(STORAGE_THEME, 'dark');
            updateThemeIcons(true);
        }
    };

    function prefersReducedMotion() {
        return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    function syncLottieMotion() {
        var sticker = document.getElementById('animatedSticker');
        if (!sticker || typeof sticker.pause !== 'function') return;
        if (prefersReducedMotion()) sticker.pause();
        else if (sticker.style.visibility === 'visible' || sticker.style.opacity === '1') {
            try { sticker.play(); } catch (e) {}
        }
    }

    function refreshVideoPlayback() {
        document.querySelectorAll('.project-image video').forEach(function (v) {
            if (!(v instanceof HTMLVideoElement)) return;
            if (prefersReducedMotion()) {
                v.pause();
                return;
            }
            var r = v.getBoundingClientRect();
            var vis = r.top < window.innerHeight + 80 && r.bottom > -80;
            if (vis) v.play().catch(function () {});
            else v.pause();
        });
    }

    /* --- Audio typing --- */
    var audioContext;
    var typingSoundEnabled = true;
    var volumeLevel = 1.0;

    function initAudio() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    function createTypingSound() {
        if (!audioContext) return null;
        var oscillator1 = audioContext.createOscillator();
        var oscillator2 = audioContext.createOscillator();
        var gainNode = audioContext.createGain();
        var filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, audioContext.currentTime);
        filter.Q.setValueAtTime(0.4, audioContext.currentTime);
        oscillator1.connect(gainNode);
        oscillator2.connect(gainNode);
        gainNode.connect(filter);
        filter.connect(audioContext.destination);
        oscillator1.type = 'triangle';
        oscillator1.frequency.setValueAtTime(120 + Math.random() * 60, audioContext.currentTime);
        oscillator1.frequency.exponentialRampToValueAtTime(40, audioContext.currentTime + 0.05);
        oscillator2.type = 'triangle';
        oscillator2.frequency.setValueAtTime(600 + Math.random() * 300, audioContext.currentTime);
        oscillator2.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.02);
        gainNode.gain.setValueAtTime(0, audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.015 * volumeLevel, audioContext.currentTime + 0.005);
        gainNode.gain.exponentialRampToValueAtTime(0.003 * volumeLevel, audioContext.currentTime + 0.08);
        oscillator1.start(audioContext.currentTime);
        oscillator1.stop(audioContext.currentTime + 0.08);
        oscillator2.start(audioContext.currentTime);
        oscillator2.stop(audioContext.currentTime + 0.03);
        return oscillator1;
    }

    function playTypingSound() {
        if (typingSoundEnabled && audioContext && !prefersReducedMotion()) {
            createTypingSound();
        }
    }

    var isAnimating = false;

    window.triggerCodeAnimation = function triggerCodeAnimation() {
        if (isAnimating || prefersReducedMotion()) return;
        isAnimating = true;
        initAudio();
        var logoIcon = document.querySelector('.logo-icon');
        var codeText = document.getElementById('codeText');
        var code = 'main( ) {\n        print("Hello, Tractor!");\n}';
        if (!logoIcon || !codeText) {
            isAnimating = false;
            return;
        }
        logoIcon.classList.add('hidden');
        codeText.textContent = '';
        codeText.style.display = 'inline-block';
        codeText.style.visibility = 'visible';
        codeText.style.opacity = '1';
        var index = 0;
        var typingInterval = setInterval(function () {
            if (index < code.length) {
                codeText.textContent += code[index];
                if (code[index] !== ' ' && code[index] !== '\n') playTypingSound();
                index++;
            } else {
                clearInterval(typingInterval);
                setTimeout(function () {
                    codeText.style.transition = 'opacity 0.5s ease';
                    codeText.style.opacity = '0';
                    setTimeout(function () {
                        codeText.textContent = '';
                        codeText.style.display = 'none';
                        codeText.style.visibility = 'hidden';
                        codeText.style.transition = 'none';
                        logoIcon.classList.remove('hidden');
                        isAnimating = false;
                    }, 500);
                }, 5000);
            }
        }, 50);
    };

    /* --- Particles --- */
    var ParticlesSystem = /** @class */ (function () {
        function ParticlesSystem() {
            this.canvas = document.getElementById('particles-canvas');
            if (!this.canvas) return;
            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.mouse = { x: null, y: null, radius: 150 };
            this.particleCount = 100;
            this.init();
            this.setupEventListeners();
            this.animate();
        }
        ParticlesSystem.prototype.init = function () {
            if (!this.canvas) return;
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
            this.particleCount = Math.floor((this.canvas.width * this.canvas.height) / 15000);
            this.particles = [];
            for (var i = 0; i < this.particleCount; i++) {
                this.particles.push(new Particle(this.canvas));
            }
        };
        ParticlesSystem.prototype.setupEventListeners = function () {
            var self = this;
            window.addEventListener('resize', function () {
                if (!self.canvas) return;
                self.canvas.width = window.innerWidth;
                self.canvas.height = window.innerHeight;
                var newParticleCount = Math.floor((self.canvas.width * self.canvas.height) / 15000);
                var diff = newParticleCount - self.particles.length;
                if (diff > 0) {
                    for (var i = 0; i < diff; i++) self.particles.push(new Particle(self.canvas));
                } else if (diff < 0) {
                    self.particles.splice(0, Math.abs(diff));
                }
            });
            window.addEventListener('mousemove', function (e) {
                self.mouse.x = e.x;
                self.mouse.y = e.y;
            });
            window.addEventListener('mouseout', function () {
                self.mouse.x = null;
                self.mouse.y = null;
            });
        };
        ParticlesSystem.prototype.animate = function () {
            var self = this;
            if (!this.canvas || !this.ctx) return;
            if (prefersReducedMotion()) {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                requestAnimationFrame(function () { self.animate(); });
                return;
            }
            var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.particles.forEach(function (particle, i) {
                particle.update(self.mouse);
                particle.draw(self.ctx, isDark);
                for (var j = i + 1; j < self.particles.length; j++) {
                    var dx = self.particles[j].x - particle.x;
                    var dy = self.particles[j].y - particle.y;
                    var distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 120) {
                        var opacity = (1 - distance / 120) * 0.3;
                        self.ctx.strokeStyle = isDark
                            ? 'rgba(255, 255, 255, ' + opacity + ')'
                            : 'rgba(0, 0, 0, ' + opacity + ')';
                        self.ctx.lineWidth = 0.5;
                        self.ctx.beginPath();
                        self.ctx.moveTo(particle.x, particle.y);
                        self.ctx.lineTo(self.particles[j].x, self.particles[j].y);
                        self.ctx.stroke();
                    }
                }
            });
            requestAnimationFrame(function () { self.animate(); });
        };
        return ParticlesSystem;
    }());

    function Particle(canvas) {
        this.canvas = canvas;
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 3 + 1;
        this.speedX = (Math.random() - 0.5) * 0.5;
        this.speedY = (Math.random() - 0.5) * 0.5;
        this.baseX = this.x;
        this.baseY = this.y;
    }
    Particle.prototype.update = function (mouse) {
        if (mouse.x != null && mouse.y != null) {
            var dx = mouse.x - this.x;
            var dy = mouse.y - this.y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius) {
                var force = (mouse.radius - distance) / mouse.radius;
                var dirX = dx / distance;
                var dirY = dy / distance;
                this.x -= dirX * force * 3;
                this.y -= dirY * force * 3;
            }
        }
        var dxBase = this.baseX - this.x;
        var dyBase = this.baseY - this.y;
        this.x += dxBase * 0.05;
        this.y += dyBase * 0.05;
        this.baseX += this.speedX;
        this.baseY += this.speedY;
        if (this.baseX < 0 || this.baseX > this.canvas.width) this.speedX *= -1;
        if (this.baseY < 0 || this.baseY > this.canvas.height) this.speedY *= -1;
    };
    Particle.prototype.draw = function (ctx, isDark) {
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    };

    var particlesSystem;

    function refreshParticles() {
        if (particlesSystem && particlesSystem.init) particlesSystem.init();
    }
    window.__particlesRefresh = refreshParticles;

    /* --- Music --- */
    function updateMusicIcons(playing) {
        var playIcon = document.querySelector('.play-icon');
        var pauseIcon = document.querySelector('.pause-icon');
        if (!playIcon || !pauseIcon) return;
        playIcon.style.display = playing ? 'none' : 'block';
        pauseIcon.style.display = playing ? 'block' : 'none';
    }

    window.toggleMusic = function toggleMusic() {
        var music = document.getElementById('backgroundMusic');
        if (!music) return;
        var playIcon = document.querySelector('.play-icon');
        var pauseIcon = document.querySelector('.pause-icon');
        music.volume = 0.1;
        if (music.paused) {
            music.play().then(function () {
                localStorage.setItem(STORAGE_MUSIC, '1');
                if (playIcon) playIcon.style.display = 'none';
                if (pauseIcon) pauseIcon.style.display = 'block';
            }).catch(function () {
                localStorage.setItem(STORAGE_MUSIC, '0');
                updateMusicIcons(false);
            });
        } else {
            music.pause();
            localStorage.setItem(STORAGE_MUSIC, '0');
            if (playIcon) playIcon.style.display = 'block';
            if (pauseIcon) pauseIcon.style.display = 'none';
        }
    };

    function initMusicFromStorage() {
        var music = document.getElementById('backgroundMusic');
        if (!music) return;
        music.volume = 0.3;
        if (localStorage.getItem(STORAGE_MUSIC) === '1') {
            music.play().then(function () { updateMusicIcons(true); }).catch(function () {
                localStorage.setItem(STORAGE_MUSIC, '0');
                updateMusicIcons(false);
            });
        } else {
            updateMusicIcons(false);
        }
    }

    /* --- Modal --- */
    function openOrderModal() {
        var modal = document.getElementById('orderModal');
        if (!modal) return;
        modal.hidden = false;
        document.body.style.overflow = 'hidden';
        var closeBtn = document.getElementById('closeOrderModal');
        if (closeBtn) closeBtn.focus();
    }

    function closeOrderModal() {
        var modal = document.getElementById('orderModal');
        if (!modal) return;
        modal.hidden = true;
        document.body.style.overflow = '';
    }

    /* --- Video in-viewport (save CPU) --- */
    function setupVideoVisibility() {
        var videos = document.querySelectorAll('.project-image video');
        if (!('IntersectionObserver' in window)) {
            if (!prefersReducedMotion()) {
                videos.forEach(function (v) { v.play().catch(function () {}); });
            }
            return;
        }
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                var v = entry.target;
                if (!(v instanceof HTMLVideoElement)) return;
                if (entry.isIntersecting && !prefersReducedMotion()) {
                    v.play().catch(function () {});
                } else {
                    v.pause();
                }
            });
        }, { rootMargin: '80px', threshold: 0.15 });
        videos.forEach(function (v) { obs.observe(v); });
    }

    /* --- Boot --- */
    window.addEventListener('load', function () {
        particlesSystem = new ParticlesSystem();
        var sticker = document.getElementById('animatedSticker');
        if (sticker) {
            setTimeout(function () {
                if (prefersReducedMotion()) return;
                sticker.style.transition = 'opacity 0.3s ease';
                sticker.style.opacity = '1';
                sticker.style.visibility = 'visible';
                try { sticker.play(); } catch (e) {}
            }, 0);
            sticker.addEventListener('complete', function () {
                sticker.style.transition = 'opacity 0.2s ease, visibility 0s 0.2s';
                sticker.style.opacity = '0';
                sticker.style.visibility = 'hidden';
                setTimeout(function () { sticker.remove(); }, 250);
            });
        }
    });

    window.addEventListener('DOMContentLoaded', function () {
        resolveOgAbsoluteUrls();
        applySavedTheme();

        var themeBtn = document.getElementById('themeToggle');
        if (themeBtn) themeBtn.addEventListener('click', function () { window.toggleTheme(); });

        var musicBtn = document.getElementById('musicToggle');
        if (musicBtn) musicBtn.addEventListener('click', function () { window.toggleMusic(); });

        var logoBtn = document.getElementById('logoBtn');
        if (logoBtn) logoBtn.addEventListener('click', function () { window.triggerCodeAnimation(); });

        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
            if (localStorage.getItem(STORAGE_THEME) === null) applyThemeFromSystem();
        });

        window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', function () {
            if (window.__particlesRefresh) window.__particlesRefresh();
            syncLottieMotion();
            refreshVideoPlayback();
        });

        var sections = document.querySelectorAll('.section');
        var options = { threshold: 0.01, rootMargin: '0px 0px 200px 0px' };
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) entry.target.classList.add('visible');
            });
        }, options);
        sections.forEach(function (section) { observer.observe(section); });

        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            var href = anchor.getAttribute('href');
            if (!href || href === '#') return;
            anchor.addEventListener('click', function (e) {
                var target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
                }
            });
        });

        initMusicFromStorage();

        var openBtn = document.getElementById('openOrderModal');
        if (openBtn) openBtn.addEventListener('click', openOrderModal);
        var closeBtn = document.getElementById('closeOrderModal');
        if (closeBtn) closeBtn.addEventListener('click', closeOrderModal);
        var modal = document.getElementById('orderModal');
        if (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === modal) closeOrderModal();
            });
        }
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeOrderModal();
        });

        setupVideoVisibility();

        var resizeVideoTimer;
        window.addEventListener('resize', function () {
            clearTimeout(resizeVideoTimer);
            resizeVideoTimer = setTimeout(refreshVideoPlayback, 200);
        });

        if (!prefersReducedMotion()) window.triggerCodeAnimation();
    });
})();
