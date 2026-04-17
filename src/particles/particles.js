import config from "../config/config.js";

export function spawnDestroyParticles(scene, x, y, extras = {}) {
    const cfg = config.particles.destroy;

    for (let i = 0; i < cfg.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = CanvasEngine.Random.float(cfg.speedMin, cfg.speedMax);
        const size = CanvasEngine.Random.float(cfg.sizeMin, cfg.sizeMax);

        CanvasEngine.Particles.spawn(scene, {
            x: x + (Math.random() - 0.5) * cfg.jitter,
            y: y + (Math.random() - 0.5) * cfg.jitter,
            size,
            color: cfg.color,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            drag: cfg.drag,
            angularVelocity: CanvasEngine.Random.float(-cfg.maxAngular, cfg.maxAngular),
            lifetime: CanvasEngine.Random.float(cfg.lifetimeMin, cfg.lifetimeMax),
            scaleEnd: cfg.scaleEnd,
            alphaEnd: cfg.alphaEnd,
            rotation: Math.random() * Math.PI * 2,
            z: cfg.z,
            alpha: cfg.alpha,
            ...extras,
        });
    }
}

export function spawnShotParticles(scene, x, y, rotation, size, extras = {}) {
    const cfg = config.particles.shot;
    const faceX = Math.cos(rotation);
    const faceY = Math.sin(rotation);
    const spawnX = x + faceX * size * cfg.offset;
    const spawnY = y + faceY * size * cfg.offset;

    for (let i = 0; i < cfg.count; i++) {
        const angle = rotation + (Math.random() - 0.5) * cfg.spread;
        const speed = CanvasEngine.Random.float(cfg.speedMin, cfg.speedMax);
        const sz = CanvasEngine.Random.float(cfg.sizeMin, cfg.sizeMax);

        CanvasEngine.Particles.spawn(scene, {
            x: spawnX + (Math.random() - 0.5) * cfg.jitter,
            y: spawnY + (Math.random() - 0.5) * cfg.jitter,
            size: sz,
            color: cfg.color,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            drag: cfg.drag,
            angularVelocity: CanvasEngine.Random.float(-cfg.maxAngular, cfg.maxAngular),
            lifetime: CanvasEngine.Random.float(cfg.lifetimeMin, cfg.lifetimeMax),
            scaleEnd: cfg.scaleEnd,
            alphaEnd: cfg.alphaEnd,
            rotation: Math.random() * Math.PI * 2,
            z: cfg.z,
            alpha: cfg.alpha,
            ...extras,
        });
    }
}

export function spawnThrustParticles(scene, x, y, rotation, size, dirX, dirY, extras = {}) {
    const cfg = config.particles.thrust;
    const faceX = Math.cos(rotation);
    const faceY = Math.sin(rotation);
    const spawnX = x - faceX * size * cfg.offset;
    const spawnY = y - faceY * size * cfg.offset;
    const baseAngle = Math.atan2(-dirY, -dirX);

    for (let i = 0; i < cfg.count; i++) {
        const angle = baseAngle + (Math.random() - 0.5) * cfg.spread;
        const speed = CanvasEngine.Random.float(cfg.speedMin, cfg.speedMax);
        const sz = CanvasEngine.Random.float(cfg.sizeMin, cfg.sizeMax);

        CanvasEngine.Particles.spawn(scene, {
            x: spawnX + (Math.random() - 0.5) * cfg.jitter,
            y: spawnY + (Math.random() - 0.5) * cfg.jitter,
            size: sz,
            color: cfg.color,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            drag: cfg.drag,
            angularVelocity: CanvasEngine.Random.float(-cfg.maxAngular, cfg.maxAngular),
            lifetime: CanvasEngine.Random.float(cfg.lifetimeMin, cfg.lifetimeMax),
            scaleEnd: cfg.scaleEnd,
            alphaEnd: cfg.alphaEnd,
            rotation: Math.random() * Math.PI * 2,
            z: cfg.z,
            alpha: cfg.alpha,
            ...extras,
        });
    }
}

export function spawnBulletTrailParticle(scene, x, y, rotation, extras = {}) {
    const cfg = config.particles.bulletsTrail;

    return CanvasEngine.Particles.spawn(scene, {
        x,
        y,
        size: cfg.size,
        color: cfg.color,
        lifetime: cfg.lifetime,
        scaleEnd: cfg.scaleEnd,
        alphaEnd: cfg.alphaEnd,
        z: cfg.z,
        rotation,
        alpha: cfg.alpha,
        ...extras,
    });
}
