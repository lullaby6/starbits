import config from "../../config/config.js";

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
            collidesWith: ['player', 'enemy', 'playerBullet', 'enemyBullet', 'meteor'],
        },

        data: {
            vx,
            vy,
            rotationSpeed,
            trailTimer: 0,
            glowTimer: 0,
            consumed: new Set(),
        },

        onCreate() {
            this.setVelocity({ x: this.data.vx, y: this.data.vy });
            this.setAngularVelocity(this.data.rotationSpeed);
        },

        onUpdate(dt) {
            this.eat()

            const player = this.scene.player;
            if (!player) return;

            if (CanvasEngine.Utils.distance(this, player) > cfg.destroyDistance) {
                this.destroy();
            }
        },

        onPhysicsCollision(other) {
            this.grow(other.width > other.height ? other.width : other.height);

            if (other.die) other.die(); else other.destroy();
        },

        grow(grow) {
            // grow = grow / (cfg.consumeGrowth * 100);

            this._scaledImageWidth += grow;
            this._scaledImageHeight += grow;
        },

        eat() {
            const entities = this.scene.entities;
            for (let i = 0; i < entities.length; i++) {
                const entity = entities[i];
                if (
                    !entity.active ||
                    entity === this ||
                    !entity._physicsBody ||
                    entity.hasTag('particle')
                ) continue;

                const dist = CanvasEngine.Utils.distance(this, entity);

                if (dist > cfg.pullRange) continue;

                let strength = (cfg.pullForce + this._imageScale * cfg.pullForceScale) * (1 - dist / cfg.pullRange);

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
    const cam = scene.game.camera;
    const angle = CanvasEngine.Random.float(0, Math.PI * 2);
    const dist = cfg.spawnDistance;
    const x = cam.x + Math.cos(angle) * dist;
    const y = cam.y + Math.sin(angle) * dist;

    const player = scene.player;
    const targetX = (player ? player.centerX : cam.x) + CanvasEngine.Random.floatSymmetric(cfg.aimJitter);
    const targetY = (player ? player.centerY : cam.y) + CanvasEngine.Random.floatSymmetric(cfg.aimJitter);

    const dirAngle = Math.atan2(targetY - y, targetX - x);
    const speed = CanvasEngine.Random.float(cfg.speedMin, cfg.speedMax);
    const vx = Math.cos(dirAngle) * speed;
    const vy = Math.sin(dirAngle) * speed;
    const rotSpeed = CanvasEngine.Random.float(cfg.rotationSpeedMin, cfg.rotationSpeedMax);

    scene.addEntity(createBlackHole(x, y, vx, vy, rotSpeed));
}
