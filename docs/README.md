# Deep Research Agent - Technical Documentation

## Architecture Overview

The Deep Research Agent is built as a single-page application with modular JavaScript components that integrate with the Vertesia AI platform.

### Core Components

1. **Configuration Layer** (`config.js`)
   - API credentials and endpoints
   - Research topics and parameters
   - Application settings

2. **API Layer** (`vertesia-api.js`)
   - Wrapper for all Vertesia API calls
   - Error handling and response formatting
   - File operations and object management

3. **Document Processing** (`markdown-viewer.js`)
   - Markdown to HTML conversion
   - Styled document viewing
   - PDF generation with consistent formatting

4. **Research Engine** (`research-engine.js`)
   - AI research generation workflow
   - Progress tracking and polling
   - Job management and completion handling

5. **Application Controller** (`app.js`)
   - UI state management
   - Event handling and user interactions
   - Document library management

### Data Flow

1. **Research Generation**:
