import { useState, useEffect } from 'react'
import axios from 'axios'
import { createWalletClient, custom } from 'viem'
import { baseSepolia } from 'viem/chains'
import { withPaymentInterceptor } from 'x402-axios'

// Base axios instance for regular requests
const baseApiClient = axios.create({
  baseURL: 'http://localhost:9200',
  headers: {
    'Content-Type': 'application/json',
  },
})

function App() {
  const [activeTab, setActiveTab] = useState('publish')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [walletConnected, setWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState(null)
  const [walletClient, setWalletClient] = useState(null)

  // Publish form state
  const [publishForm, setPublishForm] = useState({
    topicId: '',
    trustScore: 85,
    summary: '',
    title: '',
    primarySource: '',
    secondarySource: '',
    contributionType: 'regular',
    walletAddress: '',
    priceUsd: 0,
  })

  const [categoryMetrics, setCategoryMetrics] = useState([
    { name: 'accuracy', value: 0 },
  ])

  const [notableInstances, setNotableInstances] = useState([
    { content: '', category: '' },
  ])

  // Query form state
  const [topicId, setTopicId] = useState('')

  // Search form state
  const [searchForm, setSearchForm] = useState({
    keyword: '',
    minTrustScore: 0,
    maxTrustScore: 100,
    limit: 10,
  })

  const [searchResults, setSearchResults] = useState(null)

  // Check wallet connection on mount
  useEffect(() => {
    checkWalletConnection()
  }, [])

  const checkWalletConnection = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts',
        })
        if (accounts.length > 0) {
          setWalletAddress(accounts[0])
          setWalletConnected(true)
          await initializeWalletClient(accounts[0])
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error)
      }
    }
  }

  const initializeWalletClient = async (address) => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Switch to Base Sepolia if not already on it
        const chainId = await window.ethereum.request({ method: 'eth_chainId' })
        const baseSepoliaChainId = '0x14a34' // 84532 in hex
        
        if (chainId !== baseSepoliaChainId) {
          try {
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: baseSepoliaChainId }],
            })
          } catch (switchError) {
            // Chain not added to MetaMask, add it
            if (switchError.code === 4902) {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: baseSepoliaChainId,
                    chainName: 'Base Sepolia',
                    nativeCurrency: {
                      name: 'Ether',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                    rpcUrls: ['https://sepolia.base.org'],
                    blockExplorerUrls: ['https://sepolia.basescan.org'],
                  },
                ],
              })
            } else {
              throw switchError
            }
          }
        }
        
        const client = createWalletClient({
          account: address,
          chain: baseSepolia,
          transport: custom(window.ethereum),
        })
        
        setWalletClient(client)
        console.log('💳 Wallet client initialized for Base Sepolia payments')
      } catch (error) {
        console.error('Error initializing wallet client:', error)
        alert('Failed to switch to Base Sepolia network: ' + error.message)
      }
    }
  }

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      alert('Please install MetaMask to access paywalled content!')
      window.open('https://metamask.io/download/', '_blank')
      return
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })
      setWalletAddress(accounts[0])
      setWalletConnected(true)
      await initializeWalletClient(accounts[0])
    } catch (error) {
      console.error('Error connecting wallet:', error)
      alert('Failed to connect wallet: ' + error.message)
    }
  }

  const disconnectWallet = () => {
    setWalletAddress(null)
    setWalletConnected(false)
    setWalletClient(null)
  }

  const handlePublish = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResponse(null)

    try {
      // Convert categoryMetrics array to object
      const metricsObj = {}
      categoryMetrics.forEach(metric => {
        if (metric.name && metric.value) {
          metricsObj[metric.name] = parseInt(metric.value)
        }
      })

      // Filter out empty notable instances
      const filteredInstances = notableInstances.filter(
        inst => inst.content && inst.category
      )

      const payload = {
        topicId: publishForm.topicId,
        trustScore: parseInt(publishForm.trustScore),
        summary: publishForm.summary,
        categoryMetrics: metricsObj,
        notableInstances: filteredInstances,
        primarySource: publishForm.primarySource,
        secondarySource: publishForm.secondarySource,
        title: publishForm.title || undefined,
        contributionType: publishForm.contributionType,
      }

      // Add payment fields if user-contributed
      if (publishForm.contributionType === 'User contributed') {
        payload.walletAddress = publishForm.walletAddress
        payload.priceUsd = parseFloat(publishForm.priceUsd)
      }

      const res = await baseApiClient.post('/dkgpedia/community-notes', payload)
      setResponse({ success: true, data: res.data })
    } catch (error) {
      setResponse({ success: false, data: { error: error.message } })
    } finally {
      setLoading(false)
    }
  }

  const handleQuery = async (e) => {
    e.preventDefault()
    setLoading(true)
    setResponse(null)

    try {
      console.log('🔍 Querying topic:', topicId)
      
      // Create payment-enabled client if wallet is connected
      const apiClient = walletClient 
        ? withPaymentInterceptor(baseApiClient, walletClient)
        : baseApiClient
      
      const res = await apiClient.get(`/dkgpedia/community-notes/${topicId}`)
      console.log('✅ Query successful:', res.data)
      setResponse({ success: true, data: res.data })
    } catch (error) {
      console.error('❌ Query error:', error)
      if (error.response?.data) {
        setResponse({ success: false, data: error.response.data })
      } else {
        setResponse({ success: false, data: { error: error.message } })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    setLoading(true)
    setSearchResults(null)

    try {
      const params = new URLSearchParams()
      if (searchForm.keyword) params.append('keyword', searchForm.keyword)
      if (searchForm.minTrustScore > 0)
        params.append('minTrustScore', searchForm.minTrustScore)
      if (searchForm.maxTrustScore < 100)
        params.append('maxTrustScore', searchForm.maxTrustScore)
      params.append('limit', searchForm.limit)

      const res = await baseApiClient.get(`/dkgpedia/community-notes?${params}`)
      setSearchResults(res.data)
    } catch (error) {
      setSearchResults({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  const addCategoryMetric = () => {
    setCategoryMetrics([...categoryMetrics, { name: '', value: 0 }])
  }

  const removeCategoryMetric = (index) => {
    setCategoryMetrics(categoryMetrics.filter((_, i) => i !== index))
  }

  const updateCategoryMetric = (index, field, value) => {
    const updated = [...categoryMetrics]
    updated[index][field] = value
    setCategoryMetrics(updated)
  }

  const addNotableInstance = () => {
    setNotableInstances([...notableInstances, { content: '', category: '' }])
  }

  const removeNotableInstance = (index) => {
    setNotableInstances(notableInstances.filter((_, i) => i !== index))
  }

  const updateNotableInstance = (index, field, value) => {
    const updated = [...notableInstances]
    updated[index][field] = value
    setNotableInstances(updated)
  }

  return (
    <div className="container">
      <div className="header">
        <h1>🌐 DKGPedia</h1>
        <p>Test Interface for Community Notes on Decentralized Knowledge Graph</p>
        
        {/* Wallet Connection */}
        <div style={{ marginTop: '20px' }}>
          {!walletConnected ? (
            <button 
              onClick={connectWallet} 
              className="button button-primary" 
              style={{ maxWidth: '300px', margin: '0 auto' }}
            >
              🦊 Connect MetaMask for Paid Content
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px 20px', borderRadius: '8px', color: 'white' }}>
                ✅ Connected: {walletAddress?.slice(0, 6)}...{walletAddress?.slice(-4)}
              </div>
              <button 
                onClick={disconnectWallet} 
                className="button button-secondary" 
                style={{ width: 'auto', padding: '10px 20px' }}
              >
                Disconnect
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab-button ${activeTab === 'publish' ? 'active' : ''}`}
          onClick={() => setActiveTab('publish')}
        >
          📝 Publish Note
        </button>
        <button
          className={`tab-button ${activeTab === 'query' ? 'active' : ''}`}
          onClick={() => setActiveTab('query')}
        >
          🔍 Query Note
        </button>
        <button
          className={`tab-button ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          🔎 Search Notes
        </button>
      </div>

      {activeTab === 'publish' && (
        <div className="card">
          <h2>Publish Community Note</h2>
          <form onSubmit={handlePublish}>
            <div className="form-row">
              <div className="form-group">
                <label>Topic ID *</label>
                <input
                  type="text"
                  value={publishForm.topicId}
                  onChange={(e) =>
                    setPublishForm({ ...publishForm, topicId: e.target.value })
                  }
                  placeholder="e.g., climate-change-2024"
                  required
                />
              </div>
              <div className="form-group">
                <label>Trust Score (0-100) *</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={publishForm.trustScore}
                  onChange={(e) =>
                    setPublishForm({
                      ...publishForm,
                      trustScore: e.target.value,
                    })
                  }
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Title</label>
              <input
                type="text"
                value={publishForm.title}
                onChange={(e) =>
                  setPublishForm({ ...publishForm, title: e.target.value })
                }
                placeholder="Optional title for the note"
              />
            </div>

            <div className="form-group">
              <label>Summary *</label>
              <textarea
                value={publishForm.summary}
                onChange={(e) =>
                  setPublishForm({ ...publishForm, summary: e.target.value })
                }
                placeholder="Comprehensive summary of findings..."
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Primary Source *</label>
                <input
                  type="text"
                  value={publishForm.primarySource}
                  onChange={(e) =>
                    setPublishForm({
                      ...publishForm,
                      primarySource: e.target.value,
                    })
                  }
                  placeholder="e.g., Research Database 2024"
                  required
                />
              </div>
              <div className="form-group">
                <label>Secondary Source *</label>
                <input
                  type="text"
                  value={publishForm.secondarySource}
                  onChange={(e) =>
                    setPublishForm({
                      ...publishForm,
                      secondarySource: e.target.value,
                    })
                  }
                  placeholder="e.g., Historical Records"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Category Metrics *</label>
              {categoryMetrics.map((metric, index) => (
                <div key={index} style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    placeholder="Category name (e.g., accuracy)"
                    value={metric.name}
                    onChange={(e) =>
                      updateCategoryMetric(index, 'name', e.target.value)
                    }
                    style={{ flex: 2 }}
                  />
                  <input
                    type="number"
                    placeholder="Count"
                    value={metric.value}
                    onChange={(e) =>
                      updateCategoryMetric(index, 'value', e.target.value)
                    }
                    style={{ flex: 1 }}
                  />
                  {categoryMetrics.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCategoryMetric(index)}
                      className="button button-secondary"
                      style={{ width: 'auto', padding: '12px 20px' }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addCategoryMetric}
                className="button button-secondary"
              >
                + Add Metric
              </button>
            </div>

            <div className="form-group">
              <label>Notable Instances (Optional)</label>
              {notableInstances.map((instance, index) => (
                <div key={index} style={{ marginBottom: '15px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                  <input
                    type="text"
                    placeholder="Category"
                    value={instance.category}
                    onChange={(e) =>
                      updateNotableInstance(index, 'category', e.target.value)
                    }
                    style={{ marginBottom: '10px' }}
                  />
                  <textarea
                    placeholder="Content"
                    value={instance.content}
                    onChange={(e) =>
                      updateNotableInstance(index, 'content', e.target.value)
                    }
                    style={{ minHeight: '60px' }}
                  />
                  {notableInstances.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeNotableInstance(index)}
                      className="button button-secondary"
                      style={{ marginTop: '10px' }}
                    >
                      Remove Instance
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addNotableInstance}
                className="button button-secondary"
              >
                + Add Notable Instance
              </button>
            </div>

            <div className="form-group">
              <label>Contribution Type *</label>
              <select
                value={publishForm.contributionType}
                onChange={(e) =>
                  setPublishForm({
                    ...publishForm,
                    contributionType: e.target.value,
                  })
                }
              >
                <option value="regular">Regular (Free)</option>
                <option value="User contributed">User Contributed (Paywalled)</option>
              </select>
            </div>

            {publishForm.contributionType === 'User contributed' && (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label>Wallet Address *</label>
                    <input
                      type="text"
                      value={publishForm.walletAddress}
                      onChange={(e) =>
                        setPublishForm({
                          ...publishForm,
                          walletAddress: e.target.value,
                        })
                      }
                      placeholder="0x..."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Price (USD) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={publishForm.priceUsd}
                      onChange={(e) =>
                        setPublishForm({
                          ...publishForm,
                          priceUsd: e.target.value,
                        })
                      }
                      placeholder="0.50"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="button button-primary"
              disabled={loading}
            >
              {loading ? 'Publishing...' : '🚀 Publish to DKG'}
            </button>
          </form>

          {response && (
            <div
              className={`response-box ${
                response.success ? 'success' : 'error'
              }`}
            >
              <h3>{response.success ? '✅ Success!' : '❌ Error'}</h3>
              <pre>{JSON.stringify(response.data, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {activeTab === 'query' && (
        <div className="card">
          <h2>Query Community Note by Topic ID</h2>
          <form onSubmit={handleQuery}>
            <div className="form-group">
              <label>Topic ID</label>
              <input
                type="text"
                value={topicId}
                onChange={(e) => setTopicId(e.target.value)}
                placeholder="e.g., climate-change-2024"
                required
              />
            </div>

            <button
              type="submit"
              className="button button-primary"
              disabled={loading}
            >
              {loading ? 'Querying...' : '🔍 Query DKG'}
            </button>
          </form>

          {response && (
            <div
              className={`response-box ${
                response.success ? 'success' : 'error'
              }`}
            >
              <h3>
                {response.success ? '✅ Found!' : '❌ Not Found or Error'}
              </h3>
              <pre>{JSON.stringify(response.data, null, 2)}</pre>
            </div>
          )}
        </div>
      )}

      {activeTab === 'search' && (
        <div className="card">
          <h2>Search Community Notes</h2>
          <form onSubmit={handleSearch}>
            <div className="form-group">
              <label>Keyword (Optional)</label>
              <input
                type="text"
                value={searchForm.keyword}
                onChange={(e) =>
                  setSearchForm({ ...searchForm, keyword: e.target.value })
                }
                placeholder="Search in topic ID or title..."
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Min Trust Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={searchForm.minTrustScore}
                  onChange={(e) =>
                    setSearchForm({
                      ...searchForm,
                      minTrustScore: e.target.value,
                    })
                  }
                />
              </div>
              <div className="form-group">
                <label>Max Trust Score</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={searchForm.maxTrustScore}
                  onChange={(e) =>
                    setSearchForm({
                      ...searchForm,
                      maxTrustScore: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="form-group">
              <label>Limit</label>
              <input
                type="number"
                min="1"
                max="100"
                value={searchForm.limit}
                onChange={(e) =>
                  setSearchForm({ ...searchForm, limit: e.target.value })
                }
              />
            </div>

            <button
              type="submit"
              className="button button-primary"
              disabled={loading}
            >
              {loading ? 'Searching...' : '🔎 Search DKG'}
            </button>
          </form>

          {searchResults && (
            <>
              {searchResults.error ? (
                <div className="response-box error">
                  <h3>❌ Error</h3>
                  <pre>{JSON.stringify(searchResults, null, 2)}</pre>
                </div>
              ) : searchResults.found && searchResults.notes.length > 0 ? (
                <div className="notes-grid">
                  <h3 style={{ marginTop: '30px', marginBottom: '10px' }}>
                    Found {searchResults.count} note(s)
                  </h3>
                  {searchResults.notes.map((note, index) => (
                    <div key={index} className="note-card">
                      <h3>{note.title || note.topicId}</h3>
                      <div>
                        <span className="trust-score">
                          Trust Score: {note.trustScore}
                        </span>
                        {note.isPaywalled && (
                          <span className="paywall-badge">
                            💰 ${note.priceUsd} USD
                          </span>
                        )}
                      </div>
                      <p className="summary">{note.summary}</p>
                      <div className="metadata">
                        <div className="metadata-item">
                          <strong>Topic ID:</strong>
                          <span>{note.topicId}</span>
                        </div>
                        <div className="metadata-item">
                          <strong>Contribution Type:</strong>
                          <span>{note.contributionType}</span>
                        </div>
                        {note.walletAddress && (
                          <div className="metadata-item">
                            <strong>Wallet:</strong>
                            <span>{note.walletAddress.slice(0, 10)}...</span>
                          </div>
                        )}
                        {note.ual && (
                          <div className="metadata-item">
                            <strong>UAL:</strong>
                            <span>{note.ual.slice(0, 20)}...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p>No notes found matching your criteria</p>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default App

