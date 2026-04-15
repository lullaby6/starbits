import config from "../config/config.js";

function randomPosition(player, game) {
    const angle = CanvasEngine.Random.float(0, Math.PI * 2);
    const minDist = game.width / 2 / game.camera.zoom + 20;
    const dist = CanvasEngine.Random.float(minDist, config.stars.maxDist);
    return {
        x: player.centerX + Math.cos(angle) * dist,
        y: player.centerY + Math.sin(angle) * dist,
    };
}

function createStar() {
    return {
        z: -10,
        color: '#fff',
        originX: 0.5,
        originY: 0.5,
        ignorePause: true,

        data: {
            speed: 0,
            blinkCooldown: 0,
            blinkTimer: 0,
            blinkFlash: 0,
            baseColor: '#fff',
            initialized: false,
        },

        resetStar(initial) {
            const player = this.scene.findEntityByName('player');
            if (!player) return;

            if (initial) {
                const angle = CanvasEngine.Random.float(0, Math.PI * 2);
                const dist = CanvasEngine.Random.float(0, config.stars.maxDist);
                this.x = player.centerX + Math.cos(angle) * dist;
                this.y = player.centerY + Math.sin(angle) * dist;
            } else {
                const pos = randomPosition(player, this.scene.game);
                this.x = pos.x;
                this.y = pos.y;
            }

            const [cMin, cMax] = config.stars.colorRange;
            const r = CanvasEngine.Random.int(cMin, cMax);
            const g = CanvasEngine.Random.int(cMin, cMax);
            const b = CanvasEngine.Random.int(cMin, cMax);
            const [aMin, aMax] = config.stars.alphaRange;
            const a = CanvasEngine.Random.float(aMin, aMax).toFixed(2);
            this.data.baseColor = `rgba(${r},${g},${b},${a})`;
            this.color = this.data.baseColor;

            const [sMin, sMax] = config.stars.speed;
            this.data.speed = CanvasEngine.Random.float(sMin, sMax);

            const [szMin, szMax] = config.stars.size;
            const size = CanvasEngine.Random.float(szMin, szMax);
            this.width = size;
            this.height = size;

            const [bMin, bMax] = config.stars.blinkCooldown;
            this.data.blinkCooldown = CanvasEngine.Random.float(bMin, bMax);
            this.data.blinkTimer = CanvasEngine.Random.float(0, this.data.blinkCooldown);
            this.data.blinkFlash = 0;
        },

        onUpdate(dt) {
            const player = this.scene.findEntityByName('player');
            if (!player) return;

            if (!this.data.initialized) {
                this.data.initialized = true;
                this.resetStar(true);
                return;
            }

            this.x += this.data.speed * dt;

            if (this.data.blinkFlash > 0) {
                this.data.blinkFlash -= dt;
                if (this.data.blinkFlash <= 0) {
                    this.color = this.data.baseColor;
                }
            } else {
                this.data.blinkTimer -= dt;
                if (this.data.blinkTimer <= 0) {
                    this.data.blinkTimer = this.data.blinkCooldown;
                    this.data.blinkFlash = config.stars.blinkDuration;
                    this.color = '#fff';
                }
            }

            const dist = CanvasEngine.Utils.distance(this, player);
            if (dist > config.stars.maxDist) {
                this.resetStar(false);
            }
        },
    };
}

export function createStars() {
    const stars = [];
    for (let i = 0; i < config.stars.count; i++) {
        stars.push(createStar());
    }
    return stars;
}
