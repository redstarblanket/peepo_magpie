// === REFERENCES ===
const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const loading_screen = document.getElementById('loading');

// === STATE ===
let loaded = false;
let load_counter = 0;
let moving = false;

const pointer_initial = { x: 0, y: 0 };
const pointer = { x: 0, y: 0 };
const motion_initial = { x: null, y: null };
const motion = { x: 0, y: 0 };

// === LAYERS ===
const layer_list = [
    { image: new Image(), src: 'layer1.png', z_index: -5, position: { x: 0, y: 0 }, blend: null, opacity: 1 },
    { image: new Image(), src: 'layer2.png', z_index: -2, position: { x: 0, y: 0 }, blend: null, opacity: 1 },
    { image: new Image(), src: 'layer3.png', z_index: -1, position: { x: 0, y: 0 }, blend: 'lighten', opacity: 1 },
    { image: new Image(), src: 'layer4.png', z_index: -0.5, position: { x: 0, y: 0 }, blend: 'normal', opacity: 1 },
    { image: new Image(), src: 'layer5.png', z_index: 1.5, position: { x: 0, y: 0 }, blend: 'normal', opacity: 1 }
];

// === INITIAL LOAD ===
layer_list.forEach((layer) => {
    layer.image.onload = () => {
        load_counter += 1;
        if (load_counter >= layer_list.length) {
            resizeCanvasToDisplaySize();
            hideLoading();
            requestAnimationFrame(drawCanvas);
        }
    };
    layer.image.src = layer.src;
});

// === FUNCTIONS ===

function hideLoading() {
    loading_screen.classList.add('hidden');
}

function resizeCanvasToDisplaySize() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
    }
}

function getOffset(layer) {
    const touch_multiplier = 0.09;
    const motion_multiplier = 2;

    const offset = {
        x: pointer.x * layer.z_index * touch_multiplier + motion.x * layer.z_index * motion_multiplier,
        y: pointer.y * layer.z_index * touch_multiplier + motion.y * layer.z_index * motion_multiplier
    };

    return offset;
}

function drawCanvas() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    TWEEN.update();

    const rotate_x = (pointer.y * -0.15) + (motion.y * -1.2);
    const rotate_y = (pointer.x * 0.15) + (motion.x * 1.2);
    canvas.style.transform = `rotateX(${rotate_x}deg) rotateY(${rotate_y}deg)`;

    layer_list.forEach((layer) => {
        layer.position = getOffset(layer);
        context.globalCompositeOperation = layer.blend || 'normal';
        context.globalAlpha = layer.opacity;
        context.drawImage(layer.image, layer.position.x, layer.position.y);
    });

    requestAnimationFrame(drawCanvas);
}

function endGesture() {
    moving = false;
    TWEEN.removeAll();
    new TWEEN.Tween(pointer).to({ x: 0, y: 0 }, 300).easing(TWEEN.Easing.Back.Out).start();
}

function enableMotion() {
    if (window.DeviceOrientationEvent?.requestPermission) {
        DeviceOrientationEvent.requestPermission().catch(console.error);
    }
}

// === INPUT HANDLING ===

// Touch & Mouse Start
function pointerStart(event) {
    moving = true;
    const isTouch = event.type === 'touchstart';
    const source = isTouch ? event.touches[0] : event;
    pointer_initial.x = source.clientX;
    pointer_initial.y = source.clientY;
}

// Touch & Mouse Move
function pointerMove(event) {
    if (!moving) return;
    event.preventDefault();

    const isTouch = event.type === 'touchmove';
    const source = isTouch ? event.touches[0] : event;
    pointer.x = source.clientX - pointer_initial.x;
    pointer.y = source.clientY - pointer_initial.y;
}

// === MOTION PARALLAX ===
function handleDeviceOrientation(event) {
    if (motion_initial.x === null || motion_initial.y === null) {
        motion_initial.x = event.beta;
        motion_initial.y = event.gamma;
    }

    switch (window.orientation) {
        case 0: // Portrait
            motion.x = event.gamma - motion_initial.y;
            motion.y = event.beta - motion_initial.x;
            break;
        case 90: // Landscape left
            motion.x = event.beta - motion_initial.x;
            motion.y = -event.gamma + motion_initial.y;
            break;
        case -90: // Landscape right
            motion.x = -event.beta + motion_initial.x;
            motion.y = event.gamma - motion_initial.y;
            break;
        default: // Upside down
            motion.x = -event.gamma + motion_initial.y;
            motion.y = -event.beta + motion_initial.x;
    }
}

// === EVENT LISTENERS ===

canvas.addEventListener('touchstart', pointerStart);
canvas.addEventListener('mousedown', pointerStart);
window.addEventListener('touchmove', pointerMove, { passive: false });
window.addEventListener('mousemove', pointerMove, { passive: false });

canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
canvas.addEventListener('mousemove', (e) => e.preventDefault(), { passive: false });

window.addEventListener('touchend', endGesture);
window.addEventListener('mouseup', endGesture);

window.addEventListener('touchend', enableMotion);
window.addEventListener('resize', resizeCanvasToDisplaySize);
window.addEventListener('orientationchange', () => {
    motion_initial.x = null;
    motion_initial.y = null;
});
window.addEventListener('deviceorientation', handleDeviceOrientation);
