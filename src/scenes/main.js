import playerEntity from "../entities/player.js";
import { createStars } from "../entities/star.js";
import crosshairEntity from "../entities/crosshair.js";
import { enemies, createEnemy } from "../entities/enemies.js";
import config from "../config/config.js";

import { $id } from "../utils/utils.js";

const enemiesData = Object.entries(enemies).map(([key, config]) => ({ name: key, ...config }));

const $score = $id('gui_game_score');
const $best = $id('gui_game_best');

const mainScene = {
    name: 'main',

    entities: [
        ...createStars(),
        playerEntity,
        crosshairEntity,
    ],

    gui: {
        game: true,
        'joystick-left': true,
        'joystick-right': true,
    },

    data: {
        score: 0,
        maxScore: 0,

        timers: Object.fromEntries(
            Object.keys(enemies).map(name => [name, 0])
        ),
    },


    gameOver() {
        this.game.resetScene({
            resetCamera: false
        });
    },

    spawnEnemy(entityConfig) {
        const cam = this.game.camera;
        const halfW = this.game.width / 2 / cam.zoom;
        const halfH = this.game.height / 2 / cam.zoom;
        const w = config.world;

        let x, y, attempts = 0;
        // do {
        const side = CanvasEngine.Random.int(0, 3);
        if (side === 0) {
            x = CanvasEngine.Random.float(cam.x - halfW - config.spawn.margin, cam.x + halfW + config.spawn.margin);
            y = cam.y - halfH - config.spawn.margin;
        } else if (side === 1) {
            x = CanvasEngine.Random.float(cam.x - halfW - config.spawn.margin, cam.x + halfW + config.spawn.margin);
            y = cam.y + halfH + config.spawn.margin;
        } else if (side === 2) {
            x = cam.x - halfW - config.spawn.margin;
            y = CanvasEngine.Random.float(cam.y - halfH - config.spawn.margin, cam.y + halfH + config.spawn.margin);
        } else {
            x = cam.x + halfW + config.spawn.margin;
            y = CanvasEngine.Random.float(cam.y - halfH - config.spawn.margin, cam.y + halfH + config.spawn.margin);
        }
        //     attempts++;
        // } while (
        //     attempts < config.spawn.maxAttempts &&
        //     (x < w.minX || x > w.maxX || y < w.minY || y > w.maxY)
        // );

        // if (x < w.minX || x > w.maxX || y < w.minY || y > w.maxY) return;

        entityConfig.x = x;
        entityConfig.y = y;

        this.addEntity(entityConfig);
    },

    addScore(points) {
        this.data.score += points;

        $score.textContent = this.data.score;

        if (this.data.score >= this.data.maxScore) {
            this.data.maxScore = this.data.score;
            $best.textContent = this.data.maxScore;
            localStorage.setItem('starsbits_maxScore', this.data.maxScore);
        }
    },

    onCreate() {
        $score.textContent = this.data.score;

        this.data.maxScore = parseInt(localStorage.getItem('starsbits_maxScore')) || 0;
        $best.textContent = this.data.maxScore;

        const player = this.findEntityByName('player');
        if (player) {
            this.game.camera.setTarget(player, 5);
        }

        const w = config.world;
        this.game.camera.setBounds(w.minX, w.minY, w.maxX, w.maxY);
    },

    onUpdate(dt) {
        const player = this.findEntityByName('player');
        if (!player) return;

        enemiesData.forEach(enemy => {
            if (enemy.requireScore && this.data.score < enemy.requireScore) return;

            this.data.timers[enemy.name] += dt;

            const scoreAbove = Math.max(0, this.data.score - (enemy.requireScore || 0));
            const interval = Math.max(
                enemy.minSpawnInterval || 1,
                enemy.spawnInterval - scoreAbove * config.enemies.spawnSpeedupPerScore
            );

            if (this.data.timers[enemy.name] >= interval) {
                this.data.timers[enemy.name] = 0;
                this.spawnEnemy(createEnemy(enemy));
            }
        })

        if (player._physicsBody) {
            const vel = player._physicsBody.velocity;
            const speed = Math.hypot(vel.x, vel.y);
            const targetZoom = CanvasEngine.Utils.clamp(config.camera.zoomMax - speed * config.camera.zoomSpeedFactor, config.camera.zoomMin, config.camera.zoomMax);
            this.game.camera.zoom = CanvasEngine.Utils.lerp(this.game.camera.zoom, targetZoom, config.camera.zoomLerp);
        }
    },
}

export default mainScene;
