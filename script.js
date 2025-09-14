// 1. Mobile Menu Toggle
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
menuToggle.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

// 2. Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    e.preventDefault();
    document.querySelector(this.getAttribute("href")).scrollIntoView({
      behavior: "smooth"
    });
    navLinks.classList.remove("active");
  });
});

// 3. Typing Effect in Hero
const text = "Learn Guitar with Strumify 🎸";
let i = 0;
function typing() {
  if (i < text.length) {
    document.getElementById("typing").textContent += text.charAt(i);
    i++;
    setTimeout(typing, 100);
  }
}
typing();

// 4. Auto Year in Footer
document.getElementById("year").textContent = new Date().getFullYear();

// 5. Dynamic Courses
const courses = [
  { title: "Beginner Guitar Basics", desc: "Learn chords, strumming, and rhythm." },
  { title: "Intermediate Skills", desc: "Play full songs and explore new techniques." },
  { title: "Pro Level Guitar", desc: "Master improvisation, solos, and performance." }
];

const courseList = document.getElementById("courseList");
courses.forEach(course => {
  const card = document.createElement("div");
  card.className = "course-card";
  card.innerHTML = `<h3>${course.title}</h3><p>${course.desc}</p>`;
  courseList.appendChild(card);
});
