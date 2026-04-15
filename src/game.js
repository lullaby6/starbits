import config from "./config/config.js";
import mainScene from "./scenes/main.js";

import { toggleFullscreen, $id, $idEvent } from "./utils/utils.js";

const $game = $id('game');
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

    scenes: [
        mainScene
    ],

    onKeydown({ key }) {
        if (key === 'p' || key === 'Escape') game.togglePause();
        else if (key === 'r') game.resetScene();
        else if (key === 'f') {
            toggleFullscreen($game)
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
    }
})


game.start();