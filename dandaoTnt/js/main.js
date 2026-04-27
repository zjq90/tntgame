class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.state = 'initializing';
        
        this.terrain = null;
        this.player = null;
        this.enemy = null;
        this.playerWeapon = null;
        this.enemyWeapon = null;
        this.ui = null;
        this.audio = null;
        
        this.currentBullet = null;
        this.damageTexts = [];
        
        this.isSpacePressed = false;
        this.mouseX = 0;
        this.mouseY = 0;
        
        this.enemyAI = {
            isThinking: false,
            thinkTimer: 0,
            thinkDuration: 60,
            targetAngle: 135,
            targetPower: 50,
            isCharging: false,
            chargeTimer: 0,
            chargeDirection: 1
        };
        
        this.init();
    }

    init() {
        this.audio = new AudioManager();
        this.audio.init();
        
        this.terrain = new Terrain(this.canvas);
        
        const playerX = this.canvas.width * 0.2;
        const enemyX = this.canvas.width * 0.8;
        
        this.player = new Player(this.canvas, this.terrain, true, playerX, 'male');
        this.enemy = new Player(this.canvas, this.terrain, false, enemyX, 'female');
        
        this.playerWeapon = new Weapon(this.canvas, this.player, this.terrain);
        this.enemyWeapon = new Weapon(this.canvas, this.enemy, this.terrain);
        
        this.ui = new UI(this.canvas);
        
        this.setupEventListeners();
        
        this.state = 'player_turn';
        
        this.gameLoop();
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat) {
                e.preventDefault();
                this.handleSpaceDown();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') {
                e.preventDefault();
                this.handleSpaceUp();
            }
        });
        
        this.canvas.addEventListener('click', (e) => {
            this.handleClick(e);
        });
        
        document.addEventListener('click', () => {
            if (this.audio) {
                this.audio.resume();
            }
        }, { once: true });
    }

    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouseX = e.clientX - rect.left;
        this.mouseY = e.clientY - rect.top;
        
        if (this.state === 'player_turn' && !this.currentBullet) {
            this.calculatePlayerAngle();
        }
    }

    calculatePlayerAngle() {
        const playerCenterX = this.player.x;
        const playerCenterY = this.player.y + this.player.headOffsetY;
        
        const dx = this.mouseX - playerCenterX;
        const dy = playerCenterY - this.mouseY;
        
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        if (angle < 0) {
            angle = 0;
        } else if (angle > 90) {
            angle = 90;
        }
        
        this.player.setAngle(angle);
    }

    handleSpaceDown() {
        if (this.state !== 'player_turn' || this.currentBullet || this.isSpacePressed) {
            return;
        }
        
        this.isSpacePressed = true;
        this.playerWeapon.startCharging();
        
        if (this.audio) {
            this.audio.playChargeStart();
        }
    }

    handleSpaceUp() {
        if (!this.isSpacePressed) {
            return;
        }
        
        this.isSpacePressed = false;
        
        const bulletData = this.playerWeapon.fire();
        
        if (this.audio) {
            this.audio.stopCharge();
        }
        
        if (bulletData) {
            this.createPlayerBullet(bulletData);
        }
    }

    createPlayerBullet(bulletData) {
        this.currentBullet = new Bullet(
            this.canvas,
            this.terrain,
            bulletData.x,
            bulletData.y,
            bulletData.vx,
            bulletData.vy,
            bulletData.damage,
            bulletData.isCrit
        );
        
        this.currentBullet.setTargetPlayer(this.enemy);
        
        this.playerWeapon.setBullet(this.currentBullet);
        
        if (this.audio) {
            this.audio.playShoot();
        }
    }

    handleClick(e) {
        if (this.state === 'player_win' || this.state === 'player_lose') {
            this.restartGame();
        }
    }

    restartGame() {
        this.terrain = new Terrain(this.canvas);
        
        const playerX = this.canvas.width * 0.2;
        const enemyX = this.canvas.width * 0.8;
        
        this.player = new Player(this.canvas, this.terrain, true, playerX, 'male');
        this.enemy = new Player(this.canvas, this.terrain, false, enemyX, 'female');
        
        this.playerWeapon = new Weapon(this.canvas, this.player, this.terrain);
        this.enemyWeapon = new Weapon(this.canvas, this.enemy, this.terrain);
        
        this.currentBullet = null;
        this.damageTexts = [];
        this.isSpacePressed = false;
        
        this.enemyAI = {
            isThinking: false,
            thinkTimer: 0,
            thinkDuration: 60,
            targetAngle: 135,
            targetPower: 50,
            isCharging: false,
            chargeTimer: 0,
            chargeDirection: 1
        };
        
        this.ui.reset();
        this.state = 'player_turn';
    }

    gameLoop() {
        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        this.playerWeapon.updateCharging();
        
        if (this.audio && this.playerWeapon.isCharging) {
            this.audio.playChargeUpdate(this.playerWeapon.getPower());
        }
        
        if (this.currentBullet) {
            const bulletResult = this.currentBullet.update();
            
            if (bulletResult) {
                this.handleBulletHit(bulletResult);
            }
        }
        
        this.playerWeapon.updateExplosions();
        this.enemyWeapon.updateExplosions();
        
        this.player.updateHitAnimation();
        this.enemy.updateHitAnimation();
        
        this.ui.updatePowerBar(this.playerWeapon.getPower(), 100);
        this.ui.updateAngleDisplay(this.player.angle);
        this.ui.updateHealthBars(
            this.player.health, this.enemy.health,
            this.player.maxHealth, this.enemy.maxHealth
        );
        
        if (this.state === 'enemy_turn' && !this.currentBullet) {
            this.updateEnemyAI();
        }
    }

    handleBulletHit(bulletResult) {
        const wasPlayerBullet = this.currentBullet === this.playerWeapon.currentBullet;
        
        if (bulletResult.hit) {
            if (wasPlayerBullet) {
                this.playerWeapon.createExplosion(
                    bulletResult.x, bulletResult.y,
                    bulletResult.damage, bulletResult.isCrit
                );
                
                if (this.audio) {
                    this.audio.playExplosion(bulletResult.isCrit);
                }
                
                if (this.checkExplosionHit(bulletResult.x, bulletResult.y, this.enemy)) {
                    const isDead = this.enemy.takeDamage(bulletResult.damage, bulletResult.isCrit);
                    
                    this.damageTexts.push(this.ui.createDamageText(
                        bulletResult.damage,
                        this.enemy.x,
                        this.enemy.y + this.enemy.headOffsetY - 50,
                        bulletResult.isCrit
                    ));
                    
                    if (this.audio) {
                        this.audio.playHit();
                    }
                    
                    if (isDead) {
                        this.state = 'player_win';
                        if (this.audio) {
                            this.audio.playVictory();
                        }
                    }
                }
                
                this.playerWeapon.clearBullet();
            } else {
                this.enemyWeapon.createExplosion(
                    bulletResult.x, bulletResult.y,
                    bulletResult.damage, bulletResult.isCrit
                );
                
                if (this.audio) {
                    this.audio.playExplosion(bulletResult.isCrit);
                }
                
                if (this.checkExplosionHit(bulletResult.x, bulletResult.y, this.player)) {
                    const isDead = this.player.takeDamage(bulletResult.damage, bulletResult.isCrit);
                    
                    this.damageTexts.push(this.ui.createDamageText(
                        bulletResult.damage,
                        this.player.x,
                        this.player.y + this.player.headOffsetY - 50,
                        bulletResult.isCrit
                    ));
                    
                    if (this.audio) {
                        this.audio.playHit();
                    }
                    
                    if (isDead) {
                        this.state = 'player_lose';
                        if (this.audio) {
                            this.audio.playDefeat();
                        }
                    }
                }
                
                this.enemyWeapon.clearBullet();
            }
            
            this.currentBullet = null;
            
            if (this.state === 'player_turn' && !this.playerWeapon.isBulletFlying) {
                setTimeout(() => {
                    if (this.state === 'player_turn') {
                        this.state = 'enemy_turn';
                        this.enemyAI.isThinking = true;
                        this.enemyAI.thinkTimer = 0;
                    }
                }, 1000);
            } else if (this.state === 'enemy_turn' && !this.enemyWeapon.isBulletFlying) {
                setTimeout(() => {
                    if (this.state === 'enemy_turn') {
                        this.state = 'player_turn';
                    }
                }, 1000);
            }
        } else if (bulletResult.outOfBounds) {
            this.currentBullet = null;
            
            if (wasPlayerBullet) {
                this.playerWeapon.clearBullet();
                setTimeout(() => {
                    if (this.state === 'player_turn') {
                        this.state = 'enemy_turn';
                        this.enemyAI.isThinking = true;
                        this.enemyAI.thinkTimer = 0;
                    }
                }, 500);
            } else {
                this.enemyWeapon.clearBullet();
                setTimeout(() => {
                    if (this.state === 'enemy_turn') {
                        this.state = 'player_turn';
                    }
                }, 500);
            }
        }
    }

    checkExplosionHit(expX, expY, targetPlayer) {
        const playerX = targetPlayer.x;
        const playerY = targetPlayer.y + targetPlayer.headOffsetY;
        const explosionRadius = 60;
        
        const dx = expX - playerX;
        const dy = expY - playerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < explosionRadius + targetPlayer.headRadius;
    }

    updateEnemyAI() {
        if (this.enemyAI.isThinking) {
            this.enemyAI.thinkTimer++;
            
            if (this.enemyAI.thinkTimer === 1) {
                this.calculateEnemyTarget();
            }
            
            if (this.enemyAI.thinkTimer >= this.enemyAI.thinkDuration) {
                this.enemyAI.isThinking = false;
                this.enemyAI.isCharging = true;
                this.enemyAI.chargeTimer = 0;
            }
        } else if (this.enemyAI.isCharging) {
            this.enemyAI.chargeTimer++;
            
            const chargeProgress = this.enemyAI.chargeTimer / 60;
            const power = Math.sin(chargeProgress * Math.PI) * 100;
            
            this.enemy.setAngle(this.enemyAI.targetAngle);
            
            if (this.enemyAI.chargeTimer >= 60) {
                this.enemyAI.isCharging = false;
                this.fireEnemyBullet();
            }
        }
    }

    calculateEnemyTarget() {
        const enemyX = this.enemy.x;
        const enemyY = this.enemy.y + this.enemy.headOffsetY;
        
        const playerX = this.player.x;
        const playerY = this.player.y + this.player.headOffsetY;
        
        const dx = playerX - enemyX;
        const dy = enemyY - playerY;
        
        let angle = Math.atan2(dy, dx) * (180 / Math.PI);
        
        const randomOffset = (Math.random() - 0.5) * 20;
        angle += randomOffset;
        
        if (angle < 90) {
            angle = 90 + Math.random() * 10;
        } else if (angle > 180) {
            angle = 180 - Math.random() * 10;
        }
        
        this.enemyAI.targetAngle = angle;
        
        const distance = Math.abs(playerX - enemyX);
        const basePower = Math.min(100, Math.max(30, (distance / this.canvas.width) * 100 + 20));
        this.enemyAI.targetPower = basePower + (Math.random() - 0.5) * 30;
    }

    fireEnemyBullet() {
        const shootPos = this.enemy.getShootPosition();
        const velocity = this.enemy.getVelocity(this.enemyAI.targetPower);
        
        const isCrit = Math.random() < 0.1;
        const damage = isCrit ? Math.floor(90 * 1.5) : 90;
        
        this.currentBullet = new Bullet(
            this.canvas,
            this.terrain,
            shootPos.x,
            shootPos.y,
            velocity.vx,
            velocity.vy,
            damage,
            isCrit
        );
        
        this.currentBullet.setTargetPlayer(this.player);
        
        this.enemyWeapon.setBullet(this.currentBullet);
        
        if (this.audio) {
            this.audio.playShoot();
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.terrain.renderBackground();
        this.terrain.render();
        
        this.renderTrajectoryPredictions();
        
        this.player.render();
        this.enemy.render();
        
        if (this.currentBullet) {
            this.currentBullet.render();
        }
        
        this.playerWeapon.renderExplosions();
        this.enemyWeapon.renderExplosions();
        
        this.ui.renderDamageText(this.ctx, this.damageTexts);
        
        this.ui.renderGameState(this.ctx, this.state);
        
        if (this.state === 'player_turn') {
            this.ui.renderPowerIndicator(this.ctx, this.playerWeapon.getPower(), 100);
            this.ui.renderAngleIndicator(this.ctx, this.player.angle);
        }
    }

    renderTrajectoryPredictions() {
        if (this.state === 'player_turn' && !this.currentBullet) {
            this.playerWeapon.renderTrajectoryPrediction();
        }
    }
}

window.addEventListener('load', () => {
    new Game();
});