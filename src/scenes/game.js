import playerEntity from "../entities/player.js";
import { createStars } from "../entities/star.js";
import crosshairEntity from "../entities/crosshair.js";
import { enemies, createEnemy } from "../entities/enemies.js";
import { spawnMeteor } from "../entities/meteor.js";
import config from "../config/config.js";
import Upgrades from "../utils/upgrades.js";

import { $id } from "../utils/utils.js";

const enemiesData = Object.entries(enemies).map(([key, config]) => ({ name: key, ...config }));

const $score = $id('gui_game_score_score');
const $best = $id('gui_game_score_best');
const $dangerVignette = $id('gui_danger_vignette');
const $upgradeBtns = [
    $id('upgrade_btn_0'),
    $id('upgrade_btn_1'),
    $id('upgrade_btn_2'),
];

function clampToMax(value, stat) {
    return stat.upgrade >= 0 ? Math.min(value, stat.max) : Math.max(value, stat.max);
}

function statMaxLevel(stat) {
    return Math.round((stat.max - stat.min) / stat.upgrade);
}

function statValueAtLevel(stat, level) {
    return clampToMax(stat.min + level * stat.upgrade, stat);
}

function formatUpgradeDelta(value) {
    return `+${Math.abs(value)}`;
}

function upgradeWeight(upgrade) {
    return config.stats[upgrade.statKey].weight ?? 100;
}

function weightedRandomPick(pool) {
    const totalWeight = pool.reduce((sum, item) => sum + upgradeWeight(item), 0);
    let roll = CanvasEngine.Random.float(0, totalWeight);
    for (let i = 0; i < pool.length; i++) {
        roll -= upgradeWeight(pool[i]);
        if (roll <= 0) return i;
    }
    return pool.length - 1;
}

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
        'mobile_fullscreen': true,
        'joystick-left': true,
        'joystick-right': true,
        danger_vignette: true,
    },

    data: {
        score: 0,
        maxScore: 0,
        dangerTime: 0,
        elapsedTime: 0,
        nextUpgradeAt: config.player.upgradePerScore,
        upgradeIncrement: config.player.upgradePerScore,
        pendingUpgrades: 0,
        upgradeLevels: Object.fromEntries(Upgrades.map(u => [u.statKey, 0])),
        upgradeChoices: [],

        timers: Object.fromEntries(
            Object.keys(enemies).map(name => [name, 0])
        ),
    },

    gameOver() {
        this.ignorePause = true;
        this.game.showCursor();

        this.game.menu.restart.show();

        const player = this.player;
        if (player) player.destroy();
        this.player = null;

        const crosshair = this.findEntityByName('crosshair');
        if (crosshair) crosshair.destroy();

        if (this.guiScoreTimeout) {
            this.game.clearTimer(this.guiScoreTimeout);
            this.guiScoreTimeout = null;
        }
        this.game.showGui('game_score')

        // this.game.resetScene({
        //     resetCamera: false
        // });
    },

    getSpawnPosition() {
        const cam = this.game.camera;
        const halfW = this.game.width / 2 / cam.zoom;
        const halfH = this.game.height / 2 / cam.zoom;
        const margin = config.spawn.cameraMargin;

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

        this.game.showGui('game_score', 300)

        if (this.guiScoreTimeout) {
            this.game.clearTimer(this.guiScoreTimeout)
        }

        this.guiScoreTimeout = this.game.setTimeout(() => {
            this.game.hideGui('game_score', 300)
            this.guiScoreTimeout = null
        }, 3000)

        while (this.data.score >= this.data.nextUpgradeAt) {
            this.data.pendingUpgrades++;
            this.data.nextUpgradeAt += Math.round(this.data.upgradeIncrement);
            this.data.upgradeIncrement = Math.min(
                this.data.upgradeIncrement * config.player.upgradeScoreGrowth,
                config.player.upgradePerScoreMax
            );
        }
        if (this.data.pendingUpgrades > 0 && !this._upgradeActive) {
            this.showUpgradeMenu();
        }
    },

    getAvailableUpgrades() {
        return Upgrades.filter(u => this.data.upgradeLevels[u.statKey] < statMaxLevel(config.stats[u.statKey]));
    },

    showUpgradeMenu() {
        const available = this.getAvailableUpgrades();
        if (available.length === 0) {
            this.data.pendingUpgrades = 0;
            return;
        }

        const pool = [...available];
        const choices = [];
        const pickCount = Math.min(3, pool.length);
        for (let i = 0; i < pickCount; i++) {
            const idx = weightedRandomPick(pool);
            choices.push(pool.splice(idx, 1)[0]);
        }

        this.data.upgradeChoices = choices;

        for (let i = 0; i < $upgradeBtns.length; i++) {
            const btn = $upgradeBtns[i];
            const choice = choices[i];
            if (choice) {
                const stat = config.stats[choice.statKey];
                const nextLevel = this.data.upgradeLevels[choice.statKey] + 1;
                const maxLevel = statMaxLevel(stat);
                btn.textContent = `${stat.label} ${formatUpgradeDelta(stat.upgrade)} (${nextLevel}/${maxLevel})`;
                btn.style.display = '';
            } else {
                btn.style.display = 'none';
            }
        }

        this._upgradeActive = true;
        this.game.pause();
    },

    applyUpgrade(slot) {
        const choice = this.data.upgradeChoices[slot];
        if (!choice || !this.player) return;

        const stat = config.stats[choice.statKey];
        const newLevel = Math.min(this.data.upgradeLevels[choice.statKey] + 1, statMaxLevel(stat));
        this.data.upgradeLevels[choice.statKey] = newLevel;
        choice.apply(this.player, statValueAtLevel(stat, newLevel));

        this.data.pendingUpgrades = Math.max(0, this.data.pendingUpgrades - 1);
        this.data.upgradeChoices = [];

        this.game.resume();

        if (this.data.pendingUpgrades > 0) {
            this.showUpgradeMenu();
        }
    },

    scheduleMeteorSpawn() {
        const cfg = config.meteors;
        const delay = CanvasEngine.Random.float(cfg.spawnTimeMin, cfg.spawnTimeMax);
        this.meteorTimer = this.game.setTimeout(() => {
            this.meteorTimer = null;
            if (!this.player) return;

            const chance = CanvasEngine.Random.float(cfg.spawnChanceMin, cfg.spawnChanceMax);
            if (Math.random() < chance) {
                const alive = this.countByTag('meteor');
                const remaining = cfg.max - alive;
                if (remaining > 0) {
                    const count = Math.min(
                        remaining,
                        CanvasEngine.Random.int(cfg.spawnCountMin, cfg.spawnCountMax)
                    );
                    for (let i = 0; i < count; i++) spawnMeteor(this);
                }
            }

            this.scheduleMeteorSpawn();
        }, delay);
    },

    onCreate() {
        this.setupDangerVignette();
        this.scheduleMeteorSpawn();

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
            this.player = player;
            this.game.camera.setTarget(player, 5);
        }

        const world = config.world;
        this.game.camera.setBounds(world.minX, world.minY, world.maxX, world.maxY);
    },

    onUpdate(dt) {
        const player = this.player;
        if (!player) return;

        this.data.elapsedTime += dt;

        enemiesData.forEach(enemy => {
            if (enemy.requireScore && this.data.score < enemy.requireScore) return;

            this.data.timers[enemy.name] += dt;

            const scoreAbove = Math.max(0, this.data.score - (enemy.requireScore || 0));
            const interval = Math.max(
                enemy.minSpawnInterval || 1,
                enemy.spawnInterval
                - scoreAbove * config.enemies.spawnSpeedupPerScore
                - this.data.elapsedTime * config.enemies.spawnSpeedupPerSecond
            );

            if (this.data.timers[enemy.name] >= interval) {
                this.data.timers[enemy.name] = 0;

                const totalAlive = this.countByTag('enemy');
                if (totalAlive >= config.enemies.max) return;

                if (enemy.max != null) {
                    const alive = this.countByTag(enemy.name);
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

        let minDist = Infinity;
        const entities = this.entities;
        for (let i = 0; i < entities.length; i++) {
            const entity = entities[i];
            if (!entity.active) continue;
            if (!entity.hasTag('enemy') && !entity.hasTag('enemyBullet')) continue;
            if (entity.data?.dying || (entity.data?.spawnTimer && entity.data.spawnTimer > 0)) continue;
            const distance = CanvasEngine.Utils.distance(entity, player);
            if (distance < minDist) minDist = distance;
        }

        let intensity = 0;
        if (minDist < cfg.maxDist) {
            const progress = 1 - (minDist - cfg.minDist) / (cfg.maxDist - cfg.minDist);
            intensity = CanvasEngine.Utils.clamp(progress, 0, 1);
        }

        this.data.dangerTime += dt;
        const pulse = 1 - cfg.pulseAmount + Math.sin(this.data.dangerTime * cfg.pulseSpeed) * cfg.pulseAmount;
        const opacity = intensity * cfg.maxOpacity * pulse;

        $dangerVignette.style.opacity = opacity.toFixed(3);
    },

    onPause() {
        this.game.showCursor();
        this.game.showMenu('pauseOverlay');
        if (this._upgradeActive) {
            this.game.showMenu('upgrade', 300);
        } else {
            this.game.showMenu('pause');
        }
    },
    onResume() {
        this.game.hideCursor();
        this.game.hideMenu('pauseOverlay');
        if (this._upgradeActive) {
            this.game.hideMenu('upgrade', 300);
            this._upgradeActive = false;
        } else {
            this.game.hideMenu('pause');
        }
    },
}