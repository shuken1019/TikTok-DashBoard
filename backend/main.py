from typing import Any

from fastapi import Body, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import store
from .utils import parse_tiktok_excel

app = FastAPI(title="TikTok Shop US Dashboard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/sample")
def get_sample_dashboard():
    return {
        "monthlyData": [
            {"month": "11월", "revenue": 14600, "adSpend": 5200, "totalCost": 10400, "profit": 4200},
            {"month": "12월", "revenue": 19200, "adSpend": 6700, "totalCost": 13500, "profit": 5700},
            {"month": "1월", "revenue": 21600, "adSpend": 7200, "totalCost": 14900, "profit": 6700},
            {"month": "2월", "revenue": 23600, "adSpend": 7900, "totalCost": 16700, "profit": 6900},
            {"month": "3월", "revenue": 25400, "adSpend": 8600, "totalCost": 17800, "profit": 7600},
            {"month": "4월", "revenue": 20500, "adSpend": 7100, "totalCost": 14300, "profit": 6200},
            {"month": "5월", "revenue": 18900, "adSpend": 6500, "totalCost": 13300, "profit": 5600},
            {"month": "6월", "revenue": 19800, "adSpend": 6800, "totalCost": 13650, "profit": 6150},
            {"month": "7월", "revenue": 20500, "adSpend": 7000, "totalCost": 13800, "profit": 6700},
        ],
        "forecastData": {
            "q3": {"revenue": 72000, "adSpend": 21000, "profit": 18400},
            "q4": {"revenue": 84000, "adSpend": 24500, "profit": 22800},
        },
        # Keep the sample endpoint aligned with the editable dashboard resource.
        "costItems": store.load("costItems"),
        "productCosts": store.load("productCosts"),
    }


@app.post("/api/upload-excel")
async def upload_excel(file: UploadFile = File(...)):
    if not file.filename.lower().endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="엑셀 파일(.xls, .xlsx)만 업로드 가능합니다.")

    content = await file.read()
    try:
        parsed = parse_tiktok_excel(content)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"엑셀 처리 중 오류가 발생했습니다: {exc}")

    store.save("monthly", parsed["monthlyData"])
    store.save("forecast", parsed["forecastData"])
    store.save("costItems", parsed["costItems"])
    store.save("productCosts", parsed["productCosts"])

    return JSONResponse(parsed)


@app.get("/api/data/{resource}")
def get_resource_data(resource: str):
    if not store.is_valid_resource(resource):
        raise HTTPException(status_code=404, detail=f"알 수 없는 데이터 종류입니다: {resource}")
    return store.load(resource)


@app.put("/api/data/{resource}")
def put_resource_data(resource: str, payload: Any = Body(...)):
    if not store.is_valid_resource(resource):
        raise HTTPException(status_code=404, detail=f"알 수 없는 데이터 종류입니다: {resource}")
    try:
        return store.save(resource, payload)
    except TypeError as exc:
        raise HTTPException(status_code=422, detail=str(exc))


@app.post("/api/data/{resource}/reset")
def reset_resource_data(resource: str):
    if not store.is_valid_resource(resource):
        raise HTTPException(status_code=404, detail=f"알 수 없는 데이터 종류입니다: {resource}")
    return store.reset(resource)
