class Bullet {
    constructor(canvas, terrain, startX, startY, vx, vy, damage, isCrit) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.terrain = terrain;
        
        this.x = startX;
        this.y = startY;
        this.vx = vx;
        this.vy = vy;
        
        this.damage = damage;
        this.isCrit = isCrit;
        
        this.radius = 6;
        this.gravity = 0.15;
        this.friction = 0.999;
        
        this.isActive = true;
        this.isHit = false;
        this.hitX = 0;
        this.hitY = 0;
        
        this.trail = [];
        this.maxTrailLength = 30;
        this.trailUpdateCounter = 0;
        this.trailUpdateInterval = 2;
        
        this.rotation = 0;
        this.rotationSpeed = 0.2;
    }

    update() {
        if (!this.isActive) return null;
        
        this.updateTrail();
        
        this.vy += this.gravity;
        
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        this.x += this.vx;
        this.y += this.vy;
        
        this.rotation += this.rotationSpeed;
        
        const collisionResult = this.checkCollision();
        
        if (collisionResult.hit) {
            this.isActive = false;
            this.isHit = true;
            this.hitX = collisionResult.x;
            this.hitY = collisionResult.y;
            
            return {
                hit: true,
                x: this.hitX,
                y: this.hitY,
                damage: this.damage,
                isCrit: this.isCrit,
                hitTerrain: collisionResult.hitTerrain,
                hitPlayer: collisionResult.hitPlayer
            };
        }
        
        if (this.x < -50 || this.x > this.canvas.width + 50 || 
            this.y > this.canvas.height + 100) {
            this.isActive = false;
            return {
                hit: false,
                outOfBounds: true
            };
        }
        
        return null;
    }

    updateTrail() {
        this.trailUpdateCounter++;
        if (this.trailUpdateCounter >= this.trailUpdateInterval) {
            this.trailUpdateCounter = 0;
            this.trail.push({ x: this.x, y: this.y, alpha: 1 });
            
            if (this.trail.length > this.maxTrailLength) {
                this.trail.shift();
            }
        }
        
        for (let i = 0; i < this.trail.length; i++) {
            const progress = i / this.trail.length;
            this.trail[i].alpha = 0.3 + progress * 0.5;
        }
    }

    checkCollision() {
        if (this.terrain.checkCollision(this.x, this.y)) {
            return {
                hit: true,
                x: this.x,
                y: this.y,
                hitTerrain: true,
                hitPlayer: null
            };
        }
        
        if (this.checkPlayerCollision()) {
            return {
                hit: true,
                x: this.x,
                y: this.y,
                hitTerrain: false,
                hitPlayer: true
            };
        }
        
        return { hit: false };
    }

    checkPlayerCollision() {
        if (this.playerToCheck) {
            const dx = this.x - this.playerToCheck.x;
            const dy = this.y - (this.playerToCheck.y + this.playerToCheck.headOffsetY);
            const distance = Math.sqrt(dx * dx + dy * dy);
            const collisionRadius = this.playerToCheck.headRadius + this.radius + 10;
            
            if (distance < collisionRadius) {
                return true;
            }
        }
        return false;
    }

    setTargetPlayer(player) {
        this.playerToCheck = player;
    }

    render() {
        this.renderTrail();
        this.renderBullet();
    }

    renderTrail() {
        const ctx = this.ctx;
        
        for (let i = 0; i < this.trail.length - 1; i++) {
            const current = this.trail[i];
            const next = this.trail[i + 1];
            
            const progress = i / this.trail.length;
            const alpha = 0.1 + progress * 0.3;
            const lineWidth = 2 + progress * 3;
            
            ctx.save();
            ctx.strokeStyle = `rgba(255, 152, 0, ${alpha})`;
            ctx.lineWidth = lineWidth;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(current.x, current.y);
            ctx.lineTo(next.x, next.y);
            ctx.stroke();
            ctx.restore();
        }
    }

    renderBullet() {
        const ctx = this.ctx;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        const glowRadius = this.radius * 2;
        const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, glowRadius);
        glowGradient.addColorStop(0, 'rgba(255, 235, 59, 0.6)');
        glowGradient.addColorStop(0.5, 'rgba(255, 152, 0, 0.3)');
        glowGradient.addColorStop(1, 'rgba(255, 87, 34, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(0, 0, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        const bulletGradient = ctx.createRadialGradient(-2, -2, 0, 0, 0, this.radius);
        bulletGradient.addColorStop(0, '#FFEB3B');
        bulletGradient.addColorStop(0.5, '#FF9800');
        bulletGradient.addColorStop(1, '#F57C00');
        
        ctx.fillStyle = bulletGradient;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#E65100';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.beginPath();
        ctx.arc(-1, -1, this.radius * 0.4, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.isCrit) {
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('★', 0, -this.radius - 5);
        }
        
        ctx.restore();
    }

    getPosition() {
        return { x: this.x, y: this.y };
    }

    getVelocity() {
        return { vx: this.vx, vy: this.vy };
    }
}

window.Bullet = Bullet;