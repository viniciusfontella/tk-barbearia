/* ==========================================================
   TK Barbearia - Landing page (v2)
   ========================================================== */

document.addEventListener("DOMContentLoaded", () => {
  initHeader();
  initMobileMenu();
  initReveal();
  initCounters();
  initRail();
  initSlider();
  initOpenStatus();
  setYear();
});

/* ---------- Header com sombra ao rolar ---------- */
function initHeader() {
  const header = document.getElementById("header");
  const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

/* ---------- Menu mobile ---------- */
function initMobileMenu() {
  const toggle = document.getElementById("menuToggle");
  const menu = document.getElementById("menu");

  const setOpen = (open) => {
    toggle.classList.toggle("open", open);
    menu.classList.toggle("open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  };

  toggle.addEventListener("click", () => setOpen(!menu.classList.contains("open")));
  menu.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });
}

/* ---------- Animação ao rolar ---------- */
function initReveal() {
  const items = document.querySelectorAll(".reveal");

  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
  );

  items.forEach((el) => observer.observe(el));
}

/* ---------- Contadores animados ---------- */
function initCounters() {
  const counters = document.querySelectorAll("[data-count]");
  const format = (n) => n.toLocaleString("pt-BR");

  const animate = (el) => {
    const target = Number(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const duration = 1600;
    const start = performance.now();

    const step = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = format(Math.floor(target * eased)) + (progress === 1 ? suffix : "");
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  if (!("IntersectionObserver" in window)) {
    counters.forEach((el) => (el.textContent = format(Number(el.dataset.count)) + (el.dataset.suffix || "")));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  counters.forEach((el) => observer.observe(el));
}

/* ---------- Carrossel horizontal de serviços ---------- */
function initRail() {
  const rail = document.getElementById("rail");
  const prev = document.getElementById("railPrev");
  const next = document.getElementById("railNext");
  if (!rail) return;

  // Se a foto do resultado não existir, esconde a imagem quebrada.
  // O espaço fica com o texto "Foto do resultado" até você colocar a imagem.
  // Remove imagens que não carregaram. Checa também as que já falharam antes deste script rodar.
  document.querySelectorAll(".service-media img, .about-visual img").forEach((img) => {
    const hide = () => img.remove();
    if (img.complete && img.naturalWidth === 0) hide();
    else img.addEventListener("error", hide);
  });

  // Distância de rolagem = largura de um card + espaço entre eles
  const step = () => {
    const card = rail.querySelector(".service-card");
    const gap = parseFloat(getComputedStyle(rail).gap) || 0;
    return card ? card.offsetWidth + gap : rail.clientWidth * 0.8;
  };

  prev.addEventListener("click", () => rail.scrollBy({ left: -step(), behavior: "smooth" }));
  next.addEventListener("click", () => rail.scrollBy({ left: step(), behavior: "smooth" }));

  // Desativa as setas nas extremidades
  const updateButtons = () => {
    const max = rail.scrollWidth - rail.clientWidth - 2;
    prev.disabled = rail.scrollLeft <= 2;
    next.disabled = rail.scrollLeft >= max;
  };
  rail.addEventListener("scroll", updateButtons, { passive: true });
  window.addEventListener("resize", updateButtons);
  updateButtons();

  // Arrastar com o mouse no computador
  let isDown = false;
  let startX = 0;
  let startScroll = 0;
  let moved = false;

  rail.addEventListener("mousedown", (e) => {
    isDown = true;
    moved = false;
    startX = e.pageX;
    startScroll = rail.scrollLeft;
    rail.style.scrollBehavior = "auto";
    rail.style.scrollSnapType = "none";
  });

  const endDrag = () => {
    if (!isDown) return;
    isDown = false;
    rail.style.scrollBehavior = "";
    rail.style.scrollSnapType = "";
  };
  rail.addEventListener("mouseleave", endDrag);
  rail.addEventListener("mouseup", endDrag);

  rail.addEventListener("mousemove", (e) => {
    if (!isDown) return;
    const dx = e.pageX - startX;
    if (Math.abs(dx) > 5) moved = true;
    rail.scrollLeft = startScroll - dx;
  });

  // Evita abrir o link "Agendar" ao soltar depois de arrastar
  rail.addEventListener("click", (e) => {
    if (moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, true);

  // Setas do teclado quando o carrossel estiver em foco
  rail.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") next.click();
    if (e.key === "ArrowLeft") prev.click();
  });
}

/* ---------- Slider de avaliações ---------- */
function initSlider() {
  const slides = Array.from(document.querySelectorAll(".slide"));
  const dotsWrap = document.getElementById("dots");
  const prevBtn = document.getElementById("prevSlide");
  const nextBtn = document.getElementById("nextSlide");
  const slider = document.getElementById("slider");
  if (!slides.length) return;

  let current = 0;
  let timer = null;
  const INTERVAL = 6000;

  const dots = slides.map((_, i) => {
    const dot = document.createElement("button");
    dot.className = "dot";
    dot.setAttribute("aria-label", `Ir para avaliação ${i + 1}`);
    dot.addEventListener("click", () => {
      goTo(i);
      restartTimer();
    });
    dotsWrap.appendChild(dot);
    return dot;
  });

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((s, i) => s.classList.toggle("is-active", i === current));
    dots.forEach((d, i) => d.classList.toggle("is-active", i === current));
  }

  function restartTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), INTERVAL);
  }

  prevBtn.addEventListener("click", () => {
    goTo(current - 1);
    restartTimer();
  });
  nextBtn.addEventListener("click", () => {
    goTo(current + 1);
    restartTimer();
  });

  let startX = 0;
  slider.addEventListener("touchstart", (e) => (startX = e.touches[0].clientX), { passive: true });
  slider.addEventListener("touchend", (e) => {
    const diff = e.changedTouches[0].clientX - startX;
    if (Math.abs(diff) > 50) {
      goTo(diff < 0 ? current + 1 : current - 1);
      restartTimer();
    }
  });

  slider.addEventListener("mouseenter", () => clearInterval(timer));
  slider.addEventListener("mouseleave", restartTimer);

  goTo(0);
  restartTimer();
}

/* ---------- Status aberto/fechado (fuso de São Paulo) ---------- */
function initOpenStatus() {
  const statusEl = document.getElementById("status");
  const statusText = statusEl.querySelector(".status-text");

  // 0 = domingo ... 6 = sábado. null = fechado.
  const SCHEDULE = {
    0: null,
    1: [8, 19],
    2: [8, 19],
    3: [8, 19],
    4: [8, 19],
    5: [8, 19],
    6: [8, 19],
  };
  const DAY_NAMES = ["domingo", "segunda-feira", "terça-feira", "quarta-feira", "quinta-feira", "sexta-feira", "sábado"];

  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
  const day = now.getDay();
  const hour = now.getHours() + now.getMinutes() / 60;

  document.querySelectorAll(".hours tr[data-day]").forEach((row) => {
    if (Number(row.dataset.day) === day) row.classList.add("is-today");
  });

  const slot = SCHEDULE[day];
  const isOpen = slot && hour >= slot[0] && hour < slot[1];

  if (isOpen) {
    statusEl.classList.add("open");
    statusText.textContent = `Aberto agora · fecha às ${slot[1]}:00`;
    return;
  }

  statusEl.classList.add("closed");

  let nextText = "";
  if (slot && hour < slot[0]) {
    nextText = `abre hoje às ${String(slot[0]).padStart(2, "0")}:00`;
  } else {
    for (let i = 1; i <= 7; i++) {
      const nextDay = (day + i) % 7;
      const nextSlot = SCHEDULE[nextDay];
      if (nextSlot) {
        const label = i === 1 ? "amanhã" : DAY_NAMES[nextDay];
        nextText = `abre ${label} às ${String(nextSlot[0]).padStart(2, "0")}:00`;
        break;
      }
    }
  }

  statusText.textContent = `Fechado agora · ${nextText}`;
}

/* ---------- Ano no rodapé ---------- */
function setYear() {
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
}