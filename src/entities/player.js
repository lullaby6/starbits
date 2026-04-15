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
        this.rotateAt(worldX, worldY);
    },

    onClick() {
        if (this.data.shotTimer > 0) return;
        this.data.shotTimer = this.data.shotCooldown;
        spawnBullet(this.scene, this.centerX, this.centerY, this.rotation, this.data.bulletSpeed);
    },

    onUpdate(dt) {
        if (this.data.shotTimer > 0) {
            this.data.shotTimer -= dt;
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
            this.applyForce({ x: fx, y: fy });
        }
    },
}

export default player;
