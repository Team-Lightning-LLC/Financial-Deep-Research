// Research Generation and Progress Management
class ResearchEngine {
  constructor() {
    this.currentJob = null;
    this.countdownTimer = null;
    this.refreshTimer = null;
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
      
      // Execute async research
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
      
      // Start periodic refresh after 7 minutes
      setTimeout(() => {
        this.startPeriodicRefresh();
      }, 7 * 60 * 1000); // 7 minutes

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
  
  // Build descriptive title with research details
  const researchTitle = `Generating ${this.currentJob.data.topic} Research...`;
  const researchDetails = `${this.currentJob.data.params.depth} • ${this.currentJob.data.params.rigor} • ${this.currentJob.data.params.focus}`;
  
  if (title) title.textContent = researchTitle;
  if (subtitle) subtitle.innerHTML = `${researchDetails}<br>Estimated time: <span id="timeRemaining">5:00</span>`;
  
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
          subtitle.textContent = 'Research in progress... We\'ll refresh your library periodically.';
        }
      }
      
      timeLeft--;
    }, 1000);
  }

 // Start periodic refresh of document library
startPeriodicRefresh() {
  console.log('Starting periodic refresh of document library...');
  
  // Refresh immediately
  this.refreshDocumentLibrary();
  
  // Then refresh every 7 minutes
  this.refreshTimer = setInterval(() => {
    this.refreshDocumentLibrary();
  }, 7 * 60 * 1000); // 7 minutes
  
  // Update toast to show periodic refresh mode with research context
  const title = document.querySelector('.toast-title');
  const subtitle = document.querySelector('.toast-subtitle');
  const researchTitle = `${this.currentJob.data.topic} Research In Progress`;
  
  if (title) title.textContent = researchTitle;
  if (subtitle) subtitle.textContent = 'Checking for completion every 7 minutes...';
  
  // Auto-hide toast after 10 more seconds in this mode
  setTimeout(() => {
    this.hideToast();
  }, 10000);
}

  // Refresh the document library
  async refreshDocumentLibrary() {
    console.log('Refreshing document library...');
    try {
      if (window.app) {
        const previousCount = window.app.documents.length;
        await window.app.refreshDocuments();
        const newCount = window.app.documents.length;
        
        // If we found new documents, show completion
        if (newCount > previousCount) {
          console.log(`Found ${newCount - previousCount} new documents!`);
          this.handleNewDocuments();
        }
      }
    } catch (error) {
      console.error('Error refreshing document library:', error);
    }
  }

 // Handle when new documents are found
handleNewDocuments() {
  // Show brief completion notification with research context
  const toast = document.getElementById('generationToast');
  const title = toast.querySelector('.toast-title');
  const subtitle = toast.querySelector('.toast-subtitle');
  const spinner = document.querySelector('.toast-spinner');
  
  const completionTitle = `${this.currentJob.data.topic} Research Complete!`;
  
  if (title) title.textContent = completionTitle;
  if (subtitle) subtitle.textContent = 'Your document library has been updated.';
  if (spinner) spinner.style.display = 'none';
  
  toast.style.display = 'block';
  
  // Hide after 3 seconds
  setTimeout(() => {
    this.finishResearch();
  }, 3000);
}
  // Finish research and cleanup
  finishResearch() {
    // Clear all timers
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
    }
    
    this.hideToast();
    this.resetForm();
    this.currentJob = null;
  }

  // Cancel current research
  cancelResearch() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
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
    console.error(message);
    alert(message);
  }
}

// Create global instance
const researchEngine = new ResearchEngine();
