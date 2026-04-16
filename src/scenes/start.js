import { createStars } from "../entities/star.js";
import { $idEvent } from "../utils/utils.js";

export default {
    name: 'start',
    ignorePause: true,
    cursor: true,

    entities: [
        ...createStars(),
    ],

    menu: {
        start: true,
    },

    onCreate() {
        this.setupDom();
    },

    setupDom() {
        $idEvent('menu_start_start', 'click', () => {
            this.game.changeScene('game');
        });

        $idEvent('menu_start_options', 'click', () => {
            this.game.switchMenu('options')
        });

        $idEvent('menu_start_quit', 'click', () => {
            window.close();
        });
    },
}