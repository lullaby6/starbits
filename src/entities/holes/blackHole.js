import config from "../../config/config.js";
import { spawnHole } from "./hole.js";

const cfg = config.holes.black;

export function createBlackHole(x, y, vx, vy, rotationSpeed) {
    return {
        x,
        y,
        imageScale: CanvasEngine.Random.float(cfg.imageScaleMin, cfg.imageScaleMax),
        scaleWithImageScale: true,
        color: 'transparent',
        tags: ['blackHole', 'hole', 'danger'],
        originX: 0.5,
        originY: 0.5,

        image: {
            src: config.images.blackHole,
        },

        physics: {
            density: cfg.density,
            frictionAir: cfg.frictionAir,
            restitution: cfg.restitution,
            fixedRotation: false,
            group: 'hole',
            collidesWith: ['player', 'enemy', 'playerBullet', 'enemyBullet', 'meteor', 'hole'],
        },

        data: {
            vx,
            vy,
            rotationSpeed,
            trailTimer: 0,
            glowTimer: 0,
            targetSize: null,
            consumed: new Set(),
        },

        onCreate() {
            this.setVelocity({ x: this.data.vx, y: this.data.vy });
            this.setAngularVelocity(this.data.rotationSpeed);
            this.data.targetSize = this.width;
        },

        onUpdate(dt) {
            this.eat()

            if (this.data.targetSize != null && this.data.targetSize !== this.width) {
                this.sizeAt(this.data.targetSize, this.data.targetSize, cfg.growSpeed, dt);
            }

            const player = this.scene.player;
            if (!player) return;

            if (CanvasEngine.Utils.distance(this, player) > cfg.destroyDistance) {
                this.destroy();
            }
        },

        onPhysicsCollision(other) {
            if (other.hasTag('blackHole') && other.width >= this.width) return;

            this.grow(other.width > other.height ? other.width : other.height);

            if (other.die) other.die(); else other.destroy();
        },

        grow(amount) {
            this.data.targetSize = (this.data.targetSize ?? this.width) + amount;
        },

        eat() {
            const entities = this.scene.entities;
            const pullRange = cfg.pullRange + this.width * cfg.pullRangeScale;
            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i];
                if (
                    !entity.active ||
                    entity === this ||
                    !entity._physicsBody ||
                    entity.hasTag('particle')
                ) continue;

                const dist = CanvasEngine.Utils.distance(this, entity);

                if (dist > pullRange) continue;

                let strength = (cfg.pullForce + this._imageScale * cfg.pullForceScale) * (1 - dist / pullRange);

                if (strength > cfg.maxPullForce) strength = cfg.maxPullForce

                const angle = Math.atan2(this.centerY - entity.centerY, this.centerX - entity.centerX);

                entity.applyForce({
                    x: Math.cos(angle) * strength,
                    y: Math.sin(angle) * strength,
                });
            }
        }
    };
}

export function spawnBlackHole(scene) {
    return spawnHole(scene, cfg, createBlackHole);
}
