import config from "./config/config.js";
import mainScene from "./scenes/main.js";

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
        mainScene
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
        if (key === 'p' || key === 'Escape') game.togglePause();
        else if (key === 'r') game.resetScene();
        else if (key === 'f') {
            CanvasEngine.Utils.toggleFullscreen(this.container, 'landscape')
            this.resetJoysticks()
        }
    },

    onPause() {
        this.setCursorVisibility(true);
        this.menu.pause.show()
    },
    onResume() {
        this.setCursorVisibility(false);
        this.menu.pause.hide()
    },

    onCreate() {
        $idEvent('menu_pause_resume', 'click', () => {
            game.resume();
        });

        $idEvent('menu_pause_restart', 'click', () => {
            game.resume();
            game.resetScene();
        });

        $idEvent('menu_pause_quit', 'click', () => {
            window.close();
        });

        $idEvent('gui_game_pause', 'click', () => {
            game.pause();
        });

        $idEvent('menu_pause_options', 'click', () => {
            this.menu.pause.hide();
            this.menu.options.show();
        });

        $idEvent('menu_options_back', 'click', () => {
            this.menu.pause.show();
            this.menu.options.hide();
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

            this.resetJoysticks();
        });

        window.addEventListener("wheel", event => {
            if (event.ctrlKey) {
                event.preventDefault();
            }
        }, {
            passive: false
        });

        if (CanvasEngine.Utils.isMobile()) {
            this._createJoysticks()

            window.addEventListener("resize", event => {
                this.resetJoysticks();
            });
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
})

game.start();