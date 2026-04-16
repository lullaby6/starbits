import config from "../config/config.js";
import { spawnEnemyBullet } from "./bullets/enemyBullet.js";

const world = config.world;

function isInsideWorld(entity) {
    return entity.centerX >= world.minX && entity.centerX <= world.maxX &&
        entity.centerY >= world.minY && entity.centerY <= world.maxY;
}

const skills = {
    follow(entity, player, dist, dt) {
        entity.applyForce({
            x: Math.cos(entity.rotation) * entity.data.speed,
            y: Math.sin(entity.rotation) * entity.data.speed,
        });
    },

    smartFollow(entity, player, dist, dt) {
        const leadTime = entity.data.leadTime || 0;
        let targetX = player.centerX;
        let targetY = player.centerY;

        if (leadTime > 0 && player._physicsBody) {
            const v = player._physicsBody.velocity;
            targetX += v.x * leadTime;
            targetY += v.y * leadTime;
        }

        const angle = Math.atan2(targetY - entity.centerY, targetX - entity.centerX);
        entity.applyForce({
            x: Math.cos(angle) * entity.data.speed,
            y: Math.sin(angle) * entity.data.speed,
        });
    },

    keepRange(entity, player, dist, dt) {
        if (dist > entity.data.range) {
            entity.applyForce({
                x: Math.cos(entity.rotation) * entity.data.speed,
                y: Math.sin(entity.rotation) * entity.data.speed,
            });
        }
    },

    flee(entity, player, dist, dt) {
        if (dist < entity.data.fleeRange) {
            entity.applyForce({
                x: -Math.cos(entity.rotation) * entity.data.speed,
                y: -Math.sin(entity.rotation) * entity.data.speed,
            });
        }
    },

    shoot(entity, player, dist, dt) {
        if (entity.data.shotTimer > 0) {
            entity.data.shotTimer -= dt;
        } else if (dist <= (entity.data.range || Infinity) + 100 && isInsideWorld(entity)) {
            entity.data.shotTimer = entity.data.shotCooldown;
            spawnEnemyBullet(entity.scene, entity.centerX, entity.centerY, entity.rotation, entity.data.bulletSpeed);
        }
    },

    burst(entity, player, dist, dt) {
        if (entity.data.burstRemaining > 0) {
            entity.data.burstTimer -= dt;
            if (entity.data.burstTimer <= 0) {
                entity.data.burstRemaining--;
                entity.data.burstTimer = entity.data.burstDelay;
                if (isInsideWorld(entity)) {
                    spawnEnemyBullet(entity.scene, entity.centerX, entity.centerY, entity.rotation, entity.data.bulletSpeed);
                }
            }
        } else {
            entity.data.shotTimer -= dt;
            if (entity.data.shotTimer <= 0 && dist <= (entity.data.range || Infinity) + 100 && isInsideWorld(entity)) {
                entity.data.shotTimer = entity.data.shotCooldown;
                entity.data.burstRemaining = entity.data.burstCount;
                entity.data.burstTimer = 0;
            }
        }
    },

    dash(entity, player, dist, dt) {
        entity.data.dashTimer -= dt;
        if (entity.data.dashTimer <= 0) {
            entity.data.dashTimer = entity.data.dashCooldown;
            entity.setVelocity({
                x: Math.cos(entity.rotation) * entity.data.dashSpeed,
                y: Math.sin(entity.rotation) * entity.data.dashSpeed,
            });
        }
    },
};

export function createEnemy(enemy) {
    const entitySkills = (enemy.skills || []).map(s => {
        if (typeof s === 'string') return skills[s];
        return s;
    });

    const SPAWN_DURATION = config.enemies.spawnDuration;
    const DEATH_DURATION = config.enemies.deathDuration;

    return {
        imageScale: 10,
        scaleWithImageScale: true,
        color: 'transparent',
        alpha: 0,
        tags: ['enemy', enemy.name, ...(enemy.tags || [])],
        originX: 0.5,
        originY: 0.5,

        image: {
            src: `${config.images.enemies}${enemy.image}.png`,
        },

        physics: {
            ...{
                frictionAir: 0.05,
                fixedRotation: true,
                group: 'enemy',
                collidesWith: ['player', 'playerBullet', 'enemy'],
            },
            ...enemy.physics,
        },

        data: {
            speed: 0.0005,
            score: enemy.score || 1,
            shotTimer: 0,
            spawnTimer: SPAWN_DURATION,
            dying: false,
            deathTimer: 0,
            ...enemy.data,
        },
        onCreate() {
            if (enemy.onCreate) enemy.onCreate(this);
        },

        die() {
            if (this.data.dying) return;
            this.data.dying = true;
            this.data.deathTimer = DEATH_DURATION;
            this.tint = null;
            this.removePhysics();
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

            const player = this.scene.findEntityByName('player');
            if (!player) return;

            this.rotateToEntity(player);

            if (this.data.spawnTimer > 0) {
                this.data.spawnTimer -= dt;
                this.alpha = 1 - (this.data.spawnTimer / SPAWN_DURATION);
                if (this.data.spawnTimer <= 0) {
                    this.alpha = 1;
                }
                return;
            }

            const dist = CanvasEngine.Utils.distance(this, player);

            if (dist > config.enemies.recycleDistance) {
                const pos = this.scene.getSpawnPosition();
                if (this._physicsBody) {
                    this.scene.game.physics.setPosition(this._physicsBody, pos.x, pos.y);
                    this.scene.game.physics.setVelocity(this._physicsBody, { x: 0, y: 0 });
                } else {
                    this.x = pos.x - this.width / 2;
                    this.y = pos.y - this.height / 2;
                }
                return;
            }

            const tintStrength = Math.max(0, 1 - dist / config.enemies.tintMaxDist);
            this.tint = tintStrength > 0 ? `rgba(255, 0, 0, ${tintStrength.toFixed(2)})` : null;

            for (const skill of entitySkills) {
                skill(this, player, dist, dt);
            }

            if (enemy.onUpdate) enemy.onUpdate(this, player, dist, dt);
        },

        onPhysicsCollision(other) {
            if (this.data.spawnTimer > 0 || this.data.dying) return;
            if (other.name === 'player') {
                this.scene.game.camera.shake(8, 0.3);
                this.scene.gameOver();
            }

        },
    };
}

export const enemies = {
    miniom: {
        image: "miniom_1",
        data: { speed: 0.0005, leadTime: 30 },
        skills: ['smartFollow'],
        score: 1,
        spawnInterval: 1.5,
        minSpawnInterval: 0.75,
        max: 100,
    },
    shooter: {
        image: "shooter_1",
        data: { speed: 0.0004, range: 300, shotCooldown: 1, bulletSpeed: 4 },
        skills: ['keepRange', 'shoot'],
        score: 2,
        requireScore: 10,
        spawnInterval: 6,
        minSpawnInterval: 2,
        max: 100,
    },
    dash: {
        image: "dash_1",
        physics: { density: 0.01 },
        data: { speed: 0.00075, dashSpeed: 15, dashTimer: 3, dashCooldown: 3, leadTime: 30 },
        skills: ['smartFollow', 'dash'],
        score: 3,
        requireScore: 15,
        spawnInterval: 8,
        minSpawnInterval: 3,
        max: 100,
    },

    speed: {
        image: "speed_1",
        physics: { density: 0.01 },
        data: { speed: 0.01, leadTime: 40 },
        skills: ['smartFollow'],
        score: 5,
        requireScore: 30,
        spawnInterval: 8,
        minSpawnInterval: 3,
        max: 100,
    },
    speed: {
        image: "speed_1",
        physics: { density: 0.01 },
        data: { speed: 0.015, leadTime: 40 },
        skills: ['smartFollow'],
        score: 10,
        requireScore: 60,
        spawnInterval: 16,
        minSpawnInterval: 6,
        max: 100,
    },

    dashShooter: {
        image: "dash_shooter_1",
        physics: { density: 0.01 },
        data: { speed: 0.00075, dashSpeed: 17.5, dashTimer: 3, dashCooldown: 3, range: 300, shotCooldown: 1, bulletSpeed: 4, leadTime: 25 },
        skills: ['smartFollow', 'dash', 'shoot'],
        score: 5,
        requireScore: 60,
        spawnInterval: 10,
        minSpawnInterval: 4,
        max: 100,
    },
    dashShooter2: {
        image: "dash_shooter_2",
        physics: { density: 0.01 },
        data: { speed: 0.00075, dashSpeed: 20, dashTimer: 2, dashCooldown: 2, range: 400, shotCooldown: 0.75, bulletSpeed: 5, leadTime: 25 },
        skills: ['smartFollow', 'dash', 'shoot'],
        score: 6,
        requireScore: 160,
        spawnInterval: 12,
        minSpawnInterval: 5,
        max: 100,
    },

    rapidShooter: {
        image: "rapid_shooter_1",
        data: { speed: 0.0004, range: 300, shotCooldown: 0.5, bulletSpeed: 4 },
        skills: ['keepRange', 'shoot'],
        score: 4,
        requireScore: 10,
        spawnInterval: 5,
        minSpawnInterval: 2.5,
        max: 100,
    },
    rapidShooter2: {
        image: "rapid_shooter_1",
        data: { speed: 0.0004, range: 300, shotCooldown: 0.375, bulletSpeed: 4 },
        skills: ['keepRange', 'shoot'],
        score: 6,
        requireScore: 20,
        spawnInterval: 8,
        minSpawnInterval: 4,
        max: 100,
    },
    rapidShooter3: {
        image: "rapid_shooter_1",
        data: { speed: 0.0004, range: 300, shotCooldown: 0.5, bulletSpeed: 4 },
        skills: ['keepRange', 'shoot'],
        score: 8,
        requireScore: 30,
        spawnInterval: 8,
        minSpawnInterval: 4,
        max: 100,
    },

    closeShooter: {
        image: "close_shooter_1",
        physics: { density: 0.01 },
        data: { speed: 0.005, range: 200, fleeRange: 100, shotCooldown: 1, bulletSpeed: 4 },
        skills: ['keepRange', 'flee', 'shoot'],
        score: 2,
        requireScore: 25,
        spawnInterval: 6,
        minSpawnInterval: 2,
        max: 100,
    },
    closeShooter2: {
        image: "close_shooter_2",
        physics: { density: 0.01 },
        data: { speed: 0.0075, range: 300, fleeRange: 200, shotCooldown: 0.5, bulletSpeed: 5 },
        skills: ['keepRange', 'flee', 'shoot'],
        score: 4,
        requireScore: 75,
        spawnInterval: 10,
        minSpawnInterval: 4,
        max: 100,
    },
    closeShooter3: {
        image: "close_shooter_3",
        physics: { density: 0.01 },
        data: { speed: 0.01, range: 400, fleeRange: 300, shotCooldown: 0.375, bulletSpeed: 6, leadTime: 15 },
        skills: ['keepRange', 'flee', 'shoot'],
        score: 6,
        requireScore: 100,
        spawnInterval: 15,
        minSpawnInterval: 6,
        max: 100,
    },

    smartShooter: {
        image: "smart_shooter_1",
        data: { speed: 0.001, range: 500, fleeRange: 300, shotCooldown: 1, bulletSpeed: 4, leadTime: 20 },
        skills: ['keepRange', 'flee', 'shoot'],
        score: 2,
        requireScore: 40,
        spawnInterval: 8,
        minSpawnInterval: 3,
        max: 100,
    },
    smartShooter2: {
        image: "smart_shooter_2",
        data: { speed: 0.001, range: 600, fleeRange: 400, shotCooldown: 0.5, bulletSpeed: 5, leadTime: 20 },
        skills: ['keepRange', 'flee', 'shoot'],
        score: 4,
        requireScore: 100,
        spawnInterval: 10,
        minSpawnInterval: 4,
        max: 100,
    },
    smartShooter3: {
        image: "smart_shooter_3",
        data: { speed: 0.001, range: 600, fleeRange: 400, shotCooldown: 0.375, bulletSpeed: 6, leadTime: 20 },
        skills: ['keepRange', 'flee', 'shoot'],
        score: 6,
        requireScore: 200,
        spawnInterval: 12,
        minSpawnInterval: 5,
        max: 100,
    },

    multiShooter: {
        image: "multi_shooter_1",
        data: { speed: 0.0004, range: 300, shotCooldown: 2.5, bulletSpeed: 4, burstCount: 2, burstDelay: 0.25, burstRemaining: 0, burstTimer: 0, leadTime: 15 },
        skills: ['keepRange', 'burst'],
        score: 3,
        requireScore: 50,
        spawnInterval: 10,
        minSpawnInterval: 4,
        max: 100,
    },
    multiShooter2: {
        image: "multi_shooter_2",
        physics: { density: 0.01 },
        data: { speed: 0.01, range: 400, fleeRange: 300, shotCooldown: 2, bulletSpeed: 5, burstCount: 3, burstDelay: 0.5, burstRemaining: 0, burstTimer: 0, leadTime: 15 },
        skills: ['keepRange', 'flee', 'burst'],
        score: 6,
        requireScore: 130,
        spawnInterval: 12,
        minSpawnInterval: 5,
        max: 100,
    },
    multiShooter3: {
        image: "multi_shooter_3",
        physics: { density: 0.01 },
        data: { speed: 0.01, range: 500, fleeRange: 400, shotCooldown: 1.5, bulletSpeed: 6, burstCount: 4, burstDelay: 0.25, burstRemaining: 0, burstTimer: 0, leadTime: 15 },
        skills: ['keepRange', 'flee', 'burst'],
        score: 8,
        requireScore: 250,
        spawnInterval: 15,
        minSpawnInterval: 6,
        max: 100,
    },
}