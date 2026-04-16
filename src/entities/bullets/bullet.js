import config from "../../config/config.js";

export function spawnBullet(scene, x, y, angle, speed, size, lifetime) {
    scene.addEntity({
        x: x - 5,
        y: y - 5,
        imageScale: size,
        scaleWithImageScale: true,
        color: 'transparent',
        tags: ['bullet'],
        originX: 0.5,
        originY: 0.5,
        rotation: angle,
        dontRenderIsNotVisible: true,

        image: {
            src: config.images.bullet,
        },

        physics: {
            density: 0.01,
            frictionAir: 0,
            fixedRotation: true,
            group: 'playerBullet',
            collidesWith: ['enemy', 'enemyBullet'],
        },

        data: {
            lifetime,
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
            }
        },

        onPhysicsCollision(other) {
            if (other.hasTag('enemy')) {
                this.scene.game.camera.shake(4, 0.15);
                this.scene.addScore(other.data.score || 1);
                if (other.die) other.die(); else other.destroy();
                this.destroy();
            } else if (other.hasTag('enemyBullet')) {
                this.scene.game.camera.shake(2, 0.1);
                if (other.die) other.die(); else other.destroy();
                this.destroy();
            }
        },
    });
}
