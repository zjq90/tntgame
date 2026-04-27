class AudioManager {
    constructor() {
        this.audioContext = null;
        this.isInitialized = false;
        this.masterGain = null;
        this.sounds = {};
    }

    init() {
        if (this.isInitialized) return;
        
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.3;
            this.masterGain.connect(this.audioContext.destination);
            
            this.isInitialized = true;
        } catch (e) {
            console.warn('Web Audio API not supported:', e);
        }
    }

    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    playChargeStart() {
        if (!this.isInitialized) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(
            800, 
            this.audioContext.currentTime + 0.5
        );
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.1);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start();
        
        this.sounds.charge = {
            oscillator: oscillator,
            gainNode: gainNode,
            startTime: this.audioContext.currentTime
        };
    }

    playChargeUpdate(power) {
        if (!this.isInitialized || !this.sounds.charge) return;
        
        const { oscillator, gainNode } = this.sounds.charge;
        
        const frequency = 200 + (power / 100) * 600;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        const volume = 0.1 + (power / 100) * 0.15;
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    }

    stopCharge() {
        if (!this.isInitialized || !this.sounds.charge) return;
        
        const { oscillator, gainNode } = this.sounds.charge;
        
        gainNode.gain.cancelScheduledValues(this.audioContext.currentTime);
        gainNode.gain.setValueAtTime(
            gainNode.gain.value, 
            this.audioContext.currentTime
        );
        gainNode.gain.linearRampToValueAtTime(
            0, 
            this.audioContext.currentTime + 0.1
        );
        
        oscillator.stop(this.audioContext.currentTime + 0.1);
        
        delete this.sounds.charge;
    }

    playShoot() {
        if (!this.isInitialized) return;
        
        this.stopCharge();
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            100, 
            this.audioContext.currentTime + 0.3
        );
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01, 
            this.audioContext.currentTime + 0.3
        );
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    playExplosion(isCrit = false) {
        if (!this.isInitialized) return;
        
        const bufferSize = this.audioContext.sampleRate * 0.5;
        const buffer = this.audioContext.createBuffer(
            1, 
            bufferSize, 
            this.audioContext.sampleRate
        );
        
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1);
        }
        
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = buffer;
        
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(isCrit ? 2000 : 1000, this.audioContext.currentTime);
        filter.frequency.exponentialRampToValueAtTime(
            isCrit ? 500 : 200, 
            this.audioContext.currentTime + 0.5
        );
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(isCrit ? 0.5 : 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01, 
            this.audioContext.currentTime + (isCrit ? 0.8 : 0.5)
        );
        
        noiseSource.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        noiseSource.start();
        noiseSource.stop(this.audioContext.currentTime + (isCrit ? 0.8 : 0.5));
        
        if (isCrit) {
            this.playCritSound();
        }
    }

    playCritSound() {
        if (!this.isInitialized) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(
            800, 
            this.audioContext.currentTime + 0.2
        );
        oscillator.frequency.exponentialRampToValueAtTime(
            400, 
            this.audioContext.currentTime + 0.4
        );
        
        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
            0, 
            this.audioContext.currentTime + 0.4
        );
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.4);
    }

    playHit() {
        if (!this.isInitialized) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(
            50, 
            this.audioContext.currentTime + 0.2
        );
        
        gainNode.gain.setValueAtTime(0.25, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01, 
            this.audioContext.currentTime + 0.2
        );
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    playVictory() {
        if (!this.isInitialized) return;
        
        const notes = [523.25, 659.25, 783.99, 1046.50];
        const startTime = this.audioContext.currentTime;
        
        notes.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(freq, startTime + index * 0.2);
            
            gainNode.gain.setValueAtTime(0, startTime + index * 0.2);
            gainNode.gain.linearRampToValueAtTime(0.2, startTime + index * 0.2 + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, startTime + index * 0.2 + 0.4);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.start(startTime + index * 0.2);
            oscillator.stop(startTime + index * 0.2 + 0.4);
        });
    }

    playDefeat() {
        if (!this.isInitialized) return;
        
        const notes = [392.00, 349.23, 329.63, 261.63];
        const startTime = this.audioContext.currentTime;
        
        notes.forEach((freq, index) => {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(freq, startTime + index * 0.3);
            
            gainNode.gain.setValueAtTime(0, startTime + index * 0.3);
            gainNode.gain.linearRampToValueAtTime(0.15, startTime + index * 0.3 + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, startTime + index * 0.3 + 0.5);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.masterGain);
            
            oscillator.start(startTime + index * 0.3);
            oscillator.stop(startTime + index * 0.3 + 0.5);
        });
    }

    playAngleChange() {
        if (!this.isInitialized) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(320, this.audioContext.currentTime + 0.05);
        
        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01, 
            this.audioContext.currentTime + 0.1
        );
        
        oscillator.connect(gainNode);
        gainNode.connect(this.masterGain);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    setVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
        }
    }

    toggleMute() {
        if (this.masterGain) {
            const currentVolume = this.masterGain.gain.value;
            if (currentVolume > 0) {
                this.previousVolume = currentVolume;
                this.masterGain.gain.value = 0;
            } else {
                this.masterGain.gain.value = this.previousVolume || 0.3;
            }
        }
    }
}

window.AudioManager = AudioManager;