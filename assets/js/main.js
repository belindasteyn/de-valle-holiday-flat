document.addEventListener("DOMContentLoaded", () => {
  const heroSlideshow = document.querySelector("[data-hero-slideshow]");
  if (heroSlideshow) {
    const slides = Array.from(heroSlideshow.querySelectorAll("img"));
    let activeSlide = 0;
    setInterval(() => {
      slides[activeSlide].classList.remove("is-active");
      activeSlide = (activeSlide + 1) % slides.length;
      slides[activeSlide].classList.add("is-active");
    }, 3000);
  }

  const revealElements = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.15 }
  );

  revealElements.forEach((element) => observer.observe(element));

  const galleryImages = Array.from(document.querySelectorAll(".gallery-card img"));
  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightbox-image");
  const closeButton = document.querySelector(".lightbox-close");
  const prevButton = document.querySelector(".lightbox-nav.prev");
  const nextButton = document.querySelector(".lightbox-nav.next");
  const galleryCards = document.querySelectorAll(".gallery-card");
  let currentIndex = 0;

  const openLightbox = (index) => {
    currentIndex = index;
    lightboxImage.src = galleryImages[currentIndex].src;
    lightboxImage.alt = galleryImages[currentIndex].alt;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  galleryCards.forEach((card, index) => {
    card.addEventListener("click", () => openLightbox(index));
  });

  closeButton.addEventListener("click", closeLightbox);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  prevButton.addEventListener("click", () => {
    currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    lightboxImage.src = galleryImages[currentIndex].src;
    lightboxImage.alt = galleryImages[currentIndex].alt;
  });

  nextButton.addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % galleryImages.length;
    lightboxImage.src = galleryImages[currentIndex].src;
    lightboxImage.alt = galleryImages[currentIndex].alt;
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("is-open")) {
      return;
    }
    if (event.key === "Escape") {
      closeLightbox();
    }
    if (event.key === "ArrowLeft") {
      currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
      lightboxImage.src = galleryImages[currentIndex].src;
      lightboxImage.alt = galleryImages[currentIndex].alt;
    }
    if (event.key === "ArrowRight") {
      currentIndex = (currentIndex + 1) % galleryImages.length;
      lightboxImage.src = galleryImages[currentIndex].src;
      lightboxImage.alt = galleryImages[currentIndex].alt;
    }
  });

  const calendarGrid = document.querySelector("[data-calendar]");
  const calendarTitle = document.querySelector("[data-calendar-title]");
  const prevMonthButton = document.querySelector("[data-calendar-prev]");
  const nextMonthButton = document.querySelector("[data-calendar-next]");
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
  ];
  let viewDate = new Date();
  let bookedDates = new Set();

  const getDateKey = (date) => `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

  const parseBookedDatesFile = (text) => {
    const dates = new Set();

    const addSingleDate = (dateText) => {
      const [year, month, day] = dateText.trim().split("-").map(Number);
      if (year && month && day) {
        dates.add(`${year}-${month - 1}-${day}`);
      }
    };

    const addDateRange = (startText, endText) => {
      const [startYear, startMonth, startDay] = startText.trim().split("-").map(Number);
      const [endYear, endMonth, endDay] = endText.trim().split("-").map(Number);
      const cursor = new Date(startYear, startMonth - 1, startDay);
      const end = new Date(endYear, endMonth - 1, endDay);
      while (cursor <= end) {
        dates.add(getDateKey(cursor));
        cursor.setDate(cursor.getDate() + 1);
      }
    };

    text.split(/\r?\n/).forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) {
        return;
      }
      if (trimmed.includes(" to ")) {
        const [startText, endText] = trimmed.split(" to ");
        addDateRange(startText, endText);
      } else {
        addSingleDate(trimmed);
      }
    });

    return dates;
  };

  const renderCalendar = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = (firstDay.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const previousMonthDays = new Date(year, month, 0).getDate();

    calendarTitle.textContent = `${monthNames[month]} ${year}`;
    calendarGrid.innerHTML = "";

    for (let i = startDay - 1; i >= 0; i -= 1) {
      const day = document.createElement("div");
      day.className = "day is-muted";
      day.textContent = previousMonthDays - i;
      calendarGrid.appendChild(day);
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dayCell = document.createElement("div");
      const date = new Date(year, month, day);
      const key = getDateKey(date);
      const isBooked = bookedDates.has(key);
      dayCell.className = `day ${isBooked ? "is-booked" : "is-available"}`;
      dayCell.textContent = day;
      calendarGrid.appendChild(dayCell);
    }

    const remainingCells = 42 - calendarGrid.children.length;
    for (let i = 1; i <= remainingCells; i += 1) {
      const day = document.createElement("div");
      day.className = "day is-muted";
      day.textContent = i;
      calendarGrid.appendChild(day);
    }
  };

  prevMonthButton.addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1);
    renderCalendar();
  });

  nextMonthButton.addEventListener("click", () => {
    viewDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1);
    renderCalendar();
  });

  fetch("booked-dates.txt")
    .then((response) => response.text())
    .then((text) => {
      bookedDates = parseBookedDatesFile(text);
      renderCalendar();
    })
    .catch(() => {
      renderCalendar();
    });

  const enquiryForm = document.getElementById("enquiry-form");
  const confirmationMessage = document.getElementById("form-confirmation");

  enquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const fullName = enquiryForm.fullName.value.trim();
    confirmationMessage.textContent = `Thank you, ${fullName || "guest"}. Your booking enquiry has been received and bookings are only confirmed once the owner responds.`;
    enquiryForm.reset();
  });
});
