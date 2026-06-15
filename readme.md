# 🍽️ Chef's Diary

> *Where recipes carry memories, and cooking tells stories.*

**Chef's Diary** is an AI-driven, emotionally-rich, and culturally-rooted recipe-sharing platform. Unlike traditional recipe apps, Chef's Diary merges culinary instructions with personal stories — letting chefs connect with their audience on a deeply human level. Powered by Groq AI, built for accessibility, and designed for community.

🌐 **Live App:** [chefs-diary-client.vercel.app](https://chefs-diary-client.vercel.app)
🔗 **API Server:** [chefs-diary-server.onrender.com](https://chefs-diary-server.onrender.com)

---

## ✨ Features

### 🧠 AI-Powered Cooking Intelligence
- **Groq AI Story Generator** — Stream a rich, emotional backstory for any recipe in real time using SSE
- **Ingredient Substitution Engine** — AI suggests smart swaps based on dietary needs or availability (JSON mode)
- **Sous Chef Chat Assistant** — A floating AI cooking companion on every recipe page, answering questions mid-cook
- **AI Story Prompts** — Guided prompts help users articulate the cultural and emotional meaning behind their dish
- **Multilingual Translation Module** — Instantly translates entire recipes (title, desc, ingredients, steps) into 6+ languages using AI JSON parsing.

### 📖 Emotional & Cultural Storytelling
- Every recipe includes an **Emotional Context** layer: mood, cultural origin, occasion, season, and a personal story
- **Dedication system** — Dedicate recipes to loved ones with a relationship tag and heartfelt message
- **Family Legacy tagging** — Mark recipes as heirlooms, track estimated generations, and preserve origin stories
- Mood-based recipe discovery (nostalgic, celebratory, comforting, adventurous, healing, romantic, spiritual, playful)

### 🎙️ Accessibility-First Voice Interface
- **VoiceFAB** — Global floating mic button available on every page
- **Voice Commands** — Navigate the entire app hands-free:
  - `"go home"` / `"open network"` / `"go to profile"` / `"open settings"`
  - `"next step"` / `"previous step"` / `"repeat"` / `"read step"` on recipe pages
- **VoiceStepNav** — Sticky, hands-free voice control panel for step-by-step cooking navigation with Text-to-Speech readback
- Built entirely on the native **Web Speech API** — no external dependency

### 👨‍🍳 Chef Profiles
- Custom **cover photo** and **avatar** upload via Cloudinary
- **User Dashboard & Activity Feed** — Keep track of your recent recipe interactions, new followers, and network updates
- **Skills & Endorsements** — Add culinary skills, get endorsed by other chefs
- **Portfolio & Recipes tabs** — Showcase work and published recipes
- **Follow / Unfollow** — Build your culinary network with follower/following modals
- **Public profile** via `/:username` (Vanity URLs)

### 🌐 Chef Network Feed
- Post updates, job listings, and collaboration requests
- Filter by type: **All / Posts / Jobs / Collabs**
- Like and delete posts; infinite scroll with load-more pagination
- Post types: update, question, job, collab, achievement, event, tip, resource

### 🔐 Authentication & Security
- JWT-based auth (register / login / protected routes)
- Zustand persistence with `UseAuthStore`
- Private route guards on all authenticated pages

### 💬 Comments System
- Nested comment threads on every recipe
- Add and delete comments (owner only)
- Real-time count updates via `commentCount` on Recipe model

### ❤️ Social Interactions
- **Like** recipes (toggle, live count)
- **Save** recipes to personal collection
- **Follow** other chefs, view follower/following lists
- **Suggestions** — discover new chefs to follow

### ⚙️ Profile Settings
- 5-tab settings panel: **Profile**, **Chef Info**, **Skills**, **Social Links**, **Password**
- Update display name, bio, location, specializations, and social handles
- Change password with current-password verification

### 📷 Media Management
- Recipe cover images, step media URLs, and media gallery — all via **Cloudinary**
- Avatar and cover photo upload from Chef Profile and Settings

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite), Tailwind CSS, React Router v6 |
| State Management | Zustand |
| HTTP Client | Axios (custom instance) |
| Icons | Lucide React |
| Date Handling | date-fns |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas + Mongoose |
| Authentication | JSON Web Tokens (JWT) |
| AI | Groq API (LLaMA 3) — SSE streaming + JSON mode |
| Media Storage | Cloudinary |
| Voice | Web Speech API (SpeechRecognition + SpeechSynthesis) |
| Deployment | Vercel (frontend) + Render (backend) |

---

## 📁 Project Structure

```
chefs-diary/
├── client/                          # React frontend (Vite)
│   ├── public/
│   ├── src/
│   │   ├── api/
│   │   │   ├── axiosInstance.js     # Base Axios instance
│   │   │   ├── recipe.api.js
│   │   │   ├── network.api.js
│   │   │   └── upload.api.js
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   └── Navbar.jsx
│   │   │   ├── recipe/
│   │   │   │   ├── RecipeCard.jsx
│   │   │   │   └── Comments.jsx
│   │   │   └── ui/
│   │   │       ├── AuthModal.jsx
│   │   │       ├── ImageUpload.jsx
│   │   │       ├── SkillsSection.jsx
│   │   │       ├── StreamingText.jsx
│   │   │       ├── Toast.jsx
│   │   │       ├── VoiceFAB.jsx
│   │   │       └── VoiceStepNav.jsx
│   │   ├── hooks/
│   │   │   ├── useGroqStream.js
│   │   │   ├── useToast.js
│   │   │   └── useVoice.js
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── RecipePage.jsx
│   │   │   ├── RecipeEditorPage.jsx
│   │   │   ├── ChefProfilePage.jsx
│   │   │   ├── SettingsPage.jsx
│   │   │   ├── NetworkFeedPage.jsx
│   │   │   └── CreatePostPage.jsx
│   │   ├── store/
│   │   │   ├── authStore.js         # UseAuthStore (capital U)
│   │   │   ├── useCommentStore.js
│   │   │   └── networkStore.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.local                   # VITE_API_URL=https://chefs-diary-server.onrender.com
│   └── vite.config.js
│
└── server/                          # Node/Express backend
    ├── models/
    │   ├── User.js
    │   ├── Recipe.js
    │   ├── Comment.js
    │   ├── Follow.js
    │   └── Post.js
    ├── routes/
    │   ├── auth.routes.js
    │   ├── recipe.routes.js
    │   ├── comments.js
    │   ├── user.routes.js
    │   ├── network.routes.js
    │   ├── follow.routes.js
    │   ├── upload.routes.js
    │   └── search.js
    ├── middleware/
    │   └── auth.middleware.js
    ├── .env
    └── server.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Groq API key ([console.groq.com](https://console.groq.com))
- Cloudinary account

### 1. Clone the repository
```bash
git clone https://github.com/your-username/chefs-diary.git
cd chefs-diary
```

### 2. Backend setup
```bash
cd server
npm install
```

Create `server/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
GROQ_API_KEY=your_groq_api_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
CLIENT_URL=http://localhost:5500
```

```bash
npm run dev
```

### 3. Frontend setup
```bash
cd client
npm install
```

Create `client/.env.local`:
```env
VITE_API_URL=http://localhost:5000
```

```bash
npm run dev
```

Frontend runs on `localhost:5500`, backend on `localhost:5000`.

---

## 🔌 API Overview

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login + receive JWT |

### Recipes
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/recipes` | Feed (paginated) |
| GET | `/api/recipes/:slug` | Single recipe by slug |
| POST | `/api/recipes` | Create recipe |
| PUT | `/api/recipes/:id` | Update recipe |
| DELETE | `/api/recipes/:id` | Delete recipe |
| POST | `/api/recipes/:id/like` | Toggle like |
| POST | `/api/recipes/:id/save` | Toggle save |

### Groq AI
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/story/stream` | Stream story generation (SSE) |
| POST | `/api/ai/substitutions` | Ingredient substitutions (JSON) |
| POST | `/api/ai/assistant/stream` | Sous Chef chat (streaming) |
| POST | `/api/ai/translate` | Translate recipe in-place |

### Search
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/search` | Search recipes (`?q=&cuisine=&difficulty=&mood=&sort=&page=`) |

### Users & Social
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users/me` | Current user |
| PUT | `/api/users/profile` | Update profile |
| PUT | `/api/users/password` | Change password |
| GET | `/api/users/:username` | Public profile |
| POST | `/api/users/:username/skills` | Add skill |
| POST | `/api/users/:username/skills/:skillId/endorse` | Endorse skill |
| POST | `/api/follow/:username` | Toggle follow |

### Network
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/network/feed` | Network posts feed |
| POST | `/api/network/posts` | Create post |
| DELETE | `/api/network/posts/:id` | Delete post |
| POST | `/api/network/posts/:id/like` | Toggle like |

### Comments
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/recipes/:recipeId/comments` | Fetch comments |
| POST | `/api/recipes/:recipeId/comments` | Add comment |
| DELETE | `/api/recipes/:recipeId/comments/:id` | Delete comment |

---

## 🗄️ Data Models

### Recipe (key fields)
```
title, description, slug, author (ref: User)
ingredients[]: { name, quantity, unit, notes, isOptional }
steps[]: { order, instruction, duration, technique, tips, isKeyStep }
emotionalContext: { story, mood, culturalOrigin, season, occasion }
dedication: { dedicatedTo, relationship, message }
familyLegacy: { isHeirloom, estimatedGeneration, originStory }
cuisineType[], dietaryTags[], tags[]
difficulty, prepTime, cookTime, totalTime, servings
likeCount, saveCount, commentCount, viewCount
status (draft/published), visibility (public/private)
```

### User (key fields)
```
username, email, password (hashed)
displayName, bio, avatar, coverPhoto
chefInfo: { specializations[], yearsOfExperience, signature dish }
skills[]: { name, endorsements[] }
socialLinks: { instagram, youtube, website }
followers[], following[]
```

---

## 🌍 Real-World Applications

Chef's Diary goes beyond simple recipe sharing. It is designed to serve multiple domains:
- **Cultural Heritage Preservation:** A digital archive for family recipes, regional dishes, and oral traditions that might otherwise be lost.
- **Culinary Education:** An interactive learning resource for students to explore global cuisines, cooking techniques, and food history.
- **Home Cooking Assistance:** Simplifies daily cooking with hands-free voice navigation, AI ingredient substitutions, and real-time guidance.
- **Food Blogging & Community Building:** Empowers creators to share their culinary journey, grow their audience, and build meaningful emotional connections with a global community.
- **Tourism & Cultural Promotion:** A platform for regional organizations to showcase local cuisines and support cultural tourism.

---

## 🔮 Future Scope (P3 Roadmap)

| Feature | Status |
|---|---|
| Search & Filters | ✅ Done |
| Rating System (1–5 stars) | ✅ Done |
| Social Share + OG Meta Tags | ✅ Done |
| Recipe Collections (saved lists) | ✅ Done |
| Multilingual Recipe Translation | ✅ Done |
| Mobile Application Development (React Native / Flutter) | ✅ Done |
| Advanced Recommendation System (ML-based) | 📋 Planned |
| Nutrition Analysis (Calorie, Protein, Carbs tracking) | 📋 Planned |
| Computer Vision Integration (Ingredient recognition) | 📋 Planned |
| Augmented Reality Cooking Assistant | 📋 Planned |
| Smart Kitchen Integration (IoT devices) | 📋 Planned |
| Enhanced Cultural Archive (Videos & historical records) | 📋 Planned |
| Blockchain-Based Recipe Ownership | 📋 Planned |
| Push Notifications | 📋 Planned |
| PWA / Offline Mode | 📋 Planned |
| Print-Friendly View (CSS) | 📋 Planned |

---

## 🏗️ Architecture Notes

- **Auth store:** `useAuthStore.js` exports `UseAuthStore` (capital U) as default — all imports must match exactly
- **Axios instance:** `src/api/axiosInstance.js` — all API calls use `/api/...` prefix
- **Comments layout:** Right-side sticky column on `RecipePage` via 2-column CSS grid
- **Groq streaming:** Uses SSE (`text/event-stream`) for story generation; JSON mode for substitutions
- **Voice Assistant Separation:** Voice navigation is decoupled from Sous Chef chat for cleaner UX.

---

## 👨‍💻 Developed By

| Name | Role |
|---|---|
| **Sarthak Pandey** | Full-Stack Developer |
| **Sunita Jatav** | Full-Stack Developer |

---

*Chef's Diary — Because every recipe has a story worth telling.*