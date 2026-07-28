# TikTok Shop US Dashboard

## 구조
- `backend/`: FastAPI 서버
- `frontend/`: React + Vite 앱
- `tiktok_shop_dashboard.html`: 초기 프로토타입 대시보드

## 실행 방법

### 1. 백엔드 실행
```bash
cd /Users/serena/Documents/Serena/Project/backend
/Users/serena/Documents/Serena/Project/.venv/bin/python -m pip install -r requirements.txt
/Users/serena/Documents/Serena/Project/.venv/bin/uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. 프론트엔드 실행
```bash
cd /Users/serena/Documents/Serena/Project/frontend
npm install
npm run dev
```

### 3. 사용 방법
- React 앱에서 Excel 파일 업로드
- `backend`가 업로드된 TikTok Shop Excel을 파싱하고, 대시보드 데이터를 돌려줍니다

## 노트
- `frontend/vite.config.js`는 `/api` 요청을 FastAPI로 프록시합니다.
- Excel 파일은 `backend` FastAPI `POST /api/upload-excel`로 전송됩니다.
