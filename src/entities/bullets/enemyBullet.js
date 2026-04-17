import config from "../../config/config.js";
import { spawnBullet } from "./bullet.js";
import { getBulletTint } from "../../utils/tint.js";

export function spawnEnemyBullet(scene, x, y, angle, speed, lifetime) {
    return spawnBullet(scene, {
        x, y, angle, speed,
        size: 10,
        lifetime: lifetime ?? config.bullets.enemy.lifetime,
        tags: ['enemyBullet'],
        group: 'enemyBullet',
        collidesWith: ['player', 'playerBullet', 'meteor', 'hole'],
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
            if (other.hasTag('enemy') || other.hasTag('enemyBullet')) return;

            if (other.name === 'player') {
                other.destroy();
            }
        },
    });
}
