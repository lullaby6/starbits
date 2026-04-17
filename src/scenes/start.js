import { createStars } from "../entities/star.js";

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

    gui: {
        version: true,
    },
}
