<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
/**
 * API URL'sinden kullanıcı verilerini çeker
 * @return array Kullanıcı verileri dizisi
 */
function fetchUserData() {
    $apiUrl = 'https://case-test-api.humanas.io';

    if (function_exists('curl_init')) {
        // cURL ile istek yap
        $ch = curl_init($apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); // Geliştirme için false, üretimde bir sertifika yolu belirtmeyi düşünün
        curl_setopt($ch, CURLOPT_TIMEOUT, 10); 

        $response = curl_exec($ch);

        if(curl_error($ch)) {
            // Daha ayrıntılı hata günlüğü için error_log da kullanılabilir
            die('cURL Error: ' . curl_error($ch));
        }
        
        curl_close($ch);
    } else {
        // cURL yoksa file_get_contents kullan
        $arrContextOptions = [
            "ssl" => [
                "verify_peer" => false,
                "verify_peer_name" => false,
            ],
            "http" => [
                "timeout" => 10 
            ]
        ];

        $response = file_get_contents($apiUrl, false, stream_context_create($arrContextOptions));
        
        if ($response === false) {
            die('Error: Unable to fetch data from API');
        }
    }

    $data = json_decode($response, true);

    if (json_last_error() !== JSON_ERROR_NONE) {
        die('Error: Invalid JSON received from API: ' . json_last_error_msg());
    }

    // API yanıt yapısını kontrol et
    if (isset($data['data']['rows']) && is_array($data['data']['rows'])) {
        return $data['data']['rows'];
    } else if (is_array($data)) { // Eğer $data doğrudan kullanıcı dizisi ise
        return $data;
    } else {
        die('Error: Invalid data structure received from API. Expected an array of users or an object with a "data.rows" array.');
    }
}

/**
 * Algoritma 1: Geliştirilmiş Aralık Tahmini
 * Kullanıcının giriş zamanları arasındaki genel, günlük ve haftalık aralık örüntülerini analiz eder
 * @param array $loginTimes UTC formatında giriş zamanları dizisi
 * @return string|null Tahmin edilen bir sonraki giriş zamanı (UTC) veya yetersiz veri varsa null
 */
function predictNextLoginBySmartInterval($loginTimes) {
    if (count($loginTimes) < 2) {
        return null;
    }

    sort($loginTimes); // Giriş zamanlarını sıralama (string ISO 8601 sıralaması yeterli)
    $timestamps = array_map('strtotime', $loginTimes);
    
    $intervals = [];
    $recentWeight = 1.5; 
    
    for ($i = 1; $i < count($timestamps); $i++) {
        $interval = $timestamps[$i] - $timestamps[$i - 1];
        if ($interval < 30 * 24 * 3600 && $interval > 0) { // Anormal derecede büyük veya negatif aralıkları filtrele
            $recencyFactor = 1 + (($i / count($timestamps)) * $recentWeight);
            $intervals[] = $interval * $recencyFactor;
        }
    }
    
    if (empty($intervals)) {
        // Eğer filtrelenmiş aralık kalmazsa, varsayılan bir aralık kullanılabilir veya null dönülebilir.
        // Örneğin, en az bir geçerli aralık yoksa tahmin yapmayı reddedebiliriz.
        // Şimdilik, orijinal koddaki gibi varsayılan bir değere (1 gün) dönelim.
        $intervals[] = 24 * 3600; 
    }
    
    sort($intervals);
    $middleIndex = floor(count($intervals) / 2);
    if (count($intervals) % 2 === 0) {
        $medianInterval = ($intervals[$middleIndex - 1] + $intervals[$middleIndex]) / 2;
    } else {
        $medianInterval = $intervals[$middleIndex];
    }
    
    // $avgInterval = array_sum($intervals) / count($intervals); // Bu satır kullanılmıyor gibi görünüyor
    
    $lastIntervals = array_slice($intervals, -min(5, count($intervals)));
    $lastAvgInterval = count($lastIntervals) > 0 ? array_sum($lastIntervals) / count($lastIntervals) : $medianInterval; // Bölme hatasını önle
    
    $balancedInterval = ($medianInterval * 0.6) + ($lastAvgInterval * 0.4);
    
    $now = time();
    $lastLogin = end($timestamps);
    
    $elapsedTime = $now - $lastLogin;
    
    if ($elapsedTime > $balancedInterval) {
        return date('Y-m-d\TH:i:s\Z', $now + (int)($balancedInterval * 0.3));
    } else {
        return date('Y-m-d\TH:i:s\Z', $lastLogin + (int)$balancedInterval);
    }
}

/**
 * Algoritma 2: Makine Öğrenmesi Benzeri Dönemsel Tahmin
 * Haftalık ve günlük dönemselliği analiz ederek, kullanıcının geçmiş giriş kalıplarını öğrenir
 * @param array $loginTimes UTC formatında giriş zamanları dizisi
 * @return string|null Tahmin edilen bir sonraki giriş zamanı (UTC) veya yetersiz veri varsa null
 */
function predictNextLoginByPeriodicityAnalysis($loginTimes) {
    if (count($loginTimes) < 3) { // Bu algoritma için en az 3 giriş gerekebilir
        return null;
    }

    $timestamps = array_map('strtotime', $loginTimes);
    sort($timestamps);

    $weekdayScores = array_fill(0, 7, 0.0); // Float olarak başlat
    $hourScores = array_fill(0, 24, 0.0); // Float olarak başlat
    $dayHourMatrix = [];
    
    for ($day = 0; $day < 7; $day++) {
        $dayHourMatrix[$day] = array_fill(0, 24, 0.0); // Float olarak başlat
    }
    
    foreach ($timestamps as $index => $timestamp) {
        $weight = 1 + ($index / count($timestamps)); // Daha yeni girişlere daha fazla ağırlık
        
        $weekday = (int)date('w', $timestamp); // Pazar=0, ..., Cumartesi=6
        $hour = (int)date('G', $timestamp);    // 0-23
        
        $weekdayScores[$weekday] += $weight;
        $hourScores[$hour] += $weight;
        $dayHourMatrix[$weekday][$hour] += $weight;
    }
    
    // En yüksek skorlu günü ve saati bul (eğer skorlar 0 ise tanımsız kalabilir)
    $maxWeekdayScore = max($weekdayScores);
    $bestWeekday = $maxWeekdayScore > 0 ? array_search($maxWeekdayScore, $weekdayScores) : (int)date('w'); // Varsayılan: bugünün günü

    $maxHourScore = max($hourScores);
    $bestHour = $maxHourScore > 0 ? array_search($maxHourScore, $hourScores) : (int)date('G'); // Varsayılan: şu anki saat
    
    $bestDayHourVal = [0, 0, 0.0]; // [gün, saat, skor]
    for ($d = 0; $d < 7; $d++) {
        for ($h = 0; $h < 24; $h++) {
            if ($dayHourMatrix[$d][$h] > $bestDayHourVal[2]) {
                $bestDayHourVal = [$d, $h, $dayHourMatrix[$d][$h]];
            }
        }
    }
    // Eğer hiç giriş yoksa veya skorlar sıfırsa, varsayılan değerler kullan
    $targetWeekday = $bestDayHourVal[2] > 0 ? $bestDayHourVal[0] : $bestWeekday;
    $targetHour = $bestDayHourVal[2] > 0 ? $bestDayHourVal[1] : $bestHour;

    $now = time();
    $currentWeekday = (int)date('w', $now);
    $currentHour = (int)date('G', $now);
    
    $predictionsTimes = [];
    
    // 1. En iyi gün-saat kombinasyonu tahmini
    $daysToAdd1 = ($targetWeekday - $currentWeekday + 7) % 7;
    if ($daysToAdd1 === 0 && $targetHour <= $currentHour) { // Eğer bugün ve saat geçtiyse, bir sonraki haftaya
        $daysToAdd1 = 7;
    }
    $predictionDate1 = strtotime("+{$daysToAdd1} days", $now);
    $predictionsTimes[] = strtotime(date('Y-m-d', $predictionDate1) . " {$targetHour}:00:00");
    
    // 2. (Alternatif) En iyi gün ve genel en iyi saat kombinasyonu (bu zaten yukarıdakiyle benzer olabilir, belki farklı bir mantık?)
    // Orijinal kodda iki ayrı tahmin vardı, burada tek bir birleşik hedef gün/saat kullanıldı.
    // Eğer iki farklı tahmin isteniyorsa, `bestWeekday` ve `bestHour` kullanarak ikinci bir tahmin oluşturulabilir.
    // Örneğin:
    // $daysToAdd2 = ($bestWeekday - $currentWeekday + 7) % 7;
    // if ($daysToAdd2 === 0 && $bestHour <= $currentHour) { $daysToAdd2 = 7; }
    // $predictionDate2 = strtotime("+{$daysToAdd2} days", $now);
    // $predictionsTimes[] = strtotime(date('Y-m-d', $predictionDate2) . " {$bestHour}:00:00");

    if (empty($predictionsTimes)) return null; // Hiç tahmin yapılamadıysa
    
    $avgPredictionTimestamp = array_sum($predictionsTimes) / count($predictionsTimes);
    return date('Y-m-d\TH:i:s\Z', (int)$avgPredictionTimestamp);
}

/**
 * Algoritma 3: Dinamik Örüntü Analizi
 * @param array $loginTimes UTC formatında giriş zamanları dizisi
 * @return string|null Tahmin edilen bir sonraki giriş zamanı (UTC) veya yetersiz veri varsa null
 */
function predictNextLoginByDynamicPatterns($loginTimes) {
    if (count($loginTimes) < 5) { // Bu algoritma için daha fazla veri gerekebilir
        return null;
    }

    $timestamps = array_map('strtotime', $loginTimes);
    sort($timestamps);
    
    $recentLogins = array_slice($timestamps, -min(10, count($timestamps)));
    
    $intervals = [];
    if (count($recentLogins) > 1) {
        for ($i = 1; $i < count($recentLogins); $i++) {
            $intervals[] = $recentLogins[$i] - $recentLogins[$i - 1];
        }
    }
    
    $dayDiffs = [];
    $uniqueDays = [];
    foreach ($timestamps as $time) {
        $day = date('Y-m-d', $time);
        if (!in_array($day, $uniqueDays)) {
            $uniqueDays[] = $day;
        }
    }
    sort($uniqueDays); // Günlerin sıralı olduğundan emin ol

    if (count($uniqueDays) > 1) {
        for ($i = 1; $i < count($uniqueDays); $i++) {
            $diff = (strtotime($uniqueDays[$i]) - strtotime($uniqueDays[$i-1])) / (24 * 3600);
            if ($diff > 0) $dayDiffs[] = $diff;
        }
    }
    
    $mostCommonDiff = 1; // Varsayılan
    if (!empty($dayDiffs)) {
        $diffCounts = array_count_values(array_map('strval', $dayDiffs)); // strval önemli
        arsort($diffCounts);
        $mostCommonDiff = key($diffCounts) ? (int)key($diffCounts) : 1;
    }
        
    $hourCounts = array_fill(0, 24, 0);
    foreach ($timestamps as $time) {
        $hour = (int)date('G', $time);
        $hourCounts[$hour]++;
    }
    arsort($hourCounts);
    $topHours = array_slice(array_keys($hourCounts), 0, 3);
    
    $now = time();
    $currentHour = (int)date('G', $now);
    
    $nextHour = null;
    if (!empty($topHours)) {
        foreach ($topHours as $hour) {
            if ($hour > $currentHour) {
                $nextHour = $hour;
                break;
            }
        }
        $predictionDate = $now;
        if ($nextHour === null) { // Eğer uygun saat bulunamadıysa (tüm popüler saatler geçtiyse)
            $nextHour = reset($topHours); // En popüler saati al
            $predictionDate = strtotime('+1 day', $now); // Yarın için ayarla
        }
    } else { // Hiç popüler saat yoksa (veri yetersiz)
        $nextHour = $currentHour; // Geçerli saati kullan
        $predictionDate = $now;
    }
    
    $lastLogin = end($timestamps);
    $timeSinceLastLogin = $now - $lastLogin;
    
    $avgInterval = !empty($intervals) ? array_sum($intervals) / count($intervals) : (24 * 3600); // 1 gün varsayılan
    
    if ($timeSinceLastLogin > $avgInterval * 1.5 && $avgInterval > 0) {
        return date('Y-m-d\TH:i:s\Z', $now + (int)($avgInterval * 0.25));
    }
    
    $baseDateStr = date('Y-m-d', $predictionDate);
    $predictionTimestamp = strtotime($baseDateStr . ' ' . $nextHour . ':00:00');
    
    if ($predictionTimestamp < $now) {
        $predictionTimestamp = strtotime("+{$mostCommonDiff} days", $predictionTimestamp);
         // Eğer hala geçmişteyse, bir sonraki popüler saate ayarla veya +1 gün daha ekle
        if ($predictionTimestamp < $now) {
             $predictionTimestamp = strtotime('+1 day', $predictionTimestamp);
        }
    }
    
    return date('Y-m-d\TH:i:s\Z', $predictionTimestamp);
}

/**
 * En iyi tahmini belirleyen fonksiyon
 * @param array $loginTimes UTC formatında giriş zamanları dizisi
 * @return array Tüm tahminler ve güvenilirlik skorları
 */
function getBestPredictions($loginTimes) {
    // loginTimes'ın zaten sıralı ve dolu olduğu varsayılır (önceki adımdan)
    if (count($loginTimes) < 2) { // SmartInterval için en az 2 giriş
        return [
            'smart_interval' => null,
            'periodicity' => null,
            'dynamic_patterns' => null,
            'reliability' => ['smart_interval' => 0, 'periodicity' => 0, 'dynamic_patterns' => 0],
            'best_prediction' => null,
            'best_algorithm' => null,
            'best_reliability' => 0
        ];
    }
    
    $predictions = [
        'smart_interval' => predictNextLoginBySmartInterval($loginTimes),
        'periodicity' => predictNextLoginByPeriodicityAnalysis($loginTimes),
        'dynamic_patterns' => predictNextLoginByDynamicPatterns($loginTimes)
    ];
    
    $reliability = [];
    $loginCount = count($loginTimes);
    
    // Smart Interval güvenilirliği
    $reliability['smart_interval'] = min(0.85, 0.4 + ($loginCount / 40.0));
    
    // Periodicity güvenilirliği
    $reliability['periodicity'] = min(0.9, 0.3 + ($loginCount / 30.0));
    if ($loginCount >= 7) $reliability['periodicity'] = min(0.9, $reliability['periodicity'] + 0.1);
    if (count($loginTimes) < 3) $reliability['periodicity'] = 0; // Yetersiz veri
    
    // Dynamic Patterns güvenilirliği
    $reliability['dynamic_patterns'] = min(0.95, 0.2 + ($loginCount / 20.0));
    if ($loginCount >= 10) $reliability['dynamic_patterns'] = min(0.95, $reliability['dynamic_patterns'] + 0.2);
    if (count($loginTimes) < 5) $reliability['dynamic_patterns'] = 0; // Yetersiz veri

    // Tahmin yoksa güvenilirliği sıfırla
    if ($predictions['smart_interval'] === null) $reliability['smart_interval'] = 0;
    if ($predictions['periodicity'] === null) $reliability['periodicity'] = 0;
    if ($predictions['dynamic_patterns'] === null) $reliability['dynamic_patterns'] = 0;

    // En iyi tahmini belirle
    $bestAlgorithm = null;
    $bestReliability = 0;
    $bestPrediction = null;

    foreach (['smart_interval', 'periodicity', 'dynamic_patterns'] as $algorithm) {
        if ($reliability[$algorithm] > $bestReliability && $predictions[$algorithm] !== null) {
            $bestReliability = $reliability[$algorithm];
            $bestAlgorithm = $algorithm;
            $bestPrediction = $predictions[$algorithm];
        }
    }

    $predictions['reliability'] = $reliability;
    $predictions['best_prediction'] = $bestPrediction;
    $predictions['best_algorithm'] = $bestAlgorithm;
    $predictions['best_reliability'] = $bestReliability;
    
    return $predictions;
}

// Hata bildirimi ayarları (Geliştirme için: 1, Üretim için: 0)
ini_set('display_errors', 1); // Geliştirme sırasında hataları görmek için 1 yapın
ini_set('display_startup_errors', 1); // Geliştirme sırasında hataları görmek için 1 yapın
error_reporting(E_ALL);

try {
    $apiData = fetchUserData(); 
    $result = [];
    $uniqueUsers = []; // Benzersiz kullanıcıları ID'lerine göre saklamak için

    if (!is_array($apiData)) { // fetchUserData'dan dönen verinin dizi olduğunu kontrol et
        throw new Exception("API'den alınan kullanıcı verisi bir dizi değil.");
    }

    foreach ($apiData as $userEntry) {
        // ID'nin varlığını ve skaler (dizi anahtarı olabilecek türde) olup olmadığını kontrol et
        if (!isset($userEntry['id']) || !is_scalar($userEntry['id'])) {
            // error_log("Kullanıcı girişi eksik veya geçersiz ID nedeniyle atlanıyor: " . print_r($userEntry, true));
            continue;
        }
        $userId = trim((string)$userEntry['id']); // ID'yi string'e çevir ve boşlukları temizle

        if ($userId === '') { // Boş ID'leri atla
            // error_log("Kullanıcı girişi boş ID nedeniyle atlanıyor: " . print_r($userEntry, true));
            continue;
        }

        // Eğer bu ID daha önce işlenmediyse, benzersiz kullanıcılar listesine ekle
        if (!array_key_exists($userId, $uniqueUsers)) {
            if (!isset($userEntry['name']) || !isset($userEntry['logins'])) {
                // error_log("Kullanıcı {$userId} için 'name' veya 'logins' alanı eksik, atlanıyor.");
                continue;
            }
            
            $logins = $userEntry['logins'];
            if (!is_array($logins) || empty($logins)) {
                // error_log("Kullanıcı {$userId} için 'logins' alanı boş veya geçersiz, atlanıyor.");
                continue;
            }
            
            // Giriş zamanlarını sırala (ISO 8601 formatındaki stringler alfabetik olarak doğru sıralanır)
            sort($logins); 

            $userEntry['logins'] = $logins; // Sıralanmış girişleri kullanıcı verisine ata
            $uniqueUsers[$userId] = $userEntry; // Kullanıcıyı benzersiz listeye ekle
        }
        // else: Bu ID daha önce işlendi, bu yüzden bu yinelenen giriş atlanıyor.
        // Eğer yinelenen girişlerden veri birleştirme (örneğin, login listelerini birleştirme)
        // gerekseydi, bu 'else' bloğunda yapılırdı. Şimdilik ilk bulunan giriş kullanılıyor.
    }

    // Şimdi benzersiz kullanıcıları işle
    foreach ($uniqueUsers as $processedUserId => $user) { 
        $logins = $user['logins']; // Bunlar zaten sıralı ve doğrulanmış
        
        $lastLogin = end($logins); // Sıralı diziden son girişi al
        
        $predictions = getBestPredictions($logins); // Sıralı girişleri kullanarak tahminleri al
        
        $result[] = [
            'id' => $processedUserId, // Benzersiz ID'yi kullan
            'name' => $user['name'],
            'last_login' => $lastLogin,
            'login_count' => count($logins),
            'predictions' => $predictions
        ];
    }

    echo json_encode(['users' => $result], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    header('HTTP/1.1 500 Internal Server Error');
    echo json_encode([
        'error' => true,
        'message' => $e->getMessage(),
        // Geliştirme sırasında: 'trace' => $e->getTraceAsString()
    ]);
}
?>