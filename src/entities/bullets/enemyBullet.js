import config from "../../config/config.js";

const DEATH_DURATION = config.enemies.deathDuration;

export function spawnEnemyBullet(scene, x, y, angle, speed, lifetime) {
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
            lifetime: lifetime ?? config.bullets.enemy.lifetime,
            dying: false,
            deathTimer: 0,
        },

        onCreate() {
            this.setVelocity({
                x: Math.cos(angle) * speed,
                y: Math.sin(angle) * speed,
            });
        },

        die() {
            if (this.data.dying) return;
            this.data.dying = true;
            this.data.deathTimer = DEATH_DURATION;
            this.tint = null;
            this.disableCollisions();
        },

        onUpdate(dt) {
            if (this.data.dying) {
                this.data.deathTimer -= dt;
                this.alpha = Math.max(0, this.data.deathTimer / DEATH_DURATION);
                if (this.data.deathTimer <= 0) {
                    this.destroy();
                }
                return;
            }

            this.data.lifetime -= dt;
            if (this.data.lifetime <= 0) {
                this.die();
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
            if (this.data.dying) return;
            if (other.hasTag('enemy') || other.hasTag('enemyBullet')) return;

            if (other.name === 'player') {
                this.game.camera.shake(8, 0.3);
                this.die();
                this.scene.gameOver();
            }
        },
    });
}
