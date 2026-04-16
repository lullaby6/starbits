const width = 1024;
const height = width / (16 / 9);
const worldGrid = 7;
const motionBlur = 0.75; // 0 to 1

export default {
    game: {
        aspectRatio: 16 / 9,
        width,
        height,
        title: "Starsbits",
        fps: 60,
        motionBlur,
    },
    world: {
        width: width * worldGrid,
        height: height * worldGrid,
        minX: -(width * worldGrid) / 2,
        maxX: (width * worldGrid) / 2,
        minY: -(height * worldGrid) / 2,
        maxY: (height * worldGrid) / 2,
    },
    camera: {
        zoom: 1,
        zoomMax: 1.2,
        zoomMin: 0.6,
        zoomSpeedFactor: 0.05,
        zoomLerp: 0.03,
    },
    spawn: {
        margin: 60,
        maxAttempts: 20,
    },
    stars: {
        count: 600,
        maxDist: 1500,
        blinkDuration: 0.6,
        blinkCooldown: [4, 12],
        speed: [10, 40],
        size: [1, 5],
        colorRange: [100, 255],
        alphaRange: [0.3, 1],
    },
    enemies: {
        tintMaxDist: 500,
        spawnDuration: 1,
        deathDuration: 0.5,
        spawnSpeedupPerScore: 0.01,
        recycleDistance: 900,
    },
    bullets: {
        player: {
            lifetime: 3,
        },
        enemy: {
            lifetime: 4,
            tintMaxDist: 600,
        },
    },
    colors: {
        background: `rgba(1, 1, 15, ${motionBlur})`,
    },
    keys: {
        fullscreen: ['f'],
        pause: ['p', 'Escape'],
        reset: ['r'],
        player: {
            up: ['w'],
            down: ['s'],
            left: ['a'],
            right: ['d'],
        },
    },
    images: {
        player: './assets/images/player.png',
        crosshair: './assets/images/crosshair.png',
        bullet: './assets/images/bullet/simple.png',
        enemies: './assets/images/enemies/',
        enemyBullet: './assets/images/bullet/simple.png',
    }
}
