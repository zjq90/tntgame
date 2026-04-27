class Weapon {
    constructor(canvas, player, terrain) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.player = player;
        this.terrain = terrain;
        
        this.baseDamage = 90;
        this.critChance = 0.1;
        this.critMultiplier = 1.5;
        
        this.isCharging = false;
        this.power = 0;
        this.maxPower = 100;
        this.chargeSpeed = 1.5;
        this.chargeDirection = 1;
        
        this.lastShotTime = 0;
        this.cooldown = 500;
        
        this.currentBullet = null;
        this.isBulletFlying = false;
        
        this.explosions = [];
    }

    startCharging() {
        if (!this.isBulletFlying) {
            this.isCharging = true;
            this.power = 0;
            this.chargeDirection = 1;
        }
    }

    updateCharging() {
        if (!this.isCharging) return;
        
        this.power += this.chargeSpeed * this.chargeDirection;
        
        if (this.power >= this.maxPower) {
            this.power = this.maxPower;
            this.chargeDirection = -1;
        } else if (this.power <= 0) {
            this.power = 0;
            this.chargeDirection = 1;
        }
    }

    fire() {
        if (!this.isCharging) return null;
        
        this.isCharging = false;
        
        const effectivePower = this.maxPower - this.power;
        
        if (effectivePower < 5) {
            return null;
        }
        
        const shootPos = this.player.getShootPosition();
        const velocity = this.player.getVelocity(effectivePower);
        
        const isCrit = Math.random() < this.critChance;
        const damage = isCrit ? Math.floor(this.baseDamage * this.critMultiplier) : this.baseDamage;
        
        this.lastShotTime = Date.now();
        
        return {
            x: shootPos.x,
            y: shootPos.y,
            vx: velocity.vx,
            vy: velocity.vy,
            damage: damage,
            isCrit: isCrit,
            power: effectivePower
        };
    }

    setBullet(bullet) {
        this.currentBullet = bullet;
        this.isBulletFlying = true;
    }

    clearBullet() {
        this.currentBullet = null;
        this.isBulletFlying = false;
    }

    canFire() {
        return !this.isBulletFlying && Date.now() - this.lastShotTime > this.cooldown;
    }

    createExplosion(x, y, damage, isCrit) {
        this.explosions.push({
            x: x,
            y: y,
            radius: 0,
            maxRadius: 60,
            damage: damage,
            isCrit: isCrit,
            alpha: 1,
            stage: 'expanding'
        });
    }

    updateExplosions() {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const exp = this.explosions[i];
            
            if (exp.stage === 'expanding') {
                exp.radius += 4;
                if (exp.radius >= exp.maxRadius) {
                    exp.stage = 'fading';
                }
            } else {
                exp.alpha -= 0.05;
                if (exp.alpha <= 0) {
                    this.explosions.splice(i, 1);
                }
            }
        }
    }

    renderExplosions() {
        const ctx = this.ctx;
        
        for (const exp of this.explosions) {
            ctx.save();
            ctx.globalAlpha = exp.alpha;
            
            const gradient = ctx.createRadialGradient(
                exp.x, exp.y, 0,
                exp.x, exp.y, exp.radius
            );
            
            if (exp.isCrit) {
                gradient.addColorStop(0, '#FFD700');
                gradient.addColorStop(0.3, '#FFA500');
                gradient.addColorStop(0.6, '#FF4500');
                gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
            } else {
                gradient.addColorStop(0, '#FFFFFF');
                gradient.addColorStop(0.3, '#FFEB3B');
                gradient.addColorStop(0.6, '#FF9800');
                gradient.addColorStop(1, 'rgba(255, 152, 0, 0)');
            }
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = exp.isCrit ? '#FFD700' : '#FF5722';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(exp.x, exp.y, exp.radius * 0.8, 0, Math.PI * 2);
            ctx.stroke();
            
            if (exp.isCrit) {
                ctx.fillStyle = '#FFD700';
                ctx.font = 'bold 24px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('暴击!', exp.x, exp.y - exp.radius - 10);
            }
            
            ctx.restore();
        }
    }

    renderTrajectoryPrediction() {
        if (this.isBulletFlying) return;
        
        const ctx = this.ctx;
        const shootPos = this.player.getShootPosition();
        
        let displayPower;
        if (this.isCharging) {
            displayPower = this.maxPower - this.power;
        } else {
            displayPower = 50;
        }
        
        const velocity = this.player.getVelocity(displayPower);
        
        const points = this.calculateTrajectoryPoints(
            shootPos.x, shootPos.y,
            velocity.vx, velocity.vy
        );
        
        this.renderDashedTrajectory(ctx, points);
        this.renderTrajectoryEnd(ctx, points);
    }

    calculateTrajectoryPoints(startX, startY, vx, vy) {
        const points = [];
        const gravity = 0.15;
        const dt = 1;
        
        let x = startX;
        let y = startY;
        let currentVx = vx;
        let currentVy = vy;
        
        points.push({ x, y });
        
        const maxSteps = 500;
        for (let i = 0; i < maxSteps; i++) {
            x += currentVx * dt;
            y += currentVy * dt;
            currentVy += gravity * dt;
            
            if (i % 3 === 0) {
                points.push({ x, y });
            }
            
            if (y > this.canvas.height || x < 0 || x > this.canvas.width) {
                break;
            }
            
            if (this.terrain.checkCollision(x, y)) {
                points.push({ x, y });
                break;
            }
        }
        
        return points;
    }

    renderDashedTrajectory(ctx, points) {
        if (points.length < 2) return;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 8]);
        
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            const progress = i / points.length;
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.7 - progress * 0.5})`;
            ctx.lineTo(points[i].x, points[i].y);
        }
        
        ctx.stroke();
        ctx.restore();
        
        this.renderTrajectoryDots(ctx, points);
    }

    renderTrajectoryDots(ctx, points) {
        ctx.save();
        
        for (let i = 0; i < points.length; i += 3) {
            const point = points[i];
            const progress = i / points.length;
            const alpha = 0.6 - progress * 0.4;
            const radius = 4 - progress * 2;
            
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, Math.max(2, radius), 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    renderTrajectoryEnd(ctx, points) {
        if (points.length < 2) return;
        
        const lastPoint = points[points.length - 1];
        
        ctx.save();
        ctx.fillStyle = 'rgba(255, 87, 34, 0.8)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(lastPoint.x, lastPoint.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();
    }

    getPower() {
        return this.maxPower - this.power;
    }

    getAngle() {
        return this.player.angle;
    }
}

window.Weapon = Weapon;