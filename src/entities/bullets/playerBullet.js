import config from "../../config/config.js";
import { spawnBullet } from "./bullet.js";

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