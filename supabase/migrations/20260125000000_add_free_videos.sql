-- migration: add 5 new free videos with diverse categories
-- description: inserts 5 new free videos covering yoga, mobility, and calisthenics
-- affected tables: videos
-- dependencies: 20260118121900_create_videos_table.sql
-- created: 2026-01-25

-- ============================================================================
-- insert 5 new free videos with different categories
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
-- yoga video
-- ============================================================================

(
  'Yoga dla Zdrowia Kręgosłupa - 20 min',
  'Specjalna sekwencja skupiona na wzmocnieniu i rozciągnięciu kręgosłupa. Pomaga w redukcji bólu pleców i poprawie postawy. Dla wszystkich poziomów zaawansowania.',
  'yoga',
  'intermediate',
  1200,
  'videos-free/spine-health-yoga.mp4',
  'thumbnails/spine-health-yoga.jpg',
  false,
  'published'
),

-- ============================================================================
-- mobility video
-- ============================================================================

(
  'Mobilność Bioder - 15 min',
  'Kompleksowa sesja mobilności skupiona na biodrach. Idealna dla osób siedzących przy biurku. Poprawia zakres ruchu i redukuje napięcie.',
  'mobility',
  'beginner',
  900,
  'videos-free/hip-mobility.mp4',
  'thumbnails/hip-mobility.jpg',
  false,
  'published'
),

-- ============================================================================
-- calisthenics video
-- ============================================================================

(
  'Trening Siłowy - Górna Część Ciała - 25 min',
  'Intensywny trening kalisteniki na górną część ciała. Pompki, podciągania, dipy. Wymaga podstawowej kondycji. Buduj siłę funkcjonalną.',
  'calisthenics',
  'intermediate',
  1500,
  'videos-free/upper-body-strength.mp4',
  'thumbnails/upper-body-strength.jpg',
  false,
  'published'
),

-- ============================================================================
-- mobility video
-- ============================================================================

(
  'Poranna Mobilność - 10 min',
  'Szybka poranna rutyna mobilności na rozbudzenie całego ciała. Łagodne ruchy dla stawów. Idealna na początek dnia, nawet dla początkujących.',
  'mobility',
  'beginner',
  600,
  'videos-free/morning-mobility.mp4',
  'thumbnails/morning-mobility.jpg',
  false,
  'published'
),

-- ============================================================================
-- yoga video
-- ============================================================================

(
  'Yoga Relaksacyjna - 12 min',
  'Spokojna praktyka jogi z elementami yin yoga. Głębokie rozciąganie i relaksacja. Doskonała na wieczór lub po intensywnym treningu.',
  'yoga',
  'beginner',
  720,
  'videos-free/relaxing-yoga.mp4',
  'thumbnails/relaxing-yoga.jpg',
  false,
  'published'
);
