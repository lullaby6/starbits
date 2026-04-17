import game from './game.js';

const width = game.width;
const grid = game.worldGrid;

export default {
    width: width * grid,
    height: width * grid,
    minX: -(width * grid) / 2,
    maxX: (width * grid) / 2,
    minY: -(width * grid) / 2,
    maxY: (width * grid) / 2,
}
