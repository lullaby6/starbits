const width = 1024;
const height = width / (16 / 9);
const worldGrid = 7;
const motionBlur = 0.75; // 0 to 1

const upgrades = {
    speed: {
        min: 0.0025,
        max: 0.005
    },
    shield: {
        min: 0,
        max: 3
    },
    zoom: {
        min: 0.6,
        max: 1.2
    },
    health: {
        min: 1,
        max: 5
    },
    friction: {
        min: 0.075,
        max: 0.15
    },
    bulletSpeed: {
        min: 10,
        max: 20
    },
    bulletSize: {
        min: 10,
        max: 20
    },
    bulletCount: {
        min: 1,
        max: 5
    },
    bulletLifetime: {
        min: 3,
        max: 6
    },
    bulletPiercing: {
        min: 0,
        max: 6
    },
    shotCooldown: {
        min: 0.2,
        max: 0.05,
    }
}

export default {
    game: {
        aspectRatio: 16 / 9,
        width,
        height,
        title: "Starbits",
        fps: 60,
        motionBlur,
    },
    world: {
        width: width * worldGrid,
        height: width * worldGrid,
        minX: -(width * worldGrid) / 2,
        maxX: (width * worldGrid) / 2,
        minY: -(width * worldGrid) / 2,
        maxY: (width * worldGrid) / 2,
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
        depthRange: [0.15, 1],
    },
    enemies: {
        tintMaxDist: 500,
        spawnDuration: 1,
        deathDuration: 0.5,
        spawnSpeedupPerScore: 0.01,
        recycleDistance: 900,
    },
    dangerVignette: {
        maxDist: 350,
        minDist: 80,
        maxOpacity: 0.375,
        pulseSpeed: 4,
        pulseAmount: 0.2,
        innerStop: 50,
        midStop: 75,
        outerStop: 100,
        midAlpha: 0.4,
        outerAlpha: 0.85,
        shape: 'ellipse',
    },
    bullets: {
        enemy: {
            lifetime: 4,
            tintMaxDist: 600,
        },
    },
    upgrades,
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
