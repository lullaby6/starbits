import playerEntity from "../entities/player.js";
import { createStars } from "../entities/star.js";
import crosshairEntity from "../entities/crosshair.js";
import { enemies, createEnemy } from "../entities/enemies.js";
import config from "../config/config.js";

import { $id, $idEvent } from "../utils/utils.js";

const enemiesData = Object.entries(enemies).map(([key, config]) => ({ name: key, ...config }));

const $score = $id('gui_game_score');
const $best = $id('gui_game_best');

export default {
    name: 'main',

    camera: {
        x: 0,
        y: 0,
        zoom: config.camera.zoom,
    },

    entities: [
        ...createStars(),
        playerEntity,
    ],

    menu: {
        start: false,
    },

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
        this.game.menu.restart.show();

        const player = this.findEntityByName('player');
        if (player) player.destroy();

        const crosshair = this.findEntityByName('crosshair');
        if (crosshair) crosshair.destroy();
        // this.game.resetScene({
        //     resetCamera: false
        // });
    },

    getSpawnPosition() {
        const cam = this.game.camera;
        const halfW = this.game.width / 2 / cam.zoom;
        const halfH = this.game.height / 2 / cam.zoom;
        const margin = config.spawn.margin;

        const side = CanvasEngine.Random.int(0, 3);
        let x, y;
        if (side === 0) {
            x = CanvasEngine.Random.float(cam.x - halfW - margin, cam.x + halfW + margin);
            y = cam.y - halfH - margin;
        } else if (side === 1) {
            x = CanvasEngine.Random.float(cam.x - halfW - margin, cam.x + halfW + margin);
            y = cam.y + halfH + margin;
        } else if (side === 2) {
            x = cam.x - halfW - margin;
            y = CanvasEngine.Random.float(cam.y - halfH - margin, cam.y + halfH + margin);
        } else {
            x = cam.x + halfW + margin;
            y = CanvasEngine.Random.float(cam.y - halfH - margin, cam.y + halfH + margin);
        }

        return { x, y };
    },

    spawnEnemy(entityConfig) {
        const pos = this.getSpawnPosition();
        entityConfig.x = pos.x;
        entityConfig.y = pos.y;
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
        this.setupDom();

        if (!CanvasEngine.Utils.isMobile()) {
            this.addEntity(crosshairEntity)
        }

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

                if (enemy.max != null) {
                    const alive = this.findByTag(enemy.name).length;
                    if (alive >= enemy.max) return;
                }

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

    setupDom() {
        $idEvent('menu_pause_resume', 'click', () => {
            this.game.resume();
        });

        $idEvent('menu_pause_restart', 'click', () => {
            this.game.resetScene();
        });

        $idEvent('menu_pause_exit', 'click', () => {
            this.game.changeScene('start')
        });

        $idEvent('menu_pause_options', 'click', () => {
            this.game.switchMenu('options', 'pause')
        });

        $idEvent('menu_restart_restart', 'click', () => {
            this.game.resetScene();
        });

        $idEvent('menu_restart_options', 'click', () => {
            this.game.switchMenu('options', 'restart')
        });

        $idEvent('menu_restart_exit', 'click', () => {
            this.game.changeScene('start')
        });

        $idEvent('gui_game_pause', 'click', () => {
            this.game.pause();
        });
    },
    onPause() {
        this.game.menu.pauseOverlay.show()
    },
    onResume() {
        this.game.menu.pauseOverlay.hide()
    },
}