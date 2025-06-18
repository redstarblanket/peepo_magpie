// get reference to canvas
var canvas = document.getElementById('canvas');

// get reference to canvas context
var context = canvas.getContext('2d');

// get reference to loading screen
var loading_screen = document.getElementById('loading');

// initialize loading variables
var loaded = false;
var load_counter = 0;

// initialize images for layers
var background = new Image();
var mountain = new Image();
var grass = new Image();
var magpie = new Image();
var plant = new Image();

// create a list of layered objects
var layer_list = [
    {
        'image': background,
        'src': 'layer1.png',
        'z_index': -10,
        'position': { x: 0, y: 0 },
        'blend': null,
        'opacity': 1
    },
    {
        'image': mountain,
        'src': 'layer2.png',
        'z_index': -4,
        'position': { x: 0, y: 0 },
        'blend': null,
        'opacity': 1
    },
    {
        'image': grass,
        'src': 'layer3.png',
        'z_index': -2,
        'position': { x: 0, y: 0 },
        'blend': 'lighten',
        'opacity': 1
    },
    {
        'image': magpie,
        'src': 'layer4.png',
        'z_index': 0,
        'position': { x: 0, y: 0 },
        'blend': 'normal',
        'opacity': 1
    },
    {
        'image': plant,
        'src': 'layer5.png',
        'z_index': 2,
        'position': { x: 0, y: 0 },
        'blend': 'normal',
        'opacity': 1,
    }
];

// Resize canvas to match CSS display size (to keep square shape)
function resizeCanvasToDisplaySize() {
    const displaySize = Math.min(canvas.offsetWidth, canvas.offsetHeight);
    if (canvas.width !== displaySize || canvas.height !== displaySize) {
        canvas.width = displaySize;
        canvas.height = displaySize;
    }
}

layer_list.forEach(function (layer, index) {
    layer.image.onload = function () {
        load_counter += 1;
        if (load_counter >= layer_list.length) {
            resizeCanvasToDisplaySize(); // resize once before drawing
            hideLoading();
            requestAnimationFrame(drawCanvas);
        }
    }
    layer.image.src = layer.src;
});

function hideLoading() {
    loading_screen.classList.add('hidden');
}

function drawCanvas() {
    resizeCanvasToDisplaySize(); // keep canvas square on each frame

    context.clearRect(0, 0, canvas.width, canvas.height);
    TWEEN.update();

    var rotate_x = (pointer.y * -0.15) + (motion.y * -1.2);
    var rotate_y = (pointer.x * 0.15) + (motion.x * 1.2);
    var transform_string = "rotateX(" + rotate_x + "deg) rotateY(" + rotate_y + "deg)";
    canvas.style.transform = transform_string;

    layer_list.forEach(function (layer, index) {
        layer.position = getOffset(layer);

        context.globalCompositeOperation = layer.blend || 'normal';
        context.globalAlpha = layer.opacity;
        // Get image center position
const imageWidth = layer.image.width;
const imageHeight = layer.image.height;

const scaledWidth = imageWidth * canvasScale;
const scaledHeight = imageHeight * canvasScale;

// Center the image, apply parallax offset
const x = (canvas.width - scaledWidth) / 2 + layer.position.x * canvasScale;
const y = (canvas.height - scaledHeight) / 2 + layer.position.y * canvasScale;

context.drawImage(layer.image, x, y, scaledWidth, scaledHeight);


    });

    requestAnimationFrame(drawCanvas);
}

function getOffset(layer) {
    var touch_multiplier = 0.09;
    var touch_offset_x = pointer.x * layer.z_index * touch_multiplier;
    var touch_offset_y = pointer.y * layer.z_index * touch_multiplier;

    var motion_multiplier = 2;
    var motion_offset_x = motion.x * layer.z_index * motion_multiplier;
    var motion_offset_y = motion.y * layer.z_index * motion_multiplier;

    return {
        x: touch_offset_x + motion_offset_x,
        y: touch_offset_y + motion_offset_y
    };
}

var moving = false;
var pointer_initial = { x: 0, y: 0 };
var pointer = { x: 0, y: 0 };

canvas.addEventListener('touchstart', pointerStart);
canvas.addEventListener('mousedown', pointerStart);

function pointerStart(event) {
    moving = true;
    if (event.type === 'touchstart') {
        pointer_initial.x = event.touches[0].clientX;
        pointer_initial.y = event.touches[0].clientY;
    } else if (event.type === 'mousedown') {
        pointer_initial.x = event.clientX;
        pointer_initial.y = event.clientY;
    }
}

window.addEventListener('touchmove', pointerMove);
window.addEventListener('mousemove', pointerMove);

function pointerMove(event) {
    event.preventDefault();
    if (moving) {
        var current_x = 0;
        var current_y = 0;
        if (event.type === 'touchmove') {
            current_x = event.touches[0].clientX;
            current_y = event.touches[0].clientY;
        } else if (event.type === 'mousemove') {
            current_x = event.clientX;
            current_y = event.clientY;
        }
        pointer.x = current_x - pointer_initial.x;
        pointer.y = current_y - pointer_initial.y;
    }
}

canvas.addEventListener('touchmove', function (event) {
    event.preventDefault();
});

canvas.addEventListener('mousemove', function (event) {
    event.preventDefault();
});

window.addEventListener('touchend', endGesture);
window.addEventListener('mouseup', endGesture);

function endGesture() {
    moving = false;
    TWEEN.removeAll();
    new TWEEN.Tween(pointer).to({ x: 0, y: 0 }, 300).easing(TWEEN.Easing.Back.Out).start();
}

//// MOTION CONTROLS ////
var motion_initial = { x: null, y: null };
var motion = { x: 0, y: 0 };

window.addEventListener('deviceorientation', function (event) {
    if (!motion_initial.x && !motion_initial.y) {
        motion_initial.x = event.beta;
        motion_initial.y = event.gamma;
    }

    if (window.orientation === 0) {
        motion.x = event.gamma - motion_initial.y;
        motion.y = event.beta - motion_initial.x;
    } else if (window.orientation === 90) {
        motion.x = event.beta - motion_initial.x;
        motion.y = -event.gamma + motion_initial.y;
    } else if (window.orientation === -90) {
        motion.x = -event.beta + motion_initial.x;
        motion.y = event.gamma - motion.initial.y;
    } else {
        motion.x = -event.gamma + motion_initial.y;
        motion.y = -event.beta + motion_initial.x;
    }
});

window.addEventListener('orientationchange', function () {
    motion_initial.x = 0;
    motion_initial.y = 0;
});

window.addEventListener('touchend', enableMotion);

function enableMotion() {
    if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().catch(console.error);
    }
}

// Resize canvas on window resize
window.addEventListener('resize', resizeCanvasToDisplaySize);
