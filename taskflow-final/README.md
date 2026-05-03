# TaskFlow — Team Task Manager

A full-stack task management web app with role-based access control (Admin/Member), Kanban board, and project collaboration.

## 🔗 Live Demo
> Add your deployed URL here after deployment

## 🔗 GitHub Repo
> Add your GitHub URL here

---

## 🚀 Features
- JWT Authentication (Signup / Login)
- Create & manage Projects with team members
- Kanban Board (To Do → In Progress → Review → Done)
- Task assignment, priority, due dates, comments
- Role-Based Access Control (Admin vs Member)
- Personal Dashboard with stats
- Overdue task tracking

## 🧰 Tech Stack
- **Frontend:** React 18, React Router v6, Axios
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas (Mongoose)
- **Auth:** JWT + bcryptjs
- **Deployment:** Railway / Google Colab + ngrok

---

## 💻 Run Locally

### 1. Install Node.js
Download from https://nodejs.org (LTS version)

### 2. Clone this repo
```
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow
```

### 3. Create backend/.env file
Copy `backend/.env.example` to `backend/.env` and fill in:
```
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=anyrandomsecretkey123
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### 4. Install packages (run each line separately in cmd)
```
cd backend
npm install
cd ../frontend
npm install
```

### 5. Run the app (2 separate cmd windows)

CMD Window 1:
```
cd backend
npm run dev
```

CMD Window 2:
```
cd frontend
npm start
```

Open http://localhost:3000 in your browser ✅

---

## ☁️ Deploy on Railway

1. Push code to GitHub (see below)
2. Go to https://railway.app → Login with GitHub
3. New Project → Deploy from GitHub repo → select taskflow
4. Add environment variables:
   - MONGODB_URI = your Atlas connection string
   - JWT_SECRET = any random string
   - NODE_ENV = production
   - PORT = 5000
5. Settings → Generate Domain → your app is live!

---

## 🐍 Deploy on Google Colab

1. Push code to GitHub first
2. Open `TaskFlow_Deploy.ipynb` in Google Colab
3. Fill in your MONGODB_URI, JWT_SECRET, GitHub username
4. Get free ngrok token from https://dashboard.ngrok.com
5. Run all cells one by one
6. Copy the public URL shown at the end

---

## 📤 Push to GitHub

```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

---

## 🔐 Role-Based Access

| Action | Admin | Member |
|--------|-------|--------|
| Create/edit project | ✅ | ❌ |
| Invite members | ✅ | ❌ |
| Assign tasks to others | ✅ | ❌ |
| Edit own tasks | ✅ | ✅ |
| Delete tasks | ✅ | ❌ |
| Add comments | ✅ | ✅ |

---

## 📁 Project Structure
```
taskflow/
├── backend/
│   ├── models/        (User, Project, Task)
│   ├── routes/        (auth, projects, tasks, users)
│   ├── middleware/    (auth.js)
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/     (Dashboard, Projects, Tasks...)
│       ├── components/(Layout)
│       └── context/   (AuthContext)
├── TaskFlow_Deploy.ipynb  ← Google Colab deploy
├── railway.toml           ← Railway deploy config
└── README.md
```
