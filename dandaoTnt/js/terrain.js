class Terrain {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        this.terrainPoints = [];
        this.baseHeight = this.height * 0.6;
        
        this.generateTerrain();
    }

    generateTerrain() {
        this.terrainPoints = [];
        
        const points = [];
        const iterations = 8;
        const initialRange = 300;
        const decay = 0.65;
        
        points.push({ x: 0, y: this.baseHeight });
        points.push({ x: this.width, y: this.baseHeight });
        
        for (let i = 0; i < iterations; i++) {
            const newPoints = [];
            for (let j = 0; j < points.length - 1; j++) {
                const p1 = points[j];
                const p2 = points[j + 1];
                
                const midX = (p1.x + p2.x) / 2;
                const midY = (p1.y + p2.y) / 2;
                
                const displacement = (Math.random() - 0.5) * initialRange * Math.pow(decay, i);
                
                newPoints.push(p1);
                newPoints.push({
                    x: midX,
                    y: Math.max(this.height * 0.3, Math.min(this.height * 0.9, midY + displacement))
                });
            }
            newPoints.push(points[points.length - 1]);
            points.length = 0;
            points.push(...newPoints);
        }
        
        for (let x = 0; x <= this.width; x++) {
            let closestIndex = 0;
            let minDist = Infinity;
            
            for (let i = 0; i < points.length; i++) {
                const dist = Math.abs(points[i].x - x);
                if (dist < minDist) {
                    minDist = dist;
                    closestIndex = i;
                }
            }
            
            let y;
            if (closestIndex === 0) {
                y = points[0].y;
            } else if (closestIndex === points.length - 1) {
                y = points[points.length - 1].y;
            } else {
                const pPrev = points[closestIndex - 1];
                const pCurr = points[closestIndex];
                const pNext = points[closestIndex + 1];
                
                if (x <= pCurr.x) {
                    const t = (x - pPrev.x) / (pCurr.x - pPrev.x);
                    y = pPrev.y + (pCurr.y - pPrev.y) * t;
                } else {
                    const t = (x - pCurr.x) / (pNext.x - pCurr.x);
                    y = pCurr.y + (pNext.y - pCurr.y) * t;
                }
            }
            
            this.terrainPoints[x] = y;
        }
    }

    getHeightAt(x) {
        const clampedX = Math.max(0, Math.min(this.width - 1, Math.floor(x)));
        return this.terrainPoints[clampedX];
    }

    checkCollision(x, y) {
        const clampedX = Math.max(0, Math.min(this.width - 1, Math.floor(x)));
        return y >= this.terrainPoints[clampedX];
    }

    getGroundPoints() {
        const points = [];
        for (let x = 0; x <= this.width; x++) {
            points.push({ x: x, y: this.terrainPoints[x] });
        }
        return points;
    }

    render() {
        const ctx = this.ctx;
        
        const groundPoints = this.getGroundPoints();
        
        ctx.beginPath();
        ctx.moveTo(0, this.height);
        
        for (let i = 0; i < groundPoints.length; i++) {
            ctx.lineTo(groundPoints[i].x, groundPoints[i].y);
        }
        
        ctx.lineTo(this.width, this.height);
        ctx.closePath();
        
        const gradient = ctx.createLinearGradient(0, this.height * 0.3, 0, this.height);
        gradient.addColorStop(0, '#4CAF50');
        gradient.addColorStop(0.3, '#388E3C');
        gradient.addColorStop(0.6, '#2E7D32');
        gradient.addColorStop(1, '#1B5E20');
        
        ctx.fillStyle = gradient;
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(0, this.height);
        
        for (let i = 0; i < groundPoints.length; i++) {
            ctx.lineTo(groundPoints[i].x, groundPoints[i].y);
        }
        
        ctx.lineTo(this.width, this.height);
        ctx.closePath();
        
        const shadowGradient = ctx.createLinearGradient(0, this.height * 0.3, 0, this.height);
        shadowGradient.addColorStop(0, 'rgba(0, 0, 0, 0.1)');
        shadowGradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
        shadowGradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        
        ctx.fillStyle = shadowGradient;
        ctx.fill();
        
        ctx.beginPath();
        for (let i = 0; i < groundPoints.length; i++) {
            if (i === 0) {
                ctx.moveTo(groundPoints[i].x, groundPoints[i].y);
            } else {
                ctx.lineTo(groundPoints[i].x, groundPoints[i].y);
            }
        }
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 3;
        ctx.stroke();
    }

    renderBackground() {
        const ctx = this.ctx;
        
        const skyGradient = ctx.createLinearGradient(0, 0, 0, this.height * 0.6);
        skyGradient.addColorStop(0, '#87CEEB');
        skyGradient.addColorStop(0.5, '#98D8F0');
        skyGradient.addColorStop(1, '#B0E0E6');
        
        ctx.fillStyle = skyGradient;
        ctx.fillRect(0, 0, this.width, this.height * 0.6);
        
        this.renderClouds();
        this.renderSun();
    }

    renderClouds() {
        const ctx = this.ctx;
        const clouds = [
            { x: 100, y: 80, scale: 1.0 },
            { x: 400, y: 120, scale: 0.8 },
            { x: 700, y: 60, scale: 1.2 },
            { x: 950, y: 140, scale: 0.9 }
        ];
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        for (const cloud of clouds) {
            ctx.beginPath();
            ctx.arc(cloud.x, cloud.y, 25 * cloud.scale, 0, Math.PI * 2);
            ctx.arc(cloud.x + 30 * cloud.scale, cloud.y - 10 * cloud.scale, 30 * cloud.scale, 0, Math.PI * 2);
            ctx.arc(cloud.x + 60 * cloud.scale, cloud.y, 25 * cloud.scale, 0, Math.PI * 2);
            ctx.arc(cloud.x + 30 * cloud.scale, cloud.y + 10 * cloud.scale, 20 * cloud.scale, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    renderSun() {
        const ctx = this.ctx;
        const sunX = this.width - 100;
        const sunY = 100;
        const sunRadius = 40;
        
        const glowGradient = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 3);
        glowGradient.addColorStop(0, 'rgba(255, 255, 200, 0.4)');
        glowGradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
        
        ctx.fillStyle = glowGradient;
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius * 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFEB3B';
        ctx.beginPath();
        ctx.arc(sunX, sunY, sunRadius * 0.8, 0, Math.PI * 2);
        ctx.fill();
    }
}

window.Terrain = Terrain;