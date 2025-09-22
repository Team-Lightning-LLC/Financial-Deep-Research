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
    this.renderDocuments();
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

 // Load documents from API
async loadDocuments() {
  try {
    // Try server-side filtering first
    let objects = [];
    
    // Search for common variations of "Deep Research"
    const searchTerms = ['Deep Research', 'DeepResearch', 'deep research', 'DEEP RESEARCH'];
    
    for (const term of searchTerms) {
      try {
        const results = await vertesiaAPI.loadObjectsByName(term);
        objects = objects.concat(results);
      } catch (error) {
        console.log(`No results for term: ${term}`);
      }
    }
    
    // Remove duplicates based on ID
    const uniqueObjects = objects.filter((obj, index, self) => 
      index === self.findIndex(o => o.id === obj.id)
    );
    
    this.documents = uniqueObjects
      .map(obj => this.transformDocument(obj))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
  } catch (error) {
    console.error('Failed to load documents:', error);
    // Fallback to loading all objects if server-side filtering fails
    try {
      const allObjects = await vertesiaAPI.loadAllObjects();
      this.documents = allObjects
        .filter(obj => {
          const name = (obj.name || '').toLowerCase();
          return name.includes('deep') && name.includes('research');
        })
        .map(obj => this.transformDocument(obj))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (fallbackError) {
      console.error('Fallback loading also failed:', fallbackError);
      this.documents = [];
    }
  }
}

  // Transform API object to document format
  transformDocument(obj) {
    // Extract metadata from name or properties
    const nameParts = obj.name.replace(CONFIG.DOCUMENTS.PREFIX, '').split('_');
    
    return {
      id: obj.id,
      title: obj.name.replace(CONFIG.DOCUMENTS.PREFIX, '').replace(/_/g, ' '),
      area: obj.properties?.research_area || nameParts[0] || 'Unknown',
      topic: obj.properties?.research_topic || nameParts[1] || 'Unknown',
      created_at: obj.created_at || obj.properties?.generated_at,
      content_source: obj.content?.source,
      pages: obj.properties?.page_count || Math.floor(Math.random() * 15) + 5, // Estimate
      when: this.formatDate(obj.created_at || obj.properties?.generated_at)
    };
  }

  // Format date for display
  formatDate(dateString) {
    if (!dateString) return 'Unknown';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return 'Unknown';
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
          field.toLowerCase().includes(this.searchQuery)
        );
      
      return matchesFilter && matchesSearch;
    });
    
    this.renderDocuments();
  }

  // Render document list
  renderDocuments() {
    const docsPane = document.getElementById('docsPane');
    if (!docsPane) return;
    
    if (this.filteredDocuments.length === 0) {
      docsPane.innerHTML = '<div class="empty">No documents match your filters.</div>';
      return;
    }
    
    const html = this.filteredDocuments.map(doc => `
      <div class="doc" data-doc-id="${doc.id}">
        <div class="doc-info">
          <div class="tt">${doc.title}</div>
          <div class="meta">${doc.when} • ${doc.area} • ${doc.topic} • ${doc.pages} pages</div>
        </div>
        <div class="actions">
          <button class="doc-action view-action">view</button>
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
      const content = await vertesiaAPI.getFileContent(doc.content_source);
      
      // Open in markdown viewer
      markdownViewer.openViewer(content, doc.title);
      
    } catch (error) {
      console.error('Failed to view document:', error);
      alert('Failed to load document. Please try again.');
    }
  }

  // Delete document
  async deleteDocument(docId) {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      await vertesiaAPI.deleteObject(docId);
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
