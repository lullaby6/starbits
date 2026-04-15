import config from "./config/config.js";
import mainScene from "./scenes/main.js";

import { toggleFullscreen, $id, $idEvent } from "./utils/utils.js";

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
            toggleFullscreen($canvasContainer)
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

        window.addEventListener("wheel", event => {
            if (event.ctrlKey) {
                event.preventDefault();
            }
        }, {
            passive: false
        });

        this.data.manager = nipplejs.create({
            zone: $id('joystick'),
            mode: 'static', // 'semi' - 'dynamic'
            size: 150, // default 100
            position: {
                left: '10%',
                bottom: '10%'
            },
            // color: {
            //     front: 'rgba(255, 255, 255, 255)',
            //     back: 'rgba(255, 255, 255, 255)',
            // }
            restOpacity: 0.5, // default 0.5
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
        });
    }
})

game.start();