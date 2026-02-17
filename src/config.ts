import { Capacitor } from '@capacitor/core';

// Uygulama genel yapılandırma ayarları
export const APP_CONFIG = {
    // Mevcut uygulama sürümü
    VERSION: '3.6',

    // API URL
    // Native (Mobil) uygulamada Ngrok adresine gider
    // Web (Tarayıcı) ortamında Proxy (/api) kullanır
    API_BASE_URL: Capacitor.isNativePlatform()
        ? 'https://postcolon-marylee-reasoned.ngrok-free.dev/api'
        : '/api',

    // APK İndirme Linki
    APK_DOWNLOAD_URL: 'https://postcolon-marylee-reasoned.ngrok-free.dev/download/app-release.apk'
};
