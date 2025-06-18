// get references
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const loading_screen = document.getElementById('loading');

// loading state
let loaded = false;
let load_counter = 0;

// layer image objects
const background = new Image();
const mountain = new Image();
const grass = new Image();
const magpie = new Image();
const plant = new Image();

const layer_list = [
    { image: background, src: 'layer1.png', z_index: -10, blend: null, opacity: 1 },
    { image: mountain,   src: 'layer2.png', z_index: -4,  blend: null, opacity: 1 },
    { image: grass,      src: 'layer3.png', z_index: -2,  blend: 'lighten', opacity: 1 },
    { image: magpie,     src: 'layer4.png', z_index: 0,   blend: 'normal', opacity: 1 },
    { image: plant,      src: 'layer5.png', z_index: 2,   blend: 'normal', opacity: 1 }
];

// initial pointer & motion states
let pointer = { x: 0, y: 0 };
let pointer_initial = { x: 0, y: 0 };
let moving = false;

let motion_initial = { x: null, y: null };
let motion = { x: 0, y: 0 };

// Resize canvas and adjust for high DPI
function resizeCanvasToDisplaySize() {
    const dpr = window.devicePixelRatio || 1;
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;
    const width = Math.floor(displayWidth * dpr);
    const height = Math.floor(displayHeight * dpr);

    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }

    context.setTransform(1, 0, 0, 1, 0, 0); // reset transform
    context.scale(dpr, dpr); // high DPI scaling
}

// load images
layer_list.forEach((layer) => {
    layer.image.onload = () => {
        load_counter++;
        if (load_counter >= layer_list.length) {
            resizeCanvasToDisplaySize();
            hideLoading();
            requestAnimationFrame(drawCanvas);
        }
    };
    layer.image.src = layer.src;
});

function hideLoading() {
    loading_screen.classList.add('hidden');
}

function drawCanvas() {
    resizeCanvasToDisplaySize();
    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    TWEEN.update();

    const rotate_x = (pointer.y * -0.15) + (motion.y * -1.2);
    const rotate_y = (pointer.x * 0.15) + (motion.x * 1.2);
    canvas.style.transform = `rotateX(${rotate_x}deg) rotateY(${rotate_y}deg)`;

    const canvasWidth = canvas.clientWidth;
    const canvasHeight = canvas.clientHeight;
    const scaleBase = 900; // base width for images
    const scale = canvasWidth / scaleBase;

    layer_list.forEach((layer) => {
        const pos = getOffset(layer);

        context.globalCompositeOperation = layer.blend || 'normal';
        context.globalAlpha = layer.opacity;

        const img = layer.image;
        const imgWidth = img.width * scale;
        const imgHeight = img.height * scale;

        const x = (canvasWidth - imgWidth) / 2 + pos.x * scale;
        const y = (canvasHeight - imgHeight) / 2 + pos.y * scale;

        context.drawImage(img, x, y, imgWidth, imgHeight);
    });

    requestAnimationFrame(drawCanvas);
}

function getOffset(layer) {
    const touch_multiplier = 0.09;
    const motion_multiplier = 2;

    const touch_offset_x = pointer.x * layer.z_index * touch_multiplier;
    const touch_offset_y = pointer.y * layer.z_index * touch_multiplier;
    const motion_offset_x = motion.x * layer.z_index * motion_multiplier;
    const motion_offset_y = motion.y * layer.z_index * motion_multiplier;

    return {
        x: touch_offset_x + motion_offset_x,
        y: touch_offset_y + motion_offset_y
    };
}

// pointer input events
canvas.addEventListener('mousedown', pointerStart);
canvas.addEventListener('touchstart', pointerStart);

function pointerStart(event) {
    moving = true;
    if (event.type === 'touchstart') {
        pointer_initial.x = event.touches[0].clientX;
        pointer_initial.y = event.touches[0].clientY;
    } else {
        pointer_initial.x = event.clientX;
        pointer_initial.y = event.clientY;
    }
}

window.addEventListener('mousemove', pointerMove);
window.addEventListener('touchmove', pointerMove);

function pointerMove(event) {
    if (!moving) return;

    event.preventDefault();
    let current_x = 0, current_y = 0;

    if (event.type === 'touchmove') {
        current_x = event.touches[0].clientX;
        current_y = event.touches[0].clientY;
    } else {
        current_x = event.clientX;
        current_y = event.clientY;
    }

    pointer.x = current_x - pointer_initial.x;
    pointer.y = current_y - pointer_initial.y;
}

window.addEventListener('mouseup', endGesture);
window.addEventListener('touchend', endGesture);

function endGesture() {
    moving = false;
    TWEEN.removeAll();
    new TWEEN.Tween(pointer).to({ x: 0, y: 0 }, 300).easing(TWEEN.Easing.Back.Out).start();
}

// motion controls
window.addEventListener('deviceorientation', (event) => {
    if (motion_initial.x === null && motion_initial.y === null) {
        motion_initial.x = event.beta;
        motion_initial.y = event.gamma;
    }

    const o = window.orientation;

    if (o === 0) {
        motion.x = event.gamma - motion_initial.y;
        motion.y = event.beta - motion_initial.x;
    } else if (o === 90) {
        motion.x = event.beta - motion_initial.x;
        motion.y = -event.gamma + motion_initial.y;
    } else if (o === -90) {
        motion.x = -event.beta + motion_initial.x;
        motion.y = event.gamma - motion_initial.y;
    } else {
        motion.x = -event.gamma + motion_initial.y;
        motion.y = -event.beta + motion_initial.x;
    }
});

window.addEventListener('orientationchange', () => {
    motion_initial.x = null;
    motion_initial.y = null;
});

// iOS permission for motion
window.addEventListener('touchend', () => {
    if (
        window.DeviceOrientationEvent &&
        typeof DeviceOrientationEvent.requestPermission === 'function'
    ) {
        DeviceOrientationEvent.requestPermission().catch(console.error);
    }
});

window.addEventListener('resize', resizeCanvasToDisplaySize);

