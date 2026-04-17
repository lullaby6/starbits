import config from "../../config/config.js";
import { spawnBullet } from "./bullet.js";
import { getBulletTint } from "../../utils/tint.js";
import { spawnBulletDestroyParticles } from "../../utils/particles.js";

const DEATH_DURATION = config.enemies.deathDuration;

export function spawnEnemyBullet(scene, x, y, angle, speed, lifetime) {
    return spawnBullet(scene, {
        x, y, angle, speed,
        size: 10,
        lifetime: lifetime ?? config.bullets.enemy.lifetime,
        tags: ['enemyBullet'],
        group: 'enemyBullet',
        collidesWith: ['player', 'playerBullet', 'meteor', 'hole'],
        extraData: {
            dying: false,
            deathTimer: 0,
        },
        die() {
            if (this.data.dying) return;
            this.data.dying = true;
            this.data.deathTimer = DEATH_DURATION;
            this.tint = null;
            this.disableCollisions();
        },
        beforeTick(dt) {
            if (this.data.dying) {
                this.data.deathTimer -= dt;
                this.alpha = Math.max(0, this.data.deathTimer / DEATH_DURATION);
                if (this.data.deathTimer <= 0) {
                    if (this.isVisible()) {
                        spawnBulletDestroyParticles(this.scene, this.centerX, this.centerY, this.width);
                    }
                    this.destroy();
                }
                return false;
            }
        },
        afterTick() {
            if (!this.isVisible()) return;
            const player = this.scene.player;
            if (player) {
                const dist = CanvasEngine.Utils.distance(this, player);
                this.tint = getBulletTint(dist);
            }
        },
        getTrailExtras() {
            const tint = this.tint;
            return {
                tint,
                onParticleUpdate: (dt, particle) => {
                    particle.tint = this.tint;
                },
            };
        },
        onPhysicsCollision(other) {
            if (this.data.dying) return;
            if (other.hasTag('enemy') || other.hasTag('enemyBullet')) return;

            if (other.name === 'player') {
                other.destroy()
            }
        },
    });
}
