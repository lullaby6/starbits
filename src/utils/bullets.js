import config from "../config/config.js";
import { spawnBullet } from "../entities/bullets/bullet.js";
import { getBulletTint } from "./tint.js";

const DEATH_DURATION = config.enemies.deathDuration;

export function spawnPlayerBullet(scene, x, y, angle, speed, size, lifetime, piercing) {
    return spawnBullet(scene, {
        x, y, angle, speed, size, lifetime,
        tags: ['bullet'],
        group: 'playerBullet',
        collidesWith: ['enemy', 'enemyBullet', 'meteor', 'hole'],
        physicsExtras: { density: 0.01 },
        extraData: {
            piercing,
            hitEntities: new Set(),
        },
        die() {
            this.destroy();
        },
        onPhysicsCollision(other) {
            if (other.hasTag('enemy')) {
                if (this.data.hitEntities.has(other)) return;
                this.data.hitEntities.add(other);

                this.scene.addScore(other.data.score || 1);
                if (other.die) other.die(); else other.destroy();

                if (this.data.piercing <= 0) {
                    this.die();
                } else {
                    this.data.piercing--;
                }
            } else if (other.hasTag('enemyBullet')) {
                this.game.shakeCamera(config.shakes.bulletCollide.intensity, config.shakes.bulletCollide.duration);
                if (other.die) other.die(); else other.destroy();
                this.die();
            }
        },
    });
}

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
