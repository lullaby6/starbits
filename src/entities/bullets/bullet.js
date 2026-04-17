import config from "../../config/config.js";
import { spawnBulletTrailParticle, spawnBulletDestroyParticles } from "../../utils/particles.js";

export function spawnBullet(scene, {
    x, y, angle, speed, size, lifetime,
    tags,
    group,
    collidesWith,
    physicsExtras = {},
    extraData = {},
    onCreate,
    beforeTick,
    afterTick,
    getTrailExtras,
    onPhysicsCollision,
}) {
    const entity = {
        x: x - size / 2,
        y: y - size / 2,
        width: size,
        height: size,
        color: '#fff',
        tags,
        originX: 0.5,
        originY: 0.5,
        rotation: angle,
        dontRenderIsNotVisible: true,
        dontCollideIsNotVisible: true,

        physics: {
            frictionAir: 0,
            fixedRotation: true,
            group,
            collidesWith,
            ...physicsExtras,
        },

        data: {
            lifetime,
            trailTimer: 0,
            ...extraData,
        },

        onCreate() {
            this.setVelocity({
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed,
            });
            if (onCreate) onCreate.call(this);
        },

        onUpdate(dt) {
            if (beforeTick && beforeTick.call(this, dt) === false) return;

            this.data.lifetime -= dt;
            if (this.data.lifetime <= 0) {
                this.destroy();
                return;
            }

            this.data.trailTimer -= dt;
            if (this.isVisible() && this.data.trailTimer <= 0) {
                this.data.trailTimer = config.particles.bulletsTrail.interval;
                const trailExtras = getTrailExtras ? getTrailExtras.call(this) : undefined;
                spawnBulletTrailParticle(this.scene, this.centerX, this.centerY, this.rotation, trailExtras);
            }

            if (afterTick) afterTick.call(this, dt);
        },

        onPhysicsCollision,

        onDestroy() {
            if (this.isVisible()) {
                spawnBulletDestroyParticles(this.scene, this.centerX, this.centerY, this.width);
            }
        },
    };

    return scene.addEntity(entity);
}
