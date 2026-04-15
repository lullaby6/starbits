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
        frictionAir: 0.075,
        fixedRotation: true,
        group: 'player',
        collidesWith: ['enemy', 'enemyBullet'],
    },

    data: {
        speed: 0.0025,
        bulletSpeed: 10,
        shotCooldown: 0.2,
        shotTimer: 0,
        keys: {
            up: 'w',
            down: 's',
            left: 'a',
            right: 'd',
        }
    },

    onMousemove({ worldX, worldY }) {
        if (CanvasEngine.Utils.isMobile()) return;
        this.rotateAt(worldX, worldY);
    },

    onClick() {
        if (CanvasEngine.Utils.isMobile()) return;
        this.shot();
    },

    // onTouchstart({ worldX, worldY }) {
    //     if (!CanvasEngine.Utils.isMobile()) return;
    //     this.rotateAt(worldX, worldY);
    //     this.shot();
    // },

    // onTouchhold({ worldX, worldY }) {
    //     if (!CanvasEngine.Utils.isMobile()) return;
    //     this.rotateAt(worldX, worldY);
    //     this.shot();
    // },

    shot() {
        if (this.data.shotTimer > 0) return;
        this.data.shotTimer = this.data.shotCooldown;
        spawnBullet(this.scene, this.centerX, this.centerY, this.rotation, this.data.bulletSpeed);
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
    },

    onKeyhold({ key }) {
        const keys = this.data.keys;
        let fx = 0;
        let fy = 0;

        if (key === keys.up) fy = -this.data.speed;
        else if (key === keys.down) fy = this.data.speed;
        else if (key === keys.left) fx = -this.data.speed;
        else if (key === keys.right) fx = this.data.speed;

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
