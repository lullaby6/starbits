import config from "../../config/config.js";
import { spawnBulletTrailParticle } from "../../particles/particles.js";
import { getBulletTint } from "../../utils/tint.js";

const DEATH_DURATION = config.enemies.deathDuration;

export function spawnEnemyBullet(scene, x, y, angle, speed, lifetime) {
    scene.addEntity({
        x: x - 4,
        y: y - 4,
        width: 10,
        height: 10,
        color: '#fff',
        tags: ['enemyBullet'],
        originX: 0.5,
        originY: 0.5,
        rotation: angle,
        dontRenderIsNotVisible: true,
        dontCollideIsNotVisible: true,

        physics: {
            frictionAir: 0,
            fixedRotation: true,
            group: 'enemyBullet',
            collidesWith: ['player', 'playerBullet', 'meteor'],
        },

        data: {
            lifetime: lifetime ?? config.bullets.enemy.lifetime,
            dying: false,
            deathTimer: 0,
            trailTimer: 0,
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

            const visible = this.isVisible();

            this.data.trailTimer -= dt;
            if (visible && this.data.trailTimer <= 0) {
                this.data.trailTimer = config.particles.bulletsTrail.interval;
                spawnBulletTrailParticle(this.scene, this.centerX, this.centerY, this.rotation, {
                    tint: this.tint,
                    onParticleUpdate: (dt, particle) => {
                        particle.tint = this.tint;
                    },
                });
            }

            if (visible) {
                const player = this.scene.player;
                if (player) {
                    const dist = CanvasEngine.Utils.distance(this, player);
                    this.tint = getBulletTint(dist);
                }
            }
        },

        onPhysicsCollision(other) {
            if (this.data.dying) return;
            if (other.hasTag('enemy') || other.hasTag('enemyBullet')) return;

            if (other.name === 'player') {
                this.game.shakeCamera(config.shakes.playerDeath.intensity, config.shakes.playerDeath.duration);
                this.die();
                this.scene.gameOver();
            }
        },
    });
}
