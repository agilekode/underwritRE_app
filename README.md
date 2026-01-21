# underwritRE_app

This repository contains both the frontend and backend for the **underwritRE** application.

---

## 📁 Project Structure

<pre>
underwritre_app/
├── uw_frontend/         <b># React frontend</b>
│   ├── public/
│   ├── src/
│   │   ├── assets/         <i># Images, icons, etc.</i>
│   │   ├── components/     <i># Reusable UI components</i>
│   │   ├── pages/          <i># Route-based views (e.g., Dashboard, Login)</i>
│   │   ├── auth/           <i># Auth0 integration (hooks, providers)</i>
│   │   ├── api/            <i># JS/TS functions for calling Flask endpoints</i>
│   │   ├── utils/          <i># Helper functions</i>
│   │   ├── types/          <i># TypeScript type definitions</i>
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── .env                <i># Frontend environment variables (e.g., Auth0 keys)</i>
│   └── package.json
│
├── uw_backend/          <b># Flask backend</b>
│   ├── app/                <i># Application code</i>
│   │   ├── routes/         <i># Flask Blueprints (e.g., auth.py, payments.py)</i>
│   │   ├── models/         <i># ORM/data models (e.g., SQLAlchemy)</i>
│   │   ├── services/       <i># Business logic (e.g., Stripe, Auth0 wrappers)</i>
│   │   ├── utils/          <i># Helper functions/utilities</i>
│   │   ├── auth/           <i># Auth functions</i>
│   │   └── __init__.py     <i># Initializes Flask app</i>
│   ├── .env                <i># Backend environment variables</i>
│   ├── config.py           <i># Configuration for dev/prod</i>
│   ├── app.py              <i># App entry point</i>
│   └── requirements.txt
│
└── README.md
</pre>