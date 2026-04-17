import config from "../config/config.js";

export function spawnDestroyParticles(scene, x, y, extras = {}) {
    const t = config.particles.destroy;

    for (let i = 0; i < t.count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = CanvasEngine.Random.float(t.speedMin, t.speedMax);
        const size = CanvasEngine.Random.float(t.sizeMin, t.sizeMax);

        CanvasEngine.Particles.spawn(scene, {
            x: x + (Math.random() - 0.5) * t.jitter,
            y: y + (Math.random() - 0.5) * t.jitter,
            size,
            color: t.color,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            drag: t.drag,
            angularVelocity: CanvasEngine.Random.float(-t.maxAngular, t.maxAngular),
            lifetime: CanvasEngine.Random.float(t.lifetimeMin, t.lifetimeMax),
            scaleEnd: t.scaleEnd,
            alphaEnd: t.alphaEnd,
            rotation: Math.random() * Math.PI * 2,
            z: t.z,
            alpha: t.alpha,
            ...extras,
        });
    }
}

export function spawnShotParticles(scene, x, y, rotation, size, extras = {}) {
    const t = config.particles.shot;
    const faceX = Math.cos(rotation);
    const faceY = Math.sin(rotation);
    const spawnX = x + faceX * size * t.offset;
    const spawnY = y + faceY * size * t.offset;

    for (let i = 0; i < t.count; i++) {
        const angle = rotation + (Math.random() - 0.5) * t.spread;
        const speed = CanvasEngine.Random.float(t.speedMin, t.speedMax);
        const sz = CanvasEngine.Random.float(t.sizeMin, t.sizeMax);

        CanvasEngine.Particles.spawn(scene, {
            x: spawnX + (Math.random() - 0.5) * t.jitter,
            y: spawnY + (Math.random() - 0.5) * t.jitter,
            size: sz,
            color: t.color,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            drag: t.drag,
            angularVelocity: CanvasEngine.Random.float(-t.maxAngular, t.maxAngular),
            lifetime: CanvasEngine.Random.float(t.lifetimeMin, t.lifetimeMax),
            scaleEnd: t.scaleEnd,
            alphaEnd: t.alphaEnd,
            rotation: Math.random() * Math.PI * 2,
            z: t.z,
            alpha: t.alpha,
            ...extras,
        });
    }
}

export function spawnThrustParticles(scene, x, y, rotation, size, dirX, dirY, extras = {}) {
    const t = config.particles.thrust;
    const faceX = Math.cos(rotation);
    const faceY = Math.sin(rotation);
    const spawnX = x - faceX * size * t.offset;
    const spawnY = y - faceY * size * t.offset;
    const baseAngle = Math.atan2(-dirY, -dirX);

    for (let i = 0; i < t.count; i++) {
        const angle = baseAngle + (Math.random() - 0.5) * t.spread;
        const speed = CanvasEngine.Random.float(t.speedMin, t.speedMax);
        const sz = CanvasEngine.Random.float(t.sizeMin, t.sizeMax);

        CanvasEngine.Particles.spawn(scene, {
            x: spawnX + (Math.random() - 0.5) * t.jitter,
            y: spawnY + (Math.random() - 0.5) * t.jitter,
            size: sz,
            color: t.color,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            drag: t.drag,
            angularVelocity: CanvasEngine.Random.float(-t.maxAngular, t.maxAngular),
            lifetime: CanvasEngine.Random.float(t.lifetimeMin, t.lifetimeMax),
            scaleEnd: t.scaleEnd,
            alphaEnd: t.alphaEnd,
            rotation: Math.random() * Math.PI * 2,
            z: t.z,
            alpha: t.alpha,
            ...extras,
        });
    }
}

export function spawnBulletTrailParticle(scene, x, y, rotation, extras = {}) {
    const t = config.particles.bulletsTrail;

    return CanvasEngine.Particles.spawn(scene, {
        x,
        y,
        size: t.size,
        color: t.color,
        lifetime: t.lifetime,
        scaleEnd: t.scaleEnd,
        alphaEnd: t.alphaEnd,
        z: t.z,
        rotation,
        alpha: t.alpha,
        ...extras,
    });
}
