// Deep Research Agent Configuration
const CONFIG = {
  // Vertesia API Configuration
  VERTESIA_API_BASE: 'https://api.vertesia.io/api/v1',
  VERTESIA_API_KEY: 'sk-2538a58567e4ebb6654c0a17ceab228c',
  ENVIRONMENT_ID: '681915c6a01fb262a410c161',
  MODEL: 'publishers/anthropic/models/claude-3-7-sonnet',
  
  // Research Agent Configuration
  INTERACTION_NAME: 'AGENTAdvisorDeepResearch',
  
  // Research Topics by Area
  RESEARCH_TOPICS: {
    Markets: ["Employment", "Credit", "Commodities", "Futures", "Inflation", "GDP", "Interest Rates"],
    Sectors: ["Technology", "Healthcare", "Energy", "Financials", "Industrials", "Consumer", "Utilities"],
    Assets: ["NVDA (Equity)", "TSM (Equity)", "ASML (Equity)", "MSFT (Equity)", "AAPL (Equity)", "IONQ (Equity)", "SPGI (Equity)", "CME (Equity)", "VTI (ETF)", "VEA (ETF)", "VWO (ETF)", "BND (ETF)"],
    Concepts: ["ETFs Explained", "Semiconductor Supply Chain", "Tax Strategy", "Treasury Securities", "Options Fundamentals", "Leveraged Investing"]
  },
  
  // Research Generation Settings
  GENERATION: {
    ESTIMATED_TIME_MINUTES: 5,
    POLLING_INTERVAL_MS: 15000, // 15 seconds
    POLLING_START_DELAY_MS: 5 * 60 * 1000, // 5 minutes
    MAX_POLLING_ATTEMPTS: 20
  },
  
  // Document Settings
  DOCUMENTS: {
    PREFIX: 'DeepResearch_',
    BATCH_SIZE: 100
  }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
