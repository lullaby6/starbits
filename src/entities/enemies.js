import config from "../config/config.js";
import { spawnEnemyBullet } from "./bullets/enemyBullet.js";
import { spawnDestroyParticles, spawnShotParticles, spawnThrustParticles } from "../particles/particles.js";

const world = config.world;

function isInsideWorld(entity) {
    return entity.centerX >= world.minX && entity.centerX <= world.maxX &&
        entity.centerY >= world.minY && entity.centerY <= world.maxY;
}

function addThrust(entity, fx, fy) {
    entity.data._thrustX += fx;
    entity.data._thrustY += fy;
}

const skills = {
    follow(entity, player, dist, dt) {
        const fx = Math.cos(entity.rotation);
        const fy = Math.sin(entity.rotation);
        entity.applyForce({ x: fx * entity.data.speed, y: fy * entity.data.speed });
        addThrust(entity, fx, fy);
    },

    smartFollow(entity, player, dist, dt) {
        const leadTime = entity.data.leadTime || 0;
        let targetX = player.centerX;
        let targetY = player.centerY;

        if (leadTime > 0 && player._physicsBody) {
            const velocity = player._physicsBody.velocity;
            targetX += velocity.x * leadTime;
            targetY += velocity.y * leadTime;
        }

        entity.rotateAt(targetX, targetY);
        const angle = entity.rotation;

        entity.rotateToEntity(player);

        const fx = Math.cos(angle);
        const fy = Math.sin(angle);
        entity.applyForce({ x: fx * entity.data.speed, y: fy * entity.data.speed });
        addThrust(entity, fx, fy);
    },

    keepRange(entity, player, dist, dt) {
        if (dist > entity.data.range) {
            const fx = Math.cos(entity.rotation);
            const fy = Math.sin(entity.rotation);
            entity.applyForce({ x: fx * entity.data.speed, y: fy * entity.data.speed });
            addThrust(entity, fx, fy);
        }
    },

    flee(entity, player, dist, dt) {
        if (dist < entity.data.fleeRange) {
            const fx = -Math.cos(entity.rotation);
            const fy = -Math.sin(entity.rotation);
            entity.applyForce({ x: fx * entity.data.speed, y: fy * entity.data.speed });
            addThrust(entity, fx, fy);
        }
    },

    shoot(entity, player, dist, dt) {
        if (entity.data.shotTimer > 0) {
            entity.data.shotTimer -= dt;
        } else if (dist <= (entity.data.range || Infinity) + 100 && isInsideWorld(entity)) {
            entity.data.shotTimer = entity.data.shotCooldown;
            entity.shoot();
        }
    },

    burst(entity, player, dist, dt) {
        if (entity.data.burstRemaining > 0) {
            entity.data.burstTimer -= dt;
            if (entity.data.burstTimer <= 0) {
                entity.data.burstRemaining--;
                entity.data.burstTimer = entity.data.burstDelay;

                if (isInsideWorld(entity)) {
                    entity.shoot();
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
            const fx = Math.cos(entity.rotation);
            const fy = Math.sin(entity.rotation);
            entity.setVelocity({ x: fx * entity.data.dashSpeed, y: fy * entity.data.dashSpeed });
            addThrust(entity, fx, fy);
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
        dontCollideIsNotVisible: true,

        image: {
            src: `${config.images.enemies}${enemy.image}.png`,
        },

        physics: {
            ...{
                frictionAir: 0.05,
                fixedRotation: true,
                group: 'enemy',
                collidesWith: ['player', 'playerBullet', 'enemy', 'meteor'],
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
            thrustTimer: 0,
            _thrustX: 0,
            _thrustY: 0,
            ...enemy.data,
        },


        die() {
            if (this.data.dying) return;

            if (this.isVisible()) {
                spawnDestroyParticles(this.scene, this.centerX, this.centerY, { tint: this.tint });
                this.game.camera.shake(config.shakes.enemyDeath.intensity, config.shakes.enemyDeath.duration);
            }

            this.data.dying = true;
            this.data.deathTimer = DEATH_DURATION;
            // this.tint = null;
            this.disableCollisions();
        },

        shoot() {
            spawnEnemyBullet(this.scene, this.centerX, this.centerY, this.rotation, this.data.bulletSpeed, this.data.bulletLifetime);
            if (this.isVisible()) {
                spawnShotParticles(this.scene, this.centerX, this.centerY, this.rotation, this.width, { tint: this.tint });
            }
        },

        onCreate() {
            if (enemy.onCreate) enemy.onCreate(this);
        },

        onDestroy() {
            // spawnDestroyParticles(this.scene, this.centerX, this.centerY);
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

            const player = this.scene.player;
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
                    this.game.physics.setPosition(this._physicsBody, pos.x, pos.y);
                    this.game.physics.setVelocity(this._physicsBody, { x: 0, y: 0 });
                } else {
                    this.x = pos.x - this.width / 2;
                    this.y = pos.y - this.height / 2;
                }
                return;
            }

            const visible = this.isVisible();

            if (visible) {
                const tintStrength = Math.max(0, 1 - dist / config.tint.enemy.max);
                this.tint = tintStrength > 0 ? `rgba(255, 0, 0, ${tintStrength.toFixed(2)})` : null;
            }

            for (const skill of entitySkills) {
                skill(this, player, dist, dt);
            }

            this.data.thrustTimer -= dt;
            if (visible && (this.data._thrustX !== 0 || this.data._thrustY !== 0) && this.data.thrustTimer <= 0) {
                this.data.thrustTimer = config.particles.thrust.interval;
                const len = Math.hypot(this.data._thrustX, this.data._thrustY) || 1;
                spawnThrustParticles(this.scene, this.centerX, this.centerY, this.rotation, this.width, this.data._thrustX / len, this.data._thrustY / len, { tint: this.tint });
            }
            this.data._thrustX = 0;
            this.data._thrustY = 0;

            if (enemy.onUpdate) enemy.onUpdate(this, player, dist, dt);
        },

        onPhysicsCollision(other) {
            if (this.data.spawnTimer > 0 || this.data.dying) return;
            if (other.name === 'player') {
                this.game.camera.shake(config.shakes.playerDeath.intensity, config.shakes.playerDeath.duration);
                this.scene.gameOver();
            }

        },
    };
}

export const enemies = {
    // T1 — base
    miniom: {
        image: "miniom_1",
        data: { speed: 0.0005, leadTime: 30 },
        skills: ['smartFollow'],
        score: 1,
        requireScore: 0,
        spawnInterval: 1.2,
        minSpawnInterval: 0.8,
        max: 20,
    },

    // T2 — shoot y dash
    shooter: {
        image: "shooter_1",
        data: { speed: 0.0004, range: 300, shotCooldown: 1, bulletSpeed: 4 },
        skills: ['keepRange', 'shoot'],
        score: 2,
        requireScore: 10,
        spawnInterval: 5,
        minSpawnInterval: 2.5,
        max: 15,
    },
    dash: {
        image: "dash_1",
        physics: { density: 0.01 },
        data: { speed: 0.00075, dashSpeed: 15, dashTimer: 3, dashCooldown: 3, leadTime: 30 },
        skills: ['smartFollow', 'dash'],
        score: 3,
        requireScore: 25,
        spawnInterval: 7,
        minSpawnInterval: 3,
        max: 15,
    },

    // T3 — mid distance
    closeShooter: {
        image: "close_shooter_1",
        physics: { density: 0.01 },
        data: { speed: 0.005, range: 200, fleeRange: 100, shotCooldown: 1, bulletSpeed: 4, bulletLifetime: config.bullets.enemy.lifetime / 2 },
        skills: ['keepRange', 'flee', 'shoot'],
        score: 3,
        requireScore: 50,
        spawnInterval: 7,
        minSpawnInterval: 3,
        max: 10,
    },
    rapidShooter: {
        image: "rapid_shooter_1",
        data: { speed: 0.0004, range: 300, shotCooldown: 0.5, bulletSpeed: 4 },
        skills: ['keepRange', 'shoot'],
        score: 4,
        requireScore: 75,
        spawnInterval: 6,
        minSpawnInterval: 3,
        max: 10,
    },
    burstShooter: {
        image: "burst_shooter_1",
        data: { speed: 0.0004, range: 300, shotCooldown: 2.5, bulletSpeed: 4, burstCount: 2, burstDelay: 0.25, burstRemaining: 0, burstTimer: 0, leadTime: 15 },
        skills: ['keepRange', 'burst'],
        score: 4,
        requireScore: 100,
        spawnInterval: 8,
        minSpawnInterval: 3.5,
        max: 10,
    },
    smartShooter: {
        image: "smart_shooter_1",
        data: { speed: 0.001, range: 500, fleeRange: 300, shotCooldown: 1, bulletSpeed: 4, leadTime: 20 },
        skills: ['keepRange', 'flee', 'shoot'],
        score: 5,
        requireScore: 125,
        spawnInterval: 9,
        minSpawnInterval: 4,
        max: 10,
    },

    // T4 — upgrades, mobility
    rapidShooter2: {
        image: "rapid_shooter_1",
        data: { speed: 0.0004, range: 300, shotCooldown: 0.375, bulletSpeed: 4 },
        skills: ['keepRange', 'shoot'],
        score: 6,
        requireScore: 150,
        spawnInterval: 8,
        minSpawnInterval: 3.5,
        max: 5,
    },
    closeShooter2: {
        image: "close_shooter_2",
        physics: { density: 0.01 },
        data: { speed: 0.0075, range: 300, fleeRange: 200, shotCooldown: 0.5, bulletSpeed: 5, bulletLifetime: config.bullets.enemy.lifetime / 2 },
        skills: ['keepRange', 'flee', 'shoot'],
        score: 6,
        requireScore: 175,
        spawnInterval: 9,
        minSpawnInterval: 4,
        max: 5,
    },
    speed: {
        image: "speed_1",
        physics: { density: 0.01 },
        data: { speed: 0.015, leadTime: 40 },
        skills: ['smartFollow'],
        score: 7,
        requireScore: 200,
        spawnInterval: 11,
        minSpawnInterval: 5,
        max: 5,
    },
    dashShooter: {
        image: "dash_shooter_1",
        physics: { density: 0.01 },
        data: { speed: 0.00075, dashSpeed: 17.5, dashTimer: 3, dashCooldown: 3, range: 300, shotCooldown: 1, bulletSpeed: 4, leadTime: 25 },
        skills: ['smartFollow', 'dash', 'shoot'],
        score: 7,
        requireScore: 225,
        spawnInterval: 11,
        minSpawnInterval: 5,
        max: 5,
    },
    burstShooter2: {
        image: "burst_shooter_2",
        physics: { density: 0.01 },
        data: { speed: 0.01, range: 400, fleeRange: 300, shotCooldown: 2, bulletSpeed: 5, burstCount: 3, burstDelay: 0.5, burstRemaining: 0, burstTimer: 0, leadTime: 15 },
        skills: ['keepRange', 'flee', 'burst'],
        score: 7,
        requireScore: 250,
        spawnInterval: 12,
        minSpawnInterval: 5.5,
        max: 5,
    },
    smartShooter2: {
        image: "smart_shooter_2",
        data: { speed: 0.001, range: 600, fleeRange: 400, shotCooldown: 0.5, bulletSpeed: 5, leadTime: 20 },
        skills: ['keepRange', 'flee', 'shoot'],
        score: 8,
        requireScore: 300,
        spawnInterval: 12,
        minSpawnInterval: 5.5,
        max: 5,
    },

    // T5 — elite
    rapidShooter3: {
        image: "rapid_shooter_1",
        data: { speed: 0.0004, range: 300, shotCooldown: 0.5, bulletSpeed: 4 },
        skills: ['keepRange', 'shoot'],
        score: 9,
        requireScore: 350,
        spawnInterval: 11,
        minSpawnInterval: 5,
        max: 5,
    },
    closeShooter3: {
        image: "close_shooter_3",
        physics: { density: 0.01 },
        data: { speed: 0.01, range: 400, fleeRange: 300, shotCooldown: 0.375, bulletSpeed: 6, leadTime: 15, bulletLifetime: config.bullets.enemy.lifetime / 2 },
        skills: ['keepRange', 'flee', 'shoot'],
        score: 10,
        requireScore: 400,
        spawnInterval: 14,
        minSpawnInterval: 6,
        max: 5,
    },
    dashShooter2: {
        image: "dash_shooter_2",
        physics: { density: 0.01 },
        data: { speed: 0.00075, dashSpeed: 20, dashTimer: 2, dashCooldown: 2, range: 400, shotCooldown: 0.75, bulletSpeed: 5, leadTime: 25 },
        skills: ['smartFollow', 'dash', 'shoot'],
        score: 12,
        requireScore: 450,
        spawnInterval: 16,
        minSpawnInterval: 7,
        max: 5,
    },
    smartShooter3: {
        image: "smart_shooter_3",
        data: { speed: 0.001, range: 600, fleeRange: 400, shotCooldown: 0.375, bulletSpeed: 6, leadTime: 20 },
        skills: ['keepRange', 'flee', 'shoot'],
        score: 12,
        requireScore: 500,
        spawnInterval: 17,
        minSpawnInterval: 7.5,
        max: 5,
    },
    burstShooter3: {
        image: "burst_shooter_3",
        physics: { density: 0.01 },
        data: { speed: 0.01, range: 500, fleeRange: 400, shotCooldown: 1.5, bulletSpeed: 6, burstCount: 4, burstDelay: 0.25, burstRemaining: 0, burstTimer: 0, leadTime: 15 },
        skills: ['keepRange', 'flee', 'burst'],
        score: 14,
        requireScore: 550,
        spawnInterval: 18,
        minSpawnInterval: 8,
        max: 5,
    },
}