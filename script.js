/* --- script.js --- */

// Safe GSAP Registration
if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Global Cart State
let cart = JSON.parse(localStorage.getItem("hmtCart")) || [];

// =========================================
// 1. INITIALIZATION & INJECTION
// =========================================
window.addEventListener("load", () => {
  injectCartHTML();
  updateCartCount();
  handlePreloader();
});

function handlePreloader() {
  const preloader = document.querySelector(".preloader");
  if (preloader) {
    const fadeOut = () => {
      preloader.style.opacity = "0";
      setTimeout(() => {
        preloader.style.display = "none";
        document.body.classList.remove("loading");
        initPageAnimations();
      }, 800);
    };
    // If page is already loaded or loads instantly
    if (document.readyState === "complete") fadeOut();
    else setTimeout(fadeOut, 800);
  }
}

// Inject the Cart HTML Structure into the page automatically
function injectCartHTML() {
  const cartHTML = `
    <div class="cart-overlay" onclick="toggleCart()"></div>
    <div class="cart-sidebar">
        <div class="cart-header">
            <h3>Acquisitions</h3>
            <button class="close-cart" onclick="toggleCart()"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div class="cart-items" id="cartItemsContainer">
            <div class="empty-cart-msg">
                <i class="fa-solid fa-box-open"></i>
                <p>The vault is empty.</p>
                <a href="ownahmt.html" onclick="toggleCart()" class="btn-text">Browse Collection</a>
            </div>
        </div>
        <div class="cart-footer">
            <div class="cart-total">
                <span>Total Estimate</span>
                <span id="cartTotalValue">₹ 0</span>
            </div>
            <button class="btn-glass gold full-width" onclick="checkout()">
                Proceed to Secure <i class="fa-solid fa-shield-halved"></i>
            </button>
        </div>
    </div>
  `;
  document.body.insertAdjacentHTML("beforeend", cartHTML);
}

// =========================================
// 2. ANIMATIONS (GSAP)
// =========================================
function initPageAnimations() {
  if (typeof gsap === "undefined") return;

  // Hero Card
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

  // Stagger Product Cards
  if (document.querySelector(".product-card")) {
    gsap.from(".product-card", {
      y: 30, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.out",
    });
  }

  // Initialize Counters if they exist
  if (document.querySelector(".counter")) initCounters();
}

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

// =========================================
// 3. CART LOGIC (The Engine)
// =========================================

// Open/Close Cart
window.toggleCart = function (e) {
  if (e) e.preventDefault();
  const sidebar = document.querySelector(".cart-sidebar");
  const overlay = document.querySelector(".cart-overlay");
  const body = document.body;

  if (sidebar.classList.contains("open")) {
    sidebar.classList.remove("open");
    overlay.classList.remove("open");
    body.classList.remove("no-scroll");
  } else {
    renderCartItems(); // Re-render every time we open to ensure freshness
    sidebar.classList.add("open");
    overlay.classList.add("open");
    body.classList.add("no-scroll");
  }
};

// Add Item
window.addToCart = function (e, name, price = 0, image = "") {
  if (e) e.preventDefault();
  
  // Clean price string if it comes with '₹' or commas
  if (typeof price === 'string') {
      price = parseInt(price.replace(/[^0-9]/g, ''));
  }

  // If image isn't passed, try to find it in the DOM (clicked card)
  if (!image && e && e.target) {
      const card = e.target.closest('.product-card') || e.target.closest('.hero-slide');
      if (card) {
          const imgEl = card.querySelector('img');
          if (imgEl) image = imgEl.src;
          
          // Fallback price finder
          if (price === 0) {
             const priceEl = card.querySelector('.price');
             if(priceEl) price = parseInt(priceEl.innerText.replace(/[^0-9]/g, ''));
          }
      }
  }

  // Default Fallbacks
  if (price === 0) price = 8500; // Default fallback price
  if (!image) image = 'assets/hmt_janata-front1.png';

  // Check if exists
  const existingItem = cart.find(item => item.name === name);
  if (existingItem) {
    existingItem.qty++;
  } else {
    cart.push({ name, price, image, qty: 1 });
  }

  saveCart();
  updateCartCount();
  showToast(`Added <strong>${name}</strong> to cart.`);
  
  // Optional: Auto open cart on add
  // toggleCart(); 
};

// Render Items in Sidebar
function renderCartItems() {
  const container = document.getElementById("cartItemsContainer");
  const totalEl = document.getElementById("cartTotalValue");
  
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="empty-cart-msg">
          <i class="fa-solid fa-box-open"></i>
          <p>The vault is empty.</p>
          <a href="ownahmt.html" onclick="toggleCart()" class="btn-text" style="color:var(--gold)">Browse Collection</a>
      </div>`;
    totalEl.innerText = "₹ 0";
    return;
  }

  let total = 0;
  container.innerHTML = cart.map((item, index) => {
    total += item.price * item.qty;
    return `
      <div class="cart-item">
          <div class="cart-img">
              <img src="${item.image}" alt="${item.name}">
          </div>
          <div class="cart-details">
              <h4>${item.name}</h4>
              <p class="cart-price">₹ ${item.price.toLocaleString()}</p>
              <div class="qty-controls">
                  <button onclick="changeQty(${index}, -1)">-</button>
                  <span>${item.qty}</span>
                  <button onclick="changeQty(${index}, 1)">+</button>
              </div>
          </div>
          <button class="remove-item" onclick="removeItem(${index})">
              <i class="fa-solid fa-trash"></i>
          </button>
      </div>
    `;
  }).join("");

  totalEl.innerText = "₹ " + total.toLocaleString();
}

// Update Quantity
window.changeQty = function (index, delta) {
  cart[index].qty += delta;
  if (cart[index].qty <= 0) {
    cart.splice(index, 1);
  }
  saveCart();
  renderCartItems();
  updateCartCount();
};

// Remove Item
window.removeItem = function (index) {
  cart.splice(index, 1);
  saveCart();
  renderCartItems();
  updateCartCount();
};

// Save to LocalStorage
function saveCart() {
  localStorage.setItem("hmtCart", JSON.stringify(cart));
}

// Update the badge in the Nav
function updateCartCount() {
  const countSpan = document.getElementById("cart-count");
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  if (countSpan) countSpan.innerText = totalQty;
}

// Fake Checkout
window.checkout = function () {
  if (cart.length === 0) {
      showToast("Cart is empty.", "fa-circle-exclamation");
      return;
  }
  
  const btn = document.querySelector(".cart-footer button");
  const originalText = btn.innerHTML;
  
  btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Securing...`;
  
  setTimeout(() => {
      btn.innerHTML = `<i class="fa-solid fa-check"></i> Request Sent`;
      btn.style.borderColor = "var(--neon-green)";
      btn.style.color = "var(--neon-green)";
      
      showToast("Acquisition request transmitted.", "fa-file-signature");
      
      // Clear Cart
      cart = [];
      saveCart();
      renderCartItems();
      updateCartCount();
      
      setTimeout(() => {
          toggleCart();
          btn.innerHTML = originalText;
          btn.style.borderColor = "";
          btn.style.color = "";
      }, 2000);
  }, 1500);
};

// Alias for nav button
window.openCart = function(e) {
    toggleCart(e);
}

// =========================================
// 4. UTILS & NAVIGATION
// =========================================

// Mobile Menu
const navLinks = document.querySelector(".nav-links");
const menuTrigger = document.querySelector(".menu-trigger");

window.toggleMenu = function () {
  if (!navLinks) return;
  navLinks.classList.toggle("active");
  document.body.classList.toggle("no-scroll");

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

// Toast Notification
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

// Filter Logic (Shop Page)
window.filterSearch = function () {
    const input = document.getElementById("inventorySearch");
    if (!input) return;
    const val = input.value.toLowerCase();
    const cards = document.querySelectorAll(".product-card");
    const noResults = document.getElementById("noResults");
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

const filterBtns = document.querySelectorAll(".filter-btn");
if (filterBtns.length > 0) {
  filterBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      filterBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      const filter = btn.getAttribute("data-filter");
      const cards = document.querySelectorAll(".product-card");
      
      cards.forEach((card) => {
        if (filter === "all" || card.getAttribute("data-category") === filter) {
          card.style.display = "flex";
          if (typeof gsap !== "undefined") {
            gsap.fromTo(card, { scale: 0.95, opacity: 0.5 }, { scale: 1, opacity: 1, duration: 0.3 });
          }
        } else {
          card.style.display = "none";
        }
      });
    });
  });
}

// Slider Logic
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

// Login Handler
window.handleLogin = function(e) { e.preventDefault(); /* ... existing login logic ... */ }; 
// Contact Handler
window.handleContact = function(e) { e.preventDefault(); /* ... existing contact logic ... */ };