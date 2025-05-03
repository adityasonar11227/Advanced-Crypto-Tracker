// Variables
const apiBaseUrl = 'https://api.coingecko.com/api/v3';
let currentPage = 'home';
let previousPage = 'home';
let selectedCoin = null;

// DOM Elements
const homePage = document.getElementById('homePage');
const searchPage = document.getElementById('searchPage');
const detailsPage = document.getElementById('detailsPage');
const cryptoCards = document.getElementById('cryptoCards');
const searchForm = document.getElementById('searchForm');
const searchInput = document.getElementById('searchInput');
const searchResults = document.getElementById('searchResults');
const coinDetails = document.getElementById('coinDetails');
const navSearchBtn = document.getElementById('navSearchBtn');
const backToHomeBtn = document.getElementById('backToHomeBtn');
const backBtn = document.getElementById('backBtn');

// Event Listeners
document.addEventListener('DOMContentLoaded', initialize);
navSearchBtn.addEventListener('click', navigateToSearch);
backToHomeBtn.addEventListener('click', navigateToHome);
backBtn.addEventListener('click', handleBackButton);
searchForm.addEventListener('submit', handleSearch);

// Functions
function initialize() {
    fetchTopCryptos();
}

function showPage(pageId) {
    previousPage = currentPage;
    currentPage = pageId;
    
    // Hide all pages
    homePage.classList.add('hidden');
    searchPage.classList.add('hidden');
    detailsPage.classList.add('hidden');
    
    // Show selected page
    document.getElementById(pageId + 'Page').classList.remove('hidden');
    
    // Reset scroll position
    window.scrollTo(0, 0);
}

function navigateToHome(e) {
    if (e) e.preventDefault();
    showPage('home');
}

function navigateToSearch(e) {
    if (e) e.preventDefault();
    showPage('search');
    searchInput.focus();
}

function navigateToDetails(coinId) {
    selectedCoin = coinId;
    showPage('details');
    fetchCoinDetails(coinId);
}

function handleBackButton(e) {
    e.preventDefault();
    if (previousPage === 'search') {
        navigateToSearch();
    } else {
        navigateToHome();
    }
}

async function fetchTopCryptos() {
    try {
        showLoading(cryptoCards);
        
        const response = await fetch(`${apiBaseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=12&page=1&sparkline=false`);
        const data = await response.json();
        
        displayCryptoCards(data, cryptoCards);
    } catch (error) {
        console.error('Error fetching top cryptocurrencies:', error);
        cryptoCards.innerHTML = `<p>Failed to load cryptocurrencies. Please try again later.</p>`;
    }
}

async function handleSearch(e) {
    e.preventDefault();
    const query = searchInput.value.trim();
    
    if (query.length < 2) {
        searchResults.innerHTML = `<p>Please enter at least 2 characters to search</p>`;
        return;
    }
    
    try {
        showLoading(searchResults);
        
        const response = await fetch(`${apiBaseUrl}/search?query=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.coins && data.coins.length > 0) {
            const coinIds = data.coins.slice(0, 10).map(coin => coin.id).join(',');
            const coinsResponse = await fetch(`${apiBaseUrl}/coins/markets?vs_currency=usd&ids=${coinIds}&order=market_cap_desc&per_page=10&page=1&sparkline=false`);
            const coinsData = await coinsResponse.json();
            
            displayCryptoCards(coinsData, searchResults);
        } else {
            searchResults.innerHTML = `<p>No cryptocurrencies found matching "${query}"</p>`;
        }
    } catch (error) {
        console.error('Error searching cryptocurrencies:', error);
        searchResults.innerHTML = `<p>Failed to search cryptocurrencies. Please try again later.</p>`;
    }
}

async function fetchCoinDetails(coinId) {
    try {
        showLoading(coinDetails);
        
        const response = await fetch(`${apiBaseUrl}/coins/${coinId}?localization=false&tickers=false&market_data=true&community_data=false&developer_data=false&sparkline=false`);
        const data = await response.json();
        
        displayCoinDetails(data);
    } catch (error) {
        console.error('Error fetching coin details:', error);
        coinDetails.innerHTML = `<p>Failed to load cryptocurrency details. Please try again later.</p>`;
    }
}

function displayCryptoCards(cryptos, container) {
    if (!cryptos || cryptos.length === 0) {
        container.innerHTML = `<p>No cryptocurrencies found</p>`;
        return;
    }
    
    let cardsHTML = '';
    
    cryptos.forEach(crypto => {
        const priceChangeClass = crypto.price_change_percentage_24h >= 0 ? 'positive' : 'negative';
        const priceChangeSymbol = crypto.price_change_percentage_24h >= 0 ? '+' : '';
        
        cardsHTML += `
            <div class="card" data-id="${crypto.id}" onclick="navigateToDetails('${crypto.id}')">
                <div class="card-header">
                    <div class="coin-name">
                        <img src="${crypto.image}" alt="${crypto.name}">
                        ${crypto.name}
                    </div>
                    <div class="price-change ${priceChangeClass}">
                        ${priceChangeSymbol}${crypto.price_change_percentage_24h ? crypto.price_change_percentage_24h.toFixed(2) : '0.00'}%
                    </div>
                </div>
                <div class="card-body">
                    <div class="price">$${formatPrice(crypto.current_price)}</div>
                    <div class="crypto-stats">
                        <div class="stat-item">
                            <span class="stat-label">Market Cap</span>
                            <span class="stat-value">$${formatLargeNumber(crypto.market_cap)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">24h Volume</span>
                            <span class="stat-value">$${formatLargeNumber(crypto.total_volume)}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Rank</span>
                            <span class="stat-value">#${crypto.market_cap_rank || 'N/A'}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Symbol</span>
                            <span class="stat-value">${crypto.symbol.toUpperCase()}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = cardsHTML;
}

function displayCoinDetails(coin) {
    const priceChangeClass = coin.market_data.price_change_percentage_24h >= 0 ? 'positive' : 'negative';
    const priceChangeSymbol = coin.market_data.price_change_percentage_24h >= 0 ? '+' : '';
    
    const detailsHTML = `
        <div class="details-header">
            <div class="coin-info">
                <img src="${coin.image.large}" alt="${coin.name}">
                <div class="coin-details">
                    <span class="coin-symbol">${coin.symbol.toUpperCase()}</span>
                    <h1 class="coin-title">${coin.name}</h1>
                </div>
            </div>
            <div class="price-container">
                <span class="price-large">$${formatPrice(coin.market_data.current_price.usd)}</span>
                <span class="price-change-large ${priceChangeClass}">
                    ${priceChangeSymbol}${coin.market_data.price_change_percentage_24h.toFixed(2)}%
                </span>
            </div>
        </div>
        <div class="details-body">
            <div class="details-section">
                <h3 class="section-title">Market Data</h3>
                <div class="market-data">
                    <div class="data-item">
                        <div class="data-label">Market Cap</div>
                        <div class="data-value">$${formatLargeNumber(coin.market_data.market_cap.usd)}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">24h Volume</div>
                        <div class="data-value">$${formatLargeNumber(coin.market_data.total_volume.usd)}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">24h High</div>
                        <div class="data-value">$${formatPrice(coin.market_data.high_24h.usd)}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">24h Low</div>
                        <div class="data-value">$${formatPrice(coin.market_data.low_24h.usd)}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Circulating Supply</div>
                        <div class="data-value">${formatLargeNumber(coin.market_data.circulating_supply)} ${coin.symbol.toUpperCase()}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">Max Supply</div>
                        <div class="data-value">${coin.market_data.max_supply ? formatLargeNumber(coin.market_data.max_supply) : 'Unlimited'} ${coin.symbol.toUpperCase()}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">All-Time High</div>
                        <div class="data-value">$${formatPrice(coin.market_data.ath.usd)}</div>
                    </div>
                    <div class="data-item">
                        <div class="data-label">All-Time Low</div>
                        <div class="data-value">$${formatPrice(coin.market_data.atl.usd)}</div>
                    </div>
                </div>
            </div>
            <div class="details-section">
                <h3 class="section-title">About ${coin.name}</h3>
                <div class="description">
                    ${coin.description.en ? coin.description.en.slice(0, 400) + '...' : 'No description available.'}
                </div>
            </div>
            <div class="chart-container">
                <h3 class="section-title">Price Chart (Coming Soon)</h3>
                <p>Historical price chart will be available in the next update.</p>
            </div>
        </div>
    `;
    
    coinDetails.innerHTML = detailsHTML;
}

function showLoading(container) {
    container.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
        </div>
    `;
}

function formatPrice(price) {
    if (price >= 1000) {
        return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else if (price >= 1) {
        return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 });
    } else {
        return price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
    }
}

function formatLargeNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(2) + 'B';
    } else if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    } else {
        return num.toFixed(2);
    }
}