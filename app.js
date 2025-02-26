const fileInput = document.getElementById('fileInput');
const playPauseButton = document.getElementById('playPauseButton');
const loopButton = document.getElementById('loopButton');
const dropZone = document.getElementById('dropZone');
const timestamp = document.getElementById('timestamp');
const playlist = document.getElementById('playlist');
const volumeSlider = document.getElementById('volumeSlider');
const volumeLabel = document.getElementById('volumeLabel');
const howToUseButton = document.getElementById('howToUseButton');
const pitchSlider = document.getElementById('pitchSlider');
const pitchLabel = document.getElementById('pitchLabel');
const currentSong = document.getElementById('currentSong'); // New element for current song name

let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let sourceNode;
let gainNode = audioContext.createGain();
let pitchShiftNode;
let audioBuffer;
let isPlaying = false;
let isLooping = false;
let startTime = 0;
let pausedAt = 0;
let currentFileIndex = 0;
let playlistFiles = [];

function startPlayback() {
    if (sourceNode) {
        sourceNode.disconnect();
    }
    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;

    pitchShiftNode = audioContext.createGain();
    sourceNode.connect(pitchShiftNode);
    pitchShiftNode.connect(gainNode);
    gainNode.connect(audioContext.destination);

    sourceNode.onended = handleSongEnd;

    // Set the playback rate based on the current pitch value
    const pitchValue = parseFloat(pitchSlider.value);
    sourceNode.playbackRate.setValueAtTime(pitchValue, audioContext.currentTime);

    startTime = audioContext.currentTime - pausedAt;
    sourceNode.start(0, pausedAt);
    pausedAt = 0;

    // Smooth fade in
    const fadeInDuration = 0.3; // duration in seconds
    const currentTime = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, currentTime);
    gainNode.gain.linearRampToValueAtTime(volumeSlider.value, currentTime + fadeInDuration);

    playPauseButton.textContent = 'Pause';
    isPlaying = true;

    // Start updating the timestamp
    requestAnimationFrame(updateTimestamp);
}

function togglePlayPause() {
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    if (isPlaying) {
        // Smooth fade out
        const fadeOutDuration = 0.3; // duration in seconds
        const currentTime = audioContext.currentTime;
        gainNode.gain.setValueAtTime(gainNode.gain.value, currentTime);
        gainNode.gain.linearRampToValueAtTime(0, currentTime + fadeOutDuration);

        setTimeout(() => {
            pausedAt = audioContext.currentTime - startTime;
            sourceNode.stop();
            playPauseButton.textContent = 'Play';
            isPlaying = false;
            // Reset gainNode for next playback
            gainNode.gain.setValueAtTime(volumeSlider.value, audioContext.currentTime);
        }, fadeOutDuration * 1000);
    } else {
        if (audioBuffer) {
            startPlayback();
        } else {
            playFile(currentFileIndex);
        }
    }
}

function toggleLoop() {
    isLooping = !isLooping;
    loopButton.textContent = `Loop: ${isLooping ? 'On' : 'Off'}`;
}

function handleSongEnd() {
    if (isLooping && isPlaying) {
        startPlayback();
    } else {
        playPauseButton.textContent = 'Play';
    }
}

function handleFileSelect(event) {
    const files = event.target.files;
    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            loadFile(files[i]);
        }
    }
}

function handleDrop(event) {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
            loadFile(files[i]);
        }
    }
}

function handleDragOver(event) {
    event.preventDefault();
}

function loadFile(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        audioContext.decodeAudioData(event.target.result, function(buffer) {
            audioBuffer = buffer;
            playPauseButton.disabled = false;
            addToPlaylist(file.name, buffer);
            resetTimestamp(); // Reset the timestamp when a new file is loaded
        });
    };
    reader.readAsArrayBuffer(file);
}

function addToPlaylist(fileName, buffer) {
    const li = document.createElement('li');
    li.textContent = fileName;
    li.addEventListener('click', () => {
        audioBuffer = buffer;
        currentSong.textContent = `Playing: ${fileName}`; // Update current song name
        resetTimestamp();
        if (isPlaying) {
            togglePlayPause();
        }
        startPlayback();
    });
    playlist.appendChild(li);
    playlistFiles.push(buffer);
}

function updateVolume() {
    gainNode.gain.value = volumeSlider.value;
    volumeLabel.textContent = `${Math.round(volumeSlider.value * 100)}%`;
}

function updatePitch() {
    const pitchValue = parseFloat(pitchSlider.value).toFixed(2);
    pitchLabel.textContent = pitchValue;
    if (sourceNode) {
        sourceNode.playbackRate.value = pitchValue;
    }
}

function updateTimestamp() {
    if (isPlaying) {
        const elapsedTime = audioContext.currentTime - startTime;
        const minutes = Math.floor(elapsedTime / 60);
        const seconds = Math.floor(elapsedTime % 60);
        timestamp.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
        requestAnimationFrame(updateTimestamp);
    }
}

function resetTimestamp() {
    startTime = 0;
    pausedAt = 0;
    timestamp.textContent = '0:00';
}

function showHowToUse() {
    alert("How to use:\n1. Upload or drag and drop audio files.\n2. Use the play/pause button to play or pause your current playing song.\n3. Adjust volume and pitch using the sliders.\n4. Toggle looping with the loop button.");
}

// Event listeners
fileInput.addEventListener('change', handleFileSelect);
dropZone.addEventListener('dragover', handleDragOver);
dropZone.addEventListener('drop', handleDrop);
playPauseButton.addEventListener('click', togglePlayPause);
loopButton.addEventListener('click', toggleLoop);
volumeSlider.addEventListener('input', updateVolume);
pitchSlider.addEventListener('input', updatePitch);
howToUseButton.addEventListener('click', showHowToUse);