/**
 * Obtener elementos del DOM
 */

const canvas = document.getElementById("canvas");
const btn = document.getElementById("btn");
const input_txt = document.getElementById("input_txt");
const msg = document.getElementById("msg");
let ctx = canvas.getContext("2d");
let menu = document.getElementById("menu");

// Obtener el botón y el ícono
const playPauseBtn = document.getElementById('playPauseBtn');
const playPauseIcon = document.getElementById('playPauseIcon');

let numCirculos = document.getElementById("num_circulos");
let numCirculosEliminados = document.getElementById("num_circulos_eliminados");
let porcentaje = document.getElementById("porcentaje");
let txt_level = document.getElementById("level");

/**
 * Establecer dimensiones del lienzo
 */

const window_height = window.innerHeight *.7;
const window_width = window.innerWidth <= 780 ? window.innerWidth * .90 : window.innerWidth * 0.60;

menu.style.width = `${window_width}px`;

/**
 * Inicializar variables
 */

let circles = []; // Array para almacenar los círculos
let sonido = new Audio('./assets/audio.mp3'); // Objeto de audio para el sonido de colisión
let sonido_d = new Audio('./assets/disparo.mp3'); // Objeto de audio para el sonido de colisión
let collisionTimer = 0; // Temporizador para manejar el color de fondo tras colisiones
let nuevo = false;

let totalRemoved = 0; // Contador para los círculos eliminados
let totalCircles = 0;  // Total de círculos generados
let level = 1; // Nivel inicial
let newLevel = false;
let isPause = false;
let isPlaying = false;

let pelotaImg = new Image();
pelotaImg.src = './assets/circle.png'; 

let background = new Image();
background.src = window.innerWidth <= 400 ? "./assets/background.jpg": "./assets/background1.jpg";

// Establecer propiedades del lienzo
canvas.height = window_height;
canvas.width = window_width;
canvas.style.background = "rgb(206, 206, 206)"; // Color de fondo inicial

/**
 * Definición de la clase Circle
 * Representa un círculo en el lienzo con propiedades como posición, radio, color y velocidad.
 */

class Circle {
    constructor(x, y, radius, color, speed, dir) {
        this.posX = x; // Posición X del círculo
        this.posY = y; // Posición Y del círculo
        this.radius = radius; // Radio del círculo
        this.color = color; // Color del círculo
        this.speed = speed; // Velocidad de movimiento del círculo

        this.dx = dir * 0.25 * this.speed; // Cambio en la posición X
        this.dy = -0.25 * this.speed; // Cambio en la posición Y

        this.deleted = false; // Bandera para indicar si el círculo ha sido eliminado
    }

    /**
     * Método para dibujar el círculo en el contexto
     * @param {CanvasRenderingContext2D} context - El contexto del lienzo donde se dibuja el círculo.
     */

    draw(context) {

        if (this.deleted) return;

        context.beginPath();
        context.strokeStyle = this.color; // Color del borde

        context.lineWidth = 2; // Ancho del borde
        context.arc(this.posX, this.posY, this.radius, 0, Math.PI * 2, false); // Dibujar el círculo
        context.drawImage(pelotaImg, this.posX - this.radius, this.posY - this.radius, this.radius * 2, this.radius * 2);
        context.stroke(); // Aplicar el trazo
        context.closePath();
    }

    /**
     * Método para actualizar la posición del círculo
     * Dibuja el círculo y maneja las colisiones con los bordes del lienzo.
     * @param {CanvasRenderingContext2D} context - El contexto del lienzo donde se dibuja el círculo.
     */

    update(context) {
        this.draw(context); // Dibujar el círculo

        // Manejar colisiones con los bordes del lienzo
        if ((this.posX + this.radius) >= window_width || (this.posX - this.radius) <= 0) {
            this.dx = -this.dx; // Invertir dirección en X
        }

        // Si el círculo ha salido por la parte superior, reiniciar su posición en la parte inferior
        if (this.posY + this.radius < 0) {
            this.posY = window_height + this.radius; // Reiniciar fuera de la pantalla (debajo del lienzo)
        }

        this.posX += this.dx; // Actualizar posición X
        this.posY += this.dy; // Actualizar posición Y
    }
}

/**
 * Función para detectar colisiones entre dos círculos
 * @param {Circle} obj1 - El primer círculo.
 * @param {Circle} obj2 - El segundo círculo.
 * @returns {boolean} - Retorna verdadero si hay colisión.
 */

let checkCollision = function (obj1, obj2) {
    let d = Math.sqrt(Math.pow(obj1.posX - obj2.posX, 2) + Math.pow(obj1.posY - obj2.posY, 2));
    return d <= obj1.radius + obj2.radius; // Retorna verdadero si hay colisión
};

/**
 * Función para manejar la colisión entre dos círculos
 * Ajusta las posiciones de los círculos y cambia su color al colisionar.
 * @param {Circle} obj1 - El primer círculo.
 * @param {Circle} obj2 - El segundo círculo.
 */

let handleCollision = function (obj1, obj2) {
    let d = Math.sqrt(Math.pow(obj1.posX - obj2.posX, 2) + Math.pow(obj1.posY - obj2.posY, 2));
    let overlap = obj1.radius + obj2.radius - d; // Solapamiento entre los círculos

    if (overlap > 0) {
        let angle = Math.atan2(obj2.posY - obj1.posY, obj2.posX - obj1.posX);
        let moveX = overlap * Math.cos(angle) / 2; // Mover ambos círculos a la mitad
        let moveY = overlap * Math.sin(angle) / 2;

        obj1.posX -= moveX; // Ajustar posición del círculo 1
        obj1.posY -= moveY; // Ajustar posición del círculo 1
        obj2.posX += moveX; // Ajustar posición del círculo 2
        obj2.posY += moveY; // Ajustar posición del círculo 2
    }

    // Intercambiar velocidades
    let tempDx = obj1.dx;
    let tempDy = obj1.dy;
    obj1.dx = obj2.dx;
    obj1.dy = obj2.dy;
    obj2.dx = tempDx;
    obj2.dy = tempDy;

    // Cambiar color de los círculos al colisionar
    obj1.color = "red";
    obj2.color = "red";
};

/**
 * Función para dibujar los círculos
 * Genera y dibuja círculos en el lienzo.
 */

function drawCircles() {
    for (i = 0; i < 2;i ++)
        drawCircle();

    let intervalID = setInterval(function() {
        if (!isPause) {
            drawCircle();

            if (circles.length >= 20) {
                clearInterval(intervalID);
            }
        }
    }, 2000);
}

/**
 * Función auxiliar para generar y agregar un solo círculo
 * Crea un círculo en una posición aleatoria y lo agrega al array de círculos.
 */

function drawCircle() {
    let randomX, randomY, randomRadius, dir;
    let overlap = true;

    while (overlap) {
        randomX = Math.random() * (window_width - 100) + 50;
        randomY = Math.random() * 100 + window_height; // Posición Y inicial fuera de la pantalla (abajo)
        randomRadius = Math.floor(Math.random() * 30 + 20);
        dir = Math.random() < 0.5 ? -1 : 1;

        overlap = false;
        for (let j = 0; j < circles.length; j++) {
            if (checkCollision({ posX: randomX, posY: randomY, radius: randomRadius }, circles[j])) {
                overlap = true;
                break;
            }
        }
    }

    let speed = level;
    let color = "blue";
    circles.push(new Circle(randomX, randomY, randomRadius, color, speed, dir));
    totalCircles ++; // Solo incrementa el total cuando se agrega un solo círculo
}

/**
 * Función para actualizar la animación de los círculos
 * Actualiza la posición de cada círculo y maneja las colisiones.
 */

let updateCircle = function () {
    
    if (!isPause){
        animationId = requestAnimationFrame(updateCircle);
    }

    if (circles.length >= 20){
        cancelAnimationFrame(animationId);
        ctx.clearRect(0, 0, window_width, window_height); // Limpiar el lienzo
        ctx.drawImage(background, 0, 0, window_width, window_height);

        ctx.fillStyle = "rgb(181, 0, 0)"; // Color del texto
        ctx.font = "50px Arial"; // Fuente del texto
        ctx.textAlign = "center"; 
        ctx.fillText("GAME OVER", window_width / 2, window_height / 2); // Mostrar mensaje en el centro

        playPauseIcon.classList.remove('bi-pause-fill');
        playPauseIcon.classList.add('bi-play-fill');
        isPlaying = false;
        isPause = false;
        return;
    }

    ctx.clearRect(0, 0, window_width, window_height); // Limpiar el lienzo
    ctx.drawImage(background, 0, 0, window_width, window_height);

    for (let i = 0; i < circles.length; i++) {
        circles[i].update(ctx); // Actualizar cada círculo
    }

    let collisionDetected = false;

    for (let i = 0; i < circles.length; i++) {
        for (let j = i + 1; j < circles.length; j++) {
            if (checkCollision(circles[i], circles[j])) {
                handleCollision(circles[i], circles[j]); // Manejar colisión
                collisionDetected = true;
                // Reproducir el sonido solo una vez si no se está reproduciendo
                sonido.currentTime = 0;  // Reinicia el sonido si no se está reproduciendo
                sonido.play();
            }
        }
    }

    if (collisionDetected) {
        canvas.style.backgroundColor = "rgb(160, 160, 160)"; // Cambiar color de fondo al colisionar
        collisionTimer = 50; // Temporizador para el color de fondo
    } else if (collisionTimer > 0) {
        collisionTimer--;
    } else {
        canvas.style.background = "rgb(206, 206, 206)"; // Restaurar color de fondo
        for (let i = 0; i < circles.length; i++) {
            circles[i].color = "blue";
        }
    }
    // Mostrar estadísticas de eliminación
    stats();
};

canvas.addEventListener('click', function(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    for (let i = 0; i < circles.length; i++) {
        const circle = circles[i];
        const distance = Math.sqrt((mouseX - circle.posX) ** 2 + (mouseY - circle.posY) ** 2);
        if (distance < circle.radius) {
            if (totalRemoved % 10 == 0 && totalRemoved > 0) {
                level ++;
            }
            totalRemoved++;
            animateShrink(circle, i); // Iniciar animación de reducción
            break; // Salir del bucle después de seleccionar un círculo
        }
    }

    sonido_d.currentTime = 0;  // Reinicia el sonido si no se está reproduciendo
    sonido_d.play();
});

canvas.addEventListener('mousemove', function(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Verificar si el mouse está sobre alguna pelota
    for (let i = 0; i < circles.length; i++) {
        const circle = circles[i];
        const distance = Math.sqrt((mouseX - circle.posX) ** 2 + (mouseY - circle.posY) ** 2);
        if (distance < circle.radius) {
            circle.color = "rgb(0, 171, 28)";
            break;
        }
    }
});

/**
 * Función para reducir el círculo gradualmente
 * Disminuye el radio del círculo hasta que desaparezca.
 * @param {Circle} circle - El círculo a reducir.
 * @param {number} index - El índice del círculo en el array.
 */

function animateShrink(circle, index) {
    const shrinkInterval = setInterval(() => {
        circle.radius -= 1; // Reducir el radio poco a poco
        if (circle.radius <= 0) {
            circle.deleted = true;
            circles.splice(index, 1); // Eliminar del array
            clearInterval(shrinkInterval); // Detener la animación cuando desaparezca
        }
    }, 20); // Ajusta la velocidad de desaparición
}

/**
 * Función para mostrar los resultados
 * Actualiza las estadísticas de círculos generados y eliminados en la interfaz.
 */

let stats = function() {
    let percentageRemoved = ((totalRemoved / totalCircles) * 100).toFixed(2); // Calcular el porcentaje de eliminaciones
    
    numCirculos.innerText = totalCircles;
    numCirculosEliminados.innerText = totalRemoved;
    porcentaje.innerText = percentageRemoved;
    txt_level.innerText = level;   
}

// Añadir un manejador de clics
playPauseBtn.addEventListener('click', () => {

    // Cambiar el ícono entre play y pause
    if (playPauseIcon.classList.contains('bi-play-fill')) {
        playPauseIcon.classList.remove('bi-play-fill');
        playPauseIcon.classList.add('bi-pause-fill');

        if (!isPause && !isPlaying) {
            resetGame ();
            isPlaying = true;
        }else{
            isPause = false;
            animationId = requestAnimationFrame(updateCircle); // Reanudar la animación
        }

    } else {
        playPauseIcon.classList.remove('bi-pause-fill');
        playPauseIcon.classList.add('bi-play-fill');
        isPause = true;
    }
});

function resetGame() {
    // Restablecer variables
    circles = []; // Limpiar los círculos
    totalRemoved = 0; // Reiniciar contador de eliminaciones
    totalCircles = 0; // Reiniciar contador de círculos generados
    level = 1; // Restablecer nivel
    isPause = false;
    isPlaying = false;

    // Restablecer el lienzo
    ctx.clearRect(0, 0, window_width, window_height);
    ctx.drawImage(background, 0, 0, window_width, window_height);

    // Restablecer el texto de "Game Over"
    canvas.style.background = "rgb(206, 206, 206)"; // Fondo normal
    playPauseIcon.classList.remove('bi-play-fill');
    playPauseIcon.classList.add('bi-pause-fill');
    
    // Llamar a la función de reiniciar el juego (iniciar de nuevo la animación y los círculos)
    drawCircles();
    updateCircle();
}

window.onload = function () {
    ctx.clearRect(0, 0, window_width, window_height); // Limpiar el lienzo
    ctx.drawImage(background, 0, 0, window_width, window_height); // Dibujar el fondo
};
