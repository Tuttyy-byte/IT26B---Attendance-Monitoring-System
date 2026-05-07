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

    //FUNCTION SA BACKGROUND

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


});
