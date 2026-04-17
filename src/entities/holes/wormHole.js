import config from "../../config/config.js";

const cfg = config.holes.worm;

export function createWormHole(x, y, vx, vy, rotationSpeed) {
    return {
        x,
        y,
        imageScale: CanvasEngine.Random.float(cfg.imageScaleMin, cfg.imageScaleMax),
        scaleWithImageScale: true,
        color: 'transparent',
        tags: ['wormHole', 'hole'],
        originX: 0.5,
        originY: 0.5,

        image: {
            src: config.images.wormHole,
        },

        physics: {
            density: cfg.density,
            frictionAir: cfg.frictionAir,
            restitution: cfg.restitution,
            fixedRotation: false,
            group: 'hole',
            collidesWith: ['player', 'enemy', 'playerBullet', 'enemyBullet', 'meteor'],
        },

        data: {
            vx,
            vy,
            rotationSpeed,
            trailTimer: 0,
            glowTimer: 0,
            consumed: new Set(),
        },

        onCreate() {
            this.setVelocity({ x: this.data.vx, y: this.data.vy });
            this.setAngularVelocity(this.data.rotationSpeed);
        },

        onUpdate(dt) {
            const player = this.scene.player;
            if (!player) return;

            if (CanvasEngine.Utils.distance(this, player) > cfg.destroyDistance) {
                this.destroy();
            }
        },

        onPhysicsCollision(other) {
            if (other.name === 'player') {
                const world = config.world;
                const margin = cfg.worldMargin;
                const newX = CanvasEngine.Random.float(world.minX + margin, world.maxX - margin);
                const newY = CanvasEngine.Random.float(world.minY + margin, world.maxY - margin);

                if (other._physicsBody) {
                    this.scene.game.physics.setPosition(other._physicsBody, newX, newY);
                    this.scene.game.physics.setVelocity(other._physicsBody, { x: 0, y: 0 });
                } else {
                    other.x = newX - other.width / 2;
                    other.y = newY - other.height / 2;
                }

                this.destroy();
                return;
            }

            if (other.die) other.die(); else other.destroy();
        },
    };
}

export function spawnWormHole(scene) {
    const cam = scene.game.camera;
    const angle = CanvasEngine.Random.float(0, Math.PI * 2);
    const dist = cfg.spawnDistance;
    const x = cam.x + Math.cos(angle) * dist;
    const y = cam.y + Math.sin(angle) * dist;

    const player = scene.player;
    const targetX = (player ? player.centerX : cam.x) + CanvasEngine.Random.floatSymmetric(cfg.aimJitter);
    const targetY = (player ? player.centerY : cam.y) + CanvasEngine.Random.floatSymmetric(cfg.aimJitter);

    const dirAngle = Math.atan2(targetY - y, targetX - x);
    const speed = CanvasEngine.Random.float(cfg.speedMin, cfg.speedMax);
    const vx = Math.cos(dirAngle) * speed;
    const vy = Math.sin(dirAngle) * speed;
    const rotSpeed = CanvasEngine.Random.float(cfg.rotationSpeedMin, cfg.rotationSpeedMax);

    scene.addEntity(createWormHole(x, y, vx, vy, rotSpeed));
}
