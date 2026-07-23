let audioContext: AudioContext | null = null

export function playBookingNotificationSound() {
  try {
    audioContext ??= new AudioContext()
    if (audioContext.state === 'suspended') void audioContext.resume()
    const now = audioContext.currentTime
    const oscillator = audioContext.createOscillator()
    const gain = audioContext.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(740, now)
    oscillator.frequency.setValueAtTime(980, now + 0.11)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.16, now + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.34)
    oscillator.connect(gain)
    gain.connect(audioContext.destination)
    oscillator.start(now)
    oscillator.stop(now + 0.35)
  } catch {
    // El navegador puede bloquear audio hasta que exista una interaccion del usuario.
  }
}
