class SpeechToTextElement extends BaseTextElement {
    constructor() {
        super();
        this.isRecording = false;
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioContext = null;
        this.stream = null;
        
        // groq configuration
        this.groqApiKey = null;
        this.groqApiUrl = 'https://api.groq.com/v1/audio/transcriptions';

        // audio recording config 
        this.audioConfig = {
            sampleRate: 16000,
            channels: 1,
            mimeType: 'audio/webm;',
        }
        
}

render() {
    return html`
    <div class="container">
    <div class="speech-to-text">
    `
}
getStatusText() {
    if (this.isRecording) {
        return 'Recording...';
    } else if (this.isTranscribing) {
        return 'Transcribing audio...';
    } else {
        return 'Click to record';
    }
}
async toggleRecording() {
    if (this.isRecording) {
        await this.stopRecording();
    } else {
        await this.startRecording();
    }
}





}