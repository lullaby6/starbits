import { createStars } from "../entities/star.js";
import { $idEvent } from "../utils/utils.js";

export default {
    name: 'start',
    ignorePause: true,

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
        this.game.setCursorVisibility(true);

        $idEvent('menu_start_start', 'click', () => {
            this.game.changeScene('main');
        });

        $idEvent('menu_start_options', 'click', () => {
            this.game.menu.start.hide();
            this.game.menu.options.show();
        });

        $idEvent('menu_start_quit', 'click', () => {
            window.close();
        });
    },
}