import playerEntity from "../entities/player.js";
import { createStars } from "../entities/star.js";
import crosshairEntity from "../entities/crosshair.js";
import { enemies, createEnemy } from "../entities/enemies.js";
import config from "../config/config.js";

import { $id, $idEvent } from "../utils/utils.js";

const enemiesData = Object.entries(enemies).map(([key, config]) => ({ name: key, ...config }));

const $score = $id('gui_game_score_score');
const $best = $id('gui_game_score_best');
const $dangerVignette = $id('gui_danger_vignette');

export default {
    name: 'game',
    cursor: false,
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
        game_score: false,
        mobile: true,
        'joystick-left': true,
        'joystick-right': true,
        danger_vignette: true,
    },

    data: {
        score: 0,
        maxScore: 0,
        dangerTime: 0,

        timers: Object.fromEntries(
            Object.keys(enemies).map(name => [name, 0])
        ),
    },

    gameOver() {
        this.ignorePause = true;
        this.game.showCursor();

        this.game.menu.restart.show();

        const player = this.findEntityByName('player');
        if (player) player.destroy();

        const crosshair = this.findEntityByName('crosshair');
        if (crosshair) crosshair.destroy();

        this.game.showGui('game_score')

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
            localStorage.setItem('starbits_maxScore', this.data.maxScore);
        }

        this.game.gui.game_score.show(300)

        if (this.guiScoreTimeout) {
            clearTimeout(this.guiScoreTimeout)
        }

        this.guiScoreTimeout = setTimeout(() => {
            this.game.gui.game_score.hide(300)
            this.guiScoreTimeout = null
        }, 3000)
    },

    onCreate() {
        this.setupDom();
        this.setupDangerVignette();

        if (!CanvasEngine.Utils.isMobile()) {
            const crosshair = this.addEntity(crosshairEntity);

            if (this.game.data.options.autoAim) {
                crosshair.active = false;
            }
        }

        if (this.game.data.options.autoAim) {
            this.game.hideGui('joystick-right');
        }

        $score.textContent = this.data.score;

        this.data.maxScore = parseInt(localStorage.getItem('starbits_maxScore')) || 0;
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
                    const alive = this.findEntitiesByTag(enemy.name).length;
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

        if (this.game.data.options.dangerVignette) this.updateDangerVignette(player, dt);
    },

    setupDangerVignette() {
        const cfg = config.dangerVignette;
        $dangerVignette.style.background =
            `radial-gradient(${cfg.shape} at center, ` +
            `rgba(255,0,0,0) ${cfg.innerStop}%, ` +
            `rgba(255,20,20,${cfg.midAlpha}) ${cfg.midStop}%, ` +
            `rgba(180,0,0,${cfg.outerAlpha}) ${cfg.outerStop}%)`;
        $dangerVignette.style.opacity = 0;
        this.data.dangerTime = 0;
    },

    updateDangerVignette(player, dt) {
        const cfg = config.dangerVignette;
        const threats = [
            ...this.findEntitiesByTag('enemy'),
            ...this.findEntitiesByTag('enemyBullet'),
        ];

        let minDist = Infinity;
        for (const threat of threats) {
            if (threat.data?.dying || threat.data?.spawnTimer > 0) continue;
            const d = CanvasEngine.Utils.distance(threat, player);
            if (d < minDist) minDist = d;
        }

        let intensity = 0;
        if (minDist < cfg.maxDist) {
            const t = 1 - (minDist - cfg.minDist) / (cfg.maxDist - cfg.minDist);
            intensity = CanvasEngine.Utils.clamp(t, 0, 1);
        }

        this.data.dangerTime += dt;
        const pulse = 1 - cfg.pulseAmount + Math.sin(this.data.dangerTime * cfg.pulseSpeed) * cfg.pulseAmount;
        const opacity = intensity * cfg.maxOpacity * pulse;

        $dangerVignette.style.opacity = opacity.toFixed(3);
    },

    onPause() {
        this.game.showCursor();
        this.game.showMenu('pause');
        this.game.showMenu('pauseOverlay');
    },
    onResume() {
        this.game.hideCursor();
        this.game.hideMenu('pause');
        this.game.hideMenu('pauseOverlay');
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

        $idEvent('gui_mobile_pause', 'click', () => {
            this.game.pause();
        });
    },
}