<?php
/**
 * API İstemci Sınıfı
 * API'den veri çekmek için kullanılan metotları içerir
 */
class ApiClient {
    private $apiUrl = 'https://case-test-api.humanas.io';
    
    /**
     * API URL'sinden kullanıcı verilerini çeker
     * cURL yoksa file_get_contents kullanır
     * @return array Kullanıcı verileri dizisi
     */
    public function fetchUserData() {
        // cURL mevcut mu kontrol et
        if (function_exists('curl_init')) {
            return $this->fetchWithCurl();
        } else {
            return $this->fetchWithFileGetContents();
        }
    }
    
    /**
     * cURL ile API'den veri çeker
     * @return array İşlenmiş veri
     */
    private function fetchWithCurl() {
        // cURL ile istek yap
        $ch = curl_init($this->apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

        $response = curl_exec($ch);

        if(curl_error($ch)) {
            throw new Exception('cURL Error: ' . curl_error($ch));
        }
        
        curl_close($ch);
        
        return $this->processResponse($response);
    }
    
    /**
     * file_get_contents ile API'den veri çeker
     * @return array İşlenmiş veri
     */
    private function fetchWithFileGetContents() {
        $arrContextOptions = [
            "ssl" => [
                "verify_peer" => false,
                "verify_peer_name" => false,
            ],
        ];

        $response = file_get_contents($this->apiUrl, false, stream_context_create($arrContextOptions));
        
        if ($response === false) {
            throw new Exception('Error: Unable to fetch data from API');
        }
        
        return $this->processResponse($response);
    }
    
    /**
     * API yanıtını işler ve veri yapısını kontrol eder
     * @param string $response API'den gelen JSON yanıtı
     * @return array İşlenmiş veri
     */
    private function processResponse($response) {
        $data = json_decode($response, true);

        // API yanıt yapısını kontrol et
        if (isset($data['data']['rows'])) {
            return $data['data']['rows']; // API'den gelen veri yapısını düzeltme
        } else if (isset($data)) {
            return $data; // Düz dizi döndürülmüşse direkt kullan
        } else {
            throw new Exception('Error: Invalid data structure received from API');
        }
    }
}
?>