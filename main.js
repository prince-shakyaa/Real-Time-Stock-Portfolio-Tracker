const portfolio = new Map();
let chart;

function initChart() {
    const ctx = document.getElementById('portfolioChart').getContext('2d');
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], 
            datasets: [{
                label: 'Portfolio Value',
                data: [],
                borderColor: '#3498db',
                tension: 0.1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

async function fetchStockPrice(symbol) {
    const apiKey = 'qHIeVzmPnX7RQvTIXOFtI3X19tlFFhlUcixW6PV4';  
    const url = `https://yfapi.net/v6/finance/quote?symbols=${symbol}`;

    try {
        const response = await fetch(url, {
            headers: { 'x-api-key': apiKey }
        });

        if (!response.ok) throw new Error('Failed to fetch stock price');

        const data = await response.json();
        const stock = data.quoteResponse.result[0];

        return stock?.regularMarketPrice?.toFixed(2) || null;
    } catch (error) {
        console.error('Error fetching stock price:', error);
        return null;
    }
}

async function addStock() {
    const symbolInput = document.getElementById('stockSymbol');
    const quantityInput = document.getElementById('stockQuantity');
    const symbol = symbolInput.value.toUpperCase();
    const quantity = parseInt(quantityInput.value);

    if (!symbol || isNaN(quantity) || quantity <= 0) {
        alert('Please enter a valid stock symbol and quantity.');
        return;
    }

    const price = await fetchStockPrice(symbol);
    if (!price) {
        alert('Failed to fetch stock price. Please try again.');
        return;
    }

    portfolio.set(symbol, { quantity, price, value: price * quantity });
    updatePortfolioDisplay();
    updateChart();

    symbolInput.value = '';
    quantityInput.value = '';
}

function removeStock(symbol) {
    portfolio.delete(symbol);
    updatePortfolioDisplay();
    updateChart();
}

function updatePortfolioDisplay() {
    const container = document.getElementById('stocksContainer');
    container.innerHTML = '';
    let totalValue = 0;

    portfolio.forEach((stock, symbol) => {
        totalValue += stock.value;
        const stockElement = document.createElement('div');
        stockElement.className = 'stock-item';
        stockElement.innerHTML = `
            <div class="stock-info">
                <span class="stock-symbol">${symbol}</span>
                <span class="stock-price">$${Number(stock.price).toFixed(2)}</span>
                <span class="stock-quantity">Qty: ${stock.quantity}</span>
                <span class="stock-value">Value: $${stock.value.toFixed(2)}</span>
            </div>
            <button class="remove-stock" onclick="removeStock('${symbol}')">Remove</button>
        `;
        container.appendChild(stockElement);
    });

    document.getElementById('totalValue').textContent = totalValue.toFixed(2);
}

function updateChart() {
    const timestamp = new Date().toLocaleTimeString();
    let totalValue = Array.from(portfolio.values()).reduce((sum, stock) => sum + stock.value, 0);

    if (chart.data.labels.length > 10) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
    }

    chart.data.labels.push(timestamp);
    chart.data.datasets[0].data.push(totalValue);
    chart.update();
}

async function updatePrices() {
    for (const [symbol, stock] of portfolio) {
        const newPrice = await fetchStockPrice(symbol);
        if (newPrice) {
            stock.price = newPrice;
            stock.value = newPrice * stock.quantity;
        }
    }
    updatePortfolioDisplay();
    updateChart();
}

document.addEventListener('DOMContentLoaded', () => {
    initChart();
    setInterval(updatePrices, 60000); 
});
