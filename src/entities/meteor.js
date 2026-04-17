import config from "../config/config.js";
import { spawnDestroyParticles, spawnMeteorTrailParticle } from "../utils/particles.js";

export function createMeteor(x, y, vx, vy, rotationSpeed) {
    const cfg = config.meteors;
    const imageIndex = CanvasEngine.Random.int(1, cfg.imageCount);

    return {
        x,
        y,
        imageScale: 10,
        scaleWithImageScale: true,
        color: 'transparent',
        tags: ['meteor'],
        originX: 0.5,
        originY: 0.5,

        image: {
            src: `${config.images.meteors}${imageIndex}.png`,
        },

        physics: {
            density: cfg.density,
            frictionAir: cfg.frictionAir,
            restitution: cfg.restitution,
            fixedRotation: false,
            group: 'meteor',
            collidesWith: ['player', 'enemy', 'playerBullet', 'enemyBullet', 'meteor'],
        },

        data: {
            vx,
            vy,
            rotationSpeed,
            trailTimer: 0,
        },

        onCreate() {
            this.setVelocity({ x: this.data.vx, y: this.data.vy });
            this.setAngularVelocity(this.data.rotationSpeed);
        },

        onUpdate(dt) {
            const player = this.scene.player;
            if (!player) return;

            const dist = CanvasEngine.Utils.distance(this, player);
            if (dist > cfg.destroyDistance) {
                this.destroy();
                return;
            }

            this.data.trailTimer -= dt;
            if (this.isVisible() && this.data.trailTimer <= 0) {
                this.data.trailTimer = config.particles.meteorsTrail.interval;
                spawnMeteorTrailParticle(this.scene, this.centerX, this.centerY, this.rotation, this.width / 2);
            }
        },

        onPhysicsCollision(other) {
            if (other.hasTag('meteor')) return;

            if (other.name === 'player') {
                this.game.shakeCamera(config.shakes.playerDeath.intensity, config.shakes.playerDeath.duration);
                this.scene.gameOver();
                return;
            }

            if (other.hasTag('enemy')) {
                if (other.die) other.die(); else other.destroy();
                return;
            }

            if (other.hasTag('bullet') || other.hasTag('enemyBullet')) {
                if (this.isVisible()) {
                    spawnDestroyParticles(this.scene, other.centerX, other.centerY);
                }
                if (other.die) other.die(); else other.destroy();
            }
        },
    };
}

export function getMeteorSpawnPosition(scene) {
    const cam = scene.game.camera;
    const angle = CanvasEngine.Random.float(0, Math.PI * 2);
    const dist = config.meteors.spawnDistance;
    return {
        x: cam.x + Math.cos(angle) * dist,
        y: cam.y + Math.sin(angle) * dist,
        angle,
    };
}

export function spawnMeteor(scene) {
    const cfg = config.meteors;
    const pos = getMeteorSpawnPosition(scene);

    const player = scene.player;
    const targetX = (player ? player.centerX : scene.game.camera.x) + CanvasEngine.Random.floatSymmetric(cfg.aimJitter);
    const targetY = (player ? player.centerY : scene.game.camera.y) + CanvasEngine.Random.floatSymmetric(cfg.aimJitter);

    const dirAngle = Math.atan2(targetY - pos.y, targetX - pos.x);
    const speed = CanvasEngine.Random.float(cfg.speedMin, cfg.speedMax);
    const vx = Math.cos(dirAngle) * speed;
    const vy = Math.sin(dirAngle) * speed;
    const rotSpeed = CanvasEngine.Random.float(cfg.rotationSpeedMin, cfg.rotationSpeedMax);

    scene.addEntity(createMeteor(pos.x, pos.y, vx, vy, rotSpeed));
}
