import config from "../../config/config.js";
import { spawnDestroyParticles, spawnMeteorTrailParticle } from "../../utils/particles.js";
import { destroyDistance } from "../../utils/spawn.js";
import { spawnCelestial } from "./celestial.js";

export function createMeteor(x, y, vx, vy, rotationSpeed) {
    const cfg = config.meteors;
    const imageIndex = CanvasEngine.Random.int(1, cfg.imageCount);

    return {
        x,
        y,
        imageScale: 10,
        scaleWithImageScale: true,
        color: 'transparent',
        tags: ['meteor', 'danger'],
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
            if (destroyDistance(this, cfg.destroyDistance)) return;

            this.data.trailTimer -= dt;
            if (this.isVisible() && this.data.trailTimer <= 0) {
                this.data.trailTimer = config.particles.meteorsTrail.interval;
                spawnMeteorTrailParticle(this.scene, this.centerX, this.centerY, this.rotation, this.width / 2);
            }
        },

        onPhysicsCollision(other) {
            if (other.hasTag('meteor')) return;

            if (other.name === 'player') {
                other.destroy();
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
                other.destroy();
            }
        },
    };
}

export function spawnMeteor(scene) {
    return spawnCelestial(scene, config.meteors, createMeteor);
}
