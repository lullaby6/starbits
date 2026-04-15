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

    return {
        imageScale: 10,
        scaleWithImageScale: true,
        color: 'transparent',
        alpha: 0,
        tags: ['enemy', ...(enemy.tags || [])],
        originX: 0.5,
        originY: 0.5,

        image: {
            src: `${config.images.enemies}${enemy.image}.png`,
        },

        physics: {
            ...{
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
            ...enemy.data,
        },
        onCreate() {
            if (enemy.onCreate) enemy.onCreate(this);
        },

        onUpdate(dt) {
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

            const tintStrength = Math.max(0, 1 - dist / config.enemies.tintMaxDist);
            this.tint = tintStrength > 0 ? `rgba(255, 0, 0, ${tintStrength.toFixed(2)})` : null;

            for (const skill of entitySkills) {
                skill(this, player, dist, dt);
            }

            if (enemy.onUpdate) enemy.onUpdate(this, player, dist, dt);
        },

        onPhysicsCollision(other) {
            if (this.data.spawnTimer > 0) return;
            if (other.name === 'player') {
                this.scene.gameOver();
            }
        },
    };
}

export const enemies = {
    miniom: {
        image: "miniom",
        physics: { frictionAir: 0.05 },
        data: { speed: 0.0005 },
        skills: ['follow'],
        score: 1,
        spawnInterval: 2,
    },
    speedMiniom: {
        image: "speed_miniom",
        physics: { density: 0.01, frictionAir: 0.03 },
        data: { speed: 0.01 },
        skills: ['follow'],
        score: 3,
        spawnInterval: 6,
    },
    shooter: {
        image: "shooter",
        physics: { frictionAir: 0.08 },
        data: { speed: 0.0004, range: 300, shotCooldown: 1, bulletSpeed: 4 },
        skills: ['keepRange', 'shoot'],
        score: 2,
        spawnInterval: 4,
    },
    smartShooter1: {
        image: "smart_shooter_1",
        physics: { frictionAir: 0.06 },
        data: { speed: 0.001, range: 500, fleeRange: 300, shotCooldown: 1, bulletSpeed: 4 },
        skills: ['keepRange', 'flee', 'shoot'],
        score: 2,
        spawnInterval: 6,
    },
    smartShooter2: {
        image: "smart_shooter_2",
        physics: { frictionAir: 0.06 },
        data: { speed: 0.001, range: 600, fleeRange: 400, shotCooldown: 0.5, bulletSpeed: 5 },
        skills: ['keepRange', 'flee', 'shoot'],
        score: 4,
        spawnInterval: 8,
    },
    smartShooter3: {
        image: "smart_shooter_3",
        physics: { frictionAir: 0.06 },
        data: { speed: 0.001, range: 600, fleeRange: 400, shotCooldown: 0.375, bulletSpeed: 6 },
        skills: ['keepRange', 'flee', 'shoot'],
        score: 6,
        spawnInterval: 10,
    },
    dash: {
        image: "dash",
        physics: { density: 0.01, frictionAir: 0.05 },
        data: { speed: 0.00075, dashSpeed: 15, dashTimer: 3, dashCooldown: 3 },
        skills: ['follow', 'dash'],
        score: 3,
        spawnInterval: 5,
    },
    multiShooter2: {
        image: "multi_shooter_2",
        physics: { frictionAir: 0.08 },
        data: { speed: 0.0004, range: 300, shotCooldown: 2.5, bulletSpeed: 4, burstCount: 2, burstDelay: 0.25, burstRemaining: 0, burstTimer: 0 },
        skills: ['keepRange', 'burst'],
        score: 3,
        spawnInterval: 7,
    },
    closeShooter1: {
        image: "close_shooter_1",
        physics: { density: 0.01, frictionAir: 0.03 },
        data: { speed: 0.005, range: 200, fleeRange: 100, shotCooldown: 1, bulletSpeed: 4 },
        skills: ['keepRange', 'flee', 'shoot'],
        score: 2,
        spawnInterval: 4,
    },
    closeShooter2: {
        image: "close_shooter_2",
        physics: { density: 0.01, frictionAir: 0.03 },
        data: { speed: 0.0075, range: 300, fleeRange: 200, shotCooldown: 0.5, bulletSpeed: 5 },
        skills: ['keepRange', 'flee', 'shoot'],
        score: 4,
        spawnInterval: 8,
    },
    multiShooter3: {
        image: "multi_shooter_3",
        physics: { density: 0.01, frictionAir: 0.03 },
        data: { speed: 0.01, range: 400, fleeRange: 300, shotCooldown: 2, bulletSpeed: 5, burstCount: 3, burstDelay: 0.5, burstRemaining: 0, burstTimer: 0 },
        skills: ['keepRange', 'flee', 'burst'],
        score: 6,
        spawnInterval: 10,
    },
    multiShooter4: {
        image: "multi_shooter_4",
        physics: { density: 0.01, frictionAir: 0.03 },
        data: { speed: 0.01, range: 500, fleeRange: 400, shotCooldown: 1.5, bulletSpeed: 6, burstCount: 4, burstDelay: 0.25, burstRemaining: 0, burstTimer: 0 },
        skills: ['keepRange', 'flee', 'burst'],
        score: 8,
        spawnInterval: 15,
    },
    dashShooter1: {
        image: "dash_shooter_1",
        physics: { density: 0.01, frictionAir: 0.05 },
        data: { speed: 0.00075, dashSpeed: 17.5, dashTimer: 3, dashCooldown: 3, range: 300, shotCooldown: 1, bulletSpeed: 4 },
        skills: ['follow', 'dash', 'shoot'],
        score: 5,
        spawnInterval: 8,
    },
    dashShooter2: {
        image: "dash_shooter_2",
        physics: { density: 0.01, frictionAir: 0.05 },
        data: { speed: 0.00075, dashSpeed: 20, dashTimer: 2, dashCooldown: 2, range: 400, shotCooldown: 0.75, bulletSpeed: 5 },
        skills: ['follow', 'dash', 'shoot'],
        score: 6,
        spawnInterval: 10,
    },
}