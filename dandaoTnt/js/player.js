class Player {
    constructor(canvas, terrain, isPlayer, x, gender = 'male') {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.terrain = terrain;
        this.isPlayer = isPlayer;
        this.gender = gender;
        
        this.maxHealth = 1000;
        this.health = this.maxHealth;
        
        this.baseX = x;
        this.x = x;
        this.y = terrain.getHeightAt(x);
        
        this.angle = isPlayer ? 45 : 135;
        this.minAngle = isPlayer ? 0 : 90;
        this.maxAngle = isPlayer ? 90 : 180;
        
        this.headRadius = 25;
        this.bodyHeight = 30;
        this.headOffsetY = -this.headRadius - this.bodyHeight;
        
        this.aiming = false;
        this.power = 0;
        
        this.isHit = false;
        this.hitAnimationFrame = 0;
        this.hitAnimationDuration = 30;
        
        this.updatePosition();
    }

    updatePosition() {
        this.y = this.terrain.getHeightAt(this.x);
    }

    setAngle(angle) {
        this.angle = Math.max(this.minAngle, Math.min(this.maxAngle, angle));
    }

    setX(x) {
        this.x = Math.max(50, Math.min(this.canvas.width - 50, x));
        this.updatePosition();
    }

    takeDamage(damage, isCrit = false) {
        this.health = Math.max(0, this.health - damage);
        this.isHit = true;
        this.hitAnimationFrame = 0;
        
        return this.health <= 0;
    }

    updateHitAnimation() {
        if (this.isHit) {
            this.hitAnimationFrame++;
            if (this.hitAnimationFrame >= this.hitAnimationDuration) {
                this.isHit = false;
            }
        }
    }

    getShootPosition() {
        const headCenterY = this.y + this.headOffsetY;
        const angleRad = (this.angle * Math.PI) / 180;
        
        const gunLength = 35;
        const startX = this.x + Math.cos(angleRad) * gunLength;
        const startY = headCenterY - Math.sin(angleRad) * gunLength;
        
        return { x: startX, y: startY };
    }

    getVelocity(power) {
        const angleRad = (this.angle * Math.PI) / 180;
        const maxVelocity = 25;
        const velocity = maxVelocity * (power / 100);
        
        const vx = Math.cos(angleRad) * velocity;
        const vy = -Math.sin(angleRad) * velocity;
        
        return { vx, vy };
    }

    render() {
        const ctx = this.ctx;
        const headCenterY = this.y + this.headOffsetY;
        
        let offsetX = 0;
        let offsetY = 0;
        if (this.isHit) {
            offsetX = (Math.random() - 0.5) * 8;
            offsetY = (Math.random() - 0.5) * 8;
        }
        
        const renderX = this.x + offsetX;
        const renderY = this.y + offsetY;
        const renderHeadY = headCenterY + offsetY;
        
        this.renderBody(renderX, renderY);
        this.renderHead(renderX, renderHeadY);
        this.renderGun(renderX, renderHeadY);
        this.renderHealthBar(renderX, renderHeadY);
    }

    renderBody(x, y) {
        const ctx = this.ctx;
        
        ctx.save();
        
        if (this.gender === 'male') {
            ctx.fillStyle = '#2196F3';
        } else {
            ctx.fillStyle = '#E91E63';
        }
        
        ctx.beginPath();
        ctx.moveTo(x - 18, y);
        ctx.lineTo(x - 20, y - this.bodyHeight * 0.7);
        ctx.quadraticCurveTo(x, y - this.bodyHeight * 0.9, x + 20, y - this.bodyHeight * 0.7);
        ctx.lineTo(x + 18, y);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#1565C0';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.restore();
    }

    renderHead(x, y) {
        const ctx = this.ctx;
        
        ctx.save();
        
        ctx.beginPath();
        ctx.arc(x, y, this.headRadius, 0, Math.PI * 2);
        
        if (this.gender === 'male') {
            ctx.fillStyle = '#FFE0B2';
        } else {
            ctx.fillStyle = '#FFCCBC';
        }
        ctx.fill();
        
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        this.renderHair(x, y);
        this.renderFace(x, y);
        this.renderGenderFeatures(x, y);
        
        ctx.restore();
    }

    renderHair(x, y) {
        const ctx = this.ctx;
        
        if (this.gender === 'male') {
            ctx.fillStyle = '#4E342E';
            ctx.beginPath();
            ctx.arc(x, y - 5, this.headRadius - 2, Math.PI, 2 * Math.PI);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(x - this.headRadius + 5, y - 5);
            ctx.lineTo(x - this.headRadius + 8, y - this.headRadius);
            ctx.lineTo(x + this.headRadius - 8, y - this.headRadius);
            ctx.lineTo(x + this.headRadius - 5, y - 5);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.fillStyle = '#7B1FA2';
            ctx.beginPath();
            ctx.arc(x, y - 3, this.headRadius, Math.PI, 2 * Math.PI);
            ctx.fill();
            
            ctx.beginPath();
            ctx.moveTo(x + this.headRadius - 5, y - 5);
            ctx.quadraticCurveTo(x + this.headRadius + 10, y + 10, x + this.headRadius - 5, y + 20);
            ctx.quadraticCurveTo(x + this.headRadius + 5, y + 35, x + this.headRadius - 10, y + 50);
            ctx.lineWidth = 8;
            ctx.strokeStyle = '#7B1FA2';
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(x - this.headRadius + 5, y - 5);
            ctx.quadraticCurveTo(x - this.headRadius - 10, y + 10, x - this.headRadius - 5, y + 20);
            ctx.quadraticCurveTo(x - this.headRadius + 5, y + 35, x - this.headRadius + 10, y + 50);
            ctx.stroke();
        }
    }

    renderFace(x, y) {
        const ctx = this.ctx;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(x - 8, y - 3, 6, 7, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 8, y - 3, 6, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        ctx.fillStyle = '#333';
        
        let eyeOffsetX;
        if (this.isPlayer) {
            const angleFactor = (this.angle - 45) / 45;
            eyeOffsetX = 2 + angleFactor * 3;
        } else {
            const angleFactor = (this.angle - 135) / 45;
            eyeOffsetX = -2 - angleFactor * 3;
        }
        
        const clampedOffsetX = Math.max(-5, Math.min(5, eyeOffsetX));
        
        ctx.beginPath();
        ctx.arc(x - 8 + clampedOffsetX, y - 3, 3, 0, Math.PI * 2);
        ctx.arc(x + 8 + clampedOffsetX, y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(x - 8 + clampedOffsetX + 1, y - 4, 1, 0, Math.PI * 2);
        ctx.arc(x + 8 + clampedOffsetX + 1, y - 4, 1, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#FF5722';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        if (this.isPlayer) {
            ctx.arc(x, y + 10, 5, 0, Math.PI);
        } else {
            ctx.arc(x, y + 10, 5, 0, Math.PI);
        }
        ctx.stroke();
        
        ctx.strokeStyle = '#5D4037';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 12, y - 12);
        ctx.quadraticCurveTo(x - 8, y - 15, x - 4, y - 12);
        ctx.moveTo(x + 4, y - 12);
        ctx.quadraticCurveTo(x + 8, y - 15, x + 12, y - 12);
        ctx.stroke();
    }

    renderGenderFeatures(x, y) {
        const ctx = this.ctx;
        
        if (this.gender === 'male') {
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(x - 18, y + 2, 3, 0, Math.PI * 2);
            ctx.arc(x + 18, y + 2, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = '#8D6E63';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(x, y + 5, 8, 0.2, Math.PI - 0.2);
            ctx.stroke();
        } else {
            ctx.fillStyle = '#FFCDD2';
            ctx.beginPath();
            ctx.ellipse(x - 18, y + 5, 5, 3, 0, 0, Math.PI * 2);
            ctx.ellipse(x + 18, y + 5, 5, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#E91E63';
            ctx.beginPath();
            ctx.moveTo(x - 8, y + 12);
            ctx.lineTo(x, y + 18);
            ctx.lineTo(x + 8, y + 12);
            ctx.closePath();
            ctx.fill();
        }
    }

    renderGun(x, y) {
        const ctx = this.ctx;
        const angleRad = (this.angle * Math.PI) / 180;
        
        ctx.save();
        
        ctx.fillStyle = '#424242';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = '#212121';
        ctx.lineWidth = 1;
        ctx.stroke();
        
        const gunLength = 35;
        const gunWidth = 12;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(-angleRad);
        
        ctx.fillStyle = '#616161';
        ctx.fillRect(0, -gunWidth / 2, gunLength, gunWidth);
        
        ctx.strokeStyle = '#424242';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, -gunWidth / 2, gunLength, gunWidth);
        
        ctx.fillStyle = '#9E9E9E';
        ctx.fillRect(5, -gunWidth / 2 + 2, gunLength - 10, gunWidth - 4);
        
        ctx.restore();
        ctx.restore();
    }

    renderHealthBar(x, y) {
        const ctx = this.ctx;
        const barWidth = 60;
        const barHeight = 8;
        const barX = x - barWidth / 2;
        const barY = y - this.headRadius - 25;
        
        const healthPercent = this.health / this.maxHealth;
        
        ctx.fillStyle = '#333';
        ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
        
        ctx.fillStyle = '#555';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        let healthColor;
        if (healthPercent > 0.6) {
            healthColor = '#4CAF50';
        } else if (healthPercent > 0.3) {
            healthColor = '#FF9800';
        } else {
            healthColor = '#F44336';
        }
        
        ctx.fillStyle = healthColor;
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);
        
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `${Math.round(this.health)}/${this.maxHealth}`,
            x,
            barY + barHeight + 12
        );
    }
}

window.Player = Player;