import config from "./config/config.js";
import mainScene from "./scenes/main.js";

import { $id, $idEvent } from "./utils/utils.js";

const $canvasContainer = $id('canvas-container');
const $pauseMenu = $id('menu_pause');

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

    onKeydown({ key }) {
        if (key === 'p' || key === 'Escape') game.togglePause();
        else if (key === 'r') game.resetScene();
        else if (key === 'f') {
            CanvasEngine.Utils.toggleFullscreen($canvasContainer)
        }
    },

    onPause() {
        this.setCursorVisibility(true);
        $pauseMenu.style.display = 'flex';
    },
    onResume() {
        this.setCursorVisibility(false);
        $pauseMenu.style.display = 'none';
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

        window.addEventListener("wheel", event => {
            if (event.ctrlKey) {
                event.preventDefault();
            }
        }, {
            passive: false
        });

        if (CanvasEngine.Utils.isMobile()) {
            this.setupJoystick()

            window.addEventListener("resize", event => {
                this.setupJoystick()
            });
        }
    },
    setupJoystick() {
        console.log('create');

        const windowWidth = window.innerWidth
        const joystickSize = windowWidth / 10

        if (this.data.manager) {
            try {
                this.data.manager.all.forEach(joystick => {
                    joystick.destroy()
                })
            } catch (error) {
                console.log(error);
            }

            try {
                if (this.data.manager) {
                    this.data.manager.destroy()
                }
            } catch (error) {
                console.log(error);
            }
        }

        this.data.manager = nipplejs.create({
            zone: $id('joystick'),
            mode: 'static', // 'static' - 'semi' - 'dynamic'
            multitouch: true,
            maxNumberOfJoysticks: 1,
            size: joystickSize, // default 100
            position: {
                left: '50%',
                bottom: '50%'
            },
            restOpacity: 0.25, // default 0.5
            // color: {
            //     front: 'rgba(255, 255, 255, 255)',
            //     back: 'rgba(255, 255, 255, 255)',
            // }
        });

        this.data.manager.on('move', (event) => {
            if (this._activeScene.onJoystickMove) this._activeScene.onJoystickMove(event)

            this._activeScene.entities.forEach(entity => {
                if (entity.onJoystickMove) entity.onJoystickMove(event)
            })
        });

        this.data.manager.on('end', () => {
            this._activeScene.entities.forEach(entity => {
                if (entity.onJoystickEnd) entity.onJoystickEnd()
            })

            this.setupJoystick()
        });
    },
    onTouchstart() {
        if (this.data.manager && this.data.manager.all.length > 1) {
            this.setupJoystick()
        }
    },
})

game.start();