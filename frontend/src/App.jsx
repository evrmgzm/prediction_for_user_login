import React, { useState, useEffect } from 'react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import './App.css';

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: 'name',
    direction: 'ascending'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/index.php');
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data.users || []);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Tahmin yapılamadı';
    try {
      const date = parseISO(dateString);
      return format(date, 'dd MMMM yyyy HH:mm', { locale: tr });
    } catch (err) {
      return 'Geçersiz tarih';
    }
  };

  const getTimeFromNow = (dateString) => {
    if (!dateString) return '';
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: tr });
    } catch (err) {
      return '';
    }
  };

  const getReliabilityScore = (prediction, reliabilityScore) => {
    if (!prediction) return { score: 'Belirsiz', color: 'gray' };
    
    if (reliabilityScore >= 0.8) {
      return { score: 'Yüksek', color: 'green' };
    } else if (reliabilityScore >= 0.5) {
      return { score: 'Orta', color: 'orange' };
    } else {
      return { score: 'Düşük', color: 'red' };
    }
  };

  const getAlgorithmName = (algorithmKey) => {
    const names = {
      'smart_interval': 'Akıllı Aralık Analizi',
      'periodicity': 'Periyodik Örüntü Analizi',
      'dynamic_patterns': 'Dinamik Örüntü Analizi',
      null: 'Belirsiz'
    };
    return names[algorithmKey] || 'Belirsiz';
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortedItems = () => {
    const sortableItems = Array.isArray(users) ? [...users] : []; 
    
    // Filter items based on search term
    const filteredItems = sortableItems.filter(user => {
      if (!user) return false;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        (user.name && user.name.toLowerCase().includes(searchLower)) ||
        (user.id && user.id.toString().includes(searchLower))
      );
    });
    
    // Filter by tab
    const tabFilteredItems = activeTab === 'all' 
      ? filteredItems 
      : filteredItems.filter(user => {
          if (!user || !user.predictions || !user.predictions.best_reliability) return false;
          
          const reliability = user.predictions.best_reliability;
          if (activeTab === 'high') return reliability >= 0.8;
          if (activeTab === 'medium') return reliability >= 0.5 && reliability < 0.8;
          if (activeTab === 'low') return reliability < 0.5;
          return true;
        });
    
    if (sortConfig.key && tabFilteredItems.length > 0) {
      tabFilteredItems.sort((a, b) => {
        const valA = a && a[sortConfig.key] !== undefined ? a[sortConfig.key] : '';
        const valB = b && b[sortConfig.key] !== undefined ? b[sortConfig.key] : '';

        if (valA < valB) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return tabFilteredItems;
  };
  
  const algorithmDescriptions = {
    smart_interval: "Akıllı Aralık Analizi: Kullanıcının giriş zamanları arasındaki genel, günlük ve haftalık aralık örüntülerini analiz ederek tahmin yapar.",
    periodicity: "Periyodik Örüntü Analizi: Haftalık ve günlük dönemselliği analiz ederek, kullanıcının geçmiş giriş kalıplarını öğrenir ve bu kalıplara dayalı olarak tahmin yapar.",
    dynamic_patterns: "Dinamik Örüntü Analizi: Kullanıcının giriş zamanlarını farklı zaman ölçeklerinde analiz ederek, kişiselleştirilmiş tahmin yapar."
  };

  const handleRefresh = () => {
    fetchData();
  };

  const getTruncatedCellContent = (content) => {
    return { __html: content.length > 20 ? `${content.substring(0, 20)}...` : content };
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="status-message-container loading">
          <div className="spinner"></div>
          <p>Veriler yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="status-message-container error">
          <div className="error-icon">❌</div>
          <p>Hata: {error}</p>
          <button className="retry-button" onClick={handleRefresh}>
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  const sortedUsers = getSortedItems();

  return (
    <div className="app-container">
      <div className="container">
        <header className="card">
          <h1 className="card-title">Kullanıcı Giriş Tahmin Sistemi</h1>
          <p>Bu uygulama, kullanıcıların geçmiş giriş davranışlarını analiz ederek bir sonraki olası giriş zamanlarını tahmin eder.</p>
        </header>
        
        <div className="card algorithm-info">
          <h2 className="card-title">Geliştirilmiş Tahmin Algoritmaları</h2>
          <ul>
            {Object.entries(algorithmDescriptions).map(([key, description]) => (
              <li key={key}>
                <strong>{description.split(':')[0]}:</strong> {description.split(':')[1]}
              </li>
            ))}
          </ul>
        </div>

        <div className="card user-table-card">
          <div className="table-header">
            <h2 className="card-title">Kullanıcı Tahminleri</h2>
            <div className="table-actions">
              <div className="search-container">
                <input
                  type="text"
                  placeholder="Kullanıcı ara..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="search-input"
                />
                {searchTerm && (
                  <button 
                    className="clear-search" 
                    onClick={() => setSearchTerm('')}
                    aria-label="Aramayı temizle"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button className="refresh-button" onClick={handleRefresh} aria-label="Yenile">
                ↻
              </button>
            </div>
          </div>
          
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => handleTabChange('all')}
            >
              Tümü
            </button>
            <button 
              className={`tab ${activeTab === 'high' ? 'active' : ''}`}
              onClick={() => handleTabChange('high')}
            >
              Yüksek Güvenilirlik
            </button>
            <button 
              className={`tab ${activeTab === 'medium' ? 'active' : ''}`}
              onClick={() => handleTabChange('medium')}
            >
              Orta Güvenilirlik
            </button>
            <button 
              className={`tab ${activeTab === 'low' ? 'active' : ''}`}
              onClick={() => handleTabChange('low')}
            >
              Düşük Güvenilirlik
            </button>
          </div>
          
          {sortedUsers.length > 0 ? (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th onClick={() => requestSort('id')} className="sortable-header">
                      Kullanıcı ID
                      {sortConfig.key === 'id' && (
                        <span className="sort-indicator">{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
                      )}
                    </th>
                    <th onClick={() => requestSort('name')} className="sortable-header">
                      Kullanıcı Adı
                      {sortConfig.key === 'name' && (
                        <span className="sort-indicator">{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
                      )}
                    </th>
                    <th>Son Giriş</th>
                    <th className="highlighted-column">En İyi Tahmin</th>
                    <th className="collapsible-column">Akıllı Aralık</th>
                    <th className="collapsible-column">Periyodik Örüntü</th>
                    <th className="collapsible-column">Dinamik Örüntü</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((user) => (
                    user && user.id ? (
                      <tr key={user.id}>
                        <td data-label="ID">{user.id}</td>
                        <td data-label="Kullanıcı">{user.name}</td>
                        <td data-label="Son Giriş">
                          <div className="cell-content">
                            <div className="time-value">{formatDate(user.last_login)}</div>
                            <div className="time-ago">{getTimeFromNow(user.last_login)}</div>
                          </div>
                        </td>
                        <td data-label="En İyi Tahmin" className="highlighted-column">
                          <div className="cell-content">
                            <div className="time-value">{formatDate(user.predictions?.best_prediction)}</div>
                            <div className="time-ago">{getTimeFromNow(user.predictions?.best_prediction)}</div>
                            {user.predictions?.best_prediction && (
                              <>
                                <div className={`accuracy-indicator ${
                                  getReliabilityScore(user.predictions.best_prediction, user.predictions.best_reliability).score === 'Yüksek' ? 'high' : 
                                  getReliabilityScore(user.predictions.best_prediction, user.predictions.best_reliability).score === 'Orta' ? 'medium' : 'low'}`}>
                                  {getReliabilityScore(user.predictions.best_prediction, user.predictions.best_reliability).score} 
                                  ({Math.round(user.predictions.best_reliability * 100)}%)
                                </div>
                                <div className="best-algorithm">
                                  {getAlgorithmName(user.predictions.best_algorithm)}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        <td data-label="Akıllı Aralık" className="collapsible-column">
                          <div className="cell-content">
                            <div className="time-value">{formatDate(user.predictions?.smart_interval)}</div>
                            <div className="time-ago">{getTimeFromNow(user.predictions?.smart_interval)}</div>
                            {user.predictions?.smart_interval && user.predictions?.reliability && (
                              <div 
                                className={`accuracy-indicator ${getReliabilityScore(user.predictions.smart_interval, user.predictions.reliability.smart_interval).score === 'Yüksek' ? 'high' : 
                                          getReliabilityScore(user.predictions.smart_interval, user.predictions.reliability.smart_interval).score === 'Orta' ? 'medium' : 'low'}`}
                              >
                                {getReliabilityScore(user.predictions.smart_interval, user.predictions.reliability.smart_interval).score}
                              </div>
                            )}
                          </div>
                        </td>
                        <td data-label="Periyodik Örüntü" className="collapsible-column">
                          <div className="cell-content">
                            <div className="time-value">{formatDate(user.predictions?.periodicity)}</div>
                            <div className="time-ago">{getTimeFromNow(user.predictions?.periodicity)}</div>
                            {user.predictions?.periodicity && user.predictions?.reliability && (
                              <div 
                                className={`accuracy-indicator ${getReliabilityScore(user.predictions.periodicity, user.predictions.reliability.periodicity).score === 'Yüksek' ? 'high' : 
                                          getReliabilityScore(user.predictions.periodicity, user.predictions.reliability.periodicity).score === 'Orta' ? 'medium' : 'low'}`}
                              >
                                {getReliabilityScore(user.predictions.periodicity, user.predictions.reliability.periodicity).score}
                              </div>
                            )}
                          </div>
                        </td>
                        <td data-label="Dinamik Örüntü" className="collapsible-column">
                          <div className="cell-content">
                            <div className="time-value">{formatDate(user.predictions?.dynamic_patterns)}</div>
                            <div className="time-ago">{getTimeFromNow(user.predictions?.dynamic_patterns)}</div>
                            {user.predictions?.dynamic_patterns && user.predictions?.reliability && (
                              <div 
                                className={`accuracy-indicator ${getReliabilityScore(user.predictions.dynamic_patterns, user.predictions.reliability.dynamic_patterns).score === 'Yüksek' ? 'high' : 
                                          getReliabilityScore(user.predictions.dynamic_patterns, user.predictions.reliability.dynamic_patterns).score === 'Orta' ? 'medium' : 'low'}`}
                              >
                                {getReliabilityScore(user.predictions.dynamic_patterns, user.predictions.reliability.dynamic_patterns).score}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : null
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <p>{searchTerm ? 'Arama kriterlerine uygun kullanıcı bulunamadı.' : 'Görüntülenecek kullanıcı bulunamadı.'}</p>
              {searchTerm && (
                <button className="clear-filter-button" onClick={() => setSearchTerm('')}>
                  Aramayı Temizle
                </button>
              )}
            </div>
          )}
          
          <div className="table-footer">
            <p className="record-count">
              Toplam: <span>{sortedUsers.length}</span> kullanıcı {searchTerm && 'filtrelendi'}
            </p>
          </div>
        </div>
        
        <footer className="footer-info">
          <p>© 2025 Kullanıcı Giriş Tahmin Sistemi</p>
        </footer>
      </div>
    </div>
  );
}

export default App;