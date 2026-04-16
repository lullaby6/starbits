import config from "../config/config.js";
import { spawnBullet } from "./bullets/bullet.js";

const player = {
    name: 'player',
    x: 0,
    y: 0,
    imageScale: 10,
    scaleWithImageScale: true,
    color: 'transparent',
    originX: 0.5,
    originY: 0.5,

    image: {
        src: config.images.player,
    },

    physics: {
        frictionAir: config.upgrades.friction.min,
        fixedRotation: true,
        group: 'player',
        collidesWith: ['enemy', 'enemyBullet'],
    },

    data: {
        speed: config.upgrades.speed.min,
        bulletSpeed: config.upgrades.bulletSpeed.min,
        shotCooldown: config.upgrades.shotCooldown.min,
        shotTimer: 0,
        shield: config.upgrades.shield.min,
        health: config.upgrades.health.min,
        bulletSize: config.upgrades.bulletSize.min,
        bulletCount: config.upgrades.bulletCount.min,
        bulletLifetime: config.upgrades.bulletLifetime.min,
        bulletPiercing: config.upgrades.bulletPiercing.min,
        bulletSize: config.upgrades.bulletSize.min,
    },

    onMousemove({ worldX, worldY }) {
        if (CanvasEngine.Utils.isMobile()) return;
        this.rotateAt(worldX, worldY);
    },

    onMousehold() {
        if (CanvasEngine.Utils.isMobile()) return;
        this.shot();
    },

    // onTouchstart({ worldX, worldY }) {
    //     if (!CanvasEngine.Utils.isMobile()) return;
    //     this.rotateAt(worldX, worldY);
    //     this.shot();
    // }

    // onTouchhold({ worldX, worldY }) {
    //     if (!CanvasEngine.Utils.isMobile()) return;
    //     this.rotateAt(worldX, worldY);
    //     this.shot();
    // },

    shot() {
        if (this.data.shotTimer > 0) return;
        this.data.shotTimer = this.data.shotCooldown;
        spawnBullet(this.scene, this.centerX, this.centerY, this.rotation, this.data.bulletSpeed, this.data.bulletSize, this.data.bulletLifetime);
    },

    autoAim() {
        const enemies = this.scene.findEntitiesByTag('enemy')
        let minDist = Infinity;
        let closestEnemy = null;

        enemies.forEach(enemy => {
            const dist = CanvasEngine.Utils.distance(this, enemy);

            if (dist < minDist) {
                minDist = dist;
                closestEnemy = enemy;
            }
        })

        console.log(closestEnemy);


        if (!closestEnemy) return;

        this.rotateToEntity(closestEnemy)
    },

    onUpdate(dt) {
        if (this.data.shotTimer > 0) {
            this.data.shotTimer -= dt;
        }

        if (this.data.joystickDir) {
            const dir = this.data.joystickDir;
            this.applyForce({
                x: dir.x * this.data.speed,
                y: dir.y * this.data.speed,
            });
        }

        const w = config.world;
        const cx = CanvasEngine.Utils.clamp(this.centerX, w.minX, w.maxX);
        const cy = CanvasEngine.Utils.clamp(this.centerY, w.minY, w.maxY);
        if (cx !== this.centerX || cy !== this.centerY) {
            const body = this._physicsBody;
            if (body) {
                this.scene.game.physics.setPosition(body, cx, cy);
                this.scene.game.physics.setVelocity(body, { x: 0, y: 0 });
            }
        }

        if (this.scene.game.data.options.autoAim) {
            this.autoAim()
        }
    },

    onKeyhold({ key }) {
        const keys = this.scene.game.data.keys.player;
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
        this.shot();
        this.rotation = -event.data.angle.radian;
    },
}

export default player;
