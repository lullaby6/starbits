import config from "./config/config.js";
import startScene from "./scenes/start.js";
import gameScene from "./scenes/game.js";

import { $id, $idEvent } from "./utils/utils.js";

const windowWidth = window.innerWidth
const joystickSize = windowWidth / 10

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

    scenes: [
        startScene,
        gameScene,
    ],

    data: {
        keys: config.keys,

        options: {
            autoAim: localStorage.getItem('starbits_options_autoAim') || false,
            dangerVignette: localStorage.getItem('starbits_options_dangerVignette') || true,
        },

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
        if (keys.pause.includes(key)) this.togglePause();
        else if (keys.reset.includes(key)) this.resetScene();
        else if (keys.fullscreen.includes(key)) CanvasEngine.Utils.toggleFullscreen(this.container, 'landscape')
    },

    onCreate() {
        this.setupWindow();
        this.setupDom();
        this.adjustCanvasHeight();

        if (CanvasEngine.Utils.isMobile()) {
            this.data.options.autoAim = true;

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
        this.height = newHeight;
        this.canvas.height = newHeight;
        this.ctx.imageSmoothingEnabled = !this.pixelArt;
    },

    setupDom() {
        $idEvent('menu_start_options', 'click', () => {
            this.switchMenu('options', 'start')
        });

        $idEvent('menu_options_back', 'click', () => {
            this.menuBack()
        });

        $idEvent('menu_options_fullscreen', 'click', () => {
            const $span = $id('menu_options_fullscreen_value')

            if ($span.textContent === 'OFF') {
                $span.textContent = 'ON';
                CanvasEngine.Utils.setFullscreen(this.container);
            } else {
                $span.textContent = 'OFF';
                CanvasEngine.Utils.exitFullscreen();
            }

            if (CanvasEngine.Utils.isMobile()) {
                this.resetJoysticks()
            }
        });

        const $autoAimSpam = $id('menu_options_autoaim_value')

        const updateAutoAim = () => {
            if (this.data.options.autoAim) {
                $autoAimSpam.textContent = 'ON';

                if (this._activeScene.name == 'game') this.hideGui('joystick-right')
            } else {
                $autoAimSpam.textContent = 'OFF';

                if (this._activeScene.name == 'game') this.showGui('joystick-right')
            }
        }

        updateAutoAim()

        $idEvent('menu_options_autoaim', 'click', () => {
            this.data.options.autoAim = !this.data.options.autoAim

            localStorage.setItem('starbits_options_autoAim', this.data.options.autoAim)

            updateAutoAim()
        });
    },
})

game.start();