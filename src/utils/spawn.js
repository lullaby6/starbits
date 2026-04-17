export function spawnDistance(scene, distance) {
    const cam = scene.game.camera;
    const angle = CanvasEngine.Random.float(0, Math.PI * 2);
    return {
        x: cam.x + Math.cos(angle) * distance,
        y: cam.y + Math.sin(angle) * distance,
        angle,
    };
}

export function spawnMargin(scene, margin) {
    const cam = scene.game.camera;
    const halfW = scene.game.width / 2 / cam.zoom;
    const halfH = scene.game.height / 2 / cam.zoom;

    const side = CanvasEngine.Random.int(0, 3);
    let x, y;
    if (side === 0) {
        x = CanvasEngine.Random.float(cam.x - halfW - margin, cam.x + halfW + margin);
        y = cam.y - halfH - margin;
    } else if (side === 1) {
        x = CanvasEngine.Random.float(cam.x - halfW - margin, cam.x + halfW + margin);
        y = cam.y + halfH + margin;
    } else if (side === 2) {
        x = cam.x - halfW - margin;
        y = CanvasEngine.Random.float(cam.y - halfH - margin, cam.y + halfH + margin);
    } else {
        x = cam.x + halfW + margin;
        y = CanvasEngine.Random.float(cam.y - halfH - margin, cam.y + halfH + margin);
    }

    return { x, y };
}

export function destroyDistance(entity, distance) {
    const target = entity.scene.player ?? entity.scene.game.camera;
    if (CanvasEngine.Utils.distance(entity, target) > distance) {
        entity.destroy();
        return true;
    }
    return false;
}
