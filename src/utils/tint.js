import config from "../config/config.js";

export function getEntityTint(dist) {
    const { min, max } = config.tint.enemy;
    const strength = CanvasEngine.Utils.clamp(1 - (dist - min) / (max - min), 0, 1);
    return strength > 0 ? `rgba(255, 0, 0, ${strength.toFixed(2)})` : null;
}

export function getBulletTint(dist) {
    const { min, max } = config.tint.bullet;
    const strength = CanvasEngine.Utils.clamp(1 - (dist - min) / (max - min), 0, 1);
    return strength > 0 ? `rgba(255, 0, 0, ${strength.toFixed(2)})` : null;
}
