// Research Generation and Progress Management
class ResearchEngine {
  constructor() {
    this.currentJob = null;
    this.pollingTimer = null;
    this.countdownTimer = null;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Toast close button
    document.getElementById('toastClose')?.addEventListener('click', () => {
      this.cancelResearch();
    });
  }

  // Start research generation
  async startResearch(researchData) {
    try {
      // Build research prompt
      const prompt = this.buildResearchPrompt(researchData);
      
      // Execute async research - only send Task
      const jobResponse = await vertesiaAPI.executeAsync({
        Task: prompt
      });

      this.currentJob = {
        id: jobResponse.job_id || jobResponse.id,
        data: researchData,
        startTime: Date.now()
      };

      // Show generation timer
      this.showGenerationProgress();
      
      // Start countdown timer
      this.startCountdownTimer();
      
      // Start polling after estimated time
      setTimeout(() => {
        this.startPolling();
      }, CONFIG.GENERATION.POLLING_START_DELAY_MS);

    } catch (error) {
      console.error('Failed to start research:', error);
      this.showError('Failed to start research generation. Please try again.');
    }
  }

  // Build research prompt from parameters
  buildResearchPrompt(researchData) {
    return `${researchData.topic}: Depth - ${researchData.params.depth}, Rigor - ${researchData.params.rigor}, Focus - ${researchData.params.focus}`;
  }

  // Show generation progress toast
  showGenerationProgress() {
    const toast = document.getElementById('generationToast');
    const title = toast.querySelector('.toast-title');
    const subtitle = toast.querySelector('.toast-subtitle');
    
    if (title) title.textContent = 'Generating Research...';
    if (subtitle) subtitle.innerHTML = `Estimated time: <span id="timeRemaining">5:00</span>`;
    
    toast.style.display = 'block';
  }

  // Start countdown timer
  startCountdownTimer() {
    let timeLeft = CONFIG.GENERATION.ESTIMATED_TIME_MINUTES * 60; // seconds
    
    this.countdownTimer = setInterval(() => {
      const minutes = Math.floor(timeLeft / 60);
      const seconds = timeLeft % 60;
      const display = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      
      const timeElement = document.getElementById('timeRemaining');
      if (timeElement) {
        timeElement.textContent = display;
      }
      
      if (timeLeft <= 0) {
        clearInterval(this.countdownTimer);
        const subtitle = document.querySelector('.toast-subtitle');
        if (subtitle) {
          subtitle.textContent = 'Finalizing research...';
        }
      }
      
      timeLeft--;
    }, 1000);
  }

  // Start polling for completion
  async startPolling() {
    if (!this.currentJob) return;
    
    let attempts = 0;
    const maxAttempts = CONFIG.GENERATION.MAX_POLLING_ATTEMPTS;
    
    this.pollingTimer = setInterval(async () => {
      try {
        attempts++;
        
        if (attempts > maxAttempts) {
          this.showError('Research generation timed out. Please try again.');
          this.cancelResearch();
          return;
        }

        // Check if research document was created
        const completed = await this.checkForCompletion();
        
        if (completed) {
          await this.handleCompletion(completed);
          this.finishResearch();
        }
        
      } catch (error) {
        console.error('Polling error:', error);
        if (attempts > 3) { // Give a few tries before failing
          this.showError('Failed to check research status.');
          this.cancelResearch();
        }
      }
    }, CONFIG.GENERATION.POLLING_INTERVAL_MS);
  }

  // Check for research completion by looking for new documents
  async checkForCompletion() {
    try {
      const objects = await vertesiaAPI.loadAllObjects();
      
      // Look for documents created after job start time
      const recentDocs = objects.filter(obj => {
        const isResearchDoc = obj.name?.includes(CONFIG.DOCUMENTS.PREFIX);
        const createdAfter = new Date(obj.created_at) > new Date(this.currentJob.startTime);
        return isResearchDoc && createdAfter;
      });

      // Return the most recent one
      return recentDocs.length > 0 ? recentDocs[0] : null;
    } catch (error) {
      console.error('Error checking completion:', error);
      return null;
    }
  }

  // Handle research completion
  async handleCompletion(completedDoc) {
    try {
      // Update toast
      const title = document.querySelector('.toast-title');
      const subtitle = document.querySelector('.toast-subtitle');
      const spinner = document.querySelector('.toast-spinner');
      
      if (title) title.textContent = 'Research Complete!';
      if (subtitle) subtitle.textContent = 'Your document is ready to view.';
      if (spinner) spinner.style.display = 'none';
      
      // Refresh document library
      if (window.app) {
        await window.app.refreshDocuments();
      }
      
    } catch (error) {
      console.error('Error handling completion:', error);
    }
  }

  // Finish research and cleanup
  finishResearch() {
    // Clear timers
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    
    // Hide toast after delay
    setTimeout(() => {
      this.hideToast();
      this.resetForm();
    }, 3000);
    
    this.currentJob = null;
  }

  // Cancel current research
  cancelResearch() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    
    this.hideToast();
    this.resetForm();
    this.currentJob = null;
  }

  // Hide generation toast
  hideToast() {
    const toast = document.getElementById('generationToast');
    toast.style.display = 'none';
    
    // Reset toast content
    const title = toast.querySelector('.toast-title');
    const subtitle = toast.querySelector('.toast-subtitle');
    const spinner = toast.querySelector('.toast-spinner');
    
    if (title) title.textContent = 'Generating Research...';
    if (subtitle) subtitle.innerHTML = `Estimated time: <span id="timeRemaining">5:00</span>`;
    if (spinner) spinner.style.display = 'block';
  }

  // Reset form to initial state
  resetForm() {
    const areaSelect = document.getElementById('area');
    const topicSelect = document.getElementById('narrow');
    const createBtn = document.getElementById('createBtn');
    
    if (areaSelect) areaSelect.value = '';
    if (topicSelect) {
      topicSelect.innerHTML = '<option value="">Choose a topic…</option>';
      topicSelect.disabled = true;
    }
    if (createBtn) createBtn.disabled = true;
  }

  // Show error message
  showError(message) {
    // Could enhance this with a proper error toast
    console.error(message);
    alert(message);
  }
}

// Create global instance
const researchEngine = new ResearchEngine();
