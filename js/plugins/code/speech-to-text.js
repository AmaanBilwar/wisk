import { html, css, LitElement } from '/a7/cdn/lit-core-2.7.4.min.js';

class SpeechToText extends LitElement {
    static styles = css`
        * {
            box-sizing: border-box;
            font-family: var(--font);
            margin: 0px;
            padding: 0px;
        }
        :host {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 30;
            touch-action: none;
            user-select: none;
        }
        .container {
            position: relative;
            max-width: calc(100vw - 40px);
            cursor: move;
        }
        .modal {
            position: relative;
            display: flex;
            align-items: center;
            gap: var(--padding-3);
            padding: var(--padding-3) var(--padding-4);
            background-color: var(--bg-2);
            border: 1px solid var(--border-1);
            border-radius: 50px;
            filter: var(--drop-shadow);
            min-width: 300px;
            max-width: 500px;
        }
        .controls {
            position: absolute;
            top: 8px;
            right: 8px;
            display: flex;
            gap: 8px;
            opacity: 0;
            transition: opacity 0.2s ease;
            z-index: 31;
        }
        .modal:hover .controls {
            opacity: 1;
        }
        .control-button,
        select.control-select {
            padding: 4px 8px;
            background-color: rgba(0, 0, 0, 0.5);
            color: white;
            border: none;
            border-radius: var(--radius);
            cursor: pointer;
            font-size: 12px;
        }
        .control-button:hover,
        select.control-select:hover {
            background-color: rgba(0, 0, 0, 0.7);
        }
        .placeholder-text {
            flex: 1;
            color: var(--text-3);
            font-size: 16px;
            pointer-events: none;
        }
        .mic-button {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background-color: var(--bg-1);
            border: none;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
            filter: var(--drop-shadow);
        }
        .mic-button:hover {
            background-color: var(--bg-3);
        }
        .mic-button svg {
            width: 20px;
            height: 20px;
            color: var(--fg-1);
        }
        .recording-container {
            display: flex;
            align-items: center;
            gap: var(--padding-3);
            flex: 1;
        }
        .recording-indicator {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        .recording-dot {
            width: 8px;
            height: 8px;
            background-color: #ff4444;
            border-radius: 50%;
            animation: pulse 1.5s ease-in-out infinite;
        }
        .recording-dot:nth-child(2) {
            animation-delay: 0.3s;
        }
        .recording-dot:nth-child(3) {
            animation-delay: 0.6s;
        }
        @keyframes pulse {
            0%, 100% { opacity: 0.3; }
            50% { opacity: 1; }
        }
        .timer {
            color: var(--fg-1);
            font-size: 16px;
            font-weight: 500;
        }
        .done-button {
            padding: var(--padding-2) var(--padding-4);
            background-color: var(--bg-1);
            color: var(--fg-1);
            border: none;
            border-radius: 20px;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.2s ease;
        }
        .done-button:hover {
            background-color: var(--bg-3);
        }
        .button-container {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        .drag-handle {
            cursor: move;
            padding: 4px;
            border-radius: var(--radius);
            background: var(--fg-1);
            color: var(--bg-1);
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .drag-handle svg {
            width: 20px;
            height: 20px;
        }
        button {
            padding: var(--padding-2);
            background-color: var(--fg-1);
            color: var(--bg-1);
            border: none;
            border-radius: var(--radius);
            cursor: pointer;
            outline: none;
            font-weight: 500;
            filter: var(--drop-shadow);
        }
    `;

    static properties = {
        show: { type: Boolean },
        isRecording: { type: Boolean },
        recordingTime: { type: Number },
    };

    constructor() {
        super();
        this.show = true;
        this.isRecording = false;
        this.recordingTime = 0;
        this.recordingInterval = null;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.moveDistance = 0;
        this.settings = {
            'Language': 'English',
            'Quality': 'High',
            'Speed': 'Normal'
        };
        this.currentSetting = this.settings[Object.keys(this.settings)[0]];
    }

    startDragging = e => {
        if (!this.show && !e.target.closest('.drag-handle')) return;
        if (e.target.classList.contains('mic-button') || e.target.classList.contains('done-button') || e.target.classList.contains('control-button') || e.target.classList.contains('control-select')) return;

        this.isDragging = true;
        this.moveDistance = 0;

        const rect = this.getBoundingClientRect();

        if (e.type === 'mousedown') {
            this.startX = e.clientX - rect.left;
            this.startY = e.clientY - rect.top;
        } else if (e.type === 'touchstart') {
            this.startX = e.touches[0].clientX - rect.left;
            this.startY = e.touches[0].clientY - rect.top;
        }

        window.addEventListener('mousemove', this.dragHandler);
        window.addEventListener('mouseup', this.stopDragHandler);
        window.addEventListener('touchmove', this.dragHandler);
        window.addEventListener('touchend', this.stopDragHandler);
    };

    dragHandler = e => {
        if (!this.isDragging) return;
        e.preventDefault();

        let clientX, clientY;
        if (e.type === 'mousemove') {
            clientX = e.clientX;
            clientY = e.clientY;
        } else if (e.type === 'touchmove') {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        }

        const rect = this.getBoundingClientRect();
        const deltaX = clientX - (this.startX + rect.left);
        const deltaY = clientY - (this.startY + rect.top);
        this.moveDistance += Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        let newX = clientX - this.startX;
        let newY = clientY - this.startY;

        const padding = 20;
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;

        this.style.left = Math.min(Math.max(padding, newX), maxX - padding) + 'px';
        this.style.bottom = Math.min(Math.max(padding, window.innerHeight - newY - rect.height), maxY - padding) + 'px';
        this.style.right = 'auto';
    };

    stopDragHandler = e => {
        if (this.isDragging) {
            this.isDragging = false;
            window.removeEventListener('mousemove', this.dragHandler);
            window.removeEventListener('mouseup', this.stopDragHandler);
            window.removeEventListener('touchmove', this.dragHandler);
            window.removeEventListener('touchend', this.stopDragHandler);

            if (this.moveDistance < 5 && !this.show) {
                const target = e.target;
                if (target.tagName.toLowerCase() === 'button' && !target.classList.contains('control-button')) {
                    this.toggleShow();
                }
            }
        }
    };

    toggleShow() {
        this.show = !this.show;
    }

    toggleRecording(e) {
        e.stopPropagation();
        this.isRecording = !this.isRecording;
        
        if (this.isRecording) {
            this.recordingTime = 0;
            this.recordingInterval = setInterval(() => {
                this.recordingTime++;
            }, 1000);
        } else {
            if (this.recordingInterval) {
                clearInterval(this.recordingInterval);
                this.recordingInterval = null;
            }
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    handleSettingChange(e) {
        e.stopPropagation();
        this.currentSetting = e.target.value;
    }

    render() {
        return html`
            ${this.show
                ? html`
                      <div class="container" @mousedown=${this.startDragging} @touchstart=${this.startDragging}>
                          <div class="modal">
                              ${this.isRecording
                                  ? html`
                                        <div class="recording-container">
                                            <div class="recording-indicator">
                                                <div class="recording-dot"></div>
                                                <div class="recording-dot"></div>
                                                <div class="recording-dot"></div>
                                            </div>
                                            <div class="timer">${this.formatTime(this.recordingTime)}</div>
                                        </div>
                                        <button class="done-button" @click=${this.toggleRecording}>Done</button>
                                    `
                                  : html`
                                        <div class="placeholder-text">Ask anything...</div>
                                        <button class="mic-button" @click=${this.toggleRecording}>
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                                                <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                                                <line x1="12" y1="19" x2="12" y2="23"/>
                                                <line x1="8" y1="23" x2="16" y2="23"/>
                                            </svg>
                                        </button>
                                    `}
                              <div class="controls">
                                  <select class="control-select" @change=${this.handleSettingChange}>
                                      ${Object.entries(this.settings).map(
                                          ([name, value]) => html` <option value="${value}" ?selected=${value === this.currentSetting}>${name}</option> `
                                      )}
                                  </select>
                                  <button class="control-button" @click=${this.toggleShow}>Hide</button>
                              </div>
                          </div>
                      </div>
                  `
                : html`
                      <div class="button-container">
                          <div class="drag-handle" @mousedown=${this.startDragging} @touchstart=${this.startDragging}>
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                  <path d="M5 9h14M5 15h14" />
                              </svg>
                          </div>
                          <button @click=${this.toggleShow}>Show Speech to Text</button>
                      </div>
                  `}
        `;
    }

    disconnectedCallback() {
        if (this.recordingInterval) {
            clearInterval(this.recordingInterval);
            this.recordingInterval = null;
        }
    }
}

customElements.define('speech-to-text', SpeechToText);

document.body.appendChild(document.createElement('speech-to-text'));
document.querySelector('speech-to-text').style.zIndex = 99;