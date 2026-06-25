# PDF vs Localhost Comparison Pack

Generated: **2026-06-25 07:56 UTC**

Side-by-side captures: **PDF (left)** · **localhost (right)** with red alignment guides.

## Contents

### Reference PDFs (`PDFs/`)
- `1.Home_01.05.2025.pdf` — Home & News module (7 pages)
- `2.SongsAll_Detailpg_01.05.2025.pdf` — Songs module (3 pages)
- `3.Poems_01.05.2025.pdf` — Poems module (4 pages)
- `4.Reflection_01.05.2025.pdf` — Reflections module (4 pages)
- `5.People_01.05.2025.pdf` — People module (3 pages)
- `6.FilmMain+Detail_01.05.2025.pdf` — Films module (4 pages)
- `7.About_01.05.2025.pdf` — About module (5 pages)
- `8.Glossary_01.05.2025.pdf` — Glossary module (1 page)
- `9.Radio_01.05.2025.pdf` — Radio module (2 pages)

### Home screens (`Home/`)

| Folder | Route | File |
|--------|-------|------|
| `1_Home` | `/` | `comparison_home_full.png` |
| `3_Ajab_News` | `/ajab-news` | `comparison_ajab_news_full.png` |
| `4_Search_Typeahead_Lorem` | `/` | `comparison_search_typeahead_lorem_full.png` |
| `5_Search_Typeahead_Farid` | `/` | `comparison_search_typeahead_farid_full.png` |
| `6_Search_Results` | `/searche?search=farid` | `comparison_search_results_full.png` |
| `7_Search_No_Results` | `/searche?search=zzzznomatch999xyz` | `comparison_search_no_results_full.png` |

### Songs screens (`Songs/`)

| Folder | Route | File |
|--------|-------|------|
| `1_Songs_Listing` | `/songs` | `comparison_songs_listing_full.png` |
| `2_Filter_Panel` | `/songs` | `comparison_filter_panel_full.png` |
| `3_Song_Details` | `/songs/details/260` | `comparison_song_detail_full.png` |
| `3_Song_Details` | `/songs/details (video zone crop)` | `comparison_song_detail_video_zone.png` |

### Poems screens (`Poems/`)

| Folder | Route | File |
|--------|-------|------|
| `1_Poems_Listing` | `/poems` | `comparison_poems_listing_full.png` |
| `2_Filter_Panel` | `/poems` | `comparison_poems_filter_full.png` |
| `3_Glossary` | `/poems` | `comparison_poems_glossary_full.png` |
| `4_Poems_Scroll` | `/poems` | `comparison_poems_scroll_full.png` |

### Reflections screens (`Reflections/`)

| Folder | Route | File |
|--------|-------|------|
| `1_Reflections_Listing` | `/reflections` | `comparison_reflections_listing_full.png` |
| `2_Filter_Panel` | `/reflections` | `comparison_reflections_filter_full.png` |
| `3_Reflection_Detail` | `/reflections` | `comparison_reflection_detail_full.png` |
| `4_Reflection_Detail_Scroll` | `/reflections/details/3` | `comparison_reflection_detail_scroll_full.png` |

### People screens (`People/`)

| Folder | Route | File |
|--------|-------|------|
| `1_People_Listing` | `/people` | `comparison_people_listing_full.png` |
| `2_Filter_Panel` | `/people` | `comparison_people_filter_full.png` |
| `3_Person_Detail` | `/people/94` | `comparison_people_detail_full.png` |

### Films screens (`Films/`)

| Folder | Route | File |
|--------|-------|------|
| `1_Films_Listing` | `/films` | `comparison_films_listing_full.png` |
| `2_Film_Detail` | `/films/details/13` | `comparison_film_detail_full.png` |
| `3_Film_Episodes` | `/films/details/13` | `comparison_film_episodes_full.png` |
| `4_Film_Detail_Scroll` | `/films/details/13` | `comparison_film_detail_scroll_full.png` |

### About screens (`About/`)

| Folder | Route | File |
|--------|-------|------|
| `1_Intro` | `/about?menu=intro` | `comparison_about_intro_full.png` |
| `2_Kabir_Intro` | `/about?tab=kabir&menu=intro` | `comparison_about_kabir_intro_full.png` |
| `3_Team` | `/about?tab=kabir&menu=team` | `comparison_about_team_full.png` |
| `4_Films` | `/about?tab=kabir&menu=films` | `comparison_about_films_full.png` |
| `5_Books` | `/about?tab=kabir&menu=books` | `comparison_about_books_full.png` |

### Glossary screens (`Glossary/`)

| Folder | Route | File |
|--------|-------|------|
| `1_Glossary` | `/glossary` | `comparison_glossary_full.png` |

### Radio screens (`Radio/`)

| Folder | Route | File |
|--------|-------|------|
| `1_Radio` | `/radio` | `comparison_radio_full.png` |
| `2_Radio_Viewport` | `/radio?view=playlists` | `comparison_radio_viewport_full.png` |

## Regenerate

```powershell
$env:PLAYWRIGHT_BASE_URL="http://127.0.0.1:3000"
npx next dev -p 3000
python scripts/build_comparison_out.py
```

Open `index.html` in a browser for a quick visual index.
