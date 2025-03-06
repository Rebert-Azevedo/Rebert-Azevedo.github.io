const media = [
	"assets/imgs/img_1.jpg",
	"assets/imgs/img_2.jpg",
	"assets/imgs/img_3.jpg",
	"assets/imgs/img_4.jpg",
	"assets/imgs/img_5.jpeg",
	"assets/imgs/Nos.mp4",
];
let index = 0;

function changeMedia() {
	const carouselContainer = document.querySelector(".carousel");
	const currentMedia = document.getElementById("carousel-media");
	const newMedia = media[index];

	const newElement = newMedia.endsWith(".mp4")
		? document.createElement("video")
		: document.createElement("img");
	newElement.src = newMedia;
	newElement.classList.add("carousel-media");
	newElement.id = "carousel-media";

	if (newMedia.endsWith(".mp4")) {
		newElement.autoplay = true;
		newElement.loop = true;
		newElement.muted = true;
	} else {
		newElement.alt = "Casal";
	}
	carouselContainer.replaceChild(newElement, currentMedia);
	index = (index + 1) % media.length;
}

setInterval(changeMedia, 4000);

const RELATIONSHIP_START = new Date("2023-02-28T14:00:00");

function updateCounter() {
	const now = new Date();
	const start = new Date(RELATIONSHIP_START);

	// Diferença de anos, meses e dias
	let years = now.getFullYear() - start.getFullYear();
	let months = now.getMonth() - start.getMonth();
	let days = now.getDate() - start.getDate();

	// Ajuste se o mês ainda não completou
	if (months < 0) {
		years--;
		months += 12;
	}

	// Ajuste se os dias ainda não completaram
	if (days < 0) {
		const previousMonth = new Date(now.getFullYear(), now.getMonth(), 0);
		days += previousMonth.getDate();
		months--;

		if (months < 0) {
			years--;
			months += 12;
		}
	}

	// Calcula horas, minutos e segundos corretamente
	let hours = now.getHours() - start.getHours();
	let minutes = now.getMinutes() - start.getMinutes();
	let seconds = now.getSeconds() - start.getSeconds();

	// Ajusta valores negativos nas horas/minutos/segundos
	if (seconds < 0) {
		seconds += 60;
		minutes--;
	}
	if (minutes < 0) {
		minutes += 60;
		hours--;
	}
	if (hours < 0) {
		hours += 24;
		days--;
	}

	document.getElementById("counter").innerHTML =
		`${years} anos, ${months} meses, ${days} dias, <br>${hours}h ${minutes}m ${seconds}s`;
}

// Atualiza o contador a cada segundo
setInterval(updateCounter, 1000);
updateCounter();




setInterval(updateCounter, 900);

function createHeart() {
	const heart = document.createElement("div");
	heart.innerHTML = "❤️";
	heart.classList.add("heart");
	heart.style.left = `${Math.random() * window.innerWidth}px`;
	heart.style.top = "-10vh";
	heart.style.animationDuration = `${Math.random() * 2 + 3}s`;
	document.body.appendChild(heart);
	setTimeout(() => {
		if (heart?.parentNode) {
			heart.parentNode.removeChild(heart);
		}
	}, Number.parseFloat(heart.style.animationDuration) * 1000);
}

setInterval(createHeart, 300);






/*const media = [
    "assets/imgs/img_1.jpg", "assets/imgs/img_2.jpg", "assets/imgs/img_3.jpg", 
    "assets/imgs/img_4.jpg", "assets/imgs/img_5.jpeg", "assets/imgs/Nos.mp4"
];

let index = 0;

function changeMedia() {
    const carouselContainer = document.querySelector(".carousel");
    const currentMedia = document.getElementById("carousel-media");
    const newMedia = media[index];

    if (newMedia.endsWith(".mp4")) {
        const videoElement = document.createElement("video");
        videoElement.src = newMedia;
        videoElement.autoplay = true;
        videoElement.loop = true;
        videoElement.muted = true;
        videoElement.classList.add("carousel-media");

        carouselContainer.replaceChild(videoElement, currentMedia);
        videoElement.id = "carousel-media";
    } else {
        const imgElement = document.createElement("img");
        imgElement.src = newMedia;
        imgElement.alt = "Casal";
        imgElement.classList.add("carousel-media");

        carouselContainer.replaceChild(imgElement, currentMedia);
        imgElement.id = "carousel-media";
    }
    
    index = (index + 1) % media.length;
}

setInterval(changeMedia, 4000);

const RELATIONSHIP_START = new Date("2023-02-25T00:00:00");

function updateCounter() {
    const now = new Date();
    const diff = now - RELATIONSHIP_START;

    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((diff / (1000 * 60 * 60 * 24 * 30)) % 12);
    const days = Math.floor((diff / (1000 * 60 * 60 * 24)) % 30);
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    const seconds = Math.floor((diff / 1000) % 60);
    const milliseconds = diff % 1000;

    document.getElementById("counter").innerHTML = 
        `${years} anos, ${months} meses, ${days} dias, <br>` +
        `${hours}h ${minutes}m ${seconds}s ${milliseconds}ms`;
}

setInterval(updateCounter, 1);*/
