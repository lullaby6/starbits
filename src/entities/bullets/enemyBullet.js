import config from "../../config/config.js";

export function spawnEnemyBullet(scene, x, y, angle, speed) {
    scene.addEntity({
        x: x - 4,
        y: y - 4,
        imageScale: 10,
        scaleWithImageScale: true,
        color: 'transparent',
        tags: ['enemyBullet'],
        originX: 0.5,
        originY: 0.5,
        rotation: angle,
        dontRenderIsNotVisible: true,

        image: {
            src: config.images.enemyBullet,
        },

        physics: {
            frictionAir: 0,
            fixedRotation: true,
            group: 'enemyBullet',
            collidesWith: ['player', 'playerBullet'],
        },

        data: {
            lifetime: config.bullets.enemy.lifetime,
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

            const player = this.scene.findEntityByName('player');
            if (player) {
                const dist = CanvasEngine.Utils.distance(this, player);
                const tintStrength = Math.max(0, 1 - dist / config.bullets.enemy.tintMaxDist);
                this.tint = tintStrength > 0 ? `rgba(255, 0, 0, ${tintStrength.toFixed(2)})` : null;
            }
        },

        onPhysicsCollision(other) {
            if (other.hasTag('enemy') || other.hasTag('enemyBullet')) return;

            if (other.name === 'player') {
                this.destroy();
                this.scene.gameOver();
            }
        },
    });
}
