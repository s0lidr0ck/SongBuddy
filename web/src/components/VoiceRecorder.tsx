'use client';

import { useState, useRef, useEffect } from 'react';
import { getDB } from '@/lib/db/rxdb';

interface Recording {
  id: string;
  filename: string;
  local_uri: string;
  duration_sec?: number;
  created_at: string;
}

interface VoiceRecorderProps {
  songId?: string;
}

export default function VoiceRecorder({ songId }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [currentDuration, setCurrentDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const pausedDurationRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    loadRecordings();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [songId]);

  const loadRecordings = async () => {
    try {
      const db = await getDB();
      const query = songId 
        ? { selector: { song_id: songId }, sort: [{ created_at: 'desc' }] }
        : { sort: [{ created_at: 'desc' }] };
      
      const docs = await db.recordings.find(query).exec();
      
      const recordingList = docs.map((doc: any) => ({
        id: doc.get('id'),
        filename: doc.get('filename'),
        local_uri: doc.get('local_uri'),
        duration_sec: doc.get('duration_sec'),
        created_at: doc.get('created_at')
      }));
      
      setRecordings(recordingList);
    } catch (error) {
      console.error('Error loading recordings:', error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      streamRef.current = stream;
      audioChunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        saveRecording();
      };
      
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setIsPaused(false);
      startTimeRef.current = Date.now();
      pausedDurationRef.current = 0;
      
      // Start timer
      timerRef.current = setInterval(() => {
        if (!isPaused) {
          const elapsed = (Date.now() - startTimeRef.current - pausedDurationRef.current) / 1000;
          setCurrentDuration(Math.floor(elapsed));
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        // Resume
        mediaRecorderRef.current.resume();
        setIsPaused(false);
        startTimeRef.current = Date.now() - pausedDurationRef.current;
      } else {
        // Pause
        mediaRecorderRef.current.pause();
        setIsPaused(true);
        pausedDurationRef.current = Date.now() - startTimeRef.current;
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const saveRecording = async () => {
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const now = new Date().toISOString();
      const recordingId = `recording_${Date.now()}`;
      const filename = `recording_${new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-')}.webm`;
      
      const db = await getDB();
      await db.recordings.insert({
        id: recordingId,
        song_id: songId || null,
        filename,
        local_uri: audioUrl,
        duration_sec: currentDuration,
        is_private: true,
        created_at: now
      });
      
      setCurrentDuration(0);
      await loadRecordings();
      
    } catch (error) {
      console.error('Error saving recording:', error);
    }
  };

  const playRecording = (recording: Recording) => {
    if (isPlaying === recording.id) {
      setIsPlaying(null);
      return;
    }
    
    const audio = new Audio(recording.local_uri);
    setIsPlaying(recording.id);
    
    audio.onended = () => {
      setIsPlaying(null);
    };
    
    audio.onerror = () => {
      setIsPlaying(null);
      console.error('Error playing recording');
    };
    
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      setIsPlaying(null);
    });
  };

  const downloadRecording = (recording: Recording) => {
    const link = document.createElement('a');
    link.href = recording.local_uri;
    link.download = recording.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const deleteRecording = async (recordingId: string) => {
    if (!confirm('Are you sure you want to delete this recording?')) return;
    
    try {
      const db = await getDB();
      await db.recordings.findOne({ selector: { id: recordingId } }).remove();
      await loadRecordings();
    } catch (error) {
      console.error('Error deleting recording:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Voice Recorder</h3>
      
      {/* Recording Controls */}
      <div className="flex flex-col items-center space-y-4 mb-6">
        {isRecording && (
          <div className="text-2xl font-mono text-red-600">
            {isPaused ? '⏸' : '🔴'} {formatDuration(currentDuration)}
          </div>
        )}
        
        <div className="flex space-x-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-2xl transition-colors"
            >
              🎙️
            </button>
          ) : (
            <>
              <button
                onClick={pauseRecording}
                className="w-12 h-12 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full flex items-center justify-center text-lg transition-colors"
              >
                {isPaused ? '▶️' : '⏸️'}
              </button>
              <button
                onClick={stopRecording}
                className="w-12 h-12 bg-gray-500 hover:bg-gray-600 text-white rounded-full flex items-center justify-center text-lg transition-colors"
              >
                ⏹️
              </button>
            </>
          )}
        </div>
        
        {!isRecording && (
          <p className="text-sm text-gray-600 text-center">
            Click the microphone to start recording
          </p>
        )}
      </div>
      
      {/* Recordings List */}
      {recordings.length > 0 && (
        <div>
          <h4 className="font-medium text-gray-700 mb-3">
            {songId ? 'Song Recordings' : 'All Recordings'} ({recordings.length})
          </h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recordings.map((recording) => (
              <div key={recording.id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {recording.filename}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatDate(recording.created_at)}
                    {recording.duration_sec && ` • ${formatDuration(recording.duration_sec)}`}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-3">
                  <button
                    onClick={() => playRecording(recording)}
                    className={`p-2 rounded text-sm transition-colors ${
                      isPlaying === recording.id
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                    }`}
                  >
                    {isPlaying === recording.id ? '⏸' : '▶️'}
                  </button>
                  <button
                    onClick={() => downloadRecording(recording)}
                    className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded text-sm transition-colors"
                    title="Download"
                  >
                    💾
                  </button>
                  <button
                    onClick={() => deleteRecording(recording.id)}
                    className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded text-sm transition-colors"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}