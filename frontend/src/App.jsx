import React, { useState, useEffect } from 'react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import './App.css';

function App() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: 'name', // Varsayılan sıralama anahtarı
    direction: 'ascending'
  });

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
      // API'den gelen veriyi kontrol et (yinelenme sorunu için)
      // console.log("API'den gelen kullanıcı verisi:", JSON.stringify(data.users, null, 2)); 
      setUsers(data.users || []); // data.users yoksa boş dizi ata
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

  // Algoritma adını Türkçe göstermek için
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
    // users state'inin bir dizi olduğundan emin ol
    const sortableItems = Array.isArray(users) ? [...users] : []; 
    if (sortConfig.key && sortableItems.length > 0) {
      sortableItems.sort((a, b) => {
        // a veya b'nin null/undefined olabileceğini ve sortConfig.key'in varlığını kontrol et
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
    return sortableItems;
  };
  
  const algorithmDescriptions = {
    smart_interval: "Akıllı Aralık Analizi: Kullanıcının giriş zamanları arasındaki genel, günlük ve haftalık aralık örüntülerini analiz ederek tahmin yapar.",
    periodicity: "Periyodik Örüntü Analizi: Haftalık ve günlük dönemselliği analiz ederek, kullanıcının geçmiş giriş kalıplarını öğrenir ve bu kalıplara dayalı olarak tahmin yapar.",
    dynamic_patterns: "Dinamik Örüntü Analizi: Kullanıcının giriş zamanlarını farklı zaman ölçeklerinde analiz ederek, kişiselleştirilmiş tahmin yapar."
  };

  if (loading) {
    return <div className="container"><div className="loading">Veriler yükleniyor...</div></div>;
  }

  if (error) {
    return <div className="container"><div className="error">Hata: {error}</div></div>;
  }

  const sortedUsers = getSortedItems(); // Sıralanmış kullanıcıları al

  return (
    <div className="container">
      <header>
        <h1>Kullanıcı Giriş Tahmin Sistemi</h1>
        <p>Bu uygulama, kullanıcıların geçmiş giriş davranışlarını analiz ederek bir sonraki olası giriş zamanlarını tahmin eder.</p>
      </header>
      
      <div className="algorithm-info">
        <h2>Geliştirilmiş Tahmin Algoritmaları</h2>
        <ul>
          {Object.entries(algorithmDescriptions).map(([key, description]) => (
            <li key={key}>
              <strong>{description.split(':')[0]}:</strong> {description.split(':')[1]}
            </li>
          ))}
        </ul>
      </div>

      <div className="user-table-card">
        <h2>Kullanıcı Tahminleri</h2>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th onClick={() => requestSort('id')}>
                  Kullanıcı ID
                  {sortConfig.key === 'id' && (
                    <span className="sort-indicator">{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
                  )}
                </th>
                <th onClick={() => requestSort('name')}>
                  Kullanıcı Adı
                  {sortConfig.key === 'name' && (
                    <span className="sort-indicator">{sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'}</span>
                  )}
                </th>
                <th>Son Giriş</th>
                <th className="highlighted-column">En İyi Tahmin</th>
                <th>Akıllı Aralık Analizi</th>
                <th>Periyodik Örüntü Analizi</th>
                <th>Dinamik Örüntü Analizi</th>
              </tr>
            </thead>
            <tbody>
              {Array.isArray(sortedUsers) && sortedUsers.length > 0 ? (
                sortedUsers.map((user) => (
                  user && user.id ? (
                    <tr key={user.id}>
                      <td>{user.id}</td>
                      <td>{user.name}</td>
                      <td>
                        <div className="time-value">{formatDate(user.last_login)}</div>
                        <div className="time-ago">{getTimeFromNow(user.last_login)}</div>
                      </td>
                      <td className="highlighted-column">
                        <div className="time-value">{formatDate(user.predictions?.best_prediction)}</div>
                        <div className="time-ago">{getTimeFromNow(user.predictions?.best_prediction)}</div>
                        {user.predictions?.best_prediction && (
                          <>
                            <div className={`accuracy-indicator ${
                              getReliabilityScore(user.predictions.best_prediction, user.predictions.best_reliability).score === 'Yüksek' ? 'high' : 
                              getReliabilityScore(user.predictions.best_prediction, user.predictions.best_reliability).score === 'Orta' ? 'medium' : 'low'}`}>
                              Güvenilirlik: {getReliabilityScore(user.predictions.best_prediction, user.predictions.best_reliability).score} 
                              ({Math.round(user.predictions.best_reliability * 100)}%)
                            </div>
                            <div className="best-algorithm">
                              {getAlgorithmName(user.predictions.best_algorithm)}
                            </div>
                          </>
                        )}
                      </td>
                      <td>
                        <div className="time-value">{formatDate(user.predictions?.smart_interval)}</div>
                        <div className="time-ago">{getTimeFromNow(user.predictions?.smart_interval)}</div>
                        {user.predictions?.smart_interval && user.predictions?.reliability && (
                          <div 
                            className={`accuracy-indicator ${getReliabilityScore(user.predictions.smart_interval, user.predictions.reliability.smart_interval).score === 'Yüksek' ? 'high' : 
                                      getReliabilityScore(user.predictions.smart_interval, user.predictions.reliability.smart_interval).score === 'Orta' ? 'medium' : 'low'}`}
                          >
                            Güvenilirlik: {getReliabilityScore(user.predictions.smart_interval, user.predictions.reliability.smart_interval).score}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="time-value">{formatDate(user.predictions?.periodicity)}</div>
                        <div className="time-ago">{getTimeFromNow(user.predictions?.periodicity)}</div>
                        {user.predictions?.periodicity && user.predictions?.reliability && (
                          <div 
                            className={`accuracy-indicator ${getReliabilityScore(user.predictions.periodicity, user.predictions.reliability.periodicity).score === 'Yüksek' ? 'high' : 
                                      getReliabilityScore(user.predictions.periodicity, user.predictions.reliability.periodicity).score === 'Orta' ? 'medium' : 'low'}`}
                          >
                            Güvenilirlik: {getReliabilityScore(user.predictions.periodicity, user.predictions.reliability.periodicity).score}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="time-value">{formatDate(user.predictions?.dynamic_patterns)}</div>
                        <div className="time-ago">{getTimeFromNow(user.predictions?.dynamic_patterns)}</div>
                        {user.predictions?.dynamic_patterns && user.predictions?.reliability && (
                          <div 
                            className={`accuracy-indicator ${getReliabilityScore(user.predictions.dynamic_patterns, user.predictions.reliability.dynamic_patterns).score === 'Yüksek' ? 'high' : 
                                      getReliabilityScore(user.predictions.dynamic_patterns, user.predictions.reliability.dynamic_patterns).score === 'Orta' ? 'medium' : 'low'}`}
                          >
                            Güvenilirlik: {getReliabilityScore(user.predictions.dynamic_patterns, user.predictions.reliability.dynamic_patterns).score}
                          </div>
                        )}
                      </td>
                    </tr>
                  ) : null
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center' }}>Görüntülenecek kullanıcı bulunamadı.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;