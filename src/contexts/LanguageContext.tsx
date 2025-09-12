import React, { createContext, ReactNode, useContext, useState } from 'react';

export type Language = 'en' | 'hi' | 'es' | 'fr' | 'ar' | 'zh' | 'ja' | 'de' | 'pt' | 'ru';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: any;
}

const translations: Record<string, any> = {
  en: {
    // Header
    'app.title': 'Tourist Safety Platform',
    'nav.dashboard': 'Dashboard',
    'nav.safety': 'Safety',
    'nav.map': 'Map',
    'nav.emergency': 'Emergency',
    'nav.profile': 'Profile',
    'nav.logout': 'Logout',
    
    // Dashboard
    'dashboard.welcome': 'Welcome to Tourist Safety',
    'dashboard.safetyScore': 'Safety Score',
    'dashboard.currentLocation': 'Current Location',
    'dashboard.recentAlerts': 'Recent Alerts',
    'dashboard.batteryLevel': 'Battery Level',
    'dashboard.emergencyContacts': 'Emergency Contacts',
    'dashboard.overview': 'Overview',
    'dashboard.reviews': 'Reviews',
    'dashboard.itinerary': 'Itinerary',
    'dashboard.offline': 'Offline',
    'dashboard.nightMode': 'Night Mode',
    'dashboard.offlineMode': 'Offline Mode',
    'dashboard.connected': 'Connected',
    'dashboard.safe': 'Safe Zone',
    
    // Safety
    'safety.title': 'Safety Information',
    'safety.riskLevel': 'Risk Level',
    'safety.recommendations': 'Recommendations',
    'safety.tips': 'Safety Tips',
    'safety.safety': 'Safety',
    
    // Emergency
    'emergency.sos': 'SOS Emergency',
    'emergency.police': 'Police',
    'emergency.medical': 'Medical',
    'emergency.fire': 'Fire Department',
    'emergency.panic': 'Panic Button',
    'emergency.emergency': 'Emergency',
    'emergency.helpline': 'Emergency Helpline',
    'emergency.quickCall': 'Quick Call',
    'emergency.contacts': 'Emergency Contacts',
    
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.confirm': 'Confirm',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.close': 'Close',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.appName': 'Tourist Safety',
    'common.tagline': 'Your Safety, Our Priority',
    'common.map': 'Map',
    'common.profile': 'Profile',
    'common.settings': 'Settings',
    'common.analytics': 'Analytics',
    'common.logout': 'Logout',
    'common.goodMorning': 'Good Morning',
    'common.goodAfternoon': 'Good Afternoon',
    'common.goodEvening': 'Good Evening',
    'common.crowd': 'Crowd',
    'common.police': 'Police',
    
    // Location
    'location.requesting': 'Requesting location access...',
    'location.denied': 'Location access denied',
    'location.unavailable': 'Location unavailable',
    'location.accuracy': 'Accuracy',
    'location.lastUpdated': 'Last updated',
    
    // Alerts
    'alerts.noAlerts': 'No recent alerts',
    'alerts.acknowledge': 'Acknowledge',
    'alerts.viewAll': 'View All',
    'alerts.high': 'High Priority',
    'alerts.medium': 'Medium Priority',
    'alerts.low': 'Low Priority',
    'alerts.critical': 'Critical Alert',
    
    // Nested structure for modern access
    common: {
      appName: 'Tourist Safety',
      tagline: 'Your Safety, Our Priority',
      loading: 'Loading...',
      error: 'Error',
      success: 'Success',
      cancel: 'Cancel',
      confirm: 'Confirm',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      map: 'Map',
      profile: 'Profile',
      settings: 'Settings',
      analytics: 'Analytics',
      logout: 'Logout',
      goodMorning: 'Good Morning',
      goodAfternoon: 'Good Afternoon',
      goodEvening: 'Good Evening',
      crowd: 'Crowd',
      police: 'Police'
    },
    dashboard: {
      welcome: 'Welcome',
      safetyScore: 'Safety Score',
      currentLocation: 'Current Location',
      recentAlerts: 'Recent Alerts',
      batteryLevel: 'Battery Level',
      emergencyContacts: 'Emergency Contacts',
      overview: 'Overview',
      reviews: 'Reviews',
      itinerary: 'Itinerary',
      offline: 'Offline',
      nightMode: 'Night Mode',
      offlineMode: 'Offline Mode',
      connected: 'Connected',
      safe: 'Safe Zone'
    },
    safety: {
      title: 'Safety Information',
      riskLevel: 'Risk Level',
      recommendations: 'Recommendations',
      tips: 'Safety Tips',
      safety: 'Safety'
    },
    emergency: {
      sos: 'SOS Emergency',
      police: 'Police',
      medical: 'Medical',
      fire: 'Fire Department',
      panic: 'Panic Button',
      emergency: 'Emergency',
      helpline: 'Emergency Helpline',
      quickCall: 'Quick Call',
      contacts: 'Emergency Contacts'
    }
  },
  
  hi: {
    // Header
    'app.title': 'पर्यटक सुरक्षा प्लेटफॉर्म',
    'nav.dashboard': 'डैशबोर्ड',
    'nav.safety': 'सुरक्षा',
    'nav.map': 'नक्शा',
    'nav.emergency': 'आपातकाल',
    'nav.profile': 'प्रोफ़ाइल',
    'nav.logout': 'लॉग आउट',
    
    // Dashboard
    'dashboard.welcome': 'पर्यटक सुरक्षा में आपका स्वागत है',
    'dashboard.safetyScore': 'सुरक्षा स्कोर',
    'dashboard.currentLocation': 'वर्तमान स्थान',
    'dashboard.recentAlerts': 'हाल की चेतावनियां',
    'dashboard.batteryLevel': 'बैटरी स्तर',
    'dashboard.emergencyContacts': 'आपातकालीन संपर्क',
    
    // Safety
    'safety.title': 'सुरक्षा जानकारी',
    'safety.riskLevel': 'जोखिम स्तर',
    'safety.recommendations': 'सिफारिशें',
    'safety.tips': 'सुरक्षा सुझाव',
    
    // Emergency
    'emergency.sos': 'एसओएस आपातकाल',
    'emergency.police': 'पुलिस',
    'emergency.medical': 'चिकित्सा',
    'emergency.fire': 'अग्निशमन विभाग',
    'emergency.panic': 'पैनिक बटन',
    
    // Common
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'त्रुटि',
    'common.success': 'सफलता',
    'common.cancel': 'रद्द करें',
    'common.confirm': 'पुष्टि करें',
    'common.save': 'सेव करें',
    'common.delete': 'हटाएं',
    'common.edit': 'संपादित करें',
    'common.view': 'देखें',
    'common.close': 'बंद करें',
    'common.yes': 'हां',
    'common.no': 'नहीं',
    
    // Location
    'location.requesting': 'स्थान पहुंच का अनुरोध...',
    'location.denied': 'स्थान पहुंच अस्वीकृत',
    'location.unavailable': 'स्थान अनुपलब्ध',
    'location.accuracy': 'सटीकता',
    'location.lastUpdated': 'अंतिम अपडेट',
    
    // Alerts
    'alerts.noAlerts': 'कोई हाल की चेतावनी नहीं',
    'alerts.acknowledge': 'स्वीकार करें',
    'alerts.viewAll': 'सभी देखें',
    'alerts.high': 'उच्च प्राथमिकता',
    'alerts.medium': 'मध्यम प्राथमिकता',
    'alerts.low': 'कम प्राथमिकता',
  },
  
  es: {
    // Header
    'app.title': 'Plataforma de Seguridad Turística',
    'nav.dashboard': 'Panel',
    'nav.safety': 'Seguridad',
    'nav.map': 'Mapa',
    'nav.emergency': 'Emergencia',
    'nav.profile': 'Perfil',
    'nav.logout': 'Cerrar Sesión',
    
    // Dashboard
    'dashboard.welcome': 'Bienvenido a Seguridad Turística',
    'dashboard.safetyScore': 'Puntuación de Seguridad',
    'dashboard.currentLocation': 'Ubicación Actual',
    'dashboard.recentAlerts': 'Alertas Recientes',
    'dashboard.batteryLevel': 'Nivel de Batería',
    'dashboard.emergencyContacts': 'Contactos de Emergencia',
    
    // Safety
    'safety.title': 'Información de Seguridad',
    'safety.riskLevel': 'Nivel de Riesgo',
    'safety.recommendations': 'Recomendaciones',
    'safety.tips': 'Consejos de Seguridad',
    
    // Emergency
    'emergency.sos': 'SOS Emergencia',
    'emergency.police': 'Policía',
    'emergency.medical': 'Médico',
    'emergency.fire': 'Bomberos',
    'emergency.panic': 'Botón de Pánico',
    
    // Common
    'common.loading': 'Cargando...',
    'common.error': 'Error',
    'common.success': 'Éxito',
    'common.cancel': 'Cancelar',
    'common.confirm': 'Confirmar',
    'common.save': 'Guardar',
    'common.delete': 'Eliminar',
    'common.edit': 'Editar',
    'common.view': 'Ver',
    'common.close': 'Cerrar',
    'common.yes': 'Sí',
    'common.no': 'No',
    
    // Location
    'location.requesting': 'Solicitando acceso a ubicación...',
    'location.denied': 'Acceso a ubicación denegado',
    'location.unavailable': 'Ubicación no disponible',
    'location.accuracy': 'Precisión',
    'location.lastUpdated': 'Última actualización',
    
    // Alerts
    'alerts.noAlerts': 'No hay alertas recientes',
    'alerts.acknowledge': 'Reconocer',
    'alerts.viewAll': 'Ver Todo',
    'alerts.high': 'Alta Prioridad',
    'alerts.medium': 'Prioridad Media',
    'alerts.low': 'Baja Prioridad',
  },
  
  fr: {
    // Header
    'app.title': 'Plateforme de Sécurité Touristique',
    'nav.dashboard': 'Tableau de Bord',
    'nav.safety': 'Sécurité',
    'nav.map': 'Carte',
    'nav.emergency': 'Urgence',
    'nav.profile': 'Profil',
    'nav.logout': 'Déconnexion',
    
    // Dashboard
    'dashboard.welcome': 'Bienvenue dans la Sécurité Touristique',
    'dashboard.safetyScore': 'Score de Sécurité',
    'dashboard.currentLocation': 'Localisation Actuelle',
    'dashboard.recentAlerts': 'Alertes Récentes',
    'dashboard.batteryLevel': 'Niveau de Batterie',
    'dashboard.emergencyContacts': 'Contacts d\'Urgence',
    
    // Safety
    'safety.title': 'Informations de Sécurité',
    'safety.riskLevel': 'Niveau de Risque',
    'safety.recommendations': 'Recommandations',
    'safety.tips': 'Conseils de Sécurité',
    
    // Emergency
    'emergency.sos': 'SOS Urgence',
    'emergency.police': 'Police',
    'emergency.medical': 'Médical',
    'emergency.fire': 'Pompiers',
    'emergency.panic': 'Bouton de Panique',
    
    // Common
    'common.loading': 'Chargement...',
    'common.error': 'Erreur',
    'common.success': 'Succès',
    'common.cancel': 'Annuler',
    'common.confirm': 'Confirmer',
    'common.save': 'Enregistrer',
    'common.delete': 'Supprimer',
    'common.edit': 'Modifier',
    'common.view': 'Voir',
    'common.close': 'Fermer',
    'common.yes': 'Oui',
    'common.no': 'Non',
    
    // Location
    'location.requesting': 'Demande d\'accès à la localisation...',
    'location.denied': 'Accès à la localisation refusé',
    'location.unavailable': 'Localisation indisponible',
    'location.accuracy': 'Précision',
    'location.lastUpdated': 'Dernière mise à jour',
    
    // Alerts
    'alerts.noAlerts': 'Aucune alerte récente',
    'alerts.acknowledge': 'Accuser Réception',
    'alerts.viewAll': 'Voir Tout',
    'alerts.high': 'Haute Priorité',
    'alerts.medium': 'Priorité Moyenne',
    'alerts.low': 'Faible Priorité',
  },
  
  ar: {
    // Header
    'app.title': 'منصة أمان السياح',
    'nav.dashboard': 'لوحة التحكم',
    'nav.safety': 'الأمان',
    'nav.map': 'الخريطة',
    'nav.emergency': 'الطوارئ',
    'nav.profile': 'الملف الشخصي',
    'nav.logout': 'تسجيل الخروج',
    
    // Dashboard
    'dashboard.welcome': 'مرحباً بك في أمان السياح',
    'dashboard.safetyScore': 'نقاط الأمان',
    'dashboard.currentLocation': 'الموقع الحالي',
    'dashboard.recentAlerts': 'التنبيهات الأخيرة',
    'dashboard.batteryLevel': 'مستوى البطارية',
    'dashboard.emergencyContacts': 'جهات الاتصال الطارئة',
    
    // Safety
    'safety.title': 'معلومات الأمان',
    'safety.riskLevel': 'مستوى المخاطر',
    'safety.recommendations': 'التوصيات',
    'safety.tips': 'نصائح الأمان',
    
    // Emergency
    'emergency.sos': 'استغاثة طارئة',
    'emergency.police': 'الشرطة',
    'emergency.medical': 'طبي',
    'emergency.fire': 'الإطفاء',
    'emergency.panic': 'زر الذعر',
    
    // Common
    'common.loading': 'جارٍ التحميل...',
    'common.error': 'خطأ',
    'common.success': 'نجح',
    'common.cancel': 'إلغاء',
    'common.confirm': 'تأكيد',
    'common.save': 'حفظ',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.view': 'عرض',
    'common.close': 'إغلاق',
    'common.yes': 'نعم',
    'common.no': 'لا',
    
    // Location
    'location.requesting': 'طلب الوصول للموقع...',
    'location.denied': 'تم رفض الوصول للموقع',
    'location.unavailable': 'الموقع غير متاح',
    'location.accuracy': 'الدقة',
    'location.lastUpdated': 'آخر تحديث',
    
    // Alerts
    'alerts.noAlerts': 'لا توجد تنبيهات حديثة',
    'alerts.acknowledge': 'إقرار',
    'alerts.viewAll': 'عرض الكل',
    'alerts.high': 'أولوية عالية',
    'alerts.medium': 'أولوية متوسطة',
    'alerts.low': 'أولوية منخفضة',
  },
  
  zh: {
    // Header
    'app.title': '游客安全平台',
    'nav.dashboard': '仪表板',
    'nav.safety': '安全',
    'nav.map': '地图',
    'nav.emergency': '紧急情况',
    'nav.profile': '个人资料',
    'nav.logout': '登出',
    
    // Dashboard
    'dashboard.welcome': '欢迎使用游客安全系统',
    'dashboard.safetyScore': '安全评分',
    'dashboard.currentLocation': '当前位置',
    'dashboard.recentAlerts': '最近警报',
    'dashboard.batteryLevel': '电池电量',
    'dashboard.emergencyContacts': '紧急联系人',
    
    // Safety
    'safety.title': '安全信息',
    'safety.riskLevel': '风险等级',
    'safety.recommendations': '建议',
    'safety.tips': '安全提示',
    
    // Emergency
    'emergency.sos': 'SOS紧急求救',
    'emergency.police': '警察',
    'emergency.medical': '医疗',
    'emergency.fire': '消防部门',
    'emergency.panic': '紧急按钮',
    
    // Common
    'common.loading': '加载中...',
    'common.error': '错误',
    'common.success': '成功',
    'common.cancel': '取消',
    'common.confirm': '确认',
    'common.save': '保存',
    'common.delete': '删除',
    'common.edit': '编辑',
    'common.view': '查看',
    'common.close': '关闭',
    'common.yes': '是',
    'common.no': '否',
    
    // Location
    'location.requesting': '请求位置访问权限...',
    'location.denied': '位置访问被拒绝',
    'location.unavailable': '位置不可用',
    'location.accuracy': '精确度',
    'location.lastUpdated': '最后更新',
    
    // Alerts
    'alerts.noAlerts': '没有最近的警报',
    'alerts.acknowledge': '确认',
    'alerts.viewAll': '查看全部',
    'alerts.high': '高优先级',
    'alerts.medium': '中优先级',
    'alerts.low': '低优先级',
  },

  ja: {
    // Header
    'app.title': '観光客安全プラットフォーム',
    'nav.dashboard': 'ダッシュボード',
    'nav.safety': '安全',
    'nav.map': 'マップ',
    'nav.emergency': '緊急',
    'nav.profile': 'プロフィール',
    'nav.logout': 'ログアウト',
    
    // Dashboard
    'dashboard.welcome': '観光客安全システムへようこそ',
    'dashboard.safetyScore': '安全スコア',
    'dashboard.currentLocation': '現在位置',
    'dashboard.recentAlerts': '最近のアラート',
    'dashboard.batteryLevel': 'バッテリーレベル',
    'dashboard.emergencyContacts': '緊急連絡先',
    'dashboard.overview': '概要',
    'dashboard.reviews': 'レビュー',
    'dashboard.itinerary': '旅程',
    'dashboard.offline': 'オフライン',
    'dashboard.nightMode': 'ナイトモード',
    'dashboard.offlineMode': 'オフラインモード',
    'dashboard.connected': '接続済み',
    'dashboard.safe': '安全ゾーン',
    
    // Safety
    'safety.title': '安全情報',
    'safety.riskLevel': 'リスクレベル',
    'safety.recommendations': '推奨事項',
    'safety.tips': '安全のヒント',
    'safety.safety': '安全',
    
    // Emergency
    'emergency.sos': 'SOS緊急',
    'emergency.police': '警察',
    'emergency.medical': '医療',
    'emergency.fire': '消防署',
    'emergency.panic': 'パニックボタン',
    'emergency.emergency': '緊急',
    'emergency.helpline': '緊急ヘルプライン',
    'emergency.quickCall': 'クイックコール',
    'emergency.contacts': '緊急連絡先',
    
    // Common
    'common.loading': '読み込み中...',
    'common.error': 'エラー',
    'common.success': '成功',
    'common.cancel': 'キャンセル',
    'common.confirm': '確認',
    'common.save': '保存',
    'common.delete': '削除',
    'common.edit': '編集',
    'common.view': '表示',
    'common.close': '閉じる',
    'common.yes': 'はい',
    'common.no': 'いいえ',
    'common.appName': '観光客安全',
    'common.tagline': 'あなたの安全が私たちの優先事項',
    'common.map': 'マップ',
    'common.profile': 'プロフィール',
    'common.settings': '設定',
    'common.analytics': '分析',
    'common.logout': 'ログアウト',
    'common.goodMorning': 'おはようございます',
    'common.goodAfternoon': 'こんにちは',
    'common.goodEvening': 'こんばんは',
    'common.crowd': '人混み',
    'common.police': '警察',
    
    // Location
    'location.requesting': '位置情報アクセスを要求中...',
    'location.denied': '位置情報アクセスが拒否されました',
    'location.unavailable': '位置情報が利用できません',
    'location.accuracy': '精度',
    'location.lastUpdated': '最終更新',
    
    // Alerts
    'alerts.noAlerts': '最近のアラートはありません',
    'alerts.acknowledge': '確認',
    'alerts.viewAll': 'すべて表示',
    'alerts.high': '高優先度',
    'alerts.medium': '中優先度',
    'alerts.low': '低優先度',
    'alerts.critical': '重要なアラート',
    
    // Nested structure
    common: {
      appName: '観光客安全',
      tagline: 'あなたの安全が私たちの優先事項',
      loading: '読み込み中...',
      map: 'マップ',
      profile: 'プロフィール',
      settings: '設定',
      analytics: '分析',
      logout: 'ログアウト',
      goodMorning: 'おはようございます',
      goodAfternoon: 'こんにちは',
      goodEvening: 'こんばんは',
      crowd: '人混み',
      police: '警察'
    },
    dashboard: {
      welcome: 'ようこそ',
      safetyScore: '安全スコア',
      currentLocation: '現在位置',
      overview: '概要',
      reviews: 'レビュー',
      itinerary: '旅程',
      offline: 'オフライン',
      nightMode: 'ナイトモード',
      offlineMode: 'オフラインモード',
      connected: '接続済み',
      safe: '安全ゾーン'
    },
    safety: {
      safety: '安全'
    },
    emergency: {
      emergency: '緊急',
      helpline: '緊急ヘルプライン',
      quickCall: 'クイックコール',
      contacts: '緊急連絡先'
    }
  },

  de: {
    // Header
    'app.title': 'Touristen-Sicherheitsplattform',
    'nav.dashboard': 'Dashboard',
    'nav.safety': 'Sicherheit',
    'nav.map': 'Karte',
    'nav.emergency': 'Notfall',
    'nav.profile': 'Profil',
    'nav.logout': 'Abmelden',
    
    // Dashboard
    'dashboard.welcome': 'Willkommen bei Touristen-Sicherheit',
    'dashboard.safetyScore': 'Sicherheitsbewertung',
    'dashboard.currentLocation': 'Aktuelle Position',
    'dashboard.recentAlerts': 'Aktuelle Warnungen',
    'dashboard.batteryLevel': 'Batteriestand',
    'dashboard.emergencyContacts': 'Notfallkontakte',
    'dashboard.overview': 'Übersicht',
    'dashboard.reviews': 'Bewertungen',
    'dashboard.itinerary': 'Reiseplan',
    'dashboard.offline': 'Offline',
    'dashboard.nightMode': 'Nachtmodus',
    'dashboard.offlineMode': 'Offline-Modus',
    'dashboard.connected': 'Verbunden',
    'dashboard.safe': 'Sichere Zone',
    
    // Safety
    'safety.title': 'Sicherheitsinformationen',
    'safety.riskLevel': 'Risikostufe',
    'safety.recommendations': 'Empfehlungen',
    'safety.tips': 'Sicherheitstipps',
    'safety.safety': 'Sicherheit',
    
    // Emergency
    'emergency.sos': 'SOS-Notfall',
    'emergency.police': 'Polizei',
    'emergency.medical': 'Medizinisch',
    'emergency.fire': 'Feuerwehr',
    'emergency.panic': 'Panik-Taste',
    'emergency.emergency': 'Notfall',
    'emergency.helpline': 'Notfall-Hotline',
    'emergency.quickCall': 'Schnellanruf',
    'emergency.contacts': 'Notfallkontakte',
    
    // Common
    'common.loading': 'Laden...',
    'common.error': 'Fehler',
    'common.success': 'Erfolg',
    'common.cancel': 'Abbrechen',
    'common.confirm': 'Bestätigen',
    'common.save': 'Speichern',
    'common.delete': 'Löschen',
    'common.edit': 'Bearbeiten',
    'common.view': 'Anzeigen',
    'common.close': 'Schließen',
    'common.yes': 'Ja',
    'common.no': 'Nein',
    'common.appName': 'Touristen-Sicherheit',
    'common.tagline': 'Ihre Sicherheit, unsere Priorität',
    'common.map': 'Karte',
    'common.profile': 'Profil',
    'common.settings': 'Einstellungen',
    'common.analytics': 'Analytik',
    'common.logout': 'Abmelden',
    'common.goodMorning': 'Guten Morgen',
    'common.goodAfternoon': 'Guten Tag',
    'common.goodEvening': 'Guten Abend',
    'common.crowd': 'Menschenmenge',
    'common.police': 'Polizei',
    
    // Location
    'location.requesting': 'Standortzugriff anfordern...',
    'location.denied': 'Standortzugriff verweigert',
    'location.unavailable': 'Standort nicht verfügbar',
    'location.accuracy': 'Genauigkeit',
    'location.lastUpdated': 'Zuletzt aktualisiert',
    
    // Alerts
    'alerts.noAlerts': 'Keine aktuellen Warnungen',
    'alerts.acknowledge': 'Bestätigen',
    'alerts.viewAll': 'Alle anzeigen',
    'alerts.high': 'Hohe Priorität',
    'alerts.medium': 'Mittlere Priorität',
    'alerts.low': 'Niedrige Priorität',
    'alerts.critical': 'Kritische Warnung',
    
    // Nested structure
    common: {
      appName: 'Touristen-Sicherheit',
      tagline: 'Ihre Sicherheit, unsere Priorität',
      loading: 'Laden...',
      map: 'Karte',
      profile: 'Profil',
      settings: 'Einstellungen',
      analytics: 'Analytik',
      logout: 'Abmelden',
      goodMorning: 'Guten Morgen',
      goodAfternoon: 'Guten Tag',
      goodEvening: 'Guten Abend',
      crowd: 'Menschenmenge',
      police: 'Polizei'
    },
    dashboard: {
      welcome: 'Willkommen',
      safetyScore: 'Sicherheitsbewertung',
      currentLocation: 'Aktuelle Position',
      overview: 'Übersicht',
      reviews: 'Bewertungen',
      itinerary: 'Reiseplan',
      offline: 'Offline',
      nightMode: 'Nachtmodus',
      offlineMode: 'Offline-Modus',
      connected: 'Verbunden',
      safe: 'Sichere Zone'
    },
    safety: {
      safety: 'Sicherheit'
    },
    emergency: {
      emergency: 'Notfall',
      helpline: 'Notfall-Hotline',
      quickCall: 'Schnellanruf',
      contacts: 'Notfallkontakte'
    }
  },

  pt: {
    'common.appName': 'Segurança do Turista',
    common: { appName: 'Segurança do Turista' }
  },

  ru: {
    'common.appName': 'Безопасность Туристов',
    common: { appName: 'Безопасность Туристов' }
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  };

  // Create a simple translation function and object
  const currentTranslations = translations[language] || translations.en;
  const fallbackTranslations = translations.en;

  const translateFunction = (key: string): string => {
    return currentTranslations[key] || fallbackTranslations[key] || key;
  };

  // Create the t object with both function call and property access
  const t = Object.assign(translateFunction, {
    // Direct property access for nested structures
    common: currentTranslations.common || fallbackTranslations.common || {},
    dashboard: currentTranslations.dashboard || fallbackTranslations.dashboard || {},
    safety: currentTranslations.safety || fallbackTranslations.safety || {},
    emergency: currentTranslations.emergency || fallbackTranslations.emergency || {},
    
    // Flat key access
    ...currentTranslations
  });

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};