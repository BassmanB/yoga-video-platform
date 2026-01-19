-- migration: seed sample video data for testing and development
-- description: inserts sample videos covering different categories, levels, and access tiers
-- affected tables: videos
-- dependencies: 20260118121900_create_videos_table.sql
-- note: this is optional seed data for development/testing purposes

-- ============================================================================
-- insert sample video data
-- ============================================================================

insert into videos (
  title, 
  description, 
  category, 
  level, 
  duration, 
  video_url, 
  thumbnail_url, 
  is_premium,
  status
) values 

-- ============================================================================
-- free content (accessible to all users)
-- ============================================================================

(
  'Poranna Yoga Flow - 15 min',
  'Łagodna praktyka poranna na rozbudzenie ciała. Idealna dla początkujących. Skupiamy się na podstawowych pozycjach i świadomym oddechu.',
  'yoga',
  'beginner',
  900,
  'videos-free/morning-yoga-flow.mp4',
  'thumbnails/morning-yoga-flow.jpg',
  false,
  'published'
),

(
  'Kalistenika dla Początkujących - 10 min',
  'Wprowadzenie do kalisteniki. Podstawowe ćwiczenia z wagą własnego ciała. Dowiesz się jak prawidłowo wykonywać pompki, przysiady i deski.',
  'calisthenics',
  'beginner',
  600,
  'videos-free/calisthenics-intro.mp4',
  'thumbnails/calisthenics-intro.jpg',
  false,
  'published'
),

-- ============================================================================
-- premium content (requires premium or admin role)
-- ============================================================================

(
  'Zaawansowana Mobilność - 20 min',
  'Intensywna sesja mobilności dla zaawansowanych. Wymaga doświadczenia. Praca nad głęboką mobilnością stawów i elastycznością.',
  'mobility',
  'advanced',
  1200,
  'videos-premium/advanced-mobility.mp4',
  'thumbnails/advanced-mobility.jpg',
  true,
  'published'
),

(
  'Power Yoga Flow - 30 min',
  'Dynamiczna praktyka power yoga. Wzmacnianie całego ciała przez płynne sekwencje. Dla osób z doświadczeniem w jodze.',
  'yoga',
  'intermediate',
  1800,
  'videos-premium/power-yoga-flow.mp4',
  'thumbnails/power-yoga-flow.jpg',
  true,
  'published'
),

-- ============================================================================
-- draft content (only visible to admins)
-- ============================================================================

(
  'Wieczorna Yoga - 15 min',
  'Relaksująca praktyka wieczorna. Nadal w fazie edycji.',
  'yoga',
  'beginner',
  900,
  'videos-free/evening-yoga.mp4',
  'thumbnails/evening-yoga.jpg',
  false,
  'draft'
);
