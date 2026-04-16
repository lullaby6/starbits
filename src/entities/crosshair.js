import config from "../config/config.js";

const crosshair = {
    name: 'crosshair',
    x: 0,
    y: 0,
    width: 15,
    height: 15,
    color: 'transparent',
    z: 100,
    originX: 0.5,
    originY: 0.5,

    image: {
        src: config.images.crosshair,
    },

    onUpdate() {
        const input = this.game.input;
        this.x = input.mouseWorldX - this.width / 2;
        this.y = input.mouseWorldY - this.height / 2;
    },
}

export default crosshair;
