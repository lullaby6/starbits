import config from "../config/config.js";
import { spawnPlayerBullet } from "./bullets/playerBullet.js";
import { spawnDestroyParticles, spawnShotParticles, spawnThrustParticles } from "../utils/particles.js";

const player = {
    name: 'player',
    x: 0,
    y: 0,
    imageScale: 10,
    scaleWithImageScale: true,
    color: 'transparent',
    originX: 0.5,
    originY: 0.5,
    dontCollideIsNotVisible: true,

    image: {
        src: config.images.player,
    },

    physics: {
        frictionAir: config.stats.friction.min,
        fixedRotation: true,
        group: 'player',
        dontCollidesWith: ['playerBullet'],
    },

    data: {
        speed: config.stats.speed.min,
        bulletSpeed: config.stats.bulletSpeed.min,
        shotCooldown: config.stats.shotCooldown.min,
        shotTimer: 0,
        bulletSize: config.stats.bulletSize.min,
        bulletCount: config.stats.bulletCount.min,
        bulletSpread: config.stats.bulletSpread.min,
        bulletBurstCount: config.stats.bulletBurstCount.min,
        bulletBurstDelay: config.stats.bulletBurstDelay.min,
        bulletLifetime: config.stats.bulletLifetime.min,
        bulletPiercing: config.stats.bulletPiercing.min,
        recoil: config.stats.recoil.min,
        burstRemaining: 0,
        burstTimer: 0,
        thrustTimer: 0,
        _kbX: 0,
        _kbY: 0,
    },

    onMousemove({ worldX, worldY }) {
        if (CanvasEngine.Utils.isMobile() || this.game.data.options.autoAim) return;
        this.rotateAt(worldX, worldY);
    },

    onMousehold() {
        if (CanvasEngine.Utils.isMobile() || this.game.data.options.autoAim) return;
        this.shoot();
    },

    // onTouchstart({ worldX, worldY }) {
    //     if (!CanvasEngine.Utils.isMobile()) return;
    //     this.rotateAt(worldX, worldY);
    //     this.shoot();
    // }

    // onTouchhold({ worldX, worldY }) {
    //     if (!CanvasEngine.Utils.isMobile()) return;
    //     this.rotateAt(worldX, worldY);
    //     this.shoot();
    // },

    _spawnBullet() {
        let spawnX = this.centerX;
        let spawnY = this.centerY;

        if (this._physicsBody) {
            const vel = this._physicsBody.velocity;
            spawnX += vel.x;
            spawnY += vel.y;
        }

        const count = this.data.bulletCount;
        const spread = this.data.bulletSpread;

        for (let bulletIndex = 0; bulletIndex < count; bulletIndex++) {
            const offset = count === 1 ? 0 : (bulletIndex - (count - 1) / 2) * spread;
            const angle = this.rotation + offset;
            spawnPlayerBullet(this.scene, spawnX, spawnY, angle, this.data.bulletSpeed, this.data.bulletSize, this.data.bulletLifetime, this.data.bulletPiercing);
        }

        this._applyShotRnockback();

        spawnShotParticles(this.scene, spawnX, spawnY, this.rotation, this.width);
    },

    _applyShotRnockback() {
        const body = this._physicsBody;
        if (!body || !this.data.recoil) return;
        const v = body.velocity;
        this.setVelocity({
            x: v.x - Math.cos(this.rotation) * this.data.recoil,
            y: v.y - Math.sin(this.rotation) * this.data.recoil,
        });
    },

    shoot() {
        if (this.data.shotTimer > 0) return;
        this.data.shotTimer = this.data.shotCooldown;

        this._spawnBullet();

        if (this.data.bulletBurstCount > 0) {
            this.data.burstRemaining = this.data.bulletBurstCount;
            this.data.burstTimer = this.data.bulletBurstDelay;
        }
    },

    _updateBurst(dt) {
        if (this.data.burstRemaining <= 0) return;
        this.data.burstTimer -= dt;
        if (this.data.burstTimer <= 0) {
            this.data.burstRemaining--;
            this.data.burstTimer = this.data.bulletBurstDelay;
            this._spawnBullet();
        }
    },

    autoAim(dt) {
        const enemies = this.scene.findEntitiesByTag('enemy')
        let minDist = Infinity;
        let closestEnemy = null;

        enemies.forEach(enemy => {
            const dist = CanvasEngine.Utils.distance(this, enemy);

            if (dist > config.player.autoAimDistanceToShot) return;

            if (dist < minDist) {
                minDist = dist;
                closestEnemy = enemy;
            }
        })

        if (!closestEnemy) return;

        this.rotateToEntity(closestEnemy, 10, dt)

        this.shoot();
    },

    onUpdate(dt) {
        if (this.data.shotTimer > 0) {
            this.data.shotTimer -= dt;
        }

        this._updateBurst(dt);

        let thrustX = 0;
        let thrustY = 0;

        if (this.data.joystickDir) {
            const dir = this.data.joystickDir;
            thrustX += dir.x;
            thrustY += dir.y;
            this.applyForce({
                x: dir.x * this.data.speed,
                y: dir.y * this.data.speed,
            });
        }

        if (this.data._kbX !== 0 || this.data._kbY !== 0) {
            thrustX += this.data._kbX;
            thrustY += this.data._kbY;
            this.data._kbX = 0;
            this.data._kbY = 0;
        }

        this.data.thrustTimer -= dt;
        if ((thrustX !== 0 || thrustY !== 0) && this.data.thrustTimer <= 0) {
            this.data.thrustTimer = config.particles.thrust.interval;
            const len = Math.hypot(thrustX, thrustY) || 1;
            spawnThrustParticles(this.scene, this.centerX, this.centerY, this.rotation, this.width, thrustX / len, thrustY / len);
        }

        const world = config.world;
        const cx = CanvasEngine.Utils.clamp(this.centerX, world.minX, world.maxX);
        const cy = CanvasEngine.Utils.clamp(this.centerY, world.minY, world.maxY);
        if (cx !== this.centerX || cy !== this.centerY) {
            const body = this._physicsBody;
            if (body) {
                this.game.physics.setPosition(body, cx, cy);
                this.game.physics.setVelocity(body, { x: 0, y: 0 });
            }
        }

        if (this.game.data.options.autoAim) {
            this.autoAim(dt)
        }
    },

    onKeyhold({ key }) {
        const keys = this.game.data.keys.player;
        let fx = 0;
        let fy = 0;

        if (keys.up.includes(key)) fy = -this.data.speed;
        else if (keys.down.includes(key)) fy = this.data.speed;
        else if (keys.left.includes(key)) fx = -this.data.speed;
        else if (keys.right.includes(key)) fx = this.data.speed;

        if (fx !== 0 || fy !== 0) {
            this.applyForce({
                x: fx,
                y: fy
            });
            this.data._kbX += Math.sign(fx);
            this.data._kbY += Math.sign(fy);
        }
    },

    onLeftJoystickMove(event) {
        const vx = event.data.vector.x;
        const vy = event.data.vector.y;
        const len = Math.sqrt(vx * vx + vy * vy);
        if (len === 0) return;

        this.data.joystickDir = { x: vx / len, y: -(vy / len) };
        // this.rotation = -event.data.angle.radian;
    },

    onLeftJoystickEnd() {
        this.data.joystickDir = null;
    },

    onRightJoystickMove(event) {
        if (this.game.data.options.autoAim) return;

        this.shoot();
        this.rotation = -event.data.angle.radian;
    },

    onDestroy() {
        this.game.shakeCamera(config.shakes.playerDeath.intensity, config.shakes.playerDeath.duration);

        spawnDestroyParticles(this.scene, this.centerX, this.centerY);

        this.scene.gameOver();
    },
}

export default player;
