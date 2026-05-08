(function () {
    //FUNCTION SA BACKGROUND
    const canvas = document.getElementById("canvas");
    const ctx = canvas.getContext("2d");
    let width, height, particles;
    const particleCount = 210;
    const colors = ["#9500ff", "#4444ff", "#7700f7", "#3c9eff", "#ffe16e"];

    function initCanvas() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
        particles = [];
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
    }
    class Particle {
        constructor() {
            this.reset();
        }
        reset() {
            this.x = Math.random() * width;
            this.y = height / 2 + (Math.random() - 0.5) * 90;
            this.vx = (Math.random() - 0.5) * 9 + 1.2;
            this.vy = (Math.random() - 0.5) * 1.2;
            this.life = 0;
            this.maxLife = 55 + Math.random() * 140;
            this.color = colors[Math.floor(Math.random() * colors.length)];
            this.waveAmp = 1.8 + Math.random() * 6;
            this.waveFreq = 0.008 + Math.random() * 0.025;
        }
        draw() {
            ctx.beginPath();
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 1.6;
            ctx.globalAlpha = Math.max(0, 1 - this.life / this.maxLife) * 0.8;
            ctx.moveTo(this.x, this.y);
            this.x += this.vx;
            this.y += this.vy + Math.sin(this.x * this.waveFreq) * this.waveAmp * 0.6;
            ctx.lineTo(this.x, this.y);
            ctx.stroke();
            this.life++;
            if (
                this.life >= this.maxLife ||
                this.x > width + 70 ||
                this.x < -70 ||
                this.y > height + 120 ||
                this.y < -120
            ) {
                this.reset();
                this.x = Math.random() * width;
                this.y = height / 2 + (Math.random() - 0.5) * 110;
            }
        }
    }
    function animateCanvas() {
        ctx.fillStyle = "rgba(4, 10, 20, 0.12)";
        ctx.fillRect(0, 0, width, height);
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#2cf";
        particles.forEach((p) => p.draw());
        ctx.shadowBlur = 0;
        requestAnimationFrame(animateCanvas);
    }

    window.addEventListener("resize", () => {
        initCanvas();
    });
    initCanvas();
    animateCanvas();
    canvas.style.pointerEvents = "none";

    //TAB SWITCHING FROM LOGIN TO REGISTER
    const loginTab = document.getElementById("loginTabBtn");
    const registerTab = document.getElementById("registerTabBtn");
    const loginPanel = document.getElementById("loginPanel");
    const registerPanel = document.getElementById("registerPanel");

    if (loginTab && registerTab) {
        loginTab.addEventListener("click", () => {
            loginTab.classList.add("active");
            registerTab.classList.remove("active");
            loginPanel.classList.add("active");
            registerPanel.classList.remove("active");
        });

        registerTab.addEventListener("click", () => {
            registerTab.classList.add("active");
            loginTab.classList.remove("active");
            registerPanel.classList.add("active");
            loginPanel.classList.remove("active");
        });
    }

    const toast = document.getElementById("toastMsg");
    function showMessage(text, isError = false) {
        toast.style.opacity = "1";
        toast.style.color = isError ? "#ffab9a" : "#b6ffff";
        toast.style.borderLeftColor = isError ? "#ff5c7c" : "#0ef";
        toast.innerText = text;
        setTimeout(() => {
            toast.style.opacity = "0";
        }, 2700);
    }

    // Forgot password
    const fakeForgot = document.getElementById("fakeForgot");
    if (fakeForgot) {
        fakeForgot.addEventListener("click", (e) => {
            e.preventDefault();
            showMessage("📡 Contact administrator to reset password", false);
        });
    }

    // Login with API
    const loginForm = document.getElementById("loginFormElement");
    const loginEmail = document.getElementById("loginEmail");
    const loginPassword = document.getElementById("loginPassword");
    const rememberCheck = document.getElementById("rememberMeCheckbox");

    function loadRememberedLogin() {
        const savedMail = localStorage.getItem("rem_nexus_email");
        const savedFlag = localStorage.getItem("rem_nexus_flag");
        if (savedFlag === "true" && savedMail) {
            loginEmail.value = savedMail;
            rememberCheck.checked = true;
        }
    }
    loadRememberedLogin();

    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const email = loginEmail.value.trim();
            const pwd = loginPassword.value.trim();

            if (!email || !pwd) {
                showMessage("⚠️ Please enter email and password", true);
                return;
            }

            try {
                const response = await fetch('api/login.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: email, password: pwd })
                });
                const data = await response.json();

                if (data.success) {
                    if (rememberCheck.checked) {
                        localStorage.setItem("rem_nexus_email", email);
                        localStorage.setItem("rem_nexus_flag", "true");
                    } else {
                        localStorage.removeItem("rem_nexus_email");
                        localStorage.setItem("rem_nexus_flag", "false");
                    }

                    localStorage.setItem("nexus_logged_in_user", JSON.stringify(data.user));
                    showMessage(`✅ Welcome back, ${data.user.fullname}! Redirecting...`, false);
                    
                    setTimeout(() => {
                       window.location.href = "dashboard.html";
                    }, 1500);
                } else {
                    showMessage("❌ " + data.message, true);
                }
            } catch(error) {
                showMessage("❌ Connection error. Please try again.", true);
            }
        });
    }

    const regForm = document.getElementById("registerFormElement");
    const regFull = document.getElementById("regFullname");
    const regEmail = document.getElementById("regEmail");
    const regPass = document.getElementById("regPassword");
    const regConfirm = document.getElementById("regConfirmPassword");
    const termsBox = document.getElementById("termsCheckbox");

    if (regForm) {
        regForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const fullname = regFull.value.trim();
            const emailRaw = regEmail.value.trim();
            const email = emailRaw.toLowerCase();
            const password = regPass.value.trim();
            const confirmPwd = regConfirm.value.trim();

            if (!fullname || !email || !password || !confirmPwd) {
                showMessage("📝 All fields are required", true);
                return;
            }
            if (password.length < 5) {
                showMessage("🔐 Password must be at least 5 characters", true);
                return;
            }
            if (password !== confirmPwd) {
                showMessage("⛔ Passwords do not match", true);
                return;
            }
            if (!termsBox.checked) {
                showMessage("📜 Please accept Terms & Conditions", true);
                return;
            }
            if (!email.includes("@") || !email.includes(".")) {
                showMessage("📧 Enter a valid email address", true);
                return;
            }

            try {
                const response = await fetch('api/register.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullname: fullname, email: email, password: password })
                });
                const data = await response.json();

                if (data.success) {
                    showMessage(`🎉 Account created! Welcome ${fullname}. Please login.`, false);
                    
                    regFull.value = "";
                    regEmail.value = "";
                    regPass.value = "";
                    regConfirm.value = "";
                    termsBox.checked = false;

                    setTimeout(() => {
                        if(loginTab) loginTab.click();
                        loginEmail.value = email;
                        loginPassword.value = "";
                        showMessage("🔓 Now you can login with your new credentials", false);
                    }, 1500);
                } else {
                    showMessage("❌ " + data.message, true);
                }
            } catch(error) {
                showMessage("❌ Registration failed. Please try again.", true);
            }
        });
    }

    setTimeout(() => {
        if (!localStorage.getItem("nexus_hint")) {
            showMessage("💡 Click REGISTER to create an account", false);
            localStorage.setItem("nexus_hint", "true");
        }
    }, 600);
})();