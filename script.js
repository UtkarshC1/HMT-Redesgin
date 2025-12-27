/* --- script.js --- */

// Safe GSAP Registration
if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// 0. PRELOADER & INITIALIZATION
window.addEventListener("load", () => {
  const preloader = document.querySelector(".preloader");

  const hidePreloader = () => {
    if (preloader && preloader.style.opacity !== "0") {
      preloader.style.opacity = "0";
      setTimeout(() => {
        preloader.style.display = "none";
        document.body.classList.remove("loading");
        initPageAnimations();
      }, 800);
    }
  };

  if (document.readyState === "complete") {
    hidePreloader();
  } else {
    setTimeout(hidePreloader, 800);
  }
  setTimeout(hidePreloader, 4000); // Fallback
});

// 1. ANIMATIONS
function initPageAnimations() {
  if (typeof gsap === "undefined") return;

  // Hero Animation
  if (document.querySelector(".hero-card")) {
    gsap.from(".hero-card", { y: 50, opacity: 0, duration: 1.2, ease: "power3.out", delay: 0.2 });
  }

  // Fade Up Elements
  gsap.utils.toArray('[data-animate="fade-up"]').forEach((el) => {
    gsap.from(el, {
      scrollTrigger: { trigger: el, start: "top 85%", toggleActions: "play none none reverse" },
      y: 50, opacity: 0, duration: 1, ease: "power2.out",
    });
  });

  if (document.querySelector(".counter")) initCounters();

  if (document.querySelector(".product-card")) {
    gsap.from(".product-card", {
      y: 30, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out",
    });
  }
}

// 2. COUNTER ANIMATION
function initCounters() {
  const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const counter = entry.target;
          const target = +counter.getAttribute("data-target");
          const inc = target / 60;
          let c = 0;
          const update = () => {
            c += inc;
            if (c < target) {
              counter.innerText = Math.ceil(c) + (target > 99 ? "M+" : "");
              requestAnimationFrame(update);
            } else {
              counter.innerText = target + (target > 99 ? "M+" : "");
            }
          };
          update();
          observer.unobserve(counter);
        }
      });
    }, { threshold: 0.5 });
  document.querySelectorAll(".counter").forEach((c) => observer.observe(c));
}

// 3. SLIDER LOGIC
const slides = document.querySelectorAll(".hero-slide");
if (slides.length > 0) {
  let currentSlideIndex = 0;
  const dots = document.querySelectorAll(".dot");
  let slideTimer;

  window.changeSlide = function (n) {
    showSlide(currentSlideIndex + n);
    resetAutoPlay();
  };
  window.goToSlide = function (n) {
    showSlide(n);
    resetAutoPlay();
  };

  function showSlide(n) {
    currentSlideIndex = (n + slides.length) % slides.length;
    slides.forEach((slide) => slide.classList.remove("active"));
    dots.forEach((dot) => dot.classList.remove("active"));

    slides[currentSlideIndex].classList.add("active");
    if (dots[currentSlideIndex]) dots[currentSlideIndex].classList.add("active");
  }

  function resetAutoPlay() {
    clearInterval(slideTimer);
    slideTimer = setInterval(() => window.changeSlide(1), 5000);
  }
  resetAutoPlay();
}

// 4. MOBILE MENU (Enhanced)
const navLinks = document.querySelector(".nav-links");
const menuTrigger = document.querySelector(".menu-trigger");

window.toggleMenu = function () {
  if (!navLinks) return;
  navLinks.classList.toggle("active");
  document.body.classList.toggle("no-scroll"); // Lock background scroll

  // Icon toggling
  if (menuTrigger) {
    const icon = menuTrigger.querySelector("i");
    if (icon) {
      if (navLinks.classList.contains("active")) {
        icon.classList.remove("fa-bars");
        icon.classList.add("fa-xmark");
      } else {
        icon.classList.remove("fa-xmark");
        icon.classList.add("fa-bars");
      }
    }
  }
};

// Close menu when a link is clicked
if (navLinks) {
  navLinks.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (navLinks.classList.contains("active")) toggleMenu();
    });
  });
}

// 5. SHOP FILTER LOGIC
const filterBtns = document.querySelectorAll(".filter-btn");
const cards = document.querySelectorAll(".product-card");
const noResults = document.getElementById("noResults");

if (filterBtns.length > 0) {
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.getAttribute("data-filter");
      let count = 0;

      cards.forEach((card) => {
        if (filter === "all" || card.getAttribute("data-category") === filter) {
          card.style.display = "flex";
          count++;
          if (typeof gsap !== "undefined") {
            gsap.fromTo(card, { scale: 0.95, opacity: 0.5 }, { scale: 1, opacity: 1, duration: 0.3 });
          }
        } else {
          card.style.display = "none";
        }
      });
      if (noResults) noResults.style.display = count === 0 ? "block" : "none";
    });
  });
}

window.filterSearch = function () {
  const input = document.getElementById("inventorySearch");
  if (!input) return;
  const val = input.value.toLowerCase();
  let count = 0;

  cards.forEach((card) => {
    const txt = card.innerText.toLowerCase();
    if (txt.includes(val)) {
      card.style.display = "flex";
      count++;
    } else {
      card.style.display = "none";
    }
  });
  if (noResults) noResults.style.display = count === 0 ? "block" : "none";
};

// 6. CART, LOGIN & CONTACT MOCK LOGIC
let cartCount = 0;
const cartSpan = document.getElementById("cart-count");

window.addToCart = function (e, productName) {
  if (e) e.preventDefault();
  cartCount++;
  if (cartSpan) cartSpan.innerText = cartCount;
  showToast(`Added <strong>${productName}</strong> to cart.`);
};

window.openCart = function (e) {
  if (e) e.preventDefault();
  if (cartCount === 0) showToast("Your cart is empty.", "fa-cart-shopping");
  else showToast("Checkout feature coming soon!", "fa-credit-card");
};

function showToast(message, icon = "fa-check") {
  const container = document.getElementById("toast-container");
  if (!container) return;
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${message}</span>`;
  container.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add("show"));
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 400);
  }, 3000);
}

window.handleLogin = function (e) {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const pass = document.getElementById("password").value;
  const btn = document.getElementById("loginBtn");

  if (!email || !pass) {
    showToast("Please enter credentials.", "fa-triangle-exclamation");
    return;
  }
  if (btn) {
    const btnText = btn.querySelector(".btn-text");
    const btnIcon = btn.querySelector("i");
    btnText.innerText = "Verifying...";
    btnIcon.className = "fa-solid fa-circle-notch fa-spin";
    setTimeout(() => {
      btnText.innerText = "Access Granted";
      btnIcon.className = "fa-solid fa-check";
      btn.style.borderColor = "var(--neon-green)";
      btn.style.color = "var(--neon-green)";
      showToast("Welcome back, Officer.", "fa-user-shield");
      setTimeout(() => (window.location.href = "index.html"), 1500);
    }, 2000);
  }
};

window.handleContact = function (e) {
  e.preventDefault();
  const btn = document.getElementById("contactBtn");
  if (!btn) return;
  const btnText = btn.querySelector(".btn-text");
  const btnIcon = btn.querySelector("i");
  const originalText = btnText.innerText;

  btnText.innerText = "Transmitting...";
  btnIcon.className = "fa-solid fa-circle-notch fa-spin";
  btn.style.opacity = "0.7";

  setTimeout(() => {
    btnText.innerText = "Sent query successfully.";
    btnIcon.className = "fa-solid fa-check";
    btn.style.borderColor = "var(--neon-green)";
    btn.style.color = "var(--neon-green)";
    btn.style.opacity = "1";
    showToast("Sent query successfully.", "fa-paper-plane");
    setTimeout(() => {
      const form = document.getElementById("contactForm");
      if (form) form.reset();
      btnText.innerText = originalText;
      btnIcon.className = "fa-solid fa-paper-plane";
      btn.style.borderColor = "rgba(255, 255, 255, 0.2)";
      btn.style.color = "#fff";
    }, 3000);
  }, 1500);
};