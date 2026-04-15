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
    cursor: false,
    pixelArt: true,
    title: config.game.title,
    pauseOnBlur: true,
    contextMenu: false,

    camera: {
        x: 0,
        y: 0,
    },

    scenes: [
        startScene,
        gameScene,
    ],

    data: {
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
        if (key === 'p' || key === 'Escape') this.togglePause();
        else if (key === 'r') this.resetScene();
        else if (key === 'f') {
            CanvasEngine.Utils.toggleFullscreen(this.container, 'landscape')

            if (CanvasEngine.Utils.isMobile()) {
                this.resetJoysticks()
            }
        }
    },

    onPause() {
        this.setCursorVisibility(true);
        this.menu.pause.show();
    },
    onResume() {
        this.setCursorVisibility(false);
        this.menu.pause.hide();
        this.menu.options.hide();
    },

    onCreate() {
        this.setupWindow();
        this.setupDom();

        if (CanvasEngine.Utils.isMobile()) {
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

    setupDom() {
        $idEvent('menu_start_options', 'click', () => {
            this.data._optionsFrom = 'start';
            this.menu.start.hide();
            this.menu.options.show();
        });

        $idEvent('menu_options_back', 'click', () => {
            this.menu.options.hide();

            if (this.data._optionsFrom && this.menu[this.data._optionsFrom]) {
                this.menu[this.data._optionsFrom].show();
            }
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
    },
})

game.start();