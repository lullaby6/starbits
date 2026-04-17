export function spawnHole(scene, cfg, createEntity) {
    const cam = scene.game.camera;
    const angle = CanvasEngine.Random.float(0, Math.PI * 2);
    const dist = cfg.spawnDistance;
    const x = cam.x + Math.cos(angle) * dist;
    const y = cam.y + Math.sin(angle) * dist;

    const player = scene.player;
    const targetX = (player ? player.centerX : cam.x) + CanvasEngine.Random.floatSymmetric(cfg.aimJitter);
    const targetY = (player ? player.centerY : cam.y) + CanvasEngine.Random.floatSymmetric(cfg.aimJitter);

    const dirAngle = Math.atan2(targetY - y, targetX - x);
    const speed = CanvasEngine.Random.float(cfg.speedMin, cfg.speedMax);
    const vx = Math.cos(dirAngle) * speed;
    const vy = Math.sin(dirAngle) * speed;
    const rotSpeed = CanvasEngine.Random.float(cfg.rotationSpeedMin, cfg.rotationSpeedMax);

    return scene.addEntity(createEntity(x, y, vx, vy, rotSpeed));
}
