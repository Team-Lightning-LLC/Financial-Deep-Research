// Main Application Logic
class DeepResearchApp {
  constructor() {
    this.documents = [];
    this.filteredDocuments = [];
    this.currentFilter = 'All';
    this.searchQuery = '';
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadDocuments();
    this.filterAndRenderDocuments();
    console.log('Deep Research Agent initialized');
  }

  setupEventListeners() {
    // Area/Topic selection
    const areaSelect = document.getElementById('area');
    const topicSelect = document.getElementById('narrow');
    const createBtn = document.getElementById('createBtn');

    areaSelect?.addEventListener('change', () => {
      this.updateTopicOptions();
    });

    topicSelect?.addEventListener('change', () => {
      this.updateCreateButton();
    });

    createBtn?.addEventListener('click', () => {
      this.startResearch();
    });

    // Search functionality
    const searchInput = document.getElementById('docSearch');
    searchInput?.addEventListener('input', (e) => {
      this.searchQuery = e.target.value.toLowerCase();
      this.filterAndRenderDocuments();
    });

    // Filter chips
    const filterChips = document.querySelectorAll('.chip');
    filterChips.forEach(chip => {
      chip.addEventListener('click', () => {
        filterChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.currentFilter = chip.dataset.filter;
        this.filterAndRenderDocuments();
      });
    });

    // Segmented controls
    this.setupSegmentedControls();

    // Document actions
    this.setupDocumentActions();
  }

  // Setup segmented control interactions
  setupSegmentedControls() {
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.seg-option');
      if (!btn) return;
      
      const seg = btn.closest('.seg');
      if (!seg) return;
      
      // Update active state
      seg.querySelectorAll('.seg-option').forEach(option => {
        option.classList.remove('is-active');
        option.setAttribute('aria-checked', 'false');
      });
      
      btn.classList.add('is-active');
      btn.setAttribute('aria-checked', 'true');
      
      this.updateContextSummary();
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      
      const seg = e.target.closest('.seg');
      if (!seg) return;
      
      const options = [...seg.querySelectorAll('.seg-option')];
      const currentIndex = options.findIndex(o => o.classList.contains('is-active'));
      const nextIndex = e.key === 'ArrowRight' 
        ? (currentIndex + 1) % options.length
        : (currentIndex - 1 + options.length) % options.length;
      
      // Update active state
      options[currentIndex].classList.remove('is-active');
      options[nextIndex].classList.add('is-active');
      options[nextIndex].focus();
      
      this.updateContextSummary();
      e.preventDefault();
    });
  }

  // Setup document action handlers
  setupDocumentActions() {
    const docsPane = document.getElementById('docsPane');
    
    docsPane?.addEventListener('click', async (e) => {
      const action = e.target.closest('.doc-action');
      if (!action) return;
      
      const docElement = action.closest('.doc');
      const docId = docElement?.dataset.docId;
      
      if (!docId) return;
      
      if (action.classList.contains('view-action')) {
        await this.viewDocument(docId);
      } else if (action.classList.contains('download-action')) {
        await this.downloadDocument(docId);
      } else if (action.classList.contains('delete-action')) {
        await this.deleteDocument(docId);
      }
    });
  }

  // Update topic dropdown based on selected area
  updateTopicOptions() {
    const areaSelect = document.getElementById('area');
    const topicSelect = document.getElementById('narrow');
    
    if (!areaSelect || !topicSelect) return;
    
    const selectedArea = areaSelect.value;
    topicSelect.innerHTML = '<option value="">Choose a topic…</option>';
    
    const topics = CONFIG.RESEARCH_TOPICS[selectedArea] || [];
    topics.forEach(topic => {
      const option = document.createElement('option');
      option.value = topic;
      option.textContent = topic;
      topicSelect.appendChild(option);
    });
    
    topicSelect.disabled = topics.length === 0;
    this.updateCreateButton();
  }

  // Update create button state
  updateCreateButton() {
    const areaSelect = document.getElementById('area');
    const topicSelect = document.getElementById('narrow');
    const createBtn = document.getElementById('createBtn');
    
    if (!areaSelect || !topicSelect || !createBtn) return;
    
    const hasAreaAndTopic = areaSelect.value && topicSelect.value;
    createBtn.disabled = !hasAreaAndTopic;
  }

  // Update context summary
  updateContextSummary() {
    const summary = document.getElementById('ctxSummary');
    if (!summary) return;
    
    const params = this.getResearchParameters();
    const labels = {
      'High-Level': 'High-Level',
      'Focused': 'Focused', 
      'Comprehensive': 'Comprehensive',
      'Essential Points': 'Essential',
      'Detailed Analysis': 'Detailed',
      'Exhaustive Research': 'Exhaustive',
      'Investment Research': 'Investment',
      'Educational Summary': 'Educational',
      'Technical Analysis': 'Technical'
    };
    
    const summaryText = [
      labels[params.depth],
      labels[params.rigor], 
      labels[params.focus]
    ].filter(Boolean).join(' • ');
    
    summary.textContent = summaryText;
  }

  // Get current research parameters
  getResearchParameters() {
    const params = {};
    
    document.querySelectorAll('.seg').forEach(seg => {
      const activeOption = seg.querySelector('.seg-option.is-active');
      if (activeOption) {
        const group = activeOption.dataset.group;
        const value = activeOption.dataset.value;
        if (group && value) {
          params[group] = value;
        }
      }
    });
    
    return params;
  }

  // Start research generation
  async startResearch() {
    const areaSelect = document.getElementById('area');
    const topicSelect = document.getElementById('narrow');
    
    if (!areaSelect?.value || !topicSelect?.value) return;
    
    const researchData = {
      area: areaSelect.value,
      topic: topicSelect.value,
      params: this.getResearchParameters()
    };
    
    await researchEngine.startResearch(researchData);
  }

  // Load documents from API - with detailed debugging
  async loadDocuments() {
    try {
      console.log('Loading documents...');
      
      // Direct API call
      const response = await fetch(`${CONFIG.VERTESIA_API_BASE}/objects?limit=1000&offset=0`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CONFIG.VERTESIA_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }
      
      const allObjects = await response.json();
      console.log('Loaded objects:', allObjects.length);
      
// Load all documents from API - no filtering
async loadDocuments() {
  try {
    console.log('Loading all documents...');
    
    // Direct API call
    const response = await fetch(`${CONFIG.VERTESIA_API_BASE}/objects?limit=1000&offset=0`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CONFIG.VERTESIA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }
    
    const allObjects = await response.json();
    console.log('Loaded all objects:', allObjects.length);
    
    // Transform each document without filtering
    this.documents = [];
    for (const obj of allObjects) {
      try {
        const transformed = this.transformDocument(obj);
        this.documents.push(transformed);
      } catch (error) {
        console.error('Failed to transform:', obj.name, error);
      }
    }
    
    // Sort by date
    this.documents.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    console.log('Final documents array:', this.documents.length);
    
  } catch (error) {
    console.error('Failed to load documents:', error);
    this.documents = [];
  }
}

  // Transform API object to document format
  transformDocument(obj) {
    // Clean up the title - remove common prefixes and make readable
    let title = obj.name || 'Untitled';
    
    // Remove common prefixes
    const prefixes = ['DeepResearch_', 'Deep Research_', 'deep research_', 'DEEP RESEARCH_', 'DEEP RESEARCH:'];
    prefixes.forEach(prefix => {
      if (title.startsWith(prefix)) {
        title = title.substring(prefix.length);
      }
    });
    
    // Replace underscores and hyphens with spaces
    title = title.replace(/[_-]/g, ' ').trim();
    
    // Try to extract area/topic from the name or properties
    let area = 'Unknown';
    let topic = 'Unknown';
    
    // Check if name contains known areas/topics
    const areas = Object.keys(CONFIG.RESEARCH_TOPICS);
    for (const areaName of areas) {
      if (title.toLowerCase().includes(areaName.toLowerCase())) {
        area = areaName;
        break;
      }
    }
    
    // Check for specific topics
    for (const [areaName, topics] of Object.entries(CONFIG.RESEARCH_TOPICS)) {
      for (const topicName of topics) {
        if (title.toLowerCase().includes(topicName.toLowerCase())) {
          area = areaName;
          topic = topicName;
          break;
        }
      }
      if (topic !== 'Unknown') break;
    }
    
    // Use properties if available
    area = obj.properties?.research_area || area;
    topic = obj.properties?.research_topic || topic;
    
    return {
      id: obj.id,
      title: title,
      area: area,
      topic: topic,
      created_at: obj.created_at || obj.properties?.generated_at || new Date().toISOString(),
      content_source: obj.content?.source,
      when: this.formatDate(obj.created_at || obj.properties?.generated_at)
    };
  }

  // Format date for display
  formatDate(dateString) {
    if (!dateString) return 'Recent';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return 'Recent';
    }
  }

  // Filter and render documents
  filterAndRenderDocuments() {
    this.filteredDocuments = this.documents.filter(doc => {
      // Filter by category
      const matchesFilter = this.currentFilter === 'All' || doc.area === this.currentFilter;
      
      // Filter by search query
      const matchesSearch = !this.searchQuery || 
        [doc.title, doc.area, doc.topic].some(field => 
          field && field.toLowerCase().includes(this.searchQuery)
        );
      
      return matchesFilter && matchesSearch;
    });
    
    this.renderDocuments();
  }

  // Render document list - Updated without page counts, with download
  renderDocuments() {
    const docsPane = document.getElementById('docsPane');
    if (!docsPane) {
      console.error('docsPane element not found');
      return;
    }
    
    if (this.filteredDocuments.length === 0) {
      docsPane.innerHTML = '<div class="empty">No documents match your filters.</div>';
      return;
    }
    
    const html = this.filteredDocuments.map(doc => `
      <div class="doc" data-doc-id="${doc.id}">
        <div class="doc-info">
          <div class="tt">${doc.title}</div>
          <div class="meta">${doc.when} • ${doc.area} • ${doc.topic}</div>
        </div>
        <div class="actions">
          <button class="doc-action view-action">view</button>
          <button class="doc-action download-action">download</button>
          <button class="doc-action delete-action">delete</button>
        </div>
      </div>
    `).join('');
    
    docsPane.innerHTML = html;
  }

  // View document
  async viewDocument(docId) {
    try {
      const doc = this.documents.find(d => d.id === docId);
      if (!doc) return;
      
      // Get document content
      const downloadResponse = await fetch(`${CONFIG.VERTESIA_API_BASE}/objects/download-url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.VERTESIA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          file: doc.content_source,
          format: 'original'
        })
      });
      
      if (!downloadResponse.ok) {
        throw new Error(`Failed to get download URL: ${downloadResponse.statusText}`);
      }
      
      const downloadData = await downloadResponse.json();
      
      // Fetch the actual content
      const contentResponse = await fetch(downloadData.url);
      if (!contentResponse.ok) {
        throw new Error(`Failed to download content: ${contentResponse.statusText}`);
      }
      
      const content = await contentResponse.text();
      
      // Open in markdown viewer
      markdownViewer.openViewer(content, doc.title);
      
    } catch (error) {
      console.error('Failed to view document:', error);
      alert('Failed to load document. Please try again.');
    }
  }

  // Download document as PDF
  async downloadDocument(docId) {
    try {
      const doc = this.documents.find(d => d.id === docId);
      if (!doc) return;
      
      console.log('Downloading document:', doc.title);
      
      // Get document content
      const downloadResponse = await fetch(`${CONFIG.VERTESIA_API_BASE}/objects/download-url`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CONFIG.VERTESIA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          file: doc.content_source,
          format: 'original'
        })
      });
      
      if (!downloadResponse.ok) {
        throw new Error(`Failed to get download URL: ${downloadResponse.statusText}`);
      }
      
      const downloadData = await downloadResponse.json();
      
      // Fetch the content
      const contentResponse = await fetch(downloadData.url);
      if (!contentResponse.ok) {
        throw new Error(`Failed to download content: ${contentResponse.statusText}`);
      }
      
      const content = await contentResponse.text();
      
      // Generate PDF using the markdown viewer
      await markdownViewer.generatePDFFromContent(content, doc.title);
      
    } catch (error) {
      console.error('Failed to download document:', error);
      alert('Failed to download document. Please try again.');
    }
  }

  // Delete document
  async deleteDocument(docId) {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const response = await fetch(`${CONFIG.VERTESIA_API_BASE}/objects/${docId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${CONFIG.VERTESIA_API_KEY}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete: ${response.statusText}`);
      }
      
      await this.refreshDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
      alert('Failed to delete document. Please try again.');
    }
  }

  // Refresh document library
  async refreshDocuments() {
    await this.loadDocuments();
    this.filterAndRenderDocuments();
  }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = new DeepResearchApp();
});
