import { spawnDistance } from "../../utils/spawn.js";

export function spawnCelestial(scene, cfg, createEntity) {
    const pos = spawnDistance(scene, cfg.spawnDistance);
    const cam = scene.game.camera;

    const player = scene.player;
    const targetX = (player ? player.centerX : cam.x) + CanvasEngine.Random.floatSymmetric(cfg.aimJitter);
    const targetY = (player ? player.centerY : cam.y) + CanvasEngine.Random.floatSymmetric(cfg.aimJitter);

    const dirAngle = Math.atan2(targetY - pos.y, targetX - pos.x);
    const speed = CanvasEngine.Random.float(cfg.speedMin, cfg.speedMax);
    const vx = Math.cos(dirAngle) * speed;
    const vy = Math.sin(dirAngle) * speed;
    const rotSpeed = CanvasEngine.Random.float(cfg.rotationSpeedMin, cfg.rotationSpeedMax);

    return scene.addEntity(createEntity(pos.x, pos.y, vx, vy, rotSpeed));
}
