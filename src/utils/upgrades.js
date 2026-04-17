export default [
    {
        statKey: 'friction', apply: (p, v) => {
            if (p._physicsBody) p._physicsBody.frictionAir = v;
        }
    },
    { statKey: 'speed', apply: (p, v) => p.data.speed = v },
    { statKey: 'bulletSpeed', apply: (p, v) => p.data.bulletSpeed = v },
    { statKey: 'bulletSize', apply: (p, v) => p.data.bulletSize = v },
    { statKey: 'bulletLifetime', apply: (p, v) => p.data.bulletLifetime = v },
    { statKey: 'shotCooldown', apply: (p, v) => p.data.shotCooldown = v },
    { statKey: 'bulletCount', apply: (p, v) => p.data.bulletCount = v },
    { statKey: 'bulletSpread', apply: (p, v) => p.data.bulletSpread = v },
    { statKey: 'bulletBurstCount', apply: (p, v) => p.data.bulletBurstCount = v },
    { statKey: 'bulletBurstDelay', apply: (p, v) => p.data.bulletBurstDelay = v },
    { statKey: 'bulletPiercing', apply: (p, v) => p.data.bulletPiercing = v },
    { statKey: 'recoil', apply: (p, v) => p.data.recoil = v },
];