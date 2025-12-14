import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plane, Calendar, MapPin, Luggage, Hotel, Camera, Utensils,
  Clock, CheckCircle2, Circle, ChevronRight, Sun, Cloud, 
  CloudRain, Plus, Edit2, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { staggerContainer, listItemVariants } from '@/lib/animations';

// Mock trip data
const tripData = {
  destination: 'Paris, France',
  flag: '🇫🇷',
  coverImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&h=400&fit=crop',
  dates: {
    start: 'Dec 20, 2024',
    end: 'Dec 27, 2024',
    daysUntil: 6,
    duration: 7
  },
  flight: {
    outbound: {
      airline: 'Air France',
      flightNumber: 'AF 083',
      departure: { time: '10:30 AM', airport: 'SFO', city: 'San Francisco' },
      arrival: { time: '7:45 PM +1', airport: 'CDG', city: 'Paris' },
      duration: '11h 15m',
      status: 'On Time',
      class: 'Business',
      seat: '4A'
    },
    return: {
      airline: 'Air France',
      flightNumber: 'AF 084',
      departure: { time: '11:00 AM', airport: 'CDG', city: 'Paris' },
      arrival: { time: '2:30 PM', airport: 'SFO', city: 'San Francisco' },
      duration: '11h 30m',
      status: 'On Time',
      class: 'Business',
      seat: '4A'
    }
  },
  hotel: {
    name: 'Hotel Le Marais',
    address: '25 Rue de Rivoli, 75004 Paris',
    rating: 4.8,
    checkIn: 'Dec 20, 3:00 PM',
    checkOut: 'Dec 27, 11:00 AM',
    nights: 7,
    roomType: 'Deluxe Suite',
    amenities: ['WiFi', 'Breakfast', 'Gym', 'Spa']
  },
  itinerary: [
    { 
      day: 1, 
      date: 'Dec 20', 
      title: 'Arrival Day',
      activities: [
        { time: '7:45 PM', title: 'Arrive at CDG', icon: Plane, completed: false },
        { time: '9:00 PM', title: 'Check in at Hotel Le Marais', icon: Hotel, completed: false },
        { time: '10:00 PM', title: 'Dinner at local bistro', icon: Utensils, completed: false },
      ]
    },
    { 
      day: 2, 
      date: 'Dec 21', 
      title: 'Eiffel Tower & Seine',
      activities: [
        { time: '9:00 AM', title: 'Breakfast at hotel', icon: Utensils, completed: false },
        { time: '10:30 AM', title: 'Visit Eiffel Tower', icon: Camera, completed: false },
        { time: '2:00 PM', title: 'Lunch at Café de Flore', icon: Utensils, completed: false },
        { time: '5:00 PM', title: 'Seine River Cruise', icon: Camera, completed: false },
        { time: '8:00 PM', title: 'Dinner in Montmartre', icon: Utensils, completed: false },
      ]
    },
    { 
      day: 3, 
      date: 'Dec 22', 
      title: 'Art & Culture',
      activities: [
        { time: '9:00 AM', title: 'Louvre Museum (morning)', icon: Camera, completed: false },
        { time: '1:00 PM', title: 'Lunch near Tuileries', icon: Utensils, completed: false },
        { time: '3:00 PM', title: "Musée d'Orsay", icon: Camera, completed: false },
        { time: '7:00 PM', title: 'Dinner at Le Comptoir', icon: Utensils, completed: false },
      ]
    },
    { 
      day: 4, 
      date: 'Dec 23', 
      title: 'Versailles Day Trip',
      activities: [
        { time: '8:30 AM', title: 'Train to Versailles', icon: Plane, completed: false },
        { time: '10:00 AM', title: 'Palace of Versailles', icon: Camera, completed: false },
        { time: '2:00 PM', title: 'Gardens & Marie Antoinette Estate', icon: Camera, completed: false },
        { time: '6:00 PM', title: 'Return to Paris', icon: Plane, completed: false },
      ]
    },
    { 
      day: 5, 
      date: 'Dec 24', 
      title: 'Christmas Eve',
      activities: [
        { time: '10:00 AM', title: 'Champs-Élysées shopping', icon: Camera, completed: false },
        { time: '1:00 PM', title: 'Lunch at Ladurée', icon: Utensils, completed: false },
        { time: '4:00 PM', title: 'Notre-Dame area walk', icon: Camera, completed: false },
        { time: '8:00 PM', title: 'Special Christmas dinner', icon: Utensils, completed: false },
      ]
    },
  ],
  packingList: [
    { id: '1', item: 'Passport', packed: true, category: 'documents' },
    { id: '2', item: 'Travel Insurance', packed: true, category: 'documents' },
    { id: '3', item: 'Hotel Confirmation', packed: true, category: 'documents' },
    { id: '4', item: 'Flight Tickets', packed: true, category: 'documents' },
    { id: '5', item: 'Winter Coat', packed: true, category: 'clothing' },
    { id: '6', item: 'Comfortable Walking Shoes', packed: true, category: 'clothing' },
    { id: '7', item: 'Formal Attire', packed: false, category: 'clothing' },
    { id: '8', item: 'Camera', packed: true, category: 'electronics' },
    { id: '9', item: 'Phone Charger', packed: true, category: 'electronics' },
    { id: '10', item: 'Power Adapter (EU)', packed: false, category: 'electronics' },
    { id: '11', item: 'Toiletries', packed: false, category: 'personal' },
    { id: '12', item: 'Medications', packed: true, category: 'personal' },
  ],
  weather: [
    { day: 'Fri 20', temp: 8, icon: Cloud, condition: 'Cloudy' },
    { day: 'Sat 21', temp: 10, icon: Sun, condition: 'Sunny' },
    { day: 'Sun 22', temp: 7, icon: CloudRain, condition: 'Rain' },
    { day: 'Mon 23', temp: 9, icon: Cloud, condition: 'Cloudy' },
    { day: 'Tue 24', temp: 11, icon: Sun, condition: 'Sunny' },
    { day: 'Wed 25', temp: 8, icon: Cloud, condition: 'Cloudy' },
    { day: 'Thu 26', temp: 6, icon: CloudRain, condition: 'Rain' },
  ]
};

export const ExpandedTravelCard = () => {
  const [activeTab, setActiveTab] = useState<'itinerary' | 'packing' | 'details'>('itinerary');
  const [packingList, setPackingList] = useState(tripData.packingList);
  const [selectedDay, setSelectedDay] = useState(1);

  const packingProgress = Math.round(
    (packingList.filter(item => item.packed).length / packingList.length) * 100
  );

  const togglePackingItem = (id: string) => {
    setPackingList(prev => prev.map(item => 
      item.id === id ? { ...item, packed: !item.packed } : item
    ));
  };

  const selectedDayData = tripData.itinerary.find(d => d.day === selectedDay);

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Hero Section */}
      <motion.div 
        className="relative h-48 rounded-2xl overflow-hidden"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <img 
          src={tripData.coverImage} 
          alt={tripData.destination}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <motion.span 
                  className="text-4xl"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {tripData.flag}
                </motion.span>
                <h1 className="text-3xl font-bold text-foreground">{tripData.destination}</h1>
              </div>
              <p className="text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {tripData.dates.start} - {tripData.dates.end}
              </p>
            </div>
            
            {/* Countdown */}
            <div className="flex flex-col items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-violet-500/30 to-purple-500/30 backdrop-blur-sm border border-violet-500/30">
              <span className="text-4xl font-bold text-foreground">{tripData.dates.daysUntil}</span>
              <span className="text-xs text-violet-300 uppercase tracking-wider">Days Left</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 px-2">
        {(['itinerary', 'packing', 'details'] as const).map((tab) => (
          <Button
            key={tab}
            variant={activeTab === tab ? 'default' : 'ghost'}
            className={activeTab === tab ? 'bg-violet-500 hover:bg-violet-600' : ''}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </Button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex gap-6 min-h-0">
        <AnimatePresence mode="wait">
          {activeTab === 'itinerary' && (
            <motion.div 
              key="itinerary"
              className="flex-1 flex gap-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Day Selector */}
              <div className="w-48 shrink-0">
                <ScrollArea className="h-full">
                  <div className="space-y-2 pr-2">
                    {tripData.itinerary.map((day) => (
                      <motion.button
                        key={day.day}
                        onClick={() => setSelectedDay(day.day)}
                        className={`w-full p-3 rounded-xl text-left transition-colors ${
                          selectedDay === day.day 
                            ? 'bg-violet-500/20 border border-violet-500/30' 
                            : 'hover:bg-accent/50'
                        }`}
                        whileHover={{ x: 4 }}
                      >
                        <p className="text-xs text-muted-foreground">Day {day.day}</p>
                        <p className="font-medium text-foreground">{day.date}</p>
                        <p className="text-sm text-violet-400">{day.title}</p>
                      </motion.button>
                    ))}
                  </div>
                </ScrollArea>
              </div>

              {/* Day Activities */}
              <div className="flex-1 bg-card/30 rounded-2xl border border-border/50 p-6 overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">{selectedDayData?.title}</h2>
                    <p className="text-muted-foreground">{selectedDayData?.date}, 2024</p>
                  </div>
                  <Button variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Activity
                  </Button>
                </div>

                <ScrollArea className="h-[calc(100%-4rem)]">
                  <motion.div 
                    className="space-y-4"
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    {selectedDayData?.activities.map((activity, index) => {
                      const Icon = activity.icon;
                      return (
                        <motion.div
                          key={index}
                          variants={listItemVariants}
                          custom={index}
                          className="flex items-start gap-4 p-4 rounded-xl bg-accent/20 border border-border/50 group"
                        >
                          <div className="flex flex-col items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              activity.completed 
                                ? 'bg-emerald-500/20 border border-emerald-500/30' 
                                : 'bg-violet-500/20 border border-violet-500/30'
                            }`}>
                              <Icon className={`w-5 h-5 ${activity.completed ? 'text-emerald-400' : 'text-violet-400'}`} />
                            </div>
                            {index < (selectedDayData?.activities.length || 0) - 1 && (
                              <div className="w-px h-8 bg-border/50 mt-2" />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                              <span className="text-sm text-muted-foreground">{activity.time}</span>
                            </div>
                            <h4 className="font-medium text-foreground">{activity.title}</h4>
                          </div>
                          
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit2 className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </ScrollArea>
              </div>

              {/* Weather Sidebar */}
              <div className="w-56 shrink-0 bg-card/30 rounded-2xl border border-border/50 p-4">
                <h3 className="font-medium text-foreground mb-4">Weather Forecast</h3>
                <div className="space-y-3">
                  {tripData.weather.map((day, index) => {
                    const WeatherIcon = day.icon;
                    return (
                      <motion.div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg hover:bg-accent/20"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <span className="text-sm text-muted-foreground">{day.day}</span>
                        <div className="flex items-center gap-2">
                          <WeatherIcon className="w-5 h-5 text-violet-400" />
                          <span className="font-medium text-foreground">{day.temp}°C</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'packing' && (
            <motion.div 
              key="packing"
              className="flex-1 flex flex-col gap-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Progress */}
              <div className="p-4 bg-card/30 rounded-2xl border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Luggage className="w-5 h-5 text-violet-400" />
                    <h3 className="font-medium text-foreground">Packing Progress</h3>
                  </div>
                  <span className="text-violet-400 font-semibold">{packingProgress}%</span>
                </div>
                <Progress value={packingProgress} className="h-3" />
                <p className="text-sm text-muted-foreground mt-2">
                  {packingList.filter(i => i.packed).length} of {packingList.length} items packed
                </p>
              </div>

              {/* Packing List by Category */}
              <div className="flex-1 grid grid-cols-2 gap-4 min-h-0">
                {['documents', 'clothing', 'electronics', 'personal'].map((category) => {
                  const categoryItems = packingList.filter(i => i.category === category);
                  const categoryProgress = Math.round(
                    (categoryItems.filter(i => i.packed).length / categoryItems.length) * 100
                  );
                  
                  return (
                    <motion.div
                      key={category}
                      className="bg-card/30 rounded-2xl border border-border/50 p-4 flex flex-col"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-medium text-foreground capitalize">{category}</h4>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          categoryProgress === 100 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-violet-500/20 text-violet-400'
                        }`}>
                          {categoryProgress}%
                        </span>
                      </div>
                      
                      <ScrollArea className="flex-1">
                        <div className="space-y-2">
                          {categoryItems.map((item) => (
                            <motion.div
                              key={item.id}
                              className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/20 cursor-pointer"
                              whileHover={{ x: 4 }}
                              onClick={() => togglePackingItem(item.id)}
                            >
                              <Checkbox 
                                checked={item.packed}
                                className="data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                              />
                              <span className={`text-sm ${
                                item.packed ? 'text-muted-foreground line-through' : 'text-foreground'
                              }`}>
                                {item.item}
                              </span>
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'details' && (
            <motion.div 
              key="details"
              className="flex-1 grid grid-cols-2 gap-6"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              {/* Flight Details */}
              <div className="bg-card/30 rounded-2xl border border-border/50 p-6 space-y-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Plane className="w-5 h-5 text-violet-400" />
                  Flight Details
                </h3>

                {/* Outbound */}
                <div className="p-4 bg-accent/20 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-3">Outbound Flight</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{tripData.flight.outbound.airline}</span>
                      <span className="text-sm text-muted-foreground">{tripData.flight.outbound.flightNumber}</span>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded-full">
                      {tripData.flight.outbound.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{tripData.flight.outbound.departure.time}</p>
                      <p className="text-sm text-muted-foreground">{tripData.flight.outbound.departure.airport}</p>
                      <p className="text-xs text-muted-foreground">{tripData.flight.outbound.departure.city}</p>
                    </div>
                    
                    <div className="flex-1 mx-6 relative">
                      <div className="h-px bg-gradient-to-r from-violet-500/50 via-violet-500 to-violet-500/50" />
                      <motion.div
                        className="absolute top-1/2 -translate-y-1/2"
                        animate={{ left: ['10%', '80%'] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <Plane className="w-4 h-4 text-violet-400 rotate-90" />
                      </motion.div>
                      <p className="text-xs text-center text-muted-foreground mt-2">{tripData.flight.outbound.duration}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{tripData.flight.outbound.arrival.time}</p>
                      <p className="text-sm text-muted-foreground">{tripData.flight.outbound.arrival.airport}</p>
                      <p className="text-xs text-muted-foreground">{tripData.flight.outbound.arrival.city}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border/50">
                    <span className="text-sm text-muted-foreground">Seat: <span className="text-foreground">{tripData.flight.outbound.seat}</span></span>
                    <span className="text-sm text-muted-foreground">Class: <span className="text-foreground">{tripData.flight.outbound.class}</span></span>
                  </div>
                </div>

                {/* Return */}
                <div className="p-4 bg-accent/20 rounded-xl">
                  <p className="text-xs text-muted-foreground mb-3">Return Flight</p>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{tripData.flight.return.airline}</span>
                      <span className="text-sm text-muted-foreground">{tripData.flight.return.flightNumber}</span>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded-full">
                      {tripData.flight.return.status}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{tripData.flight.return.departure.time}</p>
                      <p className="text-sm text-muted-foreground">{tripData.flight.return.departure.airport}</p>
                    </div>
                    
                    <div className="flex-1 mx-6 relative">
                      <div className="h-px bg-gradient-to-r from-violet-500/50 via-violet-500 to-violet-500/50" />
                      <Plane className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 -rotate-90" />
                      <p className="text-xs text-center text-muted-foreground mt-2">{tripData.flight.return.duration}</p>
                    </div>
                    
                    <div className="text-center">
                      <p className="text-2xl font-bold text-foreground">{tripData.flight.return.arrival.time}</p>
                      <p className="text-sm text-muted-foreground">{tripData.flight.return.arrival.airport}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hotel Details */}
              <div className="bg-card/30 rounded-2xl border border-border/50 p-6">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2 mb-6">
                  <Hotel className="w-5 h-5 text-violet-400" />
                  Accommodation
                </h3>

                <div className="space-y-4">
                  <div className="p-4 bg-accent/20 rounded-xl">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-lg font-semibold text-foreground">{tripData.hotel.name}</h4>
                        <div className="flex items-center gap-1 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < Math.floor(tripData.hotel.rating) ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground'}`}
                            />
                          ))}
                          <span className="text-sm text-muted-foreground ml-2">{tripData.hotel.rating}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <MapPin className="w-4 h-4" />
                      {tripData.hotel.address}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Check-in</p>
                        <p className="font-medium text-foreground">{tripData.hotel.checkIn}</p>
                      </div>
                      <div className="p-3 bg-background/50 rounded-lg">
                        <p className="text-xs text-muted-foreground">Check-out</p>
                        <p className="font-medium text-foreground">{tripData.hotel.checkOut}</p>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="text-sm text-muted-foreground mb-2">Room: <span className="text-foreground">{tripData.hotel.roomType}</span></p>
                      <p className="text-sm text-muted-foreground">Duration: <span className="text-foreground">{tripData.hotel.nights} nights</span></p>
                    </div>
                  </div>

                  {/* Amenities */}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-3">Amenities</p>
                    <div className="flex flex-wrap gap-2">
                      {tripData.hotel.amenities.map((amenity, index) => (
                        <span 
                          key={index}
                          className="px-3 py-1 text-sm bg-violet-500/10 text-violet-300 rounded-full border border-violet-500/20"
                        >
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Helper component for star rating
const Star = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
