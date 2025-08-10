'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { ethers } from 'ethers';
import Button from '@/components/Button';
import styles from './trading.module.css';
import { get, post } from '@/api/base';

const TradingAgentPage = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [portfolio, setPortfolio] = useState(null);
  const [strategies, setStrategies] = useState([]);
  const [selectedStrategy, setSelectedStrategy] = useState('momentum');
  const [marketAnalysis, setMarketAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isTrading, setIsTrading] = useState(false);
  const [tokenAddress, setTokenAddress] = useState('');
  const [tradeAmount, setTradeAmount] = useState('100');
  const [riskLimit, setRiskLimit] = useState('0.2');
  const [privateKey, setPrivateKey] = useState('');
  const [showPrivateKey, setShowPrivateKey] = useState(false);
  
  const user = useSelector((state) => state.user.userInfo);

  // Popular Base tokens for quick selection
  const popularTokens = [
    { symbol: 'WETH', address: '0x4200000000000000000000000000000000000006' },
    { symbol: 'cbETH', address: '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22' },
    { symbol: 'USDbC', address: '0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA' },
    { symbol: 'AERO', address: '0x940181a94A35A4569E4529A3CDfB74e38FD98631' },
    { symbol: 'DEGEN', address: '0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed' },
  ];

  useEffect(() => {
    loadStrategies();
    checkAgentStatus();
  }, []);

  const loadStrategies = async () => {
    try {
      const response = await get('/api/trading/strategies');
      setStrategies(response.strategies || []);
    } catch (error) {
      console.error('Failed to load strategies:', error);
    }
  };

  const checkAgentStatus = async () => {
    try {
      const response = await get('/api/trading/portfolio');
      if (response && !response.error) {
        setPortfolio(response);
        setIsInitialized(true);
      }
    } catch (error) {
      // Agent not initialized yet
      setIsInitialized(false);
    }
  };

  const initializeAgent = async () => {
    if (!privateKey) {
      toast.error('Please enter your private key');
      return;
    }

    try {
      const response = await post('/api/trading/init', {
        privateKey,
        mcpServices: ['playwright', 'coinbase', 'web-browser'],
        strategies: strategies.map(s => s.id),
        riskLimit: parseFloat(riskLimit)
      });

      if (response.success) {
        setIsInitialized(true);
        setPortfolio(response.status);
        setPrivateKey(''); // Clear private key for security
        toast.success('Trading agent initialized successfully!');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to initialize agent');
    }
  };

  const analyzeMarket = async () => {
    if (!tokenAddress) {
      toast.error('Please enter a token address');
      return;
    }

    setIsAnalyzing(true);
    try {
      const response = await post('/api/trading/analyze', {
        tokenAddress
      });

      if (response.success) {
        setMarketAnalysis(response);
        toast.success('Market analysis complete');
      }
    } catch (error) {
      toast.error('Market analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const executeTrade = async (action) => {
    if (!tokenAddress || !tradeAmount) {
      toast.error('Please fill in all trade parameters');
      return;
    }

    setIsTrading(true);
    try {
      const response = await post('/api/trading/trade', {
        strategy: selectedStrategy,
        tokenAddress,
        amount: parseFloat(tradeAmount),
        action
      });

      if (response.success) {
        setPortfolio(response.portfolio);
        toast.success(`Trade executed successfully!`);
        // Clear form
        setTokenAddress('');
        setMarketAnalysis(null);
      }
    } catch (error) {
      toast.error(error.message || 'Trade execution failed');
    } finally {
      setIsTrading(false);
    }
  };

  const stopAgent = async () => {
    if (confirm('Are you sure you want to stop the trading agent? This will close all positions.')) {
      try {
        const response = await post('/api/trading/stop');
        if (response.success) {
          setIsInitialized(false);
          setPortfolio(null);
          toast.success('Trading agent stopped');
        }
      } catch (error) {
        toast.error('Failed to stop agent');
      }
    }
  };

  const refreshPortfolio = async () => {
    try {
      const response = await get('/api/trading/portfolio');
      setPortfolio(response);
    } catch (error) {
      toast.error('Failed to refresh portfolio');
    }
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.authMessage}>
          <h2>Please connect your wallet to use the DeFi Trading Agent</h2>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>AWE DeFi Trading Agent</h1>
        <p className={styles.subtitle}>
          AI-powered trading on Base using AWESOME MCP workflows
        </p>
      </div>

      {!isInitialized ? (
        <div className={styles.initSection}>
          <h2>Initialize Your Trading Agent</h2>
          <div className={styles.initForm}>
            <div className={styles.formGroup}>
              <label>Private Key (for trading wallet)</label>
              <div className={styles.passwordInput}>
                <input
                  type={showPrivateKey ? 'text' : 'password'}
                  value={privateKey}
                  onChange={(e) => setPrivateKey(e.target.value)}
                  placeholder="Enter private key..."
                />
                <button 
                  onClick={() => setShowPrivateKey(!showPrivateKey)}
                  className={styles.toggleButton}
                >
                  {showPrivateKey ? '🙈' : '👁️'}
                </button>
              </div>
              <small>Your key is encrypted and never stored</small>
            </div>

            <div className={styles.formGroup}>
              <label>Risk Limit (%)</label>
              <input
                type="number"
                value={riskLimit * 100}
                onChange={(e) => setRiskLimit((e.target.value / 100).toString())}
                min="5"
                max="50"
                step="5"
              />
              <small>Maximum portfolio exposure</small>
            </div>

            <Button onClick={initializeAgent} className={styles.initButton}>
              Initialize Agent
            </Button>
          </div>
        </div>
      ) : (
        <div className={styles.tradingInterface}>
          {/* Portfolio Overview */}
          <div className={styles.portfolioSection}>
            <div className={styles.sectionHeader}>
              <h2>Portfolio Overview</h2>
              <button onClick={refreshPortfolio} className={styles.refreshButton}>
                🔄 Refresh
              </button>
            </div>
            
            {portfolio && (
              <div className={styles.portfolioGrid}>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Total Value</span>
                  <span className={styles.statValue}>
                    ${portfolio.totalValue?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Total P&L</span>
                  <span className={`${styles.statValue} ${portfolio.totalPnL >= 0 ? styles.profit : styles.loss}`}>
                    {portfolio.totalPnL >= 0 ? '+' : ''}${portfolio.totalPnL?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Active Positions</span>
                  <span className={styles.statValue}>
                    {portfolio.positions?.length || 0}
                  </span>
                </div>
                <div className={styles.statCard}>
                  <span className={styles.statLabel}>Status</span>
                  <span className={`${styles.statValue} ${styles.active}`}>
                    {portfolio.isActive ? '🟢 Active' : '🔴 Inactive'}
                  </span>
                </div>
              </div>
            )}

            {/* Active Positions */}
            {portfolio?.positions?.length > 0 && (
              <div className={styles.positionsSection}>
                <h3>Active Positions</h3>
                <div className={styles.positionsTable}>
                  {portfolio.positions.map((position, index) => (
                    <div key={index} className={styles.positionRow}>
                      <span>{position.asset}</span>
                      <span>Amount: {position.amount.toFixed(4)}</span>
                      <span>Entry: ${position.entryPrice.toFixed(2)}</span>
                      <span>Current: ${position.currentPrice.toFixed(2)}</span>
                      <span className={position.pnl >= 0 ? styles.profit : styles.loss}>
                        P&L: {position.pnlPercent}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Trading Section */}
          <div className={styles.tradingSection}>
            <h2>New Trade</h2>
            
            <div className={styles.tradingForm}>
              <div className={styles.formGroup}>
                <label>Strategy</label>
                <select 
                  value={selectedStrategy}
                  onChange={(e) => setSelectedStrategy(e.target.value)}
                >
                  {strategies.map(strategy => (
                    <option key={strategy.id} value={strategy.id}>
                      {strategy.name} - {strategy.riskLevel} risk
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Token Address</label>
                <input
                  type="text"
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  placeholder="0x..."
                />
                <div className={styles.quickSelect}>
                  {popularTokens.map(token => (
                    <button
                      key={token.symbol}
                      onClick={() => setTokenAddress(token.address)}
                      className={styles.tokenButton}
                    >
                      {token.symbol}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Amount (USDC)</label>
                <input
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(e.target.value)}
                  min="10"
                  step="10"
                />
              </div>

              <Button
                onClick={analyzeMarket}
                disabled={isAnalyzing || !tokenAddress}
                className={styles.analyzeButton}
              >
                {isAnalyzing ? 'Analyzing...' : 'Analyze Market'}
              </Button>

              {/* Market Analysis Results */}
              {marketAnalysis && (
                <div className={styles.analysisResults}>
                  <h3>Market Analysis</h3>
                  <div className={styles.signal}>
                    <span className={styles.signalType}>
                      Signal: <strong className={styles[marketAnalysis.signal.type]}>
                        {marketAnalysis.signal.type.toUpperCase()}
                      </strong>
                    </span>
                    <span className={styles.confidence}>
                      Confidence: {(marketAnalysis.signal.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                  <p className={styles.recommendation}>
                    {marketAnalysis.recommendation}
                  </p>
                  
                  <div className={styles.tradeActions}>
                    <Button
                      onClick={() => executeTrade('buy')}
                      disabled={isTrading}
                      className={`${styles.buyButton} ${styles.tradeButton}`}
                    >
                      Buy
                    </Button>
                    <Button
                      onClick={() => executeTrade('sell')}
                      disabled={isTrading}
                      className={`${styles.sellButton} ${styles.tradeButton}`}
                    >
                      Sell
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Control Panel */}
          <div className={styles.controlPanel}>
            <Button
              onClick={stopAgent}
              className={styles.stopButton}
            >
              Stop Agent
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TradingAgentPage;