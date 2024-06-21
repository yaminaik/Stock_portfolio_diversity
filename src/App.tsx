// src/App.tsx
import React, { useState , useEffect } from 'react';
import axios from 'axios';
import { Container, Typography, Button, List, ListItem, ListItemText, AppBar, Toolbar, Box ,Grid, Paper, Alert, CircularProgress, Snackbar, Alert as MuiAlert,Card, CardContent, CardActions} from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';

interface Stock {
  symbol: string;
  price: number;
  sector: string;
}

const App: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [portfolio, setPortfolio] = useState<Stock[]>([]);
  const [diversityScore, setDiversityScore] = useState(0);
  const [loading, setLoading] = useState(false); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state

  const fetchStocks = async () => {
    try {
      setLoading(true); // Set loading to true before starting the fetch
      setError(null); 
      const apiKey = process.env.REACT_APP_FINNHUB_API_KEY;
      console.log('Finnhub API Key:', apiKey);

      if (!apiKey) {
        throw new Error('API key is not defined');
      }

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
    } catch (error: unknown) {
      console.error('Error fetching stock data:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false); // Set loading to false after fetch completes
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

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#AA336A', '#9933FF', '#33CC33', '#FF6666', '#FF3399', '#66CCFF', '#FF99CC'];

  const sectorData = Object.entries(portfolio.reduce((acc, stock) => {
    acc[stock.sector] = (acc[stock.sector] || 0) + stock.price;
    return acc;
  }, {} as { [key: string]: number })).map(([name, value]) => ({ name, value }));


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
            <Button variant="contained" color="primary" onClick={fetchStocks} disabled={loading}>
              Fetch Stocks
            </Button>
            <Box mt={2}>
              {loading && (
                <Box display="flex" justifyContent="center" my={2}>
                  <CircularProgress />
                </Box>
              )}
              <List>
                {stocks.map(stock => (
                  <Card key={stock.symbol} variant="outlined" style={{ marginBottom: '10px' }}>
                    <CardContent>
                      <Grid container alignItems="center">
                        <Grid item xs={8}>
                          <Typography variant="h5" component="div">
                            {stock.symbol} - ${stock.price.toFixed(2)}
                          </Typography>
                          <Typography color="textSecondary">
                            {stock.sector}
                          </Typography>
                        </Grid>
                        <Grid item xs={4}>
                          <Button variant="outlined" color="secondary" onClick={() => addToPortfolio(stock)}>
                            Add to Portfolio
                          </Button>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                ))}
              </List>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>Portfolio</Typography>
            <Paper>
              <List>
                {portfolio.map(stock => (
                  <ListItem key={stock.symbol}>
                    <ListItemText primary={`${stock.symbol} - $${stock.price.toFixed(2)} - ${stock.sector}`} />
                  </ListItem>
                ))}
              </List>
            </Paper>
            <Typography variant="h5" gutterBottom style={{ marginTop: '20px', color: 'green' }}>
              Portfolio Diversity Score: {diversityScore.toFixed(2)}
            </Typography>
            <PieChart width={400} height={400}>
              <Pie
                data={sectorData}
                cx={200}
                cy={200}
                labelLine={false}
                outerRadius={150}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
              >
                {sectorData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </Grid>
        </Grid>
      </Box>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <MuiAlert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error ? `${error}. Please try again later.` : 'Please try again later.'}
        </MuiAlert>
      </Snackbar>
    </Container>
  );
};

export default App;