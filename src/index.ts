import app, { initializeData } from './app';

const PORT = process.env.PORT || 3000;

// Initialize data (instant startup + background scraping)
initializeData();

// Start server immediately
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║     E-Commerce Search Engine API                          ║
║     Server running on http://localhost:${PORT}               ║
╠═══════════════════════════════════════════════════════════╣
║  Endpoints:                                               ║
║  • GET  /health                     - Health check        ║
║  • GET  /api                        - API documentation   ║
║  • POST /api/v1/product             - Create product      ║
║  • PUT  /api/v1/product/meta-data   - Update metadata     ║
║  • GET  /api/v1/search/product      - Search products     ║
╚═══════════════════════════════════════════════════════════╝
  `);
});
