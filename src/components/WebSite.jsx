import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Filter, MapPin, Clock, Star, Heart, Eye, X, Map, 
  SlidersHorizontal, Sparkles, TrendingUp, Award, Users,
  Phone, Globe, Navigation, ChevronDown, ArrowRight, Menu
} from 'lucide-react';

// Расширенные данные заведений
const venuesData = [
  {
    id: 1,
    name: "Ресторан Арарат",
    category: "restaurant",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
    rating: 5,
    reviewCount: 342,
    address: "ул. Абовяна 12, Ереван",
    workingHours: "10:00 - 23:00",
    description: "Традиционная армянская кухня в элегантной атмосфере",
    priceRange: "$$$",
    phone: "+374 11 123456",
    website: "www.ararat-restaurant.am",
    features: ["WiFi", "Parking", "Live Music", "Terrace"],
    capacity: 120,
    cuisine: "Армянская",
    isPopular: true,
    isFeatured: true,
    gallery: [
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=800&h=600&fit=crop"
    ]
  },
  {
    id: 2,
    name: "Кафе Ереван",
    category: "cafe",
    image: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop",
    rating: 4.5,
    reviewCount: 128,
    address: "пр. Маштоца 25, Ереван",
    workingHours: "08:00 - 22:00",
    description: "Уютное кафе с домашней атмосферой и свежей выпечкой",
    priceRange: "$$",
    phone: "+374 11 234567",
    website: "www.cafe-yerevan.am",
    features: ["WiFi", "Breakfast", "Desserts", "Coffee"],
    capacity: 45,
    cuisine: "Европейская",
    isPopular: false,
    isFeatured: false,
    gallery: [
      "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop"
    ]
  },
  {
    id: 3,
    name: "Шашлычная Кавказ",
    category: "restaurant",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop",
    rating: 4.7,
    reviewCount: 256,
    address: "ул. Сарьяна 8, Ереван",
    workingHours: "12:00 - 24:00",
    description: "Лучший шашлык в городе с живым огнем и традиционными рецептами",
    priceRange: "$$",
    phone: "+374 11 345678",
    features: ["Grill", "Outdoor", "Live Fire", "Traditional"],
    capacity: 80,
    cuisine: "Кавказская",
    isPopular: true,
    isFeatured: false,
    gallery: [
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1558030006-450675393462?w=800&h=600&fit=crop"
    ]
  },
  {
    id: 4,
    name: "Кальян-бар Oasis",
    category: "hookah",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
    rating: 4.3,
    reviewCount: 89,
    address: "ул. Туманяна 15, Ереван",
    workingHours: "18:00 - 02:00",
    description: "Премиум кальяны, авторские коктейли и расслабляющая атмосфера",
    priceRange: "$$$",
    phone: "+374 11 456789",
    features: ["Premium Hookah", "Cocktails", "VIP Rooms", "DJ"],
    capacity: 60,
    isPopular: false,
    isFeatured: true,
    gallery: [
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&h=600&fit=crop"
    ]
  },
  {
    id: 5,
    name: "Sky Lounge",
    category: "bar",
    image: "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&h=600&fit=crop",
    rating: 4.6,
    reviewCount: 174,
    address: "ул. Северный проспект 3, 12 этаж",
    workingHours: "19:00 - 03:00",
    description: "Панорамный бар на крыше с видом на весь Ереван",
    priceRange: "$$$$",
    phone: "+374 11 567890",
    website: "www.skylounge.am",
    features: ["Rooftop", "City View", "Cocktails", "Live DJ"],
    capacity: 100,
    isPopular: true,
    isFeatured: true,
    gallery: [
      "https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=800&h=600&fit=crop",
      "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800&h=600&fit=crop"
    ]
  },
  {
    id: 6,
    name: "Coffee Time",
    category: "cafe",
    image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop",
    rating: 4.4,
    reviewCount: 67,
    address: "ул. Комитаса 45, Ереван",
    workingHours: "07:00 - 21:00",
    description: "Артизанальный кофе, свежая выпечка и коворкинг зона",
    priceRange: "$",
    phone: "+374 11 678901",
    features: ["Specialty Coffee", "Coworking", "Pastries", "WiFi"],
    capacity: 30,
    cuisine: "Coffee & Pastries",
    isPopular: false,
    isFeatured: false,
    gallery: [
      "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&h=600&fit=crop"
    ]
  }
];

const categories = [
  { id: 'all', name: 'Все заведения', icon: '🏢', color: 'purple' },
  { id: 'restaurant', name: 'Рестораны', icon: '🍽️', color: 'orange' },
  { id: 'cafe', name: 'Кафе', icon: '☕', color: 'amber' },
  { id: 'bar', name: 'Бары', icon: '🍺', color: 'blue' },
  { id: 'hookah', name: 'Кальян-бары', icon: '💨', color: 'green' }
];

const sortOptions = [
  { id: 'rating', name: 'По рейтингу', icon: Star },
  { id: 'popular', name: 'Популярные', icon: TrendingUp },
  { id: 'name', name: 'По названию', icon: Filter }
];

export default function VenueExplorer() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [favorites, setFavorites] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('rating');
  const [showModal, setShowModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid or list
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Симуляция загрузки
  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  // Фильтрация и сортировка
  const filteredAndSortedVenues = useMemo(() => {
    let filtered = venuesData.filter(venue => {
      const matchesCategory = selectedCategory === 'all' || venue.category === selectedCategory;
      const matchesSearch = venue.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           venue.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           venue.address.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    // Сортировка
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating;
        case 'popular':
          return b.reviewCount - a.reviewCount;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [selectedCategory, searchTerm, sortBy]);

  const toggleFavorite = (venueId) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(venueId)) {
        newFavorites.delete(venueId);
      } else {
        newFavorites.add(venueId);
      }
      return newFavorites;
    });
  };

  const openVenueModal = (venue) => {
    setSelectedVenue(venue);
    setCurrentImageIndex(0);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedVenue(null);
  };

  const openVenueHall = (venue) => {
    alert(`🏢 Открываем зал: ${venue.name}\n\n📋 Здесь будет загрузка JSON с планом зала\n🎯 Интерактивная схема столиков\n📱 Система бронирования`);
  };

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1e293b 0%, #7c3aed 50%, #1e293b 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div className="text-center">
          <div className="relative">
            <div style={{
              width: '80px',
              height: '80px',
              border: '4px solid rgba(168, 85, 247, 0.3)',
              borderTop: '4px solid #a855f7',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <Sparkles className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-purple-400 w-8 h-8" style={{animation: 'pulse 2s infinite'}} />
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">VenueMap</h2>
          <p className="text-purple-200">Загружаем лучшие заведения города...</p>
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e293b 0%, #7c3aed 25%, #ec4899 50%, #7c3aed 75%, #1e293b 100%)',
      position: 'relative'
    }}>
      {/* Animated Background Shapes */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 1
      }}>
        <div style={{
          position: 'absolute',
          top: '-160px',
          right: '-160px',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-160px',
          left: '-160px',
          width: '320px',
          height: '320px',
          background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>
      </div>

      {/* Header */}
      <header style={{
        position: 'relative',
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center mb-8">
            <div className="flex justify-center items-center gap-3 mb-4">
              <div style={{
                padding: '12px',
                background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(139, 92, 246, 0.3)'
              }}>
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 style={{
                fontSize: '3rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #ffffff 0%, #e879f9 50%, #fbbf24 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                VenueMap
              </h1>
            </div>
            <p className="text-xl text-white max-w-2xl mx-auto" style={{opacity: 0.9}}>
              Откройте для себя лучшие заведения Еревана с интерактивными планами залов
            </p>
          </div>

          {/* Search and Controls */}
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white w-5 h-5" style={{opacity: 0.7}} />
              <input
                type="text"
                placeholder="Найти идеальное место..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '3rem',
                  paddingRight: '1rem',
                  paddingTop: '1rem',
                  paddingBottom: '1rem',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none',
                  transition: 'all 0.3s ease'
                }}
                onFocus={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.15)';
                  e.target.style.borderColor = 'rgba(139, 92, 246, 0.5)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  e.target.style.borderColor = 'rgba(255, 255, 255, 0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                  }}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Фильтры
                </button>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    padding: '8px 16px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '12px',
                    color: 'white',
                    outline: 'none'
                  }}
                >
                  {sortOptions.map(option => (
                    <option key={option.id} value={option.id} style={{background: '#1e293b', color: 'white'}}>
                      {option.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: viewMode === 'grid' ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                    <div style={{background: 'currentColor', borderRadius: '2px'}}></div>
                    <div style={{background: 'currentColor', borderRadius: '2px'}}></div>
                    <div style={{background: 'currentColor', borderRadius: '2px'}}></div>
                    <div style={{background: 'currentColor', borderRadius: '2px'}}></div>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  style={{
                    padding: '8px',
                    borderRadius: '8px',
                    background: viewMode === 'list' ? 'linear-gradient(135deg, #8b5cf6, #ec4899)' : 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <Menu className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Filter */}
            {showFilters && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: '12px',
                padding: '24px',
                background: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(20px)',
                borderRadius: '16px',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                {categories.map(category => {
                  const isSelected = selectedCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 24px',
                        borderRadius: '16px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        border: 'none',
                        background: isSelected 
                          ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                          : 'rgba(255, 255, 255, 0.1)',
                        color: 'white',
                        transition: 'all 0.3s ease',
                        transform: 'scale(1)',
                        boxShadow: isSelected ? '0 8px 32px rgba(139, 92, 246, 0.3)' : 'none'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.target.style.background = 'rgba(255, 255, 255, 0.2)';
                        }
                        e.target.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.target.style.background = 'rgba(255, 255, 255, 0.1)';
                        }
                        e.target.style.transform = 'scale(1)';
                      }}
                    >
                      <span style={{fontSize: '20px'}}>{category.icon}</span>
                      {category.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{position: 'relative', zIndex: 10}} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Bar */}
        <div style={{
          marginBottom: '32px',
          padding: '24px',
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div className="flex flex-wrap justify-between items-center gap-4">
            <div>
              <p className="text-white" style={{opacity: 0.9}}>
                Найдено заведений: <span style={{fontWeight: 'bold', color: '#e879f9', fontSize: '20px'}}>{filteredAndSortedVenues.length}</span>
              </p>
            </div>
            <div className="flex items-center gap-6 text-sm text-white" style={{opacity: 0.7}}>
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                {favorites.size} избранных
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                {venuesData.filter(v => v.isFeatured).length} рекомендуемых
              </div>
            </div>
          </div>
        </div>

        {/* Featured Venues */}
        {selectedCategory === 'all' && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-purple-400" />
              Рекомендуемые заведения
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {venuesData.filter(v => v.isFeatured).map(venue => (
                <VenueCard
                  key={venue.id}
                  venue={venue}
                  isFavorite={favorites.has(venue.id)}
                  onToggleFavorite={toggleFavorite}
                  onViewDetails={openVenueModal}
                  onOpenHall={openVenueHall}
                  featured={true}
                />
              ))}
            </div>
          </div>
        )}

        {/* Venues Grid/List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredAndSortedVenues.map(venue => (
            <VenueCard
              key={venue.id}
              venue={venue}
              isFavorite={favorites.has(venue.id)}
              onToggleFavorite={toggleFavorite}
              onViewDetails={openVenueModal}
              onOpenHall={openVenueHall}
              viewMode={viewMode}
            />
          ))}
        </div>

        {/* Empty State */}
        {filteredAndSortedVenues.length === 0 && (
          <div className="text-center py-16">
            <div style={{fontSize: '5rem', marginBottom: '24px'}}>🔍</div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Заведения не найдены
            </h3>
            <p className="text-white text-lg max-w-md mx-auto" style={{opacity: 0.7}}>
              Попробуйте изменить фильтры или поисковый запрос для поиска подходящих заведений
            </p>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && selectedVenue && (
        <VenueModal
          venue={selectedVenue}
          currentImageIndex={currentImageIndex}
          onClose={closeModal}
          onNextImage={() => setCurrentImageIndex((prev) => (prev + 1) % selectedVenue.gallery.length)}
          onPrevImage={() => setCurrentImageIndex((prev) => (prev - 1 + selectedVenue.gallery.length) % selectedVenue.gallery.length)}
          onOpenHall={openVenueHall}
          isFavorite={favorites.has(selectedVenue.id)}
          onToggleFavorite={toggleFavorite}
        />
      )}

      {/* Footer */}
      <footer style={{
        position: 'relative',
        zIndex: 10,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        marginTop: '80px',
        padding: '48px 0'
      }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center items-center gap-3 mb-4">
            <div style={{
              padding: '8px',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              borderRadius: '8px'
            }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">VenueMap</h3>
          </div>
          <p className="text-white" style={{opacity: 0.7}}>© 2025 VenueMap. Откройте для себя лучшие места Еревана.</p>
        </div>
      </footer>

      {/* Custom Styles */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
          }
          ::placeholder {
            color: rgba(255, 255, 255, 0.6) !important;
          }
        `}
      </style>
    </div>
  );
}

// Venue Card Component
function VenueCard({ venue, isFavorite, onToggleFavorite, onViewDetails, onOpenHall, viewMode = 'grid', featured = false }) {
  if (viewMode === 'list') {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        padding: '24px',
        transition: 'all 0.3s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = 'rgba(255, 255, 255, 0.15)';
        e.target.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
        e.target.style.transform = 'translateY(0)';
      }}
      >
        <div className="flex gap-6">
          <div style={{width: '128px', height: '96px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0}}>
            <img src={venue.image} alt={venue.name} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
          </div>
          <div style={{flex: 1}}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-white">{venue.name}</h3>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" style={{fill: 'currentColor'}} />
                <span className="text-white font-semibold">{venue.rating}</span>
              </div>
            </div>
            <p className="text-white mb-3" style={{opacity: 0.8}}>{venue.description}</p>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4 text-sm text-white" style={{opacity: 0.7}}>
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {venue.address.split(',')[0]}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {venue.workingHours}
                </span>
              </div>
              <button
                onClick={() => onOpenHall(venue)}
                style={{
                  padding: '8px 16px',
                  background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.3)';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = 'none';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                Открыть зал
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: featured ? '2px solid rgba(139, 92, 246, 0.5)' : '1px solid rgba(255, 255, 255, 0.2)',
        overflow: 'hidden',
        transition: 'all 0.5s ease',
        cursor: 'pointer',
        boxShadow: featured ? '0 20px 40px rgba(139, 92, 246, 0.2)' : 'none'
      }}
      onMouseEnter={(e) => {
        e.target.style.background = 'rgba(255, 255, 255, 0.15)';
        e.target.style.transform = 'translateY(-8px)';
        e.target.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'rgba(255, 255, 255, 0.1)';
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = featured ? '0 20px 40px rgba(139, 92, 246, 0.2)' : 'none';
      }}
    >
      {/* Image */}
      <div style={{position: 'relative', height: '224px', overflow: 'hidden'}}>
        <img
          src={venue.image}
          alt={venue.name}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.7s ease'
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        />
        
        {/* Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)'
        }} />
        
        {/* Badges */}
        <div style={{position: 'absolute', top: '16px', left: '16px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
          {venue.isPopular && (
            <span style={{
              padding: '4px 12px',
              background: 'linear-gradient(135deg, #f97316, #dc2626)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <TrendingUp className="w-3 h-3" />
              Популярное
            </span>
          )}
          {featured && (
            <span style={{
              padding: '4px 12px',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              color: 'white',
              fontSize: '12px',
              fontWeight: 'bold',
              borderRadius: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <Award className="w-3 h-3" />
              Рекомендуем
            </span>
          )}
        </div>

        {/* Rating and Favorite */}
        <div style={{position: 'absolute', top: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '8px'}}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '4px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Star className="w-4 h-4 text-yellow-500" style={{fill: 'currentColor'}} />
            <span style={{fontWeight: 'bold', fontSize: '14px', color: '#1f2937'}}>{venue.rating}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(venue.id);
            }}
            style={{
              padding: '8px',
              borderRadius: '50%',
              backdropFilter: 'blur(10px)',
              background: isFavorite ? '#ef4444' : 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = isFavorite ? '#dc2626' : 'rgba(255, 255, 255, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = isFavorite ? '#ef4444' : 'rgba(255, 255, 255, 0.2)';
            }}
          >
            <Heart className={`w-4 h-4 ${isFavorite ? '' : ''}`} style={isFavorite ? {fill: 'currentColor'} : {}} />
          </button>
        </div>

        {/* Quick Actions */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          display: 'flex',
          gap: '8px',
          opacity: 0,
          transition: 'opacity 0.3s ease'
        }}
        className="group-hover-actions"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewDetails(venue);
            }}
            style={{
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '50%',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenHall(venue);
            }}
            style={{
              padding: '8px',
              background: '#8b5cf6',
              borderRadius: '50%',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            <Map className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{padding: '24px'}}>
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold text-white" style={{transition: 'color 0.3s ease'}}>
            {venue.name}
          </h3>
          <span style={{color: '#e879f9', fontWeight: '600'}}>{venue.priceRange}</span>
        </div>

        <p className="text-white mb-4" style={{opacity: 0.8, lineHeight: '1.5'}}>
          {venue.description}
        </p>

        {/* Features */}
        <div className="flex flex-wrap gap-1 mb-4">
          {venue.features?.slice(0, 3).map(feature => (
            <span key={feature} style={{
              padding: '2px 8px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              fontSize: '12px',
              color: 'white',
              opacity: 0.9
            }}>
              {feature}
            </span>
          ))}
          {venue.features?.length > 3 && (
            <span style={{
              padding: '2px 8px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              fontSize: '12px',
              color: 'white',
              opacity: 0.9
            }}>
              +{venue.features.length - 3}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="space-y-2 text-sm text-white mb-6" style={{opacity: 0.7}}>
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {venue.address}
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            {venue.workingHours}
          </div>
          {venue.capacity && (
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              До {venue.capacity} человек
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={() => onViewDetails(venue)}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              borderRadius: '12px',
              border: 'none',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            Подробнее
          </button>
          <button
            onClick={() => onOpenHall(venue)}
            style={{
              flex: 1,
              padding: '12px',
              background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
              color: 'white',
              borderRadius: '12px',
              border: 'none',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
            onMouseEnter={(e) => {
              e.target.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4)';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.boxShadow = 'none';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Зал
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <style>
        {`
          .group-hover-actions {
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          div:hover .group-hover-actions {
            opacity: 1;
          }
        `}
      </style>
    </div>
  );
}

// Modal Component (simplified version)
function VenueModal({ venue, currentImageIndex, onClose, onNextImage, onPrevImage, onOpenHall, isFavorite, onToggleFavorite }) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '16px'
    }}>
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)'
      }} onClick={onClose} />
      
      <div style={{
        position: 'relative',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        maxWidth: '1024px',
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '24px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <h2 className="text-2xl font-bold text-white">{venue.name}</h2>
          <button
            onClick={onClose}
            style={{
              padding: '8px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '50%',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div style={{overflowY: 'auto', maxHeight: 'calc(90vh - 120px)'}}>
          {/* Image Gallery */}
          <div style={{position: 'relative', height: '320px'}}>
            <img
              src={venue.gallery[currentImageIndex]}
              alt={venue.name}
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
            />
            
            {venue.gallery.length > 1 && (
              <>
                <button
                  onClick={onPrevImage}
                  style={{
                    position: 'absolute',
                    left: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '8px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: '50%',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <ChevronDown style={{transform: 'rotate(90deg)'}} className="w-6 h-6" />
                </button>
                <button
                  onClick={onNextImage}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '8px',
                    background: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: '50%',
                    color: 'white',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  <ChevronDown style={{transform: 'rotate(-90deg)'}} className="w-6 h-6" />
                </button>
                
                <div style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '8px'
                }}>
                  {venue.gallery.map((_, index) => (
                    <div
                      key={index}
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: index === currentImageIndex ? 'white' : 'rgba(255, 255, 255, 0.5)',
                        transition: 'all 0.3s ease'
                      }}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Content */}
          <div style={{padding: '24px'}}>
            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-yellow-400" style={{fill: 'currentColor'}} />
                    <span className="text-white font-bold text-lg">{venue.rating}</span>
                    <span className="text-white" style={{opacity: 0.7}}>({venue.reviewCount} отзывов)</span>
                  </div>
                  <span style={{color: '#e879f9', fontWeight: '600', fontSize: '18px'}}>{venue.priceRange}</span>
                </div>

                <p className="text-white text-lg mb-6" style={{opacity: 0.9, lineHeight: '1.6'}}>{venue.description}</p>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="text-white font-semibold mb-3">Особенности:</h4>
                  <div className="flex flex-wrap gap-2">
                    {venue.features?.map(feature => (
                      <span key={feature} style={{
                        padding: '6px 12px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '20px',
                        fontSize: '14px',
                        color: 'white'
                      }}>
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                <div className="space-y-4 mb-6">
                  <div className="flex items-center gap-3 text-white">
                    <MapPin className="w-5 h-5 text-purple-400" />
                    <span>{venue.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-white">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <span>{venue.workingHours}</span>
                  </div>
                  {venue.phone && (
                    <div className="flex items-center gap-3 text-white">
                      <Phone className="w-5 h-5 text-purple-400" />
                      <span>{venue.phone}</span>
                    </div>
                  )}
                  {venue.website && (
                    <div className="flex items-center gap-3 text-white">
                      <Globe className="w-5 h-5 text-purple-400" />
                      <span>{venue.website}</span>
                    </div>
                  )}
                  {venue.capacity && (
                    <div className="flex items-center gap-3 text-white">
                      <Users className="w-5 h-5 text-purple-400" />
                      <span>Вместимость: до {venue.capacity} человек</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => onToggleFavorite(venue.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontWeight: '500',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                      background: isFavorite ? '#ef4444' : 'rgba(255, 255, 255, 0.1)',
                      color: 'white'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = isFavorite ? '#dc2626' : 'rgba(255, 255, 255, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = isFavorite ? '#ef4444' : 'rgba(255, 255, 255, 0.1)';
                    }}
                  >
                    <Heart className={`w-5 h-5`} style={isFavorite ? {fill: 'currentColor'} : {}} />
                    {isFavorite ? 'В избранном' : 'В избранное'}
                  </button>
                  <button
                    onClick={() => onOpenHall(venue)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, #8b5cf6, #ec4899)',
                      color: 'white',
                      borderRadius: '12px',
                      border: 'none',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.boxShadow = '0 8px 25px rgba(139, 92, 246, 0.4)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <Map className="w-5 h-5" />
                    Открыть план зала
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}