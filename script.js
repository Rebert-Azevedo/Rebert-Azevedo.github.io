// Dados e configurações
const media = [
    "assets/imgs/img_1.jpg",
    "assets/imgs/img_2.jpg",
    "assets/imgs/img_3.jpg",
    "assets/imgs/img_4.jpg",
    "assets/imgs/img_5.jpeg",
    "assets/imgs/Nos.mp4",
];
let mediaIndex = 0;
const relationshipStart = new Date("2023-02-28T14:00:00");
const heartInterval = 300; // Milissegundos
const mediaInterval = 4000; // Milissegundos
const counterInterval = 1000; // Milissegundos

// Elementos do DOM
const carouselContainer = document.querySelector(".carousel");
const counterElement = document.getElementById("counter");

// Funções utilitárias
const createElement = (tag, attributes = {}) => {
    const element = document.createElement(tag);
    Object.keys(attributes).forEach(key => element[key] = attributes[key]);
    return element;
};

const appendChildren = (parent, children) => {
    children.forEach(child => parent.appendChild(child));
};

// Funções principais
const changeMedia = () => {
    const newMedia = media[mediaIndex];
    const newElement = createElement(newMedia.endsWith(".mp4") ? "video" : "img", {
        src: newMedia,
        className: "carousel-media",
        id: "carousel-media",
        alt: "Casal",
        autoplay: newMedia.endsWith(".mp4"),
        loop: newMedia.endsWith(".mp4"),
        muted: newMedia.endsWith(".mp4"),
    });

    carouselContainer.replaceChild(newElement, document.getElementById("carousel-media"));
    mediaIndex = (mediaIndex + 1) % media.length;
};

const updateCounter = () => {
    const now = new Date();
    const diff = {
        years: now.getFullYear() - relationshipStart.getFullYear(),
        months: now.getMonth() - relationshipStart.getMonth(),
        days: now.getDate() - relationshipStart.getDate(),
        hours: now.getHours() - relationshipStart.getHours(),
        minutes: now.getMinutes() - relationshipStart.getMinutes(),
        seconds: now.getSeconds() - relationshipStart.getSeconds(),
    };

    if (diff.months < 0) {
        diff.years--;
        diff.months += 12;
    }
    if (diff.days < 0) {
        const previousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        diff.days += previousMonth.getDate();
        diff.months--;
        if (diff.months < 0) {
            diff.years--;
            diff.months += 12;
        }
    }
    if (diff.seconds < 0) {
        diff.seconds += 60;
        diff.minutes--;
    }
    if (diff.minutes < 0) {
        diff.minutes += 60;
        diff.hours--;
    }
    if (diff.hours < 0) {
        diff.hours += 24;
        diff.days--;
    }

    counterElement.innerHTML = `${diff.years} anos, ${diff.months} meses, ${diff.days} dias, <br>${diff.hours}h ${diff.minutes}m ${diff.seconds}s`;
};

const createHeart = () => {
    const heart = createElement("div", {
        innerHTML: "❤️",
        className: "heart",
        style: {
            left: `${Math.random() * window.innerWidth}px`,
            top: "-10vh",
            fontSize: `${Math.random() * 20 + 10}px`, // Variação de tamanho
            animationDuration: `${Math.random() * 2 + 3}s`, // Variação de velocidade
        },
    });

    document.body.appendChild(heart);
    setTimeout(() => heart.remove(), Number.parseFloat(heart.style.animationDuration) * 1000);
};

// Inicialização
setInterval(changeMedia, mediaInterval);
setInterval(updateCounter, counterInterval);
setInterval(createHeart, heartInterval);
updateCounter();