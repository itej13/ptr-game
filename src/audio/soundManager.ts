/**
 * Simple 8-bit sound generator using Web Audio API
 * Generates classic retro game sounds procedurally
 */

interface SoundConfig {
  frequency: number
  duration: number
  type?: OscillatorType
  volume?: number
  envelope?: { attack: number; decay: number }
}

export class SoundManager {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null

  constructor() {
    this.initAudioContext()
  }

  private initAudioContext() {
    if (typeof window === 'undefined') return
    try {
      const AudioContext = (window as any).AudioContext || (window as any).webkitAudioContext
      const ctx: AudioContext = new AudioContext()
      this.audioContext = ctx
      this.masterGain = ctx.createGain()
      this.masterGain.connect(ctx.destination)
      this.masterGain.gain.value = 0.15 // keep volume reasonable
    } catch (e) {
      console.warn('Web Audio API not available')
    }
  }

  private playTone(config: SoundConfig) {
    if (!this.audioContext || !this.masterGain) return

    const now = this.audioContext.currentTime
    const { frequency, duration, type = 'square', volume = 0.3, envelope = { attack: 0.02, decay: 0.1 } } = config

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = type
    osc.frequency.value = frequency
    osc.connect(gain)
    gain.connect(this.masterGain)

    // ADSR envelope
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(volume, now + envelope.attack)
    gain.gain.linearRampToValueAtTime(0, now + duration)

    osc.start(now)
    osc.stop(now + duration)
  }

  private playSweep(startFreq: number, endFreq: number, duration: number, volume: number = 0.3) {
    if (!this.audioContext || !this.masterGain) return

    const now = this.audioContext.currentTime
    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'square'
    osc.frequency.setValueAtTime(startFreq, now)
    osc.frequency.linearRampToValueAtTime(endFreq, now + duration)
    osc.connect(gain)
    gain.connect(this.masterGain)

    // envelope
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(volume, now + 0.02)
    gain.gain.linearRampToValueAtTime(0, now + duration)

    osc.start(now)
    osc.stop(now + duration)
  }

  /**
   * Keyboard click - sharp short beep
   */
  click() {
    this.playTone({
      frequency: 800,
      duration: 0.08,
      type: 'square',
      volume: 0.25,
      envelope: { attack: 0.01, decay: 0.05 },
    })
  }

  /**
   * Success ping - ascending beep
   */
  ping() {
    this.playSweep(400, 800, 0.15, 0.3)
  }

  /**
   * Failure buzz - descending beep
   */
  buzz() {
    this.playSweep(600, 150, 0.35, 0.35)
  }

  /**
   * Power up - quick ascending chirp
   */
  powerUp() {
    this.playSweep(200, 600, 0.2, 0.25)
  }

  /**
   * Ambient drone - sustained low tone (for background)
   */
  droneStart(): { stop: () => void } {
    if (!this.audioContext || !this.masterGain) return { stop: () => {} }

    const osc = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()

    osc.type = 'sine'
    osc.frequency.value = 110 // A2, subtle bass
    osc.connect(gain)
    gain.connect(this.masterGain)

    gain.gain.setValueAtTime(0, this.audioContext.currentTime)
    gain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 2)

    osc.start()

    return {
      stop: () => {
        const now = this.audioContext!.currentTime
        gain.gain.linearRampToValueAtTime(0, now + 0.5)
        osc.stop(now + 0.5)
      },
    }
  }

  /**
   * Glitch/error sound
   */
  glitch() {
    this.playTone({
      frequency: 200,
      duration: 0.1,
      type: 'sawtooth',
      volume: 0.2,
    })
  }

  /**
   * Treasure/victory fanfare
   */
  victory() {
    const notes = [523, 659, 784, 1047] // C5, E5, G5, C6
    let delay = 0
    notes.forEach((freq) => {
      setTimeout(
        () => this.playTone({ frequency: freq, duration: 0.2, volume: 0.25 }),
        delay * 100
      )
      delay++
    })
  }

  setMasterVolume(value: number) {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, value))
    }
  }
}

export const soundManager = new SoundManager()
