// Research Generation and Progress Management
class ResearchEngine {
  constructor() {
    this.currentJob = null;
    this.countdownTimer = null;
    this.refreshTimer = null;
    this.isMinimized = false;
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Toast close button
    document.getElementById('toastClose')?.addEventListener('click', () => {
      this.cancelResearch();
    });

    // Toast minimize button
    document.getElementById('toastMinimize')?.addEventListener('click', () => {
      this.toggleMinimize();
    });
  }

  // Toggle minimize state
  toggleMinimize() {
    const toast = document.getElementById('generationToast');
    const minimizeBtn = document.getElementById('toastMinimize');
    
    this.isMinimized = !this.isMinimized;
    
    if (this.isMinimized) {
      toast.classList.add('minimized');
      minimizeBtn.textContent = '+';
      minimizeBtn.title = 'Expand';
    } else {
      toast.classList.remove('minimized');
      minimizeBtn.textContent = '−';
      minimizeBtn.title = 'Minimize';
    }
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
      }, 7 * 60 * 1000);

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
    const details = toast.querySelector('.toast-details');
    
    // Build descriptive content
    const researchTitle = `Generating ${this.currentJob.data.topic}`;
    const researchDetails = `${this.currentJob.data.params.depth} • ${this.currentJob.data.params.rigor} • ${this.currentJob.data.params.focus}`;
    
    if (title) title.textContent = researchTitle;
    if (subtitle) subtitle.innerHTML = `Estimated time: <span id="timeRemaining">5:00</span>`;
    if (details) details.textContent = researchDetails;
    
    // Reset minimize state
    this.isMinimized = false;
    toast.classList.remove('minimized');
    document.getElementById('toastMinimize').textContent = '−';
    
    toast.style.display = 'block';
  }

  // Start countdown timer
  startCountdownTimer() {
    let timeLeft = CONFIG.GENERATION.ESTIMATED_TIME_MINUTES * 60;
    
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

  // Start periodic refresh of document library
  startPeriodicRefresh() {
    console.log('Starting periodic refresh of document library...');
    
    // Refresh immediately
    this.refreshDocumentLibrary();
    
    // Then refresh every 7 minutes
    this.refreshTimer = setInterval(() => {
      this.refreshDocumentLibrary();
    }, 7 * 60 * 1000);
    
    // Update toast content for refresh mode
    const title = document.querySelector('.toast-title');
    const subtitle = document.querySelector('.toast-subtitle');
    const details = document.querySelector('.toast-details');
    
    if (title) title.textContent = `${this.currentJob.data.topic} In Progress`;
    if (subtitle) subtitle.textContent = 'Checking every 7 minutes...';
    if (details) details.textContent = 'You can continue using the interface normally.';
    
    // Auto-minimize after 10 seconds to get out of the way
    setTimeout(() => {
      if (!this.isMinimized) {
        this.toggleMinimize();
      }
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
    const toast = document.getElementById('generationToast');
    const title = toast.querySelector('.toast-title');
    const subtitle = toast.querySelector('.toast-subtitle');
    const details = toast.querySelector('.toast-details');
    const spinner = document.querySelector('.toast-spinner');
    
    const completionTitle = `${this.currentJob.data.topic} Complete!`;
    
    if (title) title.textContent = completionTitle;
    if (subtitle) subtitle.textContent = 'Ready to view';
    if (details) details.textContent = 'Your document library has been updated.';
    if (spinner) spinner.style.display = 'none';
    
    // Expand if minimized to show completion
    if (this.isMinimized) {
      this.toggleMinimize();
    }
    
    toast.style.display = 'block';
    
    // Hide after 4 seconds
    setTimeout(() => {
      this.finishResearch();
    }, 4000);
  }

  // Finish research and cleanup
  finishResearch() {
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
    this.isMinimized = false;
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
    this.isMinimized = false;
  }

  // Hide generation toast
  hideToast() {
    const toast = document.getElementById('generationToast');
    toast.style.display = 'none';
    toast.classList.remove('minimized');
    
    // Reset toast content
    const title = toast.querySelector('.toast-title');
    const subtitle = toast.querySelector('.toast-subtitle');
    const details = toast.querySelector('.toast-details');
    const spinner = document.querySelector('.toast-spinner');
    
    if (title) title.textContent = 'Generating Research...';
    if (subtitle) subtitle.innerHTML = `Estimated time: <span id="timeRemaining">5:00</span>`;
    if (details) details.textContent = '';
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
