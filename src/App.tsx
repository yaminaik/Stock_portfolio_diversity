// src/App.tsx
import React, { useState , useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Button, List, ListItem, ListItemText, AppBar, Toolbar, Box ,Grid, Paper} from '@mui/material';

interface Stock {
  symbol: string;
  price: number;
  sector: string;
}

const App: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<Stock[]>([]);
  const [fetched, setFetched] = useState(false);
  const [diversityScore, setDiversityScore] = useState(0);

  const fetchStocks = async () => {
    try {
      const apiKey = process.env.REACT_APP_FINNHUB_API_KEY;
      const response = await axios.get(`https://finnhub.io/api/v1/stock/symbol?exchange=US&token=${apiKey}`);
      const stockSymbols = response.data.slice(0, 30); // Fetching only 30 stocks for simplicity

      const stockDetails = await Promise.all(stockSymbols.map(async (stock: any) => {
        const quoteResponse = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${apiKey}`);
        const profileResponse = await axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${stock.symbol}&token=${apiKey}`);

        return {
          symbol: stock.symbol,
          price: quoteResponse.data.c,
          sector:profileResponse.data.finnhubIndustry || 'N/A',
        };
      }));

      setStocks(stockDetails);
    } catch (error) {
      console.error('Error fetching stock data:', error);
    }
  };

  const addToPortfolio = (stock: Stock) => {
    setPortfolio([...portfolio, stock]);
  };
  const calculateDiversityScore = () => {
    const sectorWeights: { [key: string]: number } = {};
    let totalValue = 0;

    portfolio.forEach(stock => {
      if (!sectorWeights[stock.sector]) {
        sectorWeights[stock.sector] = 0;
      }
      sectorWeights[stock.sector] += stock.price;
      totalValue += stock.price;
    });

    const diversityScore = 1 - Object.values(sectorWeights)
      .reduce((acc, weight) => acc + Math.pow(weight / totalValue, 2), 0);

    setDiversityScore(diversityScore * 100);
  };

  useEffect(() => {
    if (portfolio.length > 0) {
      calculateDiversityScore();
    }
  }, [portfolio]);


  return (
    <Container>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6">Stock Portfolio Diversity Calculator</Typography>
        </Toolbar>
      </AppBar>
      <Box my={4}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>Stocks List</Typography>
            <Button variant="contained" color="primary" onClick={fetchStocks} disabled={fetched}>Fetch Stocks</Button>
            <List>
              {stocks.map(stock => (
                <ListItem key={stock.symbol}>
                  <ListItemText primary={`${stock.symbol} - $${stock.price} - ${stock.sector}`} />
                  <Button variant="outlined" color="secondary" onClick={() => addToPortfolio(stock)}>Add to Portfolio</Button>
                </ListItem>
              ))}
            </List>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>Portfolio</Typography>
            <Paper>
              <List>
                {portfolio.map(stock => (
                  <ListItem key={stock.symbol}>
                    <ListItemText primary={`${stock.symbol} - $${stock.price} - ${stock.sector}`} />
                  </ListItem>
                ))}
              </List>
            </Paper>
            <Typography variant="h5" gutterBottom style={{ marginTop: '20px', color: 'green' }}>
              Portfolio Diversity Score: {diversityScore.toFixed(2)}
            </Typography>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default App;