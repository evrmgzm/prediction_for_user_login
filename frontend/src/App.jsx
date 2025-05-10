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
  const [lastRefreshed, setLastRefreshed] = useState(null); // Yeni state: Son yenilenme zamanı

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      return JSON.parse(savedMode);
    }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prevMode => !prevMode);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null); // Önceki hataları temizle
      const response = await fetch('http://localhost:8000/index.php');
      
      if (!response.ok) {
        throw new Error(`HTTP hatası! Durum: ${response.status}`);
      }
      
      const data = await response.json();
      setUsers(data.users || []);
      setLastRefreshed(new Date()); // Veri çekildiğinde zaman damgasını güncelle
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setUsers([]); // Hata durumunda kullanıcıları temizle
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Tahmin yapılamadı';
    try {
      const date = parseISO(dateString);
      return format(date, 'dd MMMM yyyy HH:mm', { locale: tr });
    } catch (err) {
      console.error("Tarih formatlama hatası:", dateString, err);
      return 'Geçersiz tarih';
    }
  };

  const getTimeFromNow = (dateString) => {
    if (!dateString) return '';
    try {
      const date = parseISO(dateString);
      return formatDistanceToNow(date, { addSuffix: true, locale: tr });
    } catch (err) {
      console.error("Zaman farkı hesaplama hatası:", dateString, err);
      return '';
    }
  };

  const getReliabilityScore = (prediction, reliabilityScore) => {
    // reliabilityScore'un sayı olup olmadığını kontrol et
    const scoreValue = Number(reliabilityScore);
    if (!prediction || isNaN(scoreValue)) return { score: 'Belirsiz', color: 'gray', icon: '❓' };
    
    if (scoreValue >= 0.8) {
      return { score: 'Yüksek', color: 'green', icon: '✔️' };
    } else if (scoreValue >= 0.5) {
      return { score: 'Orta', color: 'orange', icon: '〰️' };
    } else {
      return { score: 'Düşük', color: 'red', icon: '⚠️' };
    }
  };

  const getAlgorithmName = (algorithmKey) => {
    const names = {
      'smart_interval': 'Akıllı Aralık Analizi',
      'periodicity': 'Periyodik Örüntü Analizi',
      'dynamic_patterns': 'Dinamik Örüntü Analizi',
      null: 'Belirsiz'
    };
    return names[algorithmKey] || 'Bilinmeyen Algoritma';
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
    
    const filteredItems = sortableItems.filter(user => {
      if (!user) return false;
      
      const searchLower = searchTerm.toLowerCase();
      const nameMatch = user.name && user.name.toLowerCase().includes(searchLower);
      const idMatch = user.id && user.id.toString().toLowerCase().includes(searchLower);
      return nameMatch || idMatch;
    });
    
    const tabFilteredItems = activeTab === 'all' 
      ? filteredItems 
      : filteredItems.filter(user => {
          if (!user || !user.predictions || user.predictions.best_reliability === undefined || user.predictions.best_reliability === null) return false;
          
          const reliability = Number(user.predictions.best_reliability);
          if (isNaN(reliability)) return false;

          if (activeTab === 'high') return reliability >= 0.8;
          if (activeTab === 'medium') return reliability >= 0.5 && reliability < 0.8;
          if (activeTab === 'low') return reliability < 0.5;
          return true; // 'all' veya bilinmeyen bir sekme için
        });
    
    if (sortConfig.key && tabFilteredItems.length > 0) {
      tabFilteredItems.sort((a, b) => {
        // Hem a hem de b'nin varlığını ve sortConfig.key'e sahip olup olmadığını kontrol et
        if (!a || a[sortConfig.key] === undefined || a[sortConfig.key] === null) return 1; // a'yı sona taşı
        if (!b || b[sortConfig.key] === undefined || b[sortConfig.key] === null) return -1; // b'yi sona taşı
        
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'ascending' 
            ? valA.localeCompare(valB, tr, { sensitivity: 'base' }) 
            : valB.localeCompare(valA, tr, { sensitivity: 'base' });
        } else {
          if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
          if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  if (loading && !users.length) { // Sadece ilk yüklemede tam ekran yükleme göster
    return (
      <div className="container">
        <div className="status-message-container loading">
          <div className="spinner"></div>
          <p>Veriler yükleniyor, lütfen bekleyin...</p>
        </div>
      </div>
    );
  }

  if (error && !users.length) { // Sadece veri yokken ve hata varsa tam ekran hata göster
    return (
      <div className="container">
        <div className="status-message-container error">
          <div className="error-icon">🚫</div>
          <p>Bir hata oluştu: {error}</p>
          <button className="retry-button" onClick={handleRefresh}>
            <span role="img" aria-label="Yeniden dene ikonu">🔄</span> Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  const sortedUsers = getSortedItems();
  const reliabilityLevels = {
    'Yüksek': 'high',
    'Orta': 'medium',
    'Düşük': 'low',
    'Belirsiz': 'unknown'
  };

  return (
    <div className="app-container">
      <div className="container">
        <header className="card header-card">
          <div className="header-text-content">
            <h1 className="card-title">Kullanıcı Giriş Tahmin Sistemi</h1>
            <p>Bu platform, kullanıcı davranışlarını analiz ederek gelecekteki giriş zamanlarını gelişmiş algoritmalarla tahmin eder.</p>
          </div>
          <button 
            onClick={toggleDarkMode} 
            className="dark-mode-toggle"
            aria-label={isDarkMode ? "Açık moda geç" : "Koyu moda geç"}
            title={isDarkMode ? "Açık moda geç" : "Koyu moda geç"}
          >
            <span className="icon-sun">☀️</span>
            <span className="icon-moon">🌙</span>
          </button>
        </header>
        
        <div className="card algorithm-info">
          <h2 className="card-title">✨ Gelişmiş Tahmin Algoritmaları</h2>
          <ul>
            {Object.entries(algorithmDescriptions).map(([key, description]) => (
              <li key={key}>
                <strong>{getAlgorithmName(key)}:</strong> {description.substring(description.indexOf(':') + 1).trim()}
              </li>
            ))}
          </ul>
        </div>

        <div className="card user-table-card">
          <div className="table-header">
            <h2 className="card-title">👤 Kullanıcı Tahminleri</h2>
            <div className="table-actions">
              <div className="search-container">
                <span className="search-icon" aria-hidden="true">🔍</span>
                <input
                  type="text"
                  placeholder="ID veya Kullanıcı Adı ile Ara..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="search-input"
                  aria-label="Kullanıcı arama alanı"
                />
                {searchTerm && (
                  <button 
                    className="clear-search" 
                    onClick={() => setSearchTerm('')}
                    aria-label="Aramayı temizle"
                    title="Aramayı temizle"
                  >
                    ✕
                  </button>
                )}
              </div>
              <button className="refresh-button" onClick={handleRefresh} aria-label="Verileri yenile" title="Verileri Yenile">
                {loading ? <div className="button-spinner"></div> : '🔄'}
              </button>
            </div>
          </div>
          
          {lastRefreshed && (
            <div className="last-refreshed-info">
              Son Güncelleme: {format(lastRefreshed, 'dd MMMM yyyy HH:mm:ss', { locale: tr })}
            </div>
          )}
          
          <div className="tabs">
            {['all', 'high', 'medium', 'low'].map(tabKey => (
              <button 
                key={tabKey}
                className={`tab ${activeTab === tabKey ? 'active' : ''}`}
                onClick={() => handleTabChange(tabKey)}
              >
                {tabKey === 'all' ? 'Tümü' : 
                 tabKey === 'high' ? '🛡️ Yüksek Güv.' :
                 tabKey === 'medium' ? '⚖️ Orta Güv.' : 
                 '📉 Düşük Güv.'}
              </button>
            ))}
          </div>
          
          {sortedUsers.length > 0 ? (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th onClick={() => requestSort('id')} className="sortable-header">
                      ID
                      {sortConfig.key === 'id' && (
                        <span className="sort-indicator">{sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th onClick={() => requestSort('name')} className="sortable-header">
                      Kullanıcı Adı
                      {sortConfig.key === 'name' && (
                        <span className="sort-indicator">{sortConfig.direction === 'ascending' ? ' ↑' : ' ↓'}</span>
                      )}
                    </th>
                    <th>Son Giriş</th>
                    <th className="highlighted-column">🔮 En İyi Tahmin</th>
                    <th className="collapsible-column">🧠 Akıllı Aralık</th>
                    <th className="collapsible-column">🕰️ Periyodik Örüntü</th>
                    <th className="collapsible-column">📈 Dinamik Örüntü</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((user) => {
                    if (!user || !user.id) return null;
                    const bestPredictionInfo = getReliabilityScore(user.predictions?.best_prediction, user.predictions?.best_reliability);
                    const smartIntervalInfo = getReliabilityScore(user.predictions?.smart_interval, user.predictions?.reliability?.smart_interval);
                    const periodicityInfo = getReliabilityScore(user.predictions?.periodicity, user.predictions?.reliability?.periodicity);
                    const dynamicPatternsInfo = getReliabilityScore(user.predictions?.dynamic_patterns, user.predictions?.reliability?.dynamic_patterns);

                    return (
                      <tr key={user.id}>
                        <td data-label="ID">{user.id}</td>
                        <td data-label="Kullanıcı Adı">{user.name}</td>
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
                                <div className={`accuracy-indicator ${reliabilityLevels[bestPredictionInfo.score]}`}>
                                  <span className="accuracy-icon">{bestPredictionInfo.icon}</span>
                                  {bestPredictionInfo.score} 
                                  {typeof user.predictions.best_reliability === 'number' && ` (${Math.round(user.predictions.best_reliability * 100)}%)`}
                                </div>
                                <div className="best-algorithm">
                                  {getAlgorithmName(user.predictions.best_algorithm)}
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        {[
                          { label: "Akıllı Aralık", key: "smart_interval", info: smartIntervalInfo, data: user.predictions?.smart_interval },
                          { label: "Periyodik Örüntü", key: "periodicity", info: periodicityInfo, data: user.predictions?.periodicity },
                          { label: "Dinamik Örüntü", key: "dynamic_patterns", info: dynamicPatternsInfo, data: user.predictions?.dynamic_patterns }
                        ].map(algo => (
                          <td key={algo.key} data-label={algo.label} className="collapsible-column">
                            <div className="cell-content">
                              <div className="time-value">{formatDate(algo.data)}</div>
                              <div className="time-ago">{getTimeFromNow(algo.data)}</div>
                              {algo.data && user.predictions?.reliability && user.predictions.reliability[algo.key] !== undefined && (
                                <div className={`accuracy-indicator ${reliabilityLevels[algo.info.score]}`}>
                                   <span className="accuracy-icon">{algo.info.icon}</span>
                                  {algo.info.score}
                                </div>
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-state-icon" role="img" aria-label="Veri bulunamadı ikonu">🤷</span>
              <p>{searchTerm ? 'Arama kriterlerinize uygun kullanıcı bulunamadı.' : (activeTab !== 'all' ? 'Bu güvenilirlik seviyesinde tahmin bulunamadı.' : 'Görüntülenecek kullanıcı verisi mevcut değil.')}</p>
              {searchTerm && (
                <button className="clear-filter-button" onClick={() => setSearchTerm('')}>
                  Aramayı Temizle
                </button>
              )}
            </div>
          )}
          
          <div className="table-footer">
            <p className="record-count">
              Gösterilen: <span>{sortedUsers.length}</span> kullanıcı {searchTerm || activeTab !== 'all' ? ' (Filtrelenmiş)' : ''}
            </p>
          </div>
        </div>
        
        <footer className="footer-info">
          <p>© {new Date().getFullYear()} Gelişmiş Kullanıcı Giriş Tahmin Sistemi. Tüm hakları saklıdır.</p>
        </footer>
      </div>
    </div>
  );
}

export default App;