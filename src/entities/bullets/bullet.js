import config from "../../config/config.js";

export function spawnBullet(scene, x, y, angle, speed) {
    scene.addEntity({
        x: x - 5,
        y: y - 5,
        imageScale: 10,
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
            frictionAir: 0,
            fixedRotation: true,
            group: 'playerBullet',
            collidesWith: ['enemy', 'enemyBullet'],
        },

        data: {
            lifetime: config.bullets.player.lifetime,
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
                this.scene.addScore(other.data.score || 1);
                other.destroy();
                this.destroy();
            } else if (other.hasTag('enemyBullet')) {
                other.destroy();
                this.destroy();
            }
        },
    });
}
