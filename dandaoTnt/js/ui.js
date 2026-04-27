class UI {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.powerFill = document.getElementById('powerFill');
        this.angleValue = document.getElementById('angleValue');
        this.playerHealthBar = document.getElementById('playerHealth');
        this.enemyHealthBar = document.getElementById('enemyHealth');
        
        this.lastPower = 0;
        this.lastAngle = 0;
    }

    updatePowerBar(power, maxPower) {
        if (!this.powerFill) return;
        
        const displayPower = Math.max(0, Math.min(100, power));
        const percentage = (displayPower / maxPower) * 100;
        
        this.powerFill.style.width = `${percentage}%`;
        this.lastPower = displayPower;
    }

    updateAngleDisplay(angle) {
        if (!this.angleValue) return;
        
        const displayAngle = Math.round(angle);
        this.angleValue.textContent = displayAngle;
        this.lastAngle = displayAngle;
    }

    updateHealthBars(playerHealth, enemyHealth, playerMaxHealth, enemyMaxHealth) {
        if (this.playerHealthBar) {
            const playerPercent = (playerHealth / playerMaxHealth) * 100;
            this.playerHealthBar.style.width = `${playerPercent}%`;
        }
        
        if (this.enemyHealthBar) {
            const enemyPercent = (enemyHealth / enemyMaxHealth) * 100;
            this.enemyHealthBar.style.width = `${enemyPercent}%`;
        }
    }

    renderGameState(ctx, gameState, turn) {
        ctx.save();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        
        if (gameState === 'player_turn') {
            ctx.fillText('玩家回合 - 按空格键蓄力，松开发射', this.canvas.width / 2, 30);
        } else if (gameState === 'enemy_turn') {
            ctx.fillText('敌人回合...', this.canvas.width / 2, 30);
        } else if (gameState === 'player_win') {
            ctx.fillStyle = 'rgba(0, 150, 0, 0.8)';
            ctx.font = 'bold 36px Arial';
            ctx.fillText('胜利！敌人被击败了！', this.canvas.width / 2, this.canvas.height / 2 - 20);
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillText('点击重新开始游戏', this.canvas.width / 2, this.canvas.height / 2 + 30);
        } else if (gameState === 'player_lose') {
            ctx.fillStyle = 'rgba(150, 0, 0, 0.8)';
            ctx.font = 'bold 36px Arial';
            ctx.fillText('失败！你被击败了！', this.canvas.width / 2, this.canvas.height / 2 - 20);
            ctx.font = 'bold 20px Arial';
            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            ctx.fillText('点击重新开始游戏', this.canvas.width / 2, this.canvas.height / 2 + 30);
        }
        
        ctx.restore();
    }

    renderDamageText(ctx, damageTexts) {
        ctx.save();
        
        for (let i = damageTexts.length - 1; i >= 0; i--) {
            const dt = damageTexts[i];
            
            dt.y -= 1;
            dt.alpha -= 0.02;
            dt.scale += 0.01;
            
            if (dt.alpha <= 0) {
                damageTexts.splice(i, 1);
                continue;
            }
            
            ctx.globalAlpha = dt.alpha;
            ctx.font = `bold ${24 * dt.scale}px Arial`;
            ctx.textAlign = 'center';
            
            if (dt.isCrit) {
                ctx.fillStyle = '#FFD700';
                ctx.strokeStyle = '#FF5722';
                ctx.lineWidth = 3;
                
                const text = `暴击! -${dt.damage}`;
                ctx.strokeText(text, dt.x, dt.y);
                ctx.fillText(text, dt.x, dt.y);
            } else {
                ctx.fillStyle = '#FFFFFF';
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 3;
                
                const text = `-${dt.damage}`;
                ctx.strokeText(text, dt.x, dt.y);
                ctx.fillText(text, dt.x, dt.y);
            }
        }
        
        ctx.restore();
    }

    createDamageText(damage, x, y, isCrit) {
        return {
            damage: damage,
            x: x,
            y: y,
            alpha: 1,
            scale: 1,
            isCrit: isCrit
        };
    }

    renderInstructions(ctx) {
        ctx.save();
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        
        const instructions = [
            '操作说明:',
            '• 鼠标移动调整射击角度',
            '• 按住空格键蓄力',
            '• 松开空格键发射',
            '• 蓄力条左强右弱'
        ];
        
        let y = this.canvas.height - 100;
        for (const text of instructions) {
            ctx.fillText(text, 20, y);
            y += 18;
        }
        
        ctx.restore();
    }

    renderPowerIndicator(ctx, power, maxPower) {
        ctx.save();
        
        const barWidth = 200;
        const barHeight = 25;
        const barX = this.canvas.width / 2 - barWidth / 2;
        const barY = this.canvas.height - 60;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(barX - 2, barY - 2, barWidth + 4, barHeight + 4);
        
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        
        const powerPercent = power / maxPower;
        const fillWidth = barWidth * powerPercent;
        
        const gradient = ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
        gradient.addColorStop(0, '#4CAF50');
        gradient.addColorStop(0.5, '#FF9800');
        gradient.addColorStop(1, '#F44336');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(barX, barY, fillWidth, barHeight);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        
        this.renderPowerScale(ctx, barX, barY, barWidth, barHeight);
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `力度: ${Math.round(power)}%`,
            this.canvas.width / 2,
            barY + barHeight + 20
        );
        
        ctx.restore();
    }

    renderPowerScale(ctx, barX, barY, barWidth, barHeight) {
        ctx.fillStyle = '#FFF';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        
        const marks = [0, 20, 40, 60, 80, 100];
        
        for (const mark of marks) {
            const x = barX + (mark / 100) * barWidth;
            
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x, barY);
            ctx.lineTo(x, barY + barHeight);
            ctx.stroke();
            
            ctx.fillText(`${mark}`, x, barY - 5);
        }
        
        ctx.fillStyle = '#FFEB3B';
        ctx.font = 'bold 10px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('强', barX - 20, barY + barHeight / 2 + 4);
        ctx.textAlign = 'right';
        ctx.fillText('弱', barX + barWidth + 20, barY + barHeight / 2 + 4);
    }

    renderAngleIndicator(ctx, angle) {
        ctx.save();
        
        const x = 80;
        const y = this.canvas.height - 60;
        const radius = 30;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, Math.PI, 0);
        ctx.stroke();
        
        const angleRad = (angle * Math.PI) / 180;
        const endX = x + Math.cos(angleRad) * radius;
        const endY = y - Math.sin(angleRad) * radius;
        
        ctx.strokeStyle = '#FF5722';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.arc(endX, endY, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`角度: ${Math.round(angle)}°`, x, y + 45);
        
        ctx.restore();
    }

    reset() {
        this.lastPower = 0;
        this.lastAngle = 0;
        
        if (this.powerFill) {
            this.powerFill.style.width = '0%';
        }
        if (this.angleValue) {
            this.angleValue.textContent = '45';
        }
    }
}

window.UI = UI;