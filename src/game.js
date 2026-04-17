import config from "./config/config.js";
import startScene from "./scenes/start.js";
import gameScene from "./scenes/game.js";

import { $id } from "./utils/utils.js";

const windowWidth = window.innerWidth
const joystickSize = windowWidth / 10

const OPTION_STORAGE_PREFIX = 'starbits_options_';

const OPTIONS = {
    autoAim: {
        default: true,
        onChange(value) {
            const scene = this._activeScene;
            if (scene?.name !== 'game') return;
            const crosshair = scene.findEntityByName('crosshair');
            if (value) {
                this.hideGui('joystick-right');
                if (crosshair) crosshair.active = false;
            } else {
                this.showGui('joystick-right');
                if (crosshair) crosshair.active = true;
            }
        },
    },
    dangerVignette: {
        default: true,
        onChange(value) {
            if (this._activeScene?.name !== 'game') return;
            value ? this.showGui('danger_vignette') : this.hideGui('danger_vignette');
        },
    },
    bloom: {
        default: true,
        onChange(value) {
            if (this.bloom) this.bloom.enabled = value;
        },
    },
    particles: {
        default: true,
        onChange(value) {
            value ? this.enableParticles() : this.disableParticles();
        },
    },
    cameraShake: {
        default: true
    }
};

function loadOption(name, def) {
    const stored = localStorage.getItem(OPTION_STORAGE_PREFIX + name);
    if (stored === null) return def;
    return stored === 'true';
}

const MENU_ACTIONS = {
    navigate(el) { this.switchMenu(el.dataset.target, el.dataset.from); },
    back() { this.menuBack(); },
    resume() { this.resume(); },
    pause() { this.pause(); },
    resetScene() { this.resetScene(); },
    changeScene(el) { this.changeScene(el.dataset.scene); },
    toggleOption(el) { this.toggleOption(el.dataset.option); },
    toggleFullscreen() { this.toggleFullscreenOption(); },
    set_fullscreen() { this.toggleFullscreenOption(); },
    exit_fullscreen() { this.toggleFullscreenOption(); },
    quit() { window.close(); },
    selectUpgrade(el) {
        const scene = this._activeScene;
        if (scene?.applyUpgrade) scene.applyUpgrade(parseInt(el.dataset.upgradeSlot));
    },
};

const game = new CanvasEngine.Game({
    canvas: 'canvas',
    backgroundColor: config.colors.background,
    width: config.game.width,
    height: config.game.height,
    fps: config.game.fps,
    limitFPS: true,
    physics: {},
    pixelArt: true,
    title: config.game.title,
    pauseOnBlur: true,
    contextMenu: false,
    bloom: config.game.bloom,

    scenes: [
        startScene,
        gameScene,
    ],

    data: {
        keys: config.keys,

        options: Object.fromEntries(
            Object.entries(OPTIONS).map(([name, opt]) => [name, loadOption(name, opt.default)])
        ),

        joysticks: {
            Left: {
                zone: $id('joystick-left'),
                mode: 'static', // 'static' - 'semi' - 'dynamic'
                multitouch: true,
                maxNumberOfJoysticks: 1,
                size: joystickSize, // default 100
                position: {
                    left: '50%',
                    bottom: '50%'
                },
            },
            Right: {
                zone: $id('joystick-right'),
                mode: 'static', // 'static' - 'semi' - 'dynamic'
                multitouch: true,
                maxNumberOfJoysticks: 1,
                size: joystickSize, // default 100
                position: {
                    left: '50%',
                    bottom: '50%'
                },
            }
        }
    },

    onKeydown({ key }) {
        const keys = this.data.keys;
        if (keys.pause.includes(key)) {
            if (this._activeScene?._upgradeActive) return;
            if (this.paused && this._isInSubMenu()) this.menuBack();
            else this.togglePause();
        }
        else if (keys.reset.includes(key)) this.resetScene();
        else if (keys.fullscreen.includes(key)) CanvasEngine.Utils.toggleFullscreen(this.container, 'landscape')
    },

    _isInSubMenu() {
        for (const [name, el] of Object.entries(this.menu)) {
            if (name === 'pause' || name === 'pauseOverlay') continue;
            if (el.style.display && el.style.display !== 'none') return true;
        }
        return false;
    },

    onCreate() {
        this.setupWindow();
        this.setupDom();
        this.adjustCanvasHeight();

        if (CanvasEngine.Utils.isMobile()) {
            if (localStorage.getItem(OPTION_STORAGE_PREFIX + 'autoAim') !== 'false') {
                this.setOption('autoAim', true)
            }

            this._createJoysticks()

            window.addEventListener("resize", event => {
                if (CanvasEngine.Utils.isMobile()) {
                    this.gui['joystick-left'].style.pointerEvents = 'auto'
                    this.gui['joystick-right'].style.pointerEvents = 'auto'

                    this.resetJoysticks()
                } else {
                    this.gui['joystick-left'].style.pointerEvents = 'none'
                    this.gui['joystick-right'].style.pointerEvents = 'none'
                }
            });
        } else {
            this.gui['joystick-left'].style.pointerEvents = 'none'
            this.gui['joystick-right'].style.pointerEvents = 'none'
        }
    },

    _createJoysticks() {
        this.data._joysticks = {}

        Object.entries(this.data.joysticks).forEach(([name, config]) => {
            this.data._joysticks[name] = nipplejs.create(config);

            this.data._joysticks[name].on('move', event => {
                if (this._activeScene[`on${name}JoystickMove`]) this._activeScene[`on${name}JoystickMove`](event);

                this._activeScene.entities.forEach(entity => {
                    if (entity[`on${name}JoystickMove`]) entity[`on${name}JoystickMove`](event);
                })
            });

            this.data._joysticks[name].on('end', () => {
                this._activeScene.entities.forEach(entity => {
                    if (entity[`on${name}JoystickEnd`]) entity[`on${name}JoystickEnd`]();
                })

                this._destroyJoysticks();
                this._createJoysticks()
            });
        })
    },

    _destroyJoysticks() {
        if (this.data._joysticks && Object.keys(this.data._joysticks).length > 0) {
            Object.values(this.data._joysticks).forEach(joystick => {
                try {
                    joystick.all.forEach(joystick => {
                        joystick.destroy();
                    })
                } catch (error) {
                    console.log(error);
                }

                try {
                    joystick.destroy();
                } catch (error) {
                    console.log(error);
                }
            })
        }
    },

    resetJoysticks() {
        const windowWidth = window.innerWidth
        const joystickSize = windowWidth / 10

        this.data.joysticks.Left.size = joystickSize;
        this.data.joysticks.Right.size = joystickSize;

        this._destroyJoysticks();
        this._createJoysticks()
    },

    setupWindow() {
        window.addEventListener("wheel", event => {
            if (event.ctrlKey) {
                event.preventDefault();
            }
        }, {
            passive: false
        });

        window.addEventListener("resize", () => {
            this.adjustCanvasHeight();
        });

        document.addEventListener('fullscreenchange', () => {
            this.adjustCanvasHeight();

            const isFs = CanvasEngine.Utils.isFullscreen();
            if (isFs) {
                this.resetCanvasSize();
            }

            this.setOptionDisplay('fullscreen', isFs);
            this.updateFullscreenButtons(isFs);
        });

        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', () => {
                button.blur()
            })
        })

        // window.addEventListener('touchstart', event => {
        //     event.preventDefault();
        // }, { passive: false });

        // window.addEventListener('touchmove', event => {
        //     event.preventDefault();
        // }, { passive: false });

        // don't delete:
        // window.addEventListener('contextmenu', event => {
        //     event.preventDefault()
        // });

        // window.addEventListener('keydown', event => {
        //     if (
        //         event.key === 'F12' ||
        //         (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'i') ||
        //         (event.ctrlKey && event.key.toLowerCase() === 'u')
        //     ) {
        //         event.preventDefault()
        //     }
        // })
    },

    adjustCanvasHeight() {
        if (!CanvasEngine.Utils.isLandscape()) return;

        const windowAspect = window.innerWidth / window.innerHeight;
        const gameAspect = config.game.width / config.game.height;
        if (Math.abs(windowAspect - gameAspect) < 0.0001) return;

        const newHeight = config.game.width / windowAspect;
        this.renderer.setSize(this.width, newHeight);
        this.height = newHeight;
    },

    resetCanvasSize() {
        this.width = config.game.width;
        this.height = config.game.height;
        this.renderer.setSize(config.game.width, config.game.height);
    },

    setOptionDisplay(name, value) {
        this.container.querySelectorAll(`[data-option-value="${name}"]`).forEach(el => {
            el.textContent = value ? 'ON' : 'OFF';
        });
    },

    setOption(name, value) {
        this.data.options[name] = value;
        localStorage.setItem(OPTION_STORAGE_PREFIX + name, value);
        this.setOptionDisplay(name, value);

        const opt = OPTIONS[name];
        if (opt?.onChange) opt.onChange.call(this, value);
    },

    toggleOption(name) {
        this.setOption(name, !this.data.options[name]);
    },

    toggleFullscreenOption() {
        if (CanvasEngine.Utils.isFullscreen()) {
            CanvasEngine.Utils.exitFullscreen();
        } else {
            CanvasEngine.Utils.setFullscreen(this.container);
        }
        if (CanvasEngine.Utils.isMobile()) this.resetJoysticks();
    },

    updateFullscreenButtons(isFullscreen) {
        const setBtn = this.container.querySelector('[data-action="set_fullscreen"]');
        const exitBtn = this.container.querySelector('[data-action="exit_fullscreen"]');
        if (setBtn) setBtn.classList.toggle('hidden', isFullscreen);
        if (exitBtn) exitBtn.classList.toggle('hidden', !isFullscreen);
    },

    setupDom() {
        this.container.addEventListener('click', event => {
            const el = event.target.closest('[data-action]');
            if (!el || !this.container.contains(el)) return;
            const handler = MENU_ACTIONS[el.dataset.action];
            if (handler) handler.call(this, el);
        });

        Object.keys(OPTIONS).forEach(name => this.setOption(name, this.data.options[name]));
        this.setOptionDisplay('fullscreen', CanvasEngine.Utils.isFullscreen());
    },

    switchMenu(menu, from, duration, easing) {
        this.constructor.prototype.switchMenu.call(this, menu, from, duration, easing);
        if (this.paused && this.menu.pauseOverlay) {
            this.menu.pauseOverlay.show();
        }
    },
    shakeCamera(intensity, duration) {
        if (!this.data.options.cameraShake) return;
        this.camera.shake(intensity, duration);
    }
})

game.start();