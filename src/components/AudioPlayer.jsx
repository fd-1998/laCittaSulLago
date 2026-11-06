import { useEffect, useRef, useState } from 'react'
import { Pause, Play, Volume2 } from 'lucide-react'

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) {
    return '0:00'
  }

  const minutes = Math.floor(seconds / 60)
  return `${minutes}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`
}

function AudioPlayer({ src, type, title }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    const audio = audioRef.current
    return () => {
      audio?.pause()
    }
  }, [])

  async function togglePlayback() {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    if (audio.paused) {
      try {
        setError('')
        await audio.play()
      } catch {
        setError('Non è stato possibile avviare la riproduzione.')
      }
    } else {
      audio.pause()
    }
  }

  function seek(event) {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const nextTime = Number(event.target.value)
    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  return (
    <div>
      <div className="episode-player">
        <audio
          ref={audioRef}
          preload="metadata"
          onDurationChange={(event) => setDuration(event.currentTarget.duration)}
          onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onError={() => setError('Il file audio non è disponibile.')}
        >
          <source src={src} type={type} />
        </audio>
        <button
          className="episode-player-toggle"
          type="button"
          aria-label={playing ? `Metti in pausa ${title}` : `Ascolta ${title}`}
          onClick={togglePlayback}
        >
          {playing ? <Pause aria-hidden="true" /> : <Play aria-hidden="true" />}
        </button>
        <div className="episode-player-track">
          <div className="episode-player-label">
            <span>{playing ? 'In riproduzione' : 'Ascolta ora'}</span>
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={Math.min(currentTime, duration || 0)}
            aria-label={`Posizione di riproduzione di ${title}`}
            onChange={seek}
          />
        </div>
        <Volume2 className="episode-player-volume" aria-hidden="true" />
      </div>
      {error ? <p className="episode-player-error" role="alert">{error}</p> : null}
    </div>
  )
}

export default AudioPlayer
