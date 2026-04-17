import config from "../../config/config.js";
import { spawnBulletTrailParticle } from "../../particles/particles.js";

export function spawnBullet(scene, x, y, angle, speed, size, lifetime) {
    scene.addEntity({
        x: x - size / 2,
        y: y - size / 2,
        width: size,
        height: size,
        color: '#fff',
        tags: ['bullet'],
        originX: 0.5,
        originY: 0.5,
        rotation: angle,
        dontRenderIsNotVisible: true,
        dontCollideIsNotVisible: true,


        physics: {
            density: 0.01,
            frictionAir: 0,
            fixedRotation: true,
            group: 'playerBullet',
            collidesWith: ['enemy', 'enemyBullet', 'meteor'],
        },

        data: {
            lifetime,
            trailTimer: 0,
        },

        onCreate() {
            this.setVelocity({
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed,
            });
        },

        onUpdate(dt) {
            this.data.lifetime -= dt;
            if (this.data.lifetime <= 0) {
                this.destroy();
                return;
            }

            this.data.trailTimer -= dt;
            if (this.isVisible() && this.data.trailTimer <= 0) {
                this.data.trailTimer = config.particles.bulletsTrail.interval;
                spawnBulletTrailParticle(this.scene, this.centerX, this.centerY, this.rotation);
            }
        },

        onPhysicsCollision(other) {
            if (other.hasTag('enemy')) {
                this.scene.addScore(other.data.score || 1);
                if (other.die) other.die(); else other.destroy();
                this.destroy();
            } else if (other.hasTag('enemyBullet')) {
                this.game.camera.shake(config.shakes.bulletCollide.intensity, config.shakes.bulletCollide.duration);
                if (other.die) other.die(); else other.destroy();
                this.destroy();
            }
        },
    });
}
